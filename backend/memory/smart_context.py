from __future__ import annotations

import json
import logging
import time
from dataclasses import dataclass, field
from functools import lru_cache
from typing import (
    Any,
    Awaitable,
    Callable,
    Iterable,
    Literal,
    Optional,
    Sequence,
    TypedDict,
)

import tiktoken
from motor.motor_asyncio import AsyncIOMotorCollection, AsyncIOMotorDatabase
from prometheus_client import Counter, Histogram
from redis.asyncio import Redis

logger = logging.getLogger("smart_context")
logger.setLevel(logging.INFO)

# ──────────────────────────────
# Prometheus metrics
# ──────────────────────────────
PROM_TOKENS_RETURNED = Counter(
    "smart_context_tokens_total",
    "Total amount of tokens returned by SmartContext",
    labelnames=("model",),
)

PROM_REQUEST_DURATION = Histogram(
    "smart_context_duration_seconds",
    "Latency of SmartContext.get_context",
    labelnames=("model",),
)

PROM_HISTORY_LENGTH = Histogram(
    "smart_context_messages_returned",
    "Number of messages returned in SmartContext context",
    labelnames=("model",),
    buckets=(1, 4, 8, 16, 32, 64, 96, 128),
)


ChatRole = Literal["system", "user", "assistant"]


class ChatMessage(TypedDict, total=False):
    """Единый формат сообщений, возвращаемых SmartContext."""
    role: ChatRole
    content: str
    timestamp: float
    importance: float
    metadata: dict[str, Any]


SummarizerCallable = Callable[[Sequence[ChatMessage]], Awaitable[str]]


_encoding_cache: dict[str, tiktoken.Encoding] = {}


def _resolve_encoding(name: str) -> tiktoken.Encoding:
    encoding = _encoding_cache.get(name)
    if encoding is None:
        encoding = tiktoken.get_encoding(name)
        _encoding_cache[name] = encoding
    return encoding


@dataclass(slots=True)
class _MessageEnvelope:
    """Вспомогательная обёртка сообщения с предрасчитанными токенами."""
    message: ChatMessage
    tokens: int


@dataclass(slots=True)
class SmartContext:
    """
    Производительный менеджер контекста для LLM.

    Основные возможности:
    * асинхронный доступ к MongoDB (Motor) с оптимизированной выборкой;
    * Redis-кэширование готовых контекстов (TTL, JSON-сериализация);
    * LRU-кэш подсчёта токенов;
    * AI-суммаризация старых сообщений и приоритизация важных реплик;
    * Прометеевские метрики и агрегирование статистики в Redis;
    * Полное логирование и graceful degradation.

    Пример использования с FastAPI:
        ```python
        from fastapi import Depends, FastAPI
        from redis.asyncio import Redis
        from motor.motor_asyncio import AsyncIOMotorClient

        app = FastAPI()

        redis = Redis.from_url("redis://localhost:6379/0")
        mongo = AsyncIOMotorClient("mongodb://localhost:27017")
        db = mongo["chat-db"]

        smart_context = SmartContext(redis_client=redis)

        @app.on_event("startup")
        async def startup() -> None:
            await smart_context.ensure_indexes(db)

        @app.get("/context/{session_id}")
        async def get_context(session_id: str) -> list[ChatMessage]:
            return await smart_context.get_context(session_id, db)
        ```
    """

    model_name: str = "gpt-4o"
    max_tokens: int = 6000
    min_messages: int = 6
    summary_tokens_ratio: float = 0.25
    summary_chunk_size: int = 10
    session_cache_ttl: int = 300
    redis_client: Optional[Redis] = None
    summarizer: Optional[SummarizerCallable] = None
    pinned_threshold: float = 0.7
    db_batch_size: int = 100
    db_fetch_limit: int = 400
    collection_name: str = "chat_messages"

    encoding: tiktoken.Encoding = field(init=False, repr=False)
    encoding_name: str = field(init=False, repr=False)

    def __post_init__(self) -> None:
        try:
            self.encoding = tiktoken.encoding_for_model(self.model_name)
        except KeyError:
            logger.warning(
                "Модель %s не найдена в tiktoken, используем cl100k_base",
                self.model_name,
            )
            self.encoding = tiktoken.get_encoding("cl100k_base")
        self.encoding_name = self.encoding.name
        _encoding_cache[self.encoding_name] = self.encoding

    # ──────────────────────────────
    # Публичный API
    # ──────────────────────────────

    async def get_context(
        self,
        session_id: str,
        db: AsyncIOMotorDatabase,
    ) -> list[ChatMessage]:
        """
        Вернуть оптимальный контекст для заданной сессии.

        Parameters
        ----------
        session_id:
            Идентификатор диалога.
        db:
            Экземпляр асинхронной БД (Motor).

        Returns
        -------
        list[ChatMessage]
            Список сообщений (суммаризации + оригиналы), уложенных в `max_tokens`.
        """
        if not session_id:
            raise ValueError("session_id не может быть пустым")

        start_time = time.perf_counter()
        cache_key = self._build_cache_key(session_id)

        cached = await self._try_load_from_cache(cache_key)
        if cached is not None:
            await self._record_metrics(
                tokens=sum(self.count_tokens(msg["content"]) for msg in cached),
                duration=time.perf_counter() - start_time,
                returned=len(cached),
                session_id=session_id,
            )
            return cached

        try:
            raw_messages = await self._fetch_messages(session_id, db)
        except Exception as exc:  # noqa: BLE001
            logger.exception("Ошибка при загрузке сообщений %s: %s", session_id, exc)
            return []

        if not raw_messages:
            await self._record_metrics(0, time.perf_counter() - start_time, 0, session_id)
            return []

        try:
            context, token_count = await self._build_context(raw_messages)
        except Exception as exc:  # noqa: BLE001
            logger.exception("Ошибка при формировании контекста %s", session_id)
            # graceful degradation: берём последние сообщения без обработки
            context = self._fallback_recent_history(raw_messages)
            token_count = sum(self.count_tokens(msg["content"]) for msg in context)

        await self._store_in_cache(cache_key, context)

        await self._record_metrics(
            tokens=token_count,
            duration=time.perf_counter() - start_time,
            returned=len(context),
            session_id=session_id,
        )
        return context

    async def ensure_indexes(self, db: AsyncIOMotorDatabase) -> None:
        """
        Создать рекомендуемые индексы MongoDB.

        * session_id + timestamp: ускоряет сортировку истории.
        * session_id + importance: для выборки важных сообщений.
        """
        collection = db.get_collection(self.collection_name)
        try:
            await collection.create_index(
                [("session_id", 1), ("timestamp", 1)],
                name="session_timestamp_idx",
            )
            await collection.create_index(
                [("session_id", 1), ("importance", -1), ("timestamp", 1)],
                name="session_importance_idx",
            )
        except Exception as exc:  # noqa: BLE001
            logger.exception("Не удалось создать индексы: %s", exc)

    async def invalidate_session(self, session_id: str) -> None:
        """Сбросить кэш контекста и метрик для конкретной сессии."""
        if not self.redis_client:
            return
        cache_key = self._build_cache_key(session_id)
        metrics_key = self._build_metrics_key(session_id)
        try:
            await self.redis_client.delete(cache_key, metrics_key)
        except Exception as exc:  # noqa: BLE001
            logger.warning("Не удалось удалить ключи Redis для %s: %s", session_id, exc)

    # ──────────────────────────────
    # Подсчёт токенов (LRU)
    # ──────────────────────────────

    def count_tokens(self, text: str) -> int:
        """Подсчитать токены с учётом LRU-кэша."""
        if not text:
            return 0
        return self._count_tokens_cached(self.encoding_name, text)

    @staticmethod
    @lru_cache(maxsize=8192)
    def _count_tokens_cached(encoding_name: str, text: str) -> int:
        encoding = _resolve_encoding(encoding_name)
        return len(encoding.encode(text))

    # ──────────────────────────────
    # Работа с MongoDB
    # ──────────────────────────────

    async def _fetch_messages(
        self,
        session_id: str,
        db: AsyncIOMotorDatabase,
    ) -> list[dict[str, Any]]:
        collection: AsyncIOMotorCollection = db.get_collection(self.collection_name)
        pipeline = [
            {"$match": {"session_id": session_id}},
            {"$sort": {"timestamp": 1}},
            {
                "$project": {
                    "_id": 0,
                    "session_id": 0,
                    # оставляем только нужные поля
                    "timestamp": 1,
                    "importance": {"$ifNull": ["$importance", 0.0]},
                    "tags": 1,
                    "user_message": 1,
                    "ai_response": 1,
                    "messages": 1,
                    "metadata": 1,
                }
            },
            {"$limit": self.db_fetch_limit},
        ]
        cursor = collection.aggregate(pipeline, batchSize=self.db_batch_size)
        return await cursor.to_list(length=self.db_fetch_limit)

    # ──────────────────────────────
    # Построение контекста
    # ──────────────────────────────

    async def _build_context(
        self,
        message_docs: Sequence[dict[str, Any]],
    ) -> tuple[list[ChatMessage], int]:
        timeline = self._normalize_messages(message_docs)
        if not timeline:
            return [], 0

        envelopes = [
            _MessageEnvelope(message=msg, tokens=self.count_tokens(msg["content"]))
            for msg in timeline
        ]

        min_count = min(self.min_messages, len(envelopes))
        recent = envelopes[-min_count:]
        earlier = envelopes[:-min_count]

        pinned = [env for env in earlier if env.message.get("importance", 0.0) >= self.pinned_threshold]
        summarizable = [env for env in earlier if env not in pinned]

        summary_budget = int(self.max_tokens * self.summary_tokens_ratio)
        summaries = await self._summaries_for(summarizable, summary_budget)

        recent_tokens = sum(env.tokens for env in recent)
        if recent_tokens > self.max_tokens:
            trimmed, tokens_used = self._trim_to_budget(recent, self.max_tokens)
            return [env.message for env in trimmed], tokens_used

        budget_left = self.max_tokens - recent_tokens

        pinned_kept, pinned_tokens = self._trim_to_budget(pinned, budget_left)
        budget_left -= pinned_tokens

        summary_kept, summary_tokens = self._trim_to_budget(summaries, budget_left)

        final_envelopes = summary_kept + pinned_kept + recent
        total_tokens = summary_tokens + pinned_tokens + recent_tokens
        return [env.message for env in final_envelopes], total_tokens

    def _normalize_messages(
        self,
        docs: Sequence[dict[str, Any]],
    ) -> list[ChatMessage]:
        messages: list[ChatMessage] = []
        for doc in docs:
            timestamp = float(doc.get("timestamp", 0.0))
            importance = float(doc.get("importance", 0.0))
            metadata = doc.get("metadata") or {}
            tags = doc.get("tags") or []

            if "messages" in doc and isinstance(doc["messages"], list):
                for item in doc["messages"]:
                    role = item.get("role")
                    content = item.get("content")
                    if role and content:
                        messages.append(
                            ChatMessage(
                                role=role,
                                content=content,
                                timestamp=float(item.get("timestamp", timestamp)),
                                importance=float(item.get("importance", importance)),
                                metadata=item.get("metadata", metadata),
                            )
                        )
                continue

            user_content = doc.get("user_message")
            if user_content:
                messages.append(
                    ChatMessage(
                        role="user",
                        content=user_content,
                        timestamp=timestamp,
                        importance=importance,
                        metadata={"tags": tags, **metadata.get("user", {})},
                    )
                )

            ai_content = doc.get("ai_response")
            if ai_content:
                messages.append(
                    ChatMessage(
                        role="assistant",
                        content=ai_content,
                        timestamp=timestamp,
                        importance=importance,
                        metadata={"tags": tags, **metadata.get("assistant", {})},
                    )
                )

        messages.sort(key=lambda msg: msg.get("timestamp", 0.0))
        return messages

    async def _summaries_for(
        self,
        envelopes: Sequence[_MessageEnvelope],
        budget: int,
    ) -> list[_MessageEnvelope]:
        if not envelopes or budget <= 0:
            return []

        summaries: list[_MessageEnvelope] = []
        for chunk in self._chunk(envelopes, self.summary_chunk_size):
            try:
                summary_text = await self._summarize_chunk([env.message for env in chunk])
            except Exception as exc:  # noqa: BLE001
                logger.exception("Суммаризация не удалась, используем fallback: %s", exc)
                summary_text = self._fallback_summary([env.message for env in chunk])

            if not summary_text:
                continue

            summary_message = ChatMessage(
                role="system",
                content=summary_text,
                importance=max(env.message.get("importance", 0.0) for env in chunk),
                metadata={
                    "compression": "ai_summarization",
                    "original_messages": len(chunk),
                },
            )
            tokens = self.count_tokens(summary_text)
            if tokens > budget:
                # если суммаризация сама слишком большая — пропускаем
                continue
            budget -= tokens
            summaries.append(_MessageEnvelope(summary_message, tokens))
            if budget <= 0:
                break

        return summaries

    async def _summarize_chunk(self, chunk: Sequence[ChatMessage]) -> str:
        if self.summarizer is not None:
            return await self.summarizer(chunk)
        return self._fallback_summary(chunk)

    @staticmethod
    def _fallback_summary(chunk: Sequence[ChatMessage]) -> str:
        parts = [
            f"{msg['role']}: {msg['content'][:160]}"
            for msg in chunk
        ]
        summary = " | ".join(parts)
        return f"Сводка прошлых сообщений: {summary}"

    @staticmethod
    def _chunk(
        envelopes: Sequence[_MessageEnvelope],
        size: int,
    ) -> Iterable[Sequence[_MessageEnvelope]]:
        for idx in range(0, len(envelopes), size):
            yield envelopes[idx : idx + size]

    def _trim_to_budget(
        self,
        envelopes: Sequence[_MessageEnvelope],
        budget: int,
    ) -> tuple[list[_MessageEnvelope], int]:
        kept: list[_MessageEnvelope] = []
        consumed = 0
        for env in envelopes:
            if env.tokens > budget:
                continue
            kept.append(env)
            budget -= env.tokens
            consumed += env.tokens
            if budget <= 0:
                break
        return kept, consumed

    def _fallback_recent_history(self, docs: Sequence[dict[str, Any]]) -> list[ChatMessage]:
        timeline = self._normalize_messages(docs)
        envelopes = [
            _MessageEnvelope(message=msg, tokens=self.count_tokens(msg["content"]))
            for msg in timeline
        ]
        trimmed, _ = self._trim_to_budget(envelopes[::-1], self.max_tokens)
        # возвращаем в хронологическом порядке
        return [env.message for env in reversed(trimmed)]

    # ──────────────────────────────
    # Redis cache helpers
    # ──────────────────────────────

    def _build_cache_key(self, session_id: str) -> str:
        return f"smartctx:{self.model_name}:{session_id}:{self.max_tokens}"

    def _build_metrics_key(self, session_id: str) -> str:
        return f"smartctx:metrics:{session_id}"

    async def _try_load_from_cache(self, cache_key: str) -> Optional[list[ChatMessage]]:
        if not self.redis_client:
            return None
        try:
            cached = await self.redis_client.get(cache_key)
            if cached is None:
                return None
            data = json.loads(cached)
            return [ChatMessage(**msg) for msg in data]
        except Exception as exc:  # noqa: BLE001
            logger.warning("Не удалось прочитать кэш Redis: %s", exc)
            return None

    async def _store_in_cache(
        self,
        cache_key: str,
        context: Sequence[ChatMessage],
    ) -> None:
        if not self.redis_client:
            return
        try:
            payload = json.dumps(context, ensure_ascii=False)
            await self.redis_client.set(cache_key, payload, ex=self.session_cache_ttl)
        except Exception as exc:  # noqa: BLE001
            logger.debug("Сохранение контекста в Redis провалилось: %s", exc)

    # ──────────────────────────────
    # Метрики
    # ──────────────────────────────

    async def _record_metrics(
        self,
        tokens: int,
        duration: float,
        returned: int,
        session_id: str
    ) -> None:
        PROM_TOKENS_RETURNED.labels(model=self.model_name).inc(tokens)
        PROM_REQUEST_DURATION.labels(model=self.model_name).observe(duration)
        PROM_HISTORY_LENGTH.labels(model=self.model_name).observe(returned)

        if not self.redis_client:
            return

        metrics_key = self._build_metrics_key(session_id)
        try:
            pipe = self.redis_client.pipeline()
            pipe.hincrby(metrics_key, "requests", 1)
            pipe.hincrby(metrics_key, "tokens", tokens)
            pipe.hset(metrics_key, mapping={
                "last_duration_ms": int(duration * 1000),
                "last_messages": returned,
                "model": self.model_name,
            })
            pipe.expire(metrics_key, self.session_cache_ttl)
            await pipe.execute()
        except Exception as exc:  # noqa: BLE001
            logger.debug("Не удалось записать метрики в Redis: %s", exc)

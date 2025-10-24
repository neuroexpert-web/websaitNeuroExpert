# intent_checker.py
import os
import re
import time
import json
import asyncio
import logging
from typing import Dict, Optional, Any
from pydantic import BaseModel, Field
import cachetools

# Для сетевых запросов (YandexGPT API)
import aiohttp

logger = logging.getLogger(__name__)

# ================== Старый класс (Rule-based) ================== #
# (Не изменяем, чтобы не ломать обратную совместимость)

class IntentChecker:
    """Простая проверка релевантности вопроса (старый класс)."""

    RELEVANT_KEYWORDS = [
        # Услуги
        'аудит', 'анализ', 'проверка', 'диагностика',
        'сайт', 'приложение', 'разработка', 'создание',
        'ai', 'ии', 'искусственный интеллект', 'бот', 'ассистент', 'чатбот',
        'поддержка', 'сопровождение', 'обслуживание',
        'автоматизация', 'цифровизация', 'digital',
        # Бизнес
        'бизнес', 'компания', 'продажи', 'клиенты', 'прибыль',
        'рост', 'конверсия', 'roi', 'окупаемость',
        # Действия
        'цена', 'стоимость', 'сколько', 'заказать', 'купить',
        'консультация', 'договор', 'работа', 'сроки'
    ]

    IRRELEVANT_KEYWORDS = [
        'погода', 'новости', 'спорт', 'политика', 'футбол',
        'рецепт', 'готовить', 'кино', 'фильм', 'музыка',
        'здоровье', 'лечение', 'болезнь', 'врач'
    ]

    def is_relevant(self, message: str) -> bool:
        """
        Проверка релевантности вопроса.
        Возвращает True, если вопрос связан с услугами.
        """
        message_lower = message.lower()

        # Проверка на явно нерелевантные темы
        if any(keyword in message_lower for keyword in self.IRRELEVANT_KEYWORDS):
            return False

        # Проверка на релевантные темы
        if any(keyword in message_lower for keyword in self.RELEVANT_KEYWORDS):
            return True

        # Короткие вопросы ("привет", "да", "спасибо") — считаем релевантными
        if len(message.split()) <= 3:
            return True

        # По умолчанию считаем релевантным (чтобы не терять клиентов)
        return True

# Глобальный старый экземпляр (по-прежнему может использоваться напрямую)
old_intent_checker = IntentChecker()

# ================== Типы намерений ================== #

INTENT_TYPES = {
    # Бизнес (высокий приоритет)
    'ORDER': 'Заказ услуги',
    'PRICE_INQUIRY': 'Запрос цены',
    'CONSULTATION': 'Консультация',

    # Информационные
    'INFO_SERVICES': 'Информация об услугах',
    'INFO_COMPANY': 'О компании',
    'INFO_TECH': 'Технические вопросы',

    # AI/IT специфичные
    'AI_AUDIT': 'Аудит AI',
    'AUTOMATION': 'Автоматизация',
    'CHATBOT_DEV': 'Разработка чат-ботов',
    'WEBSITE_DEV': 'Разработка сайтов',

    # Вспомогательные
    'GREETING': 'Приветствие',
    'CLARIFICATION': 'Уточнение',
    'SMALL_TALK': 'Беседа',
    'OFF_TOPIC': 'Не по теме',
    'SPAM': 'Спам'
    # при необходимости можно дополнить
}

# ================== Конфигурация YandexGPT ================== #
YAGPT_CONFIG = {
    'api_key': os.getenv('YANDEX_API_KEY'),
    'folder_id': os.getenv('YANDEX_FOLDER_ID'),
    'model': 'yandexgpt/latest',
    'temperature': 0.2,
    'max_tokens': 300
}

# ================== Промпт для классификации ================== #
PROMPT_TEMPLATE = """
Проанализируй сообщение пользователя для IT-компании (AI, разработка, автоматизация).

СООБЩЕНИЕ: "{message}"

Определи:
1. Основное намерение из: {intent_list}
2. Уверенность (0-100%)
3. Сущности: услуга, технология, бюджет, сроки
4. Релевантность (true/false)

JSON ответ:
{{
  "intent": "название",
  "confidence": 95,
  "entities": {{"service": "", "budget": "", "timeframe": ""}},
  "is_relevant": true
}}
"""

# ================== Результат классификации ================== #

class IntentResult(BaseModel):
    """Результат классификации намерений."""
    primary_intent: str = Field(..., description="Основное намерение")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Уверенность (0-1)")
    entities: Dict[str, Any] = Field(default_factory=dict, description="Извлечённые сущности")
    is_relevant: bool = Field(..., description="Релевантность для бизнеса")


# ================== AI-классификатор ================== #

class AIIntentClassifier:
    """
    AI-классификация на YandexGPT.
    Работает в асинхронном режиме, возвращает IntentResult.
    """

    def __init__(self, config: Dict[str, Any] = None) -> None:
        self.config = config or YAGPT_CONFIG

    async def classify(
        self,
        message: str,
        context: Optional[Dict] = None
    ) -> IntentResult:
        """
        Возвращает результат:
        - primary_intent: str
        - confidence: float
        - entities: Dict[str, Any]
        - is_relevant: bool
        """
        prompt = self._build_prompt(message)
        response_data = await self._call_api_with_retry(prompt)

        # Парсим результат из JSON
        parsed = self._parse_response(response_data, message=message)
        return parsed

    def _build_prompt(self, message: str) -> str:
        intent_list = ", ".join(list(INTENT_TYPES.keys()))
        return PROMPT_TEMPLATE.format(
            message=message,
            intent_list=intent_list
        )

    async def _call_api_with_retry(self, prompt: str, attempts: int = 2) -> str:
        """
        Вызов YandexGPT с повтором при неудаче (до 2 попыток).
        Ограничиваем общее время, чтобы уложиться ≤ 300 мс (зависит от сети).
        """
        # Суммарный таймаут на все попытки, например 0.3 секунды
        # (можно тонко настраивать)
        start_time = time.perf_counter()

        for attempt in range(1, attempts + 1):
            try:
                timeout_left = 0.3 - (time.perf_counter() - start_time)
                if timeout_left <= 0:
                    raise asyncio.TimeoutError("Превышен 300мс таймаут")

                async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=timeout_left)) as session:
                    data = {
                        "folder_id": self.config['folder_id'],
                        "prompt": prompt,
                        "model": self.config['model'],
                        "temperature": self.config['temperature'],
                        "max_tokens": self.config['max_tokens']
                    }
                    headers = {
                        "Authorization": f"Api-Key {self.config['api_key']}",
                        "Content-Type": "application/json"
                    }
                    url = "https://yandex-cloud-ml.yandex.net/ai/text/generate"  # Примерный эндпоинт
                    async with session.post(url, json=data, headers=headers) as resp:
                        if resp.status == 200:
                            raw_text = await resp.text()
                            return raw_text
                        else:
                            logger.warning(f"[Attempt {attempt}] YandexGPT Error: {resp.status}")
            except (asyncio.TimeoutError, aiohttp.ClientError) as e:
                logger.warning(f"[Attempt {attempt}] Ошибка при вызове YandexGPT: {e}")

        # Если все попытки неудачны — бросаем исключение
        raise RuntimeError("Не удалось получить ответ от YandexGPT")

    def _parse_response(self, raw_response: str, message: str) -> IntentResult:
        """
        Парсит ответ в формате JSON. В случае ошибки возвращает OFF_TOPIC.
        """
        try:
            # Предполагаем, что в raw_response пришёл JSON
            data = json.loads(raw_response)

            # Приводим confidence к 0..1
            confidence_raw = data.get("confidence", 0)
            if confidence_raw > 1:
                confidence_raw = confidence_raw / 100.0  # если к примеру, пришли проценты

            result = IntentResult(
                primary_intent=data.get("intent", "OFF_TOPIC"),
                confidence=float(confidence_raw),
                entities=data.get("entities", {}),
                is_relevant=bool(data.get("is_relevant", False))
            )
            return result
        except json.JSONDecodeError:
            logger.error(f"Ошибка парсинга JSON, ответ:
{raw_response}")
            # Fallback
            return IntentResult(
                primary_intent="OFF_TOPIC",
                confidence=0.2,
                entities={},
                is_relevant=False
            )


# ================== Гибридная система (AI + Rule-based) ================== #

class HybridIntentChecker:
    """
    Гибрид AI + Rule-based. Предоставляет метод is_relevant (старый, синхронный)
    и новый метод classify_async (асинхронный).
    """

    def __init__(self):
        # Новый AI-классификатор
        self.ai = AIIntentClassifier()
        # Старый класс правил
        self.rules = IntentChecker()
        # Кэш для быстрых повторных обращений
        self.cache = cachetools.LRUCache(maxsize=1000)
        # Для хранения логов
        self.classification_logs = []

    def is_relevant(self, message: str) -> bool:
        """
        Старый интерфейс - работает синхронно!
        Остаётся без изменений для обратной совместимости.
        При возникновении ошибок или таймаута - fallback на rule-based.
        """
        # Проверяем кэш (ключ - просто само сообщение)
        if message in self.cache:
            cached_result: IntentResult = self.cache[message]
            return cached_result.is_relevant

        # Запускаем event loop временно (async <-> sync)
        try:
            result = asyncio.run(self.classify_async(message))
            # Сохраняем в кэш
            self.cache[message] = result
            return result.is_relevant
        except Exception as e:
            logger.warning(f"AI классификатор недоступен, fallback на rules: {e}")
            return self.rules.is_relevant(message)

    async def classify_async(
        self,
        message: str,
        context: Optional[Dict] = None
    ) -> IntentResult:
        """
        Новая асинхронная классификация: сначала AI, при ошибке fallback к rules.
        """
        # Проверяем кэш
        if message in self.cache:
            cached_result: IntentResult = self.cache[message]
            return cached_result

        # Пробуем AI
        try:
            ai_result = await self.ai.classify(message, context)

            # Логируем результат
            self._log_classification(message, ai_result)

            # Сохраняем в кэш
            self.cache[message] = ai_result
            return ai_result

        except Exception as e:
            logger.error(f"Ошибка AI-классификации: {e}", exc_info=True)
            # Fallback: rule-based
            rule_is_rel = self.rules.is_relevant(message)
            fallback_result = IntentResult(
                primary_intent="OFF_TOPIC" if not rule_is_rel else "INFO_COMPANY",
                confidence=0.5,
                entities={},
                is_relevant=rule_is_rel
            )
            self._log_classification(message, fallback_result, fallback=True)
            self.cache[message] = fallback_result
            return fallback_result

    def _log_classification(self, message: str, result: IntentResult, fallback: bool = False) -> None:
        """
        Регистрация классификации (можно сохранять в БД, писать в файл и т.д.)
        Сейчас - просто в memory-лог.
        """
        record = {
            "timestamp": time.time(),
            "message": message,
            "primary_intent": result.primary_intent,
            "confidence": result.confidence,
            "is_relevant": result.is_relevant,
            "fallback_used": fallback
        }
        self.classification_logs.append(record)
        logger.info(f"[Classification] {record}")

# Глобальный экземпляр гибридной системы (рекомендованный для использования)
intent_checker = HybridIntentChecker()

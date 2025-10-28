"""
Backend routes for FastAPI
Defines all API endpoints for chat and contact functionality
"""

import os
import sys
import uuid
import logging
from datetime import datetime
from typing import Optional, Dict, Any, List, Tuple
from pathlib import Path

import aiohttp
import httpx
from fastapi import APIRouter, HTTPException, Request
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from pydantic import BaseModel

# Ensure backend modules can be imported when running from Vercel
backend_dir = Path(__file__).resolve().parent.parent.parent / "backend"
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

# Try to import emergentintegrations, fall back to direct API clients if not available
LlmChat = None
UserMessage = None
try:
    from emergentintegrations.llm.chat import LlmChat, UserMessage
except ImportError as exc:
    logging.warning("emergentintegrations not available, will use fallback API clients: %s", exc)

# Import backend modules with graceful degradation
config = None
intent_checker = None
smart_context = None
try:
    from config.loader import config
    from utils.intent_checker import intent_checker
    from memory.smart_context import smart_context
except ImportError as exc:
    logging.warning("Failed to import backend modules: %s", exc)

logger = logging.getLogger("neuroexpert.routes")

# Environment variables
MONGO_URL = os.environ.get("MONGO_URL")
DB_NAME = os.environ.get("DB_NAME")
EMERGENT_LLM_KEY = os.environ.get("EMERGENT_LLM_KEY")
TELEGRAM_BOT_TOKEN = os.environ.get("TELEGRAM_BOT_TOKEN")
TELEGRAM_CHAT_ID = os.environ.get("TELEGRAM_CHAT_ID")
GEMINI_API_KEY = os.environ.get("GOOGLE_API_KEY") or os.environ.get("GEMINI_API_KEY")
GEMINI_MODEL = os.environ.get("GEMINI_MODEL", "gemini-1.5-flash")
try:
    GEMINI_TIMEOUT = float(os.environ.get("GEMINI_TIMEOUT_SECONDS", "15"))
except (TypeError, ValueError):
    GEMINI_TIMEOUT = 15.0
if GEMINI_TIMEOUT <= 0:
    GEMINI_TIMEOUT = 15.0

_client: Optional[AsyncIOMotorClient] = None
_db: Optional[AsyncIOMotorDatabase] = None
_shutdown_registered: bool = False

router = APIRouter(prefix="/api")


class ContactForm(BaseModel):
    name: str
    contact: str
    service: str
    message: Optional[str] = ""


class ChatMessage(BaseModel):
    session_id: str
    message: str
    model: Optional[str] = "claude-sonnet"
    user_data: Optional[Dict[str, Any]] = None


class ChatResponse(BaseModel):
    response: str
    session_id: str


async def _get_database(request: Request) -> AsyncIOMotorDatabase:
    """Return AsyncIOMotorDatabase instance from app state or fallback client."""
    db = getattr(request.app.state, "db", None)
    if db is not None:
        return db

    if not MONGO_URL or not DB_NAME:
        raise HTTPException(status_code=503, detail="Database is not configured")

    global _client, _db
    if _db is None:
        _client = AsyncIOMotorClient(MONGO_URL)
        _db = _client[DB_NAME]
        logger.info("Initialized fallback MongoDB client for routes")

    return _db


async def _close_fallback_client() -> None:
    global _client, _db
    if _client is not None:
        _client.close()
        _client = None
        _db = None
        logger.info("Closed fallback MongoDB client")


async def send_telegram_notification(message: str) -> None:
    """Send notification to Telegram bot."""
    if not TELEGRAM_BOT_TOKEN or not TELEGRAM_CHAT_ID:
        logger.debug("Skipping Telegram notification: not configured")
        return

    try:
        url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
        async with aiohttp.ClientSession() as session:
            async with session.post(
                url,
                json={
                    "chat_id": TELEGRAM_CHAT_ID,
                    "text": message,
                    "parse_mode": "HTML",
                },
                timeout=aiohttp.ClientTimeout(total=10),
            ) as response:
                if response.status != 200:
                    text = await response.text()
                    logger.error(
                        "Telegram notification failed: status=%s response=%s",
                        response.status,
                        text,
                    )
    except Exception as exc:
        logger.exception("Error sending Telegram notification: %s", exc)


def _extract_role_and_content(message: Any) -> Tuple[str, str]:
    role: str = ""
    content: str = ""

    if isinstance(message, dict):
        role = str(message.get("role") or message.get("type") or "").lower()
        content = (
            message.get("content")
            or message.get("text")
            or message.get("message")
            or ""
        )
        if not content:
            user_msg = message.get("user_message")
            ai_msg = message.get("ai_response")
            if user_msg:
                content = user_msg
                role = role or "user"
            elif ai_msg:
                content = ai_msg
                role = role or "assistant"
    else:
        role = str(getattr(message, "role", "")).lower()
        content = getattr(message, "content", "") or getattr(message, "text", "")

    if role not in {"user", "assistant", "system"}:
        if role in {"model"}:
            role = "assistant"
        elif not role:
            role = "user"
        elif "assistant" in role:
            role = "assistant"
        else:
            role = "user"

    return role or "user", str(content or "")


def _prepare_gemini_context(
    system_prompt: str,
    history: Optional[List[Any]],
) -> Tuple[str, List[Dict[str, Any]]]:
    instructions = system_prompt.strip() if system_prompt else ""
    contents: List[Dict[str, Any]] = []

    for message in history or []:
        role, content = _extract_role_and_content(message)
        if not content:
            continue
        if role == "system":
            instructions = f"{instructions}\n\n{content}" if instructions else content
            continue
        mapped_role = "user" if role == "user" else "model"
        contents.append({"role": mapped_role, "parts": [{"text": content}]})

    return instructions, contents


def _extract_gemini_text(payload: Dict[str, Any]) -> Optional[str]:
    for candidate in payload.get("candidates") or []:
        content = candidate.get("content") or {}
        for part in content.get("parts") or []:
            text = part.get("text")
            if text:
                return text
    return None


async def _call_gemini_fallback(
    session_id: str,
    system_prompt: str,
    user_message: str,
    history: Optional[List[Any]],
    requested_model: str,
) -> str:
    if not GEMINI_API_KEY:
        raise HTTPException(status_code=503, detail="AI chat service temporarily unavailable")

    instructions, contents = _prepare_gemini_context(system_prompt, history)
    contents.append({"role": "user", "parts": [{"text": user_message}]})

    payload: Dict[str, Any] = {"contents": contents}
    if instructions:
        payload["system_instruction"] = {"parts": [{"text": instructions}]}

    url = (
        "https://generativelanguage.googleapis.com/v1beta/models/"
        f"{GEMINI_MODEL}:generateContent?key={GEMINI_API_KEY}"
    )
    timeout = httpx.Timeout(GEMINI_TIMEOUT, connect=5.0)

    try:
        async with httpx.AsyncClient(timeout=timeout) as client:
            response = await client.post(url, json=payload)
            response.raise_for_status()
            data = response.json()
    except httpx.HTTPStatusError as exc:
        detail: Any
        try:
            detail = exc.response.json()
        except Exception:
            detail = exc.response.text
        logger.error(
            "Gemini fallback request failed",
            extra={
                "session_id": session_id,
                "status_code": exc.response.status_code,
                "requested_model": requested_model,
                "gemini_model": GEMINI_MODEL,
                "response": detail,
            },
        )
        raise HTTPException(status_code=503, detail="AI chat service temporarily unavailable") from exc
    except httpx.HTTPError as exc:
        logger.error(
            "Gemini fallback request error",
            exc_info=exc,
            extra={
                "session_id": session_id,
                "requested_model": requested_model,
                "gemini_model": GEMINI_MODEL,
            },
        )
        raise HTTPException(status_code=503, detail="AI chat service temporarily unavailable") from exc

    text = _extract_gemini_text(data)
    if not text:
        logger.error(
            "Gemini fallback returned empty response",
            extra={
                "session_id": session_id,
                "requested_model": requested_model,
                "gemini_model": GEMINI_MODEL,
                "payload": data,
            },
        )
        raise HTTPException(status_code=503, detail="AI chat service temporarily unavailable")

    logger.info(
        "Gemini fallback used successfully",
        extra={
            "session_id": session_id,
            "requested_model": requested_model,
            "gemini_model": GEMINI_MODEL,
        },
    )
    return text


@router.get("/")
async def root() -> Dict[str, str]:
    return {"message": "NeuroExpert API", "status": "healthy"}


@router.post("/contact")
async def submit_contact_form(form_data: ContactForm, request: Request) -> Dict[str, Any]:
    try:
        db = await _get_database(request)

        form_dict = form_data.dict()
        form_dict["id"] = str(uuid.uuid4())
        form_dict["timestamp"] = datetime.utcnow()
        form_dict["status"] = "new"

        await db.contact_forms.insert_one(form_dict)

        telegram_message = f"""
<b>🎯 Новая заявка NeuroExpert!</b>

<b>Имя:</b> {form_data.name}
<b>Контакт:</b> {form_data.contact}
<b>Услуга:</b> {form_data.service}
<b>Сообщение:</b> {form_data.message or 'Не указано'}
"""

        await send_telegram_notification(telegram_message)
        logger.info("Contact form stored", extra={"service": form_data.service})

        return {
            "success": True,
            "message": "Спасибо! Мы свяжемся с вами в течение 15 минут",
        }
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Contact form error: %s", exc)
        raise HTTPException(status_code=500, detail="Ошибка отправки заявки")


@router.post("/chat", response_model=ChatResponse)
async def chat_with_ai(chat_request: ChatMessage, request: Request) -> ChatResponse:
    if not all([config, intent_checker, smart_context]):
        raise HTTPException(status_code=503, detail="AI chat service temporarily unavailable")

    try:
        db = await _get_database(request)

        try:
            if not intent_checker.is_relevant(chat_request.message):
                fallback_msg = "Извините, я могу помочь только с вопросами, связанными с digital-трансформацией и нашими услугами. Чем могу помочь?"
                return ChatResponse(
                    response=fallback_msg,
                    session_id=chat_request.session_id,
                )
        except Exception as exc:
            logger.warning("Intent checker issue: %s", exc)

        try:
            initial_messages = await smart_context.get_context(
                session_id=chat_request.session_id,
                db=db,
            )
        except Exception as exc:
            logger.warning("Smart context unavailable: %s", exc)
            initial_messages = []

        system_prompt = _build_system_prompt()

        model_config = {
            "claude-sonnet": ("anthropic", "claude-3-7-sonnet-20250219"),
            "gpt-4o": ("openai", "gpt-4o"),
            "gemini": ("gemini", GEMINI_MODEL),
        }

        selected_model = chat_request.model or "claude-sonnet"
        provider, model_name = model_config.get(selected_model, model_config["claude-sonnet"])

        response_text: Optional[str] = None
        resolved_model: Optional[str] = None

        if LlmChat and UserMessage and EMERGENT_LLM_KEY:
            try:
                chat = LlmChat(
                    api_key=EMERGENT_LLM_KEY,
                    session_id=chat_request.session_id,
                    system_message=system_prompt,
                    initial_messages=initial_messages,
                ).with_model(provider, model_name)

                user_message = UserMessage(text=chat_request.message)
                response_text = await chat.send_message(user_message)
                resolved_model = model_name
            except Exception as exc:
                logger.exception(
                    "Emergent LLM chat failed, falling back to Gemini",
                    extra={
                        "session_id": chat_request.session_id,
                        "requested_model": selected_model,
                        "provider": provider,
                        "model": model_name,
                    },
                )

        if response_text is None:
            if LlmChat is None or UserMessage is None or not EMERGENT_LLM_KEY:
                logger.info(
                    "Emergent integrations unavailable, using Gemini fallback",
                    extra={
                        "session_id": chat_request.session_id,
                        "requested_model": selected_model,
                    },
                )
            if isinstance(initial_messages, list):
                history_messages = initial_messages
            elif initial_messages:
                try:
                    history_messages = list(initial_messages)
                except TypeError:
                    history_messages = []
            else:
                history_messages = []

            response_text = await _call_gemini_fallback(
                session_id=chat_request.session_id,
                system_prompt=system_prompt,
                user_message=chat_request.message,
                history=history_messages,
                requested_model=selected_model,
            )
            resolved_model = GEMINI_MODEL

        message_record = {
            "id": str(uuid.uuid4()),
            "session_id": chat_request.session_id,
            "user_message": chat_request.message,
            "ai_response": response_text,
            "model": resolved_model or model_name,
            "requested_model": selected_model,
            "timestamp": datetime.utcnow(),
            "user_data": chat_request.user_data,
        }
        await db.chat_messages.insert_one(message_record)

        if chat_request.user_data and chat_request.user_data.get("contact"):
            telegram_message = f"""
<b>💬 Лид из AI-чата!</b>

<b>Модель:</b> {resolved_model or model_name} (запрошена: {selected_model})
<b>Имя:</b> {chat_request.user_data.get('name', 'Не указано')}
<b>Контакт:</b> {chat_request.user_data.get('contact')}
<b>Сообщение:</b> {chat_request.message}
"""
            await send_telegram_notification(telegram_message)

        return ChatResponse(response=response_text, session_id=chat_request.session_id)
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("AI chat error: %s", exc)
        raise HTTPException(status_code=500, detail="Ошибка обработки сообщения")


def _build_system_prompt() -> str:
    if not config or not config.data:
        return "Вы — AI-консультант NeuroExpert. Помогите клиенту и будьте вежливы."

    return f"""# IDENTITY & CORE ROLE

Вы — **AI-Консультант {config.data['company']['name']}**, первая точка контакта клиента с экосистемой digital-трансформации. 

**Ваша личность:**
- Эксперт в digital-трансформации с 10+ лет опыта
- Консультант-партнер, а не продавец: сначала глубокая диагностика, потом персонализированное решение
- Говорите живым, понятным языком, адаптируясь к собеседнику
- Дружелюбны, эмпатичны, но профессиональны
- Всегда помните контекст разговора и возвращайтесь к важным деталям
- Ориентированы на реальную пользу для клиента, а не на продажу

**Стиль общения:**
- Отвечайте развернуто (3-6 предложений), но структурированно
- Задавайте уточняющие вопросы для понимания контекста
- Используйте примеры из практики
- Объясняйте технические термины простым языком
- Будьте конкретны в цифрах и сроках
- Проявляйте живой интерес к проблеме клиента

## НАШИ УСЛУГИ
{config.get_all_services_text()}

## КОНТАКТЫ
Телефон: {config.data['company']['phone']}
Email: {config.data['company']['email']}
Завершённых проектов: {config.data['company']['completed_projects']}

## ТЕХНОЛОГИЧЕСКИЙ СТЕК

**Frontend:** React.js/Next.js 15, Vue.js/Nuxt.js, TailwindCSS
**Backend:** Node.js, Python/FastAPI, Golang
**AI/ML:** Claude Sonnet 4, GPT-4o, Gemini Pro, LangChain
**БД:** PostgreSQL, MongoDB, Redis, Vector DB
**Безопасность:** SSL/TLS, WAF, Cloudflare Protection, GDPR/152-ФЗ compliance

## ПРОЦЕСС РАБОТЫ

1. Бесплатная консультация (30 мин) — разбор задачи, первичная оценка
2. Аудит/ТЗ — глубокий анализ, проработка решения
3. Дизайн — прототипы, UX/UI (с участием клиента)
4. Разработка — спринты по 1-2 недели, регулярные демо
5. Тестирование — QA, нагрузочные тесты
6. Запуск — поэтапный deployment, обучение команды
7. Поддержка — мониторинг, оптимизация, развитие

Будьте живым, полезным экспертом, который искренне хочет помочь решить задачу клиента!"""


async def _startup_load_config() -> None:
    """Load configuration on startup."""
    if config is not None:
        try:
            await config.load_async()
            logger.info("Configuration loaded successfully on startup")
        except Exception as exc:
            logger.warning("Could not load configuration: %s", exc)


def setup_routes(app):
    """Mount routes to the FastAPI app and register shutdown handlers."""
    global _shutdown_registered
    app.include_router(router)

    if not _shutdown_registered:
        app.add_event_handler("startup", _startup_load_config)
        app.add_event_handler("shutdown", _close_fallback_client)
        _shutdown_registered = True

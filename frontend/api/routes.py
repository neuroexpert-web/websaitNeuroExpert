"""
Backend routes for FastAPI
Defines all API endpoints for chat and contact functionality
"""

import os
import sys
import uuid
import logging
from datetime import datetime
from typing import Optional, Dict, Any
from pathlib import Path

import aiohttp
from fastapi import APIRouter, HTTPException, Request
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from pydantic import BaseModel

# Ensure backend modules can be imported when running from Vercel
backend_dir = Path(__file__).resolve().parent.parent.parent / "backend"
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

try:
    from config.loader import config
    from utils.intent_checker import intent_checker
    from memory.smart_context import smart_context
except ImportError as exc:
    logging.warning("Failed to import backend modules: %s", exc)
    config = None
    intent_checker = None
    smart_context = None

try:
    from gemini_client import MultiModelLLMClient, Message
except ImportError as exc:
    logging.warning("Failed to import gemini_client: %s", exc)
    MultiModelLLMClient = None
    Message = None

logger = logging.getLogger("neuroexpert.routes")

# Environment variables
MONGO_URL = os.environ.get("MONGO_URL")
DB_NAME = os.environ.get("DB_NAME")
GOOGLE_API_KEY = os.environ.get("GOOGLE_API_KEY") or os.environ.get("GEMINI_API_KEY")
ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY")
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY")
TELEGRAM_BOT_TOKEN = os.environ.get("TELEGRAM_BOT_TOKEN")
TELEGRAM_CHAT_ID = os.environ.get("TELEGRAM_CHAT_ID")

DEFAULT_AI_MODEL = "gemini-1.5-pro"
MODEL_CONFIG = {
    "gemini-1.5-pro": ("google", "gemini-1.5-pro"),
    "gemini-pro": ("google", "gemini-1.5-pro"),
    "gemini-1.5-flash": ("google", "gemini-1.5-flash"),
    "claude-sonnet": ("anthropic", "claude-3-7-sonnet-20250219"),
    "gpt-4o": ("openai", "gpt-4o"),
}

llm_client = MultiModelLLMClient() if MultiModelLLMClient else None

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
    if not all([config, intent_checker, smart_context, llm_client, Message]):
        raise HTTPException(status_code=503, detail="AI chat service temporarily unavailable")

    if not GOOGLE_API_KEY:
        raise HTTPException(
            status_code=503,
            detail="AI сервис не настроен: добавьте GOOGLE_API_KEY или GEMINI_API_KEY в переменные окружения",
        )

    try:
        db = await _get_database(request)

        try:
            if not intent_checker.is_relevant(chat_request.message):
                fallback_msg = (
                    "Извините, я могу помочь только с вопросами, связанными с digital-трансформацией и нашими услугами. "
                    "Чем могу помочь?"
                )
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

        selected_model = chat_request.model or DEFAULT_AI_MODEL
        provider, model_name = MODEL_CONFIG.get(selected_model, MODEL_CONFIG[DEFAULT_AI_MODEL])

        # Enforce Gemini as primary provider, fallback to Gemini if other provider requested
        if provider != "google":
            logger.info(
                "Model %s requested but Gemini is enforced. Falling back to %s",
                selected_model,
                DEFAULT_AI_MODEL,
            )
            selected_model = DEFAULT_AI_MODEL
            provider, model_name = MODEL_CONFIG[DEFAULT_AI_MODEL]

        history: list[Message] = []
        for msg in initial_messages:
            role = msg.get("role")
            content = msg.get("content")
            if role in {"user", "assistant"} and content:
                history.append(Message(role=role, content=content))

        system_prompt = _build_system_prompt()

        try:
            response_text = await llm_client.generate_response(
                prompt=chat_request.message,
                provider=provider,
                model_name=model_name,
                system_message=system_prompt,
                history=history,
            )
        except ValueError as exc:
            logger.warning("LLM configuration error: %s", exc)
            raise HTTPException(status_code=503, detail=str(exc)) from exc
        except Exception as exc:
            logger.exception("Gemini generation error: %s", exc)
            raise HTTPException(
                status_code=502,
                detail=str(exc),
            ) from exc

        message_record = {
            "id": str(uuid.uuid4()),
            "session_id": chat_request.session_id,
            "user_message": chat_request.message,
            "ai_response": response_text,
            "model": selected_model,
            "timestamp": datetime.utcnow(),
            "user_data": chat_request.user_data,
        }
        await db.chat_messages.insert_one(message_record)

        if chat_request.user_data and chat_request.user_data.get("contact"):
            telegram_message = f"""
<b>💬 Лид из AI-чата!</b>

<b>Модель:</b> {selected_model}
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

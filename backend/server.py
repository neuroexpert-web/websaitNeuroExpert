from fastapi import FastAPI, APIRouter, HTTPException, Request
from fastapi.responses import Response
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime
from emergentintegrations.llm.chat import LlmChat, UserMessage
import aiohttp
from config.loader import config
from utils.intent_checker import intent_checker
from memory.smart_context import smart_context
import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration
from sentry_sdk.integrations.starlette import StarletteIntegration
from sentry_sdk.integrations.logging import LoggingIntegration
from sentry_sdk.integrations.asyncio import AsyncioIntegration
from sentry_sdk.integrations.opentelemetry import SentrySpanProcessor
from sentry_sdk import configure_scope
from prometheus_client import Counter, Histogram, Gauge, generate_latest, CONTENT_TYPE_LATEST
from opentelemetry import trace
from opentelemetry.sdk.resources import Resource
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
from opentelemetry.instrumentation.aiohttp_client import AioHttpClientInstrumentor
from opentelemetry.instrumentation.pymongo import PymongoInstrumentor
from contextlib import asynccontextmanager
import time

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ.get('MONGO_URL')
db_name = os.environ.get('DB_NAME')

if not mongo_url or not db_name:
    raise RuntimeError("FATAL: MONGO_URL and DB_NAME must be set in environment variables")

client = AsyncIOMotorClient(mongo_url)
db = client[db_name]

# Environment variables
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY')
TELEGRAM_BOT_TOKEN = os.environ.get('TELEGRAM_BOT_TOKEN')
TELEGRAM_CHAT_ID = os.environ.get('TELEGRAM_CHAT_ID')
CLIENT_ORIGIN_URL = os.environ.get('CLIENT_ORIGIN_URL', 'http://localhost:3000')
SENTRY_DSN_BACKEND = os.environ.get('SENTRY_DSN_BACKEND')
SENTRY_ENABLED = os.environ.get('SENTRY_ENABLED', 'false').lower() in {'1', 'true', 'yes', 'on'}
SENTRY_ENVIRONMENT = os.environ.get('SENTRY_ENVIRONMENT', os.environ.get('APP_ENV', 'development'))
SENTRY_RELEASE = os.environ.get('SENTRY_RELEASE') or os.environ.get('GIT_COMMIT_SHA') or 'unknown'
SENTRY_TRACES_SAMPLE_RATE = os.environ.get('SENTRY_TRACES_SAMPLE_RATE', '0.2')
SENTRY_PROFILES_SAMPLE_RATE = os.environ.get('SENTRY_PROFILES_SAMPLE_RATE', '0.0')
SERVICE_NAME = os.environ.get('SERVICE_NAME', 'neuroexpert-backend')

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def _filter_pii(event, hint=None):
    """Remove PII from events before sending to Sentry."""
    request_data = event.get('request')
    if request_data:
        for key in ('headers', 'cookies', 'data'):
            if key in request_data:
                request_data[key] = '[FILTERED]'

    user_data = event.get('user')
    if user_data:
        event['user'] = {k: user_data[k] for k in ('id', 'username') if k in user_data}

    extra_data = event.get('extra')
    if extra_data:
        for key in list(extra_data.keys()):
            if any(token in key.lower() for token in ('email', 'phone', 'contact', 'name')):
                extra_data[key] = '[FILTERED]'

    return event


def _coerce_float(value: str, fallback: float, label: str) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        logger.warning("Invalid value for %s=%s. Falling back to %s", label, value, fallback)
        return fallback


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Sentry & OpenTelemetry initialization
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
traces_sample_rate = _coerce_float(SENTRY_TRACES_SAMPLE_RATE, 0.2, 'SENTRY_TRACES_SAMPLE_RATE')
profiles_sample_rate = _coerce_float(SENTRY_PROFILES_SAMPLE_RATE, 0.0, 'SENTRY_PROFILES_SAMPLE_RATE')
SENTRY_ACTIVE = bool(SENTRY_DSN_BACKEND) and SENTRY_ENABLED and SENTRY_ENVIRONMENT != 'development'

if SENTRY_ACTIVE:
    sentry_sdk.init(
        dsn=SENTRY_DSN_BACKEND,
        environment=SENTRY_ENVIRONMENT,
        release=SENTRY_RELEASE,
        integrations=[
            FastApiIntegration(transaction_style="endpoint"),
            StarletteIntegration(transaction_style="endpoint"),
            LoggingIntegration(level=logging.INFO, event_level=logging.ERROR),
            AsyncioIntegration(),
        ],
        traces_sample_rate=traces_sample_rate,
        profiles_sample_rate=profiles_sample_rate,
        send_default_pii=False,
        before_send=_filter_pii,
    )
    with configure_scope() as scope:
        scope.set_tag('service', SERVICE_NAME)
        scope.set_tag('deployment', SENTRY_ENVIRONMENT)
    logger.info("✅ Sentry initialized: %s [%s]", SENTRY_ENVIRONMENT, SENTRY_RELEASE)
else:
    logger.info(
        "⚠️  Sentry disabled (environment=%s, enabled=%s, dsn=%s)",
        SENTRY_ENVIRONMENT,
        SENTRY_ENABLED,
        bool(SENTRY_DSN_BACKEND),
    )

# OpenTelemetry setup with Sentry integration
resource = Resource.create({
    "service.name": SERVICE_NAME,
    "service.version": SENTRY_RELEASE,
    "deployment.environment": SENTRY_ENVIRONMENT,
})
tracer_provider = TracerProvider(resource=resource)
trace.set_tracer_provider(tracer_provider)
tracer = trace.get_tracer("neuroexpert.backend")

if SENTRY_ACTIVE:
    tracer_provider.add_span_processor(SentrySpanProcessor())

# Instrument external libraries for tracing
AioHttpClientInstrumentor().instrument()
PymongoInstrumentor().instrument()

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Prometheus Metrics
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
REQUEST_IN_PROGRESS = Gauge(
    "neuroexpert_backend_requests_in_progress",
    "Number of HTTP requests currently processed",
    ("method", "path"),
)

REQUEST_COUNT = Counter(
    "neuroexpert_backend_requests_total",
    "Total HTTP requests processed",
    ("method", "path", "status"),
)

REQUEST_LATENCY = Histogram(
    "neuroexpert_backend_request_duration_seconds",
    "HTTP request duration in seconds",
    ("method", "path"),
    buckets=(0.01, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0, 10.0),
)

ERROR_COUNT = Counter(
    "neuroexpert_backend_error_responses_total",
    "Total HTTP error responses by class",
    ("method", "path", "status_class"),
)

EXTERNAL_CALL_LATENCY = Histogram(
    "neuroexpert_backend_external_call_duration_seconds",
    "Duration of external service calls",
    ("service",),
    buckets=(0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0, 10.0, 30.0),
)

EXTERNAL_CALL_COUNT = Counter(
    "neuroexpert_backend_external_calls_total",
    "Total external service calls grouped by outcome",
    ("service", "outcome"),
)

DB_OPERATION_LATENCY = Histogram(
    "neuroexpert_backend_db_operation_duration_seconds",
    "Duration of MongoDB operations",
    ("collection", "operation"),
    buckets=(0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1.0, 2.0),
)

DB_OPERATION_COUNT = Counter(
    "neuroexpert_backend_db_operations_total",
    "Total MongoDB operations grouped by outcome",
    ("collection", "operation", "outcome"),
)


@asynccontextmanager
async def observe_external_call(service_name: str):
    start = time.perf_counter()
    outcome = "success"
    try:
        yield
    except Exception:
        outcome = "error"
        raise
    finally:
        duration = time.perf_counter() - start
        EXTERNAL_CALL_LATENCY.labels(service=service_name).observe(duration)
        EXTERNAL_CALL_COUNT.labels(service=service_name, outcome=outcome).inc()


@asynccontextmanager
async def observe_db_operation(collection: str, operation: str):
    start = time.perf_counter()
    outcome = "success"
    try:
        yield
    except Exception:
        outcome = "error"
        raise
    finally:
        duration = time.perf_counter() - start
        DB_OPERATION_LATENCY.labels(collection=collection, operation=operation).observe(duration)
        DB_OPERATION_COUNT.labels(collection=collection, operation=operation, outcome=outcome).inc()


# Lifespan context manager for startup/shutdown
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("🚀 Starting NeuroExpert Backend API")
    # Instrument FastAPI after creation
    FastAPIInstrumentor.instrument_app(app)
    yield
    # Shutdown
    logger.info("👋 Shutting down NeuroExpert Backend API")
    client.close()

# Create the main app
app = FastAPI(lifespan=lifespan)

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Models
class ContactForm(BaseModel):
    name: str
    contact: str
    service: str
    message: Optional[str] = ""

class ChatMessage(BaseModel):
    session_id: str
    message: str
    model: Optional[str] = "claude-sonnet"  # claude-sonnet, gpt-4o, gemini-pro
    user_data: Optional[dict] = None

class ChatResponse(BaseModel):
    response: str
    session_id: str


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Metrics Middleware
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
@app.middleware("http")
async def metrics_middleware(request: Request, call_next):
    """Record Prometheus metrics for all requests."""
    start_time = time.perf_counter()
    method = request.method
    path = request.url.path
    
    # Skip metrics endpoint itself
    if path == "/metrics":
        return await call_next(request)
    
    # Normalize endpoint for metrics (remove IDs)
    endpoint = path
    for route in app.routes:
        match = route.matches(request.scope)
        if match[0]:
            endpoint = route.path
            break
    
    REQUEST_IN_PROGRESS.labels(method=method, path=endpoint).inc()
    status = 500
    try:
        response = await call_next(request)
        status = response.status_code
        return response
    except Exception as e:
        logger.exception("Unhandled exception in request: %s", e)
        sentry_sdk.capture_exception(e)
        raise
    finally:
        duration = time.time() - start_time
        REQUEST_IN_PROGRESS.labels(method=method, path=endpoint).dec()
        
        # Record metrics
        REQUEST_COUNT.labels(method=method, path=endpoint, status=status).inc()
        REQUEST_LATENCY.labels(method=method, path=endpoint).observe(duration)
        
        if status >= 400:
            status_class = f"{status // 100}xx"
            ERROR_COUNT.labels(method=method, path=endpoint, status_class=status_class).inc()
            if status >= 500:
                logger.error("5xx error: %s %s -> %d (%.3fs)", method, path, status, duration)

# Telegram notification
async def send_telegram_notification(message: str):
    """Send notification to Telegram bot"""
    if not TELEGRAM_BOT_TOKEN or not TELEGRAM_CHAT_ID:
        logger.warning("Telegram not configured")
        return
            
    url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
    async with observe_external_call("telegram"):
        async with aiohttp.ClientSession() as session:
            async with session.post(url, json={
                "chat_id": TELEGRAM_CHAT_ID,
                "text": message,
                "parse_mode": "HTML"
            }) as response:
                if response.status == 200:
                    logger.info("✅ Telegram notification sent successfully")
                else:
                    text = await response.text()
                    logger.error(f"Telegram notification failed! Status: {response.status}, Response: {text}")
                    raise Exception(f"Telegram API error: {response.status}")


# Routes
@app.get("/metrics")
async def metrics():
    return Response(content=generate_latest(), media_type=CONTENT_TYPE_LATEST)

@api_router.get("/")
async def root():
    return {"message": "NeuroExpert API"}

@api_router.post("/contact")
async def submit_contact_form(form_data: ContactForm):
    """Handle contact form submission"""
    try:
        form_dict = form_data.dict()
        form_dict['id'] = str(uuid.uuid4())
        form_dict['timestamp'] = datetime.utcnow()
        form_dict['status'] = 'new'
        
        async with observe_db_operation('contact_forms', 'insert_one'):
            await db.contact_forms.insert_one(form_dict)
        
        telegram_message = f"""
<b>🎯 Новая заявка NeuroExpert!</b>

<b>Имя:</b> {form_data.name}
<b>Контакт:</b> {form_data.contact}
<b>Услуга:</b> {form_data.service}
<b>Сообщение:</b> {form_data.message or 'Не указано'}
"""
        
        try:
            await send_telegram_notification(telegram_message)
        except Exception as notify_error:
            logger.error("Telegram notification failed: %s", notify_error)
            sentry_sdk.capture_exception(notify_error)
        
        logger.info(f"Contact form: {form_data.name} - {form_data.service}")
        
        return {
            "success": True,
            "message": "Спасибо! Мы свяжемся с вами в течение 15 минут"
        }
    except Exception as e:
        logger.error(f"Contact form error: {str(e)}")
        sentry_sdk.capture_exception(e)
        raise HTTPException(status_code=500, detail="Ошибка отправки заявки")


@api_router.post("/chat", response_model=ChatResponse)
async def chat_with_ai(chat_request: ChatMessage):
    """AI chat with multiple model support"""
    # Check for relevance
    if not intent_checker.is_relevant(chat_request.message):
        return ChatResponse(
            response=config.data['fallback_responses']['irrelevant'],
            session_id=chat_request.session_id
        )

    try:
        # Enhanced system prompt with better context handling
        system_prompt = f"""# IDENTITY & CORE ROLE

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

## ГАРАНТИИ

✅ Фиксированный срок или компенсация 10 000₽
✅ Детальный анализ с конкретными рекомендациями
✅ Практические рекомендации для немедленного внедрения
✅ NDA и полная конфиденциальность
✅ 30-90 дней гарантийной поддержки
✅ Uptime 99.5-99.99% (в зависимости от тарифа)

## ПРОЦЕСС РАБОТЫ

1. **Бесплатная консультация** (30 мин) - разбор задачи, первичная оценка
2. **Аудит/ТЗ** - глубокий анализ, проработка решения
3. **Дизайн** - прототипы, UX/UI (с вашим участием)
4. **Разработка** - спринты по 1-2 недели, регулярные демо
5. **Тестирование** - QA, нагрузочные тесты
6. **Запуск** - поэтапный deployment, обучение команды
7. **Поддержка** - мониторинг, оптимизация, развитие

## СТРАТЕГИЯ ДИАЛОГА

**При первом обращении:**
1. Тепло поприветствуйте и представьтесь
2. Задайте 2-3 открытых вопроса о задаче клиента
3. Выслушайте и резюмируйте понимание проблемы
4. Предложите оптимальное решение с обоснованием
5. Дайте реальные кейсы или примеры
6. Предложите следующий шаг (консультация/встреча/аудит)

**В ходе диалога:**
- Всегда помните предыдущие сообщения клиента
- Обращайтесь к деталям из предыдущих ответов
- Стройте логическую цепочку вопросов
- Не повторяйте одно и то же - развивайте тему
- Будьте конкретны, но не перегружайте деталями

**Если клиент готов:**
- Мягко ведите к заполнению формы контакта
- Предложите конкретное действие (звонок, встречу, аудит)
- Подчеркните ценность следующего шага

**Примеры вашего тона:**
❌ "Мы предоставляем услуги разработки."
✅ "Давайте разберемся, какое решение будет оптимально именно для вашей задачи. Расскажите подробнее - что сейчас не работает, и какой результат вы хотите получить?"

❌ "Стоимость от 150 000 рублей."
✅ "Для вашего случая подойдет корпоративный сайт. Стоимость 150-300 тысяч, но вы получите снижение стоимости лида на 40% уже через 3 месяца. По нашему опыту, такой проект окупается за полгода."

Будьте живым, полезным экспертом, который искренне хочет помочь решить задачу клиента!"""

        # Model mapping (only working models)
        model_config = {
            "claude-sonnet": ("anthropic", "claude-3-7-sonnet-20250219"),
            "gpt-4o": ("openai", "gpt-4o")
        }
        
        selected_model = chat_request.model or "claude-sonnet"
        provider, model_name = model_config.get(selected_model, model_config["claude-sonnet"])
        
        # Load conversation history using SmartContext
        initial_messages = await smart_context.get_context(
            session_id=chat_request.session_id,
            db=db
        )
        
        # Create chat with history and call LLM with metrics
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=chat_request.session_id,
            system_message=system_prompt,
            initial_messages=initial_messages
        ).with_model(provider, model_name)
        
        user_message = UserMessage(text=chat_request.message)
        async with observe_external_call(f"llm_{selected_model}"):
            response = await chat.send_message(user_message)
        
        # Save to DB with model info
        message_record = {
            "id": str(uuid.uuid4()),
            "session_id": chat_request.session_id,
            "user_message": chat_request.message,
            "ai_response": response,
            "model": selected_model,
            "timestamp": datetime.utcnow(),
            "user_data": chat_request.user_data
        }
        async with observe_db_operation('chat_messages', 'insert_one'):
            await db.chat_messages.insert_one(message_record)
        
        # Notify if contact provided
        if chat_request.user_data and chat_request.user_data.get('contact'):
            telegram_message = f"""
<b>💬 Лид из AI-чата!</b>

<b>Модель:</b> {selected_model}
<b>Имя:</b> {chat_request.user_data.get('name', 'Не указано')}
<b>Контакт:</b> {chat_request.user_data.get('contact')}
<b>Сообщение:</b> {chat_request.message}
"""
            try:
                await send_telegram_notification(telegram_message)
            except Exception as notify_error:
                logger.error("Telegram notification failed: %s", notify_error)
                sentry_sdk.capture_exception(notify_error)
        
        return ChatResponse(
            response=response,
            session_id=chat_request.session_id
        )
    except Exception as e:
        logger.error(f"AI chat error: {str(e)}")
        sentry_sdk.capture_exception(e)
        raise HTTPException(status_code=500, detail="Ошибка обработки сообщения")


# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=[CLIENT_ORIGIN_URL],
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

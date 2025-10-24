from fastapi import FastAPI, APIRouter, HTTPException
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

# Create the main app
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


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


# Telegram notification
async def send_telegram_notification(message: str):
    """Send notification to Telegram bot"""
    try:
        if not TELEGRAM_BOT_TOKEN or not TELEGRAM_CHAT_ID:
            logger.warning("Telegram not configured")
            return
            
        url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
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
    except Exception as e:
        logger.error(f"An exception occurred while sending Telegram notification: {str(e)}")


# Routes
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
        
        await db.contact_forms.insert_one(form_dict)
        
        telegram_message = f"""
<b>🎯 Новая заявка NeuroExpert!</b>

<b>Имя:</b> {form_data.name}
<b>Контакт:</b> {form_data.contact}
<b>Услуга:</b> {form_data.service}
<b>Сообщение:</b> {form_data.message or 'Не указано'}
"""
        
        await send_telegram_notification(telegram_message)
        
        logger.info(f"Contact form: {form_data.name} - {form_data.service}")
        
        return {
            "success": True,
            "message": "Спасибо! Мы свяжемся с вами в течение 15 минут"
        }
    except Exception as e:
        logger.error(f"Contact form error: {str(e)}")
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
        
        # Create chat with history
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=chat_request.session_id,
            system_message=system_prompt,
            initial_messages=initial_messages
        ).with_model(provider, model_name)
        
        user_message = UserMessage(text=chat_request.message)
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
            await send_telegram_notification(telegram_message)
        
        return ChatResponse(
            response=response,
            session_id=chat_request.session_id
        )
    except Exception as e:
        logger.error(f"AI chat error: {str(e)}")
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

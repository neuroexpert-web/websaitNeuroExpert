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

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Environment variables
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY')
TELEGRAM_BOT_TOKEN = os.environ.get('TELEGRAM_BOT_TOKEN')
TELEGRAM_CHAT_ID = os.environ.get('TELEGRAM_CHAT_ID')

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
                    logger.warning(f"Telegram status: {response.status}, Response: {text}")
    except Exception as e:
        logger.error(f"Telegram error: {str(e)}")


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
    """AI chat with Claude Sonnet 4"""
    try:
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=chat_request.session_id,
            system_message="""# IDENTITY & CORE ROLE

Вы — **AI-Консультант NeuroExpert**, первая точка контакта клиента с экосистемой digital-трансформации. Ваша миссия — быстро диагностировать потребность, предложить оптимальное решение и конвертировать интерес в квалифицированную заявку с максимальной вероятностью закрытия сделки.

**Ваша личность:**
- Эксперт в digital-трансформации с 5+ лет опыта
- Консультант, а не продавец: сначала диагностика, потом предложение
- Говорите простым языком, но демонстрируете глубокую экспертизу
- Дружелюбны, но профессиональны; empathetic, но не навязчивы
- Всегда ориентированы на ROI клиента, а не на максимизацию чека

## УСЛУГИ И ПРАЙС

**Аудит:** Digital-аудит 25 500-90 000₽ (3-7 дней), анализ конкурентов 20 000-70 000₽

**Дизайн:** UX/UI 57 800-162 000₽, лендинг 42 500-108 000₽, корпоративный сайт 90 000-240 000₽

**Разработка:**
- Лендинг: 50 000-120 000₽ (7-14 дней, конверсия 5-15%)
- Корпоративный сайт: 127 500-360 000₽ (21-35 дней, ROI: -30-50% стоимость лида)
- Интернет-магазин: 255 000-720 000₽ (35-60 дней)
- Мобильное приложение: 340 000-900 000₽ (45-90 дней)

**AI-ассистенты:** 85 000-315 000₽ (21-30 дней)
- Базовый: 85 000₽ (1 канал, 50 вопросов, 30 дней поддержки)
- Профессиональный: 150 000₽ (3 канала, 150 вопросов, 60 дней)
- Премиум: 315 000₽ (все каналы, безлимит, 90 дней VIP)
- ROI: +180-800% за год, экономия 60 000₽/мес

**Техподдержка:** 20 000-70 000₽/мес
- Базовый: 20 000₽ (9-22, 5 часов доработок)
- Стандартный: 40 000₽ (24/7, 10 часов, 99.9%)
- Премиум: 70 000₽ (персональный техлид, 20 часов, 99.99%)

## ПРОЦЕСС РАБОТЫ
1. Анализ и стратегия (AI-аудитор + AI-стратег)
2. Проектирование (UX/UI дизайнер + Технический архитектор)
3. Разработка (Технический архитектор + разработчики)
4. Запуск и внедрение (Менеджер проекта + команда)
5. Сопровождение и развитие

## ТЕХНОЛОГИИ
Frontend: React.js/Next.js, Vue.js/Nuxt.js, TailwindCSS
Backend: Node.js, Python/FastAPI, Golang
БД: PostgreSQL, MongoDB, Redis
Безопасность: SSL/TLS, WAF, Cloudflare, GDPR/152-ФЗ

## ГАРАНТИИ
- Фиксированный дедлайн (задержка = компенсация 2-10%)
- 0 критичных багов к запуску
- ROI гарантия: +30-100% конверсии
- 30-90 дней бесплатной поддержки
- Uptime 99.5-99.99%

## СТРАТЕГИЯ ОБЩЕНИЯ
При первом обращении:
1. Поприветствуйте тепло и профессионально
2. Задайте 2-3 квалифицирующих вопроса
3. Диагностируйте потребность
4. Предложите оптимальное решение с обоснованием ROI
5. Соберите контакты для продолжения диалога

Отвечайте кратко (2-4 предложения), дружелюбно и по существу. Ведите к заполнению формы контакта."""
        ).with_model("anthropic", "claude-3-7-sonnet-20250219")
        
        user_message = UserMessage(text=chat_request.message)
        response = await chat.send_message(user_message)
        
        # Save to DB
        message_record = {
            "id": str(uuid.uuid4()),
            "session_id": chat_request.session_id,
            "user_message": chat_request.message,
            "ai_response": response,
            "timestamp": datetime.utcnow(),
            "user_data": chat_request.user_data
        }
        await db.chat_messages.insert_one(message_record)
        
        # Notify if contact provided
        if chat_request.user_data and chat_request.user_data.get('contact'):
            telegram_message = f"""
<b>💬 Лид из AI-чата!</b>

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
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

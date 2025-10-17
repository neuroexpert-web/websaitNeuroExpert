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
        url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
        async with aiohttp.ClientSession() as session:
            async with session.post(url, json={
                "chat_id": TELEGRAM_BOT_TOKEN.split(':')[0],
                "text": message,
                "parse_mode": "HTML"
            }) as response:
                if response.status == 200:
                    logger.info("Telegram notification sent")
                else:
                    logger.warning(f"Telegram status: {response.status}")
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
            system_message="""Ты — AI-ассистент NeuroExpert. 

Наши услуги:
- Цифровой аудит (от 4000₽): диагностика бизнеса за 24 часа
- AI-ассистент 24/7 (от 6000₽): чат-бот для клиентов
- Сайты под ключ (от 12 000₽): лендинги и корпоративные сайты
- Техподдержка (от 4000₽/мес): мониторинг и поддержка

Помогай выбрать услугу, отвечай кратко и дружелюбно."""
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

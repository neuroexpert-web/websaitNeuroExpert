from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone
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

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


# Define Models
class StatusCheck(BaseModel):
    model_config = ConfigDict(extra="ignore")  # Ignore MongoDB's _id field
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StatusCheckCreate(BaseModel):
    client_name: str

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


# Telegram notification function
async def send_telegram_notification(message: str):
    """Send notification to Telegram bot"""
    try:
        url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
        async with aiohttp.ClientSession() as session:
            async with session.post(url, json={
                "chat_id": "YOUR_CHAT_ID",  # Replace with actual chat ID
                "text": message,
                "parse_mode": "HTML"
            }) as response:
                if response.status == 200:
                    logger.info("Telegram notification sent successfully")
                else:
                    logger.error(f"Failed to send Telegram notification: {await response.text()}")
    except Exception as e:
        logger.error(f"Error sending Telegram notification: {str(e)}")


# API Routes
@api_router.get("/")
async def root():
    return {"message": "Hello World"}

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.model_dump()
    status_obj = StatusCheck(**status_dict)
    
    # Convert to dict and serialize datetime to ISO string for MongoDB
    doc = status_obj.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    
    _ = await db.status_checks.insert_one(doc)
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    # Exclude MongoDB's _id field from the query results
    status_checks = await db.status_checks.find({}, {"_id": 0}).to_list(1000)
    
    # Convert ISO string timestamps back to datetime objects
    for check in status_checks:
        if isinstance(check['timestamp'], str):
            check['timestamp'] = datetime.fromisoformat(check['timestamp'])
    
    return status_checks


@api_router.post("/contact")
async def submit_contact_form(form_data: ContactForm):
    """Handle contact form submission"""
    try:
        # Save to database
        form_dict = form_data.model_dump()
        form_dict['id'] = str(uuid.uuid4())
        form_dict['timestamp'] = datetime.now(timezone.utc).isoformat()
        form_dict['status'] = 'new'
        
        await db.contact_forms.insert_one(form_dict)
        
        # Send Telegram notification
        telegram_message = f"""
<b>🎯 Новая заявка с сайта NeuroExpert!</b>

<b>Имя:</b> {form_data.name}
<b>Контакт:</b> {form_data.contact}
<b>Услуга:</b> {form_data.service}
<b>Сообщение:</b> {form_data.message or 'Не указано'}

<i>Время: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')}</i>
"""
        
        await send_telegram_notification(telegram_message)
        
        logger.info(f"Contact form submitted: {form_data.name} - {form_data.service}")
        
        return {
            "success": True,
            "message": "Спасибо! Мы свяжемся с вами в течение 15 минут"
        }
    except Exception as e:
        logger.error(f"Error submitting contact form: {str(e)}")
        raise HTTPException(status_code=500, detail="Ошибка отправки заявки")


@api_router.post("/chat", response_model=ChatResponse)
async def chat_with_ai(chat_request: ChatMessage):
    """Handle AI chat messages using Claude Sonnet 4"""
    try:
        # Initialize LlmChat with Claude Sonnet 4
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=chat_request.session_id,
            system_message="""Ты — AI-ассистент NeuroExpert. Твоя задача:
1. Помогать клиентам выбрать подходящую услугу
2. Отвечать на вопросы о наших услугах
3. Собирать контактные данные (имя и телефон/Telegram)

Наши услуги:
- Цифровой аудит (от 4000₽): полная диагностика бизнеса за 24 часа
- AI-ассистент 24/7 (от 6000₽): умный чат-бот для поддержки клиентов
- Сайты под ключ (от 12 000₽): премиум лендинги и корпоративные сайты
- Техподдержка (от 4000₽/мес): мониторинг, обновления, исправления

Общайся дружелюбно, кратко и по делу. Используй эмодзи умеренно."""
        ).with_model("anthropic", "claude-3-7-sonnet-20250219")
        
        # Create user message
        user_message = UserMessage(text=chat_request.message)
        
        # Get response from Claude
        response = await chat.send_message(user_message)
        
        # Save message to database
        message_record = {
            "id": str(uuid.uuid4()),
            "session_id": chat_request.session_id,
            "user_message": chat_request.message,
            "ai_response": response,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "user_data": chat_request.user_data
        }
        await db.chat_messages.insert_one(message_record)
        
        # If user provided contact info, send Telegram notification
        if chat_request.user_data and chat_request.user_data.get('contact'):
            telegram_message = f"""
<b>💬 Новый лид из AI-чата!</b>

<b>Имя:</b> {chat_request.user_data.get('name', 'Не указано')}
<b>Контакт:</b> {chat_request.user_data.get('contact')}
<b>Сообщение:</b> {chat_request.message}

<i>Session ID: {chat_request.session_id}</i>
<i>Время: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')}</i>
"""
            await send_telegram_notification(telegram_message)
        
        return ChatResponse(
            response=response,
            session_id=chat_request.session_id
        )
    except Exception as e:
        logger.error(f"Error in AI chat: {str(e)}")
        raise HTTPException(status_code=500, detail="Ошибка обработки сообщения")


@api_router.get("/chat/history/{session_id}")
async def get_chat_history(session_id: str):
    """Get chat history for a session"""
    try:
        messages = await db.chat_messages.find(
            {"session_id": session_id}, {"_id": 0}
        ).sort("timestamp", 1).to_list(1000)
        
        return {
            "success": True,
            "messages": messages
        }
    except Exception as e:
        logger.error(f"Error fetching chat history: {str(e)}")
        raise HTTPException(status_code=500, detail="Ошибка получения истории")


# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from motor.motor_asyncio import AsyncIOMotorClient
import google.generativeai as genai
import httpx
import os
import asyncio
from datetime import datetime
from typing import List, Optional, Dict, Any

app = FastAPI()

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Config
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY")
MONGODB_URI = os.getenv("MONGODB_URI") or os.getenv("MONGO_URL")
TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
TELEGRAM_CHAT_ID = os.getenv("TELEGRAM_CHAT_ID")

# Gemini setup с расширенной памятью
if GOOGLE_API_KEY:
    genai.configure(api_key=GOOGLE_API_KEY)
    model = genai.GenerativeModel(
        'gemini-1.5-pro',
        generation_config={
            "temperature": 0.7,
            "top_p": 0.95,
            "max_output_tokens": 2048,
        },
        system_instruction="""Ты — эксперт-консультант НейроЭксперт. 
Отвечай профессионально, развёрнуто и по существу на любые вопросы.
Используй контекст предыдущих сообщений для персонализированных ответов.
Стиль: экспертный, дружелюбный, конкретный."""
    )

# MongoDB
db_client = None
db = None
if MONGODB_URI:
    db_client = AsyncIOMotorClient(MONGODB_URI)
    db = db_client.neuroexpert

# Models
class ChatMessage(BaseModel):
    message: str
    session_id: Optional[str] = None
    conversation_id: Optional[str] = None
    model: Optional[str] = "gemini-pro"

class ContactForm(BaseModel):
    name: str
    email: Optional[EmailStr] = None
    contact: Optional[str] = None
    message: str
    phone: Optional[str] = None
    service: Optional[str] = None

# Chat history storage (in-memory + MongoDB)
chat_sessions: Dict[str, List[str]] = {}

@app.get("/api/health")
async def health():
    health_status = {
        "status": "ok",
        "timestamp": datetime.utcnow().isoformat(),
        "gemini_configured": bool(GOOGLE_API_KEY),
        "mongodb_configured": bool(MONGODB_URI),
        "telegram_configured": bool(TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID)
    }
    
    # Test MongoDB connection
    if db_client:
        try:
            await db_client.admin.command('ping')
            health_status["mongodb"] = "connected"
        except Exception as e:
            health_status["mongodb"] = f"error: {str(e)}"
    
    return health_status

@app.post("/api/chat")
async def chat(data: ChatMessage):
    if not GOOGLE_API_KEY:
        raise HTTPException(500, "AI не настроен")
    
    try:
        conv_id = data.conversation_id or data.session_id or "default"
        
        # Получаем историю из памяти
        if conv_id not in chat_sessions:
            chat_sessions[conv_id] = []
        
        history = chat_sessions[conv_id][-10:]  # Последние 10 сообщений
        
        # Формируем контекст
        context = "\n".join([f"{'Пользователь' if i%2==0 else 'Ассистент'}: {msg}" 
                            for i, msg in enumerate(history)])
        
        prompt = f"{context}\nПользователь: {data.message}\nАссистент:" if context else data.message
        
        # Генерация с таймаутом
        response = await asyncio.wait_for(
            asyncio.to_thread(model.generate_content, prompt),
            timeout=15.0
        )
        
        answer = response.text
        
        # Сохраняем в историю
        chat_sessions[conv_id].append(data.message)
        chat_sessions[conv_id].append(answer)
        
        # Сохраняем в MongoDB
        if db:
            await db.chats.insert_one({
                "conversation_id": conv_id,
                "session_id": data.session_id,
                "user_message": data.message,
                "ai_response": answer,
                "timestamp": datetime.utcnow()
            })
        
        return {"response": answer, "conversation_id": conv_id, "session_id": data.session_id}
        
    except asyncio.TimeoutError:
        raise HTTPException(504, "Превышено время ожидания ответа")
    except Exception as e:
        raise HTTPException(500, f"Ошибка AI: {str(e)}")

@app.post("/api/contact")
async def contact(data: ContactForm):
    try:
        # Сохраняем в MongoDB
        if db:
            await db.contacts.insert_one({
                "name": data.name,
                "email": data.email,
                "contact": data.contact,
                "message": data.message,
                "phone": data.phone,
                "service": data.service,
                "timestamp": datetime.utcnow()
            })
        
        # Отправляем в Telegram
        if TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID:
            text = f"""🔔 Новая заявка с сайта

👤 Имя: {data.name}
📧 Email: {data.email or 'не указан'}
📱 Телефон: {data.phone or data.contact or 'не указан'}
🎯 Услуга: {data.service or 'не указана'}
💬 Сообщение: {data.message}
🕐 {datetime.now().strftime('%d.%m.%Y %H:%M')}"""
            
            async with httpx.AsyncClient() as client:
                await client.post(
                    f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage",
                    json={"chat_id": TELEGRAM_CHAT_ID, "text": text},
                    timeout=5.0
                )
        
        return {"success": True, "message": "Спасибо! Мы свяжемся с вами в ближайшее время."}
        
    except Exception as e:
        # Даже если Telegram упал, форма считается успешной
        return {"success": True, "message": "Заявка принята"}

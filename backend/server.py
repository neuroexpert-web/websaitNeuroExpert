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
    """AI chat with multiple model support"""
    try:
        # Enhanced system prompt with better context handling
        system_prompt = """# IDENTITY & CORE ROLE

Вы — **AI-Консультант NeuroExpert**, первая точка контакта клиента с экосистемой digital-трансформации. 

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

## УСЛУГИ И ПРАЙС (2025)

**📊 Digital-Аудит:** 25 500-90 000₽ (3-7 дней)
- Анализ текущего состояния digital-присутствия
- Выявление точек роста и "узких мест"
- Конкретные рекомендации с расчетом ROI
- Дорожная карта развития на 6-12 месяцев

**🎨 Дизайн:**
- UX/UI дизайн: 57 800-162 000₽
- Лендинг: 42 500-108 000₽
- Корпоративный сайт: 90 000-240 000₽

**💻 Разработка:**
- **Лендинг:** 35 000-150 000₽ (7-14 дней)
  Средняя конверсия: 5-15%, окупаемость за 2-4 месяца
- **Корпоративный сайт:** 150 000-800 000₽ (21-35 дней)
  ROI: снижение стоимости лида на 30-50%
- **Интернет-магазин:** 300 000-1 200 000₽ (35-60 дней)
  Средний рост продаж: +40-120% за первый год
- **Мобильное приложение:** 500 000-2 500 000₽ (45-90 дней)

**🤖 AI-Ассистенты:** 50 000-1 000 000₽ (21-30 дней)
- Базовый: 50 000₽ (1 канал, базовые сценарии, 30 дней поддержки)
- Профессиональный: 150 000₽ (3 канала, база знаний до 150 вопросов, 60 дней)
- Корпоративный: 500 000-1 000 000₽ (омниканальность, сложная логика, CRM-интеграции)
- **Реальные кейсы:** экономия от 60 000₽/мес на операторах, ROI 180-800% годовых

**🛡️ Техническая поддержка:** 5 000-25 000₽/мес
- Базовый: 5 000₽ (мониторинг, бэкапы, до 3 обращений/мес)
- Стандарт: 12 000₽ (24/7 мониторинг, 2 часа доработок, безлимит консультаций)
- Премиум: 25 000₽ (персональный техлид, 3 часа доработок/мес, 99.99% uptime)

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

        # Model mapping
        model_config = {
            "claude-sonnet": ("anthropic", "claude-3-7-sonnet-20250219"),
            "gpt-4o": ("openai", "gpt-4o"),
            "gemini-pro": ("google", "gemini/gemini-pro")
        }
        
        selected_model = chat_request.model or "claude-sonnet"
        provider, model_name = model_config.get(selected_model, model_config["claude-sonnet"])
        
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=chat_request.session_id,
            system_message=system_prompt
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
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

# 🧠 NeuroExpert платформа

> Умные digital-решения с AI-интеграцией для роста бизнеса

## 🚀 Технологии

- **Frontend**: React 19 + TypeScript + Tailwind CSS
- **Backend**: FastAPI Python + MongoDB Atlas
- **AI**: Claude Sonnet + GPT-4o для умного чата
- **Hosting**: Vercel (serverless)
- **Video**: Cloudinary оптимизация
- **Analytics**: Яндекс.Метрика

## 🎯 Возможности

### Для посетителей:
- ✨ Современный landing с видео фоном
- 🤖 AI-консультант с памятью диалога
- 📱 Адаптивный дизайн для всех устройств
- 🎨 Командная страница с 3D эффектами
- 📊 Детальные модальные окна услуг
- 🔔 Система уведомлений

### Для администраторов:
- 📡 Telegram уведомления о заявках
- 📈 Yandex.Metrika с отслеживанием конверсий
- 🗄️ MongoDB для хранения заявок и чатов
- ⚙️ Гибкая конфигурационная система услуг
- 🔄 Умная обработка нерелевантных вопросов

## 📦 Развертывание

📖 **[Инструкция по развертыванию](DEPLOY.md)**

```bash
# Быстрое развертывание
npm install -g vercel
vercel login
cp .env.example .env
# Заполните .env реальными значениями
vercel --prod
```

## 🔧 Структура проекта

```
├── api/                 # Vercel serverless functions
│   ├── index.py        # FastAPI entry point
│   └── requirements.txt # Python dependencies
├── frontend/           # React приложение
│   ├── src/
│   ├── public/
│   └── package.json
├── backend/            # Исходный код бэкенда
│   ├── config/         # Конфигурация услуг
│   ├── memory/         # Умная память чата
│   └── utils/          # Вспомогательные функции
├── tests/              # Тесты
└── vercel.json         # Конфигурация развертывания
```

## 🧪 Тестирование

```bash
# Локальный запуск бэкенда
cd frontend/api && python -m uvicorn index:app --reload --port 8000

# Локальный запуск фронтенда
cd frontend && npm start

# Ручной smoke-тест API (health + корневой)
cd scripts && ./test_health.sh
```

## ⚙️ Переменные окружения

Скопируйте `.env.example` и заполните:

```bash
# MongoDB (Required)
MONGO_URL=mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true&w=majority
DB_NAME=neuroexpert_db

# AI интеграция (Required для AI-чата)
GOOGLE_API_KEY=your_google_api_key_here
# Optional: alternative key name
GEMINI_API_KEY=your_google_api_key_here

# Optional AI providers
ANTHROPIC_API_KEY=your_anthropic_key_here
OPENAI_API_KEY=your_openai_key_here

# Telegram (Optional, для уведомлений о заявках)
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_CHAT_ID=your_chat_id

# Frontend (Optional)
REACT_APP_BACKEND_URL=        # Пусто для production, http://localhost:8000 для dev
CLIENT_ORIGIN_URL=http://localhost:3000

# Logging (Optional)
LOG_LEVEL=INFO

# Vercel автоматически установит VERCEL_ENV и другие переменные
```

**Важно для запуска AI-чата:**
- `MONGO_URL` и `DB_NAME` — обязательны для хранения сообщений
- `GOOGLE_API_KEY` или `GEMINI_API_KEY` — обязателен для работы Gemini чата
- `ANTHROPIC_API_KEY` — опционально для Claude Sonnet
- `OPENAI_API_KEY` — опционально для GPT-4o
- `CLIENT_ORIGIN_URL` — должен совпадать с доменом фронтенда для CORS

## 📊 Особенности реализации

### 🧠 AI-ассистент
- Конфигурационная система услуг
- Классификатор релевантности вопросов
- Умная память с подсчетом токенов
- Fallback-ответы для нерелевантных вопросов
- Session ID для персистентности диалога (localStorage)
- Retry-механизм с экспоненциальным backoff
- Timeout protection (30 сек)
- Graceful error handling с пользовательскими сообщениями

### 🎨 Frontend
- Video фон с Cloudinary оптимизацией
- 3D эффекты командной страницы
- Анимированные градиенты для медленных соединений
- Yandex.Metrika отслеживание конверсий
- Toast-уведомления для ошибок

### ⚡ Backend
- Serverless архитектура в Vercel
- MongoDB асинхронные операции
- Telegram уведомления о заявках
- CORS защита для продакшена
- Health check endpoint (/api/health)
- Structured JSON logging
- Request ID tracking
- Connection pooling для MongoDB

## 🎉 Успешно внедрены

- ✅ AI-ассистент с памятью до 3000 токенов
- ✅ Обработка 15+ типов нерелевантных вопросов
- ✅ Video фон 1280x720 с автоматической оптимизацией
- ✅ Конфигурационная система услуг без кода
- ✅ Yandex.Metrika с отслеживанием лидов
- ✅ Полностековый deployment на Vercel
- ✅ Health check и мониторинг API
- ✅ Retry logic с экспоненциальным backoff
- ✅ Улучшенная обработка ошибок

## 📚 Документация

- [Развертывание на Vercel](DEPLOY.md)
- [AI Chat Health Check & Troubleshooting](AI_CHAT_HEALTH.md)
- [DevOps и мониторинг](DEVOPS.md)


---

**NeuroExpert.ru** — твой AI-партнер в digital-трансформации 🚀

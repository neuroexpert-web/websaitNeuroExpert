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
# Локальный запуск
cd backend && python -m uvicorn server:app --reload

# Тесты бэкенда
cd backend && python backend_test.py

# Фронтенд
cd frontend && npm start
```

## ⚙️ Переменные окружения

Скопируйте `.env.example` и заполните:

```bash
# MongoDB
MONGO_URL=mongodb+srv://...
DB_NAME=neuroexpert_db

# AI интеграция
EMERGENT_LLM_KEY=your_key

# Telegram
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_CHAT_ID=chat_id

# Vercel автоматически установит остальные
```

## 📊 Особенности реализации

### 🧠 AI-ассистент
- Конфигурационная система услуг
- Классификатор релевантности вопросов
- Умная память с подсчетом токенов
- Fallback-ответы для нерелевантных вопросов

### 🎨 Frontend
- Video фон с Cloudinary оптимизацией
- 3D эффекты командной страницы
- Анимированные градиенты для медленных соединений
- Yandex.Metrika отслеживание конверсий

### ⚡ Backend
- Serverless архитектура в Vercel
- MongoDB асинхронные операции
- Telegram уведомления о заявках
- CORS защита для продакшена

## 🎉 Успешно внедрены

- ✅ AI-ассистент с памятью до 3000 токенов
- ✅ Обработка 15+ типов нерелевантных вопросов
- ✅ Video фон 1280x720 с автоматической оптимизацией
- ✅ Конфигурационная система услуг без кода
- ✅ Yandex.Metrika с отслеживанием лидов
- ✅ Полностековый deployment на Vercel


---

**NeuroExpert.ru** — твой AI-партнер в digital-трансформации 🚀

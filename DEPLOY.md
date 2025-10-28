# 🚀 Развертывание NeuroExpert на Vercel

## ⚡ Быстрое развертывание

### 1. Клонирование репозитория
```bash
git clone <your-repo-url>
cd websaitNeuroExpert-main
```

### 2. Установка Vercel CLI
```bash
npm install -g vercel
vercel login
```

### 3. Настройка переменных окружения
```bash
# Скопируйте .env.example в .env
cp .env.example .env

# Отредактируйте .env с реальными значениями:
# - MONGO_URL: строка подключения MongoDB
# - GOOGLE_API_KEY или GEMINI_API_KEY: API ключ для Google Gemini
# - ANTHROPIC_API_KEY, OPENAI_API_KEY: опциональные ключи для других моделей
# - TELEGRAM_BOT_TOKEN и TELEGRAM_CHAT_ID: для уведомлений
```

### 4. Развертывание
```bash
# Для первого развертывания:
vercel --prod

# Или через GitHub интеграцию в Vercel Dashboard
# Подключите репозиторий к Vercel через dashboard
```

---

## 🔧 Детальная настройка

### Переменные окружения:

| Переменная | Описание | Пример |
|------------|----------|---------|
| `MONGO_URL` | Строка подключения MongoDB Atlas | `mongodb+srv://user:pass@cluster.mongodb.net/neuroexpert_db` |
| `DB_NAME` | Название базы данных | `neuroexpert_db` |
| `GOOGLE_API_KEY` / `GEMINI_API_KEY` | API ключ Google Gemini | `your_google_api_key` |
| `ANTHROPIC_API_KEY` | API ключ для Claude (опционально) | `your_claude_key` |
| `OPENAI_API_KEY` | API ключ для GPT-4o (опционально) | `your_openai_key` |
| `TELEGRAM_BOT_TOKEN` | Токен Telegram бота | `123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11` |
| `TELEGRAM_CHAT_ID` | ID чата для уведомлений | `123456789` |

### Структура проекта:

- **`/api/`** - Python serverless функции для бэкенда
- **`/frontend/`** - React приложение с Next.js
- **`/backend/`** - Исходный код бэкенда (для локального запуска)
- **`vercel.json`** - Конфигурация развертывания

---

## 🧪 Тестирование deployment

### После развертывания проверьте:

1. **Главная страница**: https://your-app.vercel.app
2. **API endpoints**:
   - `POST /api/chat` - AI чат
   - `POST /api/contact` - Форма заявки
   - `GET /api/` - Статус API

### Команды для локального тестирования:

```bash
# Фронтенд
cd frontend && npm start

# Бэкенд (для разработки)
cd backend && python -m uvicorn server:app --reload --host 0.0.0.0 --port 8000

# Тестирование функций
cd backend && python backend_test.py
```

---

## 🚨 Важно:

1. **MongoDB Atlas**: Создайте бесплатную учетную запись и базу данных
2. **Google API Key**: Получите API ключ для Google Gemini (https://ai.google.dev/)
3. **Telegram бот**: Создайте бота и настройте его токен
4. **Cloudinary**: Для видео фона, оно уже настроено в коде
5. **Domain**: Настройте кастомный домен neuroexpert.ru в Vercel

---

## 🔄 Обновление

При изменениях в коде:
```bash
git add .
git commit -m "Your changes"
git push origin main
# Vercel автоматически передеплоит
```

---

## 📞 Поддержка

Если что-то не работает:
1. Проверьте логи в Vercel Dashboard
2. Убедитесь в корректности переменных окружения
3. Проверьте доступность MongoDB и API ключей

Happy deploying! 🎉

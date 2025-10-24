# DevOps инфраструктура websaitNeuroExpert

## 🎯 Обзор

Этот документ описывает полную CI/CD инфраструктуру, тестирование и развертывание проекта.

## 🏗️ Архитектура проекта

- **Frontend**: React 19 + TypeScript + Tailwind CSS + shadcn/ui
- **Backend**: FastAPI Python 3.11 + MongoDB Atlas
- **AI интеграция**: Claude Sonnet + GPT-4o
- **Хостинг**: Vercel
- **CI/CD**: GitHub Actions

## 🚀 CI/CD Pipeline

### GitHub Actions Workflow

Файл: `.github/workflows/ci-cd.yml`

**Этапы выполнения:**

1. **Backend Tests** - Тесты Python API с покрытием
2. **Frontend Tests** - Jest тесты React компонентов
3. **Build Check** - Проверка корректности сборки
4. **Deploy** - Автоматический деплой на Vercel (только master)

**Особенности:**
- ✅ Кэширование pip и node_modules
- ✅ Параллельное выполнение тестов
- ✅ Загрузка coverage в Codecov
- ✅ Условный деплой только для продакшна

## 🔐 Настройка Secrets

### GitHub Repository Secrets

**Обязательные для деплоя:**
```
VERCEL_TOKEN - Personal Access Token из Vercel
VERCEL_ORG_ID - ID организации (получить через vercel link)
VERCEL_PROJECT_ID - ID проекта (получить через vercel link)
```

**Опциональные:**
```
CODECOV_TOKEN - Токен для отчетов покрытия кода
```

### 📝 Как получить Vercel токены:

1. Зайди на [vercel.com](https://vercel.com)
2. Settings → Tokens → Create Token
3. Скопируй VERCEL_TOKEN
4. В терминале выполни: `npx vercel link`
5. Скопируй из .vercel/project.json значения orgId и projectId

## 🐳 Локальная разработка

### Docker Compose

**Запуск всего стека:**
```bash
docker-compose up -d
```

**Сервисы:**
- 🌐 Frontend: http://localhost:3000
- 🔧 Backend: http://localhost:8000
- 🗄️ MongoDB: localhost:27017 (admin:admin123)

**Остановка:**
```bash
docker-compose down
```

## 🧪 Тестирование

### Backend Tests (Python)
```bash
cd api
pip install -r requirements.txt
pip install pytest pytest-cov flake8 black

# Запуск тестов
pytest

# С покрытием
pytest --cov=. --cov-report=html

# Линтинг
flake8 .
```

### Frontend Tests (React)
```bash
cd frontend
yarn install

# Запуск тестов
yarn test

# С покрытием
yarn test --coverage --watchAll=false

# Линтинг
yarn lint
```

## 📊 Мониторинг качества кода

- **Coverage**: Автоматические отчеты через Codecov
- **Python**: flake8 + pytest-cov
- **JavaScript**: ESLint + Jest coverage
- **Деплой**: Только при успешных тестах

## ✅ Статус реализации

- ✅ **GitHub Actions CI/CD** - Полностью настроен
- ✅ **pytest.ini** - Конфигурация тестов Python
- ✅ **.flake8** - Настройки линтера
- ✅ **docker-compose.yml** - Локальная разработка
- ⏳ **Unit тесты backend** - Нужно создать
- ⏳ **Frontend lint script** - Нужно добавить
- ⏳ **Dockerfile.dev** - Нужно создать

## 📋 Следующие шаги

### 1. Создать тесты для backend
```bash
mkdir -p api/tests
touch api/tests/__init__.py
touch api/tests/test_main.py
touch api/tests/conftest.py
```

### 2. Добавить lint в frontend/package.json
```json
{
  "scripts": {
    "lint": "eslint src/**/*.{js,jsx,ts,tsx}",
    "lint:fix": "eslint src/**/*.{js,jsx,ts,tsx} --fix"
  }
}
```

### 3. Создать Dockerfile.dev
- `frontend/Dockerfile.dev` для React
- `api/Dockerfile.dev` для FastAPI

## 🚨 Важные заметки

- **Безопасность**: Никогда не коммитить API ключи
- **Тесты**: CI не пропустит код без тестов
- **Деплой**: Происходит только из ветки master
- **Мониторинг**: Следи за статусом в GitHub Actions

---
**Автор**: Comet AI Assistant  
**Дата создания**: 24.10.2025  
**Версия**: 1.0

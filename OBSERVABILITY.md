# NeuroExpert Observability & Monitoring

Эта документация описывает систему наблюдаемости и мониторинга для платформы NeuroExpert.

## 📊 Обзор

Система наблюдаемости включает:
- **Sentry** - отслеживание ошибок и перформанс-мониторинг (Frontend + Backend)
- **Prometheus** - метрики производительности Backend API
- **Grafana** - визуализация метрик и алертинг
- **OpenTelemetry** - распределённая трассировка запросов

## 🚀 Быстрый старт

### Backend

1. Установка зависимостей:
```bash
cd backend
pip install -r requirements.txt
```

2. Настройка переменных окружения (`.env`):
```bash
# Sentry
SENTRY_DSN_BACKEND=https://your-dsn@sentry.io/project-id
SENTRY_ENABLED=true
SENTRY_ENVIRONMENT=production
SENTRY_RELEASE=1.0.0
SENTRY_TRACES_SAMPLE_RATE=0.2
```

3. Запуск сервера:
```bash
uvicorn backend.server:app --host 0.0.0.0 --port 8000
```

4. Проверка метрик:
```bash
curl http://localhost:8000/metrics
```

### Frontend

1. Установка зависимостей:
```bash
cd frontend
npm install
```

2. Настройка переменных окружения (`.env`):
```bash
# Sentry
REACT_APP_SENTRY_DSN=https://your-dsn@sentry.io/project-id
REACT_APP_SENTRY_ENABLED=true
REACT_APP_ENVIRONMENT=production
REACT_APP_SENTRY_RELEASE=frontend@1.0.0
REACT_APP_SENTRY_TRACES_SAMPLE_RATE=0.1
```

3. Сборка с source maps для Sentry:
```bash
npm run build
```

## 🔧 Конфигурация Sentry

### Backend

**Основные возможности:**
- ✅ Автоматическая отправка ошибок Python/FastAPI
- ✅ Интеграция с логированием (ERROR level)
- ✅ Фильтрация PII (Personally Identifiable Information)
- ✅ Теги окружения и сервиса
- ✅ OpenTelemetry трассировка
- ✅ Профилирование производительности

**PII фильтрация:**
Следующие поля автоматически маскируются: `name`, `contact`, `email`, `phone`, `message`.

### Frontend

**Основные возможности:**
- ✅ Автоматическая отправка JavaScript ошибок
- ✅ Performance monitoring (Web Vitals)
- ✅ Session Replay (только на ошибках)
- ✅ Фильтрация PII
- ✅ Breadcrumbs для отладки UX
- ✅ Error Boundary с fallback UI

**Игнорируемые ошибки:**
- Browser extensions
- Network errors (вне контроля приложения)
- ResizeObserver benign warnings
- AbortError (отмена запроса пользователем)

## 📈 Prometheus Метрики

### Доступные метрики

#### HTTP запросы
- `neuroexpert_backend_requests_total` - Общее количество запросов
- `neuroexpert_backend_request_duration_seconds` - Латентность запросов (histogram)
- `neuroexpert_backend_requests_in_progress` - Активные запросы (gauge)
- `neuroexpert_backend_error_responses_total` - Ошибки 4xx/5xx

#### Внешние сервисы
- `neuroexpert_backend_external_calls_total` - Вызовы внешних API (LLM, Telegram)
- `neuroexpert_backend_external_call_duration_seconds` - Латентность внешних вызовов

#### База данных
- `neuroexpert_backend_db_operations_total` - Операции MongoDB
- `neuroexpert_backend_db_operation_duration_seconds` - Латентность DB операций

### Примеры PromQL запросов

**Request rate (req/s):**
```promql
rate(neuroexpert_backend_requests_total[5m])
```

**p95 latency:**
```promql
histogram_quantile(0.95, rate(neuroexpert_backend_request_duration_seconds_bucket[5m]))
```

**Error rate (%):**
```promql
100 * sum(rate(neuroexpert_backend_error_responses_total[5m])) / sum(rate(neuroexpert_backend_requests_total[5m]))
```

**LLM call duration:**
```promql
histogram_quantile(0.95, rate(neuroexpert_backend_external_call_duration_seconds_bucket{service=~"llm_.*"}[5m]))
```

## 📊 Grafana Dashboard

### Импорт дашборда

1. Откройте Grafana UI
2. Перейдите в Dashboards → Import
3. Загрузите файл `backend/grafana-dashboard.json`
4. Выберите Prometheus data source
5. Нажмите Import

### Панели дашборда

1. **Request Rate** - Количество запросов в секунду
2. **Request Latency** - p50/p95/p99 персентили
3. **Error Rate** - 4xx/5xx ошибки
4. **External Service Calls** - Вызовы LLM, MongoDB, Telegram
5. **External Call Latency** - Латентность внешних сервисов
6. **MongoDB Operations** - Операции с базой данных
7. **Active Requests** - Текущие активные запросы
8. **Avg Response Time** - Средняя задержка
9. **Total Requests** - Общее количество запросов за 5 минут
10. **Error Rate %** - Процент ошибок

### Алерты

**High 5xx Error Rate:**
- Условие: Rate 5xx > 0.1 req/s
- Частота проверки: 1 минута
- Порог срабатывания: 5 минут
- Действие: Уведомление в канал

## 🛠️ Production Deployment

### Docker Compose (с Prometheus & Grafana)

```yaml
version: '3.8'
services:
  backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      - SENTRY_ENABLED=true
      - SENTRY_DSN_BACKEND=${SENTRY_DSN_BACKEND}
      - SENTRY_ENVIRONMENT=production

  prometheus:
    image: prom/prometheus:latest
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus-data:/prometheus
    ports:
      - "9090:9090"
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.retention.time=30d'

  grafana:
    image: grafana/grafana:latest
    ports:
      - "3000:3000"
    volumes:
      - grafana-data:/var/lib/grafana
      - ./backend/grafana-dashboard.json:/etc/grafana/provisioning/dashboards/neuroexpert.json
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=your_secure_password

volumes:
  prometheus-data:
  grafana-data:
```

### Prometheus конфигурация (`prometheus.yml`)

```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'neuroexpert-backend'
    static_configs:
      - targets: ['backend:8000']
    metrics_path: '/metrics'
```

## 🔐 Безопасность

### PII фильтрация

**Backend (`_filter_pii` в server.py):**
- Маскирует все headers, cookies, и данные запросов
- Удаляет user info (кроме id и username)
- Фильтрует extra context с PII полями

**Frontend (`beforeSend` в sentry.js):**
- Маскирует поля форм: name, contact, email, phone, message
- Очищает breadcrumbs от PII
- Удаляет пользовательскую информацию

### Отключение в development

**Backend:**
```bash
SENTRY_ENABLED=false
# или
SENTRY_ENVIRONMENT=development
```

**Frontend:**
```bash
REACT_APP_SENTRY_ENABLED=false
# или
REACT_APP_ENVIRONMENT=development
```

## 📝 Best Practices

### Sampling rates

- **Production:** traces_sample_rate=0.1 (10%)
- **Staging:** traces_sample_rate=0.3 (30%)
- **Development:** traces_sample_rate=1.0 (100%)

### Releases

Используйте семантическое версионирование:
```bash
SENTRY_RELEASE=backend@1.2.3
REACT_APP_SENTRY_RELEASE=frontend@1.2.3
```

### Source Maps

Для React приложения:
1. Включите source maps в production build
2. Загрузите их в Sentry через CLI:
```bash
npx @sentry/cli releases files frontend@1.2.3 upload-sourcemaps ./build/static/js --rewrite
```

### Alerting

Настройте Grafana alerts на:
- Error rate > 5%
- p95 latency > 5s
- LLM call failures > 10%
- MongoDB connection errors

## 🐛 Отладка

### Проверка Sentry

**Backend:**
```python
import sentry_sdk
sentry_sdk.capture_message("Test message from backend")
```

**Frontend:**
```javascript
import { captureMessage } from '@/sentry';
captureMessage('Test message from frontend', 'info');
```

### Проверка Prometheus

```bash
curl http://localhost:8000/metrics | grep neuroexpert
```

### Проверка OpenTelemetry

Логи должны содержать:
```
INFO - ✅ Sentry initialized: production [1.0.0]
```

## 📚 Дополнительные ресурсы

- [Sentry Python SDK](https://docs.sentry.io/platforms/python/)
- [Sentry JavaScript SDK](https://docs.sentry.io/platforms/javascript/guides/react/)
- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)
- [OpenTelemetry Python](https://opentelemetry.io/docs/instrumentation/python/)

## 🆘 Поддержка

При возникновении проблем:
1. Проверьте логи сервера
2. Убедитесь, что DSN корректен
3. Проверьте network connectivity к Sentry
4. Проверьте rate limits в Sentry dashboard

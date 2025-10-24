"""
NeuroExpert API - Production-Ready FastAPI Backend
=====================================================
Vercel Serverless Function с enterprise-grade security & performance
"""

import os
import sys
import time
import uuid
import logging
from contextlib import asynccontextmanager
from typing import Optional, Dict, Any
from datetime import datetime, timezone

# Добавляем корневую директорию в PYTHONPATH для импорта backend модулей
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import orjson
from fastapi import FastAPI, Request, Response, HTTPException, status
from fastapi.responses import JSONResponse, ORJSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError

# ============================================================================
# CONFIGURATION & ENVIRONMENT VALIDATION
# ============================================================================

# Критические переменные окружения
REQUIRED_ENV = [
    "MONGO_URL",
    "DB_NAME",
]

# Опциональные переменные с дефолтами
OPTIONAL_ENV = {
    "CLIENT_ORIGIN_URL": "https://neuroexpert.vercel.app",
    "SENTRY_DSN": None,
    "VERCEL_ENV": "development",
    "LOG_LEVEL": "INFO",
}

# Валидация критических переменных
missing_vars = [var for var in REQUIRED_ENV if not os.getenv(var)]
if missing_vars:
    raise RuntimeError(
        f"❌ Критические переменные окружения отсутствуют: {', '.join(missing_vars)}\n"
        f"Установите их в Vercel Dashboard -> Settings -> Environment Variables"
    )

# Загрузка конфигурации
MONGO_URL = os.getenv("MONGO_URL")
DB_NAME = os.getenv("DB_NAME")
CLIENT_ORIGIN = os.getenv("CLIENT_ORIGIN_URL", OPTIONAL_ENV["CLIENT_ORIGIN_URL"])
VERCEL_ENV = os.getenv("VERCEL_ENV", "development")
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO").upper()
SENTRY_DSN = os.getenv("SENTRY_DSN")

# Production mode detection
IS_PRODUCTION = VERCEL_ENV == "production"

# ============================================================================
# STRUCTURED LOGGING SETUP
# ============================================================================

class JSONFormatter(logging.Formatter):
    """Structured JSON logging для production monitoring"""
    
    def format(self, record: logging.LogRecord) -> str:
        log_data = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno,
        }
        
        # Добавляем exception info если есть
        if record.exc_info:
            log_data["exception"] = self.formatException(record.exc_info)
        
        # Добавляем дополнительные поля из extra
        if hasattr(record, "request_id"):
            log_data["request_id"] = record.request_id
        if hasattr(record, "duration_ms"):
            log_data["duration_ms"] = record.duration_ms
        if hasattr(record, "status_code"):
            log_data["status_code"] = record.status_code
            
        return orjson.dumps(log_data).decode("utf-8")

# Настройка logger
logger = logging.getLogger("neuroexpert")
logger.setLevel(getattr(logging, LOG_LEVEL, logging.INFO))

handler = logging.StreamHandler()
handler.setFormatter(JSONFormatter())
logger.addHandler(handler)

# ============================================================================
# MONGODB CONNECTION POOL (Lifespan Context)
# ============================================================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    FastAPI lifespan context для управления MongoDB connection pool
    https://fastapi.tiangolo.com/advanced/events/
    """
    # STARTUP: Инициализация MongoDB клиента
    logger.info("🚀 Starting NeuroExpert API", extra={"environment": VERCEL_ENV})
    
    try:
        app.state.mongo_client = AsyncIOMotorClient(
            MONGO_URL,
            maxPoolSize=50,          # Максимум 50 соединений в пуле
            minPoolSize=10,          # Минимум 10 ready connections
            maxIdleTimeMS=30000,     # Закрывать idle connections через 30s
            serverSelectionTimeoutMS=5000,  # Таймаут выбора сервера 5s
            connectTimeoutMS=10000,  # Таймаут подключения 10s
            socketTimeoutMS=30000,   # Таймаут socket операций 30s
            retryWrites=True,        # Автоматический retry для write операций
            retryReads=True,         # Автоматический retry для read операций
        )
        
        app.state.db = app.state.mongo_client[DB_NAME]
        
        # Real health check - пингуем MongoDB
        await app.state.mongo_client.admin.command("ping")
        logger.info(
            "✅ MongoDB connected successfully",
            extra={
                "database": DB_NAME,
                "pool_size": 50,
            }
        )
        
    except (ConnectionFailure, ServerSelectionTimeoutError) as e:
        logger.error(
            f"❌ MongoDB connection failed: {str(e)}",
            extra={"mongo_url": MONGO_URL.split("@")[-1]},  # Логируем только host, без credentials
        )
        raise RuntimeError(f"MongoDB connection failed: {e}")
    
    yield  # API работает здесь
    
    # SHUTDOWN: Закрытие соединений
    logger.info("🛑 Shutting down NeuroExpert API")
    if hasattr(app.state, "mongo_client"):
        app.state.mongo_client.close()
        logger.info("✅ MongoDB connection closed")

# ============================================================================
# FASTAPI APPLICATION
# ============================================================================

app = FastAPI(
    title="NeuroExpert API",
    version="3.0.0",
    description="AI-powered digital transformation platform",
    docs_url="/api/docs" if not IS_PRODUCTION else None,  # Скрываем docs в production
    redoc_url="/api/redoc" if not IS_PRODUCTION else None,
    openapi_url="/api/openapi.json" if not IS_PRODUCTION else None,
    lifespan=lifespan,
    default_response_class=ORJSONResponse,  # Используем orjson для speed
)

# ============================================================================
# SECURITY MIDDLEWARE (порядок критичен!)
# ============================================================================

# 1. Trusted Host Protection (должен быть первым)
if IS_PRODUCTION:
    app.add_middleware(
        TrustedHostMiddleware,
        allowed_hosts=[
            "neuroexpert.vercel.app",
            "*.vercel.app",
            "neuroexpert.ru",
            "www.neuroexpert.ru",
        ]
    )

# 2. CORS Configuration (Zero Trust - только whitelisted origins)
allowed_origins = [CLIENT_ORIGIN]

# В development добавляем localhost
if not IS_PRODUCTION:
    allowed_origins.extend([
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
    ])

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    max_age=3600,  # Кеширование preflight requests на 1 час
)

# ============================================================================
# CUSTOM MIDDLEWARE
# ============================================================================

class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """
    Логирование всех запросов с timing и request_id
    """
    async def dispatch(self, request: Request, call_next):
        request_id = str(uuid.uuid4())
        request.state.request_id = request_id
        
        start_time = time.time()
        
        # Логируем входящий запрос
        logger.info(
            f"→ {request.method} {request.url.path}",
            extra={
                "request_id": request_id,
                "method": request.method,
                "path": request.url.path,
                "client_ip": request.client.host if request.client else "unknown",
            }
        )
        
        try:
            response = await call_next(request)
            
            duration_ms = round((time.time() - start_time) * 1000, 2)
            
            # Добавляем headers для tracing
            response.headers["X-Request-ID"] = request_id
            response.headers["X-Response-Time"] = f"{duration_ms}ms"
            
            # Логируем ответ
            logger.info(
                f"← {request.method} {request.url.path} {response.status_code}",
                extra={
                    "request_id": request_id,
                    "status_code": response.status_code,
                    "duration_ms": duration_ms,
                }
            )
            
            return response
            
        except Exception as exc:
            duration_ms = round((time.time() - start_time) * 1000, 2)
            
            logger.error(
                f"✗ {request.method} {request.url.path} failed",
                extra={
                    "request_id": request_id,
                    "error": str(exc),
                    "duration_ms": duration_ms,
                },
                exc_info=True,
            )
            
            return JSONResponse(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                content={
                    "error": "Internal server error",
                    "request_id": request_id,
                    "message": str(exc) if not IS_PRODUCTION else "An error occurred",
                }
            )

app.add_middleware(RequestLoggingMiddleware)

# ============================================================================
# HEALTH CHECK ENDPOINT
# ============================================================================

@app.get("/api/health", tags=["monitoring"])
async def health_check(request: Request) -> Dict[str, Any]:
    """
    Real health check с проверкой MongoDB connectivity
    """
    health_status = {
        "status": "healthy",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "version": "3.0.0",
        "environment": VERCEL_ENV,
    }
    
    # Проверяем MongoDB connection
    try:
        await request.app.state.mongo_client.admin.command("ping")
        health_status["mongodb"] = "connected"
    except Exception as e:
        health_status["status"] = "degraded"
        health_status["mongodb"] = "disconnected"
        health_status["mongodb_error"] = str(e)
        logger.error(f"MongoDB health check failed: {e}")
    
    return health_status

# ============================================================================
# IMPORT ROUTES FROM BACKEND
# ============================================================================

try:
    # Импортируем основной app из backend/server.py
    # Важно: server.py НЕ должен создавать новый FastAPI(), только определять роуты
    from backend.server import setup_routes
    
    # Монтируем роуты из backend
    setup_routes(app)
    logger.info("✅ Backend routes loaded successfully")
    
except ImportError as e:
    logger.warning(
        f"⚠️ Could not import backend routes: {e}\n"
        f"Убедитесь что backend/server.py экспортирует setup_routes(app)"
    )
    
    # Fallback endpoints для тестирования
    @app.get("/api/test")
    async def test_endpoint():
        return {
            "message": "NeuroExpert API is running",
            "note": "Backend routes not loaded - check backend/server.py"
        }

# ============================================================================
# GLOBAL EXCEPTION HANDLER
# ============================================================================

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """
    Глобальный обработчик всех необработанных исключений
    """
    request_id = getattr(request.state, "request_id", "unknown")
    
    logger.error(
        f"Unhandled exception in {request.method} {request.url.path}",
        extra={
            "request_id": request_id,
            "exception_type": type(exc).__name__,
        },
        exc_info=True,
    )
    
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": "Internal server error",
            "request_id": request_id,
            "message": str(exc) if not IS_PRODUCTION else "An unexpected error occurred",
        }
    )

# ============================================================================
# VERCEL HANDLER EXPORT
# ============================================================================

handler = app

# Development server
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "index:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level=LOG_LEVEL.lower(),
    )

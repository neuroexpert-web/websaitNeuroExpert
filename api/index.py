# Vercel API Route - Python FastAPI backend
import os
import sys
import time
import uuid
import json
import asyncio
import logging
from pathlib import Path
from typing import Callable

from fastapi import FastAPI, Request, Response, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.middleware.cors import CORSMiddleware as StarletteCORSMiddleware
from starlette.types import ASGIApp

# -------------------------------------------------------------------
# Настраиваем окружение (проверка переменных)
# -------------------------------------------------------------------

REQUIRED_ENV = [
    "CLIENT_ORIGIN_URL",
    "MONGO_URL",
    "DB_NAME",
    "YANDEX_API_KEY",
    "YANDEX_FOLDER_ID",
    "TELEGRAM_BOT_TOKEN",  # если нужен
]

missing_vars = [v for v in REQUIRED_ENV if not os.getenv(v)]
INVALID_ENVIRONMENT = len(missing_vars) > 0

COLD_START_TIME = time.time()

# -------------------------------------------------------------------
# Пробрасываем путь для импорта бэкенда
# -------------------------------------------------------------------
current_dir = Path(__file__).parent.parent
sys.path.insert(0, str(current_dir))
os.chdir(str(current_dir / "backend"))

# Импорт базового приложения
from server import app  # НЕ меняем код server.py и сам "app"

# -------------------------------------------------------------------
# Логирование в формате JSON
# -------------------------------------------------------------------
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("vercel")

def make_json_log(level: str, route: str, status_code: int, request_id: str, dur_ms: float, extra: dict = None):
    log_record = {
        "level": level,
        "ts": time.time(),
        "route": route,
        "status": status_code,
        "request_id": request_id,
        "dur_ms": round(dur_ms, 2),
    }
    if extra:
        log_record.update(extra)
    return json.dumps(log_record, ensure_ascii=False)

# -------------------------------------------------------------------
# Мидлвар RequestID и глобальный timeout
# -------------------------------------------------------------------
class RequestIDAndTimeoutMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint):
        # Генерируем/получаем request_id
        request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
        start_time = time.perf_counter()
        try:
            # Ограничиваем длительность обработки до ~25с (Vercel maxDuration)
            response = await asyncio.wait_for(call_next(request), timeout=25)
            duration = (time.perf_counter() - start_time) * 1000
            # Добавляем заголовки
            response.headers["X-Request-ID"] = request_id
            response.headers["Cache-Control"] = "no-store"
            # Логируем успешный вызов
            logger.info(
                make_json_log(
                    level="INFO",
                    route=str(request.url.path),
                    status_code=response.status_code,
                    request_id=request_id,
                    dur_ms=duration,
                )
            )
            return response
        except asyncio.TimeoutError:
            duration = (time.perf_counter() - start_time) * 1000
            logger.warning(
                make_json_log(
                    level="WARNING",
                    route=str(request.url.path),
                    status=504,
                    request_id=request_id,
                    dur_ms=duration,
                    extra={"error": "TimeoutError"},
                )
            )
            return JSONResponse(
                status_code=status.HTTP_504_GATEWAY_TIMEOUT,
                content={
                    "error": "Gateway Timeout",
                    "request_id": request_id
                },
            )
        except asyncio.CancelledError:
            duration = (time.perf_counter() - start_time) * 1000
            logger.warning(
                make_json_log(
                    level="WARNING",
                    route=str(request.url.path),
                    status=504,
                    request_id=request_id,
                    dur_ms=duration,
                    extra={"error": "CancelledError"},
                )
            )
            return JSONResponse(
                status_code=status.HTTP_504_GATEWAY_TIMEOUT,
                content={
                    "error": "Request Cancelled",
                    "request_id": request_id
                },
            )

# -------------------------------------------------------------------
# Глобальная обработка HTTP-исключений (и любых 5xx)
# -------------------------------------------------------------------
@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
    content = {
        "error": exc.detail,
        "request_id": request_id,
    }
    status_code = exc.status_code
    if 500 <= status_code < 600:
        # Логируем 5xx
        logger.error(
            make_json_log(
                level="ERROR",
                route=str(request.url.path),
                status=status_code,
                request_id=request_id,
                dur_ms=0,
                extra={"error": exc.detail},
            )
        )
    return JSONResponse(
        status_code=status_code,
        content=content
    )

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
    content = {
        "error": "Internal Server Error",
        "request_id": request_id,
    }
    # Логируем
    logger.exception(
        make_json_log(
            level="ERROR",
            route=str(request.url.path),
            status=500,
            request_id=request_id,
            dur_ms=0,
            extra={"exception": str(exc)},
        )
    )
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content=content,
    )

# -------------------------------------------------------------------
# CORS
# -------------------------------------------------------------------
client_origin = os.getenv("CLIENT_ORIGIN_URL", "*")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[client_origin],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------------------------------------------------------
# Вешаем middleware для request_id + таймаута
# -------------------------------------------------------------------
app.add_middleware(RequestIDAndTimeoutMiddleware)

# -------------------------------------------------------------------
# Маршруты /api/health и /api/ready
# -------------------------------------------------------------------
@app.get("/api/health", tags=["system"])
async def health_route():
    """
    Быстрый здоровый ответ (P95 ≤ 10 ms).
    Возвращает 200 OK всегда, даже при отсутствии env.
    """
    return {"status": "ok", "cold_start_sec": round(time.time() - COLD_START_TIME, 3)}

@app.get("/api/ready", tags=["system"])
async def ready_route():
    """
    Проверяет подключение к БД/внешним сервисам (к примеру, ping).
    Если отсутствуют нужные ENV — 500.
    Если сервис недоступен — 503.
    """
    # Проверяем для начала ENV
    if INVALID_ENVIRONMENT:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "error": "Missing environment variables",
                "missing_vars": missing_vars
            },
        )

    # Пример лёгкой проверки (с таймаутом)
    try:
        await asyncio.wait_for(fake_external_ping(), timeout=0.3)
    except Exception:
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={"error": "Dependency not ready"}
        )
    return {"status": "ready"}

async def fake_external_ping():
    """
    Имитирует проверку доступности БД/внешнего сервиса.
    Здесь можно добавить реальные проверки:
    - Пинг MongoDB
    - Пинг Redis / внешних API и т.д.
    """
    await asyncio.sleep(0.05)

# -------------------------------------------------------------------
# Если отсутствуют нужные ENV, перекрываем все маршруты (кроме health)
# -------------------------------------------------------------------
@app.middleware("http")
async def block_if_env_missing(request: Request, call_next: Callable):
    if INVALID_ENVIRONMENT and request.url.path not in ("/api/health", "/api/health/"):
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "error": "Invalid environment configuration",
                "missing_vars": missing_vars
            },
        )
    return await call_next(request)

# -------------------------------------------------------------------
# Экспортим app как есть для Vercel
# -------------------------------------------------------------------

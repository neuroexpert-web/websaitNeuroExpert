"""
NeuroExpert Configuration Loader
=================================
Thread-safe, async-первый, кешированный загрузчик конфигурации услуг
Оптимизирован для serverless окружения (Vercel, AWS Lambda)
"""

import os
import json
import logging
from pathlib import Path
from typing import Dict, Any, Optional
from functools import lru_cache
import threading

import aiofiles
from pydantic import BaseModel, Field, ValidationError

logger = logging.getLogger("neuroexpert.config")

# ============================================================================
# PYDANTIC MODELS ДЛЯ ВАЛИДАЦИИ
# ============================================================================

class ServiceConfig(BaseModel):
    """Модель одной услуги с валидацией"""
    name: str = Field(..., min_length=1, max_length=200)
    price_min: int = Field(..., ge=0, description="Минимальная цена в рублях")
    price_max: int = Field(..., ge=0, description="Максимальная цена в рублях")
    time: str = Field(..., min_length=1, max_length=100)
    description: str = Field(..., min_length=10, max_length=500)
    
    class Config:
        frozen = True  # Immutable для безопасного кеширования

class CompanyInfo(BaseModel):
    """Информация о компании"""
    name: str = Field(..., min_length=1)
    phone: str = Field(..., pattern=r"^\+7\s?\(\d{3}\)\s?\d{3}-\d{2}-\d{2}$")
    email: str = Field(..., pattern=r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$")
    completed_projects: int = Field(..., ge=0)
    
    class Config:
        frozen = True

class ServicesData(BaseModel):
    """Корневая модель конфигурации"""
    company: CompanyInfo
    services: Dict[str, ServiceConfig]
    
    class Config:
        frozen = True

# ============================================================================
# THREAD-SAFE SINGLETON CONFIG LOADER
# ============================================================================

class ConfigLoader:
    """
    Thread-safe singleton загрузчик конфигурации с кешированием
    
    Особенности:
    - Async-первый (aiofiles для неблокирующего I/O)
    - Thread-safe через threading.Lock
    - Кеширование для производительности
    - Pydantic валидация данных
    - Graceful fallback для отсутствующих файлов
    """
    
    _instance: Optional['ConfigLoader'] = None
    _lock: threading.Lock = threading.Lock()
    _initialized: bool = False
    
    def __new__(cls):
        """Thread-safe singleton implementation"""
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = super().__new__(cls)
        return cls._instance
    
    def __init__(self):
        """Инициализация (выполняется только один раз)"""
        if self._initialized:
            return
            
        with self._lock:
            if self._initialized:
                return
                
            self._data: Optional[ServicesData] = None
            self._config_path: Optional[Path] = None
            self._find_config_file()
            self._initialized = True
            
            logger.info(f"✅ ConfigLoader initialized with path: {self._config_path}")
    
    def _find_config_file(self) -> None:
        """
        Поиск services.json в правильной директории
        Поддержка различных окружений (local, Vercel, Docker)
        """
        possible_paths = [
            # Относительно текущего файла (backend/config/services.json)
            Path(__file__).parent / "services.json",
            
            # Относительно корня проекта (для Vercel)
            Path(__file__).parent.parent.parent / "backend" / "config" / "services.json",
            
            # Абсолютный путь через env (для Docker/K8s)
            Path(os.getenv("SERVICES_CONFIG_PATH", "")) if os.getenv("SERVICES_CONFIG_PATH") else None,
        ]
        
        for path in possible_paths:
            if path and path.exists():
                self._config_path = path
                logger.info(f"📁 Found services.json at: {path}")
                return
        
        # Fallback: создаём путь, даже если файл не существует (для dev)
        self._config_path = possible_paths[0]
        logger.warning(
            f"⚠️ services.json not found. Will use path: {self._config_path}\n"
            f"Searched in: {[str(p) for p in possible_paths if p]}"
        )
    
    async def load_async(self) -> ServicesData:
        """
        Асинхронная загрузка конфигурации (предпочтительный метод)
        
        Returns:
            ServicesData: Валидированная конфигурация
            
        Raises:
            FileNotFoundError: Если файл не найден
            ValidationError: Если данные не прошли валидацию
            json.JSONDecodeError: Если JSON невалиден
        """
        if self._data is not None:
            return self._data
        
        if not self._config_path or not self._config_path.exists():
            raise FileNotFoundError(
                f"Configuration file not found: {self._config_path}\n"
                f"Create backend/config/services.json with proper structure"
            )
        
        try:
            async with aiofiles.open(self._config_path, mode='r', encoding='utf-8') as f:
                content = await f.read()
                data_dict = json.loads(content)
                
            # Pydantic валидация
            self._data = ServicesData(**data_dict)
            
            logger.info(
                f"✅ Configuration loaded successfully",
                extra={
                    "services_count": len(self._data.services),
                    "company": self._data.company.name,
                }
            )
            
            return self._data
            
        except json.JSONDecodeError as e:
            logger.error(f"❌ Invalid JSON in {self._config_path}: {e}")
            raise
        except ValidationError as e:
            logger.error(f"❌ Configuration validation failed: {e}")
            raise
        except Exception as e:
            logger.error(f"❌ Unexpected error loading config: {e}")
            raise
    
    def load_sync(self) -> ServicesData:
        """
        Синхронная загрузка (только для backward compatibility)
        
        DEPRECATED: Используйте load_async() в асинхронном коде
        """
        if self._data is not None:
            return self._data
        
        if not self._config_path or not self._config_path.exists():
            raise FileNotFoundError(f"Configuration file not found: {self._config_path}")
        
        try:
            with open(self._config_path, 'r', encoding='utf-8') as f:
                data_dict = json.load(f)
            
            self._data = ServicesData(**data_dict)
            logger.info(f"✅ Configuration loaded (sync)")
            return self._data
            
        except Exception as e:
            logger.error(f"❌ Error loading config (sync): {e}")
            raise
    
    # ========================================================================
    # HELPER METHODS (кешированные для производительности)
    # ========================================================================
    
    def get_service(self, service_id: str) -> Optional[ServiceConfig]:
        """Получить конфигурацию услуги по ID"""
        if self._data is None:
            logger.warning("⚠️ Config not loaded, call load_async() first")
            return None
        return self._data.services.get(service_id)
    
    @lru_cache(maxsize=128)
    def format_price(self, service_id: str) -> str:
        """
        Форматированная цена с кешированием
        
        Args:
            service_id: ID услуги
            
        Returns:
            Строка вида "от 25 500 до 90 000 ₽"
        """
        service = self.get_service(service_id)
        if not service:
            return "Цена по запросу"
        
        min_price = f"{service.price_min:,}".replace(',', ' ')
        max_price = f"{service.price_max:,}".replace(',', ' ')
        return f"от {min_price} до {max_price} ₽"
    
    @lru_cache(maxsize=1)
    def get_all_services_text(self) -> str:
        """
        Текстовое описание всех услуг для AI промпта (кешировано)
        
        Returns:
            Мультистрочная строка со всеми услугами
        """
        if self._data is None:
            return "Услуги не загружены"
        
        lines = []
        for service_id, service in self._data.services.items():
            lines.append(
                f"- {service.name}: {service.description} "
                f"({self.format_price(service_id)}, срок: {service.time})"
            )
        
        return "\n".join(lines)
    
    def get_company_info(self) -> Optional[CompanyInfo]:
        """Получить информацию о компании"""
        return self._data.company if self._data else None
    
    @property
    def data(self) -> Optional[ServicesData]:
        """Получить текущие данные конфигурации"""
        return self._data
    
    def invalidate_cache(self) -> None:
        """
        Сброс кеша (для hot-reload в development)
        
        ВНИМАНИЕ: Используйте только в dev режиме!
        """
        self._data = None
        self.format_price.cache_clear()
        self.get_all_services_text.cache_clear()
        logger.info("🔄 Config cache invalidated")

# ============================================================================
# ГЛОБАЛЬНЫЙ SINGLETON ЭКЗЕМПЛЯР
# ============================================================================

# Создаём singleton при импорте модуля
# В serverless окружении это безопасно (каждый cold start = новый процесс)
config = ConfigLoader()

# ============================================================================
# CONVENIENCE FUNCTIONS (обратная совместимость)
# ============================================================================

async def load_config() -> ServicesData:
    """Удобная функция для загрузки конфигурации"""
    return await config.load_async()

def get_service(service_id: str) -> Optional[ServiceConfig]:
    """Получить услугу по ID"""
    return config.get_service(service_id)

def format_price(service_id: str) -> str:
    """Форматированная цена"""
    return config.format_price(service_id)

def get_all_services_text() -> str:
    """Все услуги как текст"""
    return config.get_all_services_text()


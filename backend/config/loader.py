import json
import os

class Config:
    """Загрузка конфигурации"""
    
    def __init__(self):
        config_path = os.path.join(os.path.dirname(__file__), 'services.json')
        with open(config_path, 'r', encoding='utf-8') as f:
            self.data = json.load(f)
    
    def get_service(self, service_id):
        """Получить данные об услуге"""
        return self.data['services'].get(service_id, {})
    
    def format_price(self, service_id):
        """Форматированная цена"""
        service = self.get_service(service_id)
        if not service:
            return "Цена по запросу"
        
        min_price = f"{service['price_min']:,}".replace(',', ' ')
        max_price = f"{service['price_max']:,}".replace(',', ' ')
        return f"от {min_price} до {max_price} ₽"
    
    def get_all_services_text(self):
        """Текстовое описание всех услуг для промпта"""
        lines = []
        for service_id, service in self.data['services'].items():
            lines.append(
                f"- {service['name']}: {service['description']} "
                f"({self.format_price(service_id)}, срок: {service['time']})"
            )
        return "\n".join(lines)

# Глобальный экземпляр
config = Config()

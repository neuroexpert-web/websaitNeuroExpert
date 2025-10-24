import tiktoken
from typing import List, Dict

class SmartContext:
    """Умное управление контекстом с учётом токенов для асинхронного MongoDB"""

    def __init__(
        self,
        model_name: str = "gpt-4o",
        max_tokens: int = 6000,  # Оставляем место для ответа
        min_messages: int = 6     # Минимум последних сообщений (3 пары)
    ):
        self.model_name = model_name
        self.max_tokens = max_tokens
        self.min_messages = min_messages
        try:
            self.encoding = tiktoken.encoding_for_model(model_name)
        except KeyError:
            # Fallback для моделей, которых нет в tiktoken
            self.encoding = tiktoken.get_encoding("cl100k_base")

    def count_tokens(self, text: str) -> int:
        """Подсчёт токенов в тексте"""
        if not text:
            return 0
        return len(self.encoding.encode(text))

    async def get_context(self, session_id: str, db) -> List[Dict]:
        """
        Получить оптимальную историю с учётом токенов из MongoDB.
        """
        # Загрузить все сообщения, отсортированные по убыванию (самые новые сначала)
        cursor = db.chat_messages.find(
            {"session_id": session_id}
        ).sort("timestamp", -1)
        
        messages = await cursor.to_list(length=None)
        
        if not messages:
            return []
        
        selected_messages = []
        total_tokens = 0
        
        # min_messages относится к отдельным сообщениям (user/assistant)
        min_message_docs = self.min_messages // 2

        for i, msg_doc in enumerate(messages):
            user_msg = msg_doc.get("user_message", "")
            ai_msg = msg_doc.get("ai_response", "")
            
            # Считаем токены для пары сообщений
            msg_tokens = self.count_tokens(user_msg) + self.count_tokens(ai_msg)
            
            # Всегда включаем минимум последних сообщений
            if i < min_message_docs:
                if ai_msg: selected_messages.insert(0, {"role": "assistant", "content": ai_msg})
                if user_msg: selected_messages.insert(0, {"role": "user", "content": user_msg})
                total_tokens += msg_tokens
                continue
            
            # Проверяем лимит токенов
            if total_tokens + msg_tokens <= self.max_tokens:
                if ai_msg: selected_messages.insert(0, {"role": "assistant", "content": ai_msg})
                if user_msg: selected_messages.insert(0, {"role": "user", "content": user_msg})
                total_tokens += msg_tokens
            else:
                # Прерываем, как только лимит превышен
                break
        
        return selected_messages

# Глобальный экземпляр
smart_context = SmartContext()

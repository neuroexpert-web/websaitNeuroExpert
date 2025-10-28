"""
Google Gemini LLM Client
=========================
Direct integration with Google Generative AI SDK (google-generativeai)
Replacement for emergentintegrations with retry logic and error handling
"""

import os
import logging
import asyncio
from typing import Optional, List
from dataclasses import dataclass

import google.generativeai as genai
from google.generativeai.types import GenerationConfig, HarmCategory, HarmBlockThreshold

logger = logging.getLogger("neuroexpert.gemini")


@dataclass
class Message:
    """Message format compatible with conversation history"""
    role: str  # "user" or "assistant"
    content: str


class GeminiClient:
    """
    Production-ready Google Gemini client with:
    - Exponential backoff retry logic
    - Timeout protection
    - Error handling with user-friendly messages
    - Conversation history support
    - Multiple model support
    """
    
    def __init__(
        self,
        api_key: Optional[str] = None,
        model_name: str = "gemini-1.5-pro",
        temperature: float = 0.7,
        max_retries: int = 3,
        timeout: int = 30,
    ):
        """
        Initialize Gemini client
        
        Args:
            api_key: Google API key (fallback to env vars)
            model_name: Model to use (gemini-1.5-pro, gemini-1.5-flash, etc)
            temperature: Generation temperature (0.0-1.0)
            max_retries: Maximum retry attempts
            timeout: Request timeout in seconds
        """
        # Get API key from parameter or environment
        self.api_key = api_key or os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY")
        
        if not self.api_key:
            raise ValueError(
                "Google API key not found. Set GOOGLE_API_KEY or GEMINI_API_KEY environment variable"
            )
        
        # Configure genai
        genai.configure(api_key=self.api_key)
        
        self.model_name = model_name
        self.temperature = temperature
        self.max_retries = max_retries
        self.timeout = timeout
        
        # Generation config
        self.generation_config = GenerationConfig(
            temperature=temperature,
            top_p=0.95,
            top_k=40,
            max_output_tokens=2048,
        )
        
        # Safety settings - allow most content for business chat
        self.safety_settings = {
            HarmCategory.HARM_CATEGORY_HARASSMENT: HarmBlockThreshold.BLOCK_ONLY_HIGH,
            HarmCategory.HARM_CATEGORY_HATE_SPEECH: HarmBlockThreshold.BLOCK_ONLY_HIGH,
            HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: HarmBlockThreshold.BLOCK_ONLY_HIGH,
            HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: HarmBlockThreshold.BLOCK_ONLY_HIGH,
        }
        
        logger.info(
            f"✅ GeminiClient initialized: model={model_name}, temp={temperature}"
        )
    
    async def generate_response(
        self,
        prompt: str,
        system_message: Optional[str] = None,
        history: Optional[List[Message]] = None,
    ) -> str:
        """
        Generate response from Gemini with retry logic
        
        Args:
            prompt: User message
            system_message: System prompt/instructions
            history: Conversation history
            
        Returns:
            Generated text response
            
        Raises:
            Exception: If all retries fail
        """
        for attempt in range(self.max_retries):
            try:
                response = await self._generate_with_timeout(
                    prompt=prompt,
                    system_message=system_message,
                    history=history,
                )
                return response
                
            except asyncio.TimeoutError:
                logger.warning(
                    f"Gemini request timeout (attempt {attempt + 1}/{self.max_retries})"
                )
                if attempt == self.max_retries - 1:
                    raise Exception(
                        "AI сервис временно недоступен. Пожалуйста, попробуйте снова через минуту."
                    )
                await asyncio.sleep(2 ** attempt)  # Exponential backoff
                
            except Exception as e:
                error_msg = str(e).lower()
                
                # Handle specific error types
                if "api key" in error_msg or "authentication" in error_msg:
                    logger.error("❌ Gemini API key invalid or expired")
                    raise Exception(
                        "Ошибка настройки AI-сервиса. Обратитесь к администратору."
                    )
                
                if "quota" in error_msg or "rate limit" in error_msg:
                    logger.warning(f"Gemini rate limit (attempt {attempt + 1}/{self.max_retries})")
                    if attempt == self.max_retries - 1:
                        raise Exception(
                            "AI сервис перегружен. Пожалуйста, попробуйте снова через минуту."
                        )
                    await asyncio.sleep(2 ** attempt)
                    continue
                
                if "safety" in error_msg or "blocked" in error_msg:
                    logger.warning("Gemini safety filter triggered")
                    raise Exception(
                        "К сожалению, я не могу ответить на этот вопрос. "
                        "Давайте обсудим наши услуги и решения для вашего бизнеса!"
                    )
                
                # Log unexpected errors
                logger.error(f"Gemini error (attempt {attempt + 1}/{self.max_retries}): {e}")
                
                if attempt == self.max_retries - 1:
                    raise Exception(
                        "Произошла ошибка при обработке запроса. Пожалуйста, попробуйте еще раз."
                    )
                
                await asyncio.sleep(2 ** attempt)
    
    async def _generate_with_timeout(
        self,
        prompt: str,
        system_message: Optional[str] = None,
        history: Optional[List[Message]] = None,
    ) -> str:
        """
        Generate response with timeout protection
        """
        async def _generate():
            # Initialize model
            model = genai.GenerativeModel(
                model_name=self.model_name,
                generation_config=self.generation_config,
                safety_settings=self.safety_settings,
                system_instruction=system_message,
            )
            
            # Build chat history in Gemini format
            chat_history = []
            if history:
                for msg in history:
                    # Map roles: "assistant" -> "model"
                    role = "model" if msg.role == "assistant" else "user"
                    chat_history.append({
                        "role": role,
                        "parts": [msg.content]
                    })
            
            # Start chat session
            chat = model.start_chat(history=chat_history)
            
            # Generate response
            response = await asyncio.to_thread(
                chat.send_message,
                prompt
            )
            
            return response.text
        
        # Wrap in timeout
        return await asyncio.wait_for(_generate(), timeout=self.timeout)


class MultiModelLLMClient:
    """
    Multi-model LLM client that supports Anthropic, OpenAI, and Google Gemini
    Provides unified interface for all models
    """
    
    def __init__(self):
        """Initialize multi-model client"""
        self.gemini_api_key = os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY")
        self.anthropic_api_key = os.getenv("ANTHROPIC_API_KEY")
        self.openai_api_key = os.getenv("OPENAI_API_KEY")
        
        logger.info("MultiModelLLMClient initialized")
    
    async def generate_response(
        self,
        prompt: str,
        provider: str,
        model_name: str,
        system_message: Optional[str] = None,
        history: Optional[List[Message]] = None,
    ) -> str:
        """
        Generate response from specified provider/model
        
        Args:
            prompt: User message
            provider: "anthropic", "openai", or "google"
            model_name: Specific model name
            system_message: System prompt
            history: Conversation history
            
        Returns:
            Generated response text
        """
        if provider == "google" or provider == "gemini":
            return await self._generate_gemini(
                prompt=prompt,
                model_name=model_name,
                system_message=system_message,
                history=history,
            )
        
        elif provider == "anthropic":
            return await self._generate_anthropic(
                prompt=prompt,
                model_name=model_name,
                system_message=system_message,
                history=history,
            )
        
        elif provider == "openai":
            return await self._generate_openai(
                prompt=prompt,
                model_name=model_name,
                system_message=system_message,
                history=history,
            )
        
        else:
            raise ValueError(f"Unsupported provider: {provider}")
    
    async def _generate_gemini(
        self,
        prompt: str,
        model_name: str,
        system_message: Optional[str],
        history: Optional[List[Message]],
    ) -> str:
        """Generate response using Google Gemini"""
        if not self.gemini_api_key:
            raise ValueError("Gemini API key not configured")
        
        client = GeminiClient(
            api_key=self.gemini_api_key,
            model_name=model_name,
        )
        
        return await client.generate_response(
            prompt=prompt,
            system_message=system_message,
            history=history,
        )
    
    async def _generate_anthropic(
        self,
        prompt: str,
        model_name: str,
        system_message: Optional[str],
        history: Optional[List[Message]],
    ) -> str:
        """Generate response using Anthropic Claude"""
        if not self.anthropic_api_key:
            raise ValueError("Anthropic API key not configured")
        
        import anthropic
        
        client = anthropic.AsyncAnthropic(api_key=self.anthropic_api_key)
        
        # Build messages
        messages = []
        if history:
            for msg in history:
                messages.append({
                    "role": msg.role,
                    "content": msg.content,
                })
        
        messages.append({
            "role": "user",
            "content": prompt,
        })
        
        # Generate response
        response = await client.messages.create(
            model=model_name,
            max_tokens=2048,
            system=system_message or "",
            messages=messages,
        )
        
        return response.content[0].text
    
    async def _generate_openai(
        self,
        prompt: str,
        model_name: str,
        system_message: Optional[str],
        history: Optional[List[Message]],
    ) -> str:
        """Generate response using OpenAI"""
        if not self.openai_api_key:
            raise ValueError("OpenAI API key not configured")
        
        import openai
        
        client = openai.AsyncOpenAI(api_key=self.openai_api_key)
        
        # Build messages
        messages = []
        if system_message:
            messages.append({
                "role": "system",
                "content": system_message,
            })
        
        if history:
            for msg in history:
                messages.append({
                    "role": msg.role,
                    "content": msg.content,
                })
        
        messages.append({
            "role": "user",
            "content": prompt,
        })
        
        # Generate response
        response = await client.chat.completions.create(
            model=model_name,
            messages=messages,
            temperature=0.7,
            max_tokens=2048,
        )
        
        return response.choices[0].message.content

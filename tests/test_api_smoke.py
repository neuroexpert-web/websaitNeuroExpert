"""Smoke tests for FastAPI routes and Gemini client."""

import os
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

# Ensure required env vars are present before importing application modules
os.environ.setdefault("MONGO_URL", "mongodb://localhost:27017")
os.environ.setdefault("DB_NAME", "test_db")
os.environ.setdefault("GOOGLE_API_KEY", "test_google_api_key")


def test_health_route_reports_status():
    """Verify that the /api/health endpoint responds successfully."""
    import importlib
    from fastapi.testclient import TestClient
    import frontend.api.index as index_module

    mock_client = MagicMock()
    mock_client.admin.command = AsyncMock(return_value={"ok": 1})
    mock_client.__getitem__.return_value = MagicMock()

    with patch("frontend.api.index.AsyncIOMotorClient", return_value=mock_client):
        importlib.reload(index_module)
        with TestClient(index_module.app) as client:
            response = client.get("/api/health")

    assert response.status_code == 200
    data = response.json()
    assert data["status"] in {"healthy", "degraded"}
    assert data["version"] == "3.0.0"
    assert "environment" in data


@pytest.mark.asyncio
async def test_chat_with_ai_missing_key_error():
    """Ensure chat endpoint returns informative error when key is missing."""
    from frontend.api import routes

    original_env = os.environ.pop("GOOGLE_API_KEY", None)

    mock_llm = MagicMock()
    mock_intent_checker = MagicMock()
    mock_intent_checker.is_relevant.return_value = True
    mock_smart_context = MagicMock()
    mock_smart_context.get_context = AsyncMock(return_value=[])
    mock_db_getter = AsyncMock()
    mock_config = MagicMock()

    with (
        patch.object(routes, "GOOGLE_API_KEY", None),
        patch.object(routes, "llm_client", mock_llm),
        patch.object(routes, "intent_checker", mock_intent_checker),
        patch.object(routes, "smart_context", mock_smart_context),
        patch.object(routes, "_get_database", mock_db_getter),
        patch.object(routes, "config", mock_config),
    ):
        payload = routes.ChatMessage(session_id="123", message="Привет")
        request = MagicMock()

        with pytest.raises(Exception) as exc_info:
            await routes.chat_with_ai(payload, request)

        assert "AI сервис не настроен" in str(exc_info.value)

    if original_env:
        os.environ["GOOGLE_API_KEY"] = original_env
    else:
        os.environ.setdefault("GOOGLE_API_KEY", "test_google_api_key")


@pytest.mark.asyncio
async def test_gemini_client_generate_response_mock():
    """Mock Gemini SDK to ensure generate_response returns text."""
    os.environ["GOOGLE_API_KEY"] = "demo_key"
    from frontend.api.gemini_client import GeminiClient, Message

    fake_response = MagicMock()
    fake_response.text = "Мы помогаем компаниям с digital-трансформацией."

    async def fake_to_thread(func, *args, **kwargs):  # noqa: ANN001
        return fake_response

    with patch("google.generativeai.GenerativeModel") as mock_model, patch(
        "asyncio.to_thread", side_effect=fake_to_thread
    ):
        mock_chat = MagicMock()
        mock_chat.send_message.return_value = fake_response
        mock_model.return_value.start_chat.return_value = mock_chat

        client = GeminiClient(api_key="demo_key")
        history = [Message(role="user", content="Расскажите об услугах")]
        text = await client.generate_response(
            prompt="Какие услуги вы предлагаете?",
            system_message="Вы AI-консультант NeuroExpert",
            history=history,
        )

    assert "digital-трансформацией" in text


def test_requirements_updated():
    """Ensure emergentintegrations is removed and google-generativeai is present."""
    requirements_path = "/home/engine/project/frontend/api/requirements.txt"
    with open(requirements_path, "r", encoding="utf-8") as file:
        content = file.read().lower()

    assert "emergentintegrations" not in content
    assert "google-generativeai" in content


def test_env_example_contains_gemini_keys():
    """Check .env.example contains updated Gemini keys."""
    env_path = "/home/engine/project/.env.example"
    with open(env_path, "r", encoding="utf-8") as file:
        content = file.read()

    assert "GOOGLE_API_KEY" in content
    assert "GEMINI_API_KEY" in content


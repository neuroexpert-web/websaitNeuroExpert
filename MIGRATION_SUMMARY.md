# Migration from emergentintegrations to Google Generative AI SDK

## Summary

Successfully migrated the NeuroExpert API from `emergentintegrations` to Google's official `google-generativeai` SDK to resolve Vercel deployment issues.

## Changes Made

### 1. Dependencies Updated

#### frontend/api/requirements.txt
- ❌ Removed: `emergentintegrations>=0.1.0`
- ✅ Added: `google-generativeai==0.8.*`
- ✅ Added: `google-auth>=2.0.0`

#### backend/requirements.txt
- ❌ Removed: `emergentintegrations==0.1.0`

### 2. New LLM Client Module

Created **frontend/api/gemini_client.py** with:
- `GeminiClient`: Production-ready Google Gemini client
  - Exponential backoff retry logic (3 attempts)
  - Timeout protection (30 seconds)
  - User-friendly error messages in Russian
  - Conversation history support
  - Multiple model support (gemini-1.5-pro, gemini-1.5-flash)
  
- `MultiModelLLMClient`: Unified interface supporting:
  - Google Gemini (primary)
  - Anthropic Claude (optional)
  - OpenAI GPT-4o (optional)

### 3. API Routes Updated

#### frontend/api/routes.py
- Replaced `emergentintegrations.llm.chat` imports with `gemini_client`
- Updated environment variables:
  - `GOOGLE_API_KEY` or `GEMINI_API_KEY` (primary, required)
  - `ANTHROPIC_API_KEY` (optional)
  - `OPENAI_API_KEY` (optional)
- Refactored `/api/chat` endpoint:
  - Now uses `MultiModelLLMClient` for LLM calls
  - Enforces Gemini as primary provider
  - Improved error handling with specific error codes (503, 502)
  - Converts SmartContext history to Message format
- Updated model configuration:
  - Default model: `gemini-1.5-pro`
  - Added support for `gemini-1.5-flash`
  - Maintained Claude Sonnet and GPT-4o configs for future use

#### backend/server.py
- Updated imports to use `gemini_client.GeminiClient`
- Changed `EMERGENT_LLM_KEY` → `GOOGLE_API_KEY` or `GEMINI_API_KEY`
- Refactored chat endpoint to use GeminiClient directly
- Added error handling for missing API key

### 4. Vercel Configuration

#### vercel.json (root)
Created new configuration:
```json
{
  "functions": {
    "api/**/*.py": {
      "runtime": "python3.11"
    }
  }
}
```

#### frontend/api/vercel.json
Updated to use Python 3.11 runtime for all API functions.

### 5. Documentation

#### .env.example (NEW)
Created comprehensive environment variable template with:
- MongoDB configuration
- Google API key (primary)
- Optional AI provider keys
- Telegram bot configuration
- Logging and monitoring settings

#### README.md
- Updated AI integration section
- Replaced `EMERGENT_LLM_KEY` with `GOOGLE_API_KEY`/`GEMINI_API_KEY`
- Added optional provider keys documentation
- Updated chat features description

#### DEPLOY.md
- Updated environment variables table
- Changed AI key instructions to Google Gemini
- Added link to Google AI Studio (https://ai.google.dev/)

### 6. Tests

#### tests/test_api_smoke.py (NEW)
Created smoke tests covering:
- `/api/health` endpoint functionality
- Gemini client initialization
- API key validation
- Mock response generation
- Requirements.txt validation
- .env.example validation

## Technical Details

### Gemini Client Features

1. **Retry Logic**: Exponential backoff (1s, 2s, 4s) with 3 attempts
2. **Timeout**: 30-second timeout per request
3. **Error Handling**:
   - Authentication errors → "Ошибка настройки AI-сервиса"
   - Rate limits → "AI сервис перегружен"
   - Safety filters → Friendly fallback message
   - Generic errors → "Произошла ошибка при обработке запроса"

4. **Conversation History**: 
   - Converts SmartContext format to Gemini format
   - Maps "assistant" role to "model" for Gemini API
   - Preserves conversation context across messages

5. **Configuration**:
   - Temperature: 0.7
   - Top-p: 0.95
   - Top-k: 40
   - Max output tokens: 2048
   - Safety settings: BLOCK_ONLY_HIGH for all categories

### API Compatibility

The new implementation maintains backward compatibility with the existing frontend:
- Same endpoint signature (`/api/chat`)
- Same request/response format
- Same session management
- Same Telegram notifications
- Same MongoDB persistence

## Environment Variables

### Required
- `MONGO_URL`: MongoDB connection string
- `DB_NAME`: Database name
- `GOOGLE_API_KEY` OR `GEMINI_API_KEY`: Google Gemini API key

### Optional
- `ANTHROPIC_API_KEY`: For Claude Sonnet support
- `OPENAI_API_KEY`: For GPT-4o support
- `TELEGRAM_BOT_TOKEN`: Telegram notifications
- `TELEGRAM_CHAT_ID`: Telegram chat ID
- `CLIENT_ORIGIN_URL`: CORS origin
- `LOG_LEVEL`: Logging level
- `SENTRY_DSN`: Error tracking

## Deployment Checklist

✅ emergentintegrations removed from requirements.txt files
✅ google-generativeai SDK added
✅ Gemini client module created with retry logic
✅ API routes updated to use new client
✅ vercel.json configured for Python 3.11
✅ .env.example created
✅ README.md updated
✅ DEPLOY.md updated
✅ Smoke tests created
✅ Backend server.py updated for local development

## Testing

Run smoke tests:
```bash
pytest tests/test_api_smoke.py -v
```

Test locally:
```bash
# Set environment variables
export GOOGLE_API_KEY="your_key_here"
export MONGO_URL="your_mongo_url"
export DB_NAME="your_db_name"

# Run API
cd frontend/api
python -m uvicorn index:app --reload --port 8000
```

## Vercel Deployment

The changes ensure successful Vercel deployment:
1. No Python distribution issues (emergentintegrations removed)
2. Python 3.11 runtime explicitly configured
3. Official Google SDK with reliable distribution
4. Informative error messages if API key missing

## Next Steps

1. Set `GOOGLE_API_KEY` in Vercel environment variables
2. Deploy to preview environment and test `/api/chat`
3. Verify chat widget functionality
4. Monitor logs for any issues
5. Deploy to production

## Rollback Plan

If issues arise:
1. Revert to previous commit
2. Or: Set `ANTHROPIC_API_KEY` and update code to use Claude as fallback

## Notes

- Gemini is now the primary AI provider (more reliable for Vercel)
- Claude and GPT-4o support maintained but optional
- All error messages are in Russian (matching existing UX)
- Conversation history preserved through SmartContext
- No breaking changes to frontend API contract

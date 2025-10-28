# 🤖 AI Chat Widget - Health Check & Troubleshooting Guide

## ✅ Health Check Endpoints

### 1. API Health Check
```bash
curl https://your-domain.vercel.app/api/health
```

**Expected Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-...",
  "version": "3.0.0",
  "environment": "production",
  "mongodb": "connected"
}
```

### 2. Chat Endpoint Test
```bash
curl -X POST https://your-domain.vercel.app/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "test-session-123",
    "message": "Привет, расскажите о ваших услугах",
    "model": "claude-sonnet"
  }'
```

**Expected Response:**
```json
{
  "response": "Здравствуйте! Рад помочь вам...",
  "session_id": "test-session-123"
}
```

---

## 🔧 Configuration Checklist

### Required Environment Variables

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `MONGO_URL` | ✅ Yes | MongoDB connection string | `mongodb+srv://user:pass@...` |
| `DB_NAME` | ✅ Yes | Database name | `neuroexpert_db` |
| `EMERGENT_LLM_KEY` | ✅ Yes | AI model API key | `ek_...` |
| `CLIENT_ORIGIN_URL` | ✅ Yes | Frontend domain (CORS) | `https://yoursite.vercel.app` |
| `TELEGRAM_BOT_TOKEN` | ⚪ Optional | Telegram notifications | `1234567890:ABC...` |
| `TELEGRAM_CHAT_ID` | ⚪ Optional | Telegram chat ID | `-1001234567890` |

### Environment Setup in Vercel

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add all required variables for **Production**, **Preview**, and **Development**
3. Redeploy the project after adding variables

---

## 🐛 Common Issues & Solutions

### Issue 1: CORS Error in Browser Console

**Symptoms:**
```
Access to fetch at '...' from origin '...' has been blocked by CORS policy
```

**Solution:**
1. Check `CLIENT_ORIGIN_URL` environment variable matches your frontend domain exactly
2. Include protocol: `https://yoursite.vercel.app` (not `yoursite.vercel.app`)
3. For local development, set to `http://localhost:3000`
4. Redeploy after changing

### Issue 2: "AI chat service temporarily unavailable" (503)

**Symptoms:**
```json
{
  "detail": "AI chat service temporarily unavailable"
}
```

**Causes & Solutions:**

1. **Missing EMERGENT_LLM_KEY**
   - Check environment variable is set in Vercel
   - Verify key is valid and not expired
   
2. **Backend modules not imported**
   - Check Vercel deployment logs
   - Ensure `backend/` directory is included in deployment
   
3. **Missing dependencies**
   - Check `frontend/api/requirements.txt` includes all backend dependencies
   - Redeploy to reinstall dependencies

### Issue 3: "Database is not configured" Error

**Symptoms:**
```json
{
  "detail": "Database is not configured"
}
```

**Solution:**
1. Verify `MONGO_URL` and `DB_NAME` are set in Vercel environment variables
2. Test MongoDB connection:
   ```bash
   mongosh "mongodb+srv://..." --eval "db.adminCommand('ping')"
   ```
3. Check MongoDB Atlas network access (allow Vercel IPs or 0.0.0.0/0)

### Issue 4: Timeout / Slow Responses

**Symptoms:**
- Requests take >30 seconds
- Timeout errors in frontend

**Solutions:**
1. Check MongoDB connection speed (Atlas free tier can be slow)
2. Verify EmergentIntegrations API status
3. Check Vercel function logs for cold starts
4. Consider upgrading Vercel plan for faster cold starts

### Issue 5: Session Memory Not Working

**Symptoms:**
- AI doesn't remember previous messages
- Context lost after 5-7 messages

**Solution:**
1. Verify messages are being saved to MongoDB:
   ```bash
   # Check chat_messages collection in MongoDB Atlas
   ```
2. Check `smart_context` is loading history correctly (check logs)
3. Ensure session_id is consistent across requests (check localStorage)

---

## 📊 Monitoring & Logs

### Vercel Logs
```bash
vercel logs [deployment-url] --follow
```

### Key Log Messages

✅ **Healthy:**
- `✅ MongoDB connected successfully`
- `✅ Backend routes loaded successfully`
- `← POST /api/chat 200`

❌ **Errors:**
- `❌ MongoDB connection failed`
- `⚠️ Could not import backend routes`
- `AI chat error: ...`

### MongoDB Monitoring

Check collections in MongoDB Atlas:
- `chat_messages` - should have documents with session_id, user_message, ai_response
- `contact_forms` - contact form submissions

---

## 🧪 Testing Locally

### 1. Start Backend
```bash
cd /home/engine/project
export MONGO_URL="your-mongodb-url"
export DB_NAME="neuroexpert_db"
export EMERGENT_LLM_KEY="your-key"

cd frontend/api
python -m uvicorn index:app --reload --port 8000
```

### 2. Start Frontend
```bash
cd frontend
export REACT_APP_BACKEND_URL="http://localhost:8000"
npm start
```

### 3. Test Chat
Open http://localhost:3000 and click the chat widget icon (💬)

---

## 🔍 Advanced Debugging

### Check Frontend Request
Open Browser DevTools → Network → Filter by "chat"
- Verify request payload has `session_id`, `message`, `model`
- Check response status and body

### Check Session Storage
Browser DevTools → Application → Local Storage
- Look for `neuroexpert_session_id`
- Should be consistent across requests

### Manual API Test with curl
```bash
SESSION_ID="debug-$(date +%s)"

curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -d "{
    \"session_id\": \"$SESSION_ID\",
    \"message\": \"Test message\",
    \"model\": \"claude-sonnet\"
  }" | jq
```

---

## 📞 Getting Help

If issues persist:

1. **Check Logs:** Vercel logs and MongoDB Atlas logs
2. **Verify Config:** All environment variables are set correctly
3. **Test Individually:** Test MongoDB, EmergentIntegrations API, Vercel deployment separately
4. **GitHub Issues:** Open an issue with logs and error details

---

## ✨ Performance Metrics

**Target Metrics:**
- Health check response: < 1 second
- Chat response (first token): < 3 seconds
- Chat response (full): < 10 seconds
- MongoDB query: < 500ms
- CORS preflight: < 200ms

**Monitor with:**
```bash
# Response time
time curl https://your-domain.vercel.app/api/health

# Full chat latency
time curl -X POST https://your-domain.vercel.app/api/chat \
  -H "Content-Type: application/json" \
  -d '{"session_id":"test","message":"Hello"}'
```

---

**Last Updated:** 2024
**Version:** 3.0.0

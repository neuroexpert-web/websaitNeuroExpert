# 🚀 Deployment Guide - Critical Fixes Applied

## Pre-Deployment Checklist

### ✅ All Critical Fixes Applied
- [x] Vercel configuration cleaned up
- [x] Requirements.txt simplified
- [x] Gemini AI with extended memory
- [x] API client with retry logic
- [x] Performance optimizations
- [x] Mobile responsive
- [x] Console noise reduction

---

## 🔧 Environment Variables Setup

### Vercel Dashboard → Settings → Environment Variables

Add the following variables:

```bash
# ==========================================
# REQUIRED - AI Service
# ==========================================
GOOGLE_API_KEY=your_gemini_api_key_here
# Get from: https://makersuite.google.com/app/apikey

# ==========================================
# REQUIRED - Database
# ==========================================
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/neuroexpert?retryWrites=true&w=majority
# Get from: MongoDB Atlas

# ==========================================
# REQUIRED - Telegram Notifications
# ==========================================
TELEGRAM_BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz
# Get from: @BotFather on Telegram

TELEGRAM_CHAT_ID=123456789
# Your personal Telegram chat ID or group ID

# ==========================================
# OPTIONAL - Aliases (for compatibility)
# ==========================================
GEMINI_API_KEY=same_as_GOOGLE_API_KEY
MONGO_URL=same_as_MONGODB_URI

# ==========================================
# OPTIONAL - Legacy Backend Support
# ==========================================
EMERGENT_LLM_KEY=your_emergent_key
# Only if using routes.py instead of main.py

# ==========================================
# DATABASE NAME
# ==========================================
DB_NAME=neuroexpert
```

### How to Get API Keys

#### 1. Google Gemini API Key
1. Go to https://makersuite.google.com/app/apikey
2. Sign in with Google account
3. Click "Create API Key"
4. Copy the key

#### 2. MongoDB Connection String
1. Go to https://cloud.mongodb.com
2. Create a free M0 cluster
3. Go to "Database Access" → Create user
4. Go to "Network Access" → Add IP (0.0.0.0/0 for production)
5. Go to "Database" → Connect → "Connect your application"
6. Copy the connection string

#### 3. Telegram Bot Token
1. Open Telegram, search for @BotFather
2. Send `/newbot` command
3. Follow instructions to create bot
4. Copy the token

#### 4. Telegram Chat ID
**Method 1 (Your Personal Chat)**:
1. Search for @userinfobot on Telegram
2. Start the bot
3. It will show your chat ID

**Method 2 (Group Chat)**:
1. Add your bot to the group
2. Send a message in the group
3. Visit: `https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates`
4. Look for `"chat":{"id":-123456789}`

---

## 📦 Deployment Steps

### 1. Commit All Changes
```bash
cd /home/engine/project
git add .
git commit -m "Critical fix: Vercel build + AI chat + video + performance"
git push origin hotfix/critical-deploy-ai-chat-video-form-performance
```

### 2. Deploy to Vercel

**Option A: Auto-Deploy (Recommended)**
- Vercel will auto-deploy when you push to GitHub
- Check the deployment status in Vercel Dashboard

**Option B: Manual Deploy**
```bash
cd frontend
vercel --prod
```

### 3. Verify Deployment

#### Test 1: Health Check
```bash
curl https://your-domain.vercel.app/api/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-10-28T...",
  "gemini_configured": true,
  "mongodb_configured": true,
  "telegram_configured": true,
  "mongodb": "connected"
}
```

#### Test 2: AI Chat
```bash
curl -X POST https://your-domain.vercel.app/api/chat \
  -H "Content-Type: application/json" \
  -d '{"session_id":"test123","message":"Привет"}'
```

Expected response:
```json
{
  "response": "Привет! Я AI-консультант...",
  "conversation_id": "test123",
  "session_id": "test123"
}
```

#### Test 3: Contact Form
```bash
curl -X POST https://your-domain.vercel.app/api/contact \
  -H "Content-Type: application/json" \
  -d '{
    "name":"Test User",
    "email":"test@example.com",
    "message":"Test message",
    "service":"AI-ассистент"
  }'
```

Expected response:
```json
{
  "success": true,
  "message": "Спасибо! Мы свяжемся с вами в ближайшее время."
}
```

Check your Telegram for notification!

---

## 🔍 Troubleshooting

### Build Fails
**Problem**: Vercel build fails with "Module not found"

**Solution**:
1. Check `/frontend/api/requirements.txt` - should only have 14 packages
2. Remove any `__pycache__` folders
3. Verify `/frontend/vercel.json` exists at root (not in `/api`)

### AI Not Responding
**Problem**: `/api/chat` returns 500 error

**Solution**:
1. Verify `GOOGLE_API_KEY` is set in Vercel
2. Check Vercel logs: `vercel logs --follow`
3. Test Gemini API directly:
```bash
curl -X POST https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=YOUR_KEY \
  -H "Content-Type: application/json" \
  -d '{"contents":[{"parts":[{"text":"Hello"}]}]}'
```

### MongoDB Not Connecting
**Problem**: Health check shows "mongodb": "error: ..."

**Solution**:
1. Verify `MONGODB_URI` is correct
2. Check MongoDB Atlas Network Access (allow 0.0.0.0/0)
3. Verify database user has read/write permissions
4. Test connection string locally:
```bash
mongosh "YOUR_MONGODB_URI"
```

### Telegram Notifications Not Working
**Problem**: Form submits but no Telegram message

**Solution**:
1. Verify bot token: Send message to your bot manually
2. Check chat ID is correct (positive for personal, negative for groups)
3. Make sure bot is added to group (if using group chat)
4. Test API manually:
```bash
curl -X POST "https://api.telegram.org/bot<TOKEN>/sendMessage" \
  -d "chat_id=<CHAT_ID>&text=Test"
```

### Video Not Loading
**Problem**: Hero section shows gradient instead of video

**Solution**:
1. Check `/public/background.webm` exists (5.8MB file)
2. Add `/public/background.mp4` for Safari compatibility
3. Verify video poster `/public/video-poster.svg` exists
4. Check browser console for video errors

---

## 📊 Performance Monitoring

### Vercel Analytics
1. Go to Vercel Dashboard → Analytics
2. Check "Web Vitals"
3. Look for:
   - **LCP** (Largest Contentful Paint) < 2.5s
   - **FID** (First Input Delay) < 100ms
   - **CLS** (Cumulative Layout Shift) < 0.1

### Lighthouse Audit
```bash
# Install Lighthouse CLI
npm install -g lighthouse

# Run audit
lighthouse https://your-domain.vercel.app --view
```

Target scores:
- Performance: 85+
- Accessibility: 95+
- Best Practices: 95+
- SEO: 95+

### MongoDB Performance
Check query performance in MongoDB Atlas:
1. Go to "Database" → "Collections"
2. Click on `chats` or `contacts` collections
3. Verify documents are being created

---

## 🎯 Post-Deployment Checklist

- [ ] Health check returns 200 OK
- [ ] AI chat responds with context awareness
- [ ] Contact form saves to MongoDB
- [ ] Telegram notifications arrive
- [ ] Video background loads or shows poster
- [ ] Mobile experience is smooth
- [ ] No console errors
- [ ] Lighthouse Performance > 85

---

## 📝 Rollback Plan

If deployment fails critically:

### Option 1: Revert to Previous Deployment
```bash
# In Vercel Dashboard
Go to Deployments → Find previous working deployment → "Promote to Production"
```

### Option 2: Revert Git Changes
```bash
git revert HEAD
git push origin hotfix/critical-deploy-ai-chat-video-form-performance
```

### Option 3: Use Legacy Backend
If `main.py` causes issues, the original `index.py` + `routes.py` will still work.
Just ensure `EMERGENT_LLM_KEY` is set instead of `GOOGLE_API_KEY`.

---

## 🎉 Success Indicators

Your deployment is successful when:

1. ✅ Vercel build completes in < 3 minutes
2. ✅ `/api/health` returns status "ok"
3. ✅ AI chat responds within 2-5 seconds
4. ✅ Form submissions appear in Telegram
5. ✅ Video loads smoothly on desktop and mobile
6. ✅ No 404/CORS errors in browser console
7. ✅ Mobile Lighthouse score > 85

---

## 📞 Support

If you encounter issues:

1. Check Vercel logs: `vercel logs --follow`
2. Review `/CRITICAL_FIX_SUMMARY.md` for changes
3. Test each endpoint individually with curl
4. Verify all environment variables are set

---

**Good luck with the deployment! 🚀**

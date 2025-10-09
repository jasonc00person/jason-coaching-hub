# Deployment Architecture 🚀

## Current Setup

### ✅ **Split Deployment** (What We're Using)
- **Frontend:** Vercel (`frontend-v2/`)
- **Backend:** Railway (`backend-v2/`)

### Why Split?
1. **Backend needs long-running process** - Railway provides persistent containers
2. **ChatKit streaming** - Requires WebSocket-like connections
3. **Frontend benefits from Vercel's edge network** - Faster global delivery
4. **Independent scaling** - Frontend and backend scale separately

---

## Live URLs

- **Frontend:** https://jason-coaching-hub.vercel.app/
- **Backend:** https://jason-coaching-backend-production.up.railway.app/ (private)

---

## Architecture

```
User Browser
    ↓
Vercel (Frontend - React/TypeScript)
    ↓ (HTTPS API calls)
Railway (Backend - FastAPI/Python)
    ↓
OpenAI API (ChatKit + Agents)
```

### Session-Based Chat History
- ✅ Users can have multiple chat threads
- ✅ Thread history persists during browser tab session
- ✅ On page refresh → fresh start (sessionStorage cleared)
- ✅ Incognito mode → more aggressive clearing
- ✅ Each session gets isolated threads via session ID

---

## Frontend (Vercel)

### Configuration Files
- `frontend-v2/vercel.json` - Build settings
- `frontend-v2/src/lib/config.ts` - API endpoints (points to Railway)

### Environment Variables (Set in Vercel Dashboard)
- `VITE_API_BASE` - Railway backend URL
- `VITE_CHATKIT_API_DOMAIN_KEY` - OpenAI domain key

### Auto-Deploy
- Pushes to `main` branch → Vercel auto-deploys
- Build command: `npm run build`
- Output directory: `dist/`

---

## Backend (Railway)

### Configuration Files
- `backend-v2/Procfile` - Tells Railway how to start the app
- `backend-v2/railway.json` - Railway-specific config
- `backend-v2/runtime.txt` - Python version
- `backend-v2/requirements.txt` - Python dependencies

### Environment Variables (Set in Railway Dashboard)
- `OPENAI_API_KEY` - Your OpenAI API key
- `JASON_VECTOR_STORE_ID` - Vector store ID for file search
- `PORT` - Auto-set by Railway

### Auto-Deploy
- Pushes to `main` branch → Railway auto-deploys
- Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

---

## Local Development

### Prerequisites
- Node.js 18+
- Python 3.13+
- OpenAI API key

### Frontend Setup
```bash
cd frontend-v2
npm install
npm run dev
# Runs on http://localhost:5173
```

### Backend Setup
```bash
cd backend-v2
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
export OPENAI_API_KEY="your-key-here"
export JASON_VECTOR_STORE_ID="your-vector-store-id"
uvicorn app.main:app --reload --port 8000
# Runs on http://localhost:8000
```

### Local Development Tips
- Frontend `.env.local` should point to `http://localhost:8000` for backend
- Backend has CORS enabled for `localhost:5173`
- Use `npm run dev` for hot reload on frontend
- Use `--reload` flag on uvicorn for hot reload on backend

---

## Deployment Workflow

### To Deploy Changes:
```bash
# 1. Make your changes
# 2. Commit to git
git add .
git commit -m "Your changes"

# 3. Push to GitHub
git push origin main

# 4. Both platforms auto-deploy!
# - Vercel deploys frontend
# - Railway deploys backend
```

### Verify Deployment:
1. Check Vercel dashboard for frontend build status
2. Check Railway logs for backend deployment
3. Test live site at https://jason-coaching-hub.vercel.app/

---

## Key Features

### ChatKit Integration
- Real-time streaming responses
- Thread management (create, list, switch, delete)
- Session-scoped memory storage
- File upload to vector store

### Session Management
- Frontend generates session ID on load
- Stored in `sessionStorage` (clears on tab close)
- Backend isolates threads by session ID
- No user authentication required

### CORS Configuration
- Backend allows requests from Vercel domain
- Wildcard allowed for development

---

## Troubleshooting

### Frontend Issues
1. Check Vercel deployment logs
2. Verify environment variables in Vercel dashboard
3. Check browser console for errors (F12)
4. Network tab shows API calls to Railway backend

### Backend Issues
1. Check Railway deployment logs
2. Verify environment variables in Railway dashboard
3. Look for Python errors in Railway logs
4. Test backend directly: `https://[railway-url]/health`

### Common Issues
- **CORS errors** → Check backend CORS middleware
- **500 errors** → Check Railway logs for Python exceptions
- **Chat not loading** → Verify session ID generation
- **Files not uploading** → Check vector store ID env var

---

## Monitoring

### Vercel
- Dashboard: https://vercel.com/dashboard
- View builds, deployments, analytics
- Check function logs (if any)

### Railway
- Dashboard: https://railway.app/dashboard
- View deployments, logs, metrics
- Monitor resource usage

---

## Success Criteria ✅

Your deployment is working correctly when:
- ✅ Frontend loads at https://jason-coaching-hub.vercel.app/
- ✅ Chat interface appears and is interactive
- ✅ Messages send and receive responses
- ✅ Multiple threads can be created and switched
- ✅ File upload works (if enabled)
- ✅ Page refresh creates new session (fresh chat)
- ✅ No console errors in browser
- ✅ Backend returns 200 responses (not 500)

---

## Need Help?

- Frontend issues → Check Vercel docs
- Backend issues → Check Railway docs
- ChatKit issues → Check OpenAI ChatKit docs
- Agent issues → Check OpenAI Agents SDK docs


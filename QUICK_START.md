# Quick Start Guide

Get the Jason Cooperson Coaching Agent running in 5 minutes.

## 🚀 Local Development

### 1. Backend (Terminal 1)

```bash
cd backend-v2
source venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

✅ Backend running at `http://localhost:8000`

### 2. Frontend (Terminal 2)

```bash
cd frontend-v2
npm run dev
```

✅ Frontend running at `http://localhost:5173`

### 3. Test

Open `http://localhost:5173` and send a message!

**Test messages:**
- "Hey what's up?" → Quick response agent
- "Show me your hook templates" → Strategy agent with file search
- "What's trending on TikTok?" → Web search
- Upload an image → Image analysis

---

## 🔧 First Time Setup

### Backend

```bash
cd backend-v2
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Create .env file
echo "OPENAI_API_KEY=your-key-here" > .env
echo "JASON_VECTOR_STORE_ID=your-vector-store-id" >> .env
```

### Frontend

```bash
cd frontend-v2
npm install
```

---

## 🐛 Troubleshooting

### Quick Diagnostic

```bash
./diagnose-chatkit.sh
```

This checks everything automatically!

### Common Issues

**Blank screen?**
- Run diagnostic script
- Check browser console (F12)
- Verify backend is running on port 8000

**Backend won't start?**
- Check `.env` file has `OPENAI_API_KEY`
- Verify venv is activated
- Run `pip install -r requirements.txt`

**Frontend won't start?**
- Delete `node_modules` and `package-lock.json`
- Run `npm install` again
- Check port 5173 isn't in use

**File uploads not working?**
- Ensure backend is on latest code
- Check Railway deployment logs
- Text files require backend version from Oct 9, 2025+

---

## 📊 What's Running

### Backend (Port 8000)
- FastAPI server
- ChatKit integration
- Agent orchestration (triage → quick/strategy)
- Tool execution (file search, web search)
- Session management

### Frontend (Port 5173)
- React + Vite dev server
- ChatKit UI
- File upload handling
- Theme management

---

## 🎯 Testing Checklist

- [ ] Send "hello" → Get quick response
- [ ] Send "show me templates" → File search executes
- [ ] Send "what's trending" → Web search executes
- [ ] Upload image → Get analysis
- [ ] Upload markdown file → Get content summary
- [ ] Check Network tab → See SSE streaming
- [ ] No console errors

---

## 📝 Environment Variables

### Backend `.env`
```bash
OPENAI_API_KEY=sk-...
JASON_VECTOR_STORE_ID=vs_...
DEBUG_MODE=false
```

### Frontend (optional)
```bash
VITE_API_BASE=http://localhost:8000/
VITE_CHATKIT_API_DOMAIN_KEY=domain_pk_...
```

---

## 🚀 Deploy to Production

### Railway (Backend)
1. Connect GitHub repo
2. Set environment variables
3. Deploy from `main` branch
4. Auto-deploys on push

### Vercel (Frontend)
1. Import GitHub repo
2. Set build command: `npm run build`
3. Set output directory: `dist`
4. Deploy from `main` branch

---

## 💡 Pro Tips

- Use `DEBUG_MODE=true` for detailed backend logs
- Check Railway logs for backend issues
- Use browser DevTools Network tab to debug SSE streaming
- Run diagnostic script before asking for help
- Keep ChatKit versions pinned (0.0.2 backend, 0.0.0 frontend)

---

## 📚 More Info

- Full docs: `README.md`
- Troubleshooting: `docs/archive/`
- ChatKit reference: `docs/chatkit-reference/`
- Deployment guides: `backend-v2/DEPLOYMENT.md` and `frontend-v2/DEPLOYMENT.md`

---

**Need help?** Run `./diagnose-chatkit.sh` first!


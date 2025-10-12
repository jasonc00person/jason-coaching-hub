# Jason Cooperson Coaching Agent

AI-powered coaching assistant for content creators, powered by GPT-5 and OpenAI's Agent SDK.

## 🎯 Quick Links

**New to staging/production workflow?**
- 👉 **[START HERE](START_HERE.md)** ← Read this first!

**Reference Guides:**
- ⚡ **[Quick Reference](QUICK_REFERENCE.md)** - TL;DR cheat sheet
- 🚀 **[Staging Setup Guide](STAGING_SETUP_GUIDE.md)** - Complete setup walkthrough  
- 📊 **[Architecture Diagram](STAGING_ARCHITECTURE.md)** - Visual flow explanation
- 🔧 **[Environment Variables](ENVIRONMENT_VARIABLES.md)** - What to set where
- 📝 **[Git Workflow](GIT_WORKFLOW.md)** - Daily git commands

**Quick Setup:**
- 💻 Run `./setup-staging.sh` to create dev branch automatically

## 🚀 Tech Stack

- **Backend**: FastAPI + OpenAI Agents SDK 0.3.3
- **Frontend**: React + Vite + ChatKit 0.0.0
- **AI Models**: GPT-5 (strategy) + GPT-5-mini (triage/routing)
- **Deployment**: Railway (backend) + Vercel (frontend)

## 📁 Project Structure

```
├── backend-v2/          # FastAPI backend with agent logic
│   ├── app/
│   │   ├── jason_agent.py    # Agent definitions & handoffs
│   │   ├── main.py           # FastAPI server & ChatKit integration
│   │   └── memory_store.py   # Thread & attachment storage
│   └── requirements.txt
│
├── frontend-v2/         # React frontend with ChatKit UI
│   ├── src/
│   │   ├── components/       # ChatKit panel & UI components
│   │   └── lib/config.ts     # Environment & API config
│   └── package.json
│
├── docs/
│   ├── archive/              # Historical troubleshooting docs
│   └── chatkit-reference/    # ChatKit documentation & samples
│
└── diagnose-chatkit.sh       # Diagnostic tool for troubleshooting
```

## 🎯 Features

### Agent System
- **Smart Triage**: Automatically routes to quick response or strategy agent
- **Agent Handoffs**: Seamless transitions between specialized agents
- **Parallel Tool Calls**: 3-5x faster tool execution
- **Session Memory**: Persistent conversation history via SQLite

### Tools & Capabilities
- **File Search**: Vector store search through coaching templates & frameworks
- **Web Search**: Real-time trend analysis and current information
- **Image Analysis**: Thumbnail and screenshot feedback
- **Text File Support**: Process markdown, txt, json files
- **Multi-file Attachments**: Upload up to 5 files per message (20MB each)

### Performance Optimizations
- GPT-5 with medium reasoning effort for quality responses
- GPT-5-mini for fast triage and routing (90% cost reduction)
- Parallel tool execution
- Reduced vector search results (5 vs 10) for 10-20% speed boost
- Conditional tracing (debug mode only)

## 🛠️ Development

### Prerequisites
- Python 3.13+
- Node.js 18+
- OpenAI API key

### Backend Setup

```bash
cd backend-v2
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Set environment variables
export OPENAI_API_KEY="your-key-here"
export JASON_VECTOR_STORE_ID="your-vector-store-id"

# Run server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend Setup

```bash
cd frontend-v2
npm install
npm run dev
```

Frontend runs on `http://localhost:5173`

### Diagnostic Tool

Run the diagnostic script to verify configuration:

```bash
./diagnose-chatkit.sh
```

This checks:
- ✅ Frontend/backend versions
- ✅ Dependency conflicts
- ✅ Proxy configuration
- ✅ CORS settings
- ✅ Environment variables
- ✅ Port availability

## 📊 Agent Architecture

```
User Message
    ↓
Triage Agent (GPT-5-mini)
    ↓
    ├─→ Quick Response Agent (GPT-5-mini)
    │   └─→ Fast, casual responses
    │       No tools, optimized for speed
    │
    └─→ Strategy Agent (GPT-5)
        └─→ Complex strategy, templates, analysis
            Tools: file_search, web_search, image analysis
```

## 🔧 Configuration

### Model Settings

```python
# backend-v2/app/main.py
ModelSettings(
    parallel_tool_calls=True,      # Enable parallel execution
    reasoning_effort="medium",     # GPT-5 reasoning depth
    verbosity="low",               # Concise responses
)
```

### Agent Models

```python
# backend-v2/app/jason_agent.py
triage_agent = Agent(model="gpt-5-mini")      # Fast routing
quick_response_agent = Agent(model="gpt-5-mini")  # Quick answers
strategy_agent = Agent(model="gpt-5")         # Deep strategy
```

## 🚀 Deployment

### Backend (Railway)
- Auto-deploys from `main` branch
- Environment variables set in Railway dashboard
- Health check: `https://your-backend.railway.app/health`

### Frontend (Vercel)
- Auto-deploys from `main` branch
- Environment variables in Vercel project settings
- Production URL: `https://your-app.vercel.app`

## 📝 Environment Variables

### Backend
```bash
OPENAI_API_KEY=sk-...
JASON_VECTOR_STORE_ID=vs_...
DEBUG_MODE=false  # Enable for detailed logging
```

### Frontend
```bash
VITE_API_BASE=https://your-backend.railway.app/
VITE_CHATKIT_API_DOMAIN_KEY=domain_pk_...
```

## 🐛 Troubleshooting

### Blank Screen
Run `./diagnose-chatkit.sh` to check for:
- Version conflicts
- Missing dependencies
- Proxy misconfiguration

### Text Files Not Working
Ensure backend is deployed with latest code (text file support added Oct 9, 2025)

### Slow Responses
- Check `reasoning_effort` setting (medium = balanced)
- Verify parallel_tool_calls is enabled
- Review tool execution in debug mode

## 📚 Documentation

- **Archive**: Historical troubleshooting guides in `docs/archive/`
- **ChatKit Reference**: Official docs and samples in `docs/chatkit-reference/`
- **Deployment**: See `DEPLOYMENT.md` in frontend/backend folders
- **Testing**: See `TESTING_GUIDE.md` for test procedures

## 🎨 Voice & Personality

Jason's agent uses a casual, authentic voice:
- Talks like texting a friend
- Uses "yo," "bet," "lowkey," "no cap"
- Strategic cursing for emphasis
- Explains like talking to a little brother
- No corporate jargon or formal language

See `backend-v2/app/jason_agent.py` for full personality instructions.

## 📈 Performance Metrics

- **Triage routing**: ~200ms (GPT-5-mini)
- **Quick responses**: ~500ms average
- **Strategy responses**: 1-3s (with tools)
- **File search**: ~800ms (5 results)
- **Web search**: ~1.5s
- **Cost**: 90% reduction using GPT-5-mini for triage

## 🔐 Security

- CORS configured for localhost:5173 (dev) and production domains
- File uploads validated by MIME type
- Session IDs generated client-side
- No sensitive data in git (see `.gitignore`)

## 📞 Support

For issues or questions:
1. Run `./diagnose-chatkit.sh` for automated checks
2. Check `docs/archive/` for troubleshooting guides
3. Review Railway/Vercel deployment logs

---

**Last Updated**: October 9, 2025  
**ChatKit Version**: 0.0.2 (backend) / 0.0.0 (frontend)  
**Agent SDK Version**: 0.3.3  
**Models**: GPT-5 + GPT-5-mini

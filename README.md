# Jason's CoachGPT - Creator Accelerator

AI-powered coaching assistant built with OpenAI ChatKit and Agents SDK, providing personalized guidance using Jason's proven frameworks and strategies.

## 🚀 Live Demo

**Frontend**: https://jason-coaching-hub.vercel.app/  
**Backend**: Railway (private)

## 📁 Project Structure

```
├── backend-v2/          # FastAPI backend with ChatKit server (Railway)
│   ├── app/
│   │   ├── main.py           # FastAPI routes & ChatKit endpoint
│   │   ├── jason_agent.py    # AI agent with coaching knowledge
│   │   └── memory_store.py   # Session-based memory storage
│   └── requirements.txt
│
├── frontend-v2/         # React + TypeScript frontend (Vercel)
│   ├── src/
│   │   ├── components/
│   │   │   ├── ChatKitPanel.tsx    # Main chat interface
│   │   │   ├── KnowledgeBase.tsx   # File management
│   │   │   └── FileManager.tsx     # Vector store files
│   │   └── lib/
│   │       └── config.ts           # API configuration
│   └── package.json
│
├── CHANGELOG.md         # Version history
├── VERCEL_MIGRATION.md  # Deployment guide
└── README.md           # This file
```

## 🛠 Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development
- **Tailwind CSS** for styling
- **OpenAI ChatKit** for chat UI
- Deployed on **Vercel**

### Backend
- **Python 3.13** with FastAPI
- **OpenAI Agents SDK** for AI agent
- **ChatKit Python SDK** for server
- **File Search** with vector store
- Deployed on **Railway**

## 🔧 Local Development

### Prerequisites
- Node.js 18+
- Python 3.13+
- OpenAI API key

### Frontend Setup
```bash
cd frontend-v2
npm install
npm run dev
```

### Backend Setup
```bash
cd backend-v2
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
export OPENAI_API_KEY="your-key-here"
uvicorn app.main:app --reload
```

## 🌐 Deployment

### Frontend (Vercel)
- Auto-deploys from `main` branch
- Environment variables configured in Vercel dashboard
- Custom domain: https://jason-coaching-hub.vercel.app/

### Backend (Railway)
- Auto-deploys from `main` branch
- Environment variables configured in Railway dashboard
- CORS configured for Vercel domain

## 📝 Features

- ✅ AI-powered coaching conversations
- ✅ Session-based chat history (persists in browser tab)
- ✅ File upload to vector store for knowledge base
- ✅ Dark/light theme toggle
- ✅ Mobile-responsive design
- ✅ Real-time streaming responses

## 🔐 Environment Variables

### Frontend
- `VITE_API_BASE` - Backend API URL (Railway)
- `VITE_CHATKIT_API_DOMAIN_KEY` - OpenAI domain key

### Backend
- `OPENAI_API_KEY` - OpenAI API key
- `JASON_VECTOR_STORE_ID` - Vector store ID for File Search

## 📚 Documentation

- [CHANGELOG.md](./CHANGELOG.md) - Version history and changes
- [VERCEL_MIGRATION.md](./VERCEL_MIGRATION.md) - Detailed deployment guide
- [backend-v2/README.md](./backend-v2/README.md) - Backend documentation
- [frontend-v2/DEPLOYMENT.md](./frontend-v2/DEPLOYMENT.md) - Frontend deployment

## 🤝 Contributing

This is a private coaching application. For issues or questions, contact the repository owner.

## 📄 License

Private - All rights reserved.


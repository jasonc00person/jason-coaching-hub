# JasonGPT - AI Coaching Assistant

A modern AI coaching assistant built with OpenAI's ChatKit and FastAPI.

## 🚀 Quick Start

See [START_HERE.md](START_HERE.md) for setup instructions.

## 📁 Project Structure

```
├── backend-v2/          # FastAPI backend with ChatKit integration
│   ├── app/             # Main application code
│   ├── venv/            # Python virtual environment (not in git)
│   └── conversations.db # SQLite database (not in git)
│
├── frontend-v2/         # React + Vite frontend (Active)
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── hooks/       # Custom React hooks
│   │   └── lib/         # Utility functions
│   └── public/          # Static assets
│
├── frontend-v3/         # Next.js frontend (Experimental)
│
├── docs/                # Documentation
│   ├── archive/         # Archived/historical docs
│   ├── guides/          # User guides and references
│   └── chatkit-reference/ # ChatKit API reference
│
└── scripts/             # Deployment and utility scripts
    ├── push-to-production.sh
    ├── push-to-staging.sh
    └── stress-test.sh
```

## 🎯 Features

- **Modern UI**: Built with OpenAI ChatKit components
- **Collapsible Sidebar**: Conversation history with auto-generated titles
- **Theme Support**: Light and dark mode
- **Session Management**: Per-session conversation persistence
- **Auto-Naming**: Conversations automatically titled from first user message

## 📚 Documentation

- **[START_HERE.md](START_HERE.md)** - Setup and getting started guide
- **[CHANGELOG.md](CHANGELOG.md)** - Version history and updates
- **[docs/guides/](docs/guides/)** - Detailed guides:
  - `DEPLOYMENT.md` - Deployment instructions
  - `ENVIRONMENT_VARIABLES.md` - Configuration reference
  - `GIT_WORKFLOW.md` - Git branching strategy
  - `TESTING_GUIDE.md` - Testing procedures
  - And more...

## 🛠️ Tech Stack

**Frontend:**
- React 18
- TypeScript
- Vite
- Tailwind CSS
- OpenAI ChatKit

**Backend:**
- FastAPI
- Python 3.11
- OpenAI ChatKit Server SDK
- In-memory session store

## 🚢 Deployment

- **Production**: Deployed on Railway/Vercel
- **Staging**: `dev` branch auto-deploys to staging environment

See [docs/guides/DEPLOYMENT.md](docs/guides/DEPLOYMENT.md) for details.

## 📝 Development

### Backend
```bash
cd backend-v2
source venv/bin/activate
uvicorn app.main:app --reload --port 8000
```

### Frontend
```bash
cd frontend-v2
npm install
npm run dev
```

## 🔒 Environment Variables

See [docs/guides/ENVIRONMENT_VARIABLES.md](docs/guides/ENVIRONMENT_VARIABLES.md) for required configuration.

## 📜 License

Private repository - All rights reserved.

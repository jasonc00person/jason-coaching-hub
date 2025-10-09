# Jason's Coaching ChatKit Integration (Refactored)

Complete ChatKit integration following the official OpenAI template pattern with **direct vector store access**.

## 🎯 Key Improvements Over V1

### What Changed:
✅ **No more Agent Builder dependency** - Custom agent using OpenAI Agents SDK  
✅ **Direct Vector Store Access** - Agent directly queries your vector store  
✅ **ChatKit Python SDK** - Proper server implementation with streaming  
✅ **Custom API Configuration** - Uses `api: { url, domainKey }` instead of sessions  
✅ **Better Architecture** - Follows official OpenAI ChatKit advanced samples pattern  

### Why This Is Better:
- 🔧 **Full Control** - You control the agent configuration, not Agent Builder
- 📚 **Vector Store Works** - File Search tool directly connected to your knowledge base
- 🚀 **Production Ready** - Based on official OpenAI template
- 🎨 **Customizable** - Easy to modify agent behavior, styling, and features

## 📁 Project Structure

```
Agent Builder Demo 2/
├── backend-v2/                 # NEW FastAPI + ChatKit Python SDK
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py            # FastAPI with ChatKit server
│   │   ├── jason_agent.py     # Agent configuration with vector store
│   │   └── memory_store.py    # Thread storage
│   ├── requirements.txt       # Python dependencies
│   └── .gitignore
│
├── frontend-v2/               # NEW React + TypeScript + Vite
│   ├── src/
│   │   ├── components/
│   │   │   └── ChatKitPanel.tsx
│   │   ├── lib/
│   │   │   └── config.ts     # API configuration
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   ├── package.json
│   ├── vite.config.ts
│   └── tailwind.config.js
│
└── package-v2.json           # Root scripts (to be created)
```

## 🚀 Setup Instructions

### Prerequisites

- Python 3.11+
- Node.js 18+
- OpenAI API Key
- **Vector Store ID** from your OpenAI dashboard

### Step 1: Get Your Vector Store ID

1. Go to: https://platform.openai.com/storage/vector_stores
2. Find "Jason's Coaching Knowledge" (or your vector store)
3. Copy the ID (format: `vs_...`)

### Step 2: Install Backend Dependencies

```bash
cd backend-v2

# Install Python packages
pip3 install -r requirements.txt

# Set environment variables
export OPENAI_API_KEY="sk-proj-your-key-here"
export JASON_VECTOR_STORE_ID="vs_68e6b33ec38481919601875ea1e2287c"

# Start the server
python3 -m uvicorn app.main:app --reload --port 8000
```

The backend will run on: **http://localhost:8000**

### Step 3: Install Frontend Dependencies

```bash
cd frontend-v2

# Install packages
npm install

# Start the dev server
npm run dev
```

The frontend will run on: **http://localhost:5173**

### Step 4: Test It!

Open http://localhost:5173 and try:
- "Show me some of your hook templates"
- "What's in the ICP framework?"
- "Give me a YouTube script template"

**If the agent references your files, IT'S WORKING! 🎉**

## 🔧 Configuration

### Backend Configuration

**File:** `backend-v2/app/jason_agent.py`

```python
# Change the vector store ID
JASON_VECTOR_STORE_ID = os.getenv("JASON_VECTOR_STORE_ID", "vs_your_id_here")

# Modify agent instructions
JASON_INSTRUCTIONS = """
Your custom instructions here...
"""

# Adjust model and settings
jason_agent = Agent[AgentContext](
    model="gpt-4o-mini",  # or "gpt-4o", "gpt-4-turbo"
    name="Jason Cooperson",
    instructions=JASON_INSTRUCTIONS,
    tools=[build_file_search_tool()],
)
```

### Frontend Configuration

**File:** `frontend-v2/src/lib/config.ts`

```typescript
// Change greeting
export const GREETING = "Your custom greeting...";

// Modify starter prompts
export const STARTER_PROMPTS: StartScreenPrompt[] = [
  {
    label: "Your Label",
    prompt: "Your prompt text",
    icon: "sparkle",  // ChatKit icon name
  },
  // ... more prompts
];

// Change placeholder
export const COMPOSER_PLACEHOLDER = "Your placeholder...";
```

## 🎨 Customization Guide

### Change the Agent's Personality

Edit `backend-v2/app/jason_agent.py` → `JASON_INSTRUCTIONS`

### Add More Tools

```python
from agents.models.openai_responses import FunctionTool

def my_custom_tool():
    # Your tool logic
    pass

jason_agent = Agent[AgentContext](
    model="gpt-4o-mini",
    instructions=JASON_INSTRUCTIONS,
    tools=[
        build_file_search_tool(),
        FunctionTool(function=my_custom_tool),  # Add your tool
    ],
)
```

### Change UI Theme

Edit `frontend-v2/src/components/ChatKitPanel.tsx`:

```typescript
theme: {
  colorScheme: theme,
  color: {
    accent: {
      primary: "#your-color",  // Change accent color
      level: 2,
    },
  },
  radius: "round",  // "pill" | "round" | "soft" | "sharp"
  density: "normal",  // "compact" | "normal" | "spacious"
},
```

## 📊 How It Works

### Architecture Flow:

1. **Frontend** sends message to `/chatkit` endpoint
2. **Backend** receives message via ChatKit server
3. **Agent** processes message, searches vector store if needed
4. **File Search Tool** queries your "Jason's Coaching Knowledge" vector store
5. **Agent** generates response based on vector store content
6. **Backend** streams response back to frontend
7. **ChatKit UI** displays the response with citations

### Key Components:

- **`jason_agent.py`** - Agent configuration with vector store connection
- **`main.py`** - FastAPI server with ChatKit integration
- **`memory_store.py`** - In-memory thread storage (can be replaced with database)
- **`ChatKitPanel.tsx`** - React component wrapping ChatKit
- **`config.ts`** - Frontend configuration for API and UI

## 🐛 Troubleshooting

### Vector Store Not Working?

1. Check the vector store ID is correct
2. Ensure files are uploaded to the vector store
3. Verify `OPENAI_API_KEY` has access to the vector store
4. Check backend logs for errors

### Backend Won't Start?

```bash
# Make sure you're using Python 3.11+
python3 --version

# Install dependencies again
cd backend-v2
pip3 install -r requirements.txt

# Check for errors
python3 -m uvicorn app.main:app --reload --port 8000
```

### Frontend Won't Connect?

1. Check backend is running on port 8000
2. Verify Vite proxy configuration in `vite.config.ts`
3. Check browser console for errors
4. Try hard refresh (Cmd+Shift+R or Ctrl+Shift+R)

### Agent Not Using Vector Store?

- Make sure your prompt explicitly asks for content from the knowledge base
- Try: "What templates do you have in your files?"
- Check backend logs to see if File Search tool is being called

## 🚀 Next Steps

- [ ] Deploy backend to production (e.g., Railway, Render, AWS)
- [ ] Register domain on OpenAI allowlist
- [ ] Replace `domain_pk_localhost_dev` with real domain key
- [ ] Add authentication/authorization
- [ ] Implement persistent storage (replace MemoryStore)
- [ ] Add analytics and monitoring

## 📝 Comparison: V1 vs V2

| Feature | V1 (Original) | V2 (Refactored) |
|---------|--------------|-----------------|
| Agent | Agent Builder | Custom Agent SDK |
| Backend | Session creation only | Full ChatKit server |
| Vector Store | Via Agent Builder (broken) | Direct connection ✅ |
| Configuration | Fixed workflow | Fully customizable |
| Architecture | getClientSecret pattern | Custom API pattern |
| Based On | Custom implementation | Official OpenAI template |

## 🎯 Success Criteria

✅ Agent responds to messages  
✅ Agent searches vector store when asked about templates/frameworks  
✅ Agent cites content from uploaded files  
✅ UI shows conversation history  
✅ Theme switching works  
✅ Starter prompts work  

---

**Built with the official OpenAI ChatKit advanced samples pattern** 🚀

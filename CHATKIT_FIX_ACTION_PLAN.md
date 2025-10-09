# ChatKit Fix - Action Plan
**Status:** Ready to Execute  
**Estimated Time:** 15-20 minutes  
**Last Updated:** October 9, 2025

---

## 🎯 Objective

Fix the blank screen issue by:
1. Eliminating version conflicts (`@openai/chatkit@1.0.0` vs `0.0.0`)
2. Pinning to exact versions from official samples
3. Ensuring proper proxy/CORS/SSE configuration
4. Validating with minimal smoke tests

---

## ✅ Pre-Flight Checklist

Before starting, verify:
- [ ] Backend and frontend are currently stopped
- [ ] You have backups (we'll create timestamped ones)
- [ ] You're in the project root: `/Users/jasoncooperson/Documents/Agent Builder Demo 2`

---

## 📋 Step-by-Step Execution Plan

### Phase 1: Version Pinning (5 min)

#### 1.1 Frontend - Pin Exact Versions
**File:** `frontend-v2/package.json`

**Change FROM:**
```json
{
  "dependencies": {
    "@openai/chatkit": "^1.0.0",  // ← DELETE THIS LINE
    "@openai/chatkit-react": "^0",
    "react": "^19.2.0",
    "react-dom": "^19.2.0"
  }
}
```

**Change TO:**
```json
{
  "dependencies": {
    "@openai/chatkit-react": "0.0.0",  // ← EXACT VERSION, NO ^
    "react": "^19.2.0",
    "react-dom": "^19.2.0"
  }
}
```

**Why:** 
- Removes rogue `@openai/chatkit@1.0.0` dependency
- Pins to exact version (no `^`) to prevent auto-upgrades during debugging
- Matches official OpenAI samples

---

#### 1.2 Backend - Pin Exact Versions
**File:** `backend-v2/requirements.txt`

**Change FROM:**
```txt
openai-chatkit>=0.1.0
```

**Change TO:**
```txt
openai-chatkit==0.0.2
```

**Why:** Exact pin prevents pip from grabbing newer incompatible versions

---

### Phase 2: Clean Installation (5 min)

#### 2.1 Frontend Clean Install
```bash
cd "/Users/jasoncooperson/Documents/Agent Builder Demo 2/frontend-v2"

# Backup
cp package.json "package.json.backup.$(date +%Y%m%d_%H%M%S)"

# Clean slate
rm -rf node_modules package-lock.json .vite dist

# Nuclear option for npm cache
npm cache clean --force

# Fresh install with exact versions
npm install

# CRITICAL: Verify single deduped tree
npm ls @openai/chatkit @openai/chatkit-react
```

**Expected Output:**
```
jason-coaching-chatkit@1.0.0
└─┬ @openai/chatkit-react@0.0.0
  └── @openai/chatkit@0.0.0 deduped
```

✅ **Success:** Only ONE `@openai/chatkit@0.0.0` appears  
❌ **Failure:** Multiple versions or `1.0.0` anywhere → re-run clean install

---

#### 2.2 Backend Clean Install
```bash
cd "/Users/jasoncooperson/Documents/Agent Builder Demo 2/backend-v2"

# Backup
cp requirements.txt "requirements.txt.backup.$(date +%Y%m%d_%H%M%S)"

# Activate venv
source venv/bin/activate

# Upgrade pip first
pip install --upgrade pip

# Install exact version
pip install --force-reinstall openai-chatkit==0.0.2

# Verify
pip show openai-chatkit
```

**Expected Output:**
```
Name: openai-chatkit
Version: 0.0.2
...
```

---

### Phase 3: Configuration Validation (5 min)

#### 3.1 Vite Proxy Check
**File:** `frontend-v2/vite.config.ts`

**Must have:**
```typescript
export default defineConfig({
  server: {
    proxy: {
      '/chatkit': {
        target: 'http://localhost:8000',  // ← Backend URL
        changeOrigin: true,
        secure: false,
      }
    }
  }
})
```

**Why:** Frontend calls `/chatkit` → must proxy to FastAPI backend's `/chatkit` mount

---

#### 3.2 CORS Configuration
**File:** `backend-v2/app/main.py`

**Must have:**
```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # ← Vite dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

**Why:** Without CORS, browser blocks SSE streaming

---

#### 3.3 Environment Variables
**File:** `frontend-v2/src/lib/config.ts`

**Must export:**
```typescript
export const CHATKIT_API_URL = import.meta.env.VITE_CHATKIT_API_URL || "/chatkit";
export const CHATKIT_API_DOMAIN_KEY = import.meta.env.VITE_CHATKIT_API_DOMAIN_KEY || "default";
```

**And in `ChatKitPanel.tsx`:**
```typescript
const chatkit = useChatKit({
  api: { 
    url: CHATKIT_API_URL,           // ← Must be defined
    domainKey: CHATKIT_API_DOMAIN_KEY,  // ← Must be defined
  },
  // ...
});
```

---

#### 3.4 Strip Custom ProgressUpdateEvent
**File:** `backend-v2/app/main.py`

**Find and COMMENT OUT:**
```python
# Lines ~27-30 - Comment out:
# try:
#     from chatkit.types import ProgressUpdateEvent
# except ImportError:
#     ProgressUpdateEvent = None

# Lines ~261-269 - Comment out custom progress events:
# if ProgressUpdateEvent:
#     yield ProgressUpdateEvent(...)
```

**Keep it simple:**
```python
async for event in stream_agent_response(agent_context, result):
    yield event  # ← Just pass through raw events
```

**Why:** `ProgressUpdateEvent` might not exist in 0.0.2, causes import errors

---

### Phase 4: Minimal Smoke Tests (5 min)

#### 4.1 Start Services
```bash
# Terminal 1: Backend
cd "/Users/jasoncooperson/Documents/Agent Builder Demo 2/backend-v2"
source venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Terminal 2: Frontend
cd "/Users/jasoncooperson/Documents/Agent Builder Demo 2/frontend-v2"
npm run dev
```

**Wait for:**
- Backend: `Application startup complete`
- Frontend: `Local: http://localhost:5173/`

---

#### 4.2 Test Sequence

**Test 1: Basic Text Streaming**
1. Open http://localhost:5173
2. Send message: `"hello"`
3. **Expected:** 
   - ✅ ChatKit UI appears (NOT blank)
   - ✅ Response streams back word-by-word
   - ✅ No console errors

**Test 2: Tool Execution (File Search)**
1. Send message: `"What templates do you have?"`
2. **Expected:**
   - ✅ Tool call indicator appears
   - ✅ See `tool_start` → `tool_progress` → `tool_end` in Network tab (SSE)
   - ✅ Results display in UI

**Test 3: File Upload (Optional)**
1. Click attachment icon
2. Upload a small image/file
3. Send message: `"What did I just upload?"`
4. **Expected:**
   - ✅ File appears in message
   - ✅ Backend processes it
   - ✅ Response references the file

---

### Phase 5: Diagnostic Collection (if issues persist)

If blank screen persists after Phase 1-4, collect:

#### 5.1 Version Check
```bash
cd frontend-v2
npm ls @openai/chatkit @openai/chatkit-react > versions.txt
```

#### 5.2 Console Errors
- Open browser F12 → Console
- Copy first 30 lines of red errors
- Save to `console-errors.txt`

#### 5.3 Network Tab
- F12 → Network → Filter: `chatkit`
- Send a message
- Check:
  - Is `/chatkit` endpoint called?
  - Status code? (should be 200)
  - Response type? (should be `text/event-stream`)
  - Any data streaming? (should see `data: {...}` chunks)

#### 5.4 Backend Logs
- Check terminal running backend
- Copy any Python errors/stack traces
- Save to `backend-errors.txt`

#### 5.5 Config Snapshot
```bash
# Vite proxy config
cat frontend-v2/vite.config.ts | grep -A 10 "proxy"

# Env vars being used
grep -r "CHATKIT_API" frontend-v2/src/

# Backend CORS
grep -A 5 "CORSMiddleware" backend-v2/app/main.py
```

---

## 🚨 Common Pitfalls & Solutions

### Pitfall 1: Multiple ChatKit Versions
**Symptom:** `npm ls` shows both `0.0.0` and `1.0.0`  
**Fix:** 
```bash
rm -rf node_modules package-lock.json
npm cache clean --force
# Ensure package.json has NO @openai/chatkit line
npm install
```

---

### Pitfall 2: Proxy Path Mismatch
**Symptom:** Network tab shows 404 for `/chatkit`  
**Fix:** 
- Frontend calls: `/chatkit`
- Vite proxies: `/chatkit` → `http://localhost:8000`
- Backend mounts: `app.mount("/chatkit", chatkit_server.app)`
- All three must match exactly

---

### Pitfall 3: CORS Blocking SSE
**Symptom:** Console error: "CORS policy blocked"  
**Fix:**
```python
# backend-v2/app/main.py
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # ← Your Vite dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

### Pitfall 4: Buffered SSE Stream
**Symptom:** No streaming, response appears all at once  
**Fix:** 
- Dev mode: Usually fine
- Production (nginx/Cloudflare):
  ```nginx
  proxy_buffering off;
  proxy_set_header Connection '';
  proxy_http_version 1.1;
  ```

---

### Pitfall 5: Missing Env Vars
**Symptom:** `chatkit.control` is undefined  
**Fix:**
```typescript
// frontend-v2/src/lib/config.ts
export const CHATKIT_API_URL = "/chatkit";  // ← Hardcode for dev
export const CHATKIT_API_DOMAIN_KEY = "default";
```

---

## 📊 Success Criteria

After completing all phases:

### Browser Console
```
✅ [ChatKitPanel] Control: ✅ Ready
✅ [ChatKitPanel] useChatKit returned: { hasControl: true }
❌ NO errors about "Cannot read property"
❌ NO module loading errors
```

### Network Tab
```
✅ POST /chatkit → 200 OK
✅ Content-Type: text/event-stream
✅ Response streaming: data: {...}\n\ndata: {...}\n\n
```

### Terminal (Backend)
```
✅ [ChatKit] Processing request for session: abc123
✅ [ChatKit] Tool call: file_search
✅ [ChatKit] Streaming response...
```

### User Experience
```
✅ ChatKit UI renders immediately (< 1 second)
✅ Can send messages
✅ Responses stream smoothly
✅ Tools execute with visual feedback
✅ No blank screens
✅ No freezing
```

---

## 🎯 Decision Tree

```
Start
  ↓
Pin exact versions (0.0.0 / 0.0.2)
  ↓
Clean install
  ↓
npm ls shows single version? 
  ├─ NO → Re-run clean install
  └─ YES → Continue
       ↓
Check proxy config
  ↓
Check CORS config
  ↓
Strip custom events
  ↓
Start services
  ↓
Test "hello" message
  ├─ Blank screen → Check console errors
  ├─ 404 error → Check proxy path
  ├─ CORS error → Check CORS config
  └─ Works! → Test tools
       ↓
Test file_search
  ├─ No tool viz → Check SSE streaming
  └─ Works! → Test file upload
       ↓
All tests pass → SUCCESS! 🎉
```

---

## 🚀 Quick Command Reference

```bash
# Full reset and fix
cd frontend-v2
rm -rf node_modules package-lock.json .vite dist
npm cache clean --force
# Edit package.json: remove @openai/chatkit, pin chatkit-react to 0.0.0
npm install
npm ls @openai/chatkit @openai/chatkit-react

cd ../backend-v2
source venv/bin/activate
# Edit requirements.txt: pin to openai-chatkit==0.0.2
pip install --force-reinstall openai-chatkit==0.0.2
pip show openai-chatkit

# Start services
# Terminal 1:
cd backend-v2 && source venv/bin/activate && uvicorn app.main:app --reload

# Terminal 2:
cd frontend-v2 && npm run dev

# Test
open http://localhost:5173
```

---

## 📞 If Still Stuck

Provide these outputs:
1. `npm ls @openai/chatkit @openai/chatkit-react`
2. First 30 lines of browser console errors
3. `cat frontend-v2/vite.config.ts | grep -A 10 proxy`
4. `grep -A 5 CORSMiddleware backend-v2/app/main.py`
5. Network tab screenshot showing `/chatkit` request

---

## 🎓 Key Principles

1. **Exact versions during debugging** - No `^` or `>=`, lock everything
2. **Single source of truth** - Only `chatkit-react` brings in `chatkit`
3. **Match official samples** - They're tested and verified
4. **Proxy paths must align** - Frontend → Vite → Backend (all `/chatkit`)
5. **CORS for dev** - Must allow `localhost:5173`
6. **Keep events raw** - Don't inject custom types that don't exist
7. **Test incrementally** - Basic → Tools → Advanced features

---

## ✨ Next Steps After Fix

Once basic chat works:
1. ✅ Test all tools (file_search, web_search)
2. ✅ Test file uploads
3. ✅ Add back widgets (if they exist in 0.0.0)
4. ✅ Add back entity tagging (if it exists in 0.0.0)
5. ✅ Add back client tools (if they exist in 0.0.0)
6. ✅ Monitor for official 1.x release
7. ✅ Plan migration to stable versions when available

---

**Ready to execute? Start with Phase 1! 🚀**


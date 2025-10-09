# ChatKit Upgrade Plan
**Your Personalized Migration Guide**

## 🚨 Current Problem: Version Conflict

### What's Installed Now
**Frontend:**
- `@openai/chatkit@0.0.0` (via chatkit-react dependency)
- `@openai/chatkit@1.0.0` (direct install) ← **CONFLICT!**
- `@openai/chatkit-react@0.0.0` (outdated)

**Backend:**
- `openai-chatkit>=0.1.0` (very old)
- `openai-agents>=0.3.3`

### Why You're Getting a Blank Screen
**Two versions of ChatKit are fighting each other:**
1. Your `package.json` has `@openai/chatkit: ^1.0.0`
2. But `@openai/chatkit-react@0.0.0` depends on `@openai/chatkit@0.0.0`
3. npm installed BOTH versions (0.0.0 and 1.0.0)
4. React hooks initialize with one version, but imports reference another
5. Result: initialization fails silently → blank screen

### Evidence in Your Code
Your backend already has version compatibility workarounds:

```python
# main.py lines 27-30
try:
    from chatkit.types import ProgressUpdateEvent
except ImportError:
    # Fallback if ProgressUpdateEvent doesn't exist
    ProgressUpdateEvent = None
```

This proves you've been fighting version mismatches.

---

## ✅ The Solution: Sync All Versions

### Latest Stable Versions Available
- `@openai/chatkit@1.0.0` (latest)
- `@openai/chatkit-react@1.1.1` (latest)
- `openai-chatkit` (Python) - need to check latest on PyPI
- `openai-agents` - check for latest

---

## 📋 Step-by-Step Upgrade Process

### **Phase 1: Clean Frontend Install**

#### 1.1. Remove Conflicting Dependencies
```bash
cd "/Users/jasoncooperson/Documents/Agent Builder Demo 2/frontend-v2"

# Remove node_modules and lock file
rm -rf node_modules package-lock.json

# Clean npm cache
npm cache clean --force
```

#### 1.2. Update package.json
**Change from:**
```json
{
  "dependencies": {
    "@openai/chatkit": "^1.0.0",
    "@openai/chatkit-react": "^0",  // ← This is the problem
  }
}
```

**Change to:**
```json
{
  "dependencies": {
    "@openai/chatkit": "1.0.0",           // Pin exact version
    "@openai/chatkit-react": "1.1.1",     // Latest stable
  }
}
```

#### 1.3. Fresh Install
```bash
npm install
```

#### 1.4. Verify Single Version
```bash
npm list @openai/chatkit @openai/chatkit-react
```

**Expected output:**
```
jason-coaching-chatkit@1.0.0
├── @openai/chatkit-react@1.1.1
│   └── @openai/chatkit@1.0.0 deduped
└── @openai/chatkit@1.0.0
```

**Key:** You should see "deduped" meaning npm reused the same version.

---

### **Phase 2: Update Backend**

#### 2.1. Check Latest Python Package Versions
```bash
cd "/Users/jasoncooperson/Documents/Agent Builder Demo 2/backend-v2"
source venv/bin/activate

# Check latest versions
pip index versions openai-chatkit
pip index versions openai-agents
```

#### 2.2. Update requirements.txt
Update to latest stable versions (check output from above):

```txt
# Before
openai-chatkit>=0.1.0
openai-agents>=0.3.3

# After (example - use actual latest versions)
openai-chatkit==0.3.0  # Or whatever is latest
openai-agents==0.5.0   # Or whatever is latest
```

#### 2.3. Upgrade Packages
```bash
pip install --upgrade -r requirements.txt
```

#### 2.4. Test Backend Imports
```bash
python -c "from chatkit.types import ProgressUpdateEvent; print('✅ ProgressUpdateEvent imported successfully')"
python -c "from chatkit.agents import stream_agent_response; print('✅ stream_agent_response imported successfully')"
```

---

### **Phase 3: Code Changes (Event Schema Updates)**

After upgrading, you'll likely need to update event handling due to schema changes.

#### 3.1. Backend Changes

**A. Remove Fallback Workarounds**

Since `ProgressUpdateEvent` will exist in newer versions:

```python
# main.py - BEFORE (lines 27-30)
try:
    from chatkit.types import ProgressUpdateEvent
except ImportError:
    ProgressUpdateEvent = None

# AFTER - direct import
from chatkit.types import ProgressUpdateEvent
```

**B. Update Event Creation**

Check if `ProgressUpdateEvent` signature changed:

```python
# main.py lines 261-269
# BEFORE
if ProgressUpdateEvent is not None:
    try:
        thinking_event = ProgressUpdateEvent(text="🧠 Thinking...")
        yield thinking_event

# AFTER (might need to adjust based on new API)
thinking_event = ProgressUpdateEvent(message="🧠 Thinking...")  # Changed 'text' to 'message'?
yield thinking_event
```

#### 3.2. Frontend Changes

**A. Check Event Handler Signatures**

Your current handlers in `ChatKitPanel.tsx`:

```typescript
// Lines 227-232
onThreadChange: () => {
  console.log("[ChatKitPanel] Thread changed");
},
onResponseEnd: (response) => {
  console.log("[ChatKitPanel] Response ended", response);
},
onError: ({ error }) => {
  console.error("❌ [ChatKitPanel] ChatKit ERROR:", error);
},
```

**Potential changes in v1.1.1:**
- `onResponseEnd` might pass different response shape
- `onError` might have additional fields
- New lifecycle hooks might be available

**Add more detailed logging temporarily:**

```typescript
onThreadChange: (thread) => {
  console.log("[ChatKitPanel] Thread changed", {
    threadId: thread?.id,
    title: thread?.title,
    fullThread: thread
  });
},
onResponseEnd: (response) => {
  console.log("[ChatKitPanel] Response ended", {
    messageCount: response?.messages?.length,
    fullResponse: response
  });
},
```

---

### **Phase 4: Test Event Flow**

#### 4.1. Instrument Event Pipeline

Add temporary debugging to see what events are flowing:

**Backend (main.py):**

```python
# Add after line 310
async for chatkit_event in stream_agent_response(agent_context, result):
    # 🔍 TEMPORARY DEBUG
    print(f"[EVENT DEBUG] Type: {type(chatkit_event).__name__}")
    print(f"[EVENT DEBUG] Content: {chatkit_event}")
    
    yield chatkit_event
```

**Frontend (ChatKitPanel.tsx):**

Add a new event listener (if available in v1.1.1):

```typescript
// Add to useChatKit config
onEvent: (event) => {
  console.log("[ChatKit Event]", {
    type: event.type,
    data: event.data,
    timestamp: new Date().toISOString()
  });
},
```

#### 4.2. Test Scenarios

Run these tests in order:

1. **Simple message:** "Hey, what's up?"
   - Should see quick_response_agent handle it
   - Check for smooth streaming

2. **Tool-using message:** "What are your best hook templates?"
   - Should trigger file_search tool
   - Check for progress events (🔎 Searching knowledge base...)
   - Verify tool results appear

3. **Image upload:** Upload a thumbnail
   - Check attachment upload flow
   - Verify image analysis works

4. **Widget interaction:** Send message that returns a card widget
   - Check widget renders
   - Test button clicks

#### 4.3. Expected Event Flow

**Correct event sequence:**
```
1. User sends message
2. Backend: stream_start event
3. Backend: thinking_event (🧠 Thinking...)
4. Backend: tool_call_start (if tools used)
5. Backend: tool_progress (🔎 Searching...)
6. Backend: tool_call_end
7. Backend: response_chunk (text streaming)
8. Backend: response_end
9. Frontend: onResponseEnd triggered
```

**If you see gaps or missing events → version incompatibility**

---

### **Phase 5: Migration Compatibility Layer (If Needed)**

If you can't upgrade both frontend and backend simultaneously, create an adapter:

#### Backend Adapter (backwards compatibility)

```python
# backend-v2/app/adapters.py (new file)
from typing import Any, AsyncIterator
from chatkit.types import ThreadStreamEvent

async def adapt_events_for_v1(
    events: AsyncIterator[ThreadStreamEvent]
) -> AsyncIterator[dict[str, Any]]:
    """
    Convert new event format to v1.0.0 format if needed.
    """
    async for event in events:
        # Example: if event field names changed
        if hasattr(event, 'message'):
            # v1.1.1 uses 'message' field
            adapted = {**event, 'text': event.message}
            yield adapted
        else:
            yield event
```

#### Frontend Adapter (event normalization)

```typescript
// frontend-v2/src/lib/event-adapter.ts (new file)
export function normalizeChatkitEvent(event: any) {
  // Normalize event structure across versions
  return {
    type: event.type || event.eventType,
    data: event.data || event.payload,
    timestamp: event.timestamp || Date.now()
  };
}
```

---

## 🎯 Expected Outcomes

### After Successful Upgrade

1. **No blank screen** - ChatKit initializes properly
2. **Tool visualization works** - Progress indicators appear during tool use
3. **Streaming is smooth** - No lag or missing chunks
4. **Events log correctly** - All lifecycle hooks fire
5. **No console errors** - Clean browser and server logs

### Performance Improvements

With proper versions, you should see:
- **Faster initialization** (single version loaded)
- **Better type safety** (matched frontend/backend schemas)
- **Native tool progress** (no custom workarounds needed)
- **Widget support** (newer features available)

---

## 🛠️ Troubleshooting Guide

### Problem: Still Blank After Upgrade

**Check:**
```bash
# Frontend - verify single version
npm list @openai/chatkit

# Backend - verify imports work
python -c "from chatkit.types import ProgressUpdateEvent; print('OK')"

# Browser console - check for JS errors
# Look for: "Cannot read property 'control' of undefined"
```

**Fix:** Clear all caches
```bash
# Frontend
rm -rf node_modules .vite dist
npm install
npm run dev

# Backend
rm -rf venv
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

---

### Problem: Events Not Streaming

**Check backend logs:**
```python
# Add to main.py respond() method
print(f"[Stream Start] Thread: {thread.id}, Message: {message_text[:50]}")
```

**Check frontend logs:**
```typescript
// ChatKitPanel.tsx
onResponseStart: () => {
  console.log("✅ Response stream started");
},
```

**If no logs → API connection issue**
**If logs but no UI → event format mismatch**

---

### Problem: Tools Run But No Progress Indicators

**Old version issue:** `ProgressUpdateEvent` might not exist or have wrong signature

**Fix:** Check event creation in main.py lines 261-269:

```python
# Try this format
from chatkit.types import ProgressUpdateEvent

progress_event = ProgressUpdateEvent(
    type="progress_update",  # Might need explicit type
    message="🧠 Thinking...",  # Or 'text' depending on version
)
yield progress_event
```

---

### Problem: Type Errors After Upgrade

**Frontend TypeScript errors:**

```bash
# Regenerate types
npm run build  # This will show type mismatches

# Check if @types packages are needed
npm install --save-dev @types/node
```

**Backend type errors:**

```bash
# Update type stubs
pip install --upgrade types-openai

# Or suppress temporarily
mypy --ignore-missing-imports app/
```

---

## 📚 Reference: Breaking Changes by Version

### ChatKit v0.0.0 → v1.0.0

**Frontend:**
- `useChatKit` return value changed structure
- Event handlers now use named parameters
- `control` object structure changed

**Backend:**
- `ProgressUpdateEvent` added (didn't exist in v0.0.0)
- `stream_agent_response` signature stabilized
- Tool progress events formalized

### ChatKit-React v0.0.0 → v1.1.1

**New features added:**
- Better TypeScript types
- Improved widget support
- Entity tagging enhancements
- Performance optimizations

**API changes:**
- `onError` receives `{ error }` object (not just error)
- `uploadStrategy` config structure changed
- Theme configuration expanded

---

## 🚀 Quick Start Commands

```bash
# 1. Clean frontend
cd "/Users/jasoncooperson/Documents/Agent Builder Demo 2/frontend-v2"
rm -rf node_modules package-lock.json
# Edit package.json (set versions to 1.0.0 and 1.1.1)
npm install
npm list @openai/chatkit  # Verify single version

# 2. Update backend
cd "/Users/jasoncooperson/Documents/Agent Builder Demo 2/backend-v2"
source venv/bin/activate
# Edit requirements.txt (update versions)
pip install --upgrade -r requirements.txt
python -c "from chatkit.types import ProgressUpdateEvent; print('OK')"

# 3. Test locally
# Terminal 1 - Backend
cd backend-v2
source venv/bin/activate
uvicorn app.main:app --reload

# Terminal 2 - Frontend
cd frontend-v2
npm run dev

# 4. Open browser
open http://localhost:5173
# Check console for errors
# Try sending a message
```

---

## 📞 Next Steps

1. **Run Phase 1** (clean frontend install) first - this will likely fix your blank screen
2. **Document results** - what errors do you see (if any)?
3. **Then run Phase 2** (backend update) - this will enable tool visualization
4. **Test event flow** (Phase 4) - verify everything streams correctly
5. **Report back** - I'll help debug any remaining issues

---

## 💡 Pro Tips

1. **Pin exact versions** in package.json during migration (use `1.0.0` not `^1.0.0`)
2. **Upgrade one side first** (I recommend frontend first - it's faster to test)
3. **Keep old version in git branch** for easy rollback
4. **Test in production-like environment** before deploying
5. **Monitor performance** - newer versions should be faster

---

## 🔗 Useful Resources

- [ChatKit Python SDK Docs](https://openai.github.io/chatkit-python/)
- [ChatKit JS Events Guide](https://openai.github.io/chatkit-js/guides/events/)
- [OpenAI Agents SDK](https://openai.github.io/openai-agents-python/)
- [Custom ChatKit Docs](https://platform.openai.com/docs/guides/custom-chatkit)

---

**Ready to start?** Begin with Phase 1 (frontend cleanup) and let me know what you see!


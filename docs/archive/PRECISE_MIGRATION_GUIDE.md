# Precise ChatKit Migration Guide
**Based on Official OpenAI Sample Repo Analysis**

## 📊 Version Comparison

### What OpenAI's Official Samples Use

**Backend (Python):**
```toml
dependencies = [
    "openai>=1.40",
    "openai-chatkit>=0.0.2",  # ← Official version
    "fastapi>=0.114.1,<0.116",
    "uvicorn[standard]>=0.36,<0.37",
]
```

**Frontend (npm):**
```json
{
  "dependencies": {
    "@openai/chatkit-react": "^0",  // ← Only this package
    "react": "^19.2.0",
    "react-dom": "^19.2.0"
  }
}
```

**KEY FINDING:** Official samples do NOT have a separate `@openai/chatkit` dependency!

---

### What YOU Currently Have

**Backend:**
```txt
openai>=1.107.1  ✅ Newer than sample (OK)
openai-chatkit>=0.1.0  ⚠️ Might be outdated
openai-agents>=0.3.3  ✅ Good
```

**Frontend:**
```json
{
  "@openai/chatkit": "^1.0.0",  ❌ SHOULD NOT BE HERE
  "@openai/chatkit-react": "^0"  ✅ Correct
}
```

**YOUR PROBLEM:** You have TWO chatkit packages fighting each other!

---

## 🔧 The Fix (Step by Step)

### Step 1: Fix Frontend Package Conflict

#### 1.1. Edit package.json

**REMOVE the separate `@openai/chatkit` line:**

```json
{
  "name": "jason-coaching-chatkit",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "@openai/chatkit-react": "^0",  // ← Keep ONLY this
    "react": "^19.2.0",
    "react-dom": "^19.2.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.43",
    "@types/react-dom": "^18.2.17",
    "@vitejs/plugin-react": "^4.2.1",
    "autoprefixer": "^10.4.16",
    "postcss": "^8.4.32",
    "tailwindcss": "^3.4.0",
    "typescript": "^5.2.2",
    "vite": "^5.0.8"
  }
}
```

#### 1.2. Clean Install

```bash
cd "/Users/jasoncooperson/Documents/Agent Builder Demo 2/frontend-v2"

# Remove everything
rm -rf node_modules package-lock.json

# Clean cache
npm cache clean --force

# Fresh install
npm install

# Verify single version
npm list @openai/chatkit @openai/chatkit-react
```

**Expected output:**
```
jason-coaching-chatkit@1.0.0
└─┬ @openai/chatkit-react@0.0.0
  └── @openai/chatkit@0.0.0
```

Only ONE version of chatkit, brought in by chatkit-react.

---

### Step 2: Update Backend to Match Sample

#### 2.1. Update requirements.txt

```txt
# Change from:
openai>=1.107.1
openai-chatkit>=0.1.0
openai-agents>=0.3.3

# Change to:
openai>=1.107.1
openai-chatkit>=0.0.2  # Match official sample
openai-agents>=0.3.3
```

#### 2.2. Upgrade Backend Packages

```bash
cd "/Users/jasoncooperson/Documents/Agent Builder Demo 2/backend-v2"
source venv/bin/activate
pip install --upgrade -r requirements.txt
```

---

### Step 3: Simplify ChatKitPanel Component

Your current component has many features that might not be supported in v0.x. Compare with sample:

#### Official Sample (Simple)
```typescript
const chatkit = useChatKit({
  api: {
    url: CHATKIT_API_URL,
    domainKey: CHATKIT_API_DOMAIN_KEY,
  },
  theme: { /* ... */ },
  startScreen: { /* ... */ },
  composer: {
    placeholder: COMPOSER_PLACEHOLDER,
  },
  threadItemActions: {
    feedback: false,
  },
  onResponseEnd: () => {
    onResponseCompleted();
  },
  onThreadChange: ({ threadId }) => {
    onThreadChange(threadId ?? null);
  },
  onError: ({ error }) => {
    console.error("ChatKit error", error);
  },
});
```

#### Your Component (Complex)
You have:
- `uploadStrategy` config
- `attachments` config with file types
- `widgets.onAction` handler
- `entities.onTagSearch` handler
- `onClientTool` handler

**These might not be supported in v0.x!**

---

### Step 4: Create Minimal Test Version

Let's create a minimal ChatKitPanel to test if the connection works:

**File:** `frontend-v2/src/components/ChatKitPanel.minimal.tsx`

```typescript
import { ChatKit, useChatKit } from "@openai/chatkit-react";
import { useState } from "react";
import {
  CHATKIT_API_DOMAIN_KEY,
  CHATKIT_API_URL,
  COMPOSER_PLACEHOLDER,
  GREETING,
  STARTER_PROMPTS,
} from "../lib/config";

type ChatKitPanelProps = {
  theme: "light" | "dark";
};

export function ChatKitPanel({ theme }: ChatKitPanelProps) {
  const [error, setError] = useState<string | null>(null);

  console.log("=== ChatKitPanel Init ===");
  console.log("API URL:", CHATKIT_API_URL);
  console.log("Theme:", theme);

  const chatkit = useChatKit({
    api: { 
      url: CHATKIT_API_URL,
      domainKey: CHATKIT_API_DOMAIN_KEY,
    },
    theme: {
      colorScheme: theme,
      color: {
        accent: {
          primary: "#ffffff",
          level: 1,
        },
      },
      radius: "round",
    },
    startScreen: {
      greeting: GREETING,
      prompts: STARTER_PROMPTS,
    },
    composer: {
      placeholder: COMPOSER_PLACEHOLDER,
    },
    threadItemActions: {
      feedback: false,
    },
    onThreadChange: ({ threadId }) => {
      console.log("[ChatKit] Thread changed:", threadId);
    },
    onResponseEnd: () => {
      console.log("[ChatKit] Response ended");
    },
    onError: ({ error }) => {
      console.error("❌ ChatKit error:", error);
      setError(error?.message || "Unknown error");
    },
  });

  console.log("[ChatKitPanel] Control:", chatkit.control ? "✅ Ready" : "❌ Not ready");

  return (
    <div className="flex-1 relative w-full overflow-hidden bg-[#0f0f0f]" style={{ minHeight: 0 }}>
      {error && (
        <div className="absolute top-4 left-4 right-4 z-20 bg-red-900 text-white p-4 rounded">
          <strong>Error:</strong> {error}
        </div>
      )}
      
      {chatkit.control ? (
        <div className="h-full w-full">
          <ChatKit control={chatkit.control} className="block h-full w-full" />
        </div>
      ) : (
        <div className="flex items-center justify-center h-full">
          <div className="text-gray-400">Loading ChatKit...</div>
        </div>
      )}
    </div>
  );
}
```

**Test this minimal version first!** If it works, gradually add back features.

---

### Step 5: Backend Event Compatibility Check

The official sample uses a **simple event flow**:

```python
# From official knowledge-assistant sample
async for event in stream_agent_response(agent_context, result):
    yield event  # Just stream as-is, no modifications
```

Your backend tries to inject custom progress events:

```python
# Your code (main.py lines 261-269)
if ProgressUpdateEvent is not None:
    try:
        thinking_event = ProgressUpdateEvent(text="🧠 Thinking...")
        yield thinking_event
```

**Problem:** `ProgressUpdateEvent` might not exist in `openai-chatkit==0.0.2`!

#### Test Backend Event Types

```bash
cd backend-v2
source venv/bin/activate
python3 << 'EOF'
from chatkit.types import ProgressUpdateEvent
print("✅ ProgressUpdateEvent exists")
print(f"Available fields: {ProgressUpdateEvent.__annotations__}")
EOF
```

If this fails, you need to remove the custom progress event code.

---

### Step 6: Compatibility Matrix

| Feature | v0.0.2 (Sample) | Your Current Code | Status |
|---------|-----------------|-------------------|--------|
| Basic chat | ✅ Yes | ✅ Yes | Works |
| File search tool | ✅ Yes | ✅ Yes | Works |
| Web search tool | ✅ Yes | ✅ Yes | Works |
| Image attachments | ❓ Unknown | ✅ Yes | Test needed |
| ProgressUpdateEvent | ❓ Unknown | ✅ Yes | Might break |
| Widgets | ❓ Unknown | ✅ Yes | Might not work |
| Entity tagging | ❓ Unknown | ✅ Yes | Might not work |
| Client tools | ❓ Unknown | ✅ Yes | Might not work |

**Strategy:** Start with basic features, add advanced ones incrementally.

---

## 🧪 Testing Plan

### Phase 1: Minimal Test (15 minutes)

1. Fix package.json (remove `@openai/chatkit`)
2. Clean install frontend
3. Use minimal ChatKitPanel component
4. Test basic message: "Hello"
5. Check if UI appears (not blank)

**Success criteria:** See ChatKit UI, no blank screen

---

### Phase 2: Tool Test (15 minutes)

1. Send message: "What are your hook templates?"
2. Should trigger file_search
3. Check backend logs for tool execution
4. Check if response streams back

**Success criteria:** Tool runs, response appears

---

### Phase 3: Image Test (15 minutes)

1. Try uploading an image
2. Check browser network tab for upload requests
3. Check backend logs for attachment processing
4. See if image analysis works

**Success criteria:** Image uploads and gets analyzed

---

### Phase 4: Add Features Back (30-60 minutes)

If basic tests pass, add back features one by one:

1. Custom progress events
2. Widget support
3. Entity tagging
4. Client tools

Test after each addition. If something breaks, you know what caused it.

---

## 🐛 Debugging Checklist

### Blank Screen Still?

**Frontend checks:**
```bash
# Check installed versions
npm list @openai/chatkit @openai/chatkit-react

# Should see:
# └─┬ @openai/chatkit-react@0.0.0
#   └── @openai/chatkit@0.0.0 deduped

# If you see multiple versions → clean install again
```

**Browser console checks:**
```
F12 → Console tab
Look for:
- ❌ "Cannot read property..." → JS error, check imports
- ❌ "Failed to fetch" → API connection issue
- ❌ "401 Unauthorized" → domain key issue
- ✅ "[ChatKitPanel] Control: ✅ Ready" → Should work
```

**Network tab checks:**
```
F12 → Network tab → Filter: chatkit
Send a message
Should see:
- POST /chatkit → 200 OK
- Content-Type: text/event-stream
- Response: data: {...}
```

---

### Events Not Streaming?

**Backend logs:**
```python
# Add to main.py respond() method (line 158)
print(f"🎯 [RESPOND] Starting for thread {thread.id}")
print(f"📝 [RESPOND] Message: {message_text[:50]}")

# Add to stream loop (line 310)
async for chatkit_event in stream_agent_response(agent_context, result):
    print(f"📤 [EVENT] Type: {type(chatkit_event).__name__}")
    yield chatkit_event
```

Run backend and watch terminal while sending messages.

**If no logs → request not reaching backend**
**If logs but no UI → event format mismatch**

---

### Tools Not Visualizing?

**Check if ProgressUpdateEvent exists:**
```python
from chatkit.types import ProgressUpdateEvent
# If ImportError → feature not supported in v0.0.2
```

**Fallback:** Remove custom progress events temporarily:

```python
# Comment out lines 261-269 in main.py
# if ProgressUpdateEvent is not None:
#     try:
#         thinking_event = ProgressUpdateEvent(text="🧠 Thinking...")
#         yield thinking_event
```

Tool visualization might be added automatically by `stream_agent_response` in newer versions.

---

## 📋 Quick Fix Script

I've created `frontend-v2/QUICK_FIX.sh` but it needs updating based on this analysis:

```bash
#!/bin/bash
set -e

cd "/Users/jasoncooperson/Documents/Agent Builder Demo 2/frontend-v2"

echo "🔧 Fixing ChatKit package conflict..."

# Backup
cp package.json package.json.backup

# Update package.json - REMOVE @openai/chatkit
cat > package.json << 'EOF'
{
  "name": "jason-coaching-chatkit",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "@openai/chatkit-react": "^0",
    "react": "^19.2.0",
    "react-dom": "^19.2.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.43",
    "@types/react-dom": "^18.2.17",
    "@vitejs/plugin-react": "^4.2.1",
    "autoprefixer": "^10.4.16",
    "postcss": "^8.4.32",
    "tailwindcss": "^3.4.0",
    "typescript": "^5.2.2",
    "vite": "^5.0.8"
  }
}
EOF

# Clean install
rm -rf node_modules package-lock.json
npm cache clean --force
npm install

echo ""
echo "✅ Fixed! Verify:"
npm list @openai/chatkit @openai/chatkit-react

echo ""
echo "Next: npm run dev"
```

Run it:
```bash
cd "/Users/jasoncooperson/Documents/Agent Builder Demo 2/frontend-v2"
chmod +x QUICK_FIX.sh
./QUICK_FIX.sh
```

---

## 🎯 Expected Results

### After Package Fix

**Terminal output:**
```
✅ Fixed! Verify:
jason-coaching-chatkit@1.0.0
└─┬ @openai/chatkit-react@0.0.0
  └── @openai/chatkit@0.0.0
```

**Browser (after `npm run dev`):**
- ChatKit UI appears (not blank!)
- Can send messages
- Responses stream back
- Tools execute (file_search, web_search)

### Performance

With correct versions:
- **Initialization:** < 500ms
- **First message:** 1-3s response time
- **Tool execution:** Visible progress (if supported)
- **No console errors**

---

## 🚀 Immediate Next Steps

1. **Run the package fix:**
   ```bash
   cd frontend-v2
   # Edit package.json - remove @openai/chatkit line
   rm -rf node_modules package-lock.json
   npm install
   npm list @openai/chatkit  # Should show only 0.0.0
   ```

2. **Test with minimal component:**
   - Temporarily rename your ChatKitPanel.tsx
   - Use the minimal version I provided above
   - Run `npm run dev`
   - Try sending "Hello"

3. **Check if blank screen is gone:**
   - If YES → gradually add features back
   - If NO → check browser console, share errors with me

4. **Report back:**
   - What do you see in browser?
   - Any console errors?
   - Does `npm list` show single version?

---

## 📚 Key Learnings

1. **Don't mix package versions:** `@openai/chatkit-react` should be your ONLY chatkit dependency
2. **Official samples are the source of truth:** Match their versions first
3. **Test incrementally:** Start minimal, add features one by one
4. **v0.x might not support all features:** Widgets, entity tagging, client tools might be v1.x features
5. **Backend event types must match frontend expectations:** Version mismatch = blank screen

---

## 🔗 References

**Official Sample Repo (Our Baseline):**
- GitHub: https://github.com/openai/openai-chatkit-advanced-samples
- Knowledge Assistant Example: Most similar to your use case

**Package Versions in Sample:**
- Backend: `openai-chatkit>=0.0.2`
- Frontend: `@openai/chatkit-react: ^0`
- No separate `@openai/chatkit` package

**Docs:**
- ChatKit Python SDK: https://openai.github.io/chatkit-python/
- ChatKit Server Integration: https://openai.github.io/chatkit-python/server/

---

**Ready to fix?** Start with Step 1 (package fix) and let me know what you see! 🚀


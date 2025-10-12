# Citation Markers Bug Report & Fix

**Issue Date**: October 12, 2025  
**Status**: ✅ TEMPORARY FIX APPLIED + DIAGNOSTIC LOGGING ADDED

---

## 🐛 Problem Description

Weird characters appearing in agent responses:
- `≡file≡`
- `≡turn0file2≡`
- `≡turnNfileM≡` (where N and M are numbers)

### Example:
```
You can stack psychology with ≡file≡≡turn0file2≡≡turn0file2≡ subtle urgency...
```

---

## 🔍 Root Cause Analysis

### Most Likely Cause: OpenAI File Search Citation Leak

These markers are **internal citation annotations** from OpenAI's `file_search` tool that should be stripped before displaying to users, but aren't being properly filtered by either:

1. **OpenAI's Responses API** (used by Agent SDK)
2. **ChatKit's `stream_agent_response` function**
3. **A bug in the library versions you're using**

The `≡` character (Unicode U+2261, "IDENTICAL TO") suggests these are:
- Internal file reference tokens
- Citation placeholders that normally get rendered as footnotes
- Annotation markers that should be invisible to end users

### When This Likely Happens:
- ✅ When `file_search` tool is used (searching your knowledge base)
- ❓ Possibly also with `web_search` tool
- ❓ Check if this happens on EVERY response or only with tool use

---

## ✅ What I've Done

### 1. Added Citation Marker Filter (WORKAROUND)

**File**: `backend-v2/app/main.py`

Created a function to strip these markers:

```python
def _strip_citation_markers(text: str) -> str:
    """Strip OpenAI's internal citation markers that leak into responses."""
    if not text:
        return text
    
    # Remove citation markers: ≡...≡
    cleaned = re.sub(r'≡[^≡]*≡', '', text)
    
    # Also catch other common citation formats
    cleaned = re.sub(r'【[^】]*】', '', cleaned)  # 【】 brackets
    cleaned = re.sub(r'〔[^〕]*〕', '', cleaned)  # 〔〕 brackets
    
    return cleaned
```

This filter is now applied to ALL streaming events before they're sent to the frontend.

### 2. Added Debug Logging

When `DEBUG_MODE=true`, the backend will now log:
- Raw delta text from streaming events
- When citation markers are detected and removed

**To enable debug mode:**
```bash
# In your .env file or environment
DEBUG_MODE=true
```

---

## 📋 Next Steps - What You Need To Do

### 1. Test the Fix

1. **Restart your backend** (the fix is now in main.py):
   ```bash
   cd backend-v2
   # Stop current process (Ctrl+C)
   uvicorn app.main:app --reload --port 8000
   ```

2. **Enable debug mode** to see what's being filtered:
   ```bash
   # Add to .env or set in terminal
   export DEBUG_MODE=true
   uvicorn app.main:app --reload --port 8000
   ```

3. **Test with a file_search query**:
   - Ask the agent something that requires searching your knowledge base
   - Example: "Show me your best hook templates"
   - Check if the weird characters are gone

4. **Check the backend logs** for:
   ```
   [CITATION FILTER] Removed markers: ...
   ```

### 2. Gather Diagnostic Information

If the problem persists or you want to help fix the root cause, gather this info:

```bash
# Get library versions
cd backend-v2
source venv/bin/activate
pip list | grep -E "agents|chatkit|openai"
```

**Send me:**
1. The library versions (output from above command)
2. A complete example:
   - User's question
   - Full agent response (with markers if they still appear)
   - Backend logs showing which tools were called
3. Does this happen:
   - Only with `file_search`?
   - Also with `web_search`?
   - On every response?
4. Environment:
   - Local development only?
   - Production (Railway) only?
   - Both?

### 3. Check if This is a Known Issue

Check these resources:
1. **OpenAI Agent SDK Issues**: https://github.com/openai/openai-python/issues
2. **ChatKit Issues**: https://github.com/openai/chatkit/issues
3. **OpenAI Community**: https://community.openai.com/

Search for: "citation markers", "file search annotations", "≡ character"

---

## 🔧 Alternative Fixes to Try

### Fix 1: Update Libraries

```bash
cd backend-v2
source venv/bin/activate
pip install --upgrade openai-agents chatkit
```

### Fix 2: Disable File Search Citations (if available)

Check if there's a parameter in your `FileSearchTool` configuration:

```python
# In jason_agent.py
FileSearchTool(
    vector_store_ids=[JASON_VECTOR_STORE_ID],
    max_num_results=5,
    # Try adding:
    include_citations=False,  # If this parameter exists
)
```

### Fix 3: Strip at the Frontend (Additional Safety)

In `frontend-v2/src/components/ChatKitPanel.tsx`, you could add:

```typescript
// Add this utility function
function stripCitationMarkers(text: string): string {
  if (!text) return text;
  // Remove ≡...≡ patterns
  return text.replace(/≡[^≡]*≡/g, '');
}

// Apply in onResponseEnd callback (line 230)
onResponseEnd: (response) => {
  console.log("[ChatKitPanel] Response ended", response);
  // Could strip markers from response here if needed
},
```

---

## 🎯 Expected Outcome

After the fix:
- ✅ Weird characters should be automatically stripped
- ✅ Agent responses should look clean and professional
- ✅ No visible change to functionality
- ⚠️ Citations/references may be lost (if they were intentional)

**If citations WERE intentional and useful:**
- The current fix removes them completely
- We might need a more sophisticated solution that converts them to proper footnotes
- Let me know if you want citation support preserved

---

## 📝 Notes for OpenAI / Library Maintainers

If this is a bug in OpenAI's libraries:

**Expected Behavior:**
- Citation markers from `file_search` should either:
  1. Be automatically stripped from user-facing text, OR
  2. Be converted to proper footnotes/references with source attribution

**Actual Behavior:**
- Internal citation markers (`≡file≡`, `≡turn0file2≡`) are leaking into the user-facing response stream

**Reproduction:**
1. Create agent with `file_search` tool
2. Query knowledge base
3. Observe response contains `≡` markers in the text

**Environment:**
- Agent SDK version: (check with `pip list | grep agents`)
- ChatKit version: (check with `pip list | grep chatkit`)
- Python: 3.13
- Model: gpt-5

---

## ✅ Status

**Current Status**: WORKAROUND DEPLOYED  
**Impact**: Low (markers are now filtered)  
**Monitoring**: Debug logs enabled to track occurrences

**Action Required by User:**
1. Restart backend
2. Test with file_search queries
3. Report back if issue persists

**Long-term Solution Needed:**
- Update to newer library versions that fix this
- OR keep the workaround in place if it's an upstream bug


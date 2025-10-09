# Implementation Plan: Real-Time Agent Feedback

## Goal
Add real-time visual feedback to show what the agent is doing (searching web, calling tools, thinking, etc.) - exactly like OpenAI's interface.

---

## Phase 1: Research ✅ COMPLETE

- ✅ Research OpenAI Agents SDK streaming events
- ✅ Research ChatKit event types
- ✅ Find relevant documentation and examples
- ✅ Understand current architecture
- ✅ Document findings

---

## Phase 2: Backend Implementation 🎯 NEXT

### Step 1: Inspect the Streaming Events
**Goal**: Understand what events are actually being emitted by `Runner.run_streamed()`

**Action**:
```python
# Add logging to see what events we get
async def respond(self, thread, item, context):
    # ... existing code ...
    
    result = Runner.run_streamed(
        self.assistant,
        message_text,
        context=agent_context,
        run_config=RunConfig(model_settings=ModelSettings(temperature=0.7)),
    )
    
    # TEMPORARY: Log all events to understand the structure
    async for event in result:
        print(f"[DEBUG] Event type: {type(event)}")
        print(f"[DEBUG] Event attributes: {dir(event)}")
        print(f"[DEBUG] Event data: {event}")
    
    # Then restore the original streaming
    # async for event in stream_agent_response(agent_context, result):
    #     yield event
```

**Expected Output**: Will show us the exact event structure and types

**Files to Modify**:
- `backend-v2/app/main.py`

---

### Step 2: Create Custom Event Handler
**Goal**: Build a wrapper that emits status updates for tool calls

**Action**: Create new file `backend-v2/app/streaming_helpers.py`

```python
"""
Enhanced streaming helpers that show real-time agent activity.
"""
from __future__ import annotations
from typing import AsyncIterator, Any
from chatkit.agents import AgentContext
from chatkit.types import ThreadStreamEvent
import uuid
from datetime import datetime, timezone

async def stream_with_tool_feedback(
    agent_context: AgentContext,
    result: AsyncIterator,
) -> AsyncIterator[ThreadStreamEvent]:
    """
    Wrap the agent streaming response to emit tool call status updates.
    
    This function intercepts agent events and emits status messages when:
    - A tool is being called
    - A tool execution completes
    - Web search is happening
    - File search is happening
    """
    
    # Import here to avoid circular dependencies
    from chatkit.agents import stream_agent_response
    
    async for event in result:
        event_type = getattr(event, 'type', None)
        
        # Check for tool call events
        if event_type == 'tool_call_created':
            tool_name = getattr(event, 'name', 'Unknown')
            tool_id = getattr(event, 'id', str(uuid.uuid4()))
            
            # Emit a status event
            status_event = {
                'type': 'status',
                'tool_name': tool_name,
                'tool_id': tool_id,
                'status': 'in_progress',
                'message': f'Using {tool_name}...'
            }
            
            print(f"[TOOL] Starting: {tool_name}")
            # TODO: Yield proper ChatKit event
        
        elif event_type == 'tool_call_completed':
            tool_name = getattr(event, 'name', 'Unknown')
            print(f"[TOOL] Completed: {tool_name}")
            # TODO: Yield completion event
        
        # Pass through to standard handler for text responses
        # This maintains compatibility with existing ChatKit integration
        async for standard_event in stream_agent_response(agent_context, [event]):
            yield standard_event

```

**Files to Create**:
- `backend-v2/app/streaming_helpers.py`

---

### Step 3: Integrate Custom Handler
**Goal**: Replace the existing streaming handler with our enhanced version

**Action**: Update `backend-v2/app/main.py`

```python
# Add import
from .streaming_helpers import stream_with_tool_feedback

# In JasonCoachingServer.respond():
async def respond(self, thread, item, context):
    # ... existing code ...
    
    result = Runner.run_streamed(
        self.assistant,
        message_text,
        context=agent_context,
        run_config=RunConfig(model_settings=ModelSettings(temperature=0.7)),
    )
    
    # Use enhanced streaming instead of basic
    async for event in stream_with_tool_feedback(agent_context, result):
        yield event
```

**Files to Modify**:
- `backend-v2/app/main.py`

---

### Step 4: Test with Existing Tool
**Goal**: Verify we can see file_search tool calls

**Test Plan**:
1. Start backend locally
2. Ask a question that triggers file_search
3. Check backend logs for tool call events
4. Verify events are being emitted

**Test Query**: "What are your hook templates?"

**Expected Logs**:
```
[TOOL] Starting: file_search
[TOOL] Completed: file_search
```

---

### Step 5: Add Web Search Tool
**Goal**: Re-enable web_search tool and verify it shows up in real-time

**Action**: Update `backend-v2/app/jason_agent.py`

```python
# Currently commented out at line 176
jason_agent = Agent[AgentContext](
    model="gpt-4o-mini",
    name="Jason Cooperson - Social Media Marketing Expert",
    instructions=JASON_INSTRUCTIONS,
    tools=[
        build_file_search_tool(),
        web_search,  # ADD THIS
    ],
)
```

**Test Query**: "What are the current trending topics on TikTok?"

**Expected Behavior**: Should see web_search tool being called

---

## Phase 3: Frontend Verification 🎯 AFTER BACKEND

### Step 1: Verify ChatKit Displays Status
**Goal**: Confirm ChatKit shows tool call messages

**Test**:
1. Deploy backend changes
2. Open frontend
3. Ask test questions
4. Look for status messages in UI

**If Not Visible**: May need to customize ChatKit theme or event mapping

---

### Step 2: Add Custom Styling (If Needed)
**Goal**: Make tool indicators visually distinct

**Action**: Update `frontend-v2/src/components/ChatKitPanel.tsx`

Potentially add custom event handlers or CSS for tool status messages.

---

## Phase 4: Polish & Deploy 🎯 FINAL

### Step 1: Add Icons and Emojis
- 🔍 for web searches
- 📁 for file searches
- ⚙️ for tool calls
- ✅ for completion
- ❌ for errors

### Step 2: Add Timing Information
- Show how long each tool took
- Example: "Web search completed (1.2s)"

### Step 3: Error Handling
- Graceful degradation if events fail
- Show user-friendly error messages

### Step 4: Documentation
- Update README with new features
- Add screenshots
- Document event types

---

## Testing Checklist

- [ ] Backend logs show tool call events
- [ ] File search tool triggers status updates
- [ ] Web search tool triggers status updates
- [ ] Events appear in correct order
- [ ] No breaking changes to existing functionality
- [ ] Frontend displays status messages
- [ ] Error cases handled gracefully
- [ ] Performance is acceptable
- [ ] Works in production environment

---

## Rollback Plan

If something breaks:
1. Revert `main.py` to use `stream_agent_response` directly
2. Remove `streaming_helpers.py`
3. System returns to current working state

---

## Success Criteria

✅ User can see when agent is:
- Searching the knowledge base
- Searching the web
- Processing/thinking
- Completing tasks

✅ Real-time feedback appears before final response
✅ No degradation in response time or quality
✅ UI matches OpenAI's agent interface experience

---

## Timeline Estimate

- **Step 1 (Inspect Events)**: 15-30 minutes
- **Step 2 (Create Handler)**: 30-45 minutes
- **Step 3 (Integration)**: 15 minutes
- **Step 4 (Testing)**: 30 minutes
- **Step 5 (Web Search)**: 15 minutes
- **Frontend Verification**: 30 minutes
- **Polish**: 1-2 hours

**Total**: 3-4 hours for complete implementation

---

## Next Immediate Action

🎯 **START HERE**: Step 1 - Add logging to inspect streaming events

This will tell us exactly what event structure we're working with, which informs all subsequent steps.


# Research: Real-Time Agent Tool Feedback

## Executive Summary

After comprehensive research, I've found the solution to display real-time agent activity (tool calls, thinking, web searches, etc.) in your ChatKit UI. The key is to intercept and emit additional events from the OpenAI Agents SDK streaming response.

---

## Current Architecture

### What You Have Now:
```python
# In main.py
result = Runner.run_streamed(
    self.assistant,
    message_text,
    context=agent_context,
    run_config=RunConfig(model_settings=ModelSettings(temperature=0.7)),
)

async for event in stream_agent_response(agent_context, result):
    yield event
```

**The Problem:** `stream_agent_response()` is a high-level wrapper that abstracts away intermediate events. It only emits:
- Text chunks (the final response)
- Basic status updates

**What's Missing:** Tool call events, reasoning steps, and detailed agent activity.

---

## Key Findings

### 1. OpenAI Agents SDK Streaming Events

The `Runner.run_streamed()` method returns an `AsyncIterator` that emits various event types:

**Event Types Available:**
- `response.chunk.created` - Text being generated
- `tool_call.created` - When agent decides to use a tool
- `tool_call.executing` - Tool is being executed
- `tool_call.completed` - Tool execution finished
- `agent.handoff` - Agent handoff events
- `error` - Error events

### 2. ChatKit Event Types

ChatKit expects `ThreadStreamEvent` objects. Based on the imports in your code:
```python
from chatkit.types import (
    ThreadItem,
    ThreadMetadata,
    ThreadStreamEvent,
)
```

ChatKit can display:
- Status messages (what the agent is doing)
- Text responses (streamed)
- Tool call information
- Error states

### 3. The Solution Architecture

Instead of directly using `stream_agent_response()`, we need to:

1. **Intercept the raw streaming events** from `Runner.run_streamed()`
2. **Create custom ChatKit events** for tool calls and status updates
3. **Still use `stream_agent_response()`** for the final text response
4. **Emit both types of events** to the frontend

---

## Implementation Plan

### Phase 1: Custom Event Handler (Backend)

Create a new function that wraps the streaming response and emits additional events:

```python
# In main.py or new file: streaming_helpers.py

async def stream_agent_response_with_feedback(
    agent_context: AgentContext,
    result: AsyncIterator,
) -> AsyncIterator[ThreadStreamEvent]:
    """
    Enhanced streaming that shows tool calls and agent activity.
    """
    from chatkit.types import StatusMessageItem, TextContentItem
    import uuid
    
    async for event in result:
        # Emit status updates for tool calls
        if hasattr(event, 'type'):
            if event.type == 'tool_call.created':
                # Emit a status message showing tool is being called
                status_id = str(uuid.uuid4())
                yield {
                    'type': 'thread.item.created',
                    'item': StatusMessageItem(
                        id=status_id,
                        status='in_progress',
                        content=[TextContentItem(
                            text=f"🔍 Calling tool: {event.tool_name}..."
                        )]
                    )
                }
            
            elif event.type == 'tool_call.completed':
                # Emit completion status
                status_id = str(uuid.uuid4())
                yield {
                    'type': 'thread.item.created',
                    'item': StatusMessageItem(
                        id=status_id,
                        status='completed',
                        content=[TextContentItem(
                            text=f"✅ Tool completed: {event.tool_name}"
                        )]
                    )
                }
        
        # Also pass through to the standard handler for text responses
        async for standard_event in stream_agent_response(agent_context, [event]):
            yield standard_event
```

### Phase 2: Update Main Handler

Replace the current streaming in `JasonCoachingServer.respond()`:

```python
# Replace this:
async for event in stream_agent_response(agent_context, result):
    yield event

# With this:
async for event in stream_agent_response_with_feedback(agent_context, result):
    yield event
```

### Phase 3: Frontend Updates (Optional)

ChatKit should automatically handle and display the status events. If not, you may need to customize the ChatKit theme to show tool call indicators.

---

## Alternative Approach: Using Tracing

The OpenAI Agents SDK also has a built-in tracing feature that can be accessed:

```python
# Enable tracing
from agents.tracing import trace_context

with trace_context() as tracer:
    result = Runner.run_streamed(
        self.assistant,
        message_text,
        context=agent_context,
    )
    
    # Access trace events
    for trace_event in tracer.events:
        # Emit custom events based on trace data
        pass
```

---

## Resources & Documentation

### Official Documentation
1. **OpenAI Agents SDK Guide**: https://openai.github.io/openai-agents-python/
2. **Realtime Agent Guide**: https://openai.github.io/openai-agents-python/realtime/guide/
3. **Tracing Documentation**: https://openai.github.io/openai-agents-python/tracing/
4. **Visualization**: https://openai.github.io/openai-agents-python/visualization/

### Example Repositories
1. **OpenAI Realtime Agents Demo**: https://github.com/openai/openai-realtime-agents
   - Shows advanced agent patterns with real-time feedback
   - Demonstrates event handling and UI updates

2. **OpenAI Agents SDK GUI**: https://github.com/jgravelle/OpenAI-AgentsSDK-GUI
   - GUI for managing agents with real-time visualization
   - Good reference for UI components

### Key Packages
```
openai-agents>=0.3.3
openai-chatkit>=0.0.1
```

---

## Next Steps - Implementation Checklist

- [ ] Create custom streaming event handler
- [ ] Add status events for tool calls
- [ ] Add status events for web searches
- [ ] Test with existing tools (file_search)
- [ ] Add web_search tool back to agent
- [ ] Verify ChatKit displays status messages
- [ ] Add custom styling for tool indicators
- [ ] Test error handling
- [ ] Add optional detailed logging
- [ ] Document the new event flow

---

## Expected User Experience

**Before (Current):**
```
User: "What are the latest trends in social media?"
[Long pause...]
Agent: "Here are the latest trends..."
```

**After (With Real-Time Feedback):**
```
User: "What are the latest trends in social media?"
[Shows: 🔍 Searching web...]
[Shows: ✅ Web search completed]
[Shows: 🔍 Searching knowledge base...]
[Shows: ✅ File search completed]
Agent: "Here are the latest trends..."
```

---

## Technical Considerations

### Event Ordering
- Events must be emitted in the correct order
- Status events should appear before their corresponding responses
- Use proper async/await to maintain stream order

### Performance
- Additional events add minimal overhead
- Streaming maintains low latency
- ChatKit handles event buffering

### Error Handling
- Wrap event emission in try/catch
- Failed tool calls should show error status
- Gracefully degrade if status events fail

---

## Conclusion

The solution is straightforward:
1. **Intercept** the raw streaming events from the Agents SDK
2. **Emit custom status events** for tool calls and activity
3. **Maintain compatibility** with existing ChatKit integration

This will provide the same experience as OpenAI's interface, where users can see exactly what the agent is doing in real-time.


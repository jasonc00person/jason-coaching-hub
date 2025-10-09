# Implementation Recommendations - Priority Order

Based on my research of OpenAI's latest AgentKit and Agents SDK, here are specific, actionable recommendations prioritized by impact and effort.

## 🔥 CRITICAL - Implement Immediately (1-2 days)

### 1. Replace Custom MemoryStore with SQLiteSession

**Why:** The SDK now has native, battle-tested session management that's better than custom implementations.

**Current Problem:**
- Your `MemoryStore` class manually manages conversation history
- More code to maintain
- Missing features like session isolation, cleanup, and optimization

**Implementation:**

**Step 1:** Update `backend-v2/app/main.py`

```python
from agents import SQLiteSession  # Add this import

class JasonCoachingServer(ChatKitServer[dict[str, Any]]):
    def __init__(self, agent) -> None:
        # Remove: self.store = MemoryStore()
        super().__init__(None)  # We'll manage sessions differently
        self.assistant = agent
        self.sessions = {}  # Cache SQLiteSession instances

    def _get_session(self, session_id: str) -> SQLiteSession:
        """Get or create a session for this user."""
        if session_id not in self.sessions:
            self.sessions[session_id] = SQLiteSession(
                session_id=session_id,
                db_path="conversations.db"  # All sessions in one DB
            )
        return self.sessions[session_id]

    async def respond(
        self,
        thread: ThreadMetadata,
        item: ThreadItem | None,
        context: dict[str, Any],
    ) -> AsyncIterator[ThreadStreamEvent]:
        if item is None:
            return

        if _is_tool_completion_item(item):
            return

        if not isinstance(item, UserMessageItem):
            return

        message_text = _user_message_text(item)
        if not message_text:
            return

        # Get session for this thread
        session = self._get_session(thread.id)

        agent_context = AgentContext(
            thread=thread,
            store=None,  # No longer needed
            request_context=context,
        )
        
        result = Runner.run_streamed(
            self.assistant,
            message_text,
            context=agent_context,
            session=session,  # ✨ Native session support!
            run_config=RunConfig(
                model_settings=ModelSettings(
                    temperature=0.7,
                    parallel_tool_calls=True,
                )
            ),
        )

        async for event in stream_agent_response(agent_context, result):
            yield event
```

**Step 2:** You can DELETE `backend-v2/app/memory_store.py` entirely! 🎉

**Benefits:**
- Less code to maintain
- Better performance
- Automatic conversation history
- Session isolation
- Built-in cleanup and optimization

---

### 2. Add Input Guardrails for Safety & Quality

**Why:** Prevent misuse and save costs by stopping bad requests early.

**Create:** `backend-v2/app/guardrails.py`

```python
from __future__ import annotations

from pydantic import BaseModel
from agents import (
    Agent,
    GuardrailFunctionOutput,
    RunContextWrapper,
    Runner,
    TResponseInputItem,
    input_guardrail,
)


class TopicCheckOutput(BaseModel):
    """Output from the topic check guardrail."""
    reasoning: str
    is_marketing_related: bool
    suggested_response: str | None = None


# Fast, cheap model for guardrails
GUARDRAIL_AGENT = Agent(
    model="gpt-4o-mini",  # Fast & cheap for checks
    name="Topic Guardrail",
    instructions="""
    You check if user requests are about social media marketing, viral content, 
    or business strategy that Jason Cooperson would help with.
    
    ALLOW:
    - Social media marketing questions
    - Viral content strategy
    - Video scripts, hooks, CTAs
    - Funnel building, ICP, audience targeting
    - Platform algorithms (TikTok, Instagram, YouTube)
    - Content creation and growth tactics
    
    REJECT with suggested_response:
    - Math homework
    - Medical or legal advice
    - Programming help (unless it's for marketing automation)
    - General life advice unrelated to marketing
    - Requests for illegal/unethical marketing
    
    Be lenient - if it could relate to marketing, allow it.
    """,
    output_type=TopicCheckOutput,
)


@input_guardrail
async def topic_guardrail(
    context: RunContextWrapper[None],
    agent: Agent,
    input: str | list[TResponseInputItem],
) -> GuardrailFunctionOutput:
    """
    Runs in parallel with the main agent to check if input is on-topic.
    If not, immediately stops execution and returns suggested response.
    """
    result = await Runner.run(GUARDRAIL_AGENT, input, context=context.context)
    check = result.final_output_as(TopicCheckOutput)
    
    return GuardrailFunctionOutput(
        output_info={
            "reasoning": check.reasoning,
            "suggested_response": check.suggested_response,
        },
        tripwire_triggered=not check.is_marketing_related,
    )


# Optional: Rate limiting guardrail
class RateLimitOutput(BaseModel):
    """Check if user is spamming."""
    is_spam: bool
    reasoning: str


@input_guardrail
async def rate_limit_guardrail(
    context: RunContextWrapper[None],
    agent: Agent,
    input: str | list[TResponseInputItem],
) -> GuardrailFunctionOutput:
    """
    Detect if user is sending repeated/spam messages.
    Could be enhanced with actual rate limiting logic.
    """
    # For now, just a simple check
    # In production, you'd check Redis/DB for message frequency
    
    return GuardrailFunctionOutput(
        output_info={"note": "Rate limiting not yet implemented"},
        tripwire_triggered=False,
    )
```

**Step 3:** Update `backend-v2/app/jason_agent.py`

```python
from .guardrails import topic_guardrail

jason_agent = Agent[AgentContext](
    model="gpt-4o-mini",
    name="Jason Cooperson - Social Media Marketing Expert",
    instructions=JASON_INSTRUCTIONS,
    tools=[build_file_search_tool(), WebSearchTool()],
    input_guardrails=[topic_guardrail],  # ✨ Add this
)
```

**Step 4:** Handle guardrail exceptions in `main.py`

```python
from agents import InputGuardrailTripwireTriggered

# In your respond() method, wrap the Runner.run_streamed call:
try:
    result = Runner.run_streamed(
        self.assistant,
        message_text,
        context=agent_context,
        session=session,
        run_config=run_config,
    )
    
    async for event in stream_agent_response(agent_context, result):
        yield event
        
except InputGuardrailTripwireTriggered as e:
    # Guardrail blocked the request
    suggested = e.guardrail_result.output_info.get("suggested_response")
    
    if suggested:
        response_text = suggested
    else:
        response_text = (
            "Yo, I appreciate the question but that's outside my expertise. "
            "I'm here to help with social media marketing, viral content, "
            "and growing your brand. What can I help you with on that front?"
        )
    
    # Send the rejection message
    yield ThreadStreamEvent(
        type="message",
        content=response_text,
        role="assistant",
    )
```

**Benefits:**
- Saves money (stops expensive model calls early)
- Protects against misuse
- Better user experience (immediate feedback)
- Runs in parallel (no added latency)

---

## 🚀 HIGH PRIORITY - Implement This Week (3-5 days)

### 3. Enhanced Tool Configuration

**Current:** Basic tool setup
**Improvement:** Use advanced options for better results

**Update `backend-v2/app/jason_agent.py`:**

```python
from agents.models.openai_responses import FileSearchTool, WebSearchTool

def build_file_search_tool() -> FileSearchTool:
    if not JASON_VECTOR_STORE_ID:
        raise RuntimeError("JASON_VECTOR_STORE_ID is not set.")
    
    return FileSearchTool(
        vector_store_ids=[JASON_VECTOR_STORE_ID],
        max_num_results=10,
        include_search_results=True,  # ✨ NEW: Get raw results
        ranking_options={              # ✨ NEW: Control ranking
            "ranker": "auto",
            "score_threshold": 0.5,   # Filter low-quality results
        }
    )


def build_web_search_tool() -> WebSearchTool:
    return WebSearchTool(
        user_location={                # ✨ NEW: Better localization
            "type": "approximate",
            "city": "Miami",           # Jason's location
            "country": "US"
        },
        max_results=5,                 # ✨ NEW: Limit results
    )


jason_agent = Agent[AgentContext](
    model="gpt-4o-mini",
    name="Jason Cooperson - Social Media Marketing Expert",
    instructions=JASON_INSTRUCTIONS,
    tools=[build_file_search_tool(), build_web_search_tool()],  # Updated
)
```

---

### 4. Add Basic Tracing for Debugging

**Why:** Easily debug issues and optimize performance.

**Add to `backend-v2/app/main.py`:**

```python
from agents import trace

# In your respond() method:
with trace(f"Jason coaching - {thread.id}"):
    result = Runner.run_streamed(
        self.assistant,
        message_text,
        context=agent_context,
        session=session,
        run_config=run_config,
    )
    
    async for event in stream_agent_response(agent_context, result):
        yield event
```

**View Traces:** Traces will be logged to console by default. Later, you can integrate with:
- Logfire (Pydantic's observability platform)
- AgentOps
- Braintrust
- Your own monitoring

---

## 💡 NICE TO HAVE - Future Enhancements (1-2 weeks)

### 5. Agent Handoffs (Specialized Sub-Agents)

**Concept:** Have specialized agents for different tasks:
- **Script Writer Agent:** Optimized for video scripts
- **Strategy Agent:** Deep marketing strategy
- **Funnel Agent:** Funnel design and optimization

**Example Structure:**

```python
# backend-v2/app/specialized_agents.py

script_agent = Agent(
    model="gpt-4o-mini",
    name="Script Writer",
    instructions="""
    You are Jason's script writing specialist. You create viral short-form 
    video scripts following the Hook → Pattern Interrupt → Value → CTA structure.
    
    Reference Jason's hook templates from the knowledge base and create 
    custom scripts that match his high-energy, authentic style.
    """,
    tools=[build_file_search_tool()],
)

strategy_agent = Agent(
    model="gpt-4o-mini", 
    name="Strategy Expert",
    instructions="""
    You are Jason's strategy specialist. You create comprehensive marketing 
    strategies, ICP analysis, funnel designs, and growth roadmaps.
    
    Be thorough, data-driven, and always tie strategy back to viral content.
    """,
    tools=[build_file_search_tool(), WebSearchTool()],
)

# Main triage agent
triage_agent = Agent(
    model="gpt-4o-mini",
    name="Jason Cooperson",
    instructions=JASON_INSTRUCTIONS + """
    
    # WHEN TO HANDOFF
    
    If user asks for:
    - Video script → handoff to Script Writer
    - Deep strategy/funnel → handoff to Strategy Expert
    
    Keep everything else yourself.
    """,
    handoffs=[script_agent, strategy_agent],
    tools=[build_file_search_tool(), WebSearchTool()],
)
```

**Benefits:**
- Better quality for specialized tasks
- Easier to optimize each agent independently
- More maintainable instructions

---

### 6. MCP Integration (If Needed)

**Use Cases:**
- Connect to external tools (Google Drive, databases, APIs)
- Use community MCP servers
- Hosted execution for lower latency

**Example - Hosted MCP Tool:**

```python
from agents import HostedMCPTool

# If you want to connect to Google Drive, Notion, etc.
jason_agent = Agent(
    name="Jason Cooperson",
    tools=[
        build_file_search_tool(),
        WebSearchTool(),
        HostedMCPTool(
            tool_config={
                "type": "mcp",
                "server_label": "google_drive",
                "connector_id": "connector_googledrive",
                "authorization": os.getenv("GOOGLE_DRIVE_TOKEN"),
                "require_approval": "never",
            }
        )
    ],
)
```

**When to use:** Only if you need to connect to external data sources that don't fit into your vector store.

---

### 7. Voice/Realtime API (Premium Feature)

**Concept:** Let users have voice conversations with Jason.

**Potential Use Case:** Premium coaching tier where users can talk to "Jason" in real-time.

**Example:**

```python
from agents.realtime import RealtimeAgent, RealtimeRunner

voice_jason = RealtimeAgent(
    name="Jason Cooperson Voice",
    instructions=JASON_INSTRUCTIONS + """
    
    # VOICE SPECIFIC RULES
    
    Keep responses conversational and brief (30-60 seconds max).
    Use natural speech patterns, pauses, emphasis.
    Don't say emojis - convey energy through tone.
    """,
)

runner = RealtimeRunner(
    starting_agent=voice_jason,
    config={
        "model_settings": {
            "model_name": "gpt-realtime",
            "voice": "echo",  # Closest to energetic, young male voice
            "modalities": ["audio"],
        }
    }
)
```

**Benefits:**
- More engaging
- Premium upsell opportunity
- Natural coaching experience

**Complexity:** Requires audio handling in frontend, WebRTC/WebSocket connection

---

## 📊 Impact vs Effort Matrix

| Feature | Impact | Effort | Priority |
|---------|--------|--------|----------|
| SQLiteSession | 🔥🔥🔥 | ⚡ Low | **DO NOW** |
| Input Guardrails | 🔥🔥🔥 | ⚡⚡ Medium | **DO NOW** |
| Enhanced Tools | 🔥🔥 | ⚡ Low | **This Week** |
| Basic Tracing | 🔥🔥 | ⚡ Low | **This Week** |
| Agent Handoffs | 🔥🔥 | ⚡⚡ Medium | Consider |
| MCP Integration | 🔥 | ⚡⚡⚡ High | Only if needed |
| Voice/Realtime | 🔥 | ⚡⚡⚡ High | Future premium |

---

## 🎯 Recommended Implementation Order

### Week 1:
1. ✅ Replace MemoryStore with SQLiteSession
2. ✅ Add input guardrails
3. ✅ Update tool configurations
4. ✅ Add basic tracing

### Week 2:
5. ⚠️ Test and optimize guardrails
6. ⚠️ Consider agent handoffs if needed
7. ⚠️ Add monitoring/observability integration

### Future:
8. 💡 Evaluate MCP if you need external integrations
9. 💡 Prototype voice/realtime for premium tier

---

## 📚 Reference Materials

All official repos cloned to: `/Users/jasoncooperson/Documents/Agent Builder Demo 2/openai-examples/`

**Key Examples to Study:**
- `openai-agents-python/examples/memory/sqlite_session_example.py`
- `openai-agents-python/examples/agent_patterns/input_guardrails.py`
- `openai-agents-python/examples/agent_patterns/routing.py` (for handoffs)
- `openai-agents-python/examples/tools/web_search.py`
- `openai-agents-python/examples/tools/file_search.py`

**Documentation:**
- Sessions: https://openai.github.io/openai-agents-python/sessions/
- Guardrails: https://openai.github.io/openai-agents-python/guardrails/
- Tracing: https://openai.github.io/openai-agents-python/tracing/

---

## 🚦 Quick Start - First PR

Want to get started right away? Here's a minimal first PR:

1. **Replace MemoryStore with SQLiteSession** (30-60 minutes)
2. **Test that conversations work** (15 minutes)
3. **Deploy and verify** (15 minutes)

That's it! You'll immediately get:
- Better session management
- Less code to maintain
- Production-ready session storage

Then tackle guardrails in your next PR.

---

## Questions?

Let me know if you want me to:
1. Implement any of these changes
2. Create specific code examples
3. Explain any concepts in more detail
4. Help you test/deploy changes


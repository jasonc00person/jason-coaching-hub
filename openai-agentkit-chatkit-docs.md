# OpenAI Agent SDK, ChatKit & AgentKit Documentation
## Real-time Tool Visualization Guide

Last Updated: October 2025

---

## Table of Contents

1. [Overview](#overview)
2. [Real-time Tool Visualization Options](#real-time-tool-visualization-options)
3. [Streaming Events in Agent SDK](#streaming-events-in-agent-sdk)
4. [Built-in Tracing Dashboard](#built-in-tracing-dashboard)
5. [ChatKit Integration](#chatkit-integration)
6. [Complete Implementation Examples](#complete-implementation-examples)
7. [AgentKit Integration with Coinbase](#agentkit-integration-with-coinbase)

---

## Overview

The OpenAI Agents SDK provides multiple ways to visualize agent activity in real-time as your agent processes requests. This is crucial for understanding what your agent is doing while waiting for responses, especially when using tools like Coinbase's AgentKit.

### Key Components

- **Agents SDK**: Framework for building multi-agent workflows
- **ChatKit**: Embeddable UI component with built-in tool visualization
- **Tracing Dashboard**: OpenAI's hosted monitoring solution
- **Streaming Events**: Real-time event stream from agent execution

---

## Real-time Tool Visualization Options

### 1. ChatKit (Recommended for UI Applications)

ChatKit provides **built-in visualization** of agentic actions without additional code:

**Key Features:**
- Automatic tool call visualization
- Chain-of-thought reasoning display
- Response streaming
- No custom UI code required

**Quick Setup:**

```javascript
// React Component
import { ChatKit, useChatKit } from '@openai/chatkit-react';

function MyChat({ clientToken }) {
  const { control } = useChatKit({ 
    api: { clientToken } 
  });
  
  return (
    <ChatKit 
      control={control} 
      className="h-[600px] w-[320px]" 
    />
  );
}
```

```javascript
// Web Component (Vanilla JS)
const chatkit = document.createElement('openai-chatkit');
chatkit.setOptions({ 
  api: { clientToken } 
});
chatkit.classList.add('h-[600px]', 'w-[320px]');
document.body.appendChild(chatkit);
```

ChatKit automatically shows:
- Tool calls as they happen
- Function arguments being passed
- Tool execution results
- Agent handoffs
- Multi-step reasoning

### 2. Streaming Events (For Custom UIs)

If you need custom visualization, use the Agents SDK streaming API:

```python
from agents import Agent, Runner
import asyncio

async def main():
    agent = Agent(
        name="Assistant",
        instructions="You are a helpful assistant.",
        tools=[your_tools]
    )
    
    result = Runner.run_streamed(agent, input="Your query")
    
    # Stream events in real-time
    async for event in result.stream_events():
        if event.type == "run_item_stream_event":
            if event.name == "tool_called":
                print(f"🔧 Tool Called: {event.item.tool_name}")
            elif event.name == "tool_output":
                print(f"✓ Tool Result: {event.item.output}")
            elif event.name == "message_output_created":
                print(f"💬 Message: {event.item.text}")

asyncio.run(main())
```

### 3. OpenAI Traces Dashboard

**Free, automatic monitoring** at https://platform.openai.com/traces

Enabled by default - no configuration needed!

---

## Streaming Events in Agent SDK

### Event Types

The Agent SDK emits three types of streaming events:

#### 1. Raw Response Events
Token-by-token output from the LLM:

```python
from openai.types.responses import ResponseTextDeltaEvent

async for event in result.stream_events():
    if event.type == "raw_response_event":
        if isinstance(event.data, ResponseTextDeltaEvent):
            print(event.data.delta, end="", flush=True)
```

#### 2. Run Item Stream Events
High-level events for completed actions:

```python
async for event in result.stream_events():
    if event.type == "run_item_stream_event":
        if event.item.type == "tool_call_item":
            print(f"Tool: {event.item.tool_name}")
            print(f"Args: {event.item.arguments}")
        
        elif event.item.type == "tool_call_output_item":
            print(f"Output: {event.item.output}")
        
        elif event.item.type == "message_output_item":
            print(f"Message: {ItemHelpers.text_message_output(event.item)}")
```

#### 3. Agent Updated Stream Events
Triggered when agents handoff:

```python
async for event in result.stream_events():
    if event.type == "agent_updated_stream_event":
        print(f"Agent switched to: {event.new_agent.name}")
```

### Complete Streaming Example

```python
import asyncio
import random
from agents import Agent, ItemHelpers, Runner, function_tool
from openai.types.responses import ResponseTextDeltaEvent

@function_tool
def get_balance(wallet_address: str) -> str:
    """Get wallet balance"""
    return f"Balance: 1.5 ETH"

async def main():
    agent = Agent(
        name="CryptoAgent",
        instructions="Help users with crypto operations using available tools.",
        tools=[get_balance],
    )
    
    result = Runner.run_streamed(
        agent,
        input="What's my balance?",
    )
    
    print("=== Agent Running ===\n")
    
    async for event in result.stream_events():
        # Show token-by-token responses
        if event.type == "raw_response_event":
            if isinstance(event.data, ResponseTextDeltaEvent):
                print(event.data.delta, end="", flush=True)
        
        # Show tool calls and outputs
        elif event.type == "run_item_stream_event":
            if event.name == "tool_called":
                print(f"\n\n🔧 Calling tool: {event.item.tool_name}")
                
            elif event.name == "tool_output":
                print(f"✅ Tool result: {event.item.output}\n")
                
            elif event.name == "message_output_created":
                print(f"\n💬 Agent response:\n{ItemHelpers.text_message_output(event.item)}")
        
        # Show agent handoffs
        elif event.type == "agent_updated_stream_event":
            print(f"\n🔄 Switched to agent: {event.new_agent.name}\n")
    
    print("\n=== Complete ===")

if __name__ == "__main__":
    asyncio.run(main())
```

---

## Built-in Tracing Dashboard

### Automatic Tracing

**Tracing is enabled by default** and sends data to OpenAI's platform at https://platform.openai.com/traces

No setup required! Every agent run is automatically traced with:
- LLM generations
- Tool calls with arguments and outputs
- Handoffs between agents
- Guardrail checks
- Execution times and costs

### What Gets Traced

```python
from agents import Agent, Runner

# This automatically creates a trace
agent = Agent(name="Assistant", instructions="...")
result = await Runner.run(agent, "Your query")

# View the trace at: https://platform.openai.com/traces
```

The trace includes:
- **Agent Spans**: Each agent execution
- **Generation Spans**: LLM calls with inputs/outputs
- **Function Spans**: Tool calls with parameters and results
- **Handoff Spans**: Agent-to-agent transitions
- **Guardrail Spans**: Safety check results

### Custom Trace Names

```python
from agents import Agent, Runner, trace

async def main():
    agent = Agent(name="Assistant", instructions="...")
    
    with trace("Crypto Transaction Workflow"):
        result1 = await Runner.run(agent, "Check balance")
        result2 = await Runner.run(agent, f"Transfer based on: {result1.final_output}")
```

### Disabling Tracing

```python
# Option 1: Environment variable
import os
os.environ["OPENAI_AGENTS_DISABLE_TRACING"] = "1"

# Option 2: Per-run configuration
from agents.run import RunConfig

result = await Runner.run(
    agent, 
    "Your query",
    run_config=RunConfig(tracing_disabled=True)
)
```

### Using Traces with Non-OpenAI Models

```python
import os
from agents import set_tracing_export_api_key, Agent, Runner
from agents.extensions.models.litellm_model import LitellmModel

# Use OpenAI key for free tracing only
tracing_api_key = os.environ["OPENAI_API_KEY"]
set_tracing_export_api_key(tracing_api_key)

# Use different model
model = LitellmModel(
    model="gpt-5",  # or any other model
    api_key="your-model-api-key",
)

agent = Agent(
    name="Assistant",
    model=model,
)

# Traces still appear at https://platform.openai.com/traces
```

---

## ChatKit Integration

### Why Use ChatKit for Tool Visualization

ChatKit provides **zero-configuration tool visualization**:
- Automatically shows tool calls in progress
- Displays tool arguments and results
- Visualizes multi-step reasoning
- Handles streaming responses
- Shows agent handoffs

### Setting Up ChatKit

#### Step 1: Get a Client Token

Create a client token from your OpenAI dashboard that has access to your agent/workflow.

#### Step 2: Install ChatKit

```bash
# React
npm install @openai/chatkit-react

# Web Component
npm install @openai/chatkit-web-component
```

#### Step 3: Implement

**React Implementation:**

```jsx
import { ChatKit, useChatKit } from '@openai/chatkit-react';

function AgentChat() {
  const { control } = useChatKit({
    api: { 
      clientToken: 'your-client-token' 
    }
  });

  return (
    <div className="flex flex-col h-screen">
      <h1>My Agent Chat</h1>
      <ChatKit 
        control={control}
        className="flex-1 w-full max-w-4xl"
      />
    </div>
  );
}
```

**Web Component Implementation:**

```html
<!DOCTYPE html>
<html>
<head>
    <script type="module">
        import 'https://cdn.jsdelivr.net/npm/@openai/chatkit-web-component';
    </script>
</head>
<body>
    <openai-chatkit 
        id="chat"
        class="h-[600px] w-[400px]"
    ></openai-chatkit>
    
    <script>
        const chatkit = document.getElementById('chat');
        chatkit.setOptions({
            api: {
                clientToken: 'your-client-token'
            }
        });
    </script>
</body>
</html>
```

### What ChatKit Shows Automatically

When your agent uses tools, ChatKit displays:

1. **Tool Call Indicator**: Shows which tool is being called
2. **Parameters**: Displays the arguments passed to the tool
3. **Execution Status**: Loading state while tool runs
4. **Results**: Shows the tool's output
5. **Reasoning**: Displays chain-of-thought if enabled

---

## Complete Implementation Examples

### Example 1: Coinbase AgentKit with Streaming Visualization

```python
import asyncio
from agents import Agent, Runner, function_tool
from openai.types.responses import ResponseTextDeltaEvent
from coinbase_agentkit import AgentKit, AgentKitConfig, CdpWalletProvider

# Setup Coinbase AgentKit
wallet_provider = CdpWalletProvider(
    api_key_name="YOUR_CDP_KEY",
    api_key_private="YOUR_PRIVATE_KEY",
    network_id="base-mainnet"
)

agent_kit = AgentKit(AgentKitConfig(
    wallet_provider=wallet_provider
))

# Get AgentKit tools
from coinbase_agentkit_langchain import get_langchain_tools
agentkit_tools = get_langchain_tools(agent_kit)

# Create agent
agent = Agent(
    name="CryptoAssistant",
    instructions="Help users with crypto operations. Always confirm before making transactions.",
    tools=agentkit_tools,
)

async def run_with_visualization(user_input: str):
    """Run agent with real-time tool visualization"""
    
    result = Runner.run_streamed(agent, input=user_input)
    
    print(f"User: {user_input}\n")
    print("Agent is thinking...\n")
    
    tool_calls = []
    
    async for event in result.stream_events():
        # Track token streaming
        if event.type == "raw_response_event":
            if isinstance(event.data, ResponseTextDeltaEvent):
                print(event.data.delta, end="", flush=True)
        
        # Visualize tool calls
        elif event.type == "run_item_stream_event":
            if event.name == "tool_called":
                tool_info = {
                    'name': event.item.tool_name,
                    'args': event.item.arguments
                }
                tool_calls.append(tool_info)
                
                print(f"\n\n🔧 Executing: {event.item.tool_name}")
                print(f"   Parameters: {event.item.arguments}")
                
            elif event.name == "tool_output":
                print(f"   ✅ Result: {event.item.output}\n")
    
    print("\n\n=== Execution Complete ===")
    print(f"Tools used: {len(tool_calls)}")
    for i, tool in enumerate(tool_calls, 1):
        print(f"{i}. {tool['name']}")

# Usage
async def main():
    await run_with_visualization("What's my wallet balance?")
    await run_with_visualization("Send 0.1 ETH to 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb")

if __name__ == "__main__":
    asyncio.run(main())
```

### Example 2: Multi-Agent System with Handoff Visualization

```python
import asyncio
from agents import Agent, Runner

# Create specialized agents
spanish_agent = Agent(
    name="SpanishAgent",
    instructions="You only speak Spanish and help with Spanish queries.",
)

english_agent = Agent(
    name="EnglishAgent", 
    instructions="You only speak English and help with English queries.",
)

# Create triage agent
triage_agent = Agent(
    name="TriageAgent",
    instructions="Route to appropriate agent based on language.",
    handoffs=[spanish_agent, english_agent],
)

async def run_with_handoff_viz(query: str):
    result = Runner.run_streamed(triage_agent, input=query)
    
    current_agent = "TriageAgent"
    
    async for event in result.stream_events():
        if event.type == "agent_updated_stream_event":
            print(f"\n🔄 HANDOFF: {current_agent} → {event.new_agent.name}\n")
            current_agent = event.new_agent.name
        
        elif event.type == "run_item_stream_event":
            if event.name == "message_output_created":
                from agents import ItemHelpers
                print(ItemHelpers.text_message_output(event.item))

# Test handoffs
asyncio.run(run_with_handoff_viz("Hola, ¿cómo estás?"))
```

### Example 3: Custom Real-time Dashboard

```python
import asyncio
from datetime import datetime
from agents import Agent, Runner, function_tool

@function_tool
def fetch_data(source: str) -> str:
    """Fetch data from a source"""
    return f"Data from {source}"

class AgentMonitor:
    def __init__(self):
        self.start_time = None
        self.tool_calls = []
        self.tokens_generated = 0
    
    def start(self):
        self.start_time = datetime.now()
        print("\n" + "="*60)
        print("🤖 AGENT EXECUTION MONITOR")
        print("="*60 + "\n")
    
    def log_tool_call(self, name: str, args: dict, result: str):
        elapsed = (datetime.now() - self.start_time).total_seconds()
        self.tool_calls.append({
            'name': name,
            'time': elapsed,
            'args': args,
            'result': result
        })
        print(f"[{elapsed:.2f}s] 🔧 {name}")
        print(f"         Args: {args}")
        print(f"         Result: {result[:100]}...")
    
    def log_token(self, token: str):
        self.tokens_generated += 1
    
    def summary(self):
        elapsed = (datetime.now() - self.start_time).total_seconds()
        print("\n" + "="*60)
        print("📊 EXECUTION SUMMARY")
        print("="*60)
        print(f"Total Time: {elapsed:.2f}s")
        print(f"Tool Calls: {len(self.tool_calls)}")
        print(f"Tokens: {self.tokens_generated}")
        print("="*60 + "\n")

async def monitored_run(query: str):
    agent = Agent(
        name="DataAgent",
        instructions="Fetch data and provide insights.",
        tools=[fetch_data]
    )
    
    monitor = AgentMonitor()
    monitor.start()
    
    result = Runner.run_streamed(agent, input=query)
    
    current_tool_name = None
    current_tool_args = None
    
    async for event in result.stream_events():
        if event.type == "raw_response_event":
            from openai.types.responses import ResponseTextDeltaEvent
            if isinstance(event.data, ResponseTextDeltaEvent):
                monitor.log_token(event.data.delta)
        
        elif event.type == "run_item_stream_event":
            if event.name == "tool_called":
                current_tool_name = event.item.tool_name
                current_tool_args = event.item.arguments
            
            elif event.name == "tool_output":
                monitor.log_tool_call(
                    current_tool_name,
                    current_tool_args,
                    event.item.output
                )
    
    monitor.summary()

asyncio.run(monitored_run("Fetch data from API and database"))
```

---

## AgentKit Integration with Coinbase

### Overview

Coinbase AgentKit is a separate toolkit for enabling crypto operations. It integrates seamlessly with OpenAI's Agent SDK.

### Installation

```bash
# Python
pip install coinbase-agentkit coinbase-agentkit-langchain

# TypeScript
npm install @coinbase/agentkit @coinbase/agentkit-langchain
```

### Basic Setup

```python
from coinbase_agentkit import AgentKit, AgentKitConfig
from coinbase_agentkit import CdpWalletProvider, CdpWalletProviderConfig

# Configure wallet
wallet_provider = CdpWalletProvider(
    CdpWalletProviderConfig(
        api_key_name="YOUR_CDP_API_KEY_NAME",
        api_key_private="YOUR_CDP_PRIVATE_KEY",
        network_id="base-mainnet"  # or "base-sepolia" for testnet
    )
)

# Create AgentKit instance
agent_kit = AgentKit(AgentKitConfig(
    wallet_provider=wallet_provider
))

# Get tools for OpenAI Agent SDK
from coinbase_agentkit_langchain import get_langchain_tools
tools = get_langchain_tools(agent_kit)

# Create agent with AgentKit tools
from agents import Agent

agent = Agent(
    name="CryptoAgent",
    instructions="You help users with crypto operations safely and efficiently.",
    tools=tools,
)
```

### Visualizing AgentKit Tool Calls

All the streaming and visualization methods work with AgentKit tools:

```python
from agents import Runner

async def main():
    result = Runner.run_streamed(
        agent,
        input="What's my wallet balance and send 0.1 ETH to vitalik.eth"
    )
    
    async for event in result.stream_events():
        if event.type == "run_item_stream_event":
            if event.name == "tool_called":
                # AgentKit tools will appear here
                print(f"Crypto operation: {event.item.tool_name}")
            elif event.name == "tool_output":
                print(f"Result: {event.item.output}")
```

---

## Best Practices

### 1. Choose the Right Visualization Method

- **ChatKit**: Best for production apps with users
- **Streaming Events**: Best for custom dashboards or logging
- **Traces Dashboard**: Best for debugging and monitoring

### 2. Handle Errors in Streaming

```python
try:
    async for event in result.stream_events():
        # Process events
        pass
except Exception as e:
    print(f"Error during streaming: {e}")
```

### 3. Filter Events for Performance

```python
# Only process important events
async for event in result.stream_events():
    if event.type == "raw_response_event":
        continue  # Skip token-by-token for performance
    
    # Only handle high-level events
    if event.type == "run_item_stream_event":
        # Process tool calls, outputs, etc.
        pass
```

### 4. Combine Multiple Visualization Methods

```python
# Use streaming for UI + traces for debugging
result = Runner.run_streamed(agent, input="query")

# Streaming handles UI
async for event in result.stream_events():
    update_ui(event)

# Traces automatically captured at:
# https://platform.openai.com/traces
```

---

## Troubleshooting

### Issue: Not Seeing Tool Calls in Streaming

**Solution**: Ensure you're checking the correct event type:

```python
if event.type == "run_item_stream_event" and event.name == "tool_called":
    print(f"Tool: {event.item.tool_name}")
```

### Issue: Traces Not Appearing in Dashboard

**Solutions**:
1. Check that tracing isn't disabled:
   ```python
   # Remove this if present:
   # os.environ["OPENAI_AGENTS_DISABLE_TRACING"] = "1"
   ```

2. Verify API key is set:
   ```python
   import os
   print(os.environ.get("OPENAI_API_KEY"))
   ```

### Issue: ChatKit Not Showing Tool Visualization

**Solution**: Ensure your agent is properly configured with tools and the client token has correct permissions.

---

## Additional Resources

- **Agent SDK Documentation**: https://openai.github.io/openai-agents-python/
- **ChatKit Documentation**: https://openai.github.io/chatkit-js/
- **Traces Dashboard**: https://platform.openai.com/traces
- **Coinbase AgentKit**: https://docs.cdp.coinbase.com/agent-kit/
- **OpenAI Dev Community**: https://community.openai.com/

---

## Quick Reference

### Stream All Events
```python
async for event in Runner.run_streamed(agent, query).stream_events():
    print(event.type, event.name if hasattr(event, 'name') else '')
```

### View Traces
```
https://platform.openai.com/traces
```

### Embed ChatKit
```jsx
<ChatKit control={control} className="h-screen w-full" />
```

### Disable Tracing
```python
os.environ["OPENAI_AGENTS_DISABLE_TRACING"] = "1"
```
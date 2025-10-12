"""
AI SDK v5 compatible endpoint for assistant-ui integration.
Uses the OpenAI Agents SDK directly (NO ChatKit).
"""

from __future__ import annotations

import json
import os
from typing import Any, AsyncIterator
from fastapi.responses import StreamingResponse
from agents import Agent, Runner, SQLiteSession, RunConfig
from agents.model_settings import ModelSettings
from openai import AsyncOpenAI
from .jason_agent import jason_agent

# Test agent without tools/vector store
test_agent = Agent(
    name="TestJason",
    instructions="You are Jason. Respond casually.",
    model="gpt-4o",
)

# Direct OpenAI client for speed testing
openai_client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))

DEBUG_MODE = False  # Disable debug logging for speed


class AISDKChatHandler:
    """Handles AI SDK v5 format chat requests using the full Jason Agent."""

    def __init__(self):
        self.sessions: dict[str, SQLiteSession] = {}

    def _get_session(self, thread_id: str) -> SQLiteSession:
        """Get or create SQLiteSession for a thread."""
        if thread_id not in self.sessions:
            self.sessions[thread_id] = SQLiteSession(
                session_id=thread_id,
                db_path="conversations.db"
            )
        return self.sessions[thread_id]

    async def handle_chat(self, request_data: dict[str, Any]) -> StreamingResponse:
        """
        Handle AI SDK v5 chat request using the full Jason Agent.
        
        Expected format:
        {
            "messages": [
                {"role": "user", "content": "Hello"},
                {"role": "assistant", "content": "Hi there!"},
                {"role": "user", "content": "How are you?"}
            ]
        }
        """
        messages = request_data.get("messages", [])
        
        if not messages:
            raise ValueError("No messages provided")

        # Get the last user message
        last_message = messages[-1]
        if last_message.get("role") != "user":
            raise ValueError("Last message must be from user")

        user_content = last_message.get("content", "")
        
        # Use a thread ID (can be passed in or generated)
        thread_id = request_data.get("threadId", "default")
        session = self._get_session(thread_id)

        import time
        start_time = time.time()
        print(f"[Jason Agent] Processing: '{user_content[:50]}...'")
        print(f"[Jason Agent] Thread ID: {thread_id}")

        async def event_stream() -> AsyncIterator[str]:
            """Stream in AI SDK v5 data stream protocol format."""
            try:
                # Run the FULL Jason Agent (with optimizations)
                print(f"[Timing] Starting Jason Agent at {time.time() - start_time:.2f}s")
                
                result = Runner.run_streamed(
                    jason_agent,  # 🎯 Full Jason agent with tools + vector store
                    user_content,
                    session=session,  # Re-enable session for proper tool execution
                    run_config=RunConfig(
                        model_settings=ModelSettings(
                            parallel_tool_calls=True,
                            reasoning_effort="low",  # ✨ CRITICAL: Fast thinking mode (2-3s)
                            verbosity="low",
                        )
                    ),
                )
                
                first_token_time = None
                token_count = 0
                active_tools = set()  # Track active tools
                tool_call_buffer = ""  # Buffer to detect tool call JSON
                
                # Stream events
                async for event in result.stream_events():
                    event_name = getattr(event, 'name', None)
                    
                    # Handle tool call events for visualization
                    if event.type == "run_item_stream_event":
                        
                        if event_name == "tool_called":
                            # Extract tool name from the item
                            item_data = event.item
                            tool_name = None
                            
                            # Extract tool type from raw_item
                            if hasattr(item_data, 'raw_item') and hasattr(item_data.raw_item, 'type'):
                                tool_type = item_data.raw_item.type
                                
                                # Map tool types to friendly names
                                tool_name_map = {
                                    'file_search_call': 'file_search',
                                    'web_search_call': 'web_search',
                                    'function_call': None,  # Need to check function name
                                }
                                
                                tool_name = tool_name_map.get(tool_type)
                                
                                # For function calls, get the actual function name
                                if tool_type == 'function_call' and hasattr(item_data.raw_item, 'name'):
                                    tool_name = item_data.raw_item.name
                            
                            if tool_name:
                                active_tools.add(tool_name)
                                print(f"[Tool] {tool_name} called")
                                tool_data = json.dumps({"type": "tool_start", "name": tool_name})
                                yield f'9:{tool_data}\n'
                                
                        elif event_name == "tool_output":
                            item_data = event.item
                            tool_name = None
                            
                            # Extract tool type from raw_item (same as tool_called)
                            if hasattr(item_data, 'raw_item') and hasattr(item_data.raw_item, 'type'):
                                tool_type = item_data.raw_item.type
                                
                                # Map tool types to friendly names
                                tool_name_map = {
                                    'file_search_call': 'file_search',
                                    'web_search_call': 'web_search',
                                    'function_call': None,
                                }
                                
                                tool_name = tool_name_map.get(tool_type)
                                
                                # For function calls, get the actual function name
                                if tool_type == 'function_call' and hasattr(item_data.raw_item, 'name'):
                                    tool_name = item_data.raw_item.name
                            
                            if tool_name and tool_name in active_tools:
                                active_tools.remove(tool_name)
                                print(f"[Tool] {tool_name} completed")
                                tool_data = json.dumps({"type": "tool_end", "name": tool_name})
                                yield f'9:{tool_data}\n'
                    
                    # Handle raw response events (text deltas)
                    if event.type == "raw_response_event":
                        if hasattr(event.data, 'delta') and event.data.delta:
                            text_delta = event.data.delta
                            
                            # Buffer text to detect tool call JSON patterns
                            tool_call_buffer += text_delta
                            
                            # Skip if this looks like a tool call JSON (starts with { and has common keys)
                            if tool_call_buffer.strip().startswith('{'):
                                # Check if it contains tool argument patterns
                                if any(key in tool_call_buffer for key in ['"reel_url":', '"query":', '"url":', '"search_term":']):
                                    # Keep buffering until we see the closing brace
                                    if '}' in tool_call_buffer:
                                        # Skip this entire JSON blob, clear buffer
                                        tool_call_buffer = ""
                                    continue
                                elif len(tool_call_buffer) > 100:
                                    # If buffer is large and not a tool call, send it
                                    tool_call_buffer = ""
                                else:
                                    # Keep buffering
                                    continue
                            
                            # If we have buffered text that's not a tool call, send it
                            if tool_call_buffer and not tool_call_buffer.strip().startswith('{'):
                                # Clear any active tools when real text starts (they've completed)
                                for tool in list(active_tools):
                                    print(f"[Tool] {tool} completed (text started)")
                                    tool_data = json.dumps({"type": "tool_end", "name": tool})
                                    yield f'9:{tool_data}\n'
                                    active_tools.remove(tool)
                                
                                if first_token_time is None:
                                    first_token_time = time.time()
                                    ttft = first_token_time - start_time
                                    print(f"[TTFT] Jason Agent first token: {ttft:.2f}s")
                                
                                token_count += 1
                                json_text = json.dumps(tool_call_buffer)
                                yield f'0:{json_text}\n'
                                tool_call_buffer = ""

                # Send completion metadata
                yield 'e:{"finishReason":"stop","usage":{"promptTokens":0,"completionTokens":0}}\n'
                
                # Send done marker
                yield 'd\n'
                
                print(f"[Jason Agent] Stream complete")

            except Exception as e:
                import traceback
                traceback.print_exc()
                print(f"[Jason Agent] Error: {e}")
                # Send error in AI SDK format
                error_msg = str(e).replace('"', '\\"')
                yield f'3:"{error_msg}"\n'

        return StreamingResponse(
            event_stream(),
            media_type="text/plain; charset=utf-8",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no",
            },
        )


from __future__ import annotations

import os
from typing import Any, AsyncIterator

from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

from agents import RunConfig, Runner, SQLiteSession, trace
from agents.model_settings import ModelSettings
from chatkit.agents import AgentContext, stream_agent_response
from chatkit.server import ChatKitServer, StreamingResult
from chatkit.types import (
    Attachment,
    ClientToolCallItem,
    ThreadItem,
    ThreadMetadata,
    ThreadStreamEvent,
    UserMessageItem,
)
try:
    from chatkit.types import ProgressUpdateEvent
except ImportError:
    # Fallback if ProgressUpdateEvent doesn't exist
    ProgressUpdateEvent = None
from fastapi import Depends, FastAPI, Request, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response, StreamingResponse
from openai import OpenAI
from openai.types.responses import ResponseInputContentParam
from starlette.responses import JSONResponse
import secrets
import tempfile
import base64
import mimetypes

from .jason_agent import jason_agent, JASON_VECTOR_STORE_ID, select_agent_for_query
from .memory_store import MemoryStore


def _user_message_text(item: UserMessageItem) -> str:
    parts: list[str] = []
    for part in item.content:
        text = getattr(part, "text", None)
        if text:
            parts.append(text)
    return " ".join(parts).strip()


def _get_attachment_refs(item: UserMessageItem) -> list[str]:
    """Extract attachment IDs from user message content."""
    attachment_ids: list[str] = []
    print(f"[_get_attachment_refs] Processing {len(item.content)} content parts")
    for i, part in enumerate(item.content):
        print(f"[_get_attachment_refs] Part {i}: type={type(part).__name__}, attrs={dir(part)}")
        print(f"[_get_attachment_refs] Part {i} content: {part}")
        
        # Check for different possible attachment reference formats
        if hasattr(part, "attachment_id") and part.attachment_id:
            print(f"[_get_attachment_refs] Found attachment_id: {part.attachment_id}")
            attachment_ids.append(part.attachment_id)
        elif hasattr(part, "attachment") and part.attachment:
            print(f"[_get_attachment_refs] Found attachment object: {part.attachment}")
            if hasattr(part.attachment, "id"):
                attachment_ids.append(part.attachment.id)
        elif hasattr(part, "type") and part.type in ["image", "file", "attachment"]:
            print(f"[_get_attachment_refs] Found {part.type} type part")
            # Try to extract ID from various possible attributes
            for attr in ["id", "file_id", "image_id", "attachment_id"]:
                if hasattr(part, attr) and getattr(part, attr):
                    attachment_ids.append(getattr(part, attr))
                    break
    
    print(f"[_get_attachment_refs] Total found: {attachment_ids}")
    return attachment_ids


def _is_tool_completion_item(item: Any) -> bool:
    return isinstance(item, ClientToolCallItem)


class JasonCoachingServer(ChatKitServer[dict[str, Any]]):
    def __init__(self, agent) -> None:
        self.store = MemoryStore()
        # Pass the store as both the store AND the attachment_store
        super().__init__(self.store, attachment_store=self.store)
        self.assistant = agent
        # Cache SQLiteSession instances per thread
        self.sessions: dict[str, SQLiteSession] = {}
        # Track active tools for progress visualization
        self.active_tools: dict[str, str] = {}
    
    def _get_tool_progress_message(
        self, 
        tool_name: str, 
        status: str = "running",
        queries: list[str] | None = None
    ) -> str:
        """Convert tool name to user-friendly progress message with icons and query details."""
        
        # Extract first query if available
        query_text = None
        if queries and len(queries) > 0:
            # queries is typically a list like ['search term']
            query_text = queries[0] if isinstance(queries, list) else str(queries)
            # Truncate long queries
            if len(query_text) > 60:
                query_text = query_text[:60] + "..."
        
        # Base messages
        tool_messages = {
            "file_search": {
                "running": "🔎 Searching knowledge base",
                "completed": "✅ Found relevant content",
                "analyzing": "🧪 Analyzing Results"
            },
            "web_search": {
                "running": "🌐 Searching the web",
                "completed": "✅ Found latest information",
                "analyzing": "🧪 Analyzing Results"
            },
        }
        
        if tool_name in tool_messages:
            base_msg = tool_messages[tool_name].get(status, f"🔧 Using {tool_name}")
            
            # Add query details if running and query available
            if status == "running" and query_text:
                return f"{base_msg} for: \"{query_text}\""
            
            return base_msg + "..."
        
        # Fallback for unknown tools
        if status == "running" and query_text:
            return f"🔧 Using {tool_name} with query: \"{query_text}\""
        return f"🔧 Using {tool_name}..." if status == "running" else f"✅ Completed {tool_name}"
    
    def _get_session(self, thread_id: str) -> SQLiteSession:
        """Get or create a SQLiteSession for this thread."""
        if thread_id not in self.sessions:
            self.sessions[thread_id] = SQLiteSession(
                session_id=thread_id,
                db_path="conversations.db"  # All sessions in one DB
            )
        return self.sessions[thread_id]

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

        # Debug: Print the entire item structure
        print(f"[respond] UserMessageItem attributes: {dir(item)}")
        print(f"[respond] UserMessageItem data: {item}")
        
        message_text = _user_message_text(item)
        
        # Check for attachments at the item level (not just in content)
        attachment_ids = []
        if hasattr(item, "attachments") and item.attachments:
            print(f"[respond] Found item.attachments: {item.attachments}")
            for att in item.attachments:
                if hasattr(att, "id"):
                    attachment_ids.append(att.id)
                elif isinstance(att, str):
                    attachment_ids.append(att)
        
        # Also check content parts
        content_attachment_ids = _get_attachment_refs(item)
        attachment_ids.extend(content_attachment_ids)
        
        print(f"[respond] Message text: '{message_text[:50]}...'" if message_text else "[respond] No text")
        print(f"[respond] Found {len(attachment_ids)} attachment(s): {attachment_ids}")
        
        # Build input content - either string or list of content parts
        if attachment_ids:
            # Build multi-part input with text and attachments
            input_content = []
            
            # Add text if present
            if message_text:
                input_content.append({"type": "text", "text": message_text})
            
            # Convert and add each attachment
            for attachment_id in attachment_ids:
                try:
                    # Load the attachment metadata
                    attachment = await self.store.load_attachment(attachment_id, context)
                    print(f"[respond] Loaded attachment {attachment_id}: {attachment.name}")
                    
                    # Convert to Agent SDK format
                    attachment_content = await self.to_message_content(attachment)
                    input_content.append(attachment_content)
                    print(f"[respond] Converted attachment {attachment_id} to agent format")
                except Exception as e:
                    print(f"[respond] ERROR processing attachment {attachment_id}: {e}")
                    import traceback
                    traceback.print_exc()
            
            agent_input = input_content
        else:
            # Just text, no attachments
            agent_input = message_text
            
        if not message_text and not attachment_ids:
            return

        # Auto-generate thread title from first user message if not set
        if not thread.title and message_text:
            thread.title = self.store._generate_title_from_message(message_text)
            await self.store.save_thread(thread, context)

        # Get SQLiteSession for this thread (for agent memory)
        session = self._get_session(thread.id)
        
        # 🎯 Smart routing: Use GPT-5 Mini for simple queries, GPT-5 for complex ones
        selected_agent = select_agent_for_query(message_text or "image analysis")
        model_name = "GPT-5" if selected_agent.model == "gpt-5" else "GPT-5 Mini"
        print(f"[Routing] Using {model_name} for query: '{message_text[:50] if message_text else 'image/file'}...'")

        agent_context = AgentContext(
            thread=thread,
            store=self.store,
            request_context=context,
        )
        
        # 🧠 Emit initial "Thinking..." status BEFORE streaming starts
        if ProgressUpdateEvent is not None:
            try:
                thinking_event = ProgressUpdateEvent(text="🧠 Thinking...")
                yield thinking_event
                print("🧠 Yielded initial thinking status to ChatKit")
            except Exception as e:
                print(f"⚠️  Failed to yield initial thinking status: {e}")
        
        # Use tracing and session for better debugging and memory management
        with trace(f"Jason coaching - {thread.id[:8]}"):
            result = Runner.run_streamed(
                selected_agent,  # 🎯 Dynamically selected agent
                agent_input,  # 🖼️ Now includes attachments!
                context=agent_context,
                session=session,  # ✨ Native session support for agent memory
                run_config=RunConfig(
                    model_settings=ModelSettings(
                        parallel_tool_calls=True,  # 🔥 3-5x faster with parallel execution
                        reasoning_effort="medium",  # 🧠 Balanced reasoning depth
                        verbosity="low",  # 💬 Short responses (matches voice guidelines)
                    )
                ),
            )

            # 🔧 Stream events with ChatKit conversion
            # Pass result DIRECTLY to stream_agent_response for proper citation handling
            # This ensures file search citations render as clickable sources, not garbled text
            async for chatkit_event in stream_agent_response(agent_context, result):
                yield chatkit_event

    async def to_message_content(self, input: Attachment) -> ResponseInputContentParam:
        """Convert attachment to format GPT-5 can understand (images only for now)."""
        print(f"[to_message_content] Converting attachment {input.id} to message content")
        
        # Get attachment data from custom storage
        if not hasattr(self.store, '_attachment_data'):
            raise RuntimeError(f"Attachment storage not initialized")
        
        attachment_data = self.store._attachment_data.get(input.id)
        if not attachment_data:
            print(f"[to_message_content] ERROR: Attachment {input.id} not found in _attachment_data")
            print(f"[to_message_content] Available attachments: {list(self.store._attachment_data.keys())}")
            raise RuntimeError(f"Attachment {input.id} not found")
        
        mime_type = attachment_data["mime_type"]
        print(f"[to_message_content] Attachment MIME type: {mime_type}")
        
        # Only support images
        if not mime_type or not mime_type.startswith("image/"):
            raise RuntimeError(f"Only image attachments are supported. Got: {mime_type}")
        
        # Encode to base64 for GPT-5
        data_bytes = attachment_data.get("data")
        if not data_bytes:
            print(f"[to_message_content] ERROR: No data bytes for attachment {input.id}")
            raise RuntimeError(f"No data bytes for attachment {input.id}")
        
        base64_image = base64.b64encode(data_bytes).decode("utf-8")
        print(f"[to_message_content] Encoded image to base64, length: {len(base64_image)}")
        
        # Return in format GPT-5 expects
        result = {
            "type": "image_url",
            "image_url": {
                "url": f"data:{mime_type};base64,{base64_image}"
            }
        }
        print(f"[to_message_content] Returning image content to agent")
        return result


jason_server = JasonCoachingServer(agent=jason_agent)

app = FastAPI(title="Jason's Coaching ChatKit API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize OpenAI client for file operations
openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


def get_server() -> JasonCoachingServer:
    return jason_server


@app.post("/chatkit")
async def chatkit_endpoint(
    request: Request, server: JasonCoachingServer = Depends(get_server)
) -> Response:
    try:
        payload = await request.body()
        # Log session ID for debugging
        session_id = request.query_params.get("sid", "default")
        print(f"[ChatKit] Processing request for session: {session_id}")
        
        result = await server.process(payload, {"request": request})
        if isinstance(result, StreamingResult):
            return StreamingResponse(result, media_type="text/event-stream")
        if hasattr(result, "json"):
            return Response(content=result.json, media_type="application/json")
        return JSONResponse(result)
    except Exception as e:
        print(f"[ChatKit] Error processing request: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/health")
async def health_check() -> dict[str, str]:
    return {"status": "healthy", "agent": "Jason Cooperson Coaching Agent"}


@app.get("/")
async def root() -> dict[str, Any]:
    return {
        "message": "Jason's Coaching ChatKit API",
        "status": "running",
        "model": "GPT-5 with smart routing (GPT-5 Mini for simple queries)",
        "features": [
            "Image analysis (vision)",
            "Voice transcription (Whisper)",
            "Text-to-speech (TTS)",
            "Smart model routing",
            "Extended context (400k tokens)",
            "Reasoning control",
            "Parallel tool calls",
            "Interactive widgets (cards, forms, lists)",
            "Entity tagging (@mentions)",
            "Client tools (frontend actions)"
        ],
        "chatkit_features": {
            "widgets": "Interactive UI components (cards, forms, lists) with actions",
            "entities": "Entity tagging with @mentions, autocomplete, and rich previews",
            "client_tools": "Frontend-only tool calls (open links, copy to clipboard, etc.)",
            "history": "Multi-thread conversation management",
            "theming": "Customizable dark/light themes with brand colors"
        },
        "endpoints": {
            "chatkit": "/chatkit",
            "session": "/api/chatkit/session",
            "health": "/health",
            "files": {
                "list": "GET /api/files",
                "upload": "POST /api/files/upload",
                "delete": "DELETE /api/files/{file_id}"
            },
            "voice": {
                "transcribe": "POST /api/voice/transcribe",
                "speak": "POST /api/voice/speak"
            },
            "widgets": {
                "action": "POST /api/widget-action"
            }
        },
    }


@app.post("/api/chatkit/session")
async def create_session(request: Request) -> dict[str, str]:
    """
    Create a ChatKit session with a client secret.
    This endpoint is called by the ChatKit React component to establish a session.
    """
    try:
        # Generate a secure client secret
        client_secret = f"cs_{secrets.token_urlsafe(32)}"
        
        # In a production app, you would:
        # 1. Authenticate the user
        # 2. Store the session in a database
        # 3. Associate the session with the user
        # 4. Return the client secret
        
        return {
            "client_secret": client_secret,
            "session_id": secrets.token_urlsafe(16),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create session: {str(e)}")


@app.get("/api/files")
async def list_files() -> dict[str, Any]:
    """
    List all files in the vector store.
    """
    try:
        if not JASON_VECTOR_STORE_ID:
            return {"files": [], "vector_store_id": None}
        
        # Get vector store files
        vector_store_files = openai_client.beta.vector_stores.files.list(
            vector_store_id=JASON_VECTOR_STORE_ID
        )
        
        # Get file details for each file
        files_data = []
        for vs_file in vector_store_files.data:
            try:
                file_obj = openai_client.files.retrieve(vs_file.id)
                files_data.append({
                    "id": file_obj.id,
                    "filename": file_obj.filename,
                    "bytes": file_obj.bytes,
                    "created_at": file_obj.created_at,
                    "status": vs_file.status,
                })
            except Exception as e:
                print(f"Error retrieving file {vs_file.id}: {e}")
                continue
        
        return {
            "files": files_data,
            "vector_store_id": JASON_VECTOR_STORE_ID,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list files: {str(e)}")


@app.options("/upload/{attachment_id}")
async def upload_file_options(attachment_id: str):
    """Handle CORS preflight for Phase 2 file uploads."""
    return JSONResponse(
        content={},
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "*",
        }
    )


@app.post("/upload/{attachment_id}")
async def upload_file_bytes(attachment_id: str, file: UploadFile = File(...)):
    """
    Phase 2: Receive file bytes for an attachment created in Phase 1.
    This is the upload_url returned by ChatKit's attachments.create.
    """
    try:
        print(f"[Phase 2 Upload] Receiving file bytes for attachment: {attachment_id}")
        print(f"[Phase 2 Upload] Filename: {file.filename}, Content-Type: {file.content_type}")
        
        # Read file content
        content = await file.read()
        print(f"[Phase 2 Upload] File size: {len(content)} bytes")
        
        # Get the attachment from store
        if not hasattr(jason_server.store, '_attachment_data'):
            jason_server.store._attachment_data = {}
        
        attachment_data = jason_server.store._attachment_data.get(attachment_id)
        if not attachment_data:
            print(f"[Phase 2 Upload] ERROR: Attachment {attachment_id} not found in store")
            raise HTTPException(status_code=404, detail=f"Attachment {attachment_id} not found")
        
        # Update with actual file data
        attachment_data["data"] = content
        attachment_data["size"] = len(content)
        
        # Also update the Attachment object's size_bytes (best practice per docs)
        # Pydantic models are immutable, so we create a new instance with updated size
        attachment = jason_server.store._attachments.get(attachment_id)
        if attachment:
            # Use model_copy with update to create a new instance
            updated_attachment = attachment.model_copy(update={"size_bytes": len(content)})
            jason_server.store._attachments[attachment_id] = updated_attachment
        
        print(f"[Phase 2 Upload] Successfully stored {len(content)} bytes for {attachment_id}")
        
        # Return 200 OK with no body (ChatKit just needs success confirmation)
        return Response(status_code=200)
            
    except HTTPException:
        raise
    except Exception as e:
        print(f"[Phase 2 Upload] ERROR: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to upload file: {str(e)}")


@app.get("/api/files/attachment/{attachment_id}")
async def get_attachment(attachment_id: str) -> Response:
    """
    Retrieve an uploaded attachment by ID.
    """
    try:
        print(f"[Get Attachment] Requesting attachment: {attachment_id}")
        
        if not hasattr(jason_server.store, '_attachment_data'):
            print(f"[Get Attachment] No attachments stored")
            raise HTTPException(status_code=404, detail="Attachment not found")
        
        attachment_data = jason_server.store._attachment_data.get(attachment_id)
        if not attachment_data:
            print(f"[Get Attachment] Attachment {attachment_id} not found in store")
            raise HTTPException(status_code=404, detail=f"Attachment {attachment_id} not found")
        
        print(f"[Get Attachment] Returning {attachment_data['mime_type']} file: {attachment_data['name']}")
        
        return Response(
            content=attachment_data["data"],
            media_type=attachment_data["mime_type"],
            headers={
                "Content-Disposition": f'inline; filename="{attachment_data["name"]}"',
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, OPTIONS",
                "Access-Control-Allow-Headers": "*",
            }
        )
    except HTTPException:
        raise
    except Exception as e:
        print(f"[Get Attachment] ERROR: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to retrieve attachment: {str(e)}")


@app.delete("/api/files/{file_id}")
async def delete_file(file_id: str) -> dict[str, str]:
    """
    Delete a file from the vector store and OpenAI.
    """
    try:
        if not JASON_VECTOR_STORE_ID:
            raise HTTPException(
                status_code=400,
                detail="Vector store ID not configured."
            )
        
        # Delete from vector store
        try:
            openai_client.beta.vector_stores.files.delete(
                vector_store_id=JASON_VECTOR_STORE_ID,
                file_id=file_id
            )
        except Exception as e:
            print(f"Error deleting file from vector store: {e}")
        
        # Delete from OpenAI
        openai_client.files.delete(file_id)
        
        return {"status": "deleted", "file_id": file_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete file: {str(e)}")


@app.post("/api/voice/transcribe")
async def transcribe_audio(file: UploadFile = File(...)) -> dict[str, str]:
    """
    Transcribe audio to text using Whisper API.
    """
    try:
        # Read audio file
        content = await file.read()
        
        # Create temp file with correct extension
        suffix = f"_{file.filename}" if file.filename else ".mp3"
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            tmp.write(content)
            tmp_path = tmp.name
        
        try:
            # Transcribe with Whisper
            with open(tmp_path, "rb") as audio_file:
                transcript = openai_client.audio.transcriptions.create(
                    model="whisper-1",
                    file=audio_file,
                    response_format="text"
                )
            
            return {
                "text": transcript,
                "status": "success"
            }
        finally:
            # Clean up temp file
            os.unlink(tmp_path)
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to transcribe audio: {str(e)}")


@app.post("/api/voice/speak")
async def text_to_speech(request: Request) -> Response:
    """
    Convert text to speech using OpenAI TTS API.
    """
    try:
        body = await request.json()
        text = body.get("text", "")
        voice = body.get("voice", "alloy")  # alloy, echo, fable, onyx, nova, shimmer
        
        if not text:
            raise HTTPException(status_code=400, detail="Text is required")
        
        # Generate speech
        response = openai_client.audio.speech.create(
            model="tts-1",  # or tts-1-hd for higher quality
            voice=voice,
            input=text
        )
        
        # Return audio data
        return Response(
            content=response.content,
            media_type="audio/mpeg",
            headers={
                "Content-Disposition": "attachment; filename=speech.mp3"
            }
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate speech: {str(e)}")


@app.post("/api/widget-action")
async def handle_widget_action(request: Request) -> dict[str, str]:
    """
    Handle widget action events from ChatKit frontend.
    This is called when users interact with widgets (buttons, forms, etc.)
    """
    try:
        body = await request.json()
        action = body.get("action", {})
        widget_item_id = body.get("widgetItemId")
        session_id = body.get("sessionId")
        
        print(f"[Widget Action] Session: {session_id}, Widget: {widget_item_id}")
        print(f"[Widget Action] Action type: {action.get('type')}")
        print(f"[Widget Action] Payload: {action.get('payload')}")
        
        # Handle different action types
        action_type = action.get("type")
        
        if action_type == "example":
            # Example action handler
            return {"status": "success", "message": "Example action handled"}
        
        # Add more action handlers as needed
        # You can store data, trigger workflows, update databases, etc.
        
        return {
            "status": "received",
            "action_type": action_type,
            "message": "Widget action received"
        }
        
    except Exception as e:
        print(f"[Widget Action] Error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to handle widget action: {str(e)}")

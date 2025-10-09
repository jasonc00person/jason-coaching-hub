from __future__ import annotations

import os
from typing import Any, AsyncIterator

from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

from agents import RunConfig, Runner, SQLiteSession, trace

# Performance optimization: disable debug logging in production
DEBUG_MODE = os.getenv("DEBUG_MODE", "false").lower() == "true"
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
# ProgressUpdateEvent commented out - keep server events raw (v0.0.2 compatibility)
# try:
#     from chatkit.types import ProgressUpdateEvent
# except ImportError:
#     # Fallback if ProgressUpdateEvent doesn't exist
#     ProgressUpdateEvent = None
ProgressUpdateEvent = None  # Disabled for v0.0.2
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

from .jason_agent import jason_agent, JASON_VECTOR_STORE_ID
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
    if DEBUG_MODE:
        print(f"[_get_attachment_refs] Processing {len(item.content)} content parts")
    for i, part in enumerate(item.content):
        if DEBUG_MODE:
            print(f"[_get_attachment_refs] Part {i}: type={type(part).__name__}, attrs={dir(part)}")
            print(f"[_get_attachment_refs] Part {i} content: {part}")
        
        # Check for different possible attachment reference formats
        if hasattr(part, "attachment_id") and part.attachment_id:
            if DEBUG_MODE:
                print(f"[_get_attachment_refs] Found attachment_id: {part.attachment_id}")
            attachment_ids.append(part.attachment_id)
        elif hasattr(part, "attachment") and part.attachment:
            if DEBUG_MODE:
                print(f"[_get_attachment_refs] Found attachment object: {part.attachment}")
            if hasattr(part.attachment, "id"):
                attachment_ids.append(part.attachment.id)
        elif hasattr(part, "type") and part.type in ["image", "file", "attachment"]:
            if DEBUG_MODE:
                print(f"[_get_attachment_refs] Found {part.type} type part")
            # Try to extract ID from various possible attributes
            for attr in ["id", "file_id", "image_id", "attachment_id"]:
                if hasattr(part, attr) and getattr(part, attr):
                    attachment_ids.append(getattr(part, attr))
                    break
    
    if DEBUG_MODE:
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

        # Debug: Print the entire item structure (only in debug mode)
        if DEBUG_MODE:
            print(f"[respond] UserMessageItem attributes: {dir(item)}")
            print(f"[respond] UserMessageItem data: {item}")
        
        message_text = _user_message_text(item)
        
        # Check for attachments at the item level (not just in content)
        attachment_ids = []
        if hasattr(item, "attachments") and item.attachments:
            if DEBUG_MODE:
                print(f"[respond] Found item.attachments: {item.attachments}")
            for att in item.attachments:
                if hasattr(att, "id"):
                    attachment_ids.append(att.id)
                elif isinstance(att, str):
                    attachment_ids.append(att)
        
        # Also check content parts
        content_attachment_ids = _get_attachment_refs(item)
        attachment_ids.extend(content_attachment_ids)
        
        if DEBUG_MODE:
            print(f"[respond] Message text: '{message_text[:50]}...'" if message_text else "[respond] No text")
            print(f"[respond] Found {len(attachment_ids)} attachment(s): {attachment_ids}")
        
        # Build input content - either string or list with message wrapper
        if attachment_ids:
            # Build multi-part message content with text and inline attachments (images, text files)
            # AND separate attachments array for PDFs/docs
            message_content = []
            message_attachments = []  # For PDFs that need file_search
            
            # Add text if present
            if message_text:
                message_content.append({"type": "input_text", "text": message_text})
            
            # Convert and add each attachment
            for attachment_id in attachment_ids:
                try:
                    # Load the attachment metadata
                    attachment = await self.store.load_attachment(attachment_id, context)
                    if DEBUG_MODE:
                        print(f"[respond] Loaded attachment {attachment_id}: {attachment.name}")
                    
                    # Convert to Agent SDK format
                    attachment_content = await self.to_message_content(attachment)
                    
                    # Check if this is a file_id reference (PDF/doc) vs inline content
                    if isinstance(attachment_content, dict) and attachment_content.get("_is_file_attachment"):
                        # This is a PDF/doc - add to attachments array
                        file_id = attachment_content["file_id"]
                        message_attachments.append({
                            "file_id": file_id,
                            "tools": [{"type": "file_search"}]
                        })
                        if DEBUG_MODE:
                            print(f"[respond] Added {file_id} to message attachments for file_search")
                        
                        # Also add a note to the message content
                        message_content.append({
                            "type": "input_text",
                            "text": f"[Document attached: {attachment.name}]"
                        })
                    else:
                        # Inline content (image, text file)
                        message_content.append(attachment_content)
                        if DEBUG_MODE:
                            print(f"[respond] Added inline attachment to content")
                            
                except Exception as e:
                    print(f"[respond] ERROR processing attachment {attachment_id}: {e}")
                    if DEBUG_MODE:
                        import traceback
                        traceback.print_exc()
            
            # Wrap in a message format for Responses API
            message_dict = {
                "type": "message",
                "role": "user",
                "content": message_content
            }
            
            # Add attachments array if we have any PDFs/docs
            if message_attachments:
                message_dict["attachments"] = message_attachments
                if DEBUG_MODE:
                    print(f"[respond] Message has {len(message_attachments)} file attachment(s) for file_search")
            
            agent_input = [message_dict]
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
        
        # 🎯 Using handoff-based routing: Triage agent automatically routes to Quick Response or Strategy
        if DEBUG_MODE:
            print(f"[Handoff System] Processing query: '{message_text[:50] if message_text else 'image/file'}...'")

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
                if DEBUG_MODE:
                    print("🧠 Yielded initial thinking status to ChatKit")
            except Exception as e:
                if DEBUG_MODE:
                    print(f"⚠️  Failed to yield initial thinking status: {e}")
        
        # When we have attachments (list input), disable session memory
        # Agent SDK requires a session_input_callback for list inputs with sessions
        use_session = None if attachment_ids else session
        
        # Conditional tracing: only trace in debug mode to reduce latency
        if DEBUG_MODE:
            with trace(f"Jason coaching - {thread.id[:8]}"):
                result = Runner.run_streamed(
                    self.assistant,  # 🎯 Triage agent with automatic handoffs
                    agent_input,  # 🖼️ Now includes attachments!
                    context=agent_context,
                    session=use_session,  # ✨ Disable session for image messages (Agent SDK limitation)
                    run_config=RunConfig(
                        model_settings=ModelSettings(
                            parallel_tool_calls=True,  # 🔥 3-5x faster with parallel execution
                            reasoning_effort="low",  # ⚡ Low reasoning for faster responses (30-40% speedup)
                            verbosity="low",  # 💬 Short responses (matches voice guidelines)
                        )
                    ),
                )
                # 🔧 Stream events with ChatKit conversion
                async for chatkit_event in stream_agent_response(agent_context, result):
                    yield chatkit_event
        else:
            # Production mode: no tracing overhead
            result = Runner.run_streamed(
                self.assistant,  # 🎯 Triage agent with automatic handoffs
                agent_input,  # 🖼️ Now includes attachments!
                context=agent_context,
                session=use_session,  # ✨ Disable session for image messages (Agent SDK limitation)
                run_config=RunConfig(
                    model_settings=ModelSettings(
                        parallel_tool_calls=True,  # 🔥 3-5x faster with parallel execution
                        reasoning_effort="low",  # ⚡ Low reasoning for faster responses (30-40% speedup)
                        verbosity="low",  # 💬 Short responses (matches voice guidelines)
                    )
                ),
            )
            # 🔧 Stream events with ChatKit conversion
            async for chatkit_event in stream_agent_response(agent_context, result):
                yield chatkit_event

    async def to_message_content(self, input: Attachment) -> ResponseInputContentParam:
        """
        Convert attachment to format Agent SDK expects.
        
        Supported formats:
        - Images (image/*): Converted to base64 data URLs (inline in content)
        - Text files (text/*, .json, .md, .txt): Decoded and inline as input_text
        - Documents (PDF, DOCX, XLSX, PPTX): Uploaded to OpenAI, returns file_id marker
          (caller must add to message.attachments array with file_search tool)
        
        Returns:
        - For images/text: Dict with {"type": "input_image"} or {"type": "input_text"}
        - For PDFs/docs: Dict with {"_is_file_attachment": True, "file_id": "..."}
        """
        if DEBUG_MODE:
            print(f"[to_message_content] Converting attachment {input.id} to message content")
        
        # Get attachment data from custom storage
        if not hasattr(self.store, '_attachment_data'):
            raise RuntimeError(f"Attachment storage not initialized")
        
        attachment_data = self.store._attachment_data.get(input.id)
        if not attachment_data:
            print(f"[to_message_content] ERROR: Attachment {input.id} not found in _attachment_data")
            if DEBUG_MODE:
                print(f"[to_message_content] Available attachments: {list(self.store._attachment_data.keys())}")
            raise RuntimeError(f"Attachment {input.id} not found")
        
        mime_type = attachment_data["mime_type"]
        data_bytes = attachment_data.get("data")
        filename = attachment_data.get("name", "unnamed")
        
        if DEBUG_MODE:
            print(f"[to_message_content] Attachment MIME type: {mime_type}, filename: {filename}")
        
        if not data_bytes:
            print(f"[to_message_content] ERROR: No data bytes for attachment {input.id}")
            raise RuntimeError(f"No data bytes for attachment {input.id}")
        
        # Handle images - inline as base64
        if mime_type and mime_type.startswith("image/"):
            base64_image = base64.b64encode(data_bytes).decode("utf-8")
            if DEBUG_MODE:
                print(f"[to_message_content] Encoded image to base64, length: {len(base64_image)}")
            
            # Build data URL as per Agent SDK docs
            data_url = f"data:{mime_type};base64,{base64_image}"
            
            result = {
                "type": "input_image",
                "detail": "auto",
                "image_url": data_url,
            }
            if DEBUG_MODE:
                print(f"[to_message_content] Returning Agent SDK format: type=input_image")
            return result
        
        # Handle simple text files - inline as text
        elif mime_type and (mime_type.startswith("text/") or mime_type in ["application/json"]):
            try:
                text_content = data_bytes.decode("utf-8")
                if DEBUG_MODE:
                    print(f"[to_message_content] Decoded text file, length: {len(text_content)} chars")
                
                # Return as input_text with filename context
                result = {
                    "type": "input_text",
                    "text": f"File: {filename}\n\n{text_content}"
                }
                if DEBUG_MODE:
                    print(f"[to_message_content] Returning Agent SDK format: type=input_text")
                return result
            except UnicodeDecodeError:
                raise RuntimeError(f"Failed to decode text file: {filename}")
        
        # Handle PDFs, DOCX, and other documents - upload to OpenAI and return file_id
        # These will be added to message.attachments (not inline content)
        elif mime_type in [
            "application/pdf",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",  # .docx
            "application/msword",  # .doc
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",  # .xlsx
            "application/vnd.ms-excel",  # .xls
            "application/vnd.openxmlformats-officedocument.presentationml.presentation",  # .pptx
        ]:
            if DEBUG_MODE:
                print(f"[to_message_content] Document type detected: {mime_type}")
                print(f"[to_message_content] Uploading to OpenAI for message attachment...")
            
            try:
                # Get file extension
                file_ext = os.path.splitext(filename)[1] or ".pdf"
                
                # Create temporary file
                with tempfile.NamedTemporaryFile(delete=False, suffix=file_ext) as tmp:
                    tmp.write(data_bytes)
                    tmp_path = tmp.name
                
                try:
                    # Upload to OpenAI with purpose="assistants"
                    with open(tmp_path, "rb") as f:
                        openai_file = openai_client.files.create(
                            file=f,
                            purpose="assistants"
                        )
                    
                    if DEBUG_MODE:
                        print(f"[to_message_content] Uploaded to OpenAI, file_id: {openai_file.id}")
                        print(f"[to_message_content] Returning file_id for message.attachments array")
                    
                    # Return special marker dict with file_id
                    # This will be detected in respond() and added to message.attachments
                    return {
                        "_is_file_attachment": True,  # Marker for respond() to handle specially
                        "file_id": openai_file.id,
                        "filename": filename
                    }
                    
                finally:
                    # Clean up temp file
                    try:
                        os.unlink(tmp_path)
                    except Exception as e:
                        print(f"[to_message_content] Warning: Failed to delete temp file: {e}")
                        
            except Exception as e:
                print(f"[to_message_content] ERROR uploading document: {e}")
                import traceback
                traceback.print_exc()
                raise RuntimeError(f"Failed to process document {filename}: {str(e)}")
        
        else:
            raise RuntimeError(
                f"Unsupported attachment type: {mime_type} ({filename}). "
                f"Supported: images (image/*), text files (text/*, .json), "
                f"and documents (.pdf, .docx, .xlsx, .pptx)"
            )


jason_server = JasonCoachingServer(agent=jason_agent)

app = FastAPI(title="Jason's Coaching ChatKit API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Vite dev server
        "http://localhost:3000",  # Alternative dev port
        "*"  # Allow all for production flexibility
    ],
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
        "model": "GPT-5 with agent handoffs (automatic routing between Quick Response and Strategy agents)",
        "features": [
            "Agent handoffs (automatic triage routing)",
            "Image analysis (vision)",
            "Document processing (PDF, DOCX, XLSX, PPTX)",
            "File attachments (images, text, code files)",
            "Knowledge base (vector search)",
            "Voice transcription (Whisper)",
            "Text-to-speech (TTS)",
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
                "list": "GET /api/files - List all files in knowledge base",
                "upload": "POST /api/files/upload - Upload documents to knowledge base (PDF, DOCX, TXT, MD, CSV, XLSX, PPTX, code files)",
                "delete": "DELETE /api/files/{file_id} - Remove file from knowledge base",
                "supported_types": [
                    "Documents: .pdf, .docx, .doc, .txt, .md",
                    "Spreadsheets: .csv, .xlsx",
                    "Presentations: .pptx",
                    "Code: .py, .js, .ts, .java, .cpp, .c, .cs, .go, .rb, .php, .sh, .css, .tex",
                    "Data: .json, .xml, .html"
                ]
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


@app.post("/api/files/upload")
async def upload_file_to_knowledge_base(file: UploadFile = File(...)) -> dict[str, Any]:
    """
    Upload a file to the OpenAI vector store for knowledge base search.
    Supports: PDF, DOCX, TXT, MD, CSV, PPTX, and more.
    
    This is different from chat attachments - these files are permanently added
    to the knowledge base and can be searched via file_search tool.
    """
    try:
        if not JASON_VECTOR_STORE_ID:
            raise HTTPException(
                status_code=400,
                detail="Vector store not configured. Set JASON_VECTOR_STORE_ID environment variable."
            )
        
        print(f"[Knowledge Base Upload] Starting upload: {file.filename}")
        print(f"[Knowledge Base Upload] Content-Type: {file.content_type}")
        
        # Validate file type
        allowed_extensions = {
            '.pdf', '.txt', '.md', '.doc', '.docx', 
            '.csv', '.xlsx', '.pptx',
            '.c', '.cpp', '.cs', '.css', '.go', '.html', 
            '.java', '.js', '.json', '.php', '.py', '.rb', 
            '.sh', '.tex', '.ts', '.xml'
        }
        
        file_ext = os.path.splitext(file.filename or "")[1].lower()
        if file_ext not in allowed_extensions:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported file type: {file_ext}. Supported types: {', '.join(sorted(allowed_extensions))}"
            )
        
        # Read file content
        content = await file.read()
        file_size_mb = len(content) / (1024 * 1024)
        print(f"[Knowledge Base Upload] File size: {file_size_mb:.2f} MB")
        
        # Check file size (OpenAI limit is typically 512MB for assistants)
        if len(content) > 512 * 1024 * 1024:
            raise HTTPException(
                status_code=400,
                detail="File size exceeds 512MB limit"
            )
        
        # Create a temporary file to upload to OpenAI
        with tempfile.NamedTemporaryFile(delete=False, suffix=file_ext) as tmp:
            tmp.write(content)
            tmp_path = tmp.name
        
        try:
            # Step 1: Upload file to OpenAI with purpose="assistants"
            print(f"[Knowledge Base Upload] Uploading to OpenAI storage...")
            with open(tmp_path, "rb") as f:
                openai_file = openai_client.files.create(
                    file=f,
                    purpose="assistants"
                )
            
            print(f"[Knowledge Base Upload] OpenAI file ID: {openai_file.id}")
            
            # Step 2: Add file to vector store
            print(f"[Knowledge Base Upload] Adding to vector store {JASON_VECTOR_STORE_ID}...")
            vector_store_file = openai_client.beta.vector_stores.files.create(
                vector_store_id=JASON_VECTOR_STORE_ID,
                file_id=openai_file.id
            )
            
            print(f"[Knowledge Base Upload] Successfully added to vector store")
            print(f"[Knowledge Base Upload] Vector store file status: {vector_store_file.status}")
            
            return {
                "success": True,
                "file_id": openai_file.id,
                "filename": file.filename,
                "bytes": len(content),
                "status": vector_store_file.status,
                "vector_store_id": JASON_VECTOR_STORE_ID,
                "message": f"File '{file.filename}' uploaded successfully and is being indexed."
            }
            
        finally:
            # Clean up temp file
            try:
                os.unlink(tmp_path)
            except Exception as e:
                print(f"[Knowledge Base Upload] Warning: Failed to delete temp file: {e}")
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"[Knowledge Base Upload] ERROR: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to upload file to knowledge base: {str(e)}"
        )


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

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any

from chatkit.store import NotFoundError, Store
from chatkit.types import (
    Attachment,
    Page,
    ThreadItem,
    ThreadMetadata,
    UserMessageItem,
)


@dataclass
class _ThreadState:
    thread: ThreadMetadata
    items: list[ThreadItem]


class MemoryStore(Store[dict[str, Any]]):
    """Simple in-memory store - no persistence, scoped by session ID."""

    def __init__(self) -> None:
        # Store threads by session_id -> thread_id -> ThreadState
        self._sessions: dict[str, dict[str, _ThreadState]] = {}
        # Store attachments by attachment_id -> Attachment
        self._attachments: dict[str, Attachment] = {}
    
    def _get_session_id(self, context: dict[str, Any]) -> str:
        """Extract session ID from query parameters."""
        request = context.get("request")
        if request and hasattr(request, "query_params"):
            session_id = request.query_params.get("sid", "default")
            return session_id
        return "default"
    
    def _get_threads(self, context: dict[str, Any]) -> dict[str, _ThreadState]:
        """Get threads dict for current session."""
        session_id = self._get_session_id(context)
        if session_id not in self._sessions:
            self._sessions[session_id] = {}
        return self._sessions[session_id]
    
    def _generate_title_from_message(self, message: str) -> str:
        """Generate a thread title from the first user message."""
        # Take first 50 characters and add ellipsis if truncated
        title = message.strip()[:60]
        if len(message.strip()) > 60:
            title += "..."
        return title

    # -- Thread metadata -------------------------------------------------
    async def load_thread(self, thread_id: str, context: dict[str, Any]) -> ThreadMetadata:
        threads = self._get_threads(context)
        state = threads.get(thread_id)
        if not state:
            raise NotFoundError(f"Thread {thread_id} not found")
        # Exclude items field to prevent conflicts
        thread_dict = state.thread.model_dump(exclude={'items'})
        return ThreadMetadata(**thread_dict)

    async def save_thread(self, thread: ThreadMetadata, context: dict[str, Any]) -> None:
        threads = self._get_threads(context)
        state = threads.get(thread.id)
        # Exclude items field to ensure ThreadMetadata doesn't contain it
        thread_dict = thread.model_dump(exclude={'items'})
        clean_thread = ThreadMetadata(**thread_dict)
        if state:
            state.thread = clean_thread
        else:
            threads[thread.id] = _ThreadState(
                thread=clean_thread,
                items=[],
            )

    async def load_threads(
        self,
        limit: int,
        after: str | None,
        order: str,
        context: dict[str, Any],
    ) -> Page[ThreadMetadata]:
        session_threads = self._get_threads(context)
        # Exclude items field from all threads
        threads = sorted(
            (ThreadMetadata(**state.thread.model_dump(exclude={'items'})) for state in session_threads.values()),
            key=lambda t: t.created_at or datetime.min,
            reverse=(order == "desc"),
        )

        if after:
            index_map = {thread.id: idx for idx, thread in enumerate(threads)}
            start = index_map.get(after, -1) + 1
        else:
            start = 0

        slice_threads = threads[start : start + limit + 1]
        has_more = len(slice_threads) > limit
        slice_threads = slice_threads[:limit]
        next_after = slice_threads[-1].id if has_more and slice_threads else None
        return Page(
            data=slice_threads,
            has_more=has_more,
            after=next_after,
        )

    async def delete_thread(self, thread_id: str, context: dict[str, Any]) -> None:
        threads = self._get_threads(context)
        threads.pop(thread_id, None)

    # -- Thread items ----------------------------------------------------
    def _items(self, thread_id: str, context: dict[str, Any]) -> list[ThreadItem]:
        threads = self._get_threads(context)
        state = threads.get(thread_id)
        if state is None:
            state = _ThreadState(
                thread=ThreadMetadata(id=thread_id, created_at=datetime.now(tz=timezone.utc)),
                items=[],
            )
            threads[thread_id] = state
        return state.items

    async def load_thread_items(
        self,
        thread_id: str,
        after: str | None,
        limit: int,
        order: str,
        context: dict[str, Any],
    ) -> Page[ThreadItem]:
        items = [item.model_copy(deep=True) for item in self._items(thread_id, context)]
        items.sort(
            key=lambda item: getattr(item, "created_at", datetime.now(tz=timezone.utc)),
            reverse=(order == "desc"),
        )

        if after:
            index_map = {item.id: idx for idx, item in enumerate(items)}
            start = index_map.get(after, -1) + 1
        else:
            start = 0

        slice_items = items[start : start + limit + 1]
        has_more = len(slice_items) > limit
        slice_items = slice_items[:limit]
        next_after = slice_items[-1].id if has_more and slice_items else None
        return Page(data=slice_items, has_more=has_more, after=next_after)

    async def add_thread_item(
        self, thread_id: str, item: ThreadItem, context: dict[str, Any]
    ) -> None:
        self._items(thread_id, context).append(item.model_copy(deep=True))

    async def save_item(self, thread_id: str, item: ThreadItem, context: dict[str, Any]) -> None:
        items = self._items(thread_id, context)
        for idx, existing in enumerate(items):
            if existing.id == item.id:
                items[idx] = item.model_copy(deep=True)
                return
        items.append(item.model_copy(deep=True))

    async def load_item(self, thread_id: str, item_id: str, context: dict[str, Any]) -> ThreadItem:
        for item in self._items(thread_id, context):
            if item.id == item_id:
                return item.model_copy(deep=True)
        raise NotFoundError(f"Item {item_id} not found")

    async def delete_thread_item(
        self, thread_id: str, item_id: str, context: dict[str, Any]
    ) -> None:
        threads = self._get_threads(context)
        items = self._items(thread_id, context)
        threads[thread_id].items = [item for item in items if item.id != item_id]

    # -- Files -----------------------------------------------------------
    async def create_attachment(
        self, input: dict[str, Any], context: dict[str, Any]
    ) -> dict[str, Any]:
        """
        Phase 1: Create attachment metadata and return upload URL.
        ChatKit will call this, then use the upload_url to send file bytes.
        """
        import secrets
        
        # Generate attachment ID
        attachment_id = f"att_{secrets.token_urlsafe(16)}"
        
        print(f"[Phase 1 Create] Creating attachment: {attachment_id}")
        print(f"[Phase 1 Create] Name: {input.get('name')}, MIME type: {input.get('mimeType')}")
        
        # Store initial attachment metadata (without file data yet)
        if not hasattr(self, '_attachment_data'):
            self._attachment_data = {}
        
        self._attachment_data[attachment_id] = {
            "id": attachment_id,
            "name": input.get("name", "unnamed"),
            "mime_type": input.get("mimeType", "application/octet-stream"),
            "size": 0,  # Will be updated in Phase 2
            "data": None,  # Will be set in Phase 2
        }
        
        # Build upload URL for Phase 2
        # ChatKit will POST the file bytes to this URL
        upload_url = f"/upload/{attachment_id}"
        
        # Return attachment object with upload_url
        response = {
            "id": attachment_id,
            "name": input.get("name", "unnamed"),
            "mimeType": input.get("mimeType", "application/octet-stream"),
            "size": 0,
            "upload_url": upload_url,  # Phase 2 will POST bytes here
        }
        
        print(f"[Phase 1 Create] Returning attachment with upload_url: {upload_url}")
        
        return response
    
    async def save_attachment(
        self,
        attachment: Attachment,
        context: dict[str, Any],
    ) -> None:
        """Save attachment in memory."""
        self._attachments[attachment.id] = attachment

    async def load_attachment(
        self,
        attachment_id: str,
        context: dict[str, Any],
    ) -> Attachment:
        """Load attachment from memory."""
        if attachment_id not in self._attachments:
            raise NotFoundError(f"Attachment {attachment_id} not found")
        return self._attachments[attachment_id]

    async def delete_attachment(self, attachment_id: str, context: dict[str, Any]) -> None:
        """Delete attachment from memory."""
        self._attachments.pop(attachment_id, None)


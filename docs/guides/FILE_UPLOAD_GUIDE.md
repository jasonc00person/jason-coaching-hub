# File Upload Implementation Guide

## Overview

The Jason Coaching ChatKit app now supports comprehensive file upload functionality with two distinct pathways:

1. **Knowledge Base Uploads**: Permanent files added to the vector store for file_search
2. **Chat Attachments**: Temporary files attached to individual messages

## Supported File Types

Based on OpenAI's official documentation, the following file types are supported:

### Documents
- **PDF**: `.pdf` - Portable Document Format
- **Word**: `.doc`, `.docx` - Microsoft Word documents
- **Text**: `.txt`, `.md` - Plain text and Markdown

### Spreadsheets & Presentations
- **Excel**: `.csv`, `.xlsx` - Spreadsheets and CSV data
- **PowerPoint**: `.pptx` - Presentations

### Code Files
- **Programming Languages**: `.py`, `.js`, `.ts`, `.java`, `.cpp`, `.c`, `.cs`, `.go`, `.rb`, `.php`, `.sh`
- **Web**: `.html`, `.css`, `.xml`, `.json`
- **Scientific**: `.tex` - LaTeX documents

### Images
- **Formats**: `.jpeg`, `.jpg`, `.png`, `.gif`, `.webp`

## Implementation Details

### 1. Knowledge Base Uploads (Persistent)

**Endpoint**: `POST /api/files/upload`

**Purpose**: Upload documents that will be permanently indexed in the vector store and available for file_search across all conversations.

**Flow**:
```
User uploads file → Backend receives file → Upload to OpenAI (purpose="assistants") 
→ Add to vector store → Index for search → Return success
```

**Code Implementation** (Backend - `main.py`):
```python
@app.post("/api/files/upload")
async def upload_file_to_knowledge_base(file: UploadFile = File(...)) -> dict[str, Any]:
    # 1. Validate file type and size
    # 2. Upload to OpenAI with purpose="assistants"
    openai_file = openai_client.files.create(file=f, purpose="assistants")
    
    # 3. Add to vector store for file_search
    vector_store_file = openai_client.beta.vector_stores.files.create(
        vector_store_id=JASON_VECTOR_STORE_ID,
        file_id=openai_file.id
    )
    
    return {"file_id": openai_file.id, "status": vector_store_file.status}
```

**Frontend Usage** (FileUpload.tsx):
```typescript
const formData = new FormData();
formData.append("file", file);

const response = await fetch(FILE_UPLOAD_URL, {
  method: "POST",
  body: formData,
});
```

**Limits**:
- Max file size: 512MB (OpenAI limit)
- Files persist in vector store indefinitely
- Available across all chat threads

### 2. Chat Attachments (Per-Message)

**Endpoint**: `POST /upload/{attachment_id}` (Phase 2 of ChatKit's two-phase upload)

**Purpose**: Attach files to individual chat messages (images, text files, documents).

**Flow**:
```
User attaches to message → ChatKit creates attachment (Phase 1) 
→ Upload file bytes (Phase 2) → Process inline or upload to OpenAI 
→ Agent analyzes in context
```

**Processing by Type**:

1. **Images**: Converted to base64 data URLs, sent inline
   ```python
   {
       "type": "input_image",
       "detail": "auto",
       "image_url": f"data:{mime_type};base64,{base64_image}"
   }
   ```

2. **Text Files** (`.txt`, `.md`, `.json`): Decoded and sent inline
   ```python
   {
       "type": "input_text",
       "text": f"File: {filename}\n\n{text_content}"
   }
   ```

3. **Documents** (`.pdf`, `.docx`, `.xlsx`, `.pptx`): Uploaded to OpenAI
   ```python
   # Upload to OpenAI
   openai_file = openai_client.files.create(file=f, purpose="assistants")
   
   # Reference in message
   {
       "type": "input_text",
       "text": f"[Document attached: {filename}]\n\nPlease analyze..."
   }
   ```

## OpenAI API Integration

### File Upload Schema

According to OpenAI documentation:

```python
# Step 1: Upload file
with open('document.pdf', 'rb') as file:
    uploaded_file = client.files.create(
        file=file,
        purpose='assistants'  # Required for assistants/file_search
    )

# Step 2: Add to vector store (for knowledge base)
vector_store_file = client.beta.vector_stores.files.create(
    vector_store_id=VECTOR_STORE_ID,
    file_id=uploaded_file.id
)

# Step 3: Use in messages (for chat attachments)
thread = client.beta.threads.create(
    messages=[
        {
            "role": "user",
            "content": "Analyze this document",
            "attachments": [
                {
                    "file_id": uploaded_file.id,
                    "tools": [{"type": "file_search"}]
                }
            ],
        }
    ]
)
```

### File Search Tool Configuration

The agent is configured with the file_search tool in `jason_agent.py`:

```python
def build_file_search_tool() -> FileSearchTool:
    return FileSearchTool(
        vector_store_ids=[JASON_VECTOR_STORE_ID],
        max_num_results=5,
    )
```

This allows the agent to automatically search uploaded documents when needed.

## Frontend Configuration

### File Input Accept Attribute

```html
<input
  type="file"
  multiple
  accept=".pdf,.txt,.md,.doc,.docx,.csv,.xlsx,.pptx,.json,.html,.xml,.py,.js,.ts,.java,.cpp,.c,.cs,.go,.rb,.php,.sh,.css,.tex"
/>
```

### File Type Validation

The backend validates file types by extension:

```python
allowed_extensions = {
    '.pdf', '.txt', '.md', '.doc', '.docx', 
    '.csv', '.xlsx', '.pptx',
    '.c', '.cpp', '.cs', '.css', '.go', '.html', 
    '.java', '.js', '.json', '.php', '.py', '.rb', 
    '.sh', '.tex', '.ts', '.xml'
}
```

## User Experience

### Knowledge Base UI

Located in the sidebar:
- **Upload Area**: Drag & drop or click to upload
- **File List**: Shows all indexed files with metadata
  - Filename
  - File size
  - Upload date
  - Indexing status (completed/in_progress)
- **Delete**: Remove files from knowledge base

### Chat Attachments

In the message composer:
- **Attach Button**: Clip icon to attach files
- **Preview**: Shows attached files before sending
- **Inline Processing**: Images and text files shown in chat
- **Document References**: PDFs/DOCX shown as file references

## Error Handling

### Common Issues

1. **File Type Not Supported**
   ```
   Error: Unsupported file type: .xyz
   Solution: Use supported file types listed above
   ```

2. **File Too Large**
   ```
   Error: File size exceeds 512MB limit
   Solution: Split large files or compress
   ```

3. **Upload Failed**
   ```
   Error: Failed to upload to OpenAI
   Solution: Check API key, network connection, OpenAI status
   ```

4. **DOCX Issues** (Known OpenAI limitation)
   ```
   Issue: Some DOCX files rejected by API
   Workaround: Convert to PDF or extract text to .txt
   ```

## Best Practices

### When to Use Knowledge Base vs Chat Attachments

**Use Knowledge Base** for:
- Reference documents (templates, guides, frameworks)
- Frequently accessed content
- Company policies or documentation
- Long-term resources

**Use Chat Attachments** for:
- One-time questions about a document
- Quick image analysis
- Temporary files
- Context-specific documents

### File Optimization

1. **PDFs**: Ensure text is selectable (not scanned images)
2. **Large Files**: Consider splitting into smaller sections
3. **Images**: Compress before uploading for faster processing
4. **Code Files**: Use proper extensions for syntax detection

## Testing

### Manual Testing

1. **Upload PDF to Knowledge Base**:
   ```bash
   curl -X POST http://localhost:8000/api/files/upload \
     -F "file=@document.pdf"
   ```

2. **List Files**:
   ```bash
   curl http://localhost:8000/api/files
   ```

3. **Delete File**:
   ```bash
   curl -X DELETE http://localhost:8000/api/files/{file_id}
   ```

### Frontend Testing

1. Navigate to Knowledge Base section
2. Upload various file types
3. Verify files appear in list
4. Test delete functionality
5. Ask questions about uploaded content

## Official Documentation References

- [OpenAI Assistants API - File Search](https://platform.openai.com/docs/assistants/tools/file-search)
- [OpenAI Files API](https://platform.openai.com/docs/api-reference/files)
- [OpenAI Vector Stores](https://platform.openai.com/docs/api-reference/vector-stores)
- [Supported File Types](https://help.openai.com/en/articles/8550641-assistants-api-v2-faq)

## Environment Variables

Required in `.env`:

```bash
OPENAI_API_KEY=sk-...                                    # Your OpenAI API key
JASON_VECTOR_STORE_ID=vs_...                            # Vector store ID for knowledge base
API_BASE_URL=https://your-backend.railway.app/          # Backend URL for uploads
```

## Troubleshooting

### Vector Store Not Found
```
Error: Vector store ID not configured
Solution: Set JASON_VECTOR_STORE_ID in environment variables
```

### CORS Issues
```
Error: CORS policy blocked request
Solution: Ensure backend CORS middleware allows your frontend origin
```

### File Not Searchable
```
Issue: Uploaded file but agent can't find content
Solution: 
- Check file status is "completed" in /api/files
- Wait for indexing to complete (can take 1-2 minutes)
- Verify file_search tool is enabled on agent
```

## Architecture Diagram

```
┌─────────────────┐
│   Frontend UI   │
│  FileUpload.tsx │
└────────┬────────┘
         │
         ├─────────────────────────────────┐
         │                                 │
         v                                 v
┌────────────────────┐         ┌──────────────────────┐
│  Knowledge Base    │         │  Chat Attachments    │
│  /api/files/upload │         │  /upload/{att_id}    │
└────────┬───────────┘         └──────────┬───────────┘
         │                                 │
         v                                 v
┌────────────────────┐         ┌──────────────────────┐
│  OpenAI Files API  │         │  Process by Type     │
│  purpose="asst"    │         │  - Image: base64     │
└────────┬───────────┘         │  - Text: inline      │
         │                     │  - Doc: upload       │
         v                     └──────────┬───────────┘
┌────────────────────┐                   │
│  Vector Store      │                   │
│  Add file for      │                   │
│  file_search       │                   │
└────────────────────┘                   │
                                         v
                              ┌──────────────────────┐
                              │   Agent Processing   │
                              │   - file_search tool │
                              │   - Vision analysis  │
                              └──────────────────────┘
```

## Future Enhancements

Potential improvements based on OpenAI's roadmap:

1. **Batch Upload**: Upload multiple files at once
2. **File Versioning**: Track document versions
3. **Rich Previews**: Show document thumbnails
4. **Smart Routing**: Auto-detect if file should go to KB or chat
5. **Chunking**: Handle very large files automatically
6. **OCR Support**: Extract text from scanned PDFs


# OpenAI File Upload - Official Documentation Reference

## Quick Summary

You researched OpenAI's file attachment capabilities and found the complete implementation details. Here's everything you need to know.

## Official OpenAI Documentation Links

### Primary Documentation

1. **Assistants API - File Search Tool**
   - URL: `https://platform.openai.com/docs/assistants/tools/file-search`
   - What it covers: How to use file_search tool with vector stores
   - Key info: Attachment structure, vector store configuration

2. **Files API Reference**
   - URL: `https://platform.openai.com/docs/api-reference/files`
   - What it covers: Upload files with `purpose="assistants"`
   - Key info: File object schema, upload limits

3. **Vector Stores API**
   - URL: `https://platform.openai.com/docs/api-reference/vector-stores`
   - What it covers: Creating and managing vector stores for file search
   - Key info: Adding files to stores, expiration policies

4. **Messages API - Attachments**
   - URL: `https://platform.openai.com/docs/api-reference/messages`
   - What it covers: Attaching files to messages
   - Key info: Attachment object schema

5. **Assistants API FAQ**
   - URL: `https://help.openai.com/en/articles/8550641-assistants-api-v2-faq`
   - What it covers: Supported file types, common issues
   - Key info: Full list of supported extensions

## Supported File Types (Official List)

Based on OpenAI's documentation for the `file_search` tool:

### Documents & Text
- `.pdf` - PDF documents
- `.doc`, `.docx` - Microsoft Word
- `.txt` - Plain text
- `.md` - Markdown

### Spreadsheets & Presentations
- `.csv` - Comma-separated values
- `.xlsx` - Microsoft Excel
- `.pptx` - Microsoft PowerPoint

### Code Files
- `.c`, `.cpp` - C/C++
- `.cs` - C#
- `.css` - Stylesheets
- `.go` - Go
- `.html` - HTML
- `.java` - Java
- `.js` - JavaScript
- `.json` - JSON data
- `.php` - PHP
- `.py` - Python
- `.rb` - Ruby
- `.sh` - Shell scripts
- `.tex` - LaTeX
- `.ts` - TypeScript
- `.xml` - XML

### Archives & Images
- `.zip`, `.tar` - Archives
- `.jpeg`, `.jpg`, `.png`, `.gif`, `.webp` - Images

## JSON Schema for Attachments

### Upload File to OpenAI

```python
# Step 1: Upload file
response = client.files.create(
    file=open('document.pdf', 'rb'),
    purpose='assistants'  # REQUIRED for assistants API
)
# Returns: File object with file.id
```

**Response Schema**:
```json
{
  "id": "file-abc123",
  "object": "file",
  "bytes": 120000,
  "created_at": 1699061776,
  "filename": "document.pdf",
  "purpose": "assistants"
}
```

### Add to Vector Store

```python
# Step 2: Add to vector store (for knowledge base)
vector_store_file = client.beta.vector_stores.files.create(
    vector_store_id="vs_abc123",
    file_id="file-abc123"
)
```

**Response Schema**:
```json
{
  "id": "file-abc123",
  "object": "vector_store.file",
  "created_at": 1699061776,
  "vector_store_id": "vs_abc123",
  "status": "in_progress",  // or "completed", "failed"
  "last_error": null
}
```

### Attach to Message

```python
# Step 3: Use in message (for chat attachments)
message = client.beta.threads.messages.create(
    thread_id="thread_abc123",
    role="user",
    content="Please analyze this document",
    attachments=[
        {
            "file_id": "file-abc123",
            "tools": [{"type": "file_search"}]
        }
    ]
)
```

**Attachment Schema**:
```json
{
  "file_id": "file-abc123",
  "tools": [
    {
      "type": "file_search"  // or "code_interpreter"
    }
  ]
}
```

## Key Implementation Details

### 1. Two-Step Upload Process

For knowledge base files:
```
1. Upload file → OpenAI storage (purpose="assistants")
2. Add file_id → Vector store for indexing
```

For chat attachments:
```
1. Upload file → OpenAI storage (purpose="assistants")
2. Reference file_id in message.attachments
```

### 2. File Search Tool Configuration

```python
from agents.models.openai_responses import FileSearchTool

tool = FileSearchTool(
    vector_store_ids=["vs_abc123"],  # Your vector store IDs
    max_num_results=5,               # Max results to return
)
```

### 3. Temporary Vector Stores

According to OpenAI docs:
- Attachments create **temporary vector stores** tied to the thread
- Default expiration: **7 days** after last activity
- Files in assistant's persistent store don't expire

### 4. File Size Limits

- **Max file size**: 512MB per file (for assistants)
- **Max files per message**: 10 files in GPT Actions
- **Max files per assistant**: 10,000 files in vector store

## Common Issues & Workarounds

### Issue 1: DOCX Files Rejected

**Problem**: Some users report `.docx` files fail despite being in supported list
```
Error: "Expected file type .pdf but got .docx"
```

**Workarounds**:
1. Convert DOCX → PDF before upload
2. Extract text and upload as `.txt`
3. Try different DOCX files (may be version-specific)

**Source**: [OpenAI Community Thread](https://community.openai.com/t/is-the-assistants-file-upload-pipeline-broken/731683)

### Issue 2: Files Not Searchable Immediately

**Problem**: Uploaded file but agent can't find content

**Solution**: Files need time to index
- Check `status` field: `in_progress` → `completed`
- Usually takes 30 seconds to 2 minutes
- Poll `/api/files` endpoint to check status

### Issue 3: Attachments Don't Work in Existing Threads

**Problem**: Can attach files when creating thread but not to existing threads

**Solution**: This is a known limitation
- Create new thread for file-based questions, OR
- Upload to knowledge base instead (persistent across threads)

**Source**: [OpenAI Community Discussion](https://community.openai.com/t/getting-attachments-to-work/736703)

### Issue 4: Chat Completions vs Assistants

**Problem**: Can't attach files to `chat.completions` endpoint

**Solution**: File attachments only work with:
- Assistants API (`beta.threads.messages`)
- Responses API (newer, similar to Assistants)
- NOT with standard `chat.completions`

**Workaround**: Extract text from file and include in prompt

## Environment Setup

### Required Environment Variables

```bash
# .env file
OPENAI_API_KEY=sk-proj-...                    # Your OpenAI API key
JASON_VECTOR_STORE_ID=vs_...                  # Your vector store ID
API_BASE_URL=https://your-backend.com/        # Your backend URL
```

### Creating a Vector Store

```python
# Create a new vector store
vector_store = client.beta.vector_stores.create(
    name="Jason's Knowledge Base",
    expires_after={
        "anchor": "last_active_at",
        "days": 365  # Keep for 1 year
    }
)

print(f"Vector Store ID: {vector_store.id}")
# Save this ID to JASON_VECTOR_STORE_ID env var
```

## Testing with curl

### Upload File

```bash
# Upload to knowledge base
curl -X POST http://localhost:8000/api/files/upload \
  -H "Content-Type: multipart/form-data" \
  -F "file=@/path/to/document.pdf"
```

**Expected Response**:
```json
{
  "success": true,
  "file_id": "file-abc123",
  "filename": "document.pdf",
  "bytes": 120000,
  "status": "in_progress",
  "vector_store_id": "vs_xyz789",
  "message": "File 'document.pdf' uploaded successfully and is being indexed."
}
```

### List Files

```bash
curl http://localhost:8000/api/files
```

**Expected Response**:
```json
{
  "files": [
    {
      "id": "file-abc123",
      "filename": "document.pdf",
      "bytes": 120000,
      "created_at": 1699061776,
      "status": "completed"
    }
  ],
  "vector_store_id": "vs_xyz789"
}
```

### Delete File

```bash
curl -X DELETE http://localhost:8000/api/files/file-abc123
```

**Expected Response**:
```json
{
  "status": "deleted",
  "file_id": "file-abc123"
}
```

## Rate Limits & Quotas

From OpenAI documentation:

| Limit | Value |
|-------|-------|
| Files per assistant | 10,000 |
| Files per message | 10 |
| File size (assistants) | 512 MB |
| File size (fine-tuning) | 1 GB |
| Vector stores per org | 100 |

## Implementation Checklist

- [x] Backend: Create `/api/files/upload` endpoint
- [x] Backend: Upload files with `purpose="assistants"`
- [x] Backend: Add files to vector store
- [x] Backend: Handle chat attachments (images, text, docs)
- [x] Frontend: File input with supported extensions
- [x] Frontend: Drag & drop upload
- [x] Frontend: File list with delete
- [x] Documentation: Implementation guide
- [x] Documentation: API reference

## Python SDK Examples

### Complete Upload Flow

```python
from openai import OpenAI

client = OpenAI(api_key="sk-...")

# 1. Upload file to OpenAI
with open("guide.pdf", "rb") as f:
    file = client.files.create(
        file=f,
        purpose="assistants"
    )

print(f"Uploaded file: {file.id}")

# 2. Add to vector store
vector_store_file = client.beta.vector_stores.files.create(
    vector_store_id="vs_abc123",
    file_id=file.id
)

print(f"Added to vector store, status: {vector_store_file.status}")

# 3. Use in conversation
thread = client.beta.threads.create(
    messages=[
        {
            "role": "user",
            "content": "What does the guide say about pricing?",
            "attachments": [
                {
                    "file_id": file.id,
                    "tools": [{"type": "file_search"}]
                }
            ]
        }
    ]
)

# 4. Run with assistant (must have file_search tool)
run = client.beta.threads.runs.create(
    thread_id=thread.id,
    assistant_id="asst_abc123"
)

# 5. Wait for completion and get response
while run.status != "completed":
    run = client.beta.threads.runs.retrieve(
        thread_id=thread.id,
        run_id=run.id
    )

messages = client.beta.threads.messages.list(thread_id=thread.id)
print(messages.data[0].content[0].text.value)
```

## TypeScript SDK Examples

### Upload and Attach

```typescript
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Upload file
const file = await openai.files.create({
  file: fs.createReadStream('document.pdf'),
  purpose: 'assistants',
});

// Add to vector store
const vectorStoreFile = await openai.beta.vectorStores.files.create(
  'vs_abc123',
  { file_id: file.id }
);

// Use in message
const thread = await openai.beta.threads.create({
  messages: [
    {
      role: 'user',
      content: 'Analyze this document',
      attachments: [
        {
          file_id: file.id,
          tools: [{ type: 'file_search' }],
        },
      ],
    },
  ],
});
```

## Additional Resources

### OpenAI Community Forums

- [File Search Discussions](https://community.openai.com/search?q=file_search)
- [Assistants API Help](https://community.openai.com/c/assistants-api/)
- [File Upload Issues](https://community.openai.com/search?q=file%20upload)

### OpenAI Cookbook

- [Vector Stores Examples](https://cookbook.openai.com/examples/assistants_api_overview_python)
- [File Search Tutorial](https://cookbook.openai.com/)

### Platform Status

- [OpenAI Status Page](https://status.openai.com/)

## Summary

Your implementation now supports:

✅ **Knowledge Base Uploads**: Permanent files in vector store  
✅ **Chat Attachments**: Per-message file attachments  
✅ **All OpenAI File Types**: PDF, DOCX, TXT, MD, CSV, XLSX, PPTX, code files  
✅ **Hybrid Processing**: Images/text inline, documents via OpenAI  
✅ **File Management**: List, delete, status tracking  

The implementation follows OpenAI's official documentation and best practices for the Assistants API with file_search capabilities.


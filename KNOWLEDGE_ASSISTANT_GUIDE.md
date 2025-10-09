# Knowledge Assistant Implementation Guide

This guide documents the comprehensive updates made to align your AgentKit application with the OpenAI ChatKit Advanced Samples, specifically the Knowledge Assistant example with vector store functionality.

## 🎯 Overview

Your application now features:
- **File Search Tool Integration**: Upload and manage documents in an OpenAI vector store
- **Knowledge Base Management UI**: Upload, view, and delete files
- **Enhanced ChatKit Integration**: Improved error handling and loading states
- **Citation Support**: Automatic display of sources from File Search results
- **Session Management**: Proper ChatKit session handling via API endpoint

## 🏗️ Architecture

### Backend (FastAPI)

#### New Endpoints

1. **Session Endpoint** (`POST /api/chatkit/session`)
   - Creates ChatKit sessions with secure client secrets
   - Returns session credentials for frontend integration
   ```python
   {
     "client_secret": "cs_...",
     "session_id": "..."
   }
   ```

2. **File Upload** (`POST /api/files/upload`)
   - Uploads documents to OpenAI vector store
   - Supported formats: PDF, TXT, MD, DOC, DOCX
   - Automatic vector store indexing
   ```python
   # Response
   {
     "id": "file-...",
     "filename": "document.pdf",
     "bytes": 123456,
     "created_at": 1234567890,
     "status": "completed",
     "vector_store_id": "vs_..."
   }
   ```

3. **List Files** (`GET /api/files`)
   - Retrieves all files in the vector store
   - Includes file metadata and processing status
   ```python
   {
     "files": [...],
     "vector_store_id": "vs_..."
   }
   ```

4. **Delete File** (`DELETE /api/files/{file_id}`)
   - Removes file from vector store and OpenAI
   - Cleans up both vector store and file storage
   ```python
   {
     "status": "deleted",
     "file_id": "file-..."
   }
   ```

#### Agent Configuration

The agent is configured with the File Search tool pointing to your vector store:

```python
jason_agent = Agent[AgentContext](
    model="gpt-4o-mini",
    name="Jason Cooperson - Social Media Marketing Expert",
    instructions=JASON_INSTRUCTIONS,
    tools=[build_file_search_tool()],  # File Search with vector store
)
```

### Frontend (React + TypeScript)

#### New Components

1. **FileUpload** (`src/components/FileUpload.tsx`)
   - Drag-and-drop file upload interface
   - Multiple file upload support
   - Real-time upload progress and status
   - Error handling with user feedback

2. **FileManager** (`src/components/FileManager.tsx`)
   - Lists all files in the vector store
   - File metadata display (size, date, status)
   - Delete functionality with confirmation
   - Auto-refresh capability

3. **KnowledgeBase** (`src/components/KnowledgeBase.tsx`)
   - Floating panel for knowledge base management
   - Combines FileUpload and FileManager
   - Toggle visibility with button
   - Responsive design

4. **Enhanced ChatKitPanel** (`src/components/ChatKitPanel.tsx`)
   - Improved error handling and user feedback
   - Integration error detection and display
   - Automatic citation support for File Search results
   - Proper cleanup and lifecycle management

## 🚀 Usage

### Starting the Application

1. **Backend** (Terminal 1):
   ```bash
   cd backend-v2
   source venv/bin/activate  # or `venv\Scripts\activate` on Windows
   uvicorn app.main:app --reload --port 8000
   ```

2. **Frontend** (Terminal 2):
   ```bash
   cd frontend-v2
   npm run dev
   ```

3. Open http://localhost:5173 in your browser

### Managing Knowledge Base

1. **Upload Documents**:
   - Click the "Knowledge Base" button in the bottom-right corner
   - Drag and drop files or click "Upload files"
   - Supported formats: PDF, TXT, MD, DOC, DOCX (up to 10MB)
   - Wait for upload completion (green checkmark)

2. **View Uploaded Files**:
   - Open the Knowledge Base panel
   - Scroll through the file list
   - See file size, upload date, and processing status

3. **Delete Files**:
   - Click the trash icon next to any file
   - Confirm deletion in the prompt
   - File is removed from vector store

### Querying the Knowledge Base

Simply ask questions in the chat interface. The agent will automatically search the knowledge base when relevant:

**Example queries**:
- "Show me some of your best hook templates"
- "What does the ICP framework say about identifying target customers?"
- "Give me a YouTube script template from the knowledge base"
- "What information is available about content strategy?"

**Citations**: When the agent uses information from your documents, citations will appear automatically in the chat, showing which files were referenced.

## 🔧 Configuration

### Environment Variables

**Backend** (`backend-v2/.env`):
```bash
OPENAI_API_KEY=sk-...
JASON_VECTOR_STORE_ID=vs_...  # Your vector store ID
```

**Frontend** (`frontend-v2/.env`):
```bash
VITE_API_BASE=http://localhost:8000/
VITE_CHATKIT_API_DOMAIN_KEY=domain_pk_...
VITE_GREETING="Custom greeting message"
VITE_COMPOSER_PLACEHOLDER="Custom placeholder..."
```

### Vite Proxy Configuration

The frontend proxies API requests to the backend:

```typescript
proxy: {
  "/chatkit": { target: "http://localhost:8000" },
  "/api": { target: "http://localhost:8000" },
  "/health": { target: "http://localhost:8000" },
}
```

## 📊 Key Features

### 1. File Search Tool
- **Automatic Indexing**: Files are automatically indexed in the vector store
- **Semantic Search**: Natural language queries across all documents
- **Citation Tracking**: Sources are automatically tracked and displayed
- **Relevance Ranking**: Most relevant content is prioritized

### 2. Knowledge Base Management
- **Visual Interface**: Easy-to-use panel for file management
- **Drag-and-Drop**: Intuitive file upload experience
- **Real-time Status**: Live upload and processing status
- **File Metadata**: Size, date, and processing status for each file

### 3. Enhanced Error Handling
- **Integration Errors**: Detects and displays ChatKit integration issues
- **Upload Errors**: Clear feedback for failed uploads
- **Network Errors**: Graceful handling of API failures
- **User Feedback**: Informative error messages throughout

### 4. ChatKit Integration
- **Session Management**: Proper session creation and handling
- **Theme Support**: Dark mode optimized
- **Starter Prompts**: Pre-configured conversation starters
- **Streaming Responses**: Real-time response streaming
- **Citation Display**: Automatic source attribution

## 🎨 UI/UX Features

### Design System
- **Dark Theme**: Optimized for dark mode (#161618 background)
- **Tailwind CSS**: Utility-first CSS framework
- **Responsive**: Works on all screen sizes
- **Animations**: Smooth transitions and loading states
- **Icons**: SVG icons for all actions

### User Interactions
- **Drag-and-Drop**: File upload via drag-and-drop
- **Loading States**: Spinners and progress indicators
- **Confirmation Dialogs**: Confirm destructive actions
- **Toast Messages**: Success/error feedback
- **Hover States**: Interactive element feedback

## 🔐 Security Considerations

### Current Implementation (Development)
- In-memory session storage
- CORS enabled for all origins
- No authentication/authorization

### Production Recommendations
1. **Authentication**: Implement user authentication
2. **Authorization**: Verify user access to files
3. **Session Storage**: Use Redis or database
4. **CORS**: Restrict to specific domains
5. **File Validation**: Strict file type and size limits
6. **Rate Limiting**: Prevent abuse
7. **Encryption**: Encrypt sensitive data

## 📦 Dependencies

### Backend
```python
fastapi>=0.109.0
openai>=1.12.0
agents>=0.1.0
chatkit>=0.1.0
python-dotenv>=1.0.0
```

### Frontend
```json
{
  "@openai/chatkit": "^1.0.0",
  "@openai/chatkit-react": "^0",
  "react": "^19.2.0",
  "react-dom": "^19.2.0"
}
```

## 🐛 Troubleshooting

### Common Issues

1. **"Vector store ID not configured"**
   - Ensure `JASON_VECTOR_STORE_ID` is set in backend `.env`
   - Create a vector store in OpenAI platform if needed

2. **"ChatKit integration error"**
   - Verify `VITE_CHATKIT_API_DOMAIN_KEY` in frontend `.env`
   - Check domain is registered in OpenAI settings

3. **"Failed to upload file"**
   - Check file size (max 10MB)
   - Verify file format is supported
   - Ensure `OPENAI_API_KEY` is valid

4. **"Failed to load files"**
   - Check backend is running on port 8000
   - Verify proxy configuration in `vite.config.ts`
   - Check browser console for CORS errors

5. **Citations not showing**
   - Ensure File Search tool is configured in agent
   - Verify vector store has indexed files
   - Check that queries are relevant to uploaded documents

### Debug Mode

Enable debug logging in development:
```typescript
// Frontend: Check browser console
// Look for [ChatKitPanel] debug messages

// Backend: Check terminal output
// FastAPI logs all requests
```

## 🚀 Deployment

### Backend (Railway/Heroku)
1. Set environment variables in platform settings
2. Use `Procfile` for process configuration
3. Configure port binding (Railway: `PORT` env var)

### Frontend (Vercel/Netlify)
1. Set build command: `npm run build`
2. Set output directory: `dist`
3. Configure environment variables
4. Set up domain and update ChatKit domain key

### Production Checklist
- [ ] Set production environment variables
- [ ] Configure proper CORS settings
- [ ] Implement authentication/authorization
- [ ] Set up session storage (Redis)
- [ ] Configure SSL/HTTPS
- [ ] Set up monitoring and logging
- [ ] Implement rate limiting
- [ ] Test file upload limits
- [ ] Verify ChatKit domain registration
- [ ] Set up error tracking (Sentry, etc.)

## 📚 Additional Resources

- [OpenAI ChatKit Documentation](https://platform.openai.com/docs/chatkit)
- [OpenAI Agents SDK](https://github.com/openai/openai-agents-sdk)
- [OpenAI File Search Guide](https://platform.openai.com/docs/assistants/tools/file-search)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [React Documentation](https://react.dev/)
- [Vite Documentation](https://vitejs.dev/)

## 🎉 What's New

This implementation includes all features from the OpenAI ChatKit Advanced Samples Knowledge Assistant example:

✅ **Backend**
- Session management endpoint
- File upload to vector store
- File listing and metadata
- File deletion
- File Search tool integration
- Proper error handling

✅ **Frontend**
- FileUpload component with drag-and-drop
- FileManager component with CRUD operations
- KnowledgeBase floating panel
- Enhanced error handling
- Loading states and feedback
- Citation support (automatic via ChatKit)
- Responsive design

✅ **Integration**
- Proper ChatKit configuration
- Vector store connectivity
- API proxying
- Session management
- Theme support

## 💡 Next Steps

Consider adding:
1. **File Preview**: View document contents in-app
2. **Search**: Search within uploaded files
3. **Folders**: Organize files in folders
4. **Tags**: Tag files for better organization
5. **Sharing**: Share files with other users
6. **Analytics**: Track usage and popular queries
7. **Batch Upload**: Upload multiple files at once
8. **OCR**: Extract text from images
9. **Webhooks**: Get notified on file processing
10. **Advanced Citations**: Enhanced citation display

---

**Built with**: FastAPI • React • OpenAI ChatKit • OpenAI Agents SDK • Vite • Tailwind CSS

**Last Updated**: October 9, 2025


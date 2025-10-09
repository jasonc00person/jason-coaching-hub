from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from openai import OpenAI
from pydantic import BaseModel
import os
from dotenv import load_dotenv
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

app = FastAPI(title="ChatKit Backend API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize OpenAI client
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
WORKFLOW_ID = os.getenv("WORKFLOW_ID")

if not OPENAI_API_KEY:
    logger.error("OPENAI_API_KEY not found in environment variables")
    raise ValueError("OPENAI_API_KEY must be set")

if not WORKFLOW_ID:
    logger.error("WORKFLOW_ID not found in environment variables")
    raise ValueError("WORKFLOW_ID must be set")

client = OpenAI(api_key=OPENAI_API_KEY)


class SessionResponse(BaseModel):
    client_secret: str


@app.get("/")
async def root():
    return {"message": "ChatKit Backend API is running", "status": "healthy"}


@app.post("/api/chatkit/session", response_model=SessionResponse)
async def create_chatkit_session():
    """
    Create a new ChatKit session and return the client_secret.
    This endpoint is called by the frontend to authenticate ChatKit.
    """
    try:
        logger.info(f"Creating ChatKit session for workflow: {WORKFLOW_ID}")
        
        # Create a ChatKit session using the OpenAI SDK
        session = client.realtime.sessions.create(
            model="gpt-4o-realtime-preview-2024-12-17",
            workflow=WORKFLOW_ID
        )
        
        logger.info("ChatKit session created successfully")
        
        return SessionResponse(client_secret=session.client_secret.value)
    
    except Exception as e:
        logger.error(f"Error creating ChatKit session: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create ChatKit session: {str(e)}"
        )


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "workflow_configured": bool(WORKFLOW_ID),
        "api_key_configured": bool(OPENAI_API_KEY)
    }

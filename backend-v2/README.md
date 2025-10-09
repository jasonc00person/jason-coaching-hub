# Jason's Coaching Hub - Backend

FastAPI backend for Jason's AI Coaching Hub powered by OpenAI ChatKit.

## Environment Variables Required

```bash
OPENAI_API_KEY=your_openai_api_key_here
TAVILY_API_KEY=your_tavily_api_key_here
JASON_VECTOR_STORE_ID=your_vector_store_id_here
```

Get your Tavily API key from: https://tavily.com

## Local Development

```bash
# Install dependencies
pip install -r requirements.txt

# Run the server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## Deployed on Railway

This backend is deployed on Railway and provides the ChatKit API endpoint for the frontend.


"""
Vercel serverless function entry point for all API routes
"""
from mangum import Mangum
from main import app

# Wrap FastAPI with Mangum for AWS Lambda/Vercel compatibility
handler = Mangum(app, lifespan="off")


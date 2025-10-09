# Deployment Guide

## Deploy Frontend to Vercel

### Prerequisites
- GitHub account connected to Vercel
- Backend running (ngrok or deployed separately)
- OpenAI API key and ChatKit domain key

### Step 1: Push to GitHub (if not already)
```bash
cd /Users/jasoncooperson/Documents/Agent\ Builder\ Demo\ 2/frontend-v2
git init
git add .
git commit -m "Initial commit - Jason's Coaching Hub"
# Push to your GitHub repository
```

### Step 2: Deploy to Vercel

#### Option A: Using Vercel CLI
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
cd frontend-v2
vercel
```

#### Option B: Using Vercel Dashboard
1. Go to https://vercel.com/new
2. Import your Git repository
3. Select the `frontend-v2` folder as the root directory
4. Vercel will auto-detect Vite settings
5. Add environment variables (see below)
6. Click Deploy!

### Step 3: Configure Environment Variables in Vercel

In your Vercel project settings, add these environment variables:

**Required:**
```
VITE_API_BASE=https://your-ngrok-url.ngrok-free.dev/
VITE_CHATKIT_API_URL=https://your-ngrok-url.ngrok-free.dev/chatkit
VITE_CHATKIT_API_DOMAIN_KEY=domain_pk_68e6ede3c3808190bac4b60740ab83830ff8c55517d6f3a5
```

**Optional (already have defaults):**
```
VITE_GREETING=Hey! I'm Jason's AI coach. Let's level up your content and grow your brand together.
VITE_COMPOSER_PLACEHOLDER=Ask me about hooks, scripts, offers, or growth strategy...
```

### Step 4: Configure OpenAI Domain Allowlist

1. Go to https://platform.openai.com/settings/organization/security/domain-allowlist
2. Click "Add Domain"
3. Add your Vercel domain (e.g., `your-app.vercel.app`)
4. The domain key should remain the same

### Step 5: Update Backend CORS

Make sure your backend allows your Vercel domain. In `backend-v2/app/main.py`, update:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "*",  # For development
        "https://your-app.vercel.app",  # Your Vercel domain
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## Backend Deployment Options

### Option 1: Keep Using ngrok (Quick)
- Keep your backend running locally with ngrok
- Update `VITE_API_BASE` in Vercel to point to your ngrok URL
- **Pros:** Quick, no backend deployment needed
- **Cons:** Backend needs to stay running locally

### Option 2: Deploy Backend to Railway/Render
1. Create account on Railway.app or Render.com
2. Deploy the `backend-v2` folder
3. Update `VITE_API_BASE` to point to your deployed backend
4. **Pros:** Fully hosted solution
- **Cons:** Requires additional setup

### Option 3: Deploy Backend to Vercel as Serverless
- More complex setup (FastAPI needs special configuration)
- May require using Vercel's Python runtime

## Testing After Deployment

1. Visit your Vercel URL
2. Check browser console for errors
3. Test sending a message
4. Verify chat history persists in localStorage
5. Test "New Chat" button
6. Test switching between chats in the sidebar

## Troubleshooting

**ChatKit iframe not loading:**
- Verify domain is in OpenAI allowlist
- Check domain key is correct
- Wait 5-10 minutes after adding domain (propagation time)

**Backend connection fails:**
- Check CORS settings
- Verify API URL in environment variables
- Ensure backend is running and accessible

**Chat history not saving:**
- Check browser localStorage permissions
- Verify onSendMessage and onResponseEnd callbacks are firing


# ChatKit Production Fix

## Issue
ChatKit shows a blank screen in production because the domain key initialization is failing.

## Current Domain Key
```
domain_pk_68e6f82c9e5081908d9b66e3fccbeed801c44e006ad5d8e7
```

## Steps to Fix

### Option 1: Add Environment Variable to Vercel (Recommended)

1. Go to your Vercel dashboard: https://vercel.com/dashboard
2. Select your `jason-coaching-hub` project
3. Go to **Settings** → **Environment Variables**
4. Add a new variable:
   - **Name**: `VITE_CHATKIT_API_DOMAIN_KEY`
   - **Value**: `domain_pk_68e6f82c9e5081908d9b66e3fccbeed801c44e006ad5d8e7`
   - **Environment**: Check all (Production, Preview, Development)
5. Click **Save**
6. Go to **Deployments** and click **Redeploy** on the latest deployment

### Option 2: Verify Domain with OpenAI

The domain key must be registered with OpenAI:

1. Go to: https://platform.openai.com/settings/organization/security/domain-allowlist
2. Verify that **jason-coaching-hub.vercel.app** is in your allowlist
3. If not, add it:
   - Click "Add domain"
   - Enter: `jason-coaching-hub.vercel.app`
   - Save and copy the domain key
4. Make sure the key matches the one above

### Option 3: Check CORS Headers

If the issue persists, verify your Railway backend has proper CORS settings:

1. Check that Railway backend allows requests from `https://jason-coaching-hub.vercel.app`
2. The backend already has CORS set to `allow_origins=["*"]` which should work

## What's Happening

- Frontend loads correctly ✅
- Backend is healthy ✅
- ChatKit script loads ✅
- But `useChatKit` hook returns no `control` object ❌

This means ChatKit is failing to initialize, likely due to domain verification.

## After Fixing

Once you've added the environment variable to Vercel and redeployed:
1. Clear your browser cache
2. Visit https://jason-coaching-hub.vercel.app/
3. You should see the ChatKit interface load properly

## Fallback

Your code already has the domain key hardcoded as a fallback in `config.ts`, but ChatKit may require it to be properly set as an env var during build time.


# Environment Variables Setup Guide

Quick reference for what environment variables to set and where.

## Backend (Railway)

Set these in your Railway project dashboard → Variables tab

### Production Railway Project

```bash
OPENAI_API_KEY=sk-proj-YOUR_KEY_HERE
JASON_VECTOR_STORE_ID=vs_YOUR_VECTOR_STORE_ID_HERE
DEBUG_MODE=false
```

### Staging Railway Project

```bash
OPENAI_API_KEY=sk-proj-YOUR_KEY_HERE              # Same as production
JASON_VECTOR_STORE_ID=vs_YOUR_VECTOR_STORE_ID_HERE   # Same as production
DEBUG_MODE=true                                    # Enable debug logs
```

## Frontend (Vercel)

Set these in Vercel project dashboard → Settings → Environment Variables

### For Production Environment (main branch)

| Variable | Value | Environment |
|----------|-------|-------------|
| `VITE_API_BASE` | `https://jason-coaching-backend-production.up.railway.app/` | Production |
| `VITE_CHATKIT_API_DOMAIN_KEY` | `domain_pk_YOUR_KEY_HERE` | Production |

### For Staging Environment (dev branch)

| Variable | Value | Environment |
|----------|-------|-------------|
| `VITE_API_BASE` | `https://jason-coaching-backend-staging.up.railway.app/` | Preview |
| `VITE_CHATKIT_API_DOMAIN_KEY` | `domain_pk_YOUR_KEY_HERE` | Preview |

## Optional Variables

These are optional - the app works without them:

```bash
VITE_GREETING="What can I help you create today?"
VITE_COMPOSER_PLACEHOLDER="What do you want to know?"
```

## Quick Setup Checklist

### ✅ Production Railway:
- [ ] OPENAI_API_KEY
- [ ] JASON_VECTOR_STORE_ID
- [ ] DEBUG_MODE=false
- [ ] Connected to `main` branch

### ✅ Staging Railway:
- [ ] OPENAI_API_KEY
- [ ] JASON_VECTOR_STORE_ID
- [ ] DEBUG_MODE=true
- [ ] Connected to `dev` branch

### ✅ Vercel Production:
- [ ] VITE_API_BASE → production Railway URL
- [ ] VITE_CHATKIT_API_DOMAIN_KEY
- [ ] Environment: "Production"

### ✅ Vercel Staging:
- [ ] VITE_API_BASE → staging Railway URL
- [ ] VITE_CHATKIT_API_DOMAIN_KEY
- [ ] Environment: "Preview"

## Where to Find These Values

### OPENAI_API_KEY
- Go to: https://platform.openai.com/api-keys
- Create new secret key
- Copy and save it (you can't see it again!)

### JASON_VECTOR_STORE_ID
- Go to: https://platform.openai.com/storage/vector_stores
- Find your vector store
- Copy the ID (starts with `vs_`)

### VITE_CHATKIT_API_DOMAIN_KEY
- Go to: https://platform.openai.com/settings/organization/security/domain-allowlist
- Add your domain (e.g., `your-app.vercel.app`)
- Copy the domain key (starts with `domain_pk_`)

### Railway URLs
- After deploying to Railway, go to your project
- Click "Settings" → "Domains"
- Copy the generated URL (e.g., `https://your-project.up.railway.app`)

## Testing Your Setup

### Test Backend
```bash
# Production
curl https://jason-coaching-backend-production.up.railway.app/health

# Staging
curl https://jason-coaching-backend-staging.up.railway.app/health
```

Both should return: `{"status":"ok"}`

### Test Frontend
1. **Staging**: Open `https://your-app-git-dev.vercel.app` in browser
2. **Production**: Open `https://your-app.vercel.app` in browser
3. Check browser console - should see config logs showing correct API_BASE
4. Try sending a message - should work!

## Common Issues

### Frontend can't reach backend
- Check VITE_API_BASE has trailing slash: `/`
- Check Railway backend is deployed and healthy
- Check CORS settings in backend allow your frontend domain

### "Domain not allowed" error
- Register your Vercel domain in OpenAI dashboard
- Make sure VITE_CHATKIT_API_DOMAIN_KEY matches the domain

### Changes not appearing
- Vercel: Check deployment logs in dashboard
- Railway: Check build logs in dashboard
- Clear browser cache and hard refresh (Cmd+Shift+R)


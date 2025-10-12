# Your To-Do List

I've done everything I can. Here's what YOU need to do:

## ✅ Done (By Me)
- ✅ Created `dev` branch
- ✅ Pushed to GitHub
- ✅ Created all documentation
- ✅ Updated frontend config
- ✅ Vercel will now auto-create preview deployments for `dev` branch

## 🔴 Your Turn (15 minutes)

### 1. Create Railway Staging Project (5 min)
1. Go to: https://railway.app/new
2. Click "New Project"
3. Name it: `jason-coaching-backend-staging`
4. Connect to your GitHub repo: `jasonc00person/jason-coaching-hub`
5. **Select branch: `dev`** (not main!)
6. Click "Deploy"

### 2. Copy Environment Variables to Railway Staging (3 min)
1. Open your **PRODUCTION** Railway project in another tab
2. Go to: Variables tab
3. Copy these three variables:
   - `OPENAI_API_KEY`
   - `JASON_VECTOR_STORE_ID`
4. Go back to your **STAGING** Railway project
5. Add those same two variables
6. Add one more: `DEBUG_MODE` = `true`
7. Railway will auto-redeploy
8. Copy the staging URL (looks like: `https://xxxx.up.railway.app`)

### 3. Configure Vercel Environment Variable (2 min)
You already have `VITE_API_BASE_1` for "All Pre-Production Environments" - perfect!

1. Click on `VITE_API_BASE_1` in Vercel
2. Edit the **Value** to: `https://[YOUR-STAGING-URL-FROM-STEP-2].up.railway.app/`
3. Make sure it's set for "Preview" environment
4. Click "Save"

✅ Your code now automatically uses:
- `VITE_API_BASE_1` for staging (Preview/dev branch)
- `VITE_API_BASE` for production (main branch)

### 4. Configure Production Railway (1 min)
1. Go to your **PRODUCTION** Railway project
2. Settings → Check that it's connected to `main` branch
3. If not, change it to `main`

### 5. Test It! (3 min)
1. Go to Vercel dashboard
2. Find the deployment with branch `dev`
3. Click the URL (will be like: `jason-coaching-hub-git-dev-xxxx.vercel.app`)
4. Test your app - send a message, make sure it works!

## 🎉 That's It!

After you do these 5 things, you'll have:
- **Staging**: Test here first (dev branch)
- **Production**: Deploy here when ready (main branch)

## Your Daily Workflow After Setup

```bash
# Work on dev
git checkout dev

# Make changes, then:
git add .
git commit -m "what you changed"
git push origin dev
# → Auto-deploys to staging

# Test on staging URL
# → If it works:

git checkout main
git merge dev
git push origin main
# → Auto-deploys to production
```

## Need Help?
- Quick commands: See **QUICK_REFERENCE.md**
- Full guide: See **START_HERE.md**
- Git help: See **GIT_WORKFLOW.md**


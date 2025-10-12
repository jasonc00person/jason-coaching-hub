# Deployment Workflow

## ⚠️ CRITICAL RULES ⚠️

### 🚨 DEFAULT: ALWAYS PUSH TO `dev` BRANCH

**NEVER push to `main` unless explicitly instructed!**

- ✅ **Default**: Work on `dev` branch
- ✅ **Default**: Push to `dev` branch
- ⛔ **DANGER**: Only push to `main` when specifically told
- ⛔ **DANGER**: `main` = production = real users see this

---

## Current Setup (October 12, 2025)

### Staging Environment (dev branch)
- **Frontend**: https://jason-coaching-hub-git-dev-creator-economy.vercel.app
- **Backend**: https://jason-coaching-backend-staging.up.railway.app
- **Purpose**: Testing, iteration, breaking things safely
- **Database**: Same as production (shared vector store)
- **Debug Mode**: Enabled (`DEBUG_MODE=true`)

### Production Environment (main branch)
- **Frontend**: Your main Vercel domain
- **Backend**: https://jason-coaching-backend-production.up.railway.app
- **Purpose**: Live site for real users
- **Database**: Same as staging (shared vector store)
- **Debug Mode**: Disabled (`DEBUG_MODE=false`)

---

## Your Daily Workflow

### Step 1: Start Working (Always Do This First!)

```bash
# Check current branch
git branch

# If not on dev, switch to it
git checkout dev

# Get latest changes (if working with others)
git pull origin dev
```

**Remember**: If you're not on `dev`, you're in the wrong place!

### Step 2: Make Changes

- Edit files in Cursor
- Save them
- Test locally if needed (optional)

### Step 3: Deploy to Staging

```bash
# Stage all changes
git add .

# Commit with descriptive message
git commit -m "describe what you changed"

# Push to dev (staging)
git push origin dev
```

**What happens**:
- ✅ Vercel automatically deploys frontend to staging URL
- ✅ Railway automatically deploys backend to staging URL
- ✅ Changes are live on staging in ~1-2 minutes

### Step 4: Test on Staging

1. Open: https://jason-coaching-hub-git-dev-creator-economy.vercel.app
2. Test your changes thoroughly
3. Check browser console (F12) for errors
4. Test all features you changed
5. Send test messages, upload files, etc.

**If broken**: Go back to Step 2, fix it, repeat Steps 3-4

**If working**: Continue to Step 5

### Step 5: Deploy to Production (ONLY WHEN EXPLICITLY TOLD!)

```bash
# ⚠️ DANGER ZONE - Only do this when explicitly told!

# Switch to main branch
git checkout main

# Merge tested changes from dev
git merge dev

# Push to production
git push origin main

# ⚠️ Real users will see these changes immediately!

# Switch back to dev for safety
git checkout dev
```

**What happens**:
- ✅ Vercel automatically deploys frontend to production URL
- ✅ Railway automatically deploys backend to production URL
- 🌍 **Real users see your changes immediately**

### Step 6: Continue Working

```bash
# Always return to dev branch
git checkout dev
```

**Never** stay on `main` branch!

---

## Safety Checklist

Before pushing to `main`, verify:

- [ ] Tested on staging thoroughly
- [ ] No console errors
- [ ] All features working correctly
- [ ] Database changes tested
- [ ] No breaking changes
- [ ] Explicitly told to deploy to production
- [ ] Ready for real users to see this

---

## Common Commands

### Check Current Branch
```bash
git branch
# The one with * is your current branch
```

### Switch Branches
```bash
git checkout dev     # Go to dev (do this 99% of the time)
git checkout main    # Go to main (DANGEROUS!)
```

### See What Changed
```bash
git status           # What files changed
git diff             # See exact changes
```

### View Commit History
```bash
git log --oneline    # Recent commits
```

### Undo Last Commit (Keep Changes)
```bash
git reset --soft HEAD~1
```

### Undo Last Commit (Delete Changes)
```bash
git reset --hard HEAD~1
```

---

## Emergency: Rolled Out Broken Code

If you accidentally pushed broken code to `main`:

```bash
# Quick rollback
git checkout main
git revert HEAD
git push origin main
```

This creates a new commit that undoes the last one. Production redeploys automatically with the working version.

---

## Deployment URLs Reference

| Environment | Frontend | Backend |
|-------------|----------|---------|
| **Staging (dev)** | https://jason-coaching-hub-git-dev-creator-economy.vercel.app | https://jason-coaching-backend-staging.up.railway.app |
| **Production (main)** | Your main domain | https://jason-coaching-backend-production.up.railway.app |
| **Local** | http://localhost:5173 | http://localhost:8000 |

---

## How Auto-Deployment Works

### When you push to `dev`:

```
Your Push → GitHub (dev branch)
    ↓
    ├─→ Vercel sees push → builds frontend → deploys to staging URL
    └─→ Railway sees push → builds backend → deploys to staging URL
```

**Time**: ~1-2 minutes

### When you push to `main`:

```
Your Push → GitHub (main branch)
    ↓
    ├─→ Vercel sees push → builds frontend → deploys to PRODUCTION
    └─→ Railway sees push → builds backend → deploys to PRODUCTION
```

**Time**: ~1-2 minutes
**Impact**: 🌍 Real users see changes

---

## Environment Variables

### Staging (Vercel Preview)
- `VITE_API_BASE_1`: Points to staging Railway backend
- `VITE_CHATKIT_API_DOMAIN_KEY`: Your domain key

### Production (Vercel Production)
- `VITE_API_BASE`: Points to production Railway backend
- `VITE_CHATKIT_API_DOMAIN_KEY`: Your domain key

### Staging Backend (Railway)
- `OPENAI_API_KEY`: Your OpenAI key
- `JASON_VECTOR_STORE_ID`: Your vector store ID
- `DEBUG_MODE`: `true`

### Production Backend (Railway)
- `OPENAI_API_KEY`: Your OpenAI key
- `JASON_VECTOR_STORE_ID`: Your vector store ID
- `DEBUG_MODE`: `false`

---

## Troubleshooting

### "Which branch am I on?"
```bash
git branch
```
Look for the `*` - that's your current branch.

### "I made changes on main by accident!"
```bash
git stash                # Save changes
git checkout dev         # Switch to dev
git stash pop            # Restore changes
```

### "My changes aren't showing on staging"
1. Check Vercel dashboard for deployment status
2. Check Railway dashboard for deployment status
3. Hard refresh browser (Cmd+Shift+R)
4. Check git push actually succeeded: `git log origin/dev`

### "I pushed to main by accident!"
```bash
git checkout main
git revert HEAD          # Undo the commit
git push origin main     # Redeploy without broken code
git checkout dev         # Go back to safety
```

---

## Best Practices

1. **Always work on `dev`** - 99% of your time should be on dev branch
2. **Test thoroughly on staging** - Catch bugs before production
3. **Commit frequently** - Small commits are easier to debug
4. **Descriptive commit messages** - Future you will thank you
5. **Only merge to main when explicitly told** - Protect production
6. **Immediately switch back to dev** - Don't linger on main

---

## Quick Reference

**The Three Commands You'll Use Most:**

```bash
# 1. Make sure you're on dev
git checkout dev

# 2. Deploy to staging
git add . && git commit -m "your message" && git push origin dev

# 3. Check which branch you're on
git branch
```

**That's 90% of what you'll do!**

---

## Summary

### The Golden Rule

```
Work on dev → Push to dev → Test on staging → Only merge to main when told
```

### The Safety Rule

**🚨 DEFAULT = `dev` branch**

Unless explicitly instructed otherwise, you should be:
- ✅ Working on `dev`
- ✅ Pushing to `dev`
- ✅ Testing on staging

Never touch `main` unless specifically told!

---

**Last Updated**: October 12, 2025
**Status**: Staging and Production environments fully operational


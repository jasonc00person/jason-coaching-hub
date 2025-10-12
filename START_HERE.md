# START HERE - Your Staging Setup

## What You Asked For

You wanted to **stop testing in production** and have a proper **staging environment** where you can test before deploying to real users.

✅ **Done!** Here's everything you need.

## What I Created For You

### 📚 Documentation (Read These)

1. **[QUICK_REFERENCE.md](QUICK_REFERENCE.md)** ⚡
   - **Read this FIRST**
   - 1-minute overview
   - All the commands you'll use daily
   - Quick troubleshooting

2. **[STAGING_SETUP_GUIDE.md](STAGING_SETUP_GUIDE.md)** 🚀
   - **Step-by-step setup instructions**
   - Setting up Railway staging
   - Setting up Vercel environments
   - Takes ~15 minutes total

3. **[STAGING_ARCHITECTURE.md](STAGING_ARCHITECTURE.md)** 📊
   - **Visual diagrams**
   - How everything connects
   - Why this setup is awesome
   - Great for understanding the big picture

4. **[GIT_WORKFLOW.md](GIT_WORKFLOW.md)** 📝
   - **Daily git commands**
   - How to use branches
   - Examples for common scenarios
   - Undo commands when you mess up

5. **[ENVIRONMENT_VARIABLES.md](ENVIRONMENT_VARIABLES.md)** 🔧
   - **What variables to set where**
   - Checklists for Railway and Vercel
   - Where to find API keys
   - Testing commands

### 🛠️ Script

- **`setup-staging.sh`** - Run this to create your dev branch automatically

## Your Next Steps (Do This Now!)

### Step 1: Understand the Basics (5 minutes)
```bash
# Open and read this file:
open QUICK_REFERENCE.md
```

### Step 2: Create Dev Branch (1 minute)
```bash
# Run this script:
./setup-staging.sh
```

This creates your `dev` branch and pushes it to GitHub.

### Step 3: Set Up Railway Staging (5 minutes)

1. Go to https://railway.app/new
2. Create new project: "jason-coaching-backend-staging"
3. Connect to your GitHub repo
4. **Select `dev` branch** (not main!)
5. Copy environment variables from your production Railway project:
   - `OPENAI_API_KEY`
   - `JASON_VECTOR_STORE_ID`
   - `DEBUG_MODE=true`
6. Deploy
7. Copy the staging backend URL

### Step 4: Set Up Vercel Staging (3 minutes)

1. Go to https://vercel.com
2. Go to your project → Settings → Environment Variables
3. Add new variable:
   - Name: `VITE_API_BASE`
   - Value: `https://YOUR-STAGING-BACKEND.railway.app/` (from step 3)
   - Environment: **Preview only** (uncheck Production and Development)
4. Save

### Step 5: Test It! (2 minutes)

```bash
# Make sure you're on dev branch
git checkout dev

# Make a tiny change (add a comment to a file)
echo "// test" >> frontend-v2/src/App.tsx

# Push to staging
git add .
git commit -m "test staging setup"
git push origin dev
```

Then:
1. Go to Vercel dashboard
2. Find the preview deployment
3. Click the URL (looks like: `your-app-git-dev.vercel.app`)
4. Test your app!

If it works → **YOU'RE DONE!** 🎉

### Step 6: Read the Full Guide (Optional)

If you want to understand everything in detail:
```bash
open STAGING_SETUP_GUIDE.md
```

## Your Daily Workflow (After Setup)

This is what you'll do every day:

```bash
# 1. Make sure you're on dev
git checkout dev

# 2. Make your changes in Cursor
# (edit files, save them)

# 3. Push to staging
git add .
git commit -m "what you changed"
git push origin dev

# 4. Test on staging URL
# → Open https://your-app-git-dev.vercel.app
# → Test your changes
# → If broken, fix and repeat step 2-4

# 5. When everything works, deploy to production
git checkout main
git merge dev
git push origin main
```

Done! Real users see your changes.

## The Simple Explanation

You asked for this in simple terms, so here it is:

### Before (What You Were Doing)
```
Make changes → Push to GitHub → Deploys to production → Users see it
```
**Problem**: If it breaks, users see the broken version!

### After (What You'll Do Now)
```
Make changes → Push to dev branch → Deploys to staging → You test it
                                          ↓
                                      If it works:
                                          ↓
                              Merge to main → Deploys to production → Users see it
```
**Benefit**: Test first, deploy when ready. Users never see broken stuff!

## What Each Branch Does

| Branch | Where It Deploys | Who Sees It | Purpose |
|--------|------------------|-------------|---------|
| `dev` | Staging URLs | Just you | Testing |
| `main` | Production URLs | Real users | Live site |

## Your Workflow in Plain English

1. **Work on dev branch** (your testing area)
2. **Push to GitHub** (automatic deploy to staging)
3. **Test on staging URL** (make sure it works)
4. **Merge to main branch** (when ready)
5. **Push to GitHub** (automatic deploy to production)
6. **Done!** (users see working feature)

## How This Helps You

### ✅ Pros
- Test in a real environment (not just localhost)
- Break staging all you want, production stays safe
- Real users never see bugs
- Easy to undo mistakes (just revert git commit)
- Professional workflow (same as big companies)

### ❌ Cons
- One extra step (merge dev → main)
- Two Railway projects to manage
- Slightly more complex

### 💰 Cost
- **Almost nothing extra!**
- Railway staging uses same resources (unless you're testing)
- Vercel preview deployments are free
- You're already paying for the services

## Common Questions

### "Do I ALWAYS work on dev branch now?"
**Yes!** Only merge to main when you're ready to deploy.

### "What if I forget and push to main?"
**No problem!** Just revert the commit if it's broken. Git makes this easy.

### "Can I still test locally?"
**Yes!** Local dev still works exactly the same way.

### "What if staging is broken but I need to deploy something else?"
**Fix staging first, or create a new branch.** Never merge broken code to main.

### "How do I know which environment I'm looking at?"
**Bookmark both URLs:**
- Staging: `https://your-app-git-dev.vercel.app`
- Production: `https://your-app.vercel.app`

Or check the URL bar - staging has `-git-dev` in it!

## Get Help

If you're stuck:

1. Check **[QUICK_REFERENCE.md](QUICK_REFERENCE.md)** for commands
2. Check **[STAGING_SETUP_GUIDE.md](STAGING_SETUP_GUIDE.md)** for setup steps
3. Check Vercel/Railway dashboard logs
4. Run `./diagnose-chatkit.sh` to check for issues

## You're Ready!

You now have:
- ✅ Professional development workflow
- ✅ Safe testing environment
- ✅ Protection for production
- ✅ Easy rollback if things break
- ✅ Same setup as billion-dollar companies

**Next step**: Run `./setup-staging.sh` and follow the steps above!

---

**Questions? Confused? That's normal!** Just start with [QUICK_REFERENCE.md](QUICK_REFERENCE.md) and it'll make sense quickly.

Good luck! 🚀


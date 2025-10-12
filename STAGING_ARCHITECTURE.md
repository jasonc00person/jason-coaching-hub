# Staging & Production Architecture

Visual guide showing how your staging and production environments work.

## The Big Picture

```
┌─────────────────────────────────────────────────────────────────┐
│                         YOUR LAPTOP                              │
│                    (Cursor - Make Changes)                       │
└───────────────┬─────────────────────────────────┬───────────────┘
                │                                 │
                │ git push origin dev             │ git push origin main
                │                                 │
                ↓                                 ↓
┌───────────────────────────────┐ ┌───────────────────────────────┐
│         GITHUB                │ │         GITHUB                │
│        dev branch             │ │       main branch             │
└───────┬───────────────┬───────┘ └───────┬───────────────┬───────┘
        │               │                 │               │
        │               │                 │               │
   Auto │          Auto │            Auto │          Auto │
 Deploy │        Deploy │          Deploy │        Deploy │
        │               │                 │               │
        ↓               ↓                 ↓               ↓
┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│   VERCEL     │ │   RAILWAY    │ │   VERCEL     │ │   RAILWAY    │
│   STAGING    │ │   STAGING    │ │ PRODUCTION   │ │ PRODUCTION   │
│              │ │              │ │              │ │              │
│  Frontend    │ │   Backend    │ │  Frontend    │ │   Backend    │
└──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘
       │                │                 │                │
       └────────┬───────┘                 └────────┬───────┘
                ↓                                  ↓
        ┌──────────────┐                  ┌──────────────┐
        │   STAGING    │                  │ PRODUCTION   │
        │ (Test Here)  │                  │ (Real Users) │
        └──────────────┘                  └──────────────┘
```

## Your Two Environments Side-by-Side

### 🧪 Staging (dev branch)

**Purpose**: Test everything before it goes live

**Frontend (Vercel)**
- URL: `https://your-app-git-dev.vercel.app`
- Branch: `dev`
- Environment: Preview
- Variables: Points to staging backend

**Backend (Railway)**
- URL: `https://jason-coaching-backend-staging.railway.app`
- Branch: `dev`
- Project: jason-coaching-backend-staging
- Variables: Same API keys, DEBUG_MODE=true

**Who sees this**: Just you (and anyone you share the link with)

---

### 🌍 Production (main branch)

**Purpose**: Real users interact with this

**Frontend (Vercel)**
- URL: `https://your-app.vercel.app` (your actual domain)
- Branch: `main`
- Environment: Production
- Variables: Points to production backend

**Backend (Railway)**
- URL: `https://jason-coaching-backend-production.up.railway.app`
- Branch: `main`
- Project: jason-coaching-backend-production
- Variables: Same API keys, DEBUG_MODE=false

**Who sees this**: Everyone with your URL

## How Code Flows

### Step-by-Step Journey

```
1. YOU write code in Cursor
   ↓
2. YOU save and commit changes
   ↓
3. YOU push to dev branch
   ↓
4. GITHUB receives the push
   ↓
5. VERCEL sees dev branch changed
   ├─→ Builds frontend
   └─→ Deploys to staging URL
   ↓
6. RAILWAY sees dev branch changed
   ├─→ Builds backend
   └─→ Deploys to staging URL
   ↓
7. YOU test on staging
   ├─→ Works? Go to step 8
   └─→ Broken? Go back to step 1
   ↓
8. YOU merge dev → main
   ↓
9. GITHUB receives the main branch push
   ↓
10. VERCEL sees main branch changed
    ├─→ Builds frontend
    └─→ Deploys to production URL
    ↓
11. RAILWAY sees main branch changed
    ├─→ Builds backend
    └─→ Deploys to production URL
    ↓
12. ✅ LIVE TO USERS!
```

## Why This Setup Is Awesome

### ✅ Benefits

1. **Safe Testing**
   - Break staging all you want
   - Production stays safe
   - Real users never see bugs

2. **Real Environment**
   - Staging = exactly like production
   - If it works in staging, it works in production
   - No "but it worked on my machine!"

3. **Easy Rollback**
   - Broke production? Just revert the git commit
   - Automatic redeploy to last working version
   - Takes 30 seconds

4. **Fast Iteration**
   - Push to dev → instant deploy to staging
   - Test → fix → test again
   - No manual deployment steps

5. **Version Control**
   - Every change tracked in git
   - See what changed when
   - Who made what change

## What Happens When You Push

### Push to dev branch

```bash
git push origin dev
```

**Instantly triggers:**
- ⚡ Vercel builds frontend (~30 seconds)
- ⚡ Railway builds backend (~60 seconds)
- 🔗 Staging URLs updated
- 📧 You get deployment notifications (if enabled)

**Result**: Test URL ready in ~1-2 minutes

### Push to main branch

```bash
git push origin main
```

**Instantly triggers:**
- ⚡ Vercel builds frontend (~30 seconds)
- ⚡ Railway builds backend (~60 seconds)
- 🔗 Production URLs updated
- 🌍 Live to all users

**Result**: Production updated in ~1-2 minutes

## Environment Variables Flow

### How Frontend Knows Which Backend to Use

**Staging (dev branch)**
```javascript
// Vercel Preview environment has:
VITE_API_BASE = "https://backend-staging.railway.app/"

// So config.ts uses:
const API_BASE = import.meta.env.VITE_API_BASE
// → Points to staging backend
```

**Production (main branch)**
```javascript
// Vercel Production environment has:
VITE_API_BASE = "https://backend-production.railway.app/"

// So config.ts uses:
const API_BASE = import.meta.env.VITE_API_BASE
// → Points to production backend
```

**Local Development**
```javascript
// No VITE_API_BASE set

// So config.ts uses:
const API_BASE = import.meta.env.DEV 
  ? "http://localhost:8000/" 
  : "fallback url"
// → Points to local backend
```

## Your Workflow Visualized

### Daily Development Cycle

```
Morning:
┌─────────────┐
│ git checkout│
│     dev     │
└──────┬──────┘
       │
       ↓
┌─────────────┐
│ Make changes│
│  in Cursor  │
└──────┬──────┘
       │
       ↓
┌─────────────┐
│  git push   │
│  origin dev │
└──────┬──────┘
       │
       ↓
┌─────────────┐
│ Test on     │
│  staging    │
└──────┬──────┘
       │
    ┌──┴───┐
    │      │
 Works?  Broken?
    │      │
    ↓      ↓
  Merge   Fix → (loop back to "Make changes")
  to main
    ↓
┌─────────────┐
│ git push    │
│ origin main │
└──────┬──────┘
       │
       ↓
┌─────────────┐
│   LIVE!     │
│     🎉      │
└─────────────┘
```

## Common Scenarios

### Scenario 1: Adding New Feature

```
YOU: Create feature on dev branch
     ↓
STAGING: Deploy automatically
     ↓
YOU: Test the feature
     ↓
STAGING: "Works great!"
     ↓
YOU: Merge to main
     ↓
PRODUCTION: Deploy automatically
     ↓
USERS: See new feature
```

### Scenario 2: Bug Fix

```
USER: "The login button is broken!"
     ↓
YOU: Fix bug on dev branch
     ↓
STAGING: Deploy automatically
     ↓
YOU: Test the fix
     ↓
STAGING: "Bug is fixed!"
     ↓
YOU: Merge to main
     ↓
PRODUCTION: Deploy automatically
     ↓
USER: "Login works now, thanks!"
```

### Scenario 3: Oops, Broke Production

```
YOU: Push breaking change to main
     ↓
PRODUCTION: Deploy automatically
     ↓
USERS: "Site is broken!"
     ↓
YOU: git revert HEAD
     ↓
YOU: git push origin main
     ↓
PRODUCTION: Deploy last working version
     ↓
USERS: "It's working again!"
     ↓
YOU: Fix issue properly on dev
     ↓
STAGING: Test the fix
     ↓
YOU: Merge to main (when ready)
```

## Key Takeaways

### 🎯 Always Remember

1. **dev = staging** (your testing ground)
2. **main = production** (real users)
3. **Test on staging first** (always!)
4. **Merge to main when ready** (and tested!)
5. **Git is your safety net** (can always undo)

### 🚀 The Golden Workflow

```
dev → test → main → done
```

That's it! Simple, safe, professional.

---

**You now have the same setup as billion-dollar companies!** 💪


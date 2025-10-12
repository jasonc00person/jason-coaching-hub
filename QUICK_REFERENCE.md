# Quick Reference - TL;DR Version

## One-Minute Setup

```bash
# Run this once
./setup-staging.sh

# Then set up Railway and Vercel (see STAGING_SETUP_GUIDE.md)
```

## Daily Commands

```bash
# Start work
git checkout dev

# Make changes, then deploy to staging
git add .
git commit -m "what you did"
git push origin dev

# Test on staging, then deploy to production
git checkout main
git merge dev
git push origin main
```

## Your URLs

| Environment | Frontend | Backend |
|-------------|----------|---------|
| Local Dev | http://localhost:5173 | http://localhost:8000 |
| Staging | your-app-git-dev.vercel.app | backend-staging.railway.app |
| Production | your-app.vercel.app | backend-production.railway.app |

## Environment Variables

### Vercel

| Variable | Production | Preview (Staging) |
|----------|------------|-------------------|
| VITE_API_BASE | production Railway URL | staging Railway URL |
| VITE_CHATKIT_API_DOMAIN_KEY | your domain key | your domain key |

### Railway

| Variable | Production | Staging |
|----------|------------|---------|
| OPENAI_API_KEY | your key | your key |
| JASON_VECTOR_STORE_ID | your ID | your ID |
| DEBUG_MODE | false | true |

## The Workflow

```
dev → staging → test → main → production
```

## Undo Mistakes

```bash
# Undo last commit (keep changes)
git reset --soft HEAD~1

# Undo last commit (delete changes)
git reset --hard HEAD~1

# Revert production deploy
git checkout main
git revert HEAD
git push origin main
```

## Check Status

```bash
# Which branch am I on?
git branch

# What changed?
git status

# View recent commits
git log --oneline
```

## Full Guides

- **[Staging Setup](STAGING_SETUP_GUIDE.md)** - Complete setup instructions
- **[Git Workflow](GIT_WORKFLOW.md)** - All git commands explained
- **[Environment Variables](ENVIRONMENT_VARIABLES.md)** - What to set where
- **[Architecture](STAGING_ARCHITECTURE.md)** - Visual diagrams

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "Which branch?" | `git branch` (look for *) |
| "Changes not deploying" | Check Vercel/Railway dashboard logs |
| "Frontend can't reach backend" | Check VITE_API_BASE has trailing `/` |
| "Broke production" | `git revert HEAD && git push origin main` |
| "Wrong environment variables" | Check Vercel settings → Environment Variables |

## Support URLs

- Vercel Dashboard: https://vercel.com
- Railway Dashboard: https://railway.app
- OpenAI Platform: https://platform.openai.com
- GitHub Repo: https://github.com/YOUR_USERNAME/YOUR_REPO

---

**Remember**: Always work on `dev`, test on staging, deploy to `main` when ready! 🚀


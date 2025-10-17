# Git Workflow Cheat Sheet

Simple commands for your daily development workflow.

## Your Two Branches

- **dev** → Your testing playground (deploys to staging)
- **main** → Production (deploys to real users)

## Daily Workflow

### 1. Start Working (Always do this first!)

```bash
# Make sure you're on the dev branch
git checkout dev

# Get latest changes (if working with others)
git pull origin dev
```

### 2. Make Your Changes

- Edit files in Cursor
- Save them
- Test locally if you want (optional)

### 3. Push to Staging

```bash
# Stage all your changes
git add .

# Commit with a message
git commit -m "describe what you changed"

# Push to GitHub (auto-deploys to staging)
git push origin dev
```

**Result**: Your changes are now live on:
- Frontend: `https://your-app-git-dev.vercel.app`
- Backend: `https://your-backend-staging.railway.app`

### 4. Test on Staging

- Open staging URL in browser
- Test your changes
- If broken → make fixes → repeat step 3
- If working → continue to step 5

### 5. Deploy to Production

```bash
# Switch to main branch
git checkout main

# Merge your tested changes from dev
git merge dev

# Push to production
git push origin main
```

**Result**: Your changes are now live on production! 🎉

### 6. Go Back to Dev Branch

```bash
# Always switch back to dev for next changes
git checkout dev
```

## Quick Reference Commands

```bash
# See which branch you're on
git branch

# Switch branches
git checkout dev    # → staging
git checkout main   # → production

# See what files changed
git status

# See what changes you made
git diff

# Undo changes to a file (before commit)
git checkout -- filename.txt

# Undo last commit (but keep changes)
git reset --soft HEAD~1

# See commit history
git log --oneline
```

## Example: Adding a New Feature

```bash
# 1. Start on dev
git checkout dev

# 2. Make changes in Cursor
# (edit App.tsx, add new button)

# 3. Push to staging
git add .
git commit -m "Added cool new button"
git push origin dev

# 4. Test on staging
# → Open https://your-app-git-dev.vercel.app
# → Click the button, make sure it works

# 5. Deploy to production
git checkout main
git merge dev
git push origin main

# 6. Back to dev
git checkout dev
```

## Example: Quick Fix in Production

```bash
# 1. Go to dev (always work here first!)
git checkout dev

# 2. Make the fix
# (fix bug in config.ts)

# 3. Push and test
git add .
git commit -m "Fixed login bug"
git push origin dev

# 4. Test on staging
# → Verify fix works

# 5. Fast-track to production
git checkout main
git merge dev
git push origin main

# 6. Back to dev
git checkout dev
```

## Visual Flow

```
┌─────────────┐
│ Your Laptop │ (Cursor - make changes here)
└──────┬──────┘
       │ git push origin dev
       ↓
┌─────────────┐
│ Dev Branch  │ (GitHub)
└──────┬──────┘
       │ Automatic Deploy
       ↓
┌─────────────┐
│   STAGING   │ (Test here!)
│   Frontend  │ https://app-git-dev.vercel.app
│   Backend   │ https://backend-staging.railway.app
└─────────────┘
       │ When ready...
       │ git checkout main
       │ git merge dev
       │ git push origin main
       ↓
┌─────────────┐
│ Main Branch │ (GitHub)
└──────┬──────┘
       │ Automatic Deploy
       ↓
┌─────────────┐
│ PRODUCTION  │ (Real users)
│   Frontend  │ https://your-app.vercel.app
│   Backend   │ https://backend-prod.railway.app
└─────────────┘
```

## The Golden Rules

### ✅ DO:
- Work on `dev` branch
- Test on staging before merging to main
- Commit small changes frequently
- Write clear commit messages

### ❌ DON'T:
- Don't work directly on `main` branch
- Don't push untested code to production
- Don't skip the staging step
- Don't merge broken code

## Common Situations

### "Which branch am I on?"
```bash
git branch
# The one with * is current branch
```

### "I made changes on the wrong branch!"
```bash
# If you haven't committed yet:
git stash                # Save changes
git checkout dev         # Switch to correct branch
git stash pop           # Restore changes
```

### "I want to undo my last commit"
```bash
# Undo but keep the changes
git reset --soft HEAD~1

# Undo and delete the changes
git reset --hard HEAD~1
```

### "I pushed broken code to production!"
```bash
# Quick fix: revert the last commit
git checkout main
git revert HEAD
git push origin main

# This creates a new commit that undoes the broken one
```

### "How do I see what's different between dev and main?"
```bash
git checkout main
git diff dev
```

## Commit Message Examples

Good commit messages:
```
✅ "Added user profile page"
✅ "Fixed login button not working"
✅ "Updated API endpoint to use new format"
✅ "Improved loading speed by 2x"
```

Bad commit messages:
```
❌ "Fixed stuff"
❌ "Changes"
❌ "asdf"
❌ "Update"
```

## Pro Tips

1. **Check before you push**
   ```bash
   git status    # See what changed
   git diff      # See exact changes
   ```

2. **Commit related changes together**
   ```bash
   # Bad: one commit for everything
   git add .
   
   # Good: separate commits for different features
   git add component.tsx
   git commit -m "Added new component"
   
   git add styles.css
   git commit -m "Updated styles"
   ```

3. **Pull before you push (if working with others)**
   ```bash
   git pull origin dev   # Get latest changes
   # Then push your changes
   ```

4. **Use git log to see history**
   ```bash
   git log --oneline --graph --all
   # Shows visual history of commits
   ```

## Need Help?

If you mess something up, don't panic! Git makes it almost impossible to permanently lose work.

```bash
# See everything you've done recently
git reflog

# This shows every action, even "deleted" commits
# You can restore from here if needed
```

---

**Remember**: Work on `dev` → Test → Merge to `main` → Repeat! 🔄


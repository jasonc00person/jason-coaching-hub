#!/bin/bash

# Safe Push to Staging Script
# This ensures you're always pushing to dev branch (staging)

echo "🚀 Safe Push to Staging"
echo "======================="
echo ""

# Check current branch
CURRENT_BRANCH=$(git branch --show-current)
echo "📍 Current branch: $CURRENT_BRANCH"
echo ""

# If not on dev, warn and switch
if [ "$CURRENT_BRANCH" != "dev" ]; then
    echo "⚠️  WARNING: You're not on the dev branch!"
    echo ""
    echo "Switching to dev branch for safety..."
    git checkout dev
    
    if [ $? -ne 0 ]; then
        echo "❌ Failed to switch to dev branch"
        exit 1
    fi
    
    echo "✅ Switched to dev branch"
    echo ""
fi

# Check if there are changes to commit
if [ -z "$(git status --porcelain)" ]; then
    echo "ℹ️  No changes to commit"
    echo ""
    echo "Do you want to push anyway? (y/n)"
    read -r response
    if [ "$response" != "y" ]; then
        echo "Cancelled."
        exit 0
    fi
else
    # Show what changed
    echo "📝 Files changed:"
    git status --short
    echo ""
    
    # Ask for commit message
    echo "Enter commit message (or press Enter for 'Update'):"
    read -r commit_msg
    
    if [ -z "$commit_msg" ]; then
        commit_msg="Update"
    fi
    
    # Stage and commit
    git add .
    git commit -m "$commit_msg"
    
    if [ $? -ne 0 ]; then
        echo "❌ Commit failed"
        exit 1
    fi
    
    echo "✅ Changes committed"
    echo ""
fi

# Push to dev
echo "📤 Pushing to dev branch (staging)..."
git push origin dev

if [ $? -ne 0 ]; then
    echo "❌ Push failed"
    exit 1
fi

echo ""
echo "✅ Successfully pushed to staging!"
echo ""
echo "🌐 Your changes will deploy to:"
echo "   Frontend: https://jason-coaching-hub-git-dev-creator-economy.vercel.app"
echo "   Backend:  https://jason-coaching-backend-staging.up.railway.app"
echo ""
echo "⏱  Deployment takes ~1-2 minutes"
echo "🧪 Test thoroughly before deploying to production"
echo ""


#!/bin/bash

# Push to Production Script
# ⚠️ USE WITH EXTREME CAUTION ⚠️

echo "🚨 DANGER: PRODUCTION DEPLOYMENT 🚨"
echo "====================================="
echo ""
echo "⚠️  This will deploy to PRODUCTION"
echo "⚠️  Real users will see these changes"
echo "⚠️  Make sure you tested on staging first!"
echo ""

# Triple confirmation
echo "Have you tested these changes on staging? (yes/no)"
read -r tested
if [ "$tested" != "yes" ]; then
    echo "❌ Please test on staging first!"
    echo "Run: ./push-to-staging.sh"
    exit 1
fi

echo ""
echo "Are all features working correctly? (yes/no)"
read -r working
if [ "$working" != "yes" ]; then
    echo "❌ Please fix issues on staging first!"
    exit 1
fi

echo ""
echo "🚨 FINAL WARNING 🚨"
echo "This will deploy to PRODUCTION (main branch)"
echo "Real users will see this immediately!"
echo ""
echo "Type 'DEPLOY TO PRODUCTION' to continue:"
read -r confirm

if [ "$confirm" != "DEPLOY TO PRODUCTION" ]; then
    echo "❌ Deployment cancelled"
    echo "✅ Production is safe"
    exit 0
fi

echo ""
echo "📍 Current branch: $(git branch --show-current)"
echo ""

# Switch to main
echo "Switching to main branch..."
git checkout main

if [ $? -ne 0 ]; then
    echo "❌ Failed to switch to main branch"
    exit 1
fi

echo "✅ On main branch"
echo ""

# Pull latest
echo "Pulling latest main..."
git pull origin main

# Merge dev
echo ""
echo "Merging dev into main..."
git merge dev

if [ $? -ne 0 ]; then
    echo "❌ Merge failed - resolve conflicts"
    echo "After resolving, run:"
    echo "  git merge --continue"
    echo "  git push origin main"
    exit 1
fi

echo "✅ Merge successful"
echo ""

# Push to production
echo "🚀 Pushing to PRODUCTION..."
git push origin main

if [ $? -ne 0 ]; then
    echo "❌ Push failed"
    exit 1
fi

echo ""
echo "✅ Successfully deployed to PRODUCTION!"
echo ""
echo "🌍 Live URLs:"
echo "   Frontend: Your production domain"
echo "   Backend:  https://jason-coaching-backend-production.up.railway.app"
echo ""
echo "⏱  Deployment takes ~1-2 minutes"
echo ""

# Switch back to dev for safety
echo "Switching back to dev branch for safety..."
git checkout dev

echo ""
echo "✅ Back on dev branch (safe)"
echo "✅ Production deployment complete"
echo ""


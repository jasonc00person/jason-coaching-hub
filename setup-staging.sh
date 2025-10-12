#!/bin/bash

# Staging Environment Setup Script
# This creates your dev branch and guides you through the setup

echo "🚀 Setting up Staging Environment"
echo "=================================="
echo ""

# Check if we're in a git repo
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo "❌ Error: Not a git repository"
    exit 1
fi

# Check current branch
CURRENT_BRANCH=$(git branch --show-current)
echo "📍 Current branch: $CURRENT_BRANCH"
echo ""

# Create dev branch if it doesn't exist
if git show-ref --verify --quiet refs/heads/dev; then
    echo "✅ Dev branch already exists"
else
    echo "📝 Creating dev branch..."
    git checkout -b dev
    echo "✅ Dev branch created"
fi

# Push dev branch to GitHub
echo ""
echo "📤 Pushing dev branch to GitHub..."
if git push origin dev 2>/dev/null; then
    echo "✅ Dev branch pushed to GitHub"
else
    echo "⚠️  Dev branch might already exist on GitHub (that's okay!)"
fi

# Switch to dev branch
git checkout dev

echo ""
echo "✅ Git setup complete!"
echo ""
echo "=================================="
echo "📋 Next Steps:"
echo "=================================="
echo ""
echo "1️⃣  RAILWAY - Create Staging Backend"
echo "   → Go to: https://railway.app/new"
echo "   → Name: jason-coaching-backend-staging"
echo "   → Connect to GitHub, select 'dev' branch"
echo "   → Copy environment variables from production:"
echo "     - OPENAI_API_KEY"
echo "     - JASON_VECTOR_STORE_ID"
echo "     - DEBUG_MODE=true"
echo ""
echo "2️⃣  RAILWAY - Configure Production Backend"
echo "   → Go to your production Railway project"
echo "   → Settings → Environment → ensure connected to 'main' branch"
echo ""
echo "3️⃣  VERCEL - Add Staging Environment Variables"
echo "   → Go to: https://vercel.com (your project → Settings → Environment Variables)"
echo "   → Add VITE_API_BASE for Preview environment"
echo "   → Value: https://YOUR-STAGING-BACKEND.railway.app/"
echo "   → Select 'Preview' environment only"
echo ""
echo "4️⃣  TEST IT"
echo "   → Make a small change to any file"
echo "   → Run: git add . && git commit -m 'test staging' && git push origin dev"
echo "   → Check Vercel dashboard for staging deployment"
echo "   → Open staging URL and test"
echo ""
echo "=================================="
echo "📚 Helpful Guides:"
echo "=================================="
echo "   → STAGING_SETUP_GUIDE.md - Full setup instructions"
echo "   → GIT_WORKFLOW.md - Daily git commands"
echo "   → ENVIRONMENT_VARIABLES.md - What variables to set where"
echo ""
echo "🎉 You're ready to go! Check the guides above for details."
echo ""


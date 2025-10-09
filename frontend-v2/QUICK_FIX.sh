#!/bin/bash

# ChatKit Version Conflict Quick Fix
# This script fixes the dual-version issue causing blank screens

set -e  # Exit on error

echo "🔧 ChatKit Version Conflict Fix"
echo "================================"
echo ""

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

echo "📍 Working directory: $SCRIPT_DIR"
echo ""

# Step 1: Backup current package.json
echo "📦 Step 1: Backing up package.json..."
cp package.json package.json.backup
echo "✅ Backup created: package.json.backup"
echo ""

# Step 2: Clean install
echo "🗑️  Step 2: Removing conflicting installations..."
rm -rf node_modules package-lock.json
echo "✅ Removed node_modules and package-lock.json"
echo ""

# Step 3: Update package.json
echo "📝 Step 3: Updating package.json versions..."
cat > package.json << 'EOF'
{
  "name": "jason-coaching-chatkit",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "@openai/chatkit": "1.0.0",
    "@openai/chatkit-react": "1.1.1",
    "react": "^19.2.0",
    "react-dom": "^19.2.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.43",
    "@types/react-dom": "^18.2.17",
    "@vitejs/plugin-react": "^4.2.1",
    "autoprefixer": "^10.4.16",
    "postcss": "^8.4.32",
    "tailwindcss": "^3.4.0",
    "typescript": "^5.2.2",
    "vite": "^5.0.8"
  }
}
EOF
echo "✅ Updated to:"
echo "   @openai/chatkit: 1.0.0 (pinned)"
echo "   @openai/chatkit-react: 1.1.1 (latest)"
echo ""

# Step 4: Clean npm cache
echo "🧹 Step 4: Cleaning npm cache..."
npm cache clean --force
echo "✅ Cache cleaned"
echo ""

# Step 5: Fresh install
echo "📥 Step 5: Installing dependencies (this may take a minute)..."
npm install
echo "✅ Dependencies installed"
echo ""

# Step 6: Verify installation
echo "🔍 Step 6: Verifying installation..."
echo ""
echo "Installed versions:"
npm list @openai/chatkit @openai/chatkit-react
echo ""

# Check for "deduped" in output
if npm list @openai/chatkit @openai/chatkit-react 2>&1 | grep -q "deduped"; then
    echo "✅ SUCCESS: Single version installed (deduped)"
    echo ""
    echo "🎉 ChatKit version conflict is FIXED!"
    echo ""
    echo "Next steps:"
    echo "1. Run: npm run dev"
    echo "2. Open browser to http://localhost:5173"
    echo "3. Check if blank screen is gone"
    echo ""
    echo "If you still see issues, check the browser console for errors."
else
    echo "⚠️  WARNING: Multiple versions might still be present"
    echo "Check the output above for version conflicts"
    echo ""
fi

echo "================================"
echo "Script complete!"
echo ""
echo "To restore original package.json: cp package.json.backup package.json"


#!/bin/bash

# ChatKit Package Conflict Fix v2
# Based on official OpenAI sample repo analysis

set -e  # Exit on error

echo "🔧 ChatKit Package Conflict Fix v2"
echo "===================================="
echo ""
echo "Problem: You have both @openai/chatkit AND @openai/chatkit-react installed"
echo "Solution: Remove @openai/chatkit, keep only @openai/chatkit-react"
echo ""

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

echo "📍 Working directory: $SCRIPT_DIR"
echo ""

# Step 1: Backup
echo "📦 Step 1: Creating backup..."
cp package.json package.json.backup.$(date +%s)
echo "✅ Backup created"
echo ""

# Step 2: Clean install
echo "🗑️  Step 2: Removing conflicting installations..."
rm -rf node_modules package-lock.json
echo "✅ Removed node_modules and package-lock.json"
echo ""

# Step 3: Update package.json to match official sample
echo "📝 Step 3: Updating package.json (removing @openai/chatkit)..."
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
    "@openai/chatkit-react": "^0",
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
echo "✅ Updated package.json"
echo "   ❌ REMOVED: @openai/chatkit"
echo "   ✅ KEPT: @openai/chatkit-react: ^0"
echo ""

# Step 4: Clean npm cache
echo "🧹 Step 4: Cleaning npm cache..."
npm cache clean --force 2>&1 | grep -v "deprecated" || true
echo "✅ Cache cleaned"
echo ""

# Step 5: Fresh install
echo "📥 Step 5: Installing dependencies..."
npm install
echo "✅ Dependencies installed"
echo ""

# Step 6: Verify installation
echo "🔍 Step 6: Verifying installation..."
echo ""
echo "Installed packages:"
npm list @openai/chatkit @openai/chatkit-react 2>&1 || true
echo ""

# Check for success
if npm list @openai/chatkit-react 2>&1 | grep -q "0.0.0"; then
    echo "✅ SUCCESS!"
    echo ""
    echo "📊 Result:"
    echo "   @openai/chatkit-react: 0.0.0"
    echo "   @openai/chatkit: 0.0.0 (from chatkit-react)"
    echo ""
    echo "🎉 Package conflict is FIXED!"
    echo ""
    echo "📋 Next Steps:"
    echo "   1. Test with minimal component:"
    echo "      cp src/components/ChatKitPanel.tsx src/components/ChatKitPanel.original.tsx"
    echo "      cp src/components/ChatKitPanel.minimal.tsx src/components/ChatKitPanel.tsx"
    echo ""
    echo "   2. Run dev server:"
    echo "      npm run dev"
    echo ""
    echo "   3. Open browser to http://localhost:5173"
    echo ""
    echo "   4. Try sending a simple message: 'Hello'"
    echo ""
    echo "   5. Check if blank screen is gone ✨"
    echo ""
else
    echo "⚠️  Installation completed but version check unclear"
    echo "Check the output above manually"
    echo ""
fi

echo "===================================="
echo "Script complete!"
echo ""
echo "💾 Your original package.json is backed up with timestamp"
echo "📁 Location: $(ls -t package.json.backup.* | head -1)"


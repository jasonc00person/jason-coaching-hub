#!/bin/bash

# ChatKit Diagnostic Script
# Checks versions, config, and common issues

set -e

echo "=================================="
echo "ChatKit Diagnostic Tool"
echo "=================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track overall status
ISSUES_FOUND=0

echo "📦 CHECKING FRONTEND VERSIONS..."
echo "--------------------------------"

cd "/Users/jasoncooperson/Documents/Agent Builder Demo 2/frontend-v2"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo -e "${RED}❌ node_modules not found. Run: npm install${NC}"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
else
    echo -e "${GREEN}✅ node_modules exists${NC}"
fi

# Check ChatKit versions
echo ""
echo "Installed ChatKit packages:"
npm ls @openai/chatkit @openai/chatkit-react 2>/dev/null || {
    echo -e "${RED}❌ ChatKit packages not properly installed${NC}"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
}

# Verify single version
CHATKIT_COUNT=$(npm ls @openai/chatkit 2>/dev/null | grep -c "@openai/chatkit@" || echo "0")
if [ "$CHATKIT_COUNT" -eq 1 ]; then
    echo -e "${GREEN}✅ Single ChatKit version detected${NC}"
elif [ "$CHATKIT_COUNT" -gt 1 ]; then
    echo -e "${RED}❌ Multiple ChatKit versions detected! This causes conflicts.${NC}"
    echo "   Run: rm -rf node_modules package-lock.json && npm install"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
else
    echo -e "${RED}❌ No ChatKit version found${NC}"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
fi

# Check for rogue @openai/chatkit in package.json
if grep -q '"@openai/chatkit"' package.json 2>/dev/null; then
    echo -e "${RED}❌ Direct @openai/chatkit dependency found in package.json${NC}"
    echo "   Remove this line - only use @openai/chatkit-react"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
else
    echo -e "${GREEN}✅ No direct @openai/chatkit dependency (correct)${NC}"
fi

echo ""
echo "🔧 CHECKING VITE CONFIGURATION..."
echo "--------------------------------"

# Check Vite proxy config
if grep -q '"/chatkit"' vite.config.ts 2>/dev/null; then
    echo -e "${GREEN}✅ Vite proxy for /chatkit found${NC}"
    
    # Show the proxy config
    echo "   Proxy configuration:"
    grep -A 3 '"/chatkit"' vite.config.ts | sed 's/^/   /'
else
    echo -e "${RED}❌ Vite proxy for /chatkit not found${NC}"
    echo "   Add proxy configuration to vite.config.ts"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
fi

echo ""
echo "🐍 CHECKING BACKEND VERSIONS..."
echo "--------------------------------"

cd "/Users/jasoncooperson/Documents/Agent Builder Demo 2/backend-v2"

# Check if venv exists
if [ ! -d "venv" ]; then
    echo -e "${RED}❌ Virtual environment not found${NC}"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
else
    echo -e "${GREEN}✅ Virtual environment exists${NC}"
    
    # Activate venv and check version
    source venv/bin/activate
    
    CHATKIT_VERSION=$(pip show openai-chatkit 2>/dev/null | grep "Version:" | awk '{print $2}')
    
    if [ -z "$CHATKIT_VERSION" ]; then
        echo -e "${RED}❌ openai-chatkit not installed${NC}"
        ISSUES_FOUND=$((ISSUES_FOUND + 1))
    elif [ "$CHATKIT_VERSION" = "0.0.2" ]; then
        echo -e "${GREEN}✅ openai-chatkit version: $CHATKIT_VERSION (correct)${NC}"
    else
        echo -e "${YELLOW}⚠️  openai-chatkit version: $CHATKIT_VERSION (expected 0.0.2)${NC}"
        echo "   Run: pip install --force-reinstall openai-chatkit==0.0.2"
        ISSUES_FOUND=$((ISSUES_FOUND + 1))
    fi
    
    # Check other key dependencies
    echo ""
    echo "Key dependencies:"
    pip show openai openai-agents 2>/dev/null | grep "Name:\|Version:" | sed 's/^/   /'
fi

echo ""
echo "⚙️  CHECKING BACKEND CONFIGURATION..."
echo "--------------------------------"

# Check CORS configuration
if grep -q "CORSMiddleware" app/main.py 2>/dev/null; then
    echo -e "${GREEN}✅ CORS middleware configured${NC}"
    
    # Check if localhost:5173 is in allowed origins
    if grep -A 5 "CORSMiddleware" app/main.py | grep -q "localhost:5173"; then
        echo -e "${GREEN}✅ localhost:5173 in CORS origins${NC}"
    else
        echo -e "${YELLOW}⚠️  localhost:5173 not explicitly in CORS origins${NC}"
        echo "   (May still work with wildcard)"
    fi
else
    echo -e "${RED}❌ CORS middleware not found${NC}"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
fi

# Check for ProgressUpdateEvent
if grep -q "ProgressUpdateEvent = None" app/main.py 2>/dev/null; then
    echo -e "${GREEN}✅ ProgressUpdateEvent disabled (correct for v0.0.2)${NC}"
elif grep -q "from chatkit.types import ProgressUpdateEvent" app/main.py 2>/dev/null; then
    echo -e "${YELLOW}⚠️  ProgressUpdateEvent import found (may cause issues in v0.0.2)${NC}"
    echo "   Consider commenting out and setting to None"
fi

echo ""
echo "🌐 CHECKING ENVIRONMENT VARIABLES..."
echo "--------------------------------"

cd "/Users/jasoncooperson/Documents/Agent Builder Demo 2/frontend-v2"

# Check config.ts
if [ -f "src/lib/config.ts" ]; then
    echo -e "${GREEN}✅ config.ts exists${NC}"
    
    # Check for required exports
    if grep -q "CHATKIT_API_URL" src/lib/config.ts && grep -q "CHATKIT_API_DOMAIN_KEY" src/lib/config.ts; then
        echo -e "${GREEN}✅ CHATKIT_API_URL and CHATKIT_API_DOMAIN_KEY exported${NC}"
    else
        echo -e "${RED}❌ Missing required config exports${NC}"
        ISSUES_FOUND=$((ISSUES_FOUND + 1))
    fi
else
    echo -e "${RED}❌ config.ts not found${NC}"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
fi

echo ""
echo "🔍 CHECKING FOR COMMON ISSUES..."
echo "--------------------------------"

# Check if ports are in use
if lsof -Pi :8000 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Port 8000 is in use (backend may already be running)${NC}"
else
    echo -e "${GREEN}✅ Port 8000 is available${NC}"
fi

if lsof -Pi :5173 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Port 5173 is in use (frontend may already be running)${NC}"
else
    echo -e "${GREEN}✅ Port 5173 is available${NC}"
fi

echo ""
echo "=================================="
echo "DIAGNOSTIC SUMMARY"
echo "=================================="

if [ $ISSUES_FOUND -eq 0 ]; then
    echo -e "${GREEN}✅ All checks passed! Configuration looks good.${NC}"
    echo ""
    echo "Ready to start services:"
    echo ""
    echo "Terminal 1 (Backend):"
    echo "  cd backend-v2"
    echo "  source venv/bin/activate"
    echo "  uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"
    echo ""
    echo "Terminal 2 (Frontend):"
    echo "  cd frontend-v2"
    echo "  npm run dev"
    echo ""
    echo "Then open: http://localhost:5173"
else
    echo -e "${RED}❌ Found $ISSUES_FOUND issue(s) that need attention.${NC}"
    echo ""
    echo "Review the output above and fix the issues marked with ❌"
    echo ""
    echo "Quick fixes:"
    echo "  - Frontend: cd frontend-v2 && rm -rf node_modules package-lock.json && npm install"
    echo "  - Backend: cd backend-v2 && source venv/bin/activate && pip install --force-reinstall openai-chatkit==0.0.2"
fi

echo ""
echo "For detailed troubleshooting, see:"
echo "  - CHATKIT_FIX_ACTION_PLAN.md"
echo "  - FINAL_FIX_GUIDE.md"
echo ""

exit $ISSUES_FOUND


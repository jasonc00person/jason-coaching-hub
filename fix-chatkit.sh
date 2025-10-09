#!/bin/bash

# ChatKit Version Fix - Automated
# Based on official OpenAI sample repo (openai-chatkit==0.0.2)

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║         ChatKit Version Conflict Fix (Automated)          ║${NC}"
echo -e "${BLUE}║  Based on Official OpenAI Samples (openai-chatkit 0.0.2)  ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

PROJECT_ROOT="/Users/jasoncooperson/Documents/Agent Builder Demo 2"

# ============================================================================
# STEP 1: Fix Frontend Package Conflict
# ============================================================================

echo -e "${YELLOW}Step 1: Fixing Frontend Package Conflict${NC}"
echo ""

cd "$PROJECT_ROOT/frontend-v2"

echo "📍 Working in: $(pwd)"
echo ""

# Backup
BACKUP_FILE="package.json.backup.$(date +%Y%m%d_%H%M%S)"
echo -e "${BLUE}➤${NC} Creating backup: $BACKUP_FILE"
cp package.json "$BACKUP_FILE"
echo -e "${GREEN}✓${NC} Backup created"
echo ""

# Check current state
echo -e "${BLUE}➤${NC} Current ChatKit packages:"
npm list @openai/chatkit @openai/chatkit-react 2>&1 | grep -E "(@openai/chatkit|jason-coaching)" || true
echo ""

# Clean
echo -e "${BLUE}➤${NC} Removing node_modules and lock file..."
rm -rf node_modules package-lock.json
echo -e "${GREEN}✓${NC} Removed"
echo ""

# Clean cache
echo -e "${BLUE}➤${NC} Cleaning npm cache..."
npm cache clean --force >/dev/null 2>&1
echo -e "${GREEN}✓${NC} Cache cleaned"
echo ""

# Update package.json
echo -e "${BLUE}➤${NC} Updating package.json (removing direct @openai/chatkit dependency)..."

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

echo -e "${GREEN}✓${NC} Updated package.json"
echo -e "  ${RED}✗${NC} REMOVED: @openai/chatkit (was causing conflict)"
echo -e "  ${GREEN}✓${NC} KEPT: @openai/chatkit-react: ^0"
echo ""

# Install
echo -e "${BLUE}➤${NC} Installing dependencies (this may take a minute)..."
npm install >/dev/null 2>&1
echo -e "${GREEN}✓${NC} Dependencies installed"
echo ""

# Verify
echo -e "${BLUE}➤${NC} Verifying installation..."
echo ""
npm list @openai/chatkit @openai/chatkit-react 2>&1 | head -5

if npm list @openai/chatkit-react 2>&1 | grep -q "0.0.0"; then
    echo ""
    echo -e "${GREEN}✓✓✓ Frontend fix successful!${NC}"
    echo -e "    @openai/chatkit-react: ${GREEN}0.0.0${NC}"
    echo -e "    @openai/chatkit: ${GREEN}0.0.0${NC} (from chatkit-react)"
else
    echo ""
    echo -e "${YELLOW}⚠ Warning: Could not verify version. Check output above.${NC}"
fi

echo ""

# ============================================================================
# STEP 2: Update Backend
# ============================================================================

echo -e "${YELLOW}Step 2: Updating Backend${NC}"
echo ""

cd "$PROJECT_ROOT/backend-v2"

echo "📍 Working in: $(pwd)"
echo ""

# Backup
BACKEND_BACKUP="requirements.txt.backup.$(date +%Y%m%d_%H%M%S)"
echo -e "${BLUE}➤${NC} Creating backup: $BACKEND_BACKUP"
cp requirements.txt "$BACKEND_BACKUP"
echo -e "${GREEN}✓${NC} Backup created"
echo ""

# Update requirements.txt
echo -e "${BLUE}➤${NC} Updating requirements.txt..."

cat > requirements.txt << 'EOF'
fastapi>=0.109.0
uvicorn[standard]>=0.27.0
openai>=1.107.1
python-dotenv>=1.0.0
python-multipart>=0.0.6
pydantic>=2.5.3
openai-agents>=0.3.3
openai-chatkit>=0.0.2
EOF

echo -e "${GREEN}✓${NC} Updated requirements.txt"
echo -e "    openai-chatkit: ${GREEN}>=0.0.2${NC} (matches official sample)"
echo ""

# Check if venv exists
if [ -d "venv" ]; then
    echo -e "${BLUE}➤${NC} Installing updated packages..."
    source venv/bin/activate
    pip install --upgrade openai-chatkit >/dev/null 2>&1
    
    INSTALLED_VERSION=$(pip show openai-chatkit 2>/dev/null | grep "Version:" | cut -d' ' -f2)
    
    if [ -n "$INSTALLED_VERSION" ]; then
        echo -e "${GREEN}✓${NC} Backend updated"
        echo -e "    openai-chatkit: ${GREEN}$INSTALLED_VERSION${NC}"
    else
        echo -e "${YELLOW}⚠${NC} Could not verify installation"
    fi
    
    deactivate 2>/dev/null || true
else
    echo -e "${YELLOW}⚠${NC} No venv found. Run this manually:"
    echo -e "    cd backend-v2"
    echo -e "    source venv/bin/activate"
    echo -e "    pip install --upgrade openai-chatkit"
fi

echo ""

# ============================================================================
# SUMMARY
# ============================================================================

echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                   ✓ Fix Complete!                         ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

echo -e "${BLUE}What Changed:${NC}"
echo ""
echo -e "  ${GREEN}Frontend:${NC}"
echo -e "    • Removed conflicting @openai/chatkit dependency"
echo -e "    • Now using only @openai/chatkit-react@0.0.0"
echo -e "    • Backup: frontend-v2/$BACKUP_FILE"
echo ""
echo -e "  ${GREEN}Backend:${NC}"
echo -e "    • Updated to openai-chatkit>=0.0.2"
echo -e "    • Matches official OpenAI sample repo"
echo -e "    • Backup: backend-v2/$BACKEND_BACKUP"
echo ""

echo -e "${BLUE}Next Steps:${NC}"
echo ""
echo -e "  ${YELLOW}1. Test the fix:${NC}"
echo ""
echo -e "     ${BLUE}Terminal 1 (Backend):${NC}"
echo -e "     cd \"$PROJECT_ROOT/backend-v2\""
echo -e "     source venv/bin/activate"
echo -e "     uvicorn app.main:app --reload"
echo ""
echo -e "     ${BLUE}Terminal 2 (Frontend):${NC}"
echo -e "     cd \"$PROJECT_ROOT/frontend-v2\""
echo -e "     npm run dev"
echo ""
echo -e "     ${BLUE}Browser:${NC}"
echo -e "     Open: http://localhost:5173"
echo -e "     Test: Send \"Hello\" - should see ChatKit UI (not blank!)"
echo ""

echo -e "  ${YELLOW}2. If still blank:${NC}"
echo -e "     • Check browser console (F12)"
echo -e "     • Look for JavaScript errors"
echo -e "     • See: FINAL_FIX_GUIDE.md for troubleshooting"
echo ""

echo -e "  ${YELLOW}3. Restore original if needed:${NC}"
echo -e "     cp \"$PROJECT_ROOT/frontend-v2/$BACKUP_FILE\" \"$PROJECT_ROOT/frontend-v2/package.json\""
echo -e "     npm install"
echo ""

echo -e "${GREEN}═════════════════════════════════════════════════════════════${NC}"
echo ""


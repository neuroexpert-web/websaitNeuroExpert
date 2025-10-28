#!/bin/bash

echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║         PRE-DEPLOY CHECK - CRITICAL FIX VALIDATION           ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

ERRORS=0
WARNINGS=0

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print status
check_pass() {
    echo -e "${GREEN}✅${NC} $1"
}

check_fail() {
    echo -e "${RED}❌${NC} $1"
    ERRORS=$((ERRORS+1))
}

check_warn() {
    echo -e "${YELLOW}⚠️${NC}  $1"
    WARNINGS=$((WARNINGS+1))
}

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1. FILE STRUCTURE CHECKS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check critical files
if [ -f "frontend/vercel.json" ]; then
    check_pass "frontend/vercel.json exists"
else
    check_fail "frontend/vercel.json missing"
fi

if [ -f "frontend/api/main.py" ]; then
    check_pass "frontend/api/main.py exists"
else
    check_fail "frontend/api/main.py missing"
fi

if [ -f "frontend/src/utils/api.js" ]; then
    check_pass "frontend/src/utils/api.js exists"
else
    check_fail "frontend/src/utils/api.js missing"
fi

if [ -f "frontend/src/components/HeroVideo.jsx" ]; then
    check_pass "frontend/src/components/HeroVideo.jsx exists"
else
    check_warn "frontend/src/components/HeroVideo.jsx missing (optional)"
fi

# Check old vercel.json is deleted
if [ ! -f "frontend/api/vercel.json" ]; then
    check_pass "frontend/api/vercel.json removed (no conflict)"
else
    check_fail "frontend/api/vercel.json still exists (will conflict)"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "2. CONFIGURATION VALIDATION"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check requirements.txt
REQ_LINES=$(wc -l < frontend/api/requirements.txt)
if [ "$REQ_LINES" -le 20 ]; then
    check_pass "requirements.txt simplified ($REQ_LINES lines)"
else
    check_warn "requirements.txt has $REQ_LINES lines (expected ≤20)"
fi

# Check vercel.json syntax
if cat frontend/vercel.json | python3 -m json.tool > /dev/null 2>&1; then
    check_pass "vercel.json is valid JSON"
else
    check_fail "vercel.json has invalid JSON syntax"
fi

# Check for GENERATE_SOURCEMAP
if grep -q "GENERATE_SOURCEMAP=false" frontend/package.json; then
    check_pass "Build optimization enabled (GENERATE_SOURCEMAP=false)"
else
    check_warn "GENERATE_SOURCEMAP=false not found in package.json"
fi

# Check tailwind.config.js for screens
if grep -q "screens:" frontend/tailwind.config.js; then
    check_pass "Tailwind responsive breakpoints configured"
else
    check_warn "Tailwind screens configuration not found"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "3. CODE QUALITY CHECKS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Python syntax check
if python3 -m py_compile frontend/api/main.py 2>/dev/null; then
    check_pass "main.py has valid Python syntax"
else
    check_fail "main.py has syntax errors"
fi

# Check for lazy loading in App.js
if grep -q "lazy.*Suspense" frontend/src/App.js; then
    check_pass "Lazy loading implemented in App.js"
else
    check_warn "Lazy loading not detected in App.js"
fi

# Check for analytics initialization
if grep -q "initAnalytics" frontend/src/index.js; then
    check_pass "Silent analytics initialization added"
else
    check_warn "Analytics initialization not found in index.js"
fi

# Check components use centralized API
API_IMPORTS=0
if grep -q "import api from.*utils/api" frontend/src/components/ContactForm.jsx; then
    check_pass "ContactForm uses centralized API client"
    API_IMPORTS=$((API_IMPORTS+1))
fi

if grep -q "import api from.*utils/api" frontend/src/components/AIChat.jsx; then
    check_pass "AIChat uses centralized API client"
    API_IMPORTS=$((API_IMPORTS+1))
fi

if grep -q "import api from.*utils/api" frontend/src/components/ServiceCards.jsx; then
    check_pass "ServiceCards uses centralized API client"
    API_IMPORTS=$((API_IMPORTS+1))
fi

if [ $API_IMPORTS -ge 2 ]; then
    check_pass "Multiple components using api.js ($API_IMPORTS/3)"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "4. DOCUMENTATION CHECKS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ -f "CRITICAL_FIX_SUMMARY.md" ]; then
    check_pass "CRITICAL_FIX_SUMMARY.md exists"
else
    check_warn "CRITICAL_FIX_SUMMARY.md not found"
fi

if [ -f "DEPLOY_GUIDE.md" ]; then
    check_pass "DEPLOY_GUIDE.md exists"
else
    check_warn "DEPLOY_GUIDE.md not found"
fi

if [ -f "CHANGES.md" ]; then
    check_pass "CHANGES.md exists"
else
    check_warn "CHANGES.md not found"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "5. GIT STATUS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

MODIFIED=$(git status --porcelain | grep "^ M" | wc -l)
ADDED=$(git status --porcelain | grep "^??" | wc -l)
DELETED=$(git status --porcelain | grep "^ D" | wc -l)

echo "Modified files: $MODIFIED"
echo "New files: $ADDED"
echo "Deleted files: $DELETED"

if [ $MODIFIED -gt 0 ] || [ $ADDED -gt 0 ] || [ $DELETED -gt 0 ]; then
    check_pass "Changes detected and ready to commit"
else
    check_warn "No changes to commit"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "SUMMARY"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo ""
if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✅ ALL CHECKS PASSED!${NC}"
    echo ""
    echo "Ready to commit and deploy:"
    echo ""
    echo "  git add ."
    echo "  git commit -m \"Critical fix: Deploy + AI + Video + Form + Performance\""
    echo "  git push origin hotfix/critical-deploy-ai-chat-video-form-performance"
    echo ""
    echo "Then deploy to Vercel:"
    echo "  cd frontend && vercel --prod"
    echo ""
    exit 0
else
    echo -e "${RED}❌ FOUND $ERRORS CRITICAL ISSUE(S)${NC}"
    echo ""
    echo "Please fix the errors above before deploying."
    exit 1
fi

if [ $WARNINGS -gt 0 ]; then
    echo -e "${YELLOW}⚠️  $WARNINGS warning(s) - review recommended but not blocking${NC}"
fi

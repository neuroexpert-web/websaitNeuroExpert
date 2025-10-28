#!/bin/bash
# Simple health check script for NeuroExpert API

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Default URL (can be overridden)
API_URL="${API_URL:-http://localhost:8000}"

echo "==========================================="
echo "  NeuroExpert API Health Check"
echo "==========================================="
echo "Testing: $API_URL"
echo ""

# Test 1: Health Check Endpoint
echo -e "${YELLOW}Test 1: Health Check Endpoint${NC}"
HEALTH_RESPONSE=$(curl -s -w "\n%{http_code}" "$API_URL/api/health")
HTTP_CODE=$(echo "$HEALTH_RESPONSE" | tail -n 1)
BODY=$(echo "$HEALTH_RESPONSE" | head -n -1)

if [ "$HTTP_CODE" == "200" ]; then
    echo -e "${GREEN}✓ Health check returned 200 OK${NC}"
    echo "Response: $BODY"
else
    echo -e "${RED}✗ Health check failed with status $HTTP_CODE${NC}"
    echo "Response: $BODY"
    exit 1
fi

echo ""

# Test 2: Root API Endpoint  
echo -e "${YELLOW}Test 2: Root API Endpoint${NC}"
ROOT_RESPONSE=$(curl -s -w "\n%{http_code}" "$API_URL/api/")
HTTP_CODE=$(echo "$ROOT_RESPONSE" | tail -n 1)
BODY=$(echo "$ROOT_RESPONSE" | head -n -1)

if [ "$HTTP_CODE" == "200" ]; then
    echo -e "${GREEN}✓ Root endpoint returned 200 OK${NC}"
    echo "Response: $BODY"
else
    echo -e "${RED}✗ Root endpoint failed with status $HTTP_CODE${NC}"
    echo "Response: $BODY"
fi

echo ""
echo -e "${GREEN}==========================================="
echo "  Health Check Complete"
echo "===========================================${NC}"

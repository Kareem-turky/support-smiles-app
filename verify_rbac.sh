#!/bin/bash

# Configuration
API_URL="http://localhost:3000"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'
BLUE='\033[0;34m'

echo "---------------------------------------------------"
echo "VERIFYING ROLE-BASED ACCESS CONTROL (RBAC)"
echo "---------------------------------------------------"

# Helper to get token
get_token() {
    EMAIL=$1
    PASS=$2
    ROLE=$3
    echo -n "Logging in as $ROLE ($EMAIL)... "
    TOKEN=$(curl -s -X POST "$API_URL/auth/login" \
      -H "Content-Type: application/json" \
      -d "{\"email\": \"$EMAIL\", \"password\": \"$PASS\"}" | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)
    
    if [ -z "$TOKEN" ]; then
        echo -e "${RED}FAIL${NC}"
        return 1
    else
        echo -e "${GREEN}SUCCESS${NC}"
        echo "$TOKEN"
    fi
}

# Helper to check access
check_access() {
    TOKEN=$1
    ROLE=$2
    ENDPOINT=$3
    EXPECTED_STATUS=$4
    METHOD=${5:-GET}
    
    RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -X $METHOD "$API_URL$ENDPOINT" \
      -H "Authorization: Bearer $TOKEN")
      
    if [ "$RESPONSE" == "$EXPECTED_STATUS" ]; then
        echo -e "  [${GREEN}PASS${NC}] $ROLE -> $METHOD $ENDPOINT (Got $RESPONSE)"
    else
        echo -e "  [${RED}FAIL${NC}] $ROLE -> $METHOD $ENDPOINT (Expected $EXPECTED_STATUS, Got $RESPONSE)"
    fi
}

# 1. Get Tokens
ADMIN_TOKEN=$(get_token "admin@company.com" "admin123" "ADMIN")
ACC_TOKEN=$(get_token "sarah@company.com" "accounting123" "ACC_MANAGER")
CS_TOKEN=$(get_token "mike@company.com" "cs123" "CS_MANAGER")

echo ""
echo "---------------------------------------------------"
echo "VERIFYING ADMIN ACCESS (Should have access to everything)"
echo "---------------------------------------------------"
if [ ! -z "$ADMIN_TOKEN" ]; then
    check_access "$ADMIN_TOKEN" "ADMIN" "/hr/employees" "200"
    check_access "$ADMIN_TOKEN" "ADMIN" "/accounting/purchases" "200"
    check_access "$ADMIN_TOKEN" "ADMIN" "/shipping/companies" "200"
fi

echo ""
echo "---------------------------------------------------"
echo "VERIFYING ACCOUNTING ACCESS"
echo "---------------------------------------------------"
if [ ! -z "$ACC_TOKEN" ]; then
    # Allowed
    check_access "$ACC_TOKEN" "ACC_MANAGER" "/accounting/purchases" "200"
    check_access "$ACC_TOKEN" "ACC_MANAGER" "/accounting/deposits" "200"
    
    # Denied
    check_access "$ACC_TOKEN" "ACC_MANAGER" "/hr/employees" "403"
    check_access "$ACC_TOKEN" "ACC_MANAGER" "/shipping/companies" "403"
fi

echo ""
echo "---------------------------------------------------"
echo "VERIFYING CS ACCESS"
echo "---------------------------------------------------"
if [ ! -z "$CS_TOKEN" ]; then
    # Allowed
    check_access "$CS_TOKEN" "CS_MANAGER" "/tickets" "200"
    
    # Denied
    check_access "$CS_TOKEN" "CS_MANAGER" "/accounting/purchases" "403"
    check_access "$CS_TOKEN" "CS_MANAGER" "/hr/employees" "403"
fi

echo ""
echo "---------------------------------------------------"
echo "RBAC VERIFICATION COMPLETE"
echo "---------------------------------------------------"

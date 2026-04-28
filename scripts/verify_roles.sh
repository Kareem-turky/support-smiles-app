#!/bin/bash
set -e

# Hard Proof: Unified Roles Verification Script
# Verifies RBAC roles, assignments, and KPI cross-department scoping bounds.

API_URL="http://localhost:3000"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

echo "======================================"
echo "RUNNING UNIFIED ROLE HIERARCHY TEST"
echo "======================================"

# 1. Login Admin
echo -e "\n1) Logging in as ADMIN (admin@company.com)..."
ADMIN_RES=$(curl -s -X POST $API_URL/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@company.com","password":"admin123"}')
ADMIN_TOKEN=$(echo $ADMIN_RES | python3 -c "import sys, json; print(json.load(sys.stdin).get('data', {}).get('access_token', 'null'))")
ADMIN_ROLE=$(echo $ADMIN_RES | python3 -c "import sys, json; print(json.load(sys.stdin).get('data', {}).get('user', {}).get('role', 'null'))")

if [ "$ADMIN_TOKEN" == "null" ] || [ -z "$ADMIN_TOKEN" ]; then
    echo -e "${RED}FAIL: Admin Login${NC}"
    exit 1
fi
echo -e "${GREEN}PASS${NC}"
echo "Admin Profile Role: $ADMIN_ROLE"

# 2. Login Accounting Manager
echo -e "\n2) Logging in as ACC_MANAGER (sarah@company.com)..."
ACC_RES=$(curl -s -X POST $API_URL/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"sarah@company.com","password":"password123"}')
ACC_TOKEN=$(echo $ACC_RES | python3 -c "import sys, json; print(json.load(sys.stdin).get('data', {}).get('access_token', 'null'))")
ACC_ROLE=$(echo $ACC_RES | python3 -c "import sys, json; print(json.load(sys.stdin).get('data', {}).get('user', {}).get('role', 'null'))")

if [ "$ACC_TOKEN" == "null" ] || [ -z "$ACC_TOKEN" ]; then
    echo -e "${RED}FAIL: Accounting Manager Login${NC}"
    exit 1
fi
echo -e "${GREEN}PASS${NC}"
echo "Accounting Profile Role: $ACC_ROLE"

if [ "$ACC_ROLE" != "ACC_MANAGER" ]; then
    echo -e "${RED}FAIL: Role is not ACC_MANAGER${NC}"
    exit 1
fi

# 3. Login CS Manager
echo -e "\n3) Logging in as CS_MANAGER (mike@company.com)..."
CS_RES=$(curl -s -X POST $API_URL/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"mike@company.com","password":"password123"}')
CS_TOKEN=$(echo $CS_RES | python3 -c "import sys, json; print(json.load(sys.stdin).get('data', {}).get('access_token', 'null'))")

if [ "$CS_TOKEN" == "null" ] || [ -z "$CS_TOKEN" ]; then
    echo -e "${RED}FAIL: CS Manager Login${NC}"
    exit 1
fi
echo -e "${GREEN}PASS${NC}"

# 4. KPI Isolation Logic Check
# Fetch Alice CS Agent and Sarah ACC_MANAGER IDs
USERS_RES=$(curl -s -X GET $API_URL/users -H "Authorization: Bearer $ADMIN_TOKEN")
echo -e "\n4a) Simulating CS_MANAGER creating KPI target for Alice (CS_AGENT)..."
KPI_CS_RES=$(curl -s -w "\n%{http_code}" -X POST $API_URL/kpi/targets \
  -H "Authorization: Bearer $CS_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"employee_code\":\"EMP-ALICE\", \"metric\":\"Test Tickets\", \"targetValue\":50, \"weight\":100}")

HTTP_KPI_CS=$(echo "$KPI_CS_RES" | tail -n1)
if [ "$HTTP_KPI_CS" -eq 200 ] || [ "$HTTP_KPI_CS" -eq 201 ]; then
    echo -e "${GREEN}PASS: CS_MANAGER successfully evaluated CS_AGENT native boundaries!${NC}"
else
    echo -e "${RED}FAIL: Could not assign local KPI! Status: $HTTP_KPI_CS${NC}"
    exit 1
fi

echo -e "\n4b) Simulating CS_MANAGER creating KPI target for Sarah (ACC_MANAGER)..."
KPI_ACC_RES=$(curl -s -w "\n%{http_code}" -X POST $API_URL/kpi/targets \
  -H "Authorization: Bearer $CS_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"employee_code\":\"EMP-SARAH\", \"metric\":\"Test Accounting\", \"targetValue\":10, \"weight\":100}")

HTTP_KPI_ACC=$(echo "$KPI_ACC_RES" | tail -n1)
if [ "$HTTP_KPI_ACC" -eq 403 ]; then
    echo -e "${GREEN}PASS: Access strictly Forbidden! (403)${NC}"
else
    echo -e "${RED}FAIL: Expected 403 Forbidden but received $HTTP_KPI_ACC${NC}"
    exit 1
fi

echo -e "\n======================================"
echo -e "${GREEN}ALL TESTS PASS. ROLE HIERARCHY IS ENFORCED SUCCESSFULLY.${NC}"
echo -e "======================================"

#!/bin/bash
# Phase 14 KPI & Gamification Verification Script
# This script verifies backend endpoints and data integrity

BASE_URL="http://localhost:3000"
ADMIN_EMAIL="admin@company.com"
ADMIN_PWD="admin123"

echo "--------------------------------------------------"
echo " TMS Phase 14 System Verification"
echo "--------------------------------------------------"

# 1. Login
echo -n "Authenticating as $ADMIN_EMAIL... "
LOGIN_RES=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PWD\"}")

TOKEN=$(echo $LOGIN_RES | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
    echo "FAILED"
    echo "Response: $LOGIN_RES"
    exit 1
fi
echo "SUCCESS"

# 2. Test KPI Endpoints
echo -e "\n[KPI System]"
echo -n "GET /kpi/my-stats: "
RES=$(curl -s -H "Authorization: Bearer $TOKEN" "$BASE_URL/kpi/my-stats")
if [[ $RES == *"metrics"* ]]; then echo "OK"; else echo "FAILED (Empty/Invalid): $RES"; fi

echo -n "GET /kpi/team-stats: "
RES=$(curl -s -H "Authorization: Bearer $TOKEN" "$BASE_URL/kpi/team-stats")
if [[ $RES == *"["* ]]; then echo "OK"; else echo "FAILED (Invalid JSON)"; fi

# 3. Test Gamification Endpoints
echo -e "\n[Gamification]"
echo -n "GET /gamification/my-progress: "
RES=$(curl -s -H "Authorization: Bearer $TOKEN" "$BASE_URL/gamification/my-progress")
if [[ $RES == *"points"* ]]; then echo "OK"; else echo "FAILED (Empty/Invalid)"; fi

echo -n "GET /gamification/leaderboard: "
RES=$(curl -s -H "Authorization: Bearer $TOKEN" "$BASE_URL/gamification/leaderboard")
if [[ $RES == *"["* ]]; then echo "OK"; else echo "FAILED (Invalid JSON)"; fi

# 4. Test Accounting Creation (Regression Check)
RAND_ID=$RANDOM
echo -e "\n[Accounting Regressions]"
echo -n "POST /accounting/vendors (Create Vendor): "
RES=$(curl -s -X POST "$BASE_URL/accounting/vendors" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"vendor_name\":\"Verify Script Vendor $RAND_ID\",\"phone\":\"555-0199\"}")
if [[ $RES == *"Verify Script Vendor"* ]]; then echo "OK"; else echo "FAILED: $RES"; fi

# 5. Test HR Creation
echo -e "\n[HR Regressions]"
echo -n "GET /hr/departments: "
DEPT_RES=$(curl -s -H "Authorization: Bearer $TOKEN" "$BASE_URL/hr/departments")
DEPT_ID=$(echo $DEPT_RES | grep -o '"id":"[^"]*' | head -n 1 | cut -d'"' -f4)
if [ -z "$DEPT_ID" ]; then echo "FAILED to find Dept"; else echo "OK (ID: $DEPT_ID)"; fi

echo -e "\n--------------------------------------------------"
echo " Verification Complete"
echo "--------------------------------------------------"

#!/bin/bash

# Configuration
API_URL="http://localhost:3000"
ADMIN_EMAIL="admin@company.com"
ADMIN_PASSWORD="admin123"
MANAGER_EMAIL="mike@company.com" # CS Manager
MANAGER_PASSWORD="cs123"
ACCOUNTANT_EMAIL="sarah@company.com"
ACCOUNTANT_PASSWORD="accounting123"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Helper Functions
login() {
  local email=$1
  local password=$2
  echo "Logging in as $email..." >&2
  local response=$(curl -s -X POST "$API_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$email\", \"password\":\"$password\"}")
  
  if [[ $response == *"access_token"* ]]; then
    echo $response | grep -o '"access_token":"[^"]*' | cut -d'"' -f4
  else
    echo "Login failed" >&2
    echo $response >&2
    exit 1
  fi
}

echo "---------------------------------------------------"
echo "VERIFYING DASHBOARDS"
echo "---------------------------------------------------"

# 1. Test Manager Team Stats
echo ""
echo "[TEST] CS Manager checking Team Stats..."
TOKEN=$(login "$MANAGER_EMAIL" "$MANAGER_PASSWORD")
STATS=$(curl -s -X GET "$API_URL/kpi/team-stats" -H "Authorization: Bearer $TOKEN")

if [[ $STATS == *"score"* ]]; then
  echo -e "${GREEN}[PASS] Team Stats retrieved${NC}"
  echo "Sample: $(echo $STATS | cut -c 1-100)..."
else
  echo -e "${RED}[FAIL] Failed to retrieve Team Stats${NC}"
  echo "Response: $STATS"
fi

# 2. Test Accounting Stats
echo ""
echo "[TEST] Accountant checking Financial Stats..."
TOKEN=$(login "$ACCOUNTANT_EMAIL" "$ACCOUNTANT_PASSWORD")
STATS=$(curl -s -X GET "$API_URL/accounting/stats" -H "Authorization: Bearer $TOKEN")

if [[ $STATS == *"netProfit"* ]]; then
  echo -e "${GREEN}[PASS] Financial Stats retrieved${NC}"
  echo "Net Profit: $(echo $STATS | grep -o '"netProfit":[^,]*')"
else
  echo -e "${RED}[FAIL] Failed to retrieve Financial Stats${NC}"
  echo "Response: $STATS"
fi

# 3. Test Dashboard Summary (Admin)
echo ""
echo "[TEST] Admin checking Dashboard Summary..."
TOKEN=$(login "$ADMIN_EMAIL" "$ADMIN_PASSWORD")
SUMMARY=$(curl -s -X GET "$API_URL/dashboard/summary" -H "Authorization: Bearer $TOKEN")

if [[ $SUMMARY == *"gamification"* ]]; then
  echo -e "${GREEN}[PASS] Dashboard Summary retrieved${NC}"
  echo "Gamification Leaderboard: $(echo $SUMMARY | grep -o '"leaderboard":\[[^]]*\]')"
else
  echo -e "${RED}[FAIL] Failed to retrieve Dashboard Summary${NC}"
  echo "Response: $SUMMARY"
fi

echo "---------------------------------------------------"
echo "DASHBOARD VERIFICATION COMPLETE"
echo "---------------------------------------------------"

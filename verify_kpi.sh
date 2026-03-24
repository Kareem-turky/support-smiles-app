#!/bin/bash

# Configuration
API_URL="http://localhost:3000"
ADMIN_EMAIL="admin@company.com"
ADMIN_PASSWORD="admin123"
AGENT_EMAIL="agent@company.com"
AGENT_PASSWORD="password123"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

# Helper function
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
echo "VERIFYING KPI SYSTEM"
echo "---------------------------------------------------"

# 1. Login
ADMIN_TOKEN=$(login $ADMIN_EMAIL $ADMIN_PASSWORD)
AGENT_TOKEN=$(login $AGENT_EMAIL $AGENT_PASSWORD)

# 2. Check My Stats (Agent)
echo -e "\n[TEST] Agent checking my stats..."
STATS=$(curl -s -X GET "$API_URL/kpi/my-stats" -H "Authorization: Bearer $AGENT_TOKEN")
echo "Response: $STATS"

if [[ $STATS == *"final_score"* ]]; then
  echo -e "${GREEN}[PASS] Stats retrieved${NC}"
else
  echo -e "${RED}[FAIL] Failed to retrieve stats${NC}"
fi

# 3. Log Issue (Admin)
# Need Employee ID for Agent. I'll fetch it from stats or assume from seed?
# Seed doesn't create Employee record for "Agent", only "Admin" and "Accounting".
# Wait, seed creates "John Doe" (Admin) and "Jane Smith" (Accounting).
# "Alice Agent" has no Employee record in seed!
# I need to create an Employee record for Alice Agent first validation.
# Or I can test with Accounting User (Sarah) who has Employee "Jane Smith".

SARAH_EMAIL="sarah@company.com"
SARAH_PASSWORD="accounting123"
SARAH_TOKEN=$(login $SARAH_EMAIL $SARAH_PASSWORD)

echo -e "\n[TEST] Sarah (Accounting) checking stats (should have Employee record)..."
SARAH_STATS=$(curl -s -X GET "$API_URL/kpi/my-stats" -H "Authorization: Bearer $SARAH_TOKEN")
echo "Response: $SARAH_STATS"

# Get Employee ID from somewhere? Or just use known seeded ID?
# Seed: emp2 for Jane Smith (Sarah). emp2 ID is UUID.
# I can't guess it easily.
# But specific ID "EMP002" is code. ID is UUID.
# I'll just skip the Post Issue test automatically if I can't get ID, or I'll query employees list as Admin.

echo -e "\n[TEST] Admin fetching employees to get Sarah's Employee ID..."
EMPLOYEES=$(curl -s -X GET "$API_URL/hr/employees" -H "Authorization: Bearer $ADMIN_TOKEN")
SARAH_EMP_ID=$(echo $EMPLOYEES | grep -o '"id":"[^"]*","code":"EMP002"' | cut -d'"' -f4)

if [ -z "$SARAH_EMP_ID" ]; then
    echo -e "${RED}[FAIL] Could not find Sarah's Employee ID${NC}"
else
    echo "Found Sarah's Employee ID: $SARAH_EMP_ID"

    # Log Issue
    echo -e "\n[TEST] Admin logging issue for Sarah..."
    ISSUE_RES=$(curl -s -X POST "$API_URL/kpi/issues" \
      -H "Authorization: Bearer $ADMIN_TOKEN" \
      -H "Content-Type: application/json" \
      -d "{\"employeeId\":\"$SARAH_EMP_ID\", \"type\":\"Complaint\", \"description\":\"Rude behavior\", \"date\":\"$(date +%Y-%m-%d)\", \"severity\":\"MEDIUM\", \"deductionPoints\":10}")
    
    echo "Response: $ISSUE_RES"
    
    if [[ $ISSUE_RES == *"id"* ]]; then
        echo -e "${GREEN}[PASS] Issue logged${NC}"
    else
        echo -e "${RED}[FAIL] Failed to log issue${NC}"
    fi

    # Check stats again
    echo -e "\n[TEST] Sarah checking stats again (should see deduction)..."
    SARAH_STATS_2=$(curl -s -X GET "$API_URL/kpi/my-stats" -H "Authorization: Bearer $SARAH_TOKEN")
    echo "Response: $SARAH_STATS_2"
fi

echo "---------------------------------------------------"
echo "KPI VERIFICATION COMPLETE"
echo "---------------------------------------------------"

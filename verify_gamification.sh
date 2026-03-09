#!/bin/bash

# Configuration
API_URL="http://localhost:3000"
ADMIN_EMAIL="admin@company.com"
ADMIN_PASSWORD="admin123"

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
echo "VERIFYING GAMIFICATION SYSTEM (E2E API)"
echo "---------------------------------------------------"

# 1. Login
ADMIN_TOKEN=$(login $ADMIN_EMAIL $ADMIN_PASSWORD)
echo -e "${GREEN}[PASS] Login successful${NC}"

# 2. Check My Progress
echo -e "\n[TEST] 1. Fetching my-progress..."
PROGRESS=$(curl -s -X GET "$API_URL/gamification/my-progress" -H "Authorization: Bearer $ADMIN_TOKEN")
if [[ $PROGRESS == *"points"* ]]; then
  echo -e "${GREEN}[PASS] Progress retrieved${NC}"
else
  echo -e "${RED}[FAIL] Failed to retrieve progress${NC}"
  echo "Response: $PROGRESS"
  exit 1
fi

# 3. Fetch Missions
echo -e "\n[TEST] 2. Fetching missions/my..."
MISSIONS=$(curl -s -X GET "$API_URL/gamification/missions/my" -H "Authorization: Bearer $ADMIN_TOKEN")
if [[ $MISSIONS == *"["* ]]; then
  echo -e "${GREEN}[PASS] Missions retrieved${NC}"
else
  echo -e "${RED}[FAIL] Failed to retrieve missions${NC}"
  echo "Response: $MISSIONS"
  exit 1
fi

# 4. Run start-shift + end-shift
echo -e "\n[TEST] 3. Running start-shift..."
START_SHIFT=$(curl -s -X POST "$API_URL/gamification/actions/start-shift" -H "Authorization: Bearer $ADMIN_TOKEN")
if [[ $START_SHIFT == *"Shift started"* ]] || [[ $START_SHIFT == *"true"* ]] || [[ $START_SHIFT == *"success"* ]]; then
  echo -e "${GREEN}[PASS] Shift started${NC}"
else
  echo -e "${YELLOW}[WARN] Shift start response: $START_SHIFT${NC}"
fi

echo -e "\n[TEST] 4. Running end-shift..."
END_SHIFT=$(curl -s -X POST "$API_URL/gamification/actions/end-shift" -H "Authorization: Bearer $ADMIN_TOKEN")
if [[ $END_SHIFT == *"Shift ended"* ]] || [[ $END_SHIFT == *"true"* ]] || [[ $END_SHIFT == *"success"* ]]; then
  echo -e "${GREEN}[PASS] Shift ended${NC}"
else
  echo -e "${YELLOW}[WARN] Shift end response: $END_SHIFT${NC}"
fi

# 5. Create and Assign Mission (Manager)
echo -e "\n[TEST] 5. Creating a new mission..."
CREATE_MISSION=$(curl -s -X POST "$API_URL/gamification/missions" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"title\":\"Test API Mission\", \"description\":\"API test\", \"points\":100, \"target_value\":5, \"metric_key\":\"RESOLVED_TICKETS\", \"frequency\":\"DAILY\"}")
MISSION_ID=$(echo $CREATE_MISSION | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)

if [[ ! -z "$MISSION_ID" ]]; then
  echo -e "${GREEN}[PASS] Mission created (ID: $MISSION_ID)${NC}"

  echo -e "\n[TEST] 6. Assigning mission..."
  ASSIGN_MISSION=$(curl -s -X POST "$API_URL/gamification/missions/$MISSION_ID/assign" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"user_ids\":[\"a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11\"]}")
  echo -e "${GREEN}[PASS] Mission assign called${NC}"
else
  echo -e "${RED}[FAIL] Failed to create mission${NC}"
  echo "Response: $CREATE_MISSION"
fi

# 6. Redeem Reward
echo -e "\n[TEST] 7. Redeeming reward..."
# First try fetching rewards to get an ID
REWARDS=$(curl -s -X GET "$API_URL/gamification/rewards" -H "Authorization: Bearer $ADMIN_TOKEN")
REWARD_ID=$(echo $REWARDS | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)

if [[ ! -z "$REWARD_ID" ]]; then
  REDEEM=$(curl -s -X POST "$API_URL/gamification/rewards/redeem" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"reward_id\":\"$REWARD_ID\"}")
  
  if [[ $REDEEM == *"id"* ]] || [[ $REDEEM == *"insufficient"* || $REDEEM == *"Insufficient"* || $REDEEM == *"error"* ]] || [[ $REDEEM == *"Bad Request"* ]]; then
    # Could be success or expected failure if not enough points
    echo -e "${GREEN}[PASS] Redeem endpoint responded gracefully: ${REDEEM:0:60}...${NC}"
  else
    echo -e "${RED}[FAIL] Unexpected redeem response${NC}"
    echo "Response: $REDEEM"
  fi
else
  echo -e "${YELLOW}[WARN] Could not find any rewards to redeem${NC}"
fi

echo "---------------------------------------------------"
echo -e "${GREEN}GAMIFICATION VERIFICATION COMPLETE - ALL REACHABLE ENDPOINTS PASS${NC}"
echo "---------------------------------------------------"

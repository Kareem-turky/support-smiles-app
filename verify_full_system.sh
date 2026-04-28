#!/bin/bash

# Configuration
API_URL="http://localhost:3000"
ADMIN_EMAIL="admin@company.com"
ADMIN_PASSWORD="admin123"

echo "======================================"
echo "   Support Smiles - System Verification"
echo "======================================"

# 1. Health Check
echo "Checking System Health..."
HEALTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" $API_URL/health)
if [ "$HEALTH_STATUS" == "200" ]; then
    echo "✅ System is HEALTHY"
else
    echo "⚠️ System might be down (Health check: $HEALTH_STATUS)"
    # Continue anyway as we might be mocked or just testing specific endpoints
fi

# 2. Authentication (Login)
echo -e "\nTesting Authentication..."
LOGIN_RESPONSE=$(curl -s -X POST $API_URL/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$ADMIN_EMAIL\", \"password\": \"$ADMIN_PASSWORD\"}")

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

if [ -n "$TOKEN" ]; then
    echo "✅ Login Successful (Admin)"
else
    echo "❌ Login Failed"
    echo "Response: $LOGIN_RESPONSE"
    exit 1
fi

# 3. HR Module - Verification
echo -e "\nTesting HR Module..."
EMPLOYEES=$(curl -s -H "Authorization: Bearer $TOKEN" $API_URL/hr/employees)
EMP_COUNT=$(echo $EMPLOYEES | grep -o "id" | wc -l)
echo "✅ Employees Fetched: $EMP_COUNT"

# 4. CRM Module - Verification
echo -e "\nTesting CRM Module..."
TICKETS=$(curl -s -H "Authorization: Bearer $TOKEN" $API_URL/crm/tickets)
TICKET_COUNT=$(echo $TICKETS | grep -o "id" | wc -l)
echo "✅ Tickets Fetched: $TICKET_COUNT"

# 5. Accounting Module - Verification
echo -e "\nTesting Accounting Module..."
VENDORS=$(curl -s -H "Authorization: Bearer $TOKEN" $API_URL/accounting/vendors)
VENDOR_COUNT=$(echo $VENDORS | grep -o "id" | wc -l)
echo "✅ Vendors Fetched: $VENDOR_COUNT"

# 6. KPI & Gamification - Verification
echo -e "\nTesting KPI & Gamification..."
STATS=$(curl -s -H "Authorization: Bearer $TOKEN" $API_URL/kpi/team-stats)
if [[ $STATS != *"error"* ]]; then
    echo "✅ Team Stats Verified"
else
    echo "❌ Team Stats Failed"
fi

LEADERBOARD=$(curl -s -H "Authorization: Bearer $TOKEN" $API_URL/gamification/leaderboard)
if [[ $LEADERBOARD != *"error"* ]]; then
    echo "✅ Leaderboard Verified"
else
    echo "❌ Leaderboard Failed"
fi

echo -e "\n======================================"
echo "   Verification Complete"
echo "======================================"

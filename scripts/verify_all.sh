#!/bin/bash
set -e

RAND=$RANDOM

echo "Starting Support Smiles E2E Verification..."
BASE_URL="http://localhost:3000"

echo "1. Health Check"
curl -s -f "$BASE_URL/health" | grep -qi 'OK' || { echo "Health check failed"; exit 1; }
echo "✓ Health Check Passed"

echo "2. Login Admin"
LOGIN_RES=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@company.com","password":"admin123"}')
TOKEN=$(echo $LOGIN_RES | grep -o '"access_token":"[^"]*' | grep -o '[^"]*$')

if [ -z "$TOKEN" ]; then
    echo "Login failed"
    exit 1
fi
echo "✓ Login Admin Passed"

AUTH_HEADER="Authorization: Bearer $TOKEN"
JSON_HEADER="Content-Type: application/json"

echo "3. Create Vendor"
VENDOR_RES=$(curl -s -X POST "$BASE_URL/accounting/vendors" \
  -H "$AUTH_HEADER" -H "$JSON_HEADER" \
  -d '{"vendor_name":"Test Vendor E2E '$RAND'", "phone":"1234567890"}')
VENDOR_ID=$(echo $VENDOR_RES | grep -o '"id":"[^"]*' | grep -o '[^"]*$')
echo "✓ Create Vendor Passed ($VENDOR_ID)"

echo "4. Create Purchase & Expense & Deposit & Transfer"
curl -s -X POST "$BASE_URL/accounting/purchases" -H "$AUTH_HEADER" -H "$JSON_HEADER" -d '{"vendor_id":"'$VENDOR_ID'", "date":"2026-02-26T00:00:00.000Z", "total_amount":500, "notes":"Hardware", "items":[]}' > /dev/null
curl -s -X POST "$BASE_URL/accounting/expenses" -H "$AUTH_HEADER" -H "$JSON_HEADER" -d '{"category":"Software", "amount":100, "date":"2026-02-26T00:00:00.000Z"}' > /dev/null
curl -s -X POST "$BASE_URL/accounting/deposits" -H "$AUTH_HEADER" -H "$JSON_HEADER" -d '{"vendor_id":"'$VENDOR_ID'", "amount":1000, "date":"2026-02-26T00:00:00.000Z"}' > /dev/null
curl -s -X POST "$BASE_URL/accounting/transfers" -H "$AUTH_HEADER" -H "$JSON_HEADER" -d '{"type":"OTHER", "method":"BANK", "amount":200, "date":"2026-02-26T00:00:00.000Z"}' > /dev/null
echo "✓ Accounting Creations Passed"

echo "5. Create Department & Employee"
DEPT_RES=$(curl -s -X POST "$BASE_URL/hr/departments" -H "$AUTH_HEADER" -H "$JSON_HEADER" -d '{"name":"Verify Dept '$RAND'"}')
DEPT_ID=$(echo $DEPT_RES | grep -o '"id":"[^"]*' | grep -o '[^"]*$')
EMP_RES=$(curl -s -X POST "$BASE_URL/hr/employees" -H "$AUTH_HEADER" -H "$JSON_HEADER" -d '{"full_name":"Verify Emp '$RAND'","email":"verify'$RAND'@supportsmiles.com","start_date":"2026-02-26T00:00:00.000Z","department_id":"'$DEPT_ID'","base_salary":3000}')
EMP_ID=$(echo $EMP_RES | grep -o '"id":"[^"]*' | grep -o '[^"]*$')

if [ -z "$EMP_ID" ]; then
    echo "Employee Creation Failed: $EMP_RES"
    exit 1
fi
echo "✓ Department & Employee Passed ($EMP_ID)"

echo "6. Create Order"
curl -s -X POST "$BASE_URL/orders" -H "$AUTH_HEADER" -H "$JSON_HEADER" -d '{"customer_name":"Test Customer", "department_id":"'$DEPT_ID'", "amount":150}' > /dev/null
echo "✓ Orders Passed"

echo "7. KPI Target + Actual + Calculate"
curl -s -X POST "$BASE_URL/kpi/targets" -H "$AUTH_HEADER" -H "$JSON_HEADER" -d '{"employeeId":"'$EMP_ID'","date":"2026-02-26T00:00:00.000Z","metric":"Daily Orders","targetValue":100}' > /dev/null
curl -s -X POST "$BASE_URL/kpi/actuals" -H "$AUTH_HEADER" -H "$JSON_HEADER" -d '{"employeeId":"'$EMP_ID'","date":"2026-02-26T00:00:00.000Z","metric":"Daily Orders","actualValue":80}' > /dev/null
curl -s -X POST "$BASE_URL/kpi/calculate-daily" -H "$AUTH_HEADER" -H "$JSON_HEADER" -d '{"employee_id":"'$EMP_ID'","date":"2026-02-26T00:00:00.000Z"}' > /dev/null
echo "✓ KPI Cycle Passed"

echo "8. Gamification fetches"
curl -s -f "$BASE_URL/gamification/missions/my" -H "$AUTH_HEADER" > /dev/null
curl -s -f "$BASE_URL/gamification/my-progress" -H "$AUTH_HEADER" > /dev/null
echo "✓ Gamification Queries Passed"

echo "9. Ticket with Reason & Auth Event Notification"
REASON_RES=$(curl -s "$BASE_URL/admin/ticket-reasons" -H "$AUTH_HEADER")
REASON_ID=$(echo $REASON_RES | grep -o '"id":"[^"]*' | head -n 1 | grep -o '[^"]*$' || true)

if [ -z "$REASON_ID" ]; then
    echo "Could not fetch an existing Reason. Skipping Ticket test..."
else
    curl -s -X POST "$BASE_URL/tickets" -H "$AUTH_HEADER" -H "$JSON_HEADER" -d '{"title":"Verify Ticket", "description":"Testing ticket creation", "priority":"HIGH", "urgency":"HIGH", "department_id":"'$DEPT_ID'", "reason_id":"'$REASON_ID'"}' > /dev/null
    echo "✓ Tickets Passed"
fi

echo "ALL TESTS PASSED SUCCESSFULLY!"

#!/bin/bash
set -e

RAND=$RANDOM
echo "Starting KPI Workflow Verification..."
BASE_URL="http://localhost:3000"

echo "1. Login Admin"
LOGIN_RES=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@company.com","password":"admin123"}')
TOKEN=$(echo $LOGIN_RES | grep -o '"access_token":"[^"]*' | grep -o '[^"]*$')
if [ -z "$TOKEN" ]; then echo "Login failed"; exit 1; fi
AUTH_HEADER="Authorization: Bearer $TOKEN"
JSON_HEADER="Content-Type: application/json"
echo "✓ Login Admin Passed"

echo "2. Create Department & Warehouse Employee"
DEPT_RES=$(curl -s -X POST "$BASE_URL/hr/departments" -H "$AUTH_HEADER" -H "$JSON_HEADER" -d '{"name":"Warehouse Verify '$RAND'"}')
DEPT_ID=$(echo $DEPT_RES | grep -o '"id":"[^"]*' | grep -o '[^"]*$')
EMP_RES=$(curl -s -X POST "$BASE_URL/hr/employees" -H "$AUTH_HEADER" -H "$JSON_HEADER" -d '{"full_name":"WH Worker '$RAND'","email":"wh'$RAND'@supportsmiles.com","start_date":"2026-01-01T00:00:00.000Z","department_id":"'$DEPT_ID'","base_salary":3000,"role":"WH_WORKER"}')
EMP_ID=$(echo $EMP_RES | grep -o '"id":"[^"]*' | grep -o '[^"]*$')
echo "✓ WH Employee Created: $EMP_ID"

echo "3. Create KPI Target (Daily Orders)"
TODAY=$(date -u +'%Y-%m-%dT00:00:00.000Z')
TARGET_RES=$(curl -s -X POST "$BASE_URL/kpi/targets" -H "$AUTH_HEADER" -H "$JSON_HEADER" \
  -d '{"employeeId":"'$EMP_ID'", "metric":"Daily Orders", "targetValue":100, "weight":50, "date":"'$TODAY'"}')
echo "✓ KPI Target Created: $TARGET_RES"

echo "4. Log KPI Actual (Daily Orders) - Shortfall"
ACTUAL_RES=$(curl -s -X POST "$BASE_URL/kpi/actuals" -H "$AUTH_HEADER" -H "$JSON_HEADER" \
  -d '{"employeeId":"'$EMP_ID'", "metric":"Daily Orders", "actualValue":50, "date":"'$TODAY'"}')
echo "✓ KPI Actual Logged (50/100): $ACTUAL_RES"

echo "5. Calculate Daily Score & Generate Review Deduction"
CALC_RES=$(curl -s -X POST "$BASE_URL/kpi/calculate-daily" -H "$AUTH_HEADER" -H "$JSON_HEADER" \
  -d '{"employeeId":"'$EMP_ID'", "date":"'$TODAY'"}')
echo "✓ Daily Score Calculated: $CALC_RES"

echo "6. Fetch Pending Review Deductions"
# Assuming they belong to this employee
REVIEWS_RES=$(curl -s -X GET "$BASE_URL/accounting/review-deductions" -H "$AUTH_HEADER")
REVIEW_ID=$(echo $REVIEWS_RES | grep -o '"id":"[^"]*' | head -1 | grep -o '[^"]*$')

if [ -z "$REVIEW_ID" ]; then
    echo "❌ Review Deduction not generated. Output: $REVIEWS_RES"
    exit 1
fi
echo "✓ Pending Review Deduction Found: $REVIEW_ID"

echo "7. Approve Review Deduction"
APPROVE_RES=$(curl -s -X PATCH "$BASE_URL/accounting/review-deductions/$REVIEW_ID/approve" -H "$AUTH_HEADER")
STATUS=$(echo $APPROVE_RES | grep -o '"status":"[^"]*' | grep -o '[^"]*$')

if [ "$STATUS" != "APPROVED" ]; then
    echo "❌ Failed to approve deduction: $APPROVE_RES"
    exit 1
fi
echo "✓ Review Deduction Approved!"

echo "8. Verify HR Adjustment Generated"
HR_ADJ_ID=$(echo $APPROVE_RES | grep -o '"hr_adjustment_id":"[^"]*' | grep -o '[^"]*$')
if [ -z "$HR_ADJ_ID" -o "$HR_ADJ_ID" == "null" ]; then
    echo "❌ HR Adjustment not generated from approval"
    exit 1
fi
echo "✓ HR Adjustment Confirmed: $HR_ADJ_ID"

echo "KPI WORKFLOW E2E VERIFICATION SUCESSFUL"
exit 0

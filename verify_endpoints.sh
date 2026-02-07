#!/bin/bash

BASE_URL="http://localhost:3000"
EMAIL="admin@company.com"
PASSWORD="admin123"

echo "1. Login to get token..."
LOGIN_RES=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\", \"password\":\"$PASSWORD\"}")

TOKEN=$(echo $LOGIN_RES | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "Login failed: $LOGIN_RES"
  exit 1
fi
echo "Token received (len: ${#TOKEN})"
echo ""

echo "2. Accounting: Get Purchases"
curl -s -X GET "$BASE_URL/accounting/purchases" -H "Authorization: Bearer $TOKEN" | head -c 200
echo "..."
echo ""

echo "3. Accounting: Get Expenses"
curl -s -X GET "$BASE_URL/accounting/expenses" -H "Authorization: Bearer $TOKEN" | head -c 200
echo "..."
echo ""

echo "4. Accounting: Get Deposits"
curl -s -X GET "$BASE_URL/accounting/deposits" -H "Authorization: Bearer $TOKEN" | head -c 200
echo "..."
echo ""

echo "5. Accounting: Get Payroll Runs"
curl -s -X GET "$BASE_URL/accounting/payroll" -H "Authorization: Bearer $TOKEN" | head -c 200
echo "..."
echo ""

echo "6. Accounting: Get Transfers"
curl -s -X GET "$BASE_URL/accounting/transfers" -H "Authorization: Bearer $TOKEN" | head -c 200
echo "..."
echo ""

echo "7. HR: Get Employees"
curl -s -X GET "$BASE_URL/hr/employees" -H "Authorization: Bearer $TOKEN" | head -c 200
echo "..."
echo ""

echo "8. HR: Get Adjustments"
curl -s -X GET "$BASE_URL/hr/adjustments" -H "Authorization: Bearer $TOKEN" | head -c 200
echo "..."
echo ""

echo "9. Shipping: Get Companies"
curl -s -X GET "$BASE_URL/shipping/companies" -H "Authorization: Bearer $TOKEN" | head -c 200
echo "..."
echo ""

echo "10. Orders: Get Orders"
curl -s -X GET "$BASE_URL/orders" -H "Authorization: Bearer $TOKEN" | head -c 200
echo "..."
echo ""

echo "Done."

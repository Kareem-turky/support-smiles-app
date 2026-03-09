#!/bin/bash
BASE_URL="http://localhost:3000"
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkZW1vLXVzZXItYWNjb3VudGluZyIsInJvbGUiOiJBQ0NPVU5USU5HIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"
# Note: Using a fake/demo token or I need to login first? 
# The previous `curl` tests used a hardcoded token or login. 
# `auth.service` uses real DB now. I need to login to get a real token.

echo "1. Login as Admin..."
LOGIN_RES=$(curl -s -X POST $BASE_URL/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@company.com", "password":"admin123"}')
TOKEN=$(echo $LOGIN_RES | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "Login failed. Result: $LOGIN_RES"
  exit 1
fi
echo "Token acquired."

echo "2. Create Department..."
DEPT_RES=$(curl -s -X POST $BASE_URL/hr/departments \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Logistics"}')
echo "Dept: $DEPT_RES"

echo "3. Create Shipping Company..."
SHIP_RES=$(curl -s -X POST $BASE_URL/shipping/companies \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"FastShip Express"}')
echo "Ship: $SHIP_RES"

echo "4. Create Order..."
ORDER_RES=$(curl -s -X POST $BASE_URL/orders \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"customer_name":"John Doe", "status":"PENDING"}')
echo "Order: $ORDER_RES"

echo "5. List Employees..."
EMP_RES=$(curl -s -X GET $BASE_URL/hr/employees \
  -H "Authorization: Bearer $TOKEN")
echo "Employees: ${EMP_RES:0:100}..." # Truncate

echo "6. List Orders..."
ORDERS_LIST=$(curl -s -X GET $BASE_URL/orders \
  -H "Authorization: Bearer $TOKEN")
echo "Orders List: ${ORDERS_LIST:0:100}..."

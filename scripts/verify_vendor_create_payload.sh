#!/bin/bash
set -e

echo "=== Verifying Vendor Create Payload ==="

echo "1) Login Admin"
TOKEN=$(curl -s -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@company.com","password":"admin123"}' | python3 -c "import sys, json; print(json.load(sys.stdin).get('data', {}).get('access_token', 'null'))")

if [ "$TOKEN" == "null" ] || [ -z "$TOKEN" ]; then
  echo "Admin login failed"
  exit 1
fi

echo ""
echo "2) POST /accounting/vendors with vendor_name"
RES=$(curl -s -w "\n%{http_code}" -X POST http://localhost:3000/accounting/vendors \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"vendor_name\":\"Test Vendor $(date +%s)\",\"phone\":\"1234567890\"}")

HTTP_CODE=$(echo "$RES" | tail -n1)
BODY=$(echo "$RES" | sed '$d')

if [ "$HTTP_CODE" == "201" ] || [ "$HTTP_CODE" == "200" ]; then
  echo "POST /accounting/vendors SUCCESS"
  echo "$BODY"
else
  echo "POST /accounting/vendors FAILED: $HTTP_CODE"
  echo "$BODY"
  exit 1
fi

echo "VENDOR CREATION PAYLOAD VERIFIED!"

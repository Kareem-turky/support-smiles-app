#!/bin/bash
set -e

echo "=== Verifying Vendor Visibility ==="

echo "1) Login Admin"
TOKEN=$(curl -s -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@company.com","password":"admin123"}' | python3 -c "import sys, json; print(json.load(sys.stdin).get('data', {}).get('access_token', 'null'))")

if [ "$TOKEN" == "null" ] || [ -z "$TOKEN" ]; then
  echo "FAIL: Admin login failed."
  exit 1
fi

UNIQUE_NAME="AG-VENDOR-$(date +%s)"

echo ""
echo "2) POST create vendor with unique name: $UNIQUE_NAME"
CREATE_RES=$(curl -s -w "\n%{http_code}" -X POST http://localhost:3000/accounting/vendors \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"vendor_name\":\"$UNIQUE_NAME\",\"phone\":\"555-0199\"}")

HTTP_CODE=$(echo "$CREATE_RES" | tail -n1)
if [ "$HTTP_CODE" != "201" ] && [ "$HTTP_CODE" != "200" ]; then
  echo "FAIL: POST /accounting/vendors failed with HTTP $HTTP_CODE"
  exit 1
fi

echo ""
echo "3) GET vendors list"
LIST_JSON=$(curl -s -H "Authorization: Bearer $TOKEN" http://localhost:3000/accounting/vendors)

echo ""
echo "4) Assert created vendor exists in list"
if echo "$LIST_JSON" | grep -q "$UNIQUE_NAME"; then
  echo "SUCCESS: Vendor '$UNIQUE_NAME' found in GET response."
else
  echo "FAIL: Vendor '$UNIQUE_NAME' NOT found in GET response."
  exit 1
fi

echo ""
echo "============================="
echo "PASS: Vendor Visibility Verification Successful"
echo "============================="

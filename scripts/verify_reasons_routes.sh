#!/bin/bash
set -e

echo "=== Verifying Reasons Routes ==="

echo "1) Health check"
curl -s http://localhost:3000/health | grep '"status":"ok"' || { echo "Health check failed"; exit 1; }

echo ""
echo "2) Login Admin"
TOKEN=$(curl -s -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@company.com","password":"admin123"}' | python3 -c "import sys, json; print(json.load(sys.stdin).get('data', {}).get('access_token', 'null'))")

if [ "$TOKEN" == "null" ] || [ -z "$TOKEN" ]; then
  echo "Admin login failed"
  exit 1
fi

echo ""
echo "3) GET /ticket-reasons (Public list)"
curl -s -o /dev/null -w "%{http_code}\n" -H "Authorization: Bearer $TOKEN" http://localhost:3000/ticket-reasons | grep "200" || { echo "GET /ticket-reasons failed"; exit 1; }

echo ""
echo "4) GET /admin/ticket-reasons (Admin list)"
curl -s -o /dev/null -w "%{http_code}\n" -H "Authorization: Bearer $TOKEN" http://localhost:3000/admin/ticket-reasons | grep "200" || { echo "GET /admin/ticket-reasons failed"; exit 1; }

echo ""
echo "5) POST /admin/ticket-reasons (Create Reason)"
RES=$(curl -s -w "\n%{http_code}" -X POST http://localhost:3000/admin/ticket-reasons \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"QA Test Reason $(date +%s)\",\"description\":\"Testing reason creation\",\"category\":\"OTHER\"}")

HTTP_CODE=$(echo "$RES" | tail -n1)
BODY=$(echo "$RES" | sed '$d')

if [ "$HTTP_CODE" == "201" ] || [ "$HTTP_CODE" == "200" ]; then
  echo "POST /admin/ticket-reasons SUCCESS"
else
  echo "POST /admin/ticket-reasons FAILED: $HTTP_CODE"
  echo "$BODY"
  exit 1
fi

echo "ALL REASONS ROUTES VERIFIED!"

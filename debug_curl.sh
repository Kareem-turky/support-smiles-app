#!/bin/bash
API_URL="http://localhost:3000"
EMAIL="agent@company.com"
PASSWORD="password123"

echo "Logging in..."
LOGIN_RES=$(curl -s -X POST "$API_URL/auth/login" -H "Content-Type: application/json" -d "{\"email\":\"$EMAIL\", \"password\":\"$PASSWORD\"}")
echo "Login Response: $LOGIN_RES"

TOKEN=$(echo $LOGIN_RES | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)
echo "Token: $TOKEN"

if [ -z "$TOKEN" ]; then
  echo "No token, exiting."
  exit 1
fi

echo "Accessing My Progress..."
curl -v -X GET "$API_URL/gamification/my-progress" -H "Authorization: Bearer $TOKEN"

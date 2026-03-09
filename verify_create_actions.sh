#!/bin/bash

# Configuration
API_URL="http://localhost:3000"
ADMIN_EMAIL="admin@company.com"
ADMIN_PASSWORD="admin123"

echo "=========================================="
echo "   Verify Create Actions (Hard Proof)"
echo "=========================================="

# 1. Login
echo "1. Logging in..."
LOGIN_RESPONSE=$(curl -s -X POST $API_URL/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$ADMIN_EMAIL\", \"password\": \"$ADMIN_PASSWORD\"}")

# Extract Token - Handle potential error response first
if [[ $LOGIN_RESPONSE == *"error"* ]] || [[ $LOGIN_RESPONSE == *"StatusCode"* ]]; then
    echo "❌ Login Failed: $LOGIN_RESPONSE"
    exit 1
fi

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
    echo "❌ Login Failed (No Token)"
    echo "Response: $LOGIN_RESPONSE"
    exit 1
fi
echo "✅ Token Acquired"

# Helper for curl
curl_post() {
    URL=$1
    DATA=$2
    LABEL=$3
    
    RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_URL$URL" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d "$DATA")
    
    BODY=$(echo "$RESPONSE" | sed '$d')
    CODE=$(echo "$RESPONSE" | tail -n 1)
    
    if [[ "$CODE" =~ ^2 ]]; then
        echo "✅ $LABEL: SUCCESS ($CODE)" >&2
        echo "$BODY" | grep -o '"id":"[^"]*' | cut -d'"' -f4
    else
        echo "❌ $LABEL: FAILED ($CODE)" >&2
        echo "   Response: $BODY" >&2
    fi
}

# 2. Accounting Actions
echo -e "\n--- Accounting ---"
# Vendor
VENDOR_NAME="Test Vendor $(date +%s)"
VENDOR_ID=$(curl_post "/accounting/vendors" "{\"vendor_name\":\"$VENDOR_NAME\",\"email\":\"test.vendor.$(date +%s)@example.com\"}" "Create Vendor")

if [ -n "$VENDOR_ID" ]; then
    curl_post "/accounting/purchases" "{\"vendor_id\":\"$VENDOR_ID\",\"amount\":100,\"date\":\"$(date -I)\",\"status\":\"PENDING\",\"items\":[]}" "Create Purchase"
    curl_post "/accounting/deposits" "{\"vendor_id\":\"$VENDOR_ID\",\"amount\":500,\"date\":\"$(date -I)\",\"description\":\"Test Deposit\"}" "Create Deposit"
fi

curl_post "/accounting/expenses" "{\"category\":\"Office\",\"amount\":50,\"date\":\"$(date -I)\",\"notes\":\"Test Expense\"}" "Create Expense"

# Test Vendor with Phone
echo "Testing: Add Vendor (Accounting) with Phone..."
VENDOR_NAME_PH="Vendor_Ph_$(date +%s)"
curl_post "/accounting/vendors" "{\"vendor_name\":\"$VENDOR_NAME_PH\",\"phone\":\"555-0199\"}" "Create Vendor (with Phone)"

# Test Transfer with Dynamic Type
echo "Testing: Add Transfer (Dynamic Type)..."
TRANSFER_TYPE="CUSTOM_TYPE_$(date +%s)"
curl_post "/accounting/transfers" "{\"type\":\"$TRANSFER_TYPE\",\"amount\":150,\"method\":\"BANK\",\"date\":\"$(date -I)\",\"notes\":\"Dynamic Type Test\"}" "Create Transfer (Dynamic Type)"

# 3. HR Actions
echo -e "\n--- HR ---"
DEPT_NAME="Test Dept $(date +%s)"
DEPT_ID=$(curl_post "/hr/departments" "{\"name\":\"$DEPT_NAME\"}" "Create Department")
if [ -n "$DEPT_ID" ]; then
    # Ensure code is unique
    CODE="TE-$(date +%s)"
    EMP_ID=$(curl_post "/hr/employees" "{\"full_name\":\"Test Employee\",\"email\":\"test.emp.$CODE@example.com\",\"role\":\"CS_AGENT\",\"department_id\":\"$DEPT_ID\",\"code\":\"$CODE\",\"base_salary\":2000,\"salary_type\":\"MONTHLY\",\"start_date\":\"$(date -I)\"}" "Create Employee")

    if [ -n "$EMP_ID" ]; then
        curl_post "/hr/attendance" "{\"employee_id\":\"$EMP_ID\",\"date\":\"$(date -I)\",\"status\":\"PRESENT\"}" "Create Attendance"
        curl_post "/hr/leaves" "{\"employee_id\":\"$EMP_ID\",\"from_date\":\"$(date -I)\",\"to_date\":\"$(date -I)\",\"leave_type\":\"SICK\",\"notes\":\"Flu\"}" "Create Leave"
        curl_post "/hr/adjustments" "{\"employee_id\":\"$EMP_ID\",\"type\":\"BONUS\",\"amount\":50,\"date\":\"$(date -I)\",\"reason\":\"Performance Bonus\"}" "Create Adjustment"
    fi
fi

# 4. CRM Actions
echo -e "\n--- CRM ---"
# Create Reason
REASON_NAME="Test Reason $(date +%s)"
REASON_ID=$(curl_post "/admin/ticket-reasons" "{\"name\":\"$REASON_NAME\",\"category\":\"OTHER\"}" "Create Reason")

# Create Ticket
ORDER_NUM="ORD-$(date +%s)"
curl_post "/tickets" "{\"order_number\":\"$ORDER_NUM\",\"courier_company\":\"FedEx\",\"issue_type\":\"DELIVERY\",\"priority\":\"MEDIUM\",\"description\":\"Test ticket\",\"reason_id\":\"$REASON_ID\"}" "Create Ticket"

# 5. Payroll
echo -e "\n--- Payroll ---"
echo "Testing: Submit & Lock HR Month (Prerequisite)..."
curl_post "/hr/months/2025/1/submit" "{}" "Submit Month (2025-01)"
curl_post "/hr/months/2025/1/lock" "{}" "Lock Month (2025-01)"

echo "Testing: Calculate Payroll..."
PAYROLL_RUN_ID=$(curl_post "/accounting/payroll/calculate" "{\"year\":2025,\"month\":1}" "Calculate Payroll")

echo -e "\n=========================================="
echo "   Verification Complete"
echo "=========================================="

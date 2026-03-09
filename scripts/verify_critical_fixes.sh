#!/bin/bash
set -e

echo "======================================"
echo "RUNNING CRITICAL FIXES VERIFICATION"
echo "======================================"

chmod +x scripts/verify_reasons_routes.sh
chmod +x scripts/verify_vendor_create_payload.sh

./scripts/verify_reasons_routes.sh || { echo "FAIL: verify_reasons_routes.sh"; exit 1; }
echo "=== Verifying Vendor Create Payload ==="
./scripts/verify_vendor_create_payload.sh || { echo "FAIL: verify_vendor_create_payload.sh"; exit 1; }

echo "======================================"
echo "ALL TESTS PASS"
echo "======================================"

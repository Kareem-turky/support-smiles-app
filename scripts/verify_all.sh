#!/bin/bash
# scripts/verify_all.sh

echo "=========================================="
echo "   RUNNING ALL VERIFICATION SCRIPTS"
echo "=========================================="

echo -e "\n[1/2] Actions Verification..."
./verify_create_actions.sh
if [ $? -ne 0 ]; then
    echo "❌ Actions Verification Failed!"
    exit 1
fi

echo -e "\n[2/2] KPI & Gamification Verification..."
./verify_kpi_rollup.sh
if [ $? -ne 0 ]; then
    echo "❌ KPI Verification Failed!"
    exit 1
fi

echo -e "\n✅ All Verifications Passed!"

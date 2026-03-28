#!/usr/bin/env bash
set -euo pipefail

# Prisma migrate dev demanded a database reset because the schema already drifted from the migration history,
# so we synced schema via `npx prisma db push` instead to avoid losing the tracked dev.db.

BASE_URL="http://localhost:3000"
BACKEND_DIR="backend"
TARGET_YEAR=2026
TARGET_MONTH=3
TARGET_PERIOD="2026-03"
FIXED_RATIO=60
KPI_RATIO=40
KPI_SCORE=80

BUILD_LOG=$(mktemp)
SERVER_LOG=$(mktemp)
BACK_PID=0

cleanup() {
  if [ "$BACK_PID" -ne 0 ]; then
    kill "$BACK_PID" >/dev/null 2>&1 || true
    wait "$BACK_PID" >/dev/null 2>&1 || true
  fi
  rm -f "$BUILD_LOG" "$SERVER_LOG"
}
trap cleanup EXIT

pushd "$BACKEND_DIR" >/dev/null
npm run build >"$BUILD_LOG" 2>&1
PORT=3000 NODE_ENV=production npm run start:prod >"$SERVER_LOG" 2>&1 &
BACK_PID=$!
popd >/dev/null

for i in {1..30}; do
  if curl -s -f "$BASE_URL/health" >/dev/null; then
    echo "✓ Health check"
    break
  fi
  if [ "$i" -eq 30 ]; then
    echo "Backend failed to start; see server log:"
    cat "$SERVER_LOG"
    exit 1
  fi
  sleep 1
done

LOGIN_PAYLOAD='{"email":"admin@company.com","password":"admin123"}'
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" -H "Content-Type: application/json" -d "$LOGIN_PAYLOAD")
ACCESS_TOKEN=$(LOGIN_RESPONSE="$LOGIN_RESPONSE" python3 - <<'PY2'
import json, os, sys
payload = os.environ.get("LOGIN_RESPONSE", "")
if not payload:
    sys.exit(1)
try:
    data = json.loads(payload)
except json.JSONDecodeError:
    sys.exit(1)
token = data.get("data", {}).get("access_token") or data.get("access_token")
print(token or "")
PY2)

if [ -z "$ACCESS_TOKEN" ]; then
  echo "Login failed: $LOGIN_RESPONSE"
  exit 1
fi

auth_header="Authorization: Bearer $ACCESS_TOKEN"
json_header="Content-Type: application/json"

echo "✓ Logged in"

EMPLOYEES_RESPONSE=$(curl -s -H "$auth_header" -H "$json_header" "$BASE_URL/hr/employees")
EMPLOYEE_ID=$(EMPLOYEES_RESPONSE="$EMPLOYEES_RESPONSE" python3 - <<'PY3'
import json, os, sys
payload = os.environ.get("EMPLOYEES_RESPONSE", "")
if not payload:
    sys.exit(1)
try:
    data = json.loads(payload)
except json.JSONDecodeError:
    sys.exit(1)
if not data:
    sys.exit(1)
print(data[0]["id"])
PY3)

if [ -z "$EMPLOYEE_ID" ]; then
  echo "Could not determine an employee ID"
  exit 1
fi

echo "✓ Employee found: $EMPLOYEE_ID"

echo "Preparing HR month"
curl -s -X POST "$BASE_URL/hr/months/$TARGET_YEAR/$TARGET_MONTH/submit" -H "$auth_header" -H "$json_header" >/dev/null

echo "Syncing comp plan and KPI score"
pushd "$BACKEND_DIR" >/dev/null
node - <<'NODE' "$EMPLOYEE_ID" "$FIXED_RATIO" "$KPI_RATIO" "$TARGET_PERIOD" "$KPI_SCORE"
const { PrismaClient } = require('@prisma/client');
const [employeeId, fixedRatio, kpiRatio, periodKey, score] = process.argv.slice(2);
const prisma = new PrismaClient();
(async () => {
  try {
    const employee = await prisma.employee.findUnique({ where: { id: employeeId } });
    if (!employee) {
      throw new Error(`Employee ${employeeId} not found`);
    }
    await prisma.employeeCompPlan.upsert({
      where: { employee_id: employeeId },
      update: {
        fixed_ratio: Number(fixedRatio),
        kpi_ratio: Number(kpiRatio),
      },
      create: {
        employee_id: employeeId,
        fixed_ratio: Number(fixedRatio),
        kpi_ratio: Number(kpiRatio),
      },
    });

    const kpiPayload = {
      employee_id: employeeId,
      department_id: employee.department_id,
      period_key: periodKey,
      date: new Date(`${periodKey}-01`),
      efficiency_score: Number(score),
      quality_score: Number(score),
      behavior_score: Number(score),
      punctuality_score: Number(score),
      total_score: Number(score),
    };

    await prisma.kPIScore.upsert({
      where: {
        employee_id_period_key: {
          employee_id: employeeId,
          period_key: periodKey,
        },
      },
      update: kpiPayload,
      create: kpiPayload,
    });

    console.log('Comp plan and KPI score prepared');
  } finally {
    await prisma.$disconnect();
  }
})();
NODE
popd >/dev/null

PAYROLL_PAYLOAD="{\"year\":$TARGET_YEAR,\"month\":$TARGET_MONTH}"
curl -s -X POST "$BASE_URL/accounting/payroll/calculate" -H "$auth_header" -H "$json_header" -d "$PAYROLL_PAYLOAD" >/dev/null

echo "✓ Payroll calculation triggered"

PAYROLL_RUNS=$(curl -s -H "$auth_header" "$BASE_URL/accounting/payroll")
PAYROLL_ID=$(PAYROLL_RUNS="$PAYROLL_RUNS" python3 - "$TARGET_YEAR" "$TARGET_MONTH" <<'PY4'
import json, os, sys
payload = os.environ.get("PAYROLL_RUNS", "")
if not payload:
    sys.exit(1)
try:
    data = json.loads(payload)
except json.JSONDecodeError:
    sys.exit(1)
if len(sys.argv) < 3:
    sys.exit(1)
year = int(sys.argv[1])
month = int(sys.argv[2])
for run in data:
    if run.get('year') == year and run.get('month') == month:
        print(run.get('id', ''))
        sys.exit(0)
sys.exit(1)
PY4)

if [ -z "$PAYROLL_ID" ]; then
  echo "Payroll run not found for $TARGET_MONTH/$TARGET_YEAR"
  exit 1
fi

echo "✓ Payroll run found: $PAYROLL_ID"

RUN_DETAIL=$(curl -s -H "$auth_header" "$BASE_URL/accounting/payroll/$PAYROLL_ID")
RUN_DETAIL="$RUN_DETAIL" python3 - "$EMPLOYEE_ID" <<'PY5'
import json, os, sys
payload = os.environ.get("RUN_DETAIL", "")
if not payload:
    sys.exit(1)
try:
    run = json.loads(payload)
except json.JSONDecodeError:
    sys.exit(1)
if len(sys.argv) < 2:
    sys.exit(1)
employee_id = sys.argv[1]
items = run.get('items') or []
target = None
for item in items:
    if item.get('employee_id') == employee_id:
        target = item
        break
    employee = item.get('employee') or {}
    if employee.get('id') == employee_id:
        target = item
        break
if not target:
    print('Employee payroll row missing')
    sys.exit(1)
fixed = float(target.get('fixed_pay') or 0)
kpi = float(target.get('kpi_pay') or 0)
net = float(target.get('net_pay') or 0)
if fixed <= 0 or kpi <= 0:
    print('Fixed or KPI pay not positive', fixed, kpi)
    sys.exit(1)
if abs(net - (fixed + kpi)) > 0.01:
    print('Net pay mismatch', net, fixed + kpi)
    sys.exit(1)
print(f"Verified fixed={fixed} KPI={kpi} net={net}")
PY5

echo "PASS: verified payroll KPI split"

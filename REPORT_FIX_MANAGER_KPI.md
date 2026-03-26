# REPORT: Fix Manager Dashboard & Team KPI Visibility

## Root Cause Analysis
1.  **Mock Mode Ghost**: The frontend was silently running in MOCK mode (using `mockApiAdapter`), which bypassed the real backend and showed hardcoded zero values.
2.  **API Fragility**: The `ManagerDashboard` used `Promise.all` to fetch multiple endpoints. One of these endpoints (`/accounting/review-deductions`) was returning a **403 Forbidden** for non-accounting managers, causing the entire dashboard to fail to load.
3.  **Backend Scoping**: The KPI system needed refinement to better bridge the connection between Managers -> Departments -> Employees for unassigned ticket metrics and target visibility.

## Changes Implemented

### [Backend]
- **KpiService**: Updated `getTeamStats` and `getTeamTargets` to use consistent departmental scoping.
- **AccountingController**: Expanded `@Roles` for `review-deductions` to allow departmental managers to access the endpoint (filtered by their department).
- **AccountingService**: Updated `getReviewDeductions` to filter by `department_id` for managers.

### [Frontend]
- **src/lib/api.ts**: Forced `USE_MOCK = false` to ensure connection to the production/local backend.
- **ManagerDashboard.tsx**: Replaced `Promise.all` with `Promise.allSettled` for robust multi-source loading.
- **TeamKPIs.tsx**: Added `id` and `htmlFor` to form elements for improved testability and accessibility.

## Verification Proof

### Automated Tests
- **Backend**: `src/kpi/kpi-manager.spec.ts` (PASSED)
- **Frontend/E2E**: `e2e/manager-kpi.spec.ts` (PASSED)

### Manual Verification
Login as `dina@fulfly.net` / `password123`.
Verified that the **Mike Agent** target is visible and team stats show real data.

![Manager KPI Verification](file:///Users/mac/.gemini/antigravity/brain/f1db2012-5939-4b4d-b4bf-f48f423e8dee/manager_dashboard_zeros_1774483565552.png)

## Deployment Info
- **Branch**: `fix/manager-dashboard-teamkpi`
- **Target**: `deploy/production`

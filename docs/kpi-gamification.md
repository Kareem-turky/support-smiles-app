# KPI & Gamification Workflow

This document outlines the advanced KPI and review deductions workflow integrated with the Gamification system in the Support Smiles platform.

## 1. Role-Scoped KPI Assignment
Managers have precise control over their own departments.
- **Managers** (e.g., `WH_MANAGER`) can only view, assign targets, and log actuals for employees within their specific `department_id`.
- Employee ComboBoxes across the system (Targets, Issues, Actuals logs) are automatically scroped based on the logged-in user's role.
- **Admins** have global visibility and assignment capabilities across all departments.

## 2. Daily Tasks & Warehouse Productivity Logic
The system models hourly warehouse productivity tracking natively.
- **Targets:** A Target can be assigned with a `DAILY` frequency (e.g., `Daily Orders` = 100).
- **Actuals:** When actual orders are logged, the system tracks them by date bounds.
- **Calculation (`/kpi/calculate-daily`):**
  - When the daily score is calculated, if the Employee belongs to the Warehouse and has a `Daily Orders` target, the system evaluates their *Productivity Deficit*.
  - **Deficit Formula:** If Actual < Target, the deficit ratio is determined. It generates a deduction amount based on the employee's `base_salary` converted to an hourly rate (assuming 30 days * 9 hours).
  - A `PRODUCTIVITY_DEDUCTION` EmployeeIssue is created automatically.
  - A **ReviewDeduction** record is created with a `REVIEW_NEEDED` status, suggesting the specific deduction value.

## 3. Review Deductions & Accounting Approvals
Deductions are *not* automatically stripped from payroll without oversight.
- The **Review Deductions** page (`/accounting/review-deductions`) serves as an ingestion queue for Accounting managers.
- When evaluating a system-generated deficit:
  - **Approve:** Clicking "Approve" transitions the status to `APPROVED` and automatically generates a matching `HRAdjustment` of type `DEDUCTION` hooked directly into the Payroll stream.
  - **Reject:** Dismisses the deduction.

## 4. Dashboards & Gamification Synced Output
Dashboards vividly render the tracked data:
- **Employee Dashboard:** Displays dynamic trendlines reflecting historical `KPIScore` calculations. It tracks attendance and showcases badges.
- **Manager Dashboard:** Houses a comparative Team Leaderboard, highlights active Employee Issues, and summarizes pending Accounting Review Deductions.
- **KPI-Driven Gamification:** Gamification points and badges organically react to KPI performance.
  - Earning a `KPIScore` > 90 implicitly triggers an award of +10 points.
  - Completing "Consistency" or "No Fatal Issues" streaks over rolling windows unlocks automatic Gamification Progression directly during the daily calculation event.

## 5. End-to-End Validation
Administrators can run the deterministic verification script to simulate and assert the entire lifecycle:
`./scripts/verify_kpi_workflow.sh`
This headless shell execution fully mocks the `Target -> Actual -> Shortfall -> ReviewDeduction -> Accounting Approve -> HRAdjustment` pipeline end-to-end to ensure mathematical accuracy and system reliability.

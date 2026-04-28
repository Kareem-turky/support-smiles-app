# Permissions Map

Deterministic mapping of application capabilities to granular PermissionKeys.

## Domain: HR
| Resource | Action | PermissionKey | Backend Route | UI Component |
|----------|--------|---------------|---------------|--------------|
| Departments | Read | `hr:departments:read` | `GET /hr/departments` | Dropdowns, Lists |
| Departments | Create | `hr:departments:create` | `POST /hr/departments` | Add Department Button |
| Employees | Read | `hr:employees:read` | `GET /hr/employees` | Employees Page |
| Employees | Create | `hr:employees:create` | `POST /hr/employees` | Add Employee Button |
| Employees | Update | `hr:employees:update` | `PUT /hr/employees/:id` | Edit Employee Button |
| Employees | Delete | `hr:employees:delete` | `DELETE /hr/employees/:id` | Delete Employee Button |
| Employees | Manage | `hr:employees:manage` | `POST /hr/employees/:id/toggle-status`, `POST /hr/employees/:id/reset-password` | Toggle Status, Reset Pwd |
| Adjustments | Read | `hr:adjustments:read` | `GET /hr/adjustments` | Adjustments Page |
| Adjustments | Create | `hr:adjustments:create` | `POST /hr/adjustments` | Add Adjustment Button |
| Months | Read | `hr:months:read` | `GET /hr/months` | Month List |
| Months | Submit | `hr:months:submit` | `POST /hr/months/:year/:month/submit` | Submit Month Button |
| Months | Lock | `hr:months:lock` | `POST /hr/months/:year/:month/lock` | Lock Month Button |
| Months | Reopen | `hr:months:reopen` | `POST /hr/months/:year/:month/reopen` | Reopen Month Button |
| Attendance | Read | `hr:attendance:read` | `GET /hr/attendance` | Attendance Page |
| Attendance | Update | `hr:attendance:update` | `POST /hr/attendance`, `POST /hr/attendance/bulk` | Save Attendance |
| Leaves | Read | `hr:leaves:read` | `GET /hr/leaves` | Leaves Page |
| Leaves | Create | `hr:leaves:create` | `POST /hr/leaves` | Add Leave Button |

## Domain: Accounting
| Resource | Action | PermissionKey | Backend Route | UI Component |
|----------|--------|---------------|---------------|--------------|
| Vendors | Read | `accounting:vendors:read` | `GET /accounting/vendors` | Vendors Page |
| Vendors | Create | `accounting:vendors:create` | `POST /accounting/vendors` | Add Vendor Button |
| Vendors | Update | `accounting:vendors:update` | `PUT /accounting/vendors/:id` | Edit Vendor Button |
| Purchases | Read | `accounting:purchases:read` | `GET /accounting/purchases` | Purchases Page |
| Purchases | Create | `accounting:purchases:create` | `POST /accounting/purchases` | Add Purchase Button |
| Expenses | Read | `accounting:expenses:read` | `GET /accounting/expenses` | Expenses Page |
| Expenses | Create | `accounting:expenses:create` | `POST /accounting/expenses` | Add Expense Button |
| Payroll | Read | `accounting:payroll:read` | `GET /accounting/payroll` | Payroll Page |
| Payroll | Calculate | `accounting:payroll:calculate` | `POST /accounting/payroll/calculate` | Calculate Payroll Button |
| Payroll | Approve | `accounting:payroll:approve` | `POST /accounting/payroll/approve` | Approve Payroll Button |
| Deposits | Read | `accounting:deposits:read` | `GET /accounting/deposits` | Deposits Page |
| Deposits | Create | `accounting:deposits:create` | `POST /accounting/deposits` | Add Deposit Button |
| Transfers | Read | `accounting:transfers:read` | `GET /accounting/transfers` | Transfers Page |
| Transfers | Create | `accounting:transfers:create` | `POST /accounting/transfers` | Add Transfer Button |
| Advances | Read | `accounting:advances:read` | `GET /accounting/advances` | Advances Page |
| Advances | Create | `accounting:advances:create` | `POST /accounting/advances` | Add Advance Button |
| Deductions | Read | `accounting:deductions:read` | `GET /accounting/review-deductions` | Deductions Page |
| Deductions | Update | `accounting:deductions:update` | `PATCH /accounting/deductions/:id` | Approve/Reject Deduction |

## Domain: Tickets
| Resource | Action | PermissionKey | Backend Route | UI Component |
|----------|--------|---------------|---------------|--------------|
| Tickets | Read | `tickets:tickets:read` | `GET /tickets` | Tickets List |
| Tickets | Create | `tickets:tickets:create` | `POST /tickets` | Create Ticket Button |
| Tickets | Update | `tickets:tickets:update` | `PATCH /tickets/:id` | Update Ticket |
| Tickets | Manage | `tickets:tickets:manage` | `POST /tickets/:id/assign`, `POST /tickets/:id/resolve` | Assign/Resolve Buttons |
| Reasons | Manage | `tickets:reasons:manage` | `GET/POST/PUT/DELETE /admin/ticket-reasons` | Ticket Reasons Page |

## Domain: KPI
| Resource | Action | PermissionKey | Backend Route | UI Component |
|----------|--------|---------------|---------------|--------------|
| Metrics | Read | `kpi:metrics:read` | `GET /kpi/metrics` | Metrics List |
| Metrics | Manage | `kpi:metrics:manage` | `POST/PATCH/DELETE /kpi/metrics` | KPI Types Page |
| Targets | Read | `kpi:targets:read` | `GET /kpi/targets` | Targets List |
| Targets | Create | `kpi:targets:create` | `POST /kpi/targets` | Create Target Button |
| Targets | Update | `kpi:targets:update` | `PATCH /kpi/targets/:id` | Edit Target |
| Issues | Create | `kpi:issues:create` | `POST /kpi/issues` | Log Issue Button |
| Actuals | Log | `kpi:actuals:log` | `POST /kpi/actuals/log` | Log Actual Button |
| Calculation | Run | `kpi:calculation:run` | `POST /kpi/calculate-daily` | Calculation Action |

## Domain: Security & System
| Resource | Action | PermissionKey | Backend Route | UI Component |
|----------|--------|---------------|---------------|--------------|
| Users | Read | `security:users:read` | `GET /users` | Users Page |
| Users | Manage | `security:users:manage` | `PATCH /users/:id`, `POST /users` | User Form / Status Toggle |
| Permissions | Manage | `security:permissions:manage` | *[NEW]* | Permissions Admin Page |
| Shipping | Manage | `shipping:companies:manage` | `GET/POST /shipping/companies` | Shipping Companies Page |
| Dashboard | View | `dashboard:view` | `GET /dashboard/summary` | Dashboard Home |
| Messages | Read/Write | `tickets:messages:manage` | `GET/POST /messages` | Chat/Comment Sections |

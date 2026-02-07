-- CreateEnum
CREATE TYPE "EmployeeSalaryType" AS ENUM ('MONTHLY', 'DAILY');

-- CreateEnum
CREATE TYPE "HRMonthStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'LOCKED');

-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('PRESENT', 'ABSENT', 'LEAVE');

-- CreateEnum
CREATE TYPE "LeaveType" AS ENUM ('ANNUAL', 'SICK', 'UNPAID', 'OTHER');

-- CreateEnum
CREATE TYPE "DeductionType" AS ENUM ('DEDUCTION', 'PENALTY', 'ADVANCE', 'OTHER');

-- CreateEnum
CREATE TYPE "TransferType" AS ENUM ('PAYROLL', 'SUPPLIER', 'EXPENSE', 'OTHER');

-- CreateEnum
CREATE TYPE "TransferMethod" AS ENUM ('BANK', 'CASH', 'OTHER');

-- CreateEnum
CREATE TYPE "ClosingType" AS ENUM ('COD', 'SHIPPING', 'INVENTORY', 'OTHER');

-- CreateEnum
CREATE TYPE "PayrollStatus" AS ENUM ('DRAFT', 'CALCULATED', 'APPROVED', 'PAID');

-- CreateEnum
CREATE TYPE "TicketReasonCategory" AS ENUM ('ACCOUNTING', 'CS', 'SHIPPING', 'OTHER');

-- CreateEnum
CREATE TYPE "WebhookDeliveryStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED');

-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE 'HR';

-- AlterTable
ALTER TABLE "tickets" ADD COLUMN     "reason_id" TEXT;

-- CreateTable
CREATE TABLE "employees" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "full_name" TEXT NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "base_salary" DECIMAL(12,2) NOT NULL,
    "salary_type" "EmployeeSalaryType" NOT NULL,
    "department" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_months" (
    "id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "status" "HRMonthStatus" NOT NULL DEFAULT 'DRAFT',
    "submitted_by" TEXT,
    "submitted_at" TIMESTAMP(3),
    "locked_by" TEXT,
    "locked_at" TIMESTAMP(3),

    CONSTRAINT "hr_months_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_attendance" (
    "id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "status" "AttendanceStatus" NOT NULL,
    "minutes_late" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "created_by" TEXT NOT NULL,

    CONSTRAINT "hr_attendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_leaves" (
    "id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "from_date" DATE NOT NULL,
    "to_date" DATE NOT NULL,
    "leave_type" "LeaveType" NOT NULL,
    "notes" TEXT,
    "created_by" TEXT NOT NULL,

    CONSTRAINT "hr_leaves_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_deductions" (
    "id" TEXT NOT NULL,
    "hr_month_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "type" "DeductionType" NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "reason" TEXT NOT NULL,
    "created_by" TEXT NOT NULL,

    CONSTRAINT "hr_deductions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounting_purchases" (
    "id" TEXT NOT NULL,
    "vendor_name" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "total_amount" DECIMAL(12,2) NOT NULL,
    "notes" TEXT,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "accounting_purchases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounting_purchase_items" (
    "id" TEXT NOT NULL,
    "purchase_id" TEXT NOT NULL,
    "item_name" TEXT NOT NULL,
    "qty" DECIMAL(10,2) NOT NULL,
    "unit_price" DECIMAL(12,2) NOT NULL,
    "line_total" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "accounting_purchase_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounting_expenses" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "notes" TEXT,
    "created_by" TEXT NOT NULL,

    CONSTRAINT "accounting_expenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounting_transfers" (
    "id" TEXT NOT NULL,
    "type" "TransferType" NOT NULL,
    "reference_id" TEXT,
    "amount" DECIMAL(12,2) NOT NULL,
    "method" "TransferMethod" NOT NULL,
    "date" DATE NOT NULL,
    "notes" TEXT,
    "created_by" TEXT NOT NULL,

    CONSTRAINT "accounting_transfers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounting_closings" (
    "id" TEXT NOT NULL,
    "closing_type" "ClosingType" NOT NULL,
    "period_from" DATE NOT NULL,
    "period_to" DATE NOT NULL,
    "expected_amount" DECIMAL(12,2) NOT NULL,
    "actual_amount" DECIMAL(12,2) NOT NULL,
    "delta_amount" DECIMAL(12,2) NOT NULL,
    "notes" TEXT,
    "created_by" TEXT NOT NULL,

    CONSTRAINT "accounting_closings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payroll_runs" (
    "id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "status" "PayrollStatus" NOT NULL DEFAULT 'DRAFT',
    "calculated_by" TEXT,
    "calculated_at" TIMESTAMP(3),
    "approved_by" TEXT,
    "approved_at" TIMESTAMP(3),
    "paid_by" TEXT,
    "paid_at" TIMESTAMP(3),

    CONSTRAINT "payroll_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payroll_items" (
    "id" TEXT NOT NULL,
    "payroll_run_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "base_salary" DECIMAL(12,2) NOT NULL,
    "total_deductions" DECIMAL(12,2) NOT NULL,
    "adjustments" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "net_salary" DECIMAL(12,2) NOT NULL,
    "breakdown_json" JSONB NOT NULL,

    CONSTRAINT "payroll_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ticket_reasons" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "TicketReasonCategory" NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "default_assign_role" "UserRole",
    "default_priority" "Priority",
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ticket_reasons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "integration_clients" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "integration_clients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "integration_api_keys" (
    "id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "key_hash" TEXT NOT NULL,
    "scopes" TEXT[],
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "integration_api_keys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "integration_inbox" (
    "id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "external_id" TEXT NOT NULL,
    "ticket_id" TEXT,
    "payload_json" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "integration_inbox_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "integration_routing_rules" (
    "id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "source" TEXT,
    "issue_type" "IssueType",
    "priority_override" "Priority",
    "assign_role" "UserRole",
    "assign_user_id" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "integration_routing_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "integration_settings" (
    "id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "default_assign_role" "UserRole",
    "default_assign_user_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "integration_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webhook_subscriptions" (
    "id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "target_url" TEXT NOT NULL,
    "secret" TEXT NOT NULL,
    "events" "EventType"[],
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "webhook_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webhook_deliveries" (
    "id" TEXT NOT NULL,
    "subscription_id" TEXT NOT NULL,
    "event_type" "EventType" NOT NULL,
    "payload_json" JSONB NOT NULL,
    "status" "WebhookDeliveryStatus" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "last_error" TEXT,
    "next_retry_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "webhook_deliveries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "integration_request_logs" (
    "id" TEXT NOT NULL,
    "client_id" TEXT,
    "api_key_id" TEXT,
    "endpoint" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "status_code" INTEGER NOT NULL,
    "latency_ms" INTEGER NOT NULL,
    "request_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "integration_request_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "integration_audit_logs" (
    "id" TEXT NOT NULL,
    "actor_user_id" TEXT,
    "action" TEXT NOT NULL,
    "meta_json" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "integration_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "employees_code_key" ON "employees"("code");

-- CreateIndex
CREATE UNIQUE INDEX "hr_months_year_month_key" ON "hr_months"("year", "month");

-- CreateIndex
CREATE UNIQUE INDEX "hr_attendance_employee_id_date_key" ON "hr_attendance"("employee_id", "date");

-- CreateIndex
CREATE INDEX "hr_deductions_hr_month_id_idx" ON "hr_deductions"("hr_month_id");

-- CreateIndex
CREATE INDEX "hr_deductions_employee_id_idx" ON "hr_deductions"("employee_id");

-- CreateIndex
CREATE UNIQUE INDEX "payroll_runs_year_month_key" ON "payroll_runs"("year", "month");

-- CreateIndex
CREATE UNIQUE INDEX "payroll_items_payroll_run_id_employee_id_key" ON "payroll_items"("payroll_run_id", "employee_id");

-- CreateIndex
CREATE UNIQUE INDEX "ticket_reasons_name_key" ON "ticket_reasons"("name");

-- CreateIndex
CREATE INDEX "ticket_reasons_is_active_idx" ON "ticket_reasons"("is_active");

-- CreateIndex
CREATE INDEX "ticket_reasons_sort_order_idx" ON "ticket_reasons"("sort_order");

-- CreateIndex
CREATE INDEX "integration_inbox_created_at_idx" ON "integration_inbox"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "integration_inbox_client_id_source_external_id_key" ON "integration_inbox"("client_id", "source", "external_id");

-- CreateIndex
CREATE UNIQUE INDEX "integration_settings_client_id_key" ON "integration_settings"("client_id");

-- CreateIndex
CREATE INDEX "webhook_deliveries_status_idx" ON "webhook_deliveries"("status");

-- CreateIndex
CREATE INDEX "webhook_deliveries_next_retry_at_idx" ON "webhook_deliveries"("next_retry_at");

-- CreateIndex
CREATE UNIQUE INDEX "integration_request_logs_request_id_key" ON "integration_request_logs"("request_id");

-- CreateIndex
CREATE INDEX "integration_request_logs_client_id_idx" ON "integration_request_logs"("client_id");

-- CreateIndex
CREATE INDEX "integration_request_logs_created_at_idx" ON "integration_request_logs"("created_at");

-- CreateIndex
CREATE INDEX "integration_audit_logs_created_at_idx" ON "integration_audit_logs"("created_at");

-- AddForeignKey
ALTER TABLE "hr_months" ADD CONSTRAINT "hr_months_submitted_by_fkey" FOREIGN KEY ("submitted_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_months" ADD CONSTRAINT "hr_months_locked_by_fkey" FOREIGN KEY ("locked_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_attendance" ADD CONSTRAINT "hr_attendance_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_attendance" ADD CONSTRAINT "hr_attendance_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_leaves" ADD CONSTRAINT "hr_leaves_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_leaves" ADD CONSTRAINT "hr_leaves_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_deductions" ADD CONSTRAINT "hr_deductions_hr_month_id_fkey" FOREIGN KEY ("hr_month_id") REFERENCES "hr_months"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_deductions" ADD CONSTRAINT "hr_deductions_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_deductions" ADD CONSTRAINT "hr_deductions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounting_purchases" ADD CONSTRAINT "accounting_purchases_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounting_purchase_items" ADD CONSTRAINT "accounting_purchase_items_purchase_id_fkey" FOREIGN KEY ("purchase_id") REFERENCES "accounting_purchases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounting_expenses" ADD CONSTRAINT "accounting_expenses_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounting_transfers" ADD CONSTRAINT "accounting_transfers_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounting_closings" ADD CONSTRAINT "accounting_closings_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll_items" ADD CONSTRAINT "payroll_items_payroll_run_id_fkey" FOREIGN KEY ("payroll_run_id") REFERENCES "payroll_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll_items" ADD CONSTRAINT "payroll_items_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_reason_id_fkey" FOREIGN KEY ("reason_id") REFERENCES "ticket_reasons"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "integration_api_keys" ADD CONSTRAINT "integration_api_keys_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "integration_clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "integration_inbox" ADD CONSTRAINT "integration_inbox_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "integration_clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "integration_routing_rules" ADD CONSTRAINT "integration_routing_rules_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "integration_clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "integration_settings" ADD CONSTRAINT "integration_settings_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "integration_clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "webhook_subscriptions" ADD CONSTRAINT "webhook_subscriptions_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "integration_clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "webhook_deliveries" ADD CONSTRAINT "webhook_deliveries_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "webhook_subscriptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "integration_request_logs" ADD CONSTRAINT "integration_request_logs_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "integration_clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "integration_request_logs" ADD CONSTRAINT "integration_request_logs_api_key_id_fkey" FOREIGN KEY ("api_key_id") REFERENCES "integration_api_keys"("id") ON DELETE SET NULL ON UPDATE CASCADE;

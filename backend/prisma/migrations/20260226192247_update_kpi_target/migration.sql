-- CreateTable
CREATE TABLE "hr_months" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "submitted_by" TEXT,
    "submitted_at" DATETIME,
    "locked_by" TEXT,
    "locked_at" DATETIME,
    CONSTRAINT "hr_months_submitted_by_fkey" FOREIGN KEY ("submitted_by") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "hr_months_locked_by_fkey" FOREIGN KEY ("locked_by") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "hr_attendance" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "employee_id" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "status" TEXT NOT NULL,
    "minutes_late" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "created_by" TEXT NOT NULL,
    CONSTRAINT "hr_attendance_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "hr_attendance_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "hr_leaves" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "employee_id" TEXT NOT NULL,
    "from_date" DATETIME NOT NULL,
    "to_date" DATETIME NOT NULL,
    "leave_type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "created_by" TEXT NOT NULL,
    CONSTRAINT "hr_leaves_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "hr_leaves_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "departments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "employees" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT,
    "full_name" TEXT NOT NULL,
    "email" TEXT,
    "user_id" TEXT,
    "start_date" DATETIME NOT NULL,
    "end_date" DATETIME,
    "base_salary" DECIMAL NOT NULL,
    "salary_type" TEXT NOT NULL,
    "manager_id" TEXT,
    "department_id" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "employees_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "employees_manager_id_fkey" FOREIGN KEY ("manager_id") REFERENCES "employees" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "employees_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "hr_adjustments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "employee_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" DECIMAL NOT NULL,
    "date" DATETIME NOT NULL,
    "reason" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "hr_adjustments_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "vendors" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "phone" TEXT
);

-- CreateTable
CREATE TABLE "accounting_purchases" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "vendor_id" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "total_amount" DECIMAL NOT NULL,
    "notes" TEXT,
    "created_by" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "accounting_purchases_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "accounting_purchases_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "vendor_deposits" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "vendor_id" TEXT NOT NULL,
    "amount" DECIMAL NOT NULL,
    "date" DATETIME NOT NULL,
    "profit_loss" DECIMAL,
    "notes" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "vendor_deposits_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "accounting_purchase_items" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "purchase_id" TEXT NOT NULL,
    "item_name" TEXT NOT NULL,
    "qty" DECIMAL NOT NULL,
    "unit_price" DECIMAL NOT NULL,
    "line_total" DECIMAL NOT NULL,
    CONSTRAINT "accounting_purchase_items_purchase_id_fkey" FOREIGN KEY ("purchase_id") REFERENCES "accounting_purchases" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "accounting_expenses" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "category" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "amount" DECIMAL NOT NULL,
    "notes" TEXT,
    "created_by" TEXT NOT NULL,
    CONSTRAINT "accounting_expenses_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "accounting_transfers" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "reference_id" TEXT,
    "amount" DECIMAL NOT NULL,
    "method" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "notes" TEXT,
    "created_by" TEXT NOT NULL,
    CONSTRAINT "accounting_transfers_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "accounting_closings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "closing_type" TEXT NOT NULL,
    "period_from" DATETIME NOT NULL,
    "period_to" DATETIME NOT NULL,
    "expected_amount" DECIMAL NOT NULL,
    "actual_amount" DECIMAL NOT NULL,
    "delta_amount" DECIMAL NOT NULL,
    "notes" TEXT,
    "created_by" TEXT NOT NULL,
    CONSTRAINT "accounting_closings_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "payroll_runs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "calculated_by" TEXT,
    "calculated_at" DATETIME,
    "approved_by" TEXT,
    "approved_at" DATETIME,
    "paid_by" TEXT,
    "paid_at" DATETIME
);

-- CreateTable
CREATE TABLE "payroll_items" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "payroll_run_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "base_salary" DECIMAL NOT NULL,
    "total_deductions" DECIMAL NOT NULL,
    "adjustments" DECIMAL NOT NULL DEFAULT 0,
    "net_salary" DECIMAL NOT NULL,
    "breakdown_json" TEXT NOT NULL,
    CONSTRAINT "payroll_items_payroll_run_id_fkey" FOREIGN KEY ("payroll_run_id") REFERENCES "payroll_runs" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "payroll_items_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ticket_reasons" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "default_assign_role" TEXT,
    "default_priority" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "tickets" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "order_number" TEXT NOT NULL,
    "courier_company" TEXT NOT NULL,
    "issue_type" TEXT NOT NULL,
    "priority" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "description" TEXT NOT NULL,
    "reason_id" TEXT,
    "created_by" TEXT NOT NULL,
    "assigned_to" TEXT,
    "resolved_at" DATETIME,
    "closed_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "deleted_at" DATETIME,
    CONSTRAINT "tickets_reason_id_fkey" FOREIGN KEY ("reason_id") REFERENCES "ticket_reasons" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "tickets_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "tickets_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ticket_messages" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ticket_id" TEXT NOT NULL,
    "sender_id" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ticket_messages_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "tickets" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ticket_messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "link" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ticket_events" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ticket_id" TEXT NOT NULL,
    "actor_id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "meta" TEXT NOT NULL DEFAULT '{}',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ticket_events_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "tickets" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ticket_events_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires_at" DATETIME NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "integration_clients" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "integration_api_keys" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "client_id" TEXT NOT NULL,
    "key_hash" TEXT NOT NULL,
    "scopes" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_used_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "integration_api_keys_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "integration_clients" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "integration_inbox" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "client_id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "external_id" TEXT NOT NULL,
    "ticket_id" TEXT,
    "payload_json" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "integration_inbox_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "integration_clients" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "integration_inbox_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "tickets" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "integration_routing_rules" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "client_id" TEXT NOT NULL,
    "source" TEXT,
    "issue_type" TEXT,
    "priority_override" TEXT,
    "assign_role" TEXT,
    "assign_user_id" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "integration_routing_rules_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "integration_clients" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "integration_settings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "client_id" TEXT NOT NULL,
    "default_assign_role" TEXT,
    "default_assign_user_id" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "integration_settings_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "integration_clients" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "webhook_subscriptions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "client_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "target_url" TEXT NOT NULL,
    "secret" TEXT NOT NULL,
    "events" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "webhook_subscriptions_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "integration_clients" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "webhook_deliveries" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "subscription_id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "payload_json" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "last_error" TEXT,
    "next_retry_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "webhook_deliveries_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "webhook_subscriptions" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "integration_request_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "client_id" TEXT,
    "api_key_id" TEXT,
    "endpoint" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "status_code" INTEGER NOT NULL,
    "latency_ms" INTEGER NOT NULL,
    "request_id" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "integration_request_logs_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "integration_clients" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "integration_request_logs_api_key_id_fkey" FOREIGN KEY ("api_key_id") REFERENCES "integration_api_keys" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "shipping_companies" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true
);

-- CreateTable
CREATE TABLE "orders" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "order_number" TEXT NOT NULL,
    "customer_name" TEXT NOT NULL,
    "shipping_company_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "orders_shipping_company_id_fkey" FOREIGN KEY ("shipping_company_id") REFERENCES "shipping_companies" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "integration_audit_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "actor_user_id" TEXT,
    "action" TEXT NOT NULL,
    "meta_json" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "kpi_targets" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "employee_id" TEXT NOT NULL,
    "manager_id" TEXT NOT NULL,
    "department_id" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "metric_name" TEXT NOT NULL,
    "target_value" DECIMAL NOT NULL,
    "weight" DECIMAL NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "kpi_targets_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "kpi_targets_manager_id_fkey" FOREIGN KEY ("manager_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "kpi_targets_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "kpi_actuals" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "metric_name" TEXT NOT NULL,
    "period_key" TEXT NOT NULL,
    "actual_value" DECIMAL NOT NULL,
    "score" DECIMAL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "kpi_actuals_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "employee_issues" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "employee_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT,
    "date" DATETIME NOT NULL,
    "severity" TEXT NOT NULL,
    "deduction_points" DECIMAL NOT NULL DEFAULT 0,
    "created_by" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "employee_issues_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "employee_issues_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "kpi_scores" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "employee_id" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "efficiency_score" DECIMAL NOT NULL DEFAULT 0,
    "quality_score" DECIMAL NOT NULL DEFAULT 0,
    "behavior_score" DECIMAL NOT NULL DEFAULT 0,
    "punctuality_score" DECIMAL NOT NULL DEFAULT 0,
    "total_score" DECIMAL NOT NULL DEFAULT 0,
    "points_awarded" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "kpi_scores_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "gamification_badges" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "condition_type" TEXT NOT NULL,
    "condition_value" INTEGER NOT NULL,
    "xp_bonus" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "user_badges" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "badge_id" TEXT NOT NULL,
    "earned_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "user_badges_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "user_badges_badge_id_fkey" FOREIGN KEY ("badge_id") REFERENCES "gamification_badges" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "gamification_points" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "gamification_points_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "gamification_events" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 0,
    "meta_json" TEXT DEFAULT '{}',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "gamification_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "missions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "role_scope" TEXT,
    "department_id" TEXT,
    "points" INTEGER NOT NULL,
    "target_value" DECIMAL NOT NULL,
    "metric_key" TEXT NOT NULL,
    "frequency" TEXT NOT NULL DEFAULT 'DAILY',
    "start_date" DATETIME,
    "end_date" DATETIME,
    "created_by" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "missions_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "missions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "mission_assignments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "mission_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "progress_value" DECIMAL NOT NULL DEFAULT 0,
    "completed_at" DATETIME,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "mission_assignments_mission_id_fkey" FOREIGN KEY ("mission_id") REFERENCES "missions" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "mission_assignments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "streaks" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "current_count" INTEGER NOT NULL DEFAULT 0,
    "best_count" INTEGER NOT NULL DEFAULT 0,
    "last_hit_date" DATETIME,
    CONSTRAINT "streaks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "rewards" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "cost_points" INTEGER NOT NULL,
    "role_scope" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "reward_redemptions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reward_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'REQUESTED',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "reward_redemptions_reward_id_fkey" FOREIGN KEY ("reward_id") REFERENCES "rewards" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "reward_redemptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "hr_months_year_month_key" ON "hr_months"("year", "month");

-- CreateIndex
CREATE UNIQUE INDEX "hr_attendance_employee_id_date_key" ON "hr_attendance"("employee_id", "date");

-- CreateIndex
CREATE UNIQUE INDEX "departments_name_key" ON "departments"("name");

-- CreateIndex
CREATE UNIQUE INDEX "employees_code_key" ON "employees"("code");

-- CreateIndex
CREATE UNIQUE INDEX "employees_email_key" ON "employees"("email");

-- CreateIndex
CREATE UNIQUE INDEX "employees_user_id_key" ON "employees"("user_id");

-- CreateIndex
CREATE INDEX "hr_adjustments_employee_id_idx" ON "hr_adjustments"("employee_id");

-- CreateIndex
CREATE UNIQUE INDEX "vendors_name_key" ON "vendors"("name");

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
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "tickets_status_idx" ON "tickets"("status");

-- CreateIndex
CREATE INDEX "tickets_priority_idx" ON "tickets"("priority");

-- CreateIndex
CREATE INDEX "tickets_assigned_to_idx" ON "tickets"("assigned_to");

-- CreateIndex
CREATE INDEX "tickets_created_by_idx" ON "tickets"("created_by");

-- CreateIndex
CREATE INDEX "tickets_deleted_at_idx" ON "tickets"("deleted_at");

-- CreateIndex
CREATE INDEX "ticket_messages_ticket_id_idx" ON "ticket_messages"("ticket_id");

-- CreateIndex
CREATE INDEX "notifications_user_id_is_read_idx" ON "notifications"("user_id", "is_read");

-- CreateIndex
CREATE INDEX "ticket_events_ticket_id_idx" ON "ticket_events"("ticket_id");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_key" ON "refresh_tokens"("token");

-- CreateIndex
CREATE INDEX "refresh_tokens_user_id_idx" ON "refresh_tokens"("user_id");

-- CreateIndex
CREATE INDEX "refresh_tokens_expires_at_idx" ON "refresh_tokens"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "integration_inbox_ticket_id_key" ON "integration_inbox"("ticket_id");

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
CREATE UNIQUE INDEX "shipping_companies_name_key" ON "shipping_companies"("name");

-- CreateIndex
CREATE UNIQUE INDEX "orders_order_number_key" ON "orders"("order_number");

-- CreateIndex
CREATE INDEX "integration_audit_logs_created_at_idx" ON "integration_audit_logs"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "kpi_actuals_user_id_metric_name_period_key_key" ON "kpi_actuals"("user_id", "metric_name", "period_key");

-- CreateIndex
CREATE UNIQUE INDEX "kpi_scores_employee_id_date_key" ON "kpi_scores"("employee_id", "date");

-- CreateIndex
CREATE UNIQUE INDEX "gamification_badges_name_key" ON "gamification_badges"("name");

-- CreateIndex
CREATE UNIQUE INDEX "user_badges_user_id_badge_id_key" ON "user_badges"("user_id", "badge_id");

-- CreateIndex
CREATE INDEX "gamification_points_user_id_idx" ON "gamification_points"("user_id");

-- CreateIndex
CREATE INDEX "gamification_events_user_id_idx" ON "gamification_events"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "mission_assignments_mission_id_user_id_key" ON "mission_assignments"("mission_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "streaks_user_id_key_key" ON "streaks"("user_id", "key");

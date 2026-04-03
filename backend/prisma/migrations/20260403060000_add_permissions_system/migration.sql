-- AlterTable
ALTER TABLE "users" ADD COLUMN "email_normalized" TEXT;

-- CreateTable
CREATE TABLE "employee_comp_plans" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "employee_id" TEXT NOT NULL,
    "fixed_ratio" INTEGER NOT NULL DEFAULT 100,
    "kpi_ratio" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "employee_comp_plans_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "payroll_kpi_results" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "employee_id" TEXT NOT NULL,
    "period_type" TEXT NOT NULL,
    "period_key" TEXT NOT NULL,
    "base_salary" DECIMAL NOT NULL,
    "fixed_pay" DECIMAL NOT NULL,
    "kpi_pool" DECIMAL NOT NULL,
    "kpi_score" DECIMAL NOT NULL,
    "kpi_pay" DECIMAL NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "payroll_kpi_results_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "permissions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "description" TEXT,
    "domain" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "role_permissions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "role" TEXT NOT NULL,
    "permission_id" TEXT NOT NULL,
    CONSTRAINT "role_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "permissions" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "user_permissions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "permission_id" TEXT NOT NULL,
    "effect" TEXT NOT NULL DEFAULT 'ALLOW',
    CONSTRAINT "user_permissions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "user_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "permissions" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "feature_flags" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "is_enabled" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT,
    "updated_at" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_kpi_actuals" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "employee_id" TEXT NOT NULL,
    "metric_name" TEXT NOT NULL,
    "frequency" TEXT NOT NULL DEFAULT 'DAILY',
    "period_key" TEXT NOT NULL,
    "actual_value" DECIMAL NOT NULL,
    "score" DECIMAL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "userId" TEXT,
    CONSTRAINT "kpi_actuals_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "kpi_actuals_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_kpi_actuals" ("actual_value", "created_at", "employee_id", "id", "metric_name", "period_key", "score", "updated_at", "userId") SELECT "actual_value", "created_at", "employee_id", "id", "metric_name", "period_key", "score", "updated_at", "userId" FROM "kpi_actuals";
DROP TABLE "kpi_actuals";
ALTER TABLE "new_kpi_actuals" RENAME TO "kpi_actuals";
CREATE UNIQUE INDEX "kpi_actuals_employee_id_metric_name_frequency_period_key_key" ON "kpi_actuals"("employee_id", "metric_name", "frequency", "period_key");
CREATE TABLE "new_kpi_targets" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "employee_id" TEXT NOT NULL,
    "manager_id" TEXT NOT NULL,
    "department_id" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "metric_name" TEXT NOT NULL,
    "metric_label" TEXT NOT NULL DEFAULT '',
    "target_value" DECIMAL NOT NULL,
    "weight" DECIMAL NOT NULL,
    "frequency" TEXT NOT NULL DEFAULT 'DAILY',
    "period_key" TEXT NOT NULL DEFAULT '',
    "hourly_plan_json" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "kpi_targets_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "kpi_targets_manager_id_fkey" FOREIGN KEY ("manager_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "kpi_targets_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_kpi_targets" ("created_at", "date", "department_id", "employee_id", "frequency", "hourly_plan_json", "id", "manager_id", "metric_name", "period_key", "target_value", "updated_at", "weight") SELECT "created_at", "date", "department_id", "employee_id", "frequency", "hourly_plan_json", "id", "manager_id", "metric_name", "period_key", "target_value", "updated_at", "weight" FROM "kpi_targets";
DROP TABLE "kpi_targets";
ALTER TABLE "new_kpi_targets" RENAME TO "kpi_targets";
CREATE TABLE "new_payroll_items" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "payroll_run_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "base_salary" DECIMAL NOT NULL,
    "fixed_pay" DECIMAL NOT NULL DEFAULT 0,
    "kpi_pay" DECIMAL NOT NULL DEFAULT 0,
    "total_deductions" DECIMAL NOT NULL,
    "adjustments" DECIMAL NOT NULL DEFAULT 0,
    "net_salary" DECIMAL NOT NULL,
    "net_pay" DECIMAL NOT NULL DEFAULT 0,
    "breakdown_json" TEXT NOT NULL,
    CONSTRAINT "payroll_items_payroll_run_id_fkey" FOREIGN KEY ("payroll_run_id") REFERENCES "payroll_runs" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "payroll_items_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_payroll_items" ("adjustments", "base_salary", "breakdown_json", "employee_id", "id", "net_salary", "payroll_run_id", "total_deductions") SELECT "adjustments", "base_salary", "breakdown_json", "employee_id", "id", "net_salary", "payroll_run_id", "total_deductions" FROM "payroll_items";
DROP TABLE "payroll_items";
ALTER TABLE "new_payroll_items" RENAME TO "payroll_items";
CREATE UNIQUE INDEX "payroll_items_payroll_run_id_employee_id_key" ON "payroll_items"("payroll_run_id", "employee_id");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "employee_comp_plans_employee_id_key" ON "employee_comp_plans"("employee_id");

-- CreateIndex
CREATE UNIQUE INDEX "payroll_kpi_results_employee_id_period_type_period_key_key" ON "payroll_kpi_results"("employee_id", "period_type", "period_key");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_key_key" ON "permissions"("key");

-- CreateIndex
CREATE UNIQUE INDEX "role_permissions_role_permission_id_key" ON "role_permissions"("role", "permission_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_permissions_user_id_permission_id_key" ON "user_permissions"("user_id", "permission_id");

-- CreateIndex
CREATE UNIQUE INDEX "feature_flags_key_key" ON "feature_flags"("key");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_normalized_key" ON "users"("email_normalized");


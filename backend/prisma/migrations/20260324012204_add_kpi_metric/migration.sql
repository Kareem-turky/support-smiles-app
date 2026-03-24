/*
  Warnings:

  - You are about to drop the column `user_id` on the `kpi_actuals` table. All the data in the column will be lost.
  - Added the required column `employee_id` to the `kpi_actuals` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "review_deductions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "employee_id" TEXT NOT NULL,
    "department_id" TEXT NOT NULL,
    "period_key" TEXT NOT NULL,
    "reason_key" TEXT NOT NULL,
    "details_json" TEXT NOT NULL DEFAULT '{}',
    "suggested_amount" DECIMAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'REVIEW_NEEDED',
    "created_by_system" BOOLEAN NOT NULL DEFAULT true,
    "reviewed_by_user_id" TEXT,
    "reviewed_at" DATETIME,
    "review_note" TEXT,
    "hr_adjustment_id" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "review_deductions_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "review_deductions_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "review_deductions_reviewed_by_user_id_fkey" FOREIGN KEY ("reviewed_by_user_id") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "review_deductions_hr_adjustment_id_fkey" FOREIGN KEY ("hr_adjustment_id") REFERENCES "hr_adjustments" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "kpi_metrics" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_employee_issues" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "employee_id" TEXT NOT NULL,
    "department_id" TEXT NOT NULL DEFAULT '',
    "type" TEXT NOT NULL,
    "category_key" TEXT NOT NULL DEFAULT 'OTHER',
    "description" TEXT,
    "date" DATETIME NOT NULL,
    "severity" TEXT NOT NULL,
    "deduction_points" DECIMAL NOT NULL DEFAULT 0,
    "created_by" TEXT NOT NULL,
    "reported_by_user_id" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "employee_issues_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "employee_issues_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "employee_issues_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "employee_issues_reported_by_user_id_fkey" FOREIGN KEY ("reported_by_user_id") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_employee_issues" ("created_at", "created_by", "date", "deduction_points", "description", "employee_id", "id", "severity", "type") SELECT "created_at", "created_by", "date", "deduction_points", "description", "employee_id", "id", "severity", "type" FROM "employee_issues";
DROP TABLE "employee_issues";
ALTER TABLE "new_employee_issues" RENAME TO "employee_issues";
CREATE TABLE "new_kpi_actuals" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "employee_id" TEXT NOT NULL,
    "metric_name" TEXT NOT NULL,
    "period_key" TEXT NOT NULL,
    "actual_value" DECIMAL NOT NULL,
    "score" DECIMAL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "userId" TEXT,
    CONSTRAINT "kpi_actuals_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "kpi_actuals_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_kpi_actuals" ("actual_value", "created_at", "id", "metric_name", "period_key", "score", "updated_at") SELECT "actual_value", "created_at", "id", "metric_name", "period_key", "score", "updated_at" FROM "kpi_actuals";
DROP TABLE "kpi_actuals";
ALTER TABLE "new_kpi_actuals" RENAME TO "kpi_actuals";
CREATE UNIQUE INDEX "kpi_actuals_employee_id_metric_name_period_key_key" ON "kpi_actuals"("employee_id", "metric_name", "period_key");
CREATE TABLE "new_kpi_scores" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "employee_id" TEXT NOT NULL,
    "department_id" TEXT NOT NULL DEFAULT '',
    "date" DATETIME NOT NULL,
    "period_key" TEXT NOT NULL DEFAULT '',
    "efficiency_score" DECIMAL NOT NULL DEFAULT 0,
    "quality_score" DECIMAL NOT NULL DEFAULT 0,
    "behavior_score" DECIMAL NOT NULL DEFAULT 0,
    "punctuality_score" DECIMAL NOT NULL DEFAULT 0,
    "total_score" DECIMAL NOT NULL DEFAULT 0,
    "points_awarded" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "kpi_scores_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "kpi_scores_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_kpi_scores" ("behavior_score", "created_at", "date", "efficiency_score", "employee_id", "id", "points_awarded", "punctuality_score", "quality_score", "total_score", "updated_at") SELECT "behavior_score", "created_at", "date", "efficiency_score", "employee_id", "id", "points_awarded", "punctuality_score", "quality_score", "total_score", "updated_at" FROM "kpi_scores";
DROP TABLE "kpi_scores";
ALTER TABLE "new_kpi_scores" RENAME TO "kpi_scores";
CREATE UNIQUE INDEX "kpi_scores_employee_id_period_key_key" ON "kpi_scores"("employee_id", "period_key");
CREATE TABLE "new_kpi_targets" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "employee_id" TEXT NOT NULL,
    "manager_id" TEXT NOT NULL,
    "department_id" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "metric_name" TEXT NOT NULL,
    "target_value" DECIMAL NOT NULL,
    "weight" DECIMAL NOT NULL,
    "frequency" TEXT NOT NULL DEFAULT 'DAILY',
    "period_key" TEXT NOT NULL DEFAULT '',
    "hourly_plan_json" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "kpi_targets_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "kpi_targets_manager_id_fkey" FOREIGN KEY ("manager_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "kpi_targets_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_kpi_targets" ("created_at", "date", "department_id", "employee_id", "id", "manager_id", "metric_name", "target_value", "updated_at", "weight") SELECT "created_at", "date", "department_id", "employee_id", "id", "manager_id", "metric_name", "target_value", "updated_at", "weight" FROM "kpi_targets";
DROP TABLE "kpi_targets";
ALTER TABLE "new_kpi_targets" RENAME TO "kpi_targets";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "review_deductions_hr_adjustment_id_key" ON "review_deductions"("hr_adjustment_id");

-- CreateIndex
CREATE UNIQUE INDEX "kpi_metrics_name_key" ON "kpi_metrics"("name");

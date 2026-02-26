-- CreateEnum
CREATE TYPE "StudyPlanStatus" AS ENUM ('draft', 'pending', 'active', 'paused', 'completed', 'cancelled');

-- CreateEnum
CREATE TYPE "TaskType" AS ENUM ('reading', 'video', 'assignment', 'quiz', 'practice');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('pending', 'in_progress', 'completed');

-- CreateTable
CREATE TABLE "study_plans" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "tutor_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "subject" TEXT NOT NULL,
    "difficulty_level" TEXT NOT NULL,
    "status" "StudyPlanStatus" NOT NULL DEFAULT 'pending',
    "duration_weeks" INTEGER,
    "time_commitment" TEXT,
    "learning_goals" TEXT,
    "progress_percentage" INTEGER NOT NULL DEFAULT 0,
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "study_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "modules" (
    "id" TEXT NOT NULL,
    "study_plan_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "week_number" INTEGER,
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "start_date" TIMESTAMP(3),
    "end_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "modules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tasks" (
    "id" TEXT NOT NULL,
    "module_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "task_type" "TaskType" NOT NULL DEFAULT 'reading',
    "status" "TaskStatus" NOT NULL DEFAULT 'pending',
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "due_date" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "study_plan_resources" (
    "id" TEXT NOT NULL,
    "study_plan_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "resource_type" TEXT NOT NULL,
    "file_url" TEXT,
    "external_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "study_plan_resources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "study_plan_progress" (
    "id" TEXT NOT NULL,
    "study_plan_id" TEXT NOT NULL,
    "task_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "completed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "score" DOUBLE PRECISION,
    "notes" TEXT,

    CONSTRAINT "study_plan_progress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "study_plans_student_id_idx" ON "study_plans"("student_id");

-- CreateIndex
CREATE INDEX "study_plans_tutor_id_idx" ON "study_plans"("tutor_id");

-- CreateIndex
CREATE INDEX "study_plans_status_idx" ON "study_plans"("status");

-- CreateIndex
CREATE INDEX "modules_study_plan_id_idx" ON "modules"("study_plan_id");

-- CreateIndex
CREATE INDEX "modules_order_index_idx" ON "modules"("order_index");

-- CreateIndex
CREATE INDEX "tasks_module_id_idx" ON "tasks"("module_id");

-- CreateIndex
CREATE INDEX "tasks_status_idx" ON "tasks"("status");

-- CreateIndex
CREATE INDEX "tasks_order_index_idx" ON "tasks"("order_index");

-- CreateIndex
CREATE INDEX "study_plan_resources_study_plan_id_idx" ON "study_plan_resources"("study_plan_id");

-- CreateIndex
CREATE INDEX "study_plan_progress_study_plan_id_idx" ON "study_plan_progress"("study_plan_id");

-- CreateIndex
CREATE INDEX "study_plan_progress_task_id_idx" ON "study_plan_progress"("task_id");

-- CreateIndex
CREATE INDEX "study_plan_progress_student_id_idx" ON "study_plan_progress"("student_id");

-- CreateIndex
CREATE UNIQUE INDEX "study_plan_progress_study_plan_id_task_id_student_id_key" ON "study_plan_progress"("study_plan_id", "task_id", "student_id");

-- AddForeignKey
ALTER TABLE "study_plans" ADD CONSTRAINT "study_plans_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "study_plans" ADD CONSTRAINT "study_plans_tutor_id_fkey" FOREIGN KEY ("tutor_id") REFERENCES "tutors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "modules" ADD CONSTRAINT "modules_study_plan_id_fkey" FOREIGN KEY ("study_plan_id") REFERENCES "study_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_module_id_fkey" FOREIGN KEY ("module_id") REFERENCES "modules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "study_plan_resources" ADD CONSTRAINT "study_plan_resources_study_plan_id_fkey" FOREIGN KEY ("study_plan_id") REFERENCES "study_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "study_plan_progress" ADD CONSTRAINT "study_plan_progress_study_plan_id_fkey" FOREIGN KEY ("study_plan_id") REFERENCES "study_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "study_plan_progress" ADD CONSTRAINT "study_plan_progress_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

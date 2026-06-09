-- Academic Planning Support (APS)
-- Updated database schema for PostgreSQL
-- Generated from prisma/schema.prisma on 2026-06-03
-- Usage:
--   1. Create a PostgreSQL database.
--   2. Run this SQL file.
--   3. For complete demo data from the application, run: npm run prisma:seed

CREATE SCHEMA IF NOT EXISTS "public";

DO $$ BEGIN
  CREATE TYPE "UserRole" AS ENUM ('STUDENT', 'ADMIN');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "ParseStatus" AS ENUM ('PENDING', 'NEEDS_REVIEW', 'CONFIRMED', 'FAILED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "PlanTrack" AS ENUM ('RESEARCH', 'COOP');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "User" (
  "id" SERIAL NOT NULL,
  "googleId" TEXT,
  "email" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "role" "UserRole" NOT NULL DEFAULT 'STUDENT',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Program" (
  "id" SERIAL NOT NULL,
  "code" TEXT NOT NULL,
  "nameTh" TEXT NOT NULL,
  "nameEn" TEXT NOT NULL,
  "academicYear" INTEGER NOT NULL,
  "totalCreditsMin" INTEGER NOT NULL,
  "honorFirstClassMin" DECIMAL(3,2) NOT NULL,
  "honorSecondClassMin" DECIMAL(3,2) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Program_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Course" (
  "id" SERIAL NOT NULL,
  "programId" INTEGER,
  "code" TEXT NOT NULL,
  "nameTh" TEXT NOT NULL,
  "nameEn" TEXT,
  "credits" INTEGER NOT NULL,
  "category" TEXT NOT NULL,
  "groupName" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Course_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ProgramStructure" (
  "id" SERIAL NOT NULL,
  "programId" INTEGER NOT NULL,
  "category" TEXT NOT NULL,
  "minCredits" INTEGER NOT NULL,
  "description" TEXT,
  CONSTRAINT "ProgramStructure_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Prerequisite" (
  "id" SERIAL NOT NULL,
  "courseId" INTEGER NOT NULL,
  "prereqCourseId" INTEGER NOT NULL,
  "isCorequisite" BOOLEAN NOT NULL DEFAULT false,
  "conditionNote" TEXT,
  CONSTRAINT "Prerequisite_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "StudyPlan" (
  "id" SERIAL NOT NULL,
  "programId" INTEGER NOT NULL,
  "courseId" INTEGER,
  "yearLevel" INTEGER NOT NULL,
  "semester" INTEGER NOT NULL,
  "track" "PlanTrack",
  "placeholder" TEXT,
  "credits" INTEGER NOT NULL,
  CONSTRAINT "StudyPlan_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "GradeMapping" (
  "gradeChar" TEXT NOT NULL,
  "gradePoint" DECIMAL(3,2) NOT NULL,
  "isPassing" BOOLEAN NOT NULL,
  "isAttempt" BOOLEAN NOT NULL,
  "isCredit" BOOLEAN NOT NULL,
  CONSTRAINT "GradeMapping_pkey" PRIMARY KEY ("gradeChar")
);

CREATE TABLE IF NOT EXISTS "StudentProgram" (
  "id" SERIAL NOT NULL,
  "userId" INTEGER NOT NULL,
  "programId" INTEGER NOT NULL,
  "studentCode" TEXT NOT NULL,
  "track" "PlanTrack" NOT NULL DEFAULT 'RESEARCH',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "StudentProgram_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "TranscriptUpload" (
  "id" SERIAL NOT NULL,
  "userId" INTEGER NOT NULL,
  "fileName" TEXT NOT NULL,
  "parseStatus" "ParseStatus" NOT NULL DEFAULT 'PENDING',
  "warningText" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TranscriptUpload_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "StudentGrade" (
  "id" SERIAL NOT NULL,
  "userId" INTEGER NOT NULL,
  "uploadId" INTEGER,
  "courseId" INTEGER,
  "courseCode" TEXT NOT NULL,
  "courseName" TEXT NOT NULL,
  "credits" INTEGER NOT NULL,
  "gradeChar" TEXT NOT NULL,
  "semester" INTEGER NOT NULL,
  "academicYear" INTEGER NOT NULL,
  "sourceRow" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "StudentGrade_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "TranscriptSemesterSummary" (
  "id" SERIAL NOT NULL,
  "userId" INTEGER NOT NULL,
  "uploadId" INTEGER,
  "semester" INTEGER NOT NULL,
  "academicYear" INTEGER NOT NULL,
  "gpa" DECIMAL(3,2) NOT NULL,
  "gpax" DECIMAL(3,2) NOT NULL,
  "creditAttempt" DECIMAL(5,2) NOT NULL,
  "gradePoint" DECIMAL(7,2) NOT NULL,
  CONSTRAINT "TranscriptSemesterSummary_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "CourseOffering" (
  "id" SERIAL NOT NULL,
  "courseId" INTEGER NOT NULL,
  "academicYear" INTEGER NOT NULL,
  "semester" INTEGER NOT NULL,
  "isSummer" BOOLEAN NOT NULL DEFAULT false,
  CONSTRAINT "CourseOffering_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Rule" (
  "id" SERIAL NOT NULL,
  "programId" INTEGER,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Rule_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "AnalysisResult" (
  "id" SERIAL NOT NULL,
  "userId" INTEGER NOT NULL,
  "riskStatus" TEXT NOT NULL,
  "summary" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AnalysisResult_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Recommendation" (
  "id" SERIAL NOT NULL,
  "analysisResultId" INTEGER NOT NULL,
  "message" TEXT NOT NULL,
  "reason" TEXT NOT NULL,
  "priority" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Recommendation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "SimulationSession" (
  "id" SERIAL NOT NULL,
  "userId" INTEGER NOT NULL,
  "targetGpax" DECIMAL(3,2) NOT NULL,
  "resultGpax" DECIMAL(3,2),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SimulationSession_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "SimulationCourse" (
  "id" SERIAL NOT NULL,
  "simulationSessionId" INTEGER NOT NULL,
  "courseId" INTEGER,
  "courseCode" TEXT NOT NULL,
  "credits" INTEGER NOT NULL,
  "expectedGradeChar" TEXT NOT NULL,
  CONSTRAINT "SimulationCourse_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "User_googleId_key" ON "User"("googleId");
CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX IF NOT EXISTS "Program_code_key" ON "Program"("code");
CREATE UNIQUE INDEX IF NOT EXISTS "Course_programId_code_key" ON "Course"("programId", "code");
CREATE UNIQUE INDEX IF NOT EXISTS "Prerequisite_courseId_prereqCourseId_key" ON "Prerequisite"("courseId", "prereqCourseId");
CREATE UNIQUE INDEX IF NOT EXISTS "CourseOffering_courseId_academicYear_semester_key" ON "CourseOffering"("courseId", "academicYear", "semester");
CREATE UNIQUE INDEX IF NOT EXISTS "Rule_programId_code_key" ON "Rule"("programId", "code");

DO $$ BEGIN
  ALTER TABLE "Course" ADD CONSTRAINT "Course_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "ProgramStructure" ADD CONSTRAINT "ProgramStructure_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "Prerequisite" ADD CONSTRAINT "Prerequisite_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "Prerequisite" ADD CONSTRAINT "Prerequisite_prereqCourseId_fkey" FOREIGN KEY ("prereqCourseId") REFERENCES "Course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "StudyPlan" ADD CONSTRAINT "StudyPlan_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "StudyPlan" ADD CONSTRAINT "StudyPlan_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "StudentProgram" ADD CONSTRAINT "StudentProgram_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "StudentProgram" ADD CONSTRAINT "StudentProgram_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "TranscriptUpload" ADD CONSTRAINT "TranscriptUpload_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "StudentGrade" ADD CONSTRAINT "StudentGrade_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "StudentGrade" ADD CONSTRAINT "StudentGrade_uploadId_fkey" FOREIGN KEY ("uploadId") REFERENCES "TranscriptUpload"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "StudentGrade" ADD CONSTRAINT "StudentGrade_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "TranscriptSemesterSummary" ADD CONSTRAINT "TranscriptSemesterSummary_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "TranscriptSemesterSummary" ADD CONSTRAINT "TranscriptSemesterSummary_uploadId_fkey" FOREIGN KEY ("uploadId") REFERENCES "TranscriptUpload"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "CourseOffering" ADD CONSTRAINT "CourseOffering_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "Rule" ADD CONSTRAINT "Rule_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "AnalysisResult" ADD CONSTRAINT "AnalysisResult_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "Recommendation" ADD CONSTRAINT "Recommendation_analysisResultId_fkey" FOREIGN KEY ("analysisResultId") REFERENCES "AnalysisResult"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "SimulationSession" ADD CONSTRAINT "SimulationSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "SimulationCourse" ADD CONSTRAINT "SimulationCourse_simulationSessionId_fkey" FOREIGN KEY ("simulationSessionId") REFERENCES "SimulationSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "SimulationCourse" ADD CONSTRAINT "SimulationCourse_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

INSERT INTO "GradeMapping" ("gradeChar", "gradePoint", "isPassing", "isAttempt", "isCredit")
VALUES
  ('A', 4.00, true, true, true),
  ('B+', 3.50, true, true, true),
  ('B', 3.00, true, true, true),
  ('C+', 2.50, true, true, true),
  ('C', 2.00, true, true, true),
  ('D+', 1.50, true, true, true),
  ('D', 1.00, true, true, true),
  ('F', 0.00, false, true, false),
  ('W', 0.00, false, false, false),
  ('S', 0.00, true, false, true),
  ('S*', 0.00, true, false, false)
ON CONFLICT ("gradeChar") DO UPDATE SET
  "gradePoint" = EXCLUDED."gradePoint",
  "isPassing" = EXCLUDED."isPassing",
  "isAttempt" = EXCLUDED."isAttempt",
  "isCredit" = EXCLUDED."isCredit";

INSERT INTO "Program" ("code", "nameTh", "nameEn", "academicYear", "totalCreditsMin", "honorFirstClassMin", "honorSecondClassMin", "updatedAt")
VALUES
  ('CS2565', 'วิทยาการคอมพิวเตอร์', 'Computer Science', 2565, 126, 3.60, 3.25, CURRENT_TIMESTAMP),
  ('IT2565', 'เทคโนโลยีสารสนเทศ', 'Information Technology', 2565, 133, 3.60, 3.25, CURRENT_TIMESTAMP)
ON CONFLICT ("code") DO UPDATE SET
  "nameTh" = EXCLUDED."nameTh",
  "nameEn" = EXCLUDED."nameEn",
  "academicYear" = EXCLUDED."academicYear",
  "totalCreditsMin" = EXCLUDED."totalCreditsMin",
  "honorFirstClassMin" = EXCLUDED."honorFirstClassMin",
  "honorSecondClassMin" = EXCLUDED."honorSecondClassMin",
  "updatedAt" = CURRENT_TIMESTAMP;

INSERT INTO "User" ("email", "name", "role", "updatedAt")
VALUES
  ('demo.student@su.ac.th', 'Demo Student', 'STUDENT', CURRENT_TIMESTAMP),
  ('admin@example.com', 'System Admin', 'ADMIN', CURRENT_TIMESTAMP)
ON CONFLICT ("email") DO UPDATE SET
  "name" = EXCLUDED."name",
  "role" = EXCLUDED."role",
  "updatedAt" = CURRENT_TIMESTAMP;

INSERT INTO "Rule" ("programId", "code", "name", "description", "updatedAt")
SELECT "id", 'GRADUATION_FORECAST', 'กติกาคาดการณ์วันจบ', 'ใช้รายวิชาที่ผ่านแล้ว รายวิชาที่ยังเหลือ วิชาบังคับก่อน วิชาเปิดแต่ละเทอม และจำนวนหน่วยกิตสูงสุดต่อเทอมในการคาดการณ์วันจบ', CURRENT_TIMESTAMP
FROM "Program"
WHERE "code" IN ('CS2565', 'IT2565')
ON CONFLICT ("programId", "code") DO UPDATE SET
  "name" = EXCLUDED."name",
  "description" = EXCLUDED."description",
  "updatedAt" = CURRENT_TIMESTAMP;

INSERT INTO "Rule" ("programId", "code", "name", "description", "updatedAt")
SELECT "id", 'PRO_STATUS', 'กติกาสถานะติดโปร', 'ใช้ GPAX, GPA ล่าสุด, จำนวนหน่วยกิตที่ผ่าน และผลกระทบจากวิชาตัวต่อในการประเมินสถานะปกติ โปรสูง โปรต่ำ หรือเสี่ยงโปรต่ำ', CURRENT_TIMESTAMP
FROM "Program"
WHERE "code" IN ('CS2565', 'IT2565')
ON CONFLICT ("programId", "code") DO UPDATE SET
  "name" = EXCLUDED."name",
  "description" = EXCLUDED."description",
  "updatedAt" = CURRENT_TIMESTAMP;

-- Important:
-- This SQL creates the updated database structure and minimal seed records.
-- The full course list, study plan, prerequisites, and course offerings are maintained by prisma/seed.ts.
-- Run "npm run prisma:seed" after applying this file to load the full demo dataset.

import { demoCourses, demoPrograms, demoStructures, gradeMappings } from "@/data/demo-data";
import { createGradeMap, getBestPassedAttempt, getCourseStatus, getGradeMapping } from "@/lib/analysis/status";
import type { CategoryProgress, Course, CourseStatus, GradeMapping, PrerequisiteImpact, Program, ProgramCode, ProgramStructure, RiskStatus, TranscriptCourse } from "@/lib/types";

export type CurriculumAuditData = {
  programs?: Program[];
  courses?: Course[];
  structures?: ProgramStructure[];
  gradeMappings?: GradeMapping[];
};

export function auditCurriculum(programCode: ProgramCode, transcriptCourses: TranscriptCourse[], data: CurriculumAuditData = {}) {
  const programs = data.programs ?? demoPrograms;
  const courses = data.courses ?? demoCourses;
  const structures = data.structures ?? demoStructures;
  const gradeMap = createGradeMap(data.gradeMappings ?? gradeMappings);
  const program = programs.find((item) => item.code === programCode);
  if (!program) throw new Error(`Unknown program: ${programCode}`);

  const requiredCourses = courses.filter((course) => !course.programCode || course.programCode === programCode);
  const courseStatuses: CourseStatus[] = requiredCourses.map((course) => {
    const attempts = transcriptCourses.filter((attempt) => attempt.courseCode === course.code);
    const best = getBestPassedAttempt(attempts, gradeMap);
    const status = getCourseStatus(attempts, gradeMap);

    return {
      courseCode: course.code,
      courseName: course.nameTh,
      category: course.category,
      credits: course.credits,
      status,
      bestGrade: best?.gradeChar,
      attempts,
      reason: explainCourseStatus(status, attempts, gradeMap)
    };
  });

  const categoryProgress = calculateCategoryProgress(programCode, transcriptCourses, courses, structures, gradeMap);
  const earnedCredits = calculateTranscriptEarnedCredits(transcriptCourses, gradeMap);
  const requiredMissingCredits = courseStatuses
    .filter((course) => course.status === "not_taken" || course.status === "failed" || course.status === "withdrawn")
    .reduce((total, course) => total + course.credits, 0);

  return {
    program,
    courseStatuses,
    categoryProgress,
    earnedCredits,
    missingCredits: requiredMissingCredits > 0 ? requiredMissingCredits : Math.max(program.totalCreditsMin - earnedCredits, 0)
  };
}

function calculateTranscriptEarnedCredits(transcriptCourses: TranscriptCourse[], gradeMap: Map<string, GradeMapping>) {
  const latestByCourse = new Map<string, TranscriptCourse>();

  for (const course of transcriptCourses) {
    latestByCourse.set(course.courseCode, course);
  }

  let earnedCredits = 0;

  for (const course of latestByCourse.values()) {
    const grade = getGradeMapping(course.gradeChar, gradeMap);
    if (grade.isPassing && grade.isCredit) {
      earnedCredits += course.credits;
    }
  }

  return earnedCredits;
}

function calculateCategoryProgress(
  programCode: ProgramCode,
  transcriptCourses: TranscriptCourse[],
  courses: Course[],
  structures: ProgramStructure[],
  gradeMap: Map<string, GradeMapping>
): CategoryProgress[] {
  const earnedByCategory = calculateTranscriptEarnedCreditsByCategory(transcriptCourses, courses, gradeMap);

  return structures
    .filter((structure) => structure.programCode === programCode)
    .map((structure) => {
      const earnedCredits = earnedByCategory.get(structure.category) ?? 0;

      return {
        category: structure.category,
        earnedCredits,
        requiredCredits: structure.minCredits,
        remainingCredits: Math.max(structure.minCredits - earnedCredits, 0)
      };
    });
}

function calculateTranscriptEarnedCreditsByCategory(
  transcriptCourses: TranscriptCourse[],
  courses: Course[],
  gradeMap: Map<string, GradeMapping>
) {
  const latestByCourse = new Map<string, TranscriptCourse>();
  const courseByCode = new Map(courses.map((course) => [course.code, course]));
  const earnedByCategory = new Map<string, number>();

  for (const course of transcriptCourses) {
    latestByCourse.set(course.courseCode, course);
  }

  for (const course of latestByCourse.values()) {
    const grade = getGradeMapping(course.gradeChar, gradeMap);
    if (!grade.isPassing || !grade.isCredit) continue;

    const category = courseByCode.get(course.courseCode)?.category ?? inferCategoryFromTranscriptCourse(course);
    if (!category) continue;

    earnedByCategory.set(category, (earnedByCategory.get(category) ?? 0) + course.credits);
  }

  return earnedByCategory;
}

function inferCategoryFromTranscriptCourse(course: TranscriptCourse) {
  if (course.courseCode.startsWith("459") || course.courseCode === "SU218") {
    return "วิชาเลือกเสรี";
  }

  if (course.courseCode.startsWith("SU")) {
    return "ศึกษาทั่วไป";
  }

  return undefined;
}

function explainCourseStatus(status: CourseStatus["status"], attempts: TranscriptCourse[], gradeMap: Map<string, GradeMapping>) {
  if (status === "not_taken") return "ยังไม่พบรายวิชานี้ใน transcript";
  const latest = attempts.at(-1);
  if (!latest) return "ยังไม่มีข้อมูล";
  const grade = getGradeMapping(latest.gradeChar, gradeMap);
  if (status === "passed") return `ผ่านแล้วด้วยเกรด ${latest.gradeChar}`;
  if (status === "withdrawn") return "เคยถอนรายวิชา ต้องตรวจว่าลงซ้ำแล้วหรือยัง";
  if (status === "failed") return `ยังไม่ผ่าน เกรดล่าสุดคือ ${latest.gradeChar}`;
  if (status === "non_credit") return grade.isPassing ? "ผ่านแบบไม่นับหน่วยกิต" : "ไม่นับหน่วยกิต";
  return "ตรวจสอบสถานะเพิ่มเติม";
}

export function summarizeRisk(result: { missingCredits: number; prerequisiteImpacts: PrerequisiteImpact[] }): RiskStatus {
  if (result.prerequisiteImpacts.length > 0) return "urgent";
  if (result.missingCredits > 30) return "watch";
  return "normal";
}

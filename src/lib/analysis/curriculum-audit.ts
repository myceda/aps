import { demoCourses, demoPrograms, demoStructures, gradeMappings } from "@/data/demo-data";
import { createGradeMap, getBestPassedAttempt, getCourseStatus, getGradeMapping } from "@/lib/analysis/status";
import { appendMissingTrackCourseStatuses, evaluateTrackRequirement, getOtherTrackCourseCodes } from "@/lib/analysis/track-requirements";
import type { CategoryProgress, Course, CourseStatus, GradeMapping, PlanTrack, PrerequisiteImpact, Program, ProgramCode, ProgramStructure, RiskStatus, StudyPlanItem, TranscriptCourse } from "@/lib/types";

const GENERAL_EDUCATION_CATEGORY = "ศึกษาทั่วไป";
const MAJOR_CATEGORY = "วิชาเฉพาะ";
const FREE_ELECTIVE_CATEGORY = "วิชาเลือกเสรี";

export type CurriculumAuditData = {
  programs?: Program[];
  courses?: Course[];
  structures?: ProgramStructure[];
  gradeMappings?: GradeMapping[];
  studyPlan?: StudyPlanItem[];
};

export function auditCurriculum(programCode: ProgramCode, transcriptCourses: TranscriptCourse[], data: CurriculumAuditData = {}, track: PlanTrack = "research") {
  const programs = data.programs ?? demoPrograms;
  const courses = data.courses ?? demoCourses;
  const structures = data.structures ?? demoStructures;
  const gradeMap = createGradeMap(data.gradeMappings ?? gradeMappings);
  const selectedTrack = track ?? "research";
  const program = programs.find((item) => item.code === programCode);
  if (!program) throw new Error(`Unknown program: ${programCode}`);

  const otherTrackCourseCodes = getOtherTrackCourseCodes(programCode, selectedTrack);
  const requiredCourses = courses.filter((course) => {
    if (course.programCode && course.programCode !== programCode) return false;
    return !otherTrackCourseCodes.has(course.code);
  });
  const baseCourseStatuses: CourseStatus[] = requiredCourses.map((course) => {
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
  const courseStatuses = appendMissingTrackCourseStatuses({
    programCode,
    track: selectedTrack,
    courseStatuses: baseCourseStatuses,
    transcriptCourses,
    courses,
    gradeMappings: data.gradeMappings ?? gradeMappings
  });
  const trackRequirement = evaluateTrackRequirement(courseStatuses, programCode, selectedTrack);

  const categoryProgress = calculateCategoryProgress(programCode, transcriptCourses, courses, structures, gradeMap);
  const earnedCredits = calculateTranscriptEarnedCredits(transcriptCourses, gradeMap);
  const requiredMissingCredits = courseStatuses
    .filter(
      (course) =>
        course.status === "not_taken" ||
        course.status === "failed" ||
        course.status === "withdrawn" ||
        course.status === "incomplete"
    )
    .reduce((total, course) => total + course.credits, 0);

  return {
    program,
    courseStatuses,
    trackRequirement,
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
  const programStructures = structures.filter((structure) => structure.programCode === programCode);
  const structureCategories = new Set(programStructures.map((structure) => structure.category));
  const earnedByCategory = calculateTranscriptEarnedCreditsByCategory(
    programCode,
    transcriptCourses,
    courses,
    gradeMap,
    structureCategories
  );

  return programStructures
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
  programCode: ProgramCode,
  transcriptCourses: TranscriptCourse[],
  courses: Course[],
  gradeMap: Map<string, GradeMapping>,
  structureCategories: Set<string>
) {
  const latestByCourse = new Map<string, TranscriptCourse>();
  const earnedByCategory = new Map<string, number>();

  for (const course of transcriptCourses) {
    latestByCourse.set(course.courseCode, course);
  }

  for (const course of latestByCourse.values()) {
    const grade = getGradeMapping(course.gradeChar, gradeMap);
    if (!grade.isPassing || !grade.isCredit) continue;

    const catalogCourse = findCatalogCourseForProgram(programCode, course.courseCode, courses);
    const category = resolveStructureCategory(programCode, course, catalogCourse, structureCategories);
    if (!category) continue;

    earnedByCategory.set(category, (earnedByCategory.get(category) ?? 0) + course.credits);
  }

  return earnedByCategory;
}

function findCatalogCourseForProgram(programCode: ProgramCode, courseCode: string, courses: Course[]) {
  return (
    courses.find((course) => course.code === courseCode && course.programCode === programCode) ??
    courses.find((course) => course.code === courseCode && !course.programCode) ??
    courses.find((course) => course.code === courseCode)
  );
}

function resolveStructureCategory(
  programCode: ProgramCode,
  transcriptCourse: TranscriptCourse,
  catalogCourse: Course | undefined,
  structureCategories: Set<string>
) {
  const inferredCategory = inferCategoryFromTranscriptCourse(transcriptCourse);
  if (inferredCategory && structureCategories.has(inferredCategory)) return inferredCategory;

  if (catalogCourse?.category && structureCategories.has(catalogCourse.category)) {
    return catalogCourse.category;
  }

  if (catalogCourse?.programCode === programCode && structureCategories.has(MAJOR_CATEGORY)) {
    return MAJOR_CATEGORY;
  }

  return inferredCategory;
}

function inferCategoryFromTranscriptCourse(course: TranscriptCourse) {
  if (course.courseCode.startsWith("459") || course.courseCode === "SU218") {
    return FREE_ELECTIVE_CATEGORY;
  }

  if (course.courseCode.startsWith("SU")) {
    return GENERAL_EDUCATION_CATEGORY;
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
  if (status === "incomplete") return "รออาจารย์ออกเกรด (I) ยังไม่นับว่าผ่านจนกว่าเกรดจริงจะออก";
  if (status === "failed") return `ยังไม่ผ่าน เกรดล่าสุดคือ ${latest.gradeChar}`;
  if (status === "non_credit") return grade.isPassing ? "ผ่านแบบไม่นับหน่วยกิต" : "ไม่นับหน่วยกิต";
  return "ตรวจสอบสถานะเพิ่มเติม";
}

export function summarizeRisk(result: { missingCredits: number; prerequisiteImpacts: PrerequisiteImpact[] }): RiskStatus {
  if (result.prerequisiteImpacts.length > 0) return "urgent";
  if (result.missingCredits > 30) return "watch";
  return "normal";
}

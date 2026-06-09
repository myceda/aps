import { getTrackRequirementDefinitions } from "@/lib/analysis/track-requirements";
import { getCurriculumData } from "@/lib/db/repository";
import type { Course, CourseOffering, PlanTrack, PrerequisiteRule, Program, ProgramCode, ProgramStructure, StudyPlanItem } from "@/lib/types";

type AuditStatus = "passed" | "failed";

type CurriculumAuditCheck = {
  id: string;
  title: string;
  status: AuditStatus;
  detail: string;
  issues: string[];
};

type CurriculumMasterData = {
  programs: Program[];
  courses: Course[];
  structures: ProgramStructure[];
  prerequisites: PrerequisiteRule[];
  studyPlan: StudyPlanItem[];
  courseOfferings: CourseOffering[];
};

const EXPECTED_PROGRAM_TOTALS = new Map<ProgramCode, number>([
  ["CS2565", 126],
  ["IT2565", 133]
]);

const REQUIRED_STRUCTURE_CATEGORIES = ["ศึกษาทั่วไป", "วิชาเฉพาะ", "วิชาเลือกเสรี"];
const REQUIRED_TRACKS: PlanTrack[] = ["research", "coop"];
const KNOWN_COURSE_CATEGORIES = new Set([
  "ศึกษาทั่วไป",
  "วิชาเฉพาะ",
  "วิชาแกน",
  "วิชาบังคับ",
  "วิชาบังคับเลือก",
  "วิชาเลือกเฉพาะ",
  "วิชาเลือกเสรี",
  "วิชาเสริมพื้นฐาน"
]);
const SUMMER_COMPLETION_COURSES = new Set(["517494", "520494"]);

export async function checkCurriculumCompleteness() {
  return auditCurriculumMasterData(await getCurriculumData());
}

export function auditCurriculumMasterData(data: CurriculumMasterData) {
  const checks: CurriculumAuditCheck[] = [
    checkStudyPlanCourses(data),
    checkPrerequisiteReferences(data),
    checkCourseOfferings(data),
    checkTrackRequirements(data),
    checkCourseCategories(data),
    checkCreditStructures(data)
  ];
  const issues = checks.flatMap((check) => check.issues);

  return {
    programs: data.programs.length,
    courses: data.courses.length,
    structures: data.structures.length,
    studyPlanItems: data.studyPlan.length,
    prerequisiteRules: data.prerequisites.length,
    courseOfferings: data.courseOfferings.length,
    checks,
    issues,
    readyToPublish: checks.every((check) => check.status === "passed")
  };
}

function checkStudyPlanCourses(data: CurriculumMasterData): CurriculumAuditCheck {
  const issues: string[] = [];

  for (const plan of data.studyPlan) {
    if (!plan.courseCode) continue;
    if (!findCourseForProgram(plan.programCode, plan.courseCode, data.courses)) {
      issues.push(`${plan.programCode}: study plan อ้างถึง ${plan.courseCode} แต่ไม่มีรายวิชานี้ใน Course master ของหลักสูตร`);
    }
  }

  return createCheck({
    id: "study-plan-courses",
    title: "รายวิชาใน Study Plan มีอยู่จริง",
    passedDetail: "ทุกรายวิชาในแผนรายเทอมพบใน Course master ของหลักสูตรหรือรายวิชากลาง",
    failedDetail: "มีรายวิชาในแผนรายเทอมที่ยังไม่พบใน Course master",
    issues
  });
}

function checkPrerequisiteReferences(data: CurriculumMasterData): CurriculumAuditCheck {
  const issues: string[] = [];

  for (const rule of data.prerequisites) {
    const targetCourses = data.courses.filter((course) => course.code === rule.courseCode);
    const sourceCourses = data.courses.filter((course) => course.code === rule.prereqCourseCode);

    if (targetCourses.length === 0) {
      issues.push(`Prerequisite ปลายทาง ${rule.courseCode} ไม่พบใน Course master`);
      continue;
    }
    if (sourceCourses.length === 0) {
      issues.push(`Prerequisite ต้นทาง ${rule.prereqCourseCode} ไม่พบใน Course master`);
      continue;
    }

    for (const targetCourse of targetCourses) {
      if (!targetCourse.programCode) continue;
      const hasCompatibleSource = sourceCourses.some(
        (sourceCourse) => !sourceCourse.programCode || sourceCourse.programCode === targetCourse.programCode
      );
      if (!hasCompatibleSource) {
        issues.push(
          `${targetCourse.programCode}: ${rule.courseCode} บังคับก่อนด้วย ${rule.prereqCourseCode} แต่ไม่พบวิชาต้นทางในหลักสูตรเดียวกันหรือรายวิชากลาง`
        );
      }
    }
  }

  return createCheck({
    id: "prerequisite-references",
    title: "Prerequisite อ้างถึงรายวิชาที่มีจริง",
    passedDetail: "ทุก prerequisite อ้างถึงรายวิชาที่มีอยู่ และไม่ข้ามหลักสูตรแบบผิด owner",
    failedDetail: "มี prerequisite ที่อ้างถึงรายวิชาหายไปหรือไม่ตรงหลักสูตร",
    issues
  });
}

function checkCourseOfferings(data: CurriculumMasterData): CurriculumAuditCheck {
  const issues: string[] = [];

  for (const plan of data.studyPlan) {
    if (!plan.courseCode) continue;
    const course = findCourseForProgram(plan.programCode, plan.courseCode, data.courses);
    if (!course) continue;

    const hasPlannedTermOffering = data.courseOfferings.some(
      (offering) => offering.courseCode === plan.courseCode && offering.semester === plan.semester
    );
    if (!hasPlannedTermOffering) {
      issues.push(`${plan.programCode}: ${plan.courseCode} อยู่ในแผนเทอม ${plan.semester} แต่ยังไม่มี CourseOffering เทอมนี้`);
    }
  }

  for (const courseCode of SUMMER_COMPLETION_COURSES) {
    if (!data.courses.some((course) => course.code === courseCode)) continue;
    const hasSummerOffering = data.courseOfferings.some(
      (offering) => offering.courseCode === courseCode && offering.semester === 3 && offering.isSummer
    );
    if (!hasSummerOffering) {
      issues.push(`${courseCode}: วิชาที่มีผลต่อการจบภาคฤดูร้อนยังไม่มี CourseOffering เทอม 3`);
    }
  }

  return createCheck({
    id: "course-offerings",
    title: "รายวิชาเปิดสอนครบเทอมที่จำเป็น",
    passedDetail: "รายวิชาในแผนมีรอบเปิดสอนตรงเทอม และวิชาจบภาคฤดูร้อนมีเทอม 3",
    failedDetail: "มีรายวิชาที่ยังไม่มีข้อมูลเปิดสอนในเทอมที่จำเป็น",
    issues
  });
}

function checkTrackRequirements(data: CurriculumMasterData): CurriculumAuditCheck {
  const issues: string[] = [];

  for (const program of data.programs) {
    for (const track of REQUIRED_TRACKS) {
      const requiredCourses = getTrackRequirementDefinitions(program.code, track);
      if (requiredCourses.length === 0) {
        issues.push(`${program.code}: ยังไม่กำหนดรายวิชาสำหรับ track ${track}`);
      }

      for (const requiredCourse of requiredCourses) {
        if (!findCourseForProgram(program.code, requiredCourse.courseCode, data.courses)) {
          issues.push(`${program.code}/${track}: ไม่มี ${requiredCourse.courseCode} ใน Course master`);
        }
        if (!hasStudyPlanCourse(program.code, track, requiredCourse.courseCode, data.studyPlan)) {
          issues.push(`${program.code}/${track}: ไม่มี ${requiredCourse.courseCode} ใน Study Plan`);
        }
      }
    }
  }

  return createCheck({
    id: "track-requirements",
    title: "Track Research/Coop มีวิชาครบ",
    passedDetail: "Research และ Coop ของทุกหลักสูตรมีรายวิชาและแผนรายเทอมครบ",
    failedDetail: "มี track ที่ยังขาดรายวิชาหรือ Study Plan",
    issues
  });
}

function checkCourseCategories(data: CurriculumMasterData): CurriculumAuditCheck {
  const issues: string[] = [];
  const programCodes = new Set(data.programs.map((program) => program.code));

  for (const course of data.courses) {
    if (course.programCode && !programCodes.has(course.programCode)) {
      issues.push(`${course.code}: ผูกกับหลักสูตร ${course.programCode} ที่ไม่มีใน Program`);
    }
    if (!KNOWN_COURSE_CATEGORIES.has(course.category)) {
      issues.push(`${course.code}: หมวดวิชา "${course.category}" ยังไม่อยู่ในชุดหมวดที่ระบบรู้จัก`);
    }
  }

  return createCheck({
    id: "course-categories",
    title: "Course category ตรงหลักสูตร",
    passedDetail: "รายวิชาทุกตัวมีหมวดที่ระบบใช้คำนวณได้ และผูกหลักสูตรถูกต้อง",
    failedDetail: "มีรายวิชาที่หมวดหรือหลักสูตรเจ้าของไม่ถูกต้อง",
    issues
  });
}

function checkCreditStructures(data: CurriculumMasterData): CurriculumAuditCheck {
  const issues: string[] = [];

  for (const program of data.programs) {
    const expectedTotal = EXPECTED_PROGRAM_TOTALS.get(program.code);
    const structures = data.structures.filter((structure) => structure.programCode === program.code);
    const structureTotal = structures.reduce((sum, structure) => sum + structure.minCredits, 0);

    if (expectedTotal && program.totalCreditsMin !== expectedTotal) {
      issues.push(`${program.code}: Program total ควรเป็น ${expectedTotal} แต่ตอนนี้เป็น ${program.totalCreditsMin}`);
    }
    if (expectedTotal && structureTotal !== expectedTotal) {
      issues.push(`${program.code}: หน่วยกิตรวมตามหมวดเป็น ${structureTotal} แต่ PDF กำหนด ${expectedTotal}`);
    }
    for (const category of REQUIRED_STRUCTURE_CATEGORIES) {
      if (!structures.some((structure) => structure.category === category)) {
        issues.push(`${program.code}: ยังขาดหมวด ${category} ใน CurriculumRequirement`);
      }
    }
  }

  return createCheck({
    id: "credit-structures",
    title: "Credit รวมต่อหมวดตรง PDF",
    passedDetail: "CS2565 รวม 126 และ IT2565 รวม 133 ตาม PDF พร้อมหมวดหลักครบ",
    failedDetail: "จำนวนหน่วยกิตรวมต่อหมวดยังไม่ตรงกับ PDF หลักสูตร",
    issues
  });
}

function createCheck(input: {
  id: string;
  title: string;
  passedDetail: string;
  failedDetail: string;
  issues: string[];
}): CurriculumAuditCheck {
  return {
    id: input.id,
    title: input.title,
    status: input.issues.length === 0 ? "passed" : "failed",
    detail: input.issues.length === 0 ? input.passedDetail : input.failedDetail,
    issues: input.issues
  };
}

function findCourseForProgram(programCode: ProgramCode, courseCode: string, courses: Course[]) {
  return (
    courses.find((course) => course.code === courseCode && course.programCode === programCode) ??
    courses.find((course) => course.code === courseCode && !course.programCode)
  );
}

function hasStudyPlanCourse(programCode: ProgramCode, track: PlanTrack, courseCode: string, studyPlan: StudyPlanItem[]) {
  return studyPlan.some(
    (plan) =>
      plan.programCode === programCode &&
      plan.courseCode === courseCode &&
      (!plan.track || plan.track === track)
  );
}

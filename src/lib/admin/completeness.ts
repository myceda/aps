import { getCurriculumData } from "@/lib/db/repository";

export async function checkCurriculumCompleteness() {
  const { programs, courses, structures, studyPlan: plans, prerequisites } = await getCurriculumData();

  const issues = [];

  for (const program of programs) {
    if (!structures.some((structure) => structure.programCode === program.code)) {
      issues.push(`${program.code} ยังไม่มี program structure`);
    }
    if (!plans.some((plan) => plan.programCode === program.code)) {
      issues.push(`${program.code} ยังไม่มี study plan`);
    }
  }

  for (const plan of plans) {
    if (plan.courseCode && !courses.some((course) => course.code === plan.courseCode)) {
      issues.push(`Study plan อ้างถึงรายวิชา ${plan.courseCode} แต่ไม่มีใน course master`);
    }
  }

  for (const rule of prerequisites) {
    if (!courses.some((course) => course.code === rule.courseCode)) {
      issues.push(`Prerequisite ปลายทาง ${rule.courseCode} ไม่พบใน course master`);
    }
    if (!courses.some((course) => course.code === rule.prereqCourseCode)) {
      issues.push(`Prerequisite ต้นทาง ${rule.prereqCourseCode} ไม่พบใน course master`);
    }
  }

  return {
    programs: programs.length,
    courses: courses.length,
    structures: structures.length,
    studyPlanItems: plans.length,
    prerequisiteRules: prerequisites.length,
    issues,
    readyToPublish: issues.length === 0
  };
}

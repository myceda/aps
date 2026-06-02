import { getCurriculumData } from "@/lib/db/repository";

export async function checkCurriculumCompleteness() {
  const { programs, courses, structures, studyPlan: plans, prerequisites } = await getCurriculumData();

  const issues = [];

  for (const program of programs) {
    if (!structures.some((structure) => structure.programCode === program.code)) {
      issues.push(`${program.code} ยังไม่มีโครงสร้างหลักสูตร`);
    }
    if (!plans.some((plan) => plan.programCode === program.code)) {
      issues.push(`${program.code} ยังไม่มีแผนการเรียน`);
    }
  }

  for (const plan of plans) {
    if (plan.courseCode && !courses.some((course) => course.code === plan.courseCode)) {
      issues.push(`แผนการเรียนอ้างถึงรายวิชา ${plan.courseCode} แต่ไม่มีในข้อมูลรายวิชาหลัก`);
    }
  }

  for (const rule of prerequisites) {
    if (!courses.some((course) => course.code === rule.courseCode)) {
      issues.push(`วิชาบังคับก่อนฝั่งปลายทาง ${rule.courseCode} ไม่พบในข้อมูลรายวิชาหลัก`);
    }
    if (!courses.some((course) => course.code === rule.prereqCourseCode)) {
      issues.push(`วิชาบังคับก่อนฝั่งต้นทาง ${rule.prereqCourseCode} ไม่พบในข้อมูลรายวิชาหลัก`);
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

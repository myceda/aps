import { demoCourses, demoPrerequisites, demoStudyPlan, gradeMappings, summerOfferings } from "@/data/demo-data";
import { createGradeMap, getGradeMapping } from "@/lib/analysis/status";
import type { Course, CourseDependency, CourseStatus, GradeMapping, PrerequisiteImpact, PrerequisiteRule, ProgramCode, StudyPlanItem, TranscriptCourse } from "@/lib/types";

export function analyzePrerequisiteImpact(
  programCode: ProgramCode,
  transcriptCourses: TranscriptCourse[],
  data: {
    courses?: Course[];
    prerequisites?: PrerequisiteRule[];
    studyPlan?: StudyPlanItem[];
    gradeMappings?: GradeMapping[];
    summerOfferings?: Set<string>;
  } = {}
): PrerequisiteImpact[] {
  const courses = data.courses ?? demoCourses;
  const prerequisites = data.prerequisites ?? demoPrerequisites;
  const studyPlan = data.studyPlan ?? demoStudyPlan;
  const offeringSet = data.summerOfferings ?? summerOfferings;
  const gradeMap = createGradeMap(data.gradeMappings ?? gradeMappings);
  const impacts: PrerequisiteImpact[] = [];

  for (const attempt of transcriptCourses) {
    const grade = getGradeMapping(attempt.gradeChar, gradeMap);
    if (grade.isPassing || !["F", "W"].includes(attempt.gradeChar)) continue;

    const downstreamRules = prerequisites.filter((rule) => rule.prereqCourseCode === attempt.courseCode);
    for (const rule of downstreamRules) {
      const blockedCourse = courses.find((course) => course.code === rule.courseCode);
      const planned = studyPlan.find((plan) => plan.programCode === programCode && plan.courseCode === rule.courseCode);
      if (!blockedCourse || !planned) continue;

      impacts.push({
        blockedCourseCode: blockedCourse.code,
        blockedCourseName: blockedCourse.nameTh,
        failedPrereqCode: attempt.courseCode,
        plannedYear: planned.yearLevel,
        plannedSemester: planned.semester,
        hasSummerOffering: offeringSet.has(attempt.courseCode),
        recommendation: offeringSet.has(attempt.courseCode)
          ? `ควรลง ${attempt.courseCode} ซ้ำในเทอมที่เปิดหรือ summer ก่อนถึง ${blockedCourse.code}`
          : `ควรวางแผนลง ${attempt.courseCode} ซ้ำ เพราะกระทบ ${blockedCourse.code}`
      });
    }
  }

  return impacts;
}

export function buildCourseDependencies(
  programCode: ProgramCode,
  courseStatuses: CourseStatus[],
  data: {
    courses?: Course[];
    prerequisites?: PrerequisiteRule[];
    studyPlan?: StudyPlanItem[];
  } = {}
): CourseDependency[] {
  const courses = data.courses ?? demoCourses;
  const prerequisites = data.prerequisites ?? demoPrerequisites;
  const studyPlan = data.studyPlan ?? demoStudyPlan;
  const statusByCode = new Map(courseStatuses.map((course) => [course.courseCode, course]));
  const dependencies: CourseDependency[] = [];

  for (const rule of prerequisites) {
    const course = courses.find((item) => item.code === rule.courseCode);
    const prerequisite = courses.find((item) => item.code === rule.prereqCourseCode);
    const courseStatus = statusByCode.get(rule.courseCode);
    const prerequisiteStatus = statusByCode.get(rule.prereqCourseCode);
    const planned = studyPlan.find((plan) => plan.programCode === programCode && plan.courseCode === rule.courseCode);

    if (!course || !prerequisite || !courseStatus || !prerequisiteStatus) continue;

    dependencies.push({
      courseCode: course.code,
      courseName: course.nameTh,
      courseStatus: courseStatus.status,
      prerequisiteCode: prerequisite.code,
      prerequisiteName: prerequisite.nameTh,
      prerequisiteStatus: prerequisiteStatus.status,
      isCorequisite: rule.isCorequisite ?? false,
      isBlocking: !["passed", "non_credit"].includes(prerequisiteStatus.status),
      plannedYear: planned?.yearLevel,
      plannedSemester: planned?.semester,
      note: rule.conditionNote
    });
  }

  return dependencies.sort((a, b) => {
    if (a.isBlocking !== b.isBlocking) return a.isBlocking ? -1 : 1;
    if (a.courseStatus !== b.courseStatus) return a.courseStatus === "not_taken" ? -1 : 1;
    return a.courseCode.localeCompare(b.courseCode);
  });
}

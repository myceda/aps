import { createGradeMap, getCourseStatus } from "@/lib/analysis/status";
import type {
  Course,
  CourseStatus,
  GradeMapping,
  PlanTrack,
  ProgramCode,
  TrackRequirementCourse,
  TrackRequirementResult,
  TranscriptCourse
} from "@/lib/types";

type TrackCourseDefinition = {
  courseCode: string;
  courseName: string;
  credits: number;
};

const TRACK_REQUIREMENTS: Record<string, Record<PlanTrack, TrackCourseDefinition[]>> = {
  CS2565: {
    research: [
      { courseCode: "517392", courseName: "การเตรียมความพร้อมสำหรับโครงงานวิจัย", credits: 1 },
      { courseCode: "517493", courseName: "โครงงานวิจัย 1", credits: 1 },
      { courseCode: "517494", courseName: "โครงงานวิจัย 2", credits: 2 }
    ],
    coop: [
      { courseCode: "517393", courseName: "การเตรียมความพร้อมสำหรับสหกิจศึกษา", credits: 1 },
      { courseCode: "517496", courseName: "สหกิจศึกษา", credits: 6 },
      { courseCode: "517497", courseName: "สัมมนาโครงงานสหกิจศึกษา", credits: 2 }
    ]
  },
  IT2565: {
    research: [
      { courseCode: "520393", courseName: "การเตรียมโครงงานวิจัย", credits: 1 },
      { courseCode: "520493", courseName: "โครงงานวิจัย 1", credits: 1 },
      { courseCode: "520494", courseName: "โครงงานวิจัย 2", credits: 2 }
    ],
    coop: [
      { courseCode: "520394", courseName: "การเตรียมความพร้อมสหกิจศึกษา", credits: 1 },
      { courseCode: "520496", courseName: "สหกิจศึกษา", credits: 6 },
      { courseCode: "520497", courseName: "สัมมนาโครงงานสหกิจศึกษา", credits: 2 }
    ]
  }
};

export function getTrackRequirementDefinitions(programCode: ProgramCode, track: PlanTrack) {
  return TRACK_REQUIREMENTS[programCode]?.[track] ?? [];
}

export function getOtherTrackCourseCodes(programCode: ProgramCode, track: PlanTrack) {
  const otherTrack = track === "coop" ? "research" : "coop";
  const selected = new Set(getTrackRequirementDefinitions(programCode, track).map((course) => course.courseCode));

  return new Set(
    getTrackRequirementDefinitions(programCode, otherTrack)
      .map((course) => course.courseCode)
      .filter((courseCode) => !selected.has(courseCode))
  );
}

export function appendMissingTrackCourseStatuses({
  programCode,
  track,
  courseStatuses,
  transcriptCourses,
  courses,
  gradeMappings
}: {
  programCode: ProgramCode;
  track: PlanTrack;
  courseStatuses: CourseStatus[];
  transcriptCourses: TranscriptCourse[];
  courses: Course[];
  gradeMappings: GradeMapping[];
}) {
  const existing = new Set(courseStatuses.map((course) => course.courseCode));
  const gradeMap = createGradeMap(gradeMappings);
  const courseByCode = new Map(courses.filter((course) => course.programCode === programCode).map((course) => [course.code, course]));
  const additions: CourseStatus[] = [];

  for (const requiredCourse of getTrackRequirementDefinitions(programCode, track)) {
    if (existing.has(requiredCourse.courseCode)) continue;

    const catalogCourse = courseByCode.get(requiredCourse.courseCode);
    const attempts = transcriptCourses.filter((attempt) => attempt.courseCode === requiredCourse.courseCode);
    const status = getCourseStatus(attempts, gradeMap);

    additions.push({
      courseCode: requiredCourse.courseCode,
      courseName: catalogCourse?.nameTh ?? requiredCourse.courseName,
      category: catalogCourse?.category ?? "วิชาตามเงื่อนไขสาย",
      credits: catalogCourse?.credits ?? requiredCourse.credits,
      status,
      attempts,
      reason: explainTrackCourseStatus(status, requiredCourse.courseCode)
    });
  }

  return [...courseStatuses, ...additions];
}

export function evaluateTrackRequirement(courseStatuses: CourseStatus[], programCode: ProgramCode, track: PlanTrack): TrackRequirementResult {
  const statusByCode = new Map(courseStatuses.map((course) => [course.courseCode, course]));
  const requiredCourses: TrackRequirementCourse[] = getTrackRequirementDefinitions(programCode, track).map((requiredCourse) => {
    const status = statusByCode.get(requiredCourse.courseCode);
    return {
      courseCode: requiredCourse.courseCode,
      courseName: status?.courseName ?? requiredCourse.courseName,
      credits: status?.credits ?? requiredCourse.credits,
      status: status?.status ?? "not_taken",
      reason: status?.reason ?? "ยังไม่พบรายวิชานี้ใน transcript"
    };
  });
  const pendingCourseCodes = requiredCourses.filter((course) => course.status === "incomplete").map((course) => course.courseCode);
  const missingCourseCodes = requiredCourses
    .filter((course) => course.status === "not_taken" || course.status === "failed" || course.status === "withdrawn")
    .map((course) => course.courseCode);
  const isSatisfied = missingCourseCodes.length === 0 && pendingCourseCodes.length === 0;

  return {
    track,
    label: track === "coop" ? "สายสหกิจศึกษา" : "สายโครงงานวิจัย",
    state: isSatisfied ? "passed" : pendingCourseCodes.length > 0 ? "pending" : "missing",
    isSatisfied,
    requiredCourses,
    missingCourseCodes,
    pendingCourseCodes,
    detail: buildTrackRequirementDetail(track, isSatisfied, pendingCourseCodes, missingCourseCodes)
  };
}

function explainTrackCourseStatus(status: CourseStatus["status"], courseCode: string) {
  if (status === "passed") return "ผ่านตามเงื่อนไขของสายที่เลือกแล้ว";
  if (status === "incomplete") return `รอผลเกรด ${courseCode} ยังไม่ถือว่าไม่ผ่าน`;
  if (status === "failed" || status === "withdrawn") return `ยังไม่ผ่าน ${courseCode} ต้องวางแผนเรียนใหม่`;
  if (status === "non_credit") return "ผ่านแบบไม่นับหน่วยกิต ต้องตรวจเงื่อนไขหลักสูตรอีกครั้ง";
  return `ยังไม่พบ ${courseCode} ใน transcript`;
}

function buildTrackRequirementDetail(track: PlanTrack, isSatisfied: boolean, pendingCourseCodes: string[], missingCourseCodes: string[]) {
  if (isSatisfied) return track === "coop" ? "ผ่านกลุ่มสหกิจศึกษาครบแล้ว" : "ผ่านกลุ่มโครงงานวิจัยครบแล้ว";
  if (pendingCourseCodes.length > 0) {
    const trackLabel = track === "coop" ? "แผนสหกิจ" : "แผนโครงงานวิจัย";
    return `เรียนครบตาม${trackLabel}แล้ว เหลือรอผลเกรด ${pendingCourseCodes.join(", ")} ถ้าออกผ่านจะเข้าเงื่อนไขจบ`;
  }
  return `ยังขาดรายวิชาตามเงื่อนไข${track === "coop" ? "สหกิจศึกษา" : "โครงงานวิจัย"}: ${missingCourseCodes.join(", ")}`;
}

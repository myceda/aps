import assert from "node:assert/strict";
import {
  evaluateAcademicEligibility,
  evaluateRegGraduationStatus
} from "@/lib/analysis/graduation-readiness";
import type { CourseStatus, GraduationForecast, TrackRequirementResult } from "@/lib/types";

const courseStatuses: CourseStatus[] = [
  {
    courseCode: "517497",
    courseName: "สัมมนาโครงงานสหกิจศึกษา",
    category: "วิชาเฉพาะ",
    credits: 2,
    status: "incomplete",
    attempts: [],
    reason: "รอผลเกรด"
  }
];

const forecast: GraduationForecast = {
  canGraduate: true,
  expectedAcademicYear: 2568,
  expectedSemester: 3,
  condition: "pending_current_courses",
  conditionLabel: "จบได้เทอม 3/2568 ถ้าวิชาที่รอผลผ่าน",
  conditionDetail: "รอผลรายวิชาปัจจุบัน",
  remainingCredits: 2,
  pendingCredits: 2,
  plannedCredits: 0,
  terms: [],
  pendingCourses: [],
  blockedCourses: [],
  notes: []
};

const trackRequirement: TrackRequirementResult = {
  track: "coop",
  label: "สายสหกิจ",
  state: "pending",
  isSatisfied: false,
  requiredCourses: [],
  missingCourseCodes: [],
  pendingCourseCodes: ["517497"],
  detail: "เรียนครบตามแผนสหกิจแล้ว แต่รอผล 517497"
};

const academicEligibility = evaluateAcademicEligibility({
  courseStatuses,
  graduationForecast: forecast,
  trackRequirement
});

assert.equal(academicEligibility.state, "eligible_if_pending_passed");
assert.doesNotMatch(academicEligibility.label, /ยื่นจบ/);
assert.doesNotMatch(academicEligibility.detail, /ยื่นจบ/);

const missingRegStatus = evaluateRegGraduationStatus();
assert.equal(missingRegStatus.status, "not_found");
assert.match(missingRegStatus.note, /ไม่ได้คำนวณจากระบบ APS/);

const appliedRegStatus = evaluateRegGraduationStatus("applied");
assert.equal(appliedRegStatus.label, "ยื่นจบ");
assert.match(appliedRegStatus.detail, /ข้อมูล REG/);

console.log("Academic eligibility and REG status separation passed");

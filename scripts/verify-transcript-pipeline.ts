import assert from "node:assert/strict";
import type { TranscriptCourse, TranscriptPreview } from "@/lib/types";
import { validateTranscriptPreview } from "@/lib/transcript/validator";

const baseCourse: TranscriptCourse = {
  courseCode: "517497",
  courseName: "สัมมนาโครงงานสหกิจศึกษา",
  credits: 2,
  gradeChar: "A",
  semester: 2,
  academicYear: 2568,
  sourceRow: "test"
};

function previewWith(courses: TranscriptCourse[]): TranscriptPreview {
  return {
    courses,
    summaries: [],
    warnings: [],
    canConfirm: false
  };
}

const incompletePreview = validateTranscriptPreview(previewWith([{ ...baseCourse, gradeChar: "I" }]));
assert.equal(incompletePreview.canConfirm, true, "I should be confirmable after user review");
assert.equal(incompletePreview.courses[0].validationSeverity, "warning");
assert.match(incompletePreview.courses[0].validationMessages?.join(" ") ?? "", /รอผล/);

const failedPreview = validateTranscriptPreview(previewWith([{ ...baseCourse, gradeChar: "F" }]));
assert.equal(failedPreview.canConfirm, true, "F is a valid transcript grade and should not block saving");
assert.equal(failedPreview.courses[0].validationSeverity, "warning");
assert.match(failedPreview.courses[0].validationMessages?.join(" ") ?? "", /ไม่ผ่าน/);

const withdrawnPreview = validateTranscriptPreview(previewWith([{ ...baseCourse, gradeChar: "W", credits: 0 }]));
assert.equal(withdrawnPreview.canConfirm, true, "W with zero credits should be valid");
assert.equal(withdrawnPreview.courses[0].validationSeverity, "warning");

const nonCreditPassPreview = validateTranscriptPreview(previewWith([{ ...baseCourse, gradeChar: "S*", credits: 0 }]));
assert.equal(nonCreditPassPreview.canConfirm, true, "S* can be non-credit and still pass status checks");
assert.equal(nonCreditPassPreview.courses[0].validationSeverity, "warning");

const invalidGradePreview = validateTranscriptPreview(previewWith([{ ...baseCourse, gradeChar: "X" }]));
assert.equal(invalidGradePreview.canConfirm, false, "Unknown grade must block saving");
assert.equal(invalidGradePreview.courses[0].validationSeverity, "error");

const emptyPreview = validateTranscriptPreview(previewWith([]));
assert.equal(emptyPreview.canConfirm, false, "Empty PDF/manual input must not be confirmed");
assert.match(emptyPreview.warnings.join(" "), /เพิ่มรายวิชา/);

console.log("Transcript pipeline validation passed");

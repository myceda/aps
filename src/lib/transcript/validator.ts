import type { TranscriptCourse, TranscriptPreview } from "@/lib/types";

const validGrades = new Set(["A", "B+", "B", "C+", "C", "D+", "D", "F", "W", "S", "S*", "U"]);

export function validateTranscriptPreview(preview: TranscriptPreview): TranscriptPreview {
  const warnings = new Set(preview.warnings.filter(Boolean));

  if (preview.courses.length === 0 && warnings.size === 0) {
    warnings.add("ยังไม่พบรายการรายวิชา ผู้ใช้สามารถอัปโหลดไฟล์ใหม่ เพิ่มรายวิชาด้วยตนเอง หรือนำเข้าไฟล์ CSV/Excel ในขั้นตอนถัดไป");
  }

  for (const course of preview.courses) {
    for (const warning of validateCourse(course)) {
      warnings.add(warning);
    }
  }

  const warningList = Array.from(warnings);

  return {
    ...preview,
    warnings: warningList,
    canConfirm: preview.courses.length > 0 && warningList.length === 0
  };
}

function validateCourse(course: TranscriptCourse) {
  const warnings: string[] = [];
  const label = course.courseCode?.trim() || "แถวที่ยังไม่มีรหัสวิชา";

  if (!course.courseCode.trim()) {
    warnings.push("มีแถวที่ยังไม่มีรหัสวิชา");
  }

  if (!course.courseName.trim()) {
    warnings.push(`${label} ยังไม่มีชื่อวิชา`);
  }

  if (!Number.isFinite(course.credits) || course.credits < 0 || (course.credits === 0 && course.gradeChar !== "W")) {
    warnings.push(`${label} มีหน่วยกิตไม่ถูกต้อง`);
  }

  if (!validGrades.has(course.gradeChar)) {
    warnings.push(`${label} มีเกรดไม่ถูกต้อง`);
  }

  if (![1, 2, 3].includes(course.semester)) {
    warnings.push(`${label} ยังไม่มีข้อมูลเทอมที่ชัดเจน`);
  }

  if (!Number.isFinite(course.academicYear) || course.academicYear < 2500 || course.academicYear > 2700) {
    warnings.push(`${label} ยังไม่มีข้อมูลปีการศึกษาที่ชัดเจน`);
  }

  return warnings;
}

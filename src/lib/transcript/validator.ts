import type { TranscriptPreview } from "@/lib/types";

export function validateTranscriptPreview(preview: TranscriptPreview): TranscriptPreview {
  const warnings = [...preview.warnings];

  if (preview.courses.length === 0) {
    warnings.push("ยังไม่พบรายการรายวิชา ผู้ใช้ควรอัปโหลดใหม่หรือกรอกแก้ไขด้วยตนเอง");
  }

  for (const course of preview.courses) {
    if (!course.semester || !course.academicYear) {
      warnings.push(`${course.courseCode} ยังไม่มีข้อมูลภาคการศึกษาที่ชัดเจน`);
    }
    if (course.credits < 0) {
      warnings.push(`${course.courseCode} มีหน่วยกิตไม่ถูกต้อง`);
    }
  }

  return {
    ...preview,
    warnings: Array.from(new Set(warnings)),
    canConfirm: preview.courses.length > 0 && warnings.length === 0
  };
}

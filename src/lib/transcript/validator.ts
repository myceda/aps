import type { TranscriptCourse, TranscriptPreview } from "@/lib/types";

const validGrades = new Set(["A", "B+", "B", "C+", "C", "D+", "D", "F", "W", "I", "S", "S*", "U"]);

const gradeReviewNotes: Record<string, string> = {
  I: "เกรด I คือรอผล ยังไม่ถือว่าผ่านหรือตก ระบบจะจัดเป็นวิชารอผล",
  F: "เกรด F คือไม่ผ่าน วิชานี้จะไม่ถูกนับเป็นหน่วยกิตที่ผ่าน",
  W: "เกรด W คือถอนรายวิชา ไม่นับเป็นหน่วยกิตที่ผ่านและไม่คิด GPAX",
  S: "เกรด S คือผ่านและนับหน่วยกิตตามข้อมูล grade mapping",
  "S*": "เกรด S* คือผ่านแบบไม่นับหน่วยกิต ใช้ตรวจสถานะผ่านแต่ไม่เพิ่มหน่วยกิตสะสม",
  U: "เกรด U คือไม่ผ่านในรายวิชาแบบ S/U"
};

type CourseValidation = {
  severity: "ok" | "warning" | "error";
  messages: string[];
};

export function validateTranscriptPreview(preview: TranscriptPreview): TranscriptPreview {
  const globalWarnings = new Set(preview.warnings.filter(Boolean));
  let hasBlockingError = false;

  if (preview.courses.length === 0) {
    globalWarnings.add("ยังไม่พบรายการรายวิชา ผู้ใช้ต้องอัปโหลด PDF ที่มี text layer หรือเพิ่มรายวิชาด้วยตนเองก่อนบันทึก");
    hasBlockingError = true;
  }

  const courses = preview.courses.map((course) => {
    const validation = validateCourse(course);
    if (validation.severity === "error") hasBlockingError = true;

    return {
      ...course,
      validationSeverity: validation.severity,
      validationMessages: validation.messages
    };
  });

  return {
    ...preview,
    courses,
    warnings: Array.from(globalWarnings),
    canConfirm: courses.length > 0 && !hasBlockingError
  };
}

function validateCourse(course: TranscriptCourse): CourseValidation {
  const errors: string[] = [];
  const notes: string[] = [];
  const label = course.courseCode?.trim() || "แถวที่ยังไม่มีรหัสวิชา";

  if (!course.courseCode.trim()) {
    errors.push("ต้องมีรหัสวิชา");
  }

  if (!course.courseName.trim()) {
    errors.push(`${label} ยังไม่มีชื่อวิชา`);
  }

  if (!Number.isFinite(course.credits) || course.credits < 0) {
    errors.push(`${label} มีหน่วยกิตไม่ถูกต้อง`);
  }

  if (course.credits === 0 && !["W", "S*", "U"].includes(course.gradeChar)) {
    errors.push(`${label} มีหน่วยกิตเป็น 0 แต่เกรดนี้ควรมีหน่วยกิตตาม transcript`);
  }

  if (!validGrades.has(course.gradeChar)) {
    errors.push(`${label} มีเกรดไม่ถูกต้อง`);
  }

  if (![1, 2, 3].includes(course.semester)) {
    errors.push(`${label} ต้องระบุเทอมเป็น 1, 2 หรือ 3`);
  }

  if (!Number.isFinite(course.academicYear) || course.academicYear < 2500 || course.academicYear > 2700) {
    errors.push(`${label} ต้องระบุปีการศึกษาเป็น พ.ศ. ที่ถูกต้อง`);
  }

  const gradeNote = gradeReviewNotes[course.gradeChar];
  if (gradeNote) notes.push(gradeNote);

  if (errors.length > 0) {
    return { severity: "error", messages: [...errors, ...notes] };
  }

  if (notes.length > 0) {
    return { severity: "warning", messages: notes };
  }

  return { severity: "ok", messages: [] };
}

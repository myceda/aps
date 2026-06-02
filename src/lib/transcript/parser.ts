import type { TranscriptCourse, TranscriptPreview, TranscriptSummary } from "@/lib/types";
import { validateTranscriptPreview } from "@/lib/transcript/validator";

type SemesterMarker = {
  index: number;
  semester: number;
  academicYear: number;
};

const coursePattern = /(?<!\d)(SU\s*\d{3}|\d{3}\s*\d{3})(?!\d)\s+(.+?)\s+(\d+(?:\.\d+)?)\s+(A|B\+|B|C\+|C|D\+|D|F|W|S\*?|U)(?:\s+[0-9]+(?:\.[0-9]+)?)?/gu;
const semesterPattern = /ภาคการศึกษา(?:\s*ที่|\s*ท)?[\s\S]{0,24}?([123])\/(25\d{2})/gu;
const fallbackSemesterPattern = /(?:ภาค|เทอม)\s*([123])\s*(?:ปีการศึกษา|\/)\s*(25\d{2})/gu;
const summaryPattern = /CR:\s*([0-9.]+)\s*CP:\s*([0-9.]+)\s*CA:\s*([0-9.]+)\s*GP:\s*([0-9.]+)(?:\s*(GPA|GPAX))?/gu;

export function parseTranscriptText(rawText: string): TranscriptPreview {
  const warnings: string[] = [];
  const text = normalizeTranscriptText(rawText);
  const semesterMarkers = findSemesterMarkers(text);
  const courses = parseCourses(text, semesterMarkers, warnings);
  const summaries = parseSummaries(text, semesterMarkers);

  if (!text) {
    warnings.push("ไม่พบข้อความใน PDF ไฟล์อาจเป็นภาพสแกนหรือเป็นรูปแบบที่ text extraction ไม่รองรับ");
  } else if (courses.length === 0) {
    warnings.push("อ่านข้อความจากไฟล์ได้ แต่ยังไม่พบตารางรายวิชา ผู้ใช้ควรเพิ่มรายวิชาด้วยตนเองหรือนำเข้า CSV/Excel");
  }

  return validateTranscriptPreview({ courses, summaries, warnings, canConfirm: false });
}

export function normalizeTranscriptText(rawText: string) {
  return rawText
    .replace(/\u0000/g, "")
    .replace(/\r/g, "\n")
    .replace(/[\uF000-\uF8FF]/g, "")
    .replace(/[ชซ]\s*ื\s*อ/g, "ชื่อ")
    .replace(/[ทท]\s*ี\s*/g, "ที่")
    .replace(/หน่วย\s*กิต/g, "หน่วยกิต")
    .replace(/คะแนน\s*เกรด/g, "คะแนนเกรด")
    .replace(/([A-Z]{2})\s+(\d{3})/g, "$1$2")
    .replace(/(?<!\d)(\d{3})\s+(\d{3})(?!\d)/g, "$1$2")
    .replace(/([\u0E00-\u0E7F])\s+(?=[\u0E00-\u0E7F])/g, "$1")
    .replace(/[ \t]+/g, " ")
    .replace(/\n+/g, "\n")
    .trim();
}

function findSemesterMarkers(text: string): SemesterMarker[] {
  const markers = [
    ...findMarkersByPattern(text, semesterPattern),
    ...findMarkersByPattern(text, fallbackSemesterPattern)
  ].sort((a, b) => a.index - b.index);

  return markers.filter((marker, index) => {
    const previous = markers[index - 1];
    return !previous || previous.index !== marker.index || previous.semester !== marker.semester || previous.academicYear !== marker.academicYear;
  });
}

function findMarkersByPattern(text: string, pattern: RegExp) {
  const markers: SemesterMarker[] = [];

  for (const match of text.matchAll(pattern)) {
    markers.push({
      index: match.index ?? 0,
      semester: Number(match[1]),
      academicYear: Number(match[2])
    });
  }

  return markers;
}

function parseCourses(text: string, semesterMarkers: SemesterMarker[], warnings: string[]) {
  const courses: TranscriptCourse[] = [];
  const seenRows = new Set<string>();

  for (const match of text.matchAll(coursePattern)) {
    const marker = findLatestSemesterMarker(semesterMarkers, match.index ?? 0);
    const fallbackMarker = marker ?? findNextSemesterMarker(semesterMarkers, match.index ?? 0);
    const courseCode = normalizeCourseCode(match[1]);
    const sourceRow = match[0].trim();
    const dedupeKey = `${courseCode}|${fallbackMarker?.semester ?? 0}|${fallbackMarker?.academicYear ?? 0}|${match[4]}|${sourceRow}`;

    if (seenRows.has(dedupeKey)) continue;
    seenRows.add(dedupeKey);

    if (!marker && fallbackMarker && isTransferCourseBeforeFirstSemester(text, match.index ?? 0, semesterMarkers)) {
      // รายวิชาโอนย้ายมาก่อนหัวข้อภาคการศึกษาใน transcript บางแบบ จึงเก็บไว้ในเทอมแรกที่พบโดยไม่บล็อกการบันทึก
    } else if (!marker && fallbackMarker) {
      warnings.push(`พบรายวิชา ${courseCode} ก่อนหัวข้อภาคการศึกษา ระบบใส่ไว้ในเทอมแรกที่พบ โปรดตรวจสอบก่อนบันทึก`);
    } else if (!fallbackMarker) {
      warnings.push(`พบรายวิชา ${courseCode} แต่ยังไม่พบหัวข้อภาคการศึกษาที่ชัดเจน`);
    }

    courses.push({
      courseCode,
      courseName: cleanCourseName(match[2]),
      credits: Number(match[3]),
      gradeChar: match[4],
      semester: fallbackMarker?.semester ?? 0,
      academicYear: fallbackMarker?.academicYear ?? 0,
      sourceRow
    });
  }

  return courses;
}

function parseSummaries(text: string, semesterMarkers: SemesterMarker[]) {
  const summaries: TranscriptSummary[] = [];

  for (const [index, marker] of semesterMarkers.entries()) {
    const nextMarker = semesterMarkers[index + 1];
    const section = text.slice(marker.index, nextMarker?.index ?? text.length);
    const matches = Array.from(section.matchAll(summaryPattern));
    if (matches.length === 0) continue;

    const semesterSummary = matches[0];
    const cumulativeSummary = matches.at(-1) ?? semesterSummary;
    const semesterCreditAttempt = Number(semesterSummary[3]);
    const semesterGradePoint = Number(semesterSummary[4]);
    const cumulativeCreditAttempt = Number(cumulativeSummary[3]);
    const cumulativeGradePoint = Number(cumulativeSummary[4]);

    summaries.push({
      semester: marker.semester,
      academicYear: marker.academicYear,
      gpa: toAverage(semesterGradePoint, semesterCreditAttempt),
      gpax: toAverage(cumulativeGradePoint, cumulativeCreditAttempt),
      creditAttempt: cumulativeCreditAttempt,
      gradePoint: cumulativeGradePoint
    });
  }

  return summaries;
}

function cleanCourseName(value: string) {
  return value
    .replace(/\s*รหัสวิชา\s*ชื่อวิชา\s*หน่วยกิต\s*เกรด\s*คะแนนเกรด\s*รวม\s*/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeCourseCode(value: string) {
  return value.replace(/\s+/g, "");
}

function toAverage(gradePoint: number, creditAttempt: number) {
  return creditAttempt === 0 ? 0 : Number((gradePoint / creditAttempt).toFixed(2));
}

function findLatestSemesterMarker(markers: SemesterMarker[], index: number) {
  let current: SemesterMarker | undefined;

  for (const marker of markers) {
    if (marker.index > index) break;
    current = marker;
  }

  return current;
}

function findNextSemesterMarker(markers: SemesterMarker[], index: number) {
  return markers.find((marker) => marker.index > index);
}

function isTransferCourseBeforeFirstSemester(text: string, index: number, markers: SemesterMarker[]) {
  const firstSemester = markers[0];
  if (!firstSemester || index > firstSemester.index) return false;
  const transferHeaderIndex = text.lastIndexOf("รายวิชาโอนย้าย", index);
  return transferHeaderIndex >= 0 && transferHeaderIndex < index;
}

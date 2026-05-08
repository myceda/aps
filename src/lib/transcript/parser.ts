import type { TranscriptCourse, TranscriptPreview, TranscriptSummary } from "@/lib/types";
import { validateTranscriptPreview } from "@/lib/transcript/validator";

type SemesterMarker = {
  index: number;
  semester: number;
  academicYear: number;
};

const coursePattern = /(?<!\d)(SU\d{3}|\d{6})(?!\d)\s+(.+?)\s+(\d+)\s+(A|B\+|B|C\+|C|D\+|D|F|W|S\*?|U)\s+([0-9]+(?:\.[0-9]+)?)/gu;
const semesterPattern = /ภาคการศึกษา.{0,40}?([123])\/(25\d{2})/gu;
const summaryPattern = /CR:\s*([0-9.]+)\s*CP:\s*([0-9.]+)\s*CA:\s*([0-9.]+)\s*GP:\s*([0-9.]+)(?:\s*(GPA|GPAX))?/gu;

export function parseTranscriptText(rawText: string): TranscriptPreview {
  const warnings: string[] = [];
  const text = normalizeTranscriptText(rawText);
  const semesterMarkers = findSemesterMarkers(text);
  const courses = parseCourses(text, semesterMarkers, warnings);
  const summaries = parseSummaries(text, semesterMarkers);

  if (!text) {
    warnings.push("ไม่พบข้อความใน PDF อาจเป็นไฟล์สแกนหรือไฟล์ที่ text extraction ไม่รองรับ");
  }

  return validateTranscriptPreview({ courses, summaries, warnings, canConfirm: false });
}

function normalizeTranscriptText(rawText: string) {
  return rawText
    .replace(/\u0000/g, "")
    .replace(/\r/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n+/g, "\n")
    .trim();
}

function findSemesterMarkers(text: string): SemesterMarker[] {
  const markers: SemesterMarker[] = [];

  for (const match of text.matchAll(semesterPattern)) {
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
    const courseCode = match[1];
    const sourceRow = match[0].trim();
    const dedupeKey = `${courseCode}|${marker?.semester ?? 0}|${marker?.academicYear ?? 0}|${match[4]}|${sourceRow}`;

    if (seenRows.has(dedupeKey)) continue;
    seenRows.add(dedupeKey);

    if (!marker) {
      warnings.push(`พบรายวิชา ${courseCode} แต่ยังไม่พบหัวข้อภาคการศึกษาก่อนหน้า`);
    }

    courses.push({
      courseCode,
      courseName: match[2].trim(),
      credits: Number(match[3]),
      gradeChar: match[4],
      semester: marker?.semester ?? 0,
      academicYear: marker?.academicYear ?? 0,
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

import { copyFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { createCanvas, loadImage } from "canvas";
import { createWorker, PSM } from "tesseract.js";
import { getDocumentProxy, renderPageAsImage } from "unpdf";
import type { TranscriptCourse, TranscriptPreview, TranscriptSummary } from "@/lib/types";
import { validateTranscriptPreview } from "@/lib/transcript/validator";

const OCR_SCALE = 3;
const DARK_PIXEL_THRESHOLD = 140;
const COURSE_ROW_MIN_HEIGHT = 55;
const COURSE_ROW_MAX_HEIGHT = 155;

type CourseCatalogItem = {
  code: string;
  nameTh: string;
  credits: number;
};

type AcademicTerm = {
  semester: number;
  academicYear: number;
};

export async function extractTextWithOcr(buffer: Uint8Array) {
  const pdf = await getDocumentProxy(Uint8Array.from(buffer));
  const langPath = await prepareOcrLanguageData();
  const worker = await createWorker("tha+eng", 1, { cachePath: langPath, langPath });
  const pages: string[] = [];

  try {
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      const image = await renderPageAsImage(pdf, pageNumber, {
        scale: OCR_SCALE,
        canvas: () => import("canvas")
      });
      const result = await worker.recognize(Buffer.from(image));
      pages.push(result.data.text);
    }
  } finally {
    await worker.terminate();
  }

  return pages.join("\n");
}

export async function extractStructuredTranscriptWithOcr(buffer: Uint8Array, courseCatalog: CourseCatalogItem[] = []): Promise<TranscriptPreview> {
  const pdf = await getDocumentProxy(Uint8Array.from(buffer));
  const langPath = await prepareOcrLanguageData();
  const worker = await createWorker("tha+eng", 1, { cachePath: langPath, langPath });
  const courseByCode = new Map(courseCatalog.map((course) => [course.code, course]));
  const pendingBeforeFirstTerm: TranscriptCourse[] = [];
  const courses: TranscriptCourse[] = [];
  const summaries: TranscriptSummary[] = [];
  const warnings: string[] = [];
  const seenRows = new Set<string>();
  let currentTerm: AcademicTerm | undefined;
  let firstTerm: AcademicTerm | undefined;

  try {
    await worker.setParameters({ tessedit_pageseg_mode: PSM.SINGLE_LINE });

    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      const image = await renderPageAsImage(pdf, pageNumber, {
        scale: OCR_SCALE,
        canvas: () => import("canvas")
      });
      const pageImage = await loadImage(Buffer.from(image));
      const rowLines = findHorizontalTableLines(pageImage);

      for (let index = 0; index < rowLines.length - 1; index += 1) {
        const top = rowLines[index];
        const bottom = rowLines[index + 1];
        const height = bottom - top;
        if (height < COURSE_ROW_MIN_HEIGHT || height > COURSE_ROW_MAX_HEIGHT) continue;

        const headingText = await recognizeCrop(worker, pageImage, 80, Math.max(0, top - 180), Math.min(980, pageImage.width - 160), 150, 2);
        const termFromHeading = parseTermFromOcrText(headingText);
        if (termFromHeading) {
          currentTerm = termFromHeading;
          firstTerm ??= termFromHeading;
          applyTermToPendingRows(pendingBeforeFirstTerm, termFromHeading, courses);
        }

        const rowText = await recognizeCrop(worker, pageImage, 110, top + 4, pageImage.width - 220, Math.max(1, height - 8), 3);
        const parsedCourse = parseOcrCourseRow(rowText) ?? await parseOcrCourseCells(worker, pageImage, top, height, rowText);
        if (!parsedCourse) continue;

        const catalogCourse = courseByCode.get(parsedCourse.courseCode);
        const course: TranscriptCourse = {
          courseCode: parsedCourse.courseCode,
          courseName: catalogCourse?.nameTh ?? parsedCourse.courseName,
          credits: catalogCourse?.credits ?? parsedCourse.credits,
          gradeChar: parsedCourse.gradeChar,
          semester: currentTerm?.semester ?? 0,
          academicYear: currentTerm?.academicYear ?? 0,
          sourceRow: parsedCourse.sourceRow
        };
        const key = `${course.courseCode}|${course.semester}|${course.academicYear}|${course.gradeChar}|${course.sourceRow}`;
        if (seenRows.has(key)) continue;
        seenRows.add(key);

        if (!currentTerm) {
          pendingBeforeFirstTerm.push(course);
        } else {
          courses.push(course);
        }
      }
    }
  } finally {
    await worker.terminate();
  }

  if (firstTerm) applyTermToPendingRows(pendingBeforeFirstTerm, firstTerm, courses);
  if (pendingBeforeFirstTerm.length > 0 && !firstTerm) courses.push(...pendingBeforeFirstTerm);

  if (courses.length === 0) {
    warnings.push("OCR อ่านตารางรายวิชาไม่ได้จากไฟล์นี้");
  }

  return validateTranscriptPreview({ courses, summaries, warnings, canConfirm: false });
}

async function prepareOcrLanguageData() {
  const targetDir = path.join(process.cwd(), ".next", "cache", "tessdata");
  await mkdir(targetDir, { recursive: true });

  await Promise.all([
    copyFile(
      path.join(process.cwd(), "node_modules", "@tesseract.js-data", "tha", "4.0.0", "tha.traineddata.gz"),
      path.join(targetDir, "tha.traineddata.gz")
    ),
    copyFile(
      path.join(process.cwd(), "node_modules", "@tesseract.js-data", "eng", "4.0.0_best_int", "eng.traineddata.gz"),
      path.join(targetDir, "eng.traineddata.gz")
    )
  ]);

  return targetDir;
}

function findHorizontalTableLines(image: Awaited<ReturnType<typeof loadImage>>) {
  const canvas = createCanvas(image.width, image.height);
  const context = canvas.getContext("2d");
  context.drawImage(image, 0, 0);
  const pixels = context.getImageData(0, 0, image.width, image.height).data;
  const lineCandidates: number[] = [];
  const minDarkPixels = Math.floor(image.width * 0.25);

  for (let y = 0; y < image.height; y += 1) {
    let darkPixels = 0;
    for (let x = 80; x < image.width - 80; x += 1) {
      const offset = (y * image.width + x) * 4;
      if (pixels[offset] < DARK_PIXEL_THRESHOLD && pixels[offset + 1] < DARK_PIXEL_THRESHOLD && pixels[offset + 2] < DARK_PIXEL_THRESHOLD) {
        darkPixels += 1;
      }
    }
    if (darkPixels > minDarkPixels) lineCandidates.push(y);
  }

  const groups: number[][] = [];
  for (const y of lineCandidates) {
    const latest = groups.at(-1);
    if (!latest || y - latest[latest.length - 1] > 3) {
      groups.push([y]);
    } else {
      latest.push(y);
    }
  }

  return groups.map((group) => Math.round((group[0] + group[group.length - 1]) / 2));
}

async function recognizeCrop(
  worker: Awaited<ReturnType<typeof createWorker>>,
  image: Awaited<ReturnType<typeof loadImage>>,
  x: number,
  y: number,
  width: number,
  height: number,
  scale: number
) {
  const canvas = createCanvas(width * scale, height * scale);
  const context = canvas.getContext("2d");
  context.fillStyle = "white";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(image, x, y, width, height, 0, 0, canvas.width, canvas.height);
  const result = await worker.recognize(canvas.toBuffer("image/png"));
  return result.data.text;
}

function parseTermFromOcrText(text: string): AcademicTerm | undefined {
  const normalized = normalizeOcrText(text);
  const match = normalized.match(/ภาคการศึกษาที่\s*([123])\/(25\d{2})/u) ?? normalized.match(/([123])\/(25\d{2})/u);
  if (!match) return undefined;
  return { semester: Number(match[1]), academicYear: Number(match[2]) };
}

function parseOcrCourseRow(text: string) {
  const normalized = normalizeOcrText(text)
    .replace(/\s+[ป|]\s+/gu, " ")
    .replace(/\s+[Oo]\s+/gu, " 0 ");
  const match = normalized.match(/(SU\d{3}|\d{6})\s+(.+?)\s+([0-9])\s+(S\*|B\+|C\+|D\+|A|B|C|D|F|W|S|U|ว)\s+([0-9]+(?:[.]?[0-9]+)?)/u);
  if (!match) return null;

  return {
    courseCode: match[1],
    courseName: cleanCourseName(match[2]),
    credits: Number(match[3]),
    gradeChar: match[4] === "ว" ? "W" : match[4],
    sourceRow: normalized
  };
}

async function parseOcrCourseCells(
  worker: Awaited<ReturnType<typeof createWorker>>,
  image: Awaited<ReturnType<typeof loadImage>>,
  rowTop: number,
  rowHeight: number,
  sourceRow: string
) {
  const y = rowTop + 5;
  const height = Math.max(1, rowHeight - 10);
  const codeText = await recognizeCrop(worker, image, 120, y, 330, height, 3);
  const nameText = await recognizeCrop(worker, image, 455, y, 760, height, 3);
  const creditText = await recognizeCrop(worker, image, 1220, y, 155, height, 3);
  const gradeText = await recognizeCrop(worker, image, 1375, y, 155, height, 3);
  const code = normalizeOcrText(codeText).match(/SU\d{3}|\d{6}/u)?.[0];
  const credits = normalizeOcrText(creditText).match(/[0-9]/u)?.[0];
  const grade = normalizeOcrText(gradeText).match(/S\*|B\+|C\+|D\+|A|B|C|D|F|W|S|U|ว/u)?.[0];

  if (!code || !credits || !grade) return null;

  return {
    courseCode: code,
    courseName: cleanCourseName(normalizeOcrText(nameText)),
    credits: Number(credits),
    gradeChar: grade === "ว" ? "W" : grade,
    sourceRow: normalizeOcrText(sourceRow)
  };
}

function cleanCourseName(value: string) {
  return value
    .replace(/\s+[ป|]\s*/gu, " ")
    .replace(/^[ป|]+/gu, "")
    .replace(/[ป|]+$/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeOcrText(text: string) {
  return text
    .replace(/[๐O]/g, "0")
    .replace(/๑/g, "1")
    .replace(/๒/g, "2")
    .replace(/๓/g, "3")
    .replace(/๔/g, "4")
    .replace(/๕/g, "5")
    .replace(/๖/g, "6")
    .replace(/๗/g, "7")
    .replace(/๘/g, "8")
    .replace(/๙/g, "9")
    .replace(/([\u0E00-\u0E7F])\s+(?=[\u0E00-\u0E7F])/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

function applyTermToPendingRows(pendingRows: TranscriptCourse[], term: AcademicTerm, courses: TranscriptCourse[]) {
  while (pendingRows.length > 0) {
    const row = pendingRows.shift();
    if (!row) continue;
    courses.push({ ...row, semester: term.semester, academicYear: term.academicYear });
  }
}

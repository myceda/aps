"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { TranscriptCourse, TranscriptPreview as TranscriptPreviewType } from "@/lib/types";
import { validateTranscriptPreview } from "@/lib/transcript/validator";

const gradeOptions = ["A", "B+", "B", "C+", "C", "D+", "D", "F", "W", "I", "S", "S*", "U"];

type PreviewStatus = "idle" | "reading" | "empty" | "warning" | "ready";

type ReviewItem = {
  courseCode: string;
  courseName: string;
  semester: string;
  academicYear: string;
  reason: string;
};

function blankCourse(): TranscriptCourse {
  return {
    courseCode: "",
    courseName: "",
    credits: 3,
    gradeChar: "A",
    semester: 1,
    academicYear: 2568,
    sourceRow: "manual"
  };
}

export function TranscriptPreview({ ownerEmail, ownerName }: { ownerEmail?: string; ownerName?: string }) {
  const [preview, setPreview] = useState<TranscriptPreviewType | null>(null);
  const [uploadId, setUploadId] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<PreviewStatus>("idle");
  const [searchText, setSearchText] = useState("");
  const [isConfirmed, setIsConfirmed] = useState(false);
  const router = useRouter();

  const visibleCourses = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    const courses = preview?.courses ?? [];
    const indexedCourses = courses.map((course, originalIndex) => ({ course, originalIndex }));
    if (!query) return indexedCourses;
    return indexedCourses.filter(({ course }) => `${course.courseCode} ${course.courseName} ${course.gradeChar}`.toLowerCase().includes(query));
  }, [preview?.courses, searchText]);

  const reviewItems = useMemo(() => buildReviewItems(preview), [preview]);
  const courseCount = preview?.courses.length ?? 0;
  const warningCount = reviewItems.length;
  const displayStatus = preview ? getPreviewStatus(preview) : status;
  const dashboardHref = ownerEmail ? `/student?ownerEmail=${encodeURIComponent(ownerEmail)}` : "/student";

  async function upload(file: File) {
    setStatus("reading");
    setIsConfirmed(false);
    setMessage(`กำลังอ่านไฟล์ ${file.name}`);
    const form = new FormData();
    form.append("file", file);
    if (ownerEmail) form.append("ownerEmail", ownerEmail);
    if (ownerName) form.append("ownerName", ownerName);
    const response = await fetch("/api/transcript/preview", { method: "POST", body: form });
    const data = await response.json();
    const nextPreview = data.preview as TranscriptPreviewType;

    setPreview(nextPreview);
    setUploadId(data.uploadId ?? null);
    setSearchText("");
    setStatus(getPreviewStatus(nextPreview));
    setMessage(data.success ? buildResultMessage(nextPreview) : data.error ?? "อัปโหลดไม่สำเร็จ");
  }

  function updateCourse(index: number, key: keyof TranscriptCourse, value: string | number) {
    setIsConfirmed(false);
    setPreview((current) => {
      if (!current) return current;
      const courses = current.courses.map((course, currentIndex) =>
        currentIndex === index ? { ...course, [key]: value } : course
      );
      return validateTranscriptPreview({ ...current, courses });
    });
  }

  function addCourse() {
    setIsConfirmed(false);
    setPreview((current) => {
      const next = current ?? { courses: [], summaries: [], warnings: [], canConfirm: false };
      const courses = [...next.courses, blankCourse()];
      setStatus("warning");
      return validateTranscriptPreview({ ...next, courses });
    });
  }

  function removeCourse(index: number) {
    setIsConfirmed(false);
    setPreview((current) => {
      if (!current) return current;
      const courses = current.courses.filter((_, currentIndex) => currentIndex !== index);
      return validateTranscriptPreview({ ...current, courses });
    });
  }

  async function clearData() {
    setMessage("กำลังล้างข้อมูล...");
    const query = ownerEmail ? `?ownerEmail=${encodeURIComponent(ownerEmail)}` : "";
    const response = await fetch(`/api/transcript/clear${query}`, { method: "DELETE" });
    const data = await response.json();
    if (data.success) {
      setPreview(null);
      setUploadId(null);
      setStatus("idle");
      setSearchText("");
      setIsConfirmed(false);
      setMessage(data.message ?? "ล้างข้อมูลเรียบร้อยแล้ว");
      router.refresh();
    } else {
      setMessage(data.error ?? "ล้างข้อมูลไม่สำเร็จ");
    }
  }

  async function confirm() {
    if (!preview) return;
    const cleanedPreview = validateTranscriptPreview({
      ...preview,
      courses: preview.courses.map((course) => ({
        ...course,
        courseCode: course.courseCode.trim(),
        courseName: course.courseName.trim(),
        sourceRow: course.sourceRow || "manual-corrected"
      }))
    });
    const response = await fetch("/api/transcript/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...cleanedPreview, uploadId, ownerEmail, ownerName })
    });
    const data = await response.json();
    if (data.success) {
      setMessage(`บันทึกข้อมูลผลการเรียนแล้ว ${data.savedRows} รายวิชา`);
      setIsConfirmed(true);
      router.refresh();
    } else {
      setMessage(data.error ?? "ยืนยันไม่สำเร็จ");
    }
  }

  return (
    <section className="surface p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-sky-700">ขั้นตอนที่ 2 และ 3</p>
          <h2 className="mt-1 text-xl font-bold text-ink">อัปโหลด PDF แล้วตรวจข้อมูลก่อนยืนยัน</h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">
            PDF บางไฟล์อาจอ่านไม่ครบ โดยเฉพาะไฟล์สแกนหรือไฟล์ที่จัดวางตัวอักษรไม่มาตรฐาน จึงต้องตรวจตารางก่อนกดยืนยันทุกครั้ง
          </p>
        </div>
        <StatusPill status={displayStatus} />
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[360px_1fr]">
        <div className="rounded-2xl border border-line bg-slate-50 p-4">
          <p className="text-sm font-bold text-slate-500">ขั้นตอนที่ 2</p>
          <h3 className="mt-1 text-lg font-bold text-ink">อัปโหลดหรือเพิ่มข้อมูล</h3>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            เริ่มจาก PDF transcript หากอ่านไม่ครบให้เพิ่มรายวิชาเองได้ทันที
          </p>

          <div className="mt-4 grid gap-2">
            <label className="cursor-pointer rounded-xl bg-sky-600 px-4 py-3 text-center text-sm font-bold text-white shadow-sm hover:bg-sky-700">
              อัปโหลด PDF ผลการเรียน
              <input className="hidden" type="file" accept="application/pdf" onChange={(event) => event.target.files?.[0] && upload(event.target.files[0])} />
            </label>
            <button className="rounded-xl border border-line bg-white px-4 py-3 text-sm font-bold hover:bg-mist" onClick={addCourse}>
              เพิ่มรายวิชาเอง
            </button>
            <button className="rounded-xl border border-red-300 bg-white px-4 py-3 text-sm font-bold text-red-600 hover:bg-red-50" onClick={clearData}>
              ล้างข้อมูลเก่า
            </button>
          </div>

          <div className="mt-4 grid gap-3">
            <Metric label="รายวิชาที่พบ" value={courseCount} />
            <Metric label="จุดที่ต้องตรวจ" value={warningCount} />
            <Metric label="สถานะข้อมูล" value={getStatusLabel(displayStatus)} />
          </div>
        </div>

        <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4">
          <p className="text-sm font-bold text-sky-900">ข้อควรจำเกี่ยวกับ PDF</p>
          <p className="mt-1 text-sm leading-6 text-slate-700">
            ระบบช่วยอ่านไฟล์ให้เร็วขึ้น แต่ไม่ควรเชื่อผลอ่านทันที ต้องตรวจรหัสวิชา ชื่อวิชา หน่วยกิต เกรด เทอม และปีให้ตรงกับ transcript จริงก่อนยืนยัน
          </p>
          {isConfirmed ? (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-white p-4">
              <p className="text-sm font-bold text-emerald-700">บันทึกข้อมูลแล้ว สามารถกลับไปดูผลวิเคราะห์ใหม่ได้</p>
              <Link className="rounded-xl bg-slate-950 px-4 py-3 text-sm font-bold text-white shadow-sm hover:bg-slate-800" href={dashboardHref}>
                กลับ Student Dashboard
              </Link>
            </div>
          ) : null}
        </div>
      </div>

      {message ? <p className="mt-4 rounded-md border border-line bg-mist p-3 text-sm leading-6 text-slate-700">{message}</p> : null}

      <div className="mt-5 rounded-2xl border border-line bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-bold text-slate-500">ขั้นตอนที่ 3</p>
            <h3 className="mt-1 font-bold text-ink">ตรวจและยืนยันข้อมูลผลการเรียน</h3>
            <p className="mt-1 text-sm text-slate-600">ตรวจรหัสวิชา หน่วยกิต เกรด เทอม และปี ก่อนกดยืนยันเพื่อให้ dashboard คำนวณใหม่</p>
          </div>
          <input
            className="w-full rounded-xl border border-line px-3 py-2 text-sm sm:w-64"
            placeholder="ค้นหารหัสหรือชื่อวิชา"
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
          />
        </div>

        {reviewItems.length ? <ReviewWarningPanel items={reviewItems} /> : null}

        {!preview || courseCount === 0 ? (
          <EmptyPreview status={status} />
        ) : (
          <>
            <div className="mt-3 max-h-[420px] overflow-auto rounded-xl border border-line">
              <table className="w-full min-w-[980px] text-left text-sm">
                <thead className="sticky top-0 bg-mist">
                  <tr>
                    <th className="px-3 py-2">รหัส</th>
                    <th className="px-3 py-2">รายวิชา</th>
                    <th className="px-3 py-2">หน่วยกิต</th>
                    <th className="px-3 py-2">เกรด</th>
                    <th className="px-3 py-2">เทอม</th>
                    <th className="px-3 py-2">ปี</th>
                    <th className="px-3 py-2">ตรวจสอบ</th>
                    <th className="px-3 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {visibleCourses.map(({ course, originalIndex }) => (
                    <tr className={`border-t border-line ${getCourseRowClass(course)}`} key={`${course.courseCode}-${course.academicYear}-${course.semester}-${originalIndex}`}>
                      <td className="px-3 py-2">
                        <input className="w-28 rounded-md border border-line px-2 py-2" value={course.courseCode} onChange={(event) => updateCourse(originalIndex, "courseCode", event.target.value)} />
                      </td>
                      <td className="px-3 py-2">
                        <input className="w-full min-w-72 rounded-md border border-line px-2 py-2" value={course.courseName} onChange={(event) => updateCourse(originalIndex, "courseName", event.target.value)} />
                      </td>
                      <td className="px-3 py-2">
                        <input className="w-24 rounded-md border border-line px-2 py-2" type="number" value={course.credits} onChange={(event) => updateCourse(originalIndex, "credits", Number(event.target.value))} />
                      </td>
                      <td className="px-3 py-2">
                        <select className="rounded-md border border-line px-2 py-2" value={course.gradeChar} onChange={(event) => updateCourse(originalIndex, "gradeChar", event.target.value)}>
                          {gradeOptions.map((grade) => <option key={grade}>{grade}</option>)}
                        </select>
                      </td>
                      <td className="px-3 py-2">
                        <input className="w-24 rounded-md border border-line px-2 py-2" type="number" value={course.semester} onChange={(event) => updateCourse(originalIndex, "semester", Number(event.target.value))} />
                      </td>
                      <td className="px-3 py-2">
                        <input className="w-28 rounded-md border border-line px-2 py-2" type="number" value={course.academicYear} onChange={(event) => updateCourse(originalIndex, "academicYear", Number(event.target.value))} />
                      </td>
                      <td className="px-3 py-2">
                        <CourseValidationBadge course={course} />
                      </td>
                      <td className="px-3 py-2">
                        <button className="rounded-xl border border-red-300 px-3 py-2 text-red-600 hover:bg-red-50" onClick={() => removeCourse(originalIndex)}>ลบ</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-slate-600">แสดง {visibleCourses.length}/{courseCount} รายวิชา</p>
              <button className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white shadow-sm hover:bg-slate-800 disabled:opacity-60" disabled={!preview.canConfirm || courseCount === 0} onClick={confirm}>
                ยืนยันข้อมูลนี้และอัปเดต Dashboard
              </button>
            </div>
          </>
        )}
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-xl border border-line bg-white p-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-xl font-bold text-ink">{value}</p>
    </div>
  );
}

function StatusPill({ status }: { status: PreviewStatus }) {
  const className: Record<PreviewStatus, string> = {
    idle: "border-line bg-white text-slate-700",
    reading: "border-sky-200 bg-sky-50 text-sky-700",
    empty: "border-red-200 bg-red-50 text-red-700",
    warning: "border-amber-200 bg-amber-50 text-amber-700",
    ready: "border-emerald-200 bg-emerald-50 text-emerald-700"
  };

  return (
    <span className={`rounded-md border px-3 py-2 text-sm font-bold ${className[status]}`}>
      {getStatusLabel(status)}
    </span>
  );
}

function buildReviewItems(preview: TranscriptPreviewType | null): ReviewItem[] {
  if (!preview) return [];

  const globalItems = preview.warnings.map((warning) => {
    const courseCode = warning.match(/[A-Z]{2}\d{3}|\d{6}/)?.[0];
    const course = courseCode ? preview.courses.find((item) => item.courseCode === courseCode) : undefined;

    return {
      courseCode: courseCode ?? "ทั้งไฟล์",
      courseName: course?.courseName || "-",
      semester: course?.semester ? String(course.semester) : "-",
      academicYear: course?.academicYear ? String(course.academicYear) : "-",
      reason: warning
    };
  });

  const rowItems = preview.courses.flatMap((course) =>
    (course.validationMessages ?? []).map((reason) => ({
      courseCode: course.courseCode || "แถวใหม่",
      courseName: course.courseName || "-",
      semester: course.semester ? String(course.semester) : "-",
      academicYear: course.academicYear ? String(course.academicYear) : "-",
      reason
    }))
  );

  return [...globalItems, ...rowItems];
}

function CourseValidationBadge({ course }: { course: TranscriptCourse }) {
  const messages = course.validationMessages ?? [];
  if (messages.length === 0) {
    return <span className="rounded-md bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-700">ผ่าน</span>;
  }

  const isError = course.validationSeverity === "error";

  return (
    <div className="min-w-48 space-y-1">
      <span className={`inline-flex rounded-md px-2 py-1 text-xs font-bold ${isError ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"}`}>
        {isError ? "ต้องแก้ก่อนบันทึก" : "โปรดอ่านก่อนบันทึก"}
      </span>
      <ul className="space-y-1 text-xs leading-5 text-slate-600">
        {messages.map((message) => (
          <li key={message}>{message}</li>
        ))}
      </ul>
    </div>
  );
}

function getCourseRowClass(course: TranscriptCourse) {
  if (course.validationSeverity === "error") return "bg-red-50/70";
  if (course.validationSeverity === "warning") return "bg-amber-50/60";
  return "bg-white";
}

function EmptyPreview({ status }: { status: PreviewStatus }) {
  return (
    <div className="mt-3 rounded-xl border border-dashed border-line bg-white p-6 text-center">
      <p className="font-bold">{status === "empty" ? "ไฟล์นี้ยังอ่านรายวิชาไม่ได้" : "ยังไม่มีรายวิชาให้ตรวจ"}</p>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        {status === "empty"
          ? "ลองใช้ไฟล์ PDF ที่เลือกข้อความได้ หรือกดเพิ่มรายวิชาด้วยตนเองเพื่อกรอกข้อมูล"
          : "อัปโหลด PDF หรือเพิ่มแถวด้วยตนเองเพื่อเริ่มตรวจข้อมูล"}
      </p>
    </div>
  );
}

function ReviewWarningPanel({ items }: { items: ReviewItem[] }) {
  return (
    <div className="mt-3 rounded-xl border border-amber bg-amber-50 p-3 text-sm text-amber">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-bold">แถวที่ต้องตรวจเพิ่มก่อนบันทึก</p>
          <p className="mt-1 text-xs leading-5">ตรวจรหัสวิชา ชื่อวิชา เทอม และปีให้ถูกต้องก่อนกดยืนยัน</p>
        </div>
        <span className="rounded-md bg-white px-2 py-1 text-xs font-bold">{items.length} จุด</span>
      </div>

      <div className="mt-3 overflow-auto rounded-md border border-amber/40 bg-white">
        <table className="w-full min-w-[720px] text-left text-xs text-slate-700">
          <thead className="bg-amber-50 text-amber">
            <tr>
              <th className="px-3 py-2">รหัสวิชา</th>
              <th className="px-3 py-2">ชื่อวิชา</th>
              <th className="px-3 py-2">เทอม</th>
              <th className="px-3 py-2">ปี</th>
              <th className="px-3 py-2">เหตุผล</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr className="border-t border-amber/20" key={`${item.courseCode}-${item.reason}-${index}`}>
                <td className="px-3 py-2 font-semibold">{item.courseCode}</td>
                <td className="px-3 py-2">{item.courseName}</td>
                <td className="px-3 py-2">{item.semester}</td>
                <td className="px-3 py-2">{item.academicYear}</td>
                <td className="px-3 py-2">{item.reason}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function getPreviewStatus(preview: TranscriptPreviewType): PreviewStatus {
  if (preview.courses.length === 0) return "empty";
  if (preview.warnings.length > 0 || preview.courses.some((course) => course.validationSeverity && course.validationSeverity !== "ok")) return "warning";
  return "ready";
}

function getStatusLabel(status: PreviewStatus) {
  const labels: Record<PreviewStatus, string> = {
    idle: "รอข้อมูล",
    reading: "กำลังอ่านไฟล์",
    empty: "ยังอ่านไม่ได้",
    warning: "ต้องตรวจเพิ่ม",
    ready: "พร้อมบันทึก"
  };
  return labels[status];
}

function buildResultMessage(preview: TranscriptPreviewType) {
  if (preview.courses.length === 0) return "อ่านไฟล์แล้ว แต่ยังไม่พบรายวิชา";
  const reviewCount = buildReviewItems(preview).length;
  if (reviewCount > 0) return `พบ ${preview.courses.length} รายวิชา แต่มี ${reviewCount} จุดที่ต้องตรวจ`;
  return `พบ ${preview.courses.length} รายวิชา พร้อมให้ตรวจและบันทึก`;
}

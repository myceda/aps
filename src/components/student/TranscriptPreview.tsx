"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { TranscriptCourse, TranscriptPreview as TranscriptPreviewType } from "@/lib/types";

const gradeOptions = ["A", "B+", "B", "C+", "C", "D+", "D", "F", "W", "S", "S*", "U"];

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

export function TranscriptPreview() {
  const [preview, setPreview] = useState<TranscriptPreviewType | null>(null);
  const [uploadId, setUploadId] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<PreviewStatus>("idle");
  const [searchText, setSearchText] = useState("");
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
  const warningCount = preview?.warnings.length ?? 0;

  async function upload(file: File) {
    setStatus("reading");
    setMessage(`กำลังอ่านไฟล์ ${file.name}`);
    const form = new FormData();
    form.append("file", file);
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
    setPreview((current) => {
      if (!current) return current;
      const courses = current.courses.map((course, currentIndex) =>
        currentIndex === index ? { ...course, [key]: value } : course
      );
      return { ...current, courses, canConfirm: courses.length > 0 };
    });
  }

  function addCourse() {
    setPreview((current) => {
      const next = current ?? { courses: [], summaries: [], warnings: [], canConfirm: true };
      const courses = [...next.courses, blankCourse()];
      setStatus("warning");
      return { ...next, courses, canConfirm: true };
    });
  }

  function removeCourse(index: number) {
    setPreview((current) => {
      if (!current) return current;
      const courses = current.courses.filter((_, currentIndex) => currentIndex !== index);
      return { ...current, courses, canConfirm: courses.length > 0 };
    });
  }

  async function clearData() {
    setMessage("กำลังล้างข้อมูล...");
    const response = await fetch("/api/transcript/clear", { method: "DELETE" });
    const data = await response.json();
    if (data.success) {
      setPreview(null);
      setUploadId(null);
      setStatus("idle");
      setSearchText("");
      setMessage(data.message ?? "ล้างข้อมูลเรียบร้อยแล้ว");
      router.refresh();
    } else {
      setMessage(data.error ?? "ล้างข้อมูลไม่สำเร็จ");
    }
  }

  async function confirm() {
    if (!preview) return;
    const cleanedPreview = {
      ...preview,
      warnings: [],
      canConfirm: preview.courses.length > 0,
      courses: preview.courses.map((course) => ({
        ...course,
        courseCode: course.courseCode.trim(),
        courseName: course.courseName.trim(),
        sourceRow: course.sourceRow || "manual-corrected"
      }))
    };
    const response = await fetch("/api/transcript/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...cleanedPreview, uploadId })
    });
    const data = await response.json();
    if (data.success) {
      setMessage(`บันทึก transcript แล้ว ${data.savedRows} รายวิชา`);
      router.refresh();
    } else {
      setMessage(data.error ?? "ยืนยันไม่สำเร็จ");
    }
  }

  return (
    <section className="rounded-md border border-line bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-teal">Transcript tools</p>
          <h2 className="mt-1 text-lg font-bold text-ink">แก้ข้อมูล transcript ก่อนนำไปวิเคราะห์</h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">
            ใช้ส่วนนี้เมื่อยังไม่มีข้อมูล หรือเมื่อระบบอ่าน PDF ไม่ครบ หลังบันทึกแล้ว dashboard ด้านบนจะคำนวณใหม่อัตโนมัติ
          </p>
        </div>
        <StatusPill status={status} />
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <Metric label="รายวิชาที่พบ" value={courseCount} />
        <Metric label="จุดที่ต้องตรวจ" value={warningCount} />
        <Metric label="สถานะข้อมูล" value={getStatusLabel(status)} />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <label className="cursor-pointer rounded-md bg-teal px-4 py-2 text-sm font-bold text-white">
          อัปโหลด PDF
          <input className="hidden" type="file" accept="application/pdf" onChange={(event) => event.target.files?.[0] && upload(event.target.files[0])} />
        </label>
        <button className="rounded-md border border-line bg-white px-4 py-2 text-sm font-bold" onClick={addCourse}>
          เพิ่มรายวิชาเอง
        </button>
        <button className="rounded-md border border-coral bg-white px-4 py-2 text-sm font-bold text-coral" onClick={clearData}>
          ล้างข้อมูลเก่า
        </button>
      </div>

      {message ? <p className="mt-4 rounded-md border border-line bg-mist p-3 text-sm leading-6 text-slate-700">{message}</p> : null}

      <div className="mt-4 rounded-md border border-line p-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-ink">ตรวจและแก้ไขรายวิชา</h3>
            <p className="mt-1 text-sm text-slate-600">ตรวจรหัสวิชา หน่วยกิต เกรด เทอม และปี ก่อนกดยืนยัน</p>
          </div>
          <input
            className="w-full rounded-md border border-line px-3 py-2 text-sm sm:w-64"
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
            <div className="mt-3 max-h-[420px] overflow-auto rounded-md border border-line">
              <table className="w-full min-w-[980px] text-left text-sm">
                <thead className="sticky top-0 bg-mist">
                  <tr>
                    <th className="px-3 py-2">รหัส</th>
                    <th className="px-3 py-2">รายวิชา</th>
                    <th className="px-3 py-2">หน่วยกิต</th>
                    <th className="px-3 py-2">เกรด</th>
                    <th className="px-3 py-2">เทอม</th>
                    <th className="px-3 py-2">ปี</th>
                    <th className="px-3 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {visibleCourses.map(({ course, originalIndex }) => (
                    <tr className="border-t border-line" key={`${course.courseCode}-${course.academicYear}-${course.semester}-${originalIndex}`}>
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
                        <button className="rounded-md border border-coral px-3 py-2 text-coral" onClick={() => removeCourse(originalIndex)}>ลบ</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-slate-600">แสดง {visibleCourses.length}/{courseCount} รายวิชา</p>
              <button className="rounded-md bg-teal px-4 py-3 text-sm font-bold text-white" onClick={confirm}>
                ยืนยันและบันทึก transcript
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
    <div className="rounded-md border border-line bg-white p-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-xl font-bold text-ink">{value}</p>
    </div>
  );
}

function StatusPill({ status }: { status: PreviewStatus }) {
  const className: Record<PreviewStatus, string> = {
    idle: "border-line bg-white text-slate-700",
    reading: "border-teal bg-teal/10 text-teal",
    empty: "border-coral bg-red-50 text-coral",
    warning: "border-amber bg-amber-50 text-amber",
    ready: "border-leaf bg-green-50 text-leaf"
  };

  return (
    <span className={`rounded-md border px-3 py-2 text-sm font-bold ${className[status]}`}>
      {getStatusLabel(status)}
    </span>
  );
}

function buildReviewItems(preview: TranscriptPreviewType | null): ReviewItem[] {
  if (!preview?.warnings.length) return [];

  return preview.warnings.map((warning) => {
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
}

function EmptyPreview({ status }: { status: PreviewStatus }) {
  return (
    <div className="mt-3 rounded-md border border-dashed border-line bg-white p-6 text-center">
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
    <div className="mt-3 rounded-md border border-amber bg-amber-50 p-3 text-sm text-amber">
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
  if (preview.warnings.length > 0) return "warning";
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
  if (preview.warnings.length > 0) return `พบ ${preview.courses.length} รายวิชา แต่มี ${preview.warnings.length} จุดที่ต้องตรวจ`;
  return `พบ ${preview.courses.length} รายวิชา พร้อมให้ตรวจและบันทึก`;
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { TranscriptCourse, TranscriptPreview as TranscriptPreviewType } from "@/lib/types";

const gradeOptions = ["A", "B+", "B", "C+", "C", "D+", "D", "F", "W", "S", "S*"];

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
  const router = useRouter();

  async function upload(file: File) {
    setMessage("กำลังสกัดข้อมูลจาก PDF");
    const form = new FormData();
    form.append("file", file);
    const response = await fetch("/api/transcript/preview", { method: "POST", body: form });
    const data = await response.json();
    setPreview(data.preview);
    setUploadId(data.uploadId ?? null);
    setMessage(data.success ? "ตรวจ preview และแก้ไขข้อมูลก่อนยืนยัน" : data.error ?? "อัปโหลดไม่สำเร็จ");
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
      return { ...next, courses: [...next.courses, blankCourse()], canConfirm: true };
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
      setMessage(`ยืนยันแล้ว บันทึก ${data.savedRows} รายการลงฐานข้อมูล`);
      router.refresh();
    } else {
      setMessage(data.error ?? "ยืนยันไม่สำเร็จ");
    }
  }

  return (
    <section className="surface p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold">Transcript Upload + Manual Correction</h2>
          <p className="mt-1 text-sm text-slate-600">สกัดข้อมูลด้วย unpdf แล้วแก้ไขแถวก่อนบันทึกลง PostgreSQL</p>
        </div>
        <div className="flex gap-2">
          <button className="rounded-md border border-line px-4 py-2 text-sm font-semibold" onClick={addCourse}>เพิ่มแถว</button>
          <label className="rounded-md bg-teal px-4 py-2 text-sm font-semibold text-white">
            Upload PDF
            <input className="hidden" type="file" accept="application/pdf" onChange={(event) => event.target.files?.[0] && upload(event.target.files[0])} />
          </label>
          <button className="rounded-md border border-coral px-4 py-2 text-sm font-semibold text-coral" onClick={clearData}>ล้างข้อมูลเก่า</button>
        </div>
      </div>

      {message ? <p className="mt-3 rounded-md border border-line bg-mist p-3 text-sm">{message}</p> : null}
      {preview?.warnings.length ? (
        <div className="mt-3 rounded-md border border-amber bg-amber-50 p-3 text-sm text-amber">
          {preview.warnings.map((warning) => <p key={warning}>{warning}</p>)}
        </div>
      ) : null}

      {preview ? (
        <>
          <div className="mt-3 max-h-96 overflow-auto rounded-md border border-line">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="bg-mist">
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
                {preview.courses.map((course, index) => (
                  <tr className="border-t border-line" key={`${course.courseCode}-${index}`}>
                    <td className="px-3 py-2">
                      <input className="w-24 rounded-md border border-line px-2 py-1" value={course.courseCode} onChange={(event) => updateCourse(index, "courseCode", event.target.value)} />
                    </td>
                    <td className="px-3 py-2">
                      <input className="w-full min-w-64 rounded-md border border-line px-2 py-1" value={course.courseName} onChange={(event) => updateCourse(index, "courseName", event.target.value)} />
                    </td>
                    <td className="px-3 py-2">
                      <input className="w-20 rounded-md border border-line px-2 py-1" type="number" value={course.credits} onChange={(event) => updateCourse(index, "credits", Number(event.target.value))} />
                    </td>
                    <td className="px-3 py-2">
                      <select className="rounded-md border border-line px-2 py-1" value={course.gradeChar} onChange={(event) => updateCourse(index, "gradeChar", event.target.value)}>
                        {gradeOptions.map((grade) => <option key={grade}>{grade}</option>)}
                      </select>
                    </td>
                    <td className="px-3 py-2">
                      <input className="w-20 rounded-md border border-line px-2 py-1" type="number" value={course.semester} onChange={(event) => updateCourse(index, "semester", Number(event.target.value))} />
                    </td>
                    <td className="px-3 py-2">
                      <input className="w-24 rounded-md border border-line px-2 py-1" type="number" value={course.academicYear} onChange={(event) => updateCourse(index, "academicYear", Number(event.target.value))} />
                    </td>
                    <td className="px-3 py-2">
                      <button className="rounded-md border border-coral px-2 py-1 text-coral" onClick={() => removeCourse(index)}>ลบ</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button className="mt-3 rounded-md border border-line px-4 py-2 text-sm font-semibold" onClick={confirm}>
            ยืนยันและบันทึก transcript
          </button>
        </>
      ) : (
        <p className="mt-4 text-sm text-slate-600">ยังไม่มีไฟล์ preview กด Upload PDF หรือเพิ่มแถวด้วยตนเอง</p>
      )}
    </section>
  );
}

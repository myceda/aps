"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type AdminCourse = {
  id: number;
  code: string;
  nameTh: string;
  credits: number;
  program?: {
    code: string;
  } | null;
};

type AdminOffering = {
  id: number;
  academicYear: number;
  semester: number;
  isSummer: boolean;
  course: AdminCourse;
};

const semesters = [
  { value: 1, label: "เทอม 1" },
  { value: 2, label: "เทอม 2" },
  { value: 3, label: "เทอม 3 / ภาคฤดูร้อน" }
];

export function AdminCourseOfferingPanel() {
  const [courses, setCourses] = useState<AdminCourse[]>([]);
  const [offerings, setOfferings] = useState<AdminOffering[]>([]);
  const [courseCode, setCourseCode] = useState("");
  const [academicYear, setAcademicYear] = useState(2568);
  const [semester, setSemester] = useState(1);
  const [editId, setEditId] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const groupedOfferings = useMemo(() => {
    return semesters.map((item) => ({
      ...item,
      offerings: offerings.filter((offering) => offering.semester === item.value)
    }));
  }, [offerings]);

  const loadData = useCallback(async () => {
    const [courseResponse, offeringResponse] = await Promise.all([
      fetch("/api/admin/courses"),
      fetch("/api/admin/offerings")
    ]);
    const [courseData, offeringData] = await Promise.all([
      courseResponse.json(),
      offeringResponse.json()
    ]);

    setCourses(courseData.items ?? []);
    setOfferings(offeringData.items ?? []);

    const firstCourse = courseData.items?.[0] as AdminCourse | undefined;
    if (firstCourse) {
      setCourseCode((current) => current || firstCourse.code);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  async function submit() {
    if (!courseCode) {
      setMessage("กรุณาเลือกรายวิชา");
      return;
    }

    setIsLoading(true);
    setMessage("");

    const endpoint = editId ? `/api/admin/offerings/${editId}` : "/api/admin/offerings";
    const response = await fetch(endpoint, {
      method: editId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        courseCode,
        academicYear,
        semester
      })
    });
    const data = await response.json();

    setMessage(data.success ? "บันทึกรายวิชาที่เปิดสอนสำเร็จ" : data.error ?? "บันทึกข้อมูลไม่สำเร็จ");
    setIsLoading(false);

    if (data.success) {
      resetForm();
      await loadData();
    }
  }

  async function remove(id: number) {
    setIsLoading(true);
    setMessage("");

    const response = await fetch(`/api/admin/offerings/${id}`, { method: "DELETE" });
    const data = await response.json();

    setMessage(data.success ? "ลบรายวิชาที่เปิดสอนสำเร็จ" : data.error ?? "ลบข้อมูลไม่สำเร็จ");
    setIsLoading(false);

    if (data.success) {
      await loadData();
    }
  }

  function startEdit(offering: AdminOffering) {
    setEditId(offering.id);
    setCourseCode(offering.course.code);
    setAcademicYear(offering.academicYear);
    setSemester(offering.semester);
    setMessage("");
  }

  function resetForm() {
    setEditId(null);
    setSemester(1);
  }

  return (
    <section className="surface p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold">จัดการรายวิชาที่เปิดสอน</h2>
          <p className="mt-1 text-sm text-slate-600">
            เพิ่ม แก้ไข หรือลบรายวิชาที่เปิดสอนในเทอม 1 เทอม 2 และเทอม 3 / ภาคฤดูร้อน โดยไม่ต้องเขียน JSON
          </p>
        </div>
        <button className="rounded-md border border-line px-3 py-2 text-sm font-semibold" onClick={loadData}>
          โหลดข้อมูลใหม่
        </button>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[0.85fr_1.15fr]">
        <div className="grid gap-3 rounded-md border border-line p-3">
          <label className="text-sm font-semibold">
            รายวิชา
            <select className="mt-2 w-full rounded-md border border-line px-3 py-2" value={courseCode} onChange={(event) => setCourseCode(event.target.value)}>
              {courses.map((course) => (
                <option key={course.id} value={course.code}>
                  {course.code} {course.nameTh}
                </option>
              ))}
            </select>
          </label>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm font-semibold">
              ปีการศึกษา
              <input className="mt-2 w-full rounded-md border border-line px-3 py-2" type="number" value={academicYear} onChange={(event) => setAcademicYear(Number(event.target.value))} />
            </label>
            <label className="text-sm font-semibold">
              ภาคการศึกษา
              <select className="mt-2 w-full rounded-md border border-line px-3 py-2" value={semester} onChange={(event) => setSemester(Number(event.target.value))}>
                {semesters.map((item) => (
                  <option key={item.value} value={item.value}>{item.label}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="flex flex-wrap gap-2">
            <button className="rounded-md bg-teal px-4 py-2 text-sm font-semibold text-white disabled:opacity-60" disabled={isLoading} onClick={submit}>
              {editId ? "อัปเดตรายวิชาเปิดสอน" : "เพิ่มรายวิชาเปิดสอน"}
            </button>
            {editId ? (
              <button className="rounded-md border border-line px-4 py-2 text-sm font-semibold" onClick={resetForm}>
                ยกเลิกแก้ไข
              </button>
            ) : null}
          </div>

          {message ? <p className="rounded-md border border-line bg-mist p-3 text-sm text-slate-600">{message}</p> : null}
        </div>

        <div className="grid gap-3">
          {groupedOfferings.map((group) => (
            <div className="rounded-md border border-line" key={group.value}>
              <div className="flex items-center justify-between border-b border-line bg-mist px-3 py-2">
                <p className="font-semibold">{group.label}</p>
                <p className="text-sm text-slate-500">{group.offerings.length} รายวิชา</p>
              </div>
              <div className="grid gap-2 p-3">
                {group.offerings.length === 0 ? (
                  <p className="text-sm text-slate-500">ยังไม่มีรายวิชาที่เปิดสอนในเทอมนี้</p>
                ) : (
                  group.offerings.map((offering) => (
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-md bg-white p-3" key={offering.id}>
                      <div>
                        <p className="font-semibold">{offering.course.code} {offering.course.nameTh}</p>
                        <p className="text-sm text-slate-500">
                          ปีการศึกษา {offering.academicYear} · {offering.course.credits} หน่วยกิต
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button className="rounded-md border border-line px-3 py-2 text-sm font-semibold" onClick={() => startEdit(offering)}>
                          แก้ไข
                        </button>
                        <button className="rounded-md border border-coral px-3 py-2 text-sm font-semibold text-coral" onClick={() => remove(offering.id)}>
                          ลบ
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

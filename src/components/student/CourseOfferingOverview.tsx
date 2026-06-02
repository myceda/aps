"use client";

import { useEffect, useMemo, useState } from "react";

type Offering = {
  id: number;
  academicYear: number;
  semester: number;
  isSummer: boolean;
  courseCode: string;
  courseName: string;
  credits: number;
};

const semesters = [
  { value: 1, label: "เทอม 1" },
  { value: 2, label: "เทอม 2" },
  { value: 3, label: "เทอม 3 / ภาคฤดูร้อน" }
];

export function CourseOfferingOverview({ programCode }: { programCode: string }) {
  const [academicYear, setAcademicYear] = useState(2568);
  const [offerings, setOfferings] = useState<Offering[]>([]);
  const [message, setMessage] = useState("");

  const groupedOfferings = useMemo(() => {
    return semesters.map((semester) => ({
      ...semester,
      offerings: offerings.filter((offering) => offering.semester === semester.value)
    }));
  }, [offerings]);

  useEffect(() => {
    const controller = new AbortController();

    fetch(`/api/course-offerings?program=${programCode}&academicYear=${academicYear}`, {
      signal: controller.signal
    })
      .then((response) => response.json())
      .then((data) => {
        setOfferings(data.offerings ?? []);
        setMessage(data.success ? "" : data.error ?? "โหลดข้อมูลรายวิชาที่เปิดสอนไม่สำเร็จ");
      })
      .catch(() => undefined);

    return () => controller.abort();
  }, [academicYear, programCode]);

  return (
    <section className="surface p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-teal">รายวิชาที่เปิดสอน</p>
          <h2 className="text-lg font-bold">ดูรายวิชาที่คาดว่าจะเปิดในแต่ละภาคการศึกษา</h2>
          <p className="mt-1 text-sm text-slate-600">
            แสดงแยกตามเทอม 1 เทอม 2 และเทอม 3 / ภาคฤดูร้อน เพื่อช่วยเลือกวิชาสำหรับแผนเรียนและการเรียนซ้ำ
          </p>
        </div>
        <label className="text-sm font-semibold">
          ปีการศึกษา
          <input className="mt-2 w-32 rounded-md border border-line px-3 py-2" type="number" value={academicYear} onChange={(event) => setAcademicYear(Number(event.target.value))} />
        </label>
      </div>

      {message ? <p className="mt-4 rounded-md border border-line bg-mist p-3 text-sm text-slate-600">{message}</p> : null}

      <div className="mt-4 grid gap-3 lg:grid-cols-3">
        {groupedOfferings.map((group) => (
          <div className="rounded-md border border-line" key={group.value}>
            <div className="border-b border-line bg-mist px-3 py-2">
              <p className="font-semibold">{group.label}</p>
              <p className="text-xs text-slate-500">{group.offerings.length} รายวิชา</p>
            </div>
            <div className="grid gap-2 p-3">
              {group.offerings.length === 0 ? (
                <p className="text-sm text-slate-500">ยังไม่มีข้อมูลเปิดสอนในเทอมนี้</p>
              ) : (
                group.offerings.map((offering) => (
                  <div className="rounded-md bg-white p-3" key={offering.id}>
                    <p className="font-semibold">{offering.courseCode}</p>
                    <p className="mt-1 text-sm text-slate-700">{offering.courseName}</p>
                    <p className="mt-2 text-xs text-slate-500">{offering.credits} หน่วยกิต</p>
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

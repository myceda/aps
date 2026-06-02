"use client";

import { useEffect, useMemo, useState } from "react";
import type { SimulationCourseInput, SimulationResult } from "@/lib/types";

type Offering = {
  id: number;
  academicYear: number;
  semester: number;
  isSummer: boolean;
  courseCode: string;
  courseName: string;
  credits: number;
};

const gradeOptions = ["A", "B+", "B", "C+", "C", "D+", "D", "F"];

export function GpaxSimulator({ programCode }: { programCode: string }) {
  const [academicYear, setAcademicYear] = useState(2568);
  const [semester, setSemester] = useState(1);
  const [target, setTarget] = useState(3.2);
  const [offerings, setOfferings] = useState<Offering[]>([]);
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [result, setResult] = useState<SimulationResult | null>(null);

  const selectedCourses = useMemo<SimulationCourseInput[]>(
    () =>
      offerings
        .filter((offering) => selected[offering.courseCode])
        .map((offering) => ({
          courseCode: offering.courseCode,
          credits: offering.credits,
          expectedGradeChar: selected[offering.courseCode]
        })),
    [offerings, selected]
  );

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/course-offerings?program=${programCode}&academicYear=${academicYear}&semester=${semester}`, {
      signal: controller.signal
    })
      .then((response) => response.json())
      .then((data) => {
        setOfferings(data.offerings ?? []);
        setSelected({});
      })
      .catch(() => undefined);

    return () => controller.abort();
  }, [academicYear, programCode, semester]);

  useEffect(() => {
    const controller = new AbortController();

    fetch("/api/simulation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        targetGpax: target,
        courses: selectedCourses
      }),
      signal: controller.signal
    })
      .then((response) => response.json())
      .then((data) => setResult(data.result))
      .catch(() => undefined);

    return () => controller.abort();
  }, [selectedCourses, target]);

  function setCourseGrade(courseCode: string, grade: string) {
    setSelected((current) => {
      const next = { ...current };
      if (!grade) {
        delete next[courseCode];
      } else {
        next[courseCode] = grade;
      }
      return next;
    });
  }

  return (
    <section className="surface p-4">
      <h2 className="text-lg font-bold">จำลอง GPAX จากรายวิชาที่เปิดสอน</h2>
      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <label className="text-sm font-semibold">
          ปีการศึกษา
          <input className="mt-2 w-full rounded-md border border-line px-3 py-2" type="number" value={academicYear} onChange={(event) => setAcademicYear(Number(event.target.value))} />
        </label>
        <label className="text-sm font-semibold">
          ภาคการศึกษา
          <select className="mt-2 w-full rounded-md border border-line px-3 py-2" value={semester} onChange={(event) => setSemester(Number(event.target.value))}>
            <option value={1}>1</option>
            <option value={2}>2</option>
            <option value={3}>ภาคฤดูร้อน</option>
          </select>
        </label>
        <label className="text-sm font-semibold">
          เป้าหมาย GPAX
          <input className="mt-2 w-full rounded-md border border-line px-3 py-2" max="4" min="0" step="0.01" type="number" value={target} onChange={(event) => setTarget(Number(event.target.value))} />
        </label>
      </div>

      <div className="mt-4 overflow-hidden rounded-md border border-line">
        <table className="w-full text-left text-sm">
          <thead className="bg-mist">
            <tr>
              <th className="px-3 py-2">เลือก</th>
              <th className="px-3 py-2">รายวิชา</th>
              <th className="px-3 py-2">หน่วยกิต</th>
              <th className="px-3 py-2">เกรดคาดหวัง</th>
            </tr>
          </thead>
          <tbody>
            {offerings.length === 0 ? (
              <tr>
                <td className="px-3 py-3 text-slate-600" colSpan={4}>ยังไม่มีรายวิชาที่เปิดสอนสำหรับเทอมนี้</td>
              </tr>
            ) : (
              offerings.map((offering) => (
                <tr className="border-t border-line" key={offering.id}>
                  <td className="px-3 py-2">
                    <input type="checkbox" checked={Boolean(selected[offering.courseCode])} onChange={(event) => setCourseGrade(offering.courseCode, event.target.checked ? "A" : "")} />
                  </td>
                  <td className="px-3 py-2">
                    <span className="font-semibold">{offering.courseCode}</span> {offering.courseName}
                  </td>
                  <td className="px-3 py-2">{offering.credits}</td>
                  <td className="px-3 py-2">
                    <select className="rounded-md border border-line px-2 py-1" disabled={!selected[offering.courseCode]} value={selected[offering.courseCode] ?? ""} onChange={(event) => setCourseGrade(offering.courseCode, event.target.value)}>
                      <option value="">-</option>
                      {gradeOptions.map((grade) => <option key={grade}>{grade}</option>)}
                    </select>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 rounded-md border border-line p-3">
        <p className="text-sm text-slate-500">GPAX จำลอง</p>
        <p className="mt-1 text-2xl font-bold">{result ? result.simulatedGpax.toFixed(2) : "..."}</p>
        <p className="text-sm text-slate-600">{result?.reachesTarget ? "ถึงเป้าหมาย" : "ยังไม่ถึงเป้าหมาย"}</p>
      </div>
    </section>
  );
}

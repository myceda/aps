"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/shared/Badge";
import type { AnalysisResult, WhatIfSimulationResult } from "@/lib/types";

type Props = {
  analysis: AnalysisResult;
  programCode: string;
};

export function GraduationWhatIfPanel({ analysis, programCode }: Props) {
  const [academicYear, setAcademicYear] = useState(getDefaultAcademicYear(analysis));
  const [semester, setSemester] = useState(getDefaultSemester(analysis));
  const [withdrawCourseCode, setWithdrawCourseCode] = useState("");
  const [addCourseCode, setAddCourseCode] = useState("");
  const [failCourseCode, setFailCourseCode] = useState("");
  const [result, setResult] = useState<WhatIfSimulationResult | null>(null);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const remainingCourses = useMemo(
    () => analysis.courseStatuses.filter((course) => course.status !== "passed" && course.status !== "non_credit"),
    [analysis.courseStatuses]
  );
  const completedCourses = useMemo(
    () => analysis.courseStatuses.filter((course) => course.status === "passed" || course.status === "non_credit"),
    [analysis.courseStatuses]
  );

  async function runSimulation() {
    if (!withdrawCourseCode && !addCourseCode && !failCourseCode) {
      setMessage("กรุณาเลือกอย่างน้อย 1 เงื่อนไขก่อนจำลองแผน");
      return;
    }

    setIsLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/graduation-simulation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          programCode,
          academicYear,
          semester,
          withdrawCourseCode,
          addCourseCode,
          failCourseCode
        })
      });
      const data = await response.json();

      if (!data.success) {
        setMessage(data.error ?? "จำลองแผนไม่สำเร็จ");
        setResult(null);
        return;
      }

      setResult(data.result);
    } catch {
      setMessage("ไม่สามารถเชื่อมต่อระบบจำลองแผนได้");
      setResult(null);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section className="surface p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-teal">จำลองสถานการณ์</p>
          <h2 className="text-lg font-bold">ลองถอนวิชา ลงวิชา หรือไม่ผ่านวิชา แล้วดูผลต่อเทอมจบ</h2>
          <p className="mt-1 text-sm text-slate-600">
            ระบบเทียบแผนเดิมกับแผนจำลอง เพื่อดูว่าจบช้าลงกี่เทอม วิชาใดถูกปลดล็อก และวิชาใดถูกบล็อก
          </p>
        </div>
        <Badge status={result?.simulatedForecast.canGraduate ? "normal" : result ? "watch" : "normal"}>
          {result ? "มีผลจำลองแล้ว" : "พร้อมจำลอง"}
        </Badge>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="grid gap-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm font-semibold">
              ปีการศึกษา
              <input
                className="mt-2 w-full rounded-md border border-line px-3 py-2"
                type="number"
                value={academicYear}
                onChange={(event) => setAcademicYear(Number(event.target.value))}
              />
            </label>
            <label className="text-sm font-semibold">
              เทอมที่ต้องการจำลอง
              <select className="mt-2 w-full rounded-md border border-line px-3 py-2" value={semester} onChange={(event) => setSemester(Number(event.target.value))}>
                <option value={1}>1</option>
                <option value={2}>2</option>
                <option value={3}>ภาคฤดูร้อน</option>
              </select>
            </label>
          </div>

          <label className="text-sm font-semibold">
            ถ้าถอนวิชา
            <select className="mt-2 w-full rounded-md border border-line px-3 py-2" value={withdrawCourseCode} onChange={(event) => setWithdrawCourseCode(event.target.value)}>
              <option value="">ไม่จำลองการถอน</option>
              {analysis.courseStatuses.map((course) => (
                <option key={course.courseCode} value={course.courseCode}>
                  {course.courseCode} {course.courseName}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm font-semibold">
            ถ้าลงและผ่านวิชา
            <select className="mt-2 w-full rounded-md border border-line px-3 py-2" value={addCourseCode} onChange={(event) => setAddCourseCode(event.target.value)}>
              <option value="">ไม่จำลองการลงวิชา</option>
              {remainingCourses.map((course) => (
                <option key={course.courseCode} value={course.courseCode}>
                  {course.courseCode} {course.courseName}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm font-semibold">
            ถ้าไม่ผ่านวิชา
            <select className="mt-2 w-full rounded-md border border-line px-3 py-2" value={failCourseCode} onChange={(event) => setFailCourseCode(event.target.value)}>
              <option value="">ไม่จำลองการไม่ผ่าน</option>
              {[...completedCourses, ...remainingCourses].map((course) => (
                <option key={course.courseCode} value={course.courseCode}>
                  {course.courseCode} {course.courseName}
                </option>
              ))}
            </select>
          </label>

          <button className="rounded-md bg-teal px-4 py-2 text-sm font-semibold text-white disabled:opacity-60" disabled={isLoading} onClick={runSimulation}>
            {isLoading ? "กำลังจำลอง..." : "จำลองแผน"}
          </button>
          {message ? <p className="rounded-md border border-line bg-mist p-3 text-sm text-slate-600">{message}</p> : null}
        </div>

        <div className="grid gap-3">
          {result ? (
            <>
              <div className="rounded-md border border-line p-3">
                <p className="text-sm text-slate-500">สรุปผล</p>
                <p className="mt-1 text-xl font-bold">{result.summary}</p>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <ForecastCompareCard title="แผนเดิม" forecast={result.baselineForecast} />
                <ForecastCompareCard title="แผนจำลอง" forecast={result.simulatedForecast} />
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <CourseList title="วิชาที่ถูกปลดล็อก" courses={result.unlockedCourses} emptyText="ยังไม่มีวิชาใหม่ที่ถูกปลดล็อกจากเงื่อนไขนี้" />
                <CourseList title="วิชาที่ถูกบล็อกเพิ่ม" courses={result.newlyBlockedCourses} emptyText="ยังไม่มีวิชาที่ถูกบล็อกเพิ่ม" />
              </div>

              <ul className="grid gap-1 text-xs text-slate-500">
                {result.notes.map((note) => (
                  <li key={note}>{note}</li>
                ))}
              </ul>
            </>
          ) : (
            <p className="rounded-md border border-line bg-mist p-3 text-sm text-slate-600">
              เลือกเงื่อนไขด้านซ้ายแล้วกดจำลองแผน ระบบจะแสดงผลเทียบกับแผนเดิมทันที
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

function ForecastCompareCard({ title, forecast }: { title: string; forecast: WhatIfSimulationResult["baselineForecast"] }) {
  const expectedTerm = forecast.canGraduate && forecast.expectedAcademicYear && forecast.expectedSemester
    ? `ปีการศึกษา ${forecast.expectedAcademicYear} เทอม ${forecast.expectedSemester}`
    : "ยังจัดแผนจนจบไม่ได้";

  return (
    <div className="rounded-md border border-line p-3">
      <p className="text-sm text-slate-500">{title}</p>
      <p className="mt-1 text-lg font-bold">{expectedTerm}</p>
      <p className="mt-1 text-sm text-slate-600">จัดลงแผนแล้ว {forecast.plannedCredits}/{forecast.remainingCredits} หน่วยกิต</p>
    </div>
  );
}

function CourseList({ title, courses, emptyText }: { title: string; courses: WhatIfSimulationResult["unlockedCourses"]; emptyText: string }) {
  return (
    <div className="rounded-md border border-line p-3">
      <p className="font-semibold">{title}</p>
      <div className="mt-2 grid gap-2">
        {courses.length === 0 ? (
          <p className="text-sm text-slate-500">{emptyText}</p>
        ) : (
          courses.map((course) => (
            <div className="rounded-md bg-mist p-2" key={course.courseCode}>
              <p className="text-sm font-semibold">{course.courseCode}</p>
              <p className="text-sm text-slate-700">{course.courseName}</p>
              <p className="text-xs text-slate-500">{course.reason}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function getDefaultAcademicYear(analysis: AnalysisResult) {
  return analysis.graduationForecast.terms.at(0)?.academicYear ?? 2568;
}

function getDefaultSemester(analysis: AnalysisResult) {
  return analysis.graduationForecast.terms.at(0)?.semester ?? 1;
}

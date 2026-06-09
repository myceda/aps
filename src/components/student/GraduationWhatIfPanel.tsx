"use client";

import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/shared/Badge";
import type { AnalysisResult, WhatIfSimulationResult } from "@/lib/types";

type Props = {
  analysis: AnalysisResult;
  ownerEmail?: string | null;
  programCode: string;
};

type OfferingOption = {
  id: number;
  courseCode: string;
  courseName: string;
  credits: number;
  semester: number;
  academicYear: number;
};

type ScenarioType = "withdraw" | "add" | "fail";

const scenarioOptions: Array<{
  value: ScenarioType;
  title: string;
  description: string;
  question: string;
  impactLabel: string;
}> = [
  {
    value: "withdraw",
    title: "ถอนรายวิชา",
    description: "ใช้เมื่อต้องตัดสินใจว่าจะถอนวิชานี้ดีไหม",
    question: "ถ้าถอนวิชานี้ จะทำให้จบช้าลงหรือ block วิชาอื่นเพิ่มไหม",
    impactLabel: "ดูผลกระทบจากการถอน"
  },
  {
    value: "add",
    title: "ลงเพิ่ม",
    description: "ใช้เมื่อต้องลองเร่งแผนด้วยวิชาที่เปิดสอน",
    question: "ถ้าลงวิชานี้เพิ่ม จะปลดล็อกวิชาต่อไปหรือทำให้จบเร็วขึ้นไหม",
    impactLabel: "ดูผลกระทบจากการลงเพิ่ม"
  },
  {
    value: "fail",
    title: "ไม่ผ่านวิชา",
    description: "ใช้ดูความเสี่ยงถ้าวิชานี้ไม่ผ่านหรือต้องรอผล",
    question: "ถ้าวิชานี้ไม่ผ่าน จะทำให้วิชาไหนเรียนต่อไม่ได้และเลื่อนจบกี่เทอม",
    impactLabel: "ดูผลกระทบจากการไม่ผ่าน"
  }
];

export function GraduationWhatIfPanel({ analysis, ownerEmail, programCode }: Props) {
  const [scenarioType, setScenarioType] = useState<ScenarioType>("withdraw");
  const [academicYear, setAcademicYear] = useState(getDefaultAcademicYear(analysis));
  const [semester, setSemester] = useState(getDefaultSemester(analysis));
  const [withdrawCourseCode, setWithdrawCourseCode] = useState("");
  const [addCourseCode, setAddCourseCode] = useState("");
  const [addCourseSearch, setAddCourseSearch] = useState("");
  const [failCourseCode, setFailCourseCode] = useState("");
  const [offeringOptions, setOfferingOptions] = useState<OfferingOption[]>([]);
  const [result, setResult] = useState<WhatIfSimulationResult | null>(null);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingOfferings, setIsLoadingOfferings] = useState(false);
  const activeScenario = scenarioOptions.find((option) => option.value === scenarioType) ?? scenarioOptions[0];

  const completedCourses = useMemo(
    () => analysis.courseStatuses.filter((course) => course.status === "passed" || course.status === "non_credit"),
    [analysis.courseStatuses]
  );

  const selectableCourses = useMemo(
    () => analysis.courseStatuses.filter((course) => course.status !== "not_taken"),
    [analysis.courseStatuses]
  );

  const searchResults = useMemo(() => {
    const keyword = addCourseSearch.trim().toLowerCase();
    const selectable = offeringOptions.filter((offering) => {
      const alreadyPassed = completedCourses.some((course) => course.courseCode === offering.courseCode);
      return !alreadyPassed;
    });

    if (!keyword) return selectable.slice(0, 8);

    return selectable
      .filter((offering) => {
        const label = `${offering.courseCode} ${offering.courseName}`.toLowerCase();
        return label.includes(keyword);
      })
      .slice(0, 8);
  }, [addCourseSearch, completedCourses, offeringOptions]);

  useEffect(() => {
    const controller = new AbortController();
    setIsLoadingOfferings(true);

    const ownerQuery = ownerEmail ? `&ownerEmail=${encodeURIComponent(ownerEmail)}` : "";
    fetch(`/api/course-offerings?program=${programCode}&academicYear=${academicYear}&semester=${semester}${ownerQuery}`, {
      signal: controller.signal
    })
      .then((response) => response.json())
      .then((data) => {
        const offerings = Array.isArray(data.offerings) ? data.offerings : [];
        setOfferingOptions(dedupeOfferings(offerings));
      })
      .catch(() => setOfferingOptions([]))
      .finally(() => setIsLoadingOfferings(false));

    return () => controller.abort();
  }, [academicYear, ownerEmail, programCode, semester]);

  async function runSimulation() {
    const normalizedAddCourseCode = addCourseCode || extractCourseCode(addCourseSearch);
    const selectedCourseCode =
      scenarioType === "withdraw"
        ? withdrawCourseCode
        : scenarioType === "add"
          ? normalizedAddCourseCode
          : failCourseCode;

    if (!selectedCourseCode) {
      setMessage("กรุณาเลือกเงื่อนไขของสถานการณ์นี้ก่อนจำลองแผน");
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
          ownerEmail,
          academicYear,
          semester,
          withdrawCourseCode: scenarioType === "withdraw" ? withdrawCourseCode : "",
          addCourseCode: scenarioType === "add" ? normalizedAddCourseCode : "",
          failCourseCode: scenarioType === "fail" ? failCourseCode : ""
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
    <section className="surface overflow-hidden">
      <div className="border-b border-line bg-white px-5 py-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-extrabold text-[#007a64]">What-if Simulation</p>
            <h2 className="mt-1 text-2xl font-extrabold text-ink">ลองเปลี่ยนแผนก่อนตัดสินใจจริง</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              ระบบจะเปรียบเทียบแผนเดิมกับแผนจำลอง ตรวจ prerequisite วิชาที่เปิดสอน และ credit limit
              แล้วสรุปผลกระทบต่อวันจบให้เห็นทันที
            </p>
          </div>
          <Badge status={result?.simulatedForecast.canGraduate ? "normal" : result ? "watch" : "normal"}>
            {result ? "มีผลจำลองแล้ว" : "พร้อมจำลอง"}
          </Badge>
        </div>
      </div>

      <div className="grid gap-5 bg-[#f6f8fa] p-5 xl:grid-cols-[420px_1fr]">
        <div className="rounded-lg border border-line bg-white p-4 shadow-sm">
          <p className="text-sm font-extrabold text-slate-500">เลือกเรื่องที่อยากตัดสินใจ</p>
          <div className="mt-3 grid gap-2">
            {scenarioOptions.map((option) => {
              const selected = scenarioType === option.value;
              return (
                <button
                  className={`rounded-lg border px-4 py-3 text-left transition ${
                    selected ? "border-[#007a64] bg-emerald-50 text-[#007a64]" : "border-line bg-white hover:bg-slate-50"
                  }`}
                  key={option.value}
                  onClick={() => {
                    setScenarioType(option.value);
                    setMessage("");
                  }}
                  type="button"
                >
                  <span className="block text-sm font-extrabold">{option.title}</span>
                  <span className="mt-1 block text-xs leading-5 text-slate-500">{option.description}</span>
                  <span className="mt-2 block rounded-md bg-white/70 px-2 py-1 text-xs font-bold leading-5 text-slate-600">
                    {option.question}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-4 rounded-lg border border-emerald-100 bg-emerald-50 p-3 text-sm leading-6 text-[#006854]">
            <span className="font-extrabold">ระบบจะตอบ:</span> เทอมจบเดิมเทียบกับเทอมจบใหม่ ช้ากี่เทอม วิชาที่ถูก block
            และคำแนะนำว่าควรวางแผนต่ออย่างไร
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <label className="text-sm font-bold text-slate-700">
              ปีการศึกษา
              <input
                className="mt-2 w-full rounded-lg border border-line bg-white px-3 py-2"
                type="number"
                value={academicYear}
                onChange={(event) => setAcademicYear(Number(event.target.value))}
              />
            </label>
            <label className="text-sm font-bold text-slate-700">
              เทอม
              <select
                className="mt-2 w-full rounded-lg border border-line bg-white px-3 py-2"
                value={semester}
                onChange={(event) => setSemester(Number(event.target.value))}
              >
                <option value={1}>เทอม 1</option>
                <option value={2}>เทอม 2</option>
                <option value={3}>เทอม 3 / ฤดูร้อน</option>
              </select>
            </label>
          </div>

          <div className="mt-5">
            {scenarioType === "withdraw" ? (
              <CourseSelect
                label="2. เลือกวิชาที่ต้องการถอน"
                placeholder="เลือกวิชาที่จะถอนออกจากแผน"
                courses={selectableCourses}
                value={withdrawCourseCode}
                onChange={setWithdrawCourseCode}
              />
            ) : null}

            {scenarioType === "fail" ? (
              <CourseSelect
                label="2. เลือกวิชาที่ต้องการจำลองว่าไม่ผ่าน"
                placeholder="เลือกวิชาที่จะลองให้เป็น F/I"
                courses={[...completedCourses, ...analysis.courseStatuses]}
                value={failCourseCode}
                onChange={setFailCourseCode}
              />
            ) : null}

            {scenarioType === "add" ? (
              <div className="text-sm font-bold text-slate-700">
                <label htmlFor="add-course-search">2. ค้นหาวิชาที่เปิดสอนเพื่อทดลองลงเพิ่ม</label>
                <input
                  className="mt-2 w-full rounded-lg border border-line bg-white px-3 py-2"
                  id="add-course-search"
                  placeholder={isLoadingOfferings ? "กำลังโหลดรายวิชาที่เปิดสอน..." : "พิมพ์รหัสวิชาหรือชื่อวิชา"}
                  type="search"
                  value={addCourseSearch}
                  onChange={(event) => {
                    setAddCourseSearch(event.target.value);
                    setAddCourseCode("");
                  }}
                />
                <div className="mt-2 max-h-64 overflow-y-auto rounded-lg border border-line bg-white p-2">
                  {searchResults.length === 0 ? (
                    <p className="px-3 py-4 text-sm font-normal leading-6 text-slate-500">
                      ยังไม่พบรายวิชาที่เปิดสอนในปี/เทอมนี้ หรือพิมพ์รหัสวิชาเองในช่องค้นหาได้
                    </p>
                  ) : (
                    searchResults.map((offering) => {
                      const selected = addCourseCode === offering.courseCode;
                      return (
                        <button
                          className={`mb-2 w-full rounded-lg border px-3 py-2 text-left transition last:mb-0 ${
                            selected ? "border-[#007a64] bg-emerald-50 text-[#007a64]" : "border-line bg-white hover:bg-slate-50"
                          }`}
                          key={`${offering.id}-${offering.courseCode}`}
                          onClick={() => {
                            setAddCourseCode(offering.courseCode);
                            setAddCourseSearch(`${offering.courseCode} ${offering.courseName}`);
                          }}
                          type="button"
                        >
                          <span className="block font-extrabold">{offering.courseCode}</span>
                          <span className="mt-1 block text-xs font-normal leading-5 text-slate-600">
                            {offering.courseName} - {offering.credits} หน่วยกิต
                          </span>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            ) : null}
          </div>

          <button
            className="mt-5 w-full rounded-lg bg-[#f59e0b] px-4 py-3 text-sm font-extrabold text-white shadow-sm transition hover:bg-[#d98706] disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isLoading}
            onClick={runSimulation}
            type="button"
          >
            {isLoading ? "กำลังจำลองแผน..." : activeScenario.impactLabel}
          </button>
          {message ? <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-800">{message}</p> : null}
        </div>

        <SimulationResultPanel result={result} />
      </div>
    </section>
  );
}

function CourseSelect({
  label,
  placeholder,
  courses,
  value,
  onChange
}: {
  label: string;
  placeholder: string;
  courses: AnalysisResult["courseStatuses"];
  value: string;
  onChange: (courseCode: string) => void;
}) {
  return (
    <label className="text-sm font-bold text-slate-700">
      {label}
      <select className="mt-2 w-full rounded-lg border border-line bg-white px-3 py-2" value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="">{placeholder}</option>
        {courses.map((course, index) => (
          <option key={`${course.courseCode}-${index}`} value={course.courseCode}>
            {course.courseCode} {course.courseName}
          </option>
        ))}
      </select>
    </label>
  );
}

function SimulationResultPanel({ result }: { result: WhatIfSimulationResult | null }) {
  if (!result) {
    return (
      <div className="rounded-lg border border-dashed border-line bg-white p-5 shadow-sm">
        <p className="text-sm font-extrabold text-slate-500">ผลลัพธ์หลังจำลอง</p>
        <h3 className="mt-2 text-2xl font-extrabold text-ink">เลือกสถานการณ์แล้วกดคำนวณ</h3>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
          หน้านี้จะไม่บันทึกข้อมูลลงฐานข้อมูล เป็นพื้นที่ทดลองเพื่อดูว่าแผนที่กำลังคิดอยู่กระทบวันจบและรายวิชาต่อเนื่องอย่างไร
        </p>
        <div className="mt-6 grid gap-3 md:grid-cols-2">
          {[
            ["เทอมจบเดิม vs เทอมจบใหม่", "เห็นทันทีว่าแผนนี้ทำให้จบช้า เร็ว หรือเท่าเดิม"],
            ["วิชาที่ block / เรียนต่อได้", "ดู prerequisite และวิชาที่เปิดสอนก่อนตัดสินใจจริง"],
            ["คำแนะนำภาษาคน", "ระบบสรุปว่าควรระวังอะไรและควรวางแผนต่ออย่างไร"],
            ["ไม่กระทบข้อมูลจริง", "ผลจำลองเป็น temporary state ใช้ประกอบการตัดสินใจเท่านั้น"]
          ].map(([title, description]) => (
            <div className="rounded-lg border border-line bg-slate-50 p-4" key={title}>
              <p className="text-sm font-extrabold text-[#007a64]">{title}</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const delayText = formatDelayTerms(result.graduationDelayTerms);

  return (
    <div className="grid gap-4">
      <DecisionSummary result={result} />

      <div className="rounded-lg border border-line bg-white p-5 shadow-sm">
        <p className="text-sm font-extrabold text-[#007a64]">รายละเอียดผลกระทบ</p>
        <h3 className="mt-2 text-2xl font-extrabold text-ink">{result.summary}</h3>
        <div className="mt-5 grid gap-3 md:grid-cols-4">
          <MetricCard label="ช้ากี่เทอม" value={delayText} tone={result.graduationDelayTerms && result.graduationDelayTerms > 0 ? "warn" : "ok"} />
          <MetricCard label="ยังเรียนต่อได้" value={`${result.unlockedCourses.length} วิชา`} tone="ok" />
          <MetricCard label="ถูก block เพิ่ม" value={`${result.newlyBlockedCourses.length} วิชา`} tone={result.newlyBlockedCourses.length > 0 ? "warn" : "ok"} />
          <MetricCard label="สถานะแผนจำลอง" value={result.simulatedForecast.canGraduate ? "จัดแผนจบได้" : "ยังจัดไม่จบ"} tone={result.simulatedForecast.canGraduate ? "ok" : "warn"} />
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <ForecastCompareCard title="แผนเดิม" forecast={result.baselineForecast} />
        <ForecastCompareCard title="แผนหลังจำลอง" forecast={result.simulatedForecast} />
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <CourseList title="วิชาที่สามารถเรียนต่อได้" courses={result.unlockedCourses} emptyText="ยังไม่มีวิชาใหม่ที่ปลดล็อกจากเงื่อนไขนี้" />
        <CourseList title="วิชาที่ได้รับผลกระทบ" courses={result.newlyBlockedCourses} emptyText="ยังไม่มีวิชาที่ถูก block เพิ่ม" />
      </div>

      {result.notes.length > 0 ? (
        <div className="rounded-lg border border-line bg-white p-4 shadow-sm">
          <p className="font-extrabold text-ink">ข้อเสนอแนะจากระบบ</p>
          <ul className="mt-3 grid gap-2 text-sm leading-6 text-slate-600">
            {result.notes.map((note) => (
              <li className="rounded-lg bg-slate-50 px-3 py-2" key={note}>
                {note}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function DecisionSummary({ result }: { result: WhatIfSimulationResult }) {
  const delayTone = result.graduationDelayTerms && result.graduationDelayTerms > 0 ? "warn" : "ok";

  return (
    <div className="rounded-lg border border-[#007a64]/25 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-extrabold text-[#007a64]">คำตอบสำหรับการตัดสินใจ</p>
          <h3 className="mt-2 text-2xl font-extrabold text-ink">{buildDecisionAdvice(result)}</h3>
        </div>
        <Badge status={delayTone === "warn" ? "watch" : "normal"}>{formatDelayTerms(result.graduationDelayTerms)}</Badge>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <div className="rounded-lg border border-line bg-slate-50 p-4">
          <p className="text-xs font-extrabold text-slate-500">เทอมจบเดิม</p>
          <p className="mt-2 text-lg font-extrabold text-ink">{formatForecastOutcome(result.baselineForecast)}</p>
        </div>
        <div className="rounded-lg border border-line bg-slate-50 p-4">
          <p className="text-xs font-extrabold text-slate-500">เทอมจบใหม่</p>
          <p className="mt-2 text-lg font-extrabold text-ink">{formatForecastOutcome(result.simulatedForecast)}</p>
        </div>
        <div className={`rounded-lg border p-4 ${delayTone === "warn" ? "border-amber-200 bg-amber-50" : "border-emerald-200 bg-emerald-50"}`}>
          <p className="text-xs font-extrabold text-slate-500">ผลกระทบหลัก</p>
          <p className={`mt-2 text-lg font-extrabold ${delayTone === "warn" ? "text-[#b45309]" : "text-[#007a64]"}`}>
            {formatDelayTerms(result.graduationDelayTerms)}
          </p>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, tone }: { label: string; value: string; tone: "ok" | "warn" }) {
  return (
    <div className={`rounded-lg border p-4 ${tone === "ok" ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50"}`}>
      <p className="text-xs font-extrabold text-slate-500">{label}</p>
      <p className={`mt-2 text-2xl font-extrabold ${tone === "ok" ? "text-[#007a64]" : "text-[#b45309]"}`}>{value}</p>
    </div>
  );
}

function ForecastCompareCard({ title, forecast }: { title: string; forecast: WhatIfSimulationResult["baselineForecast"] }) {
  const expectedTerm = formatForecastOutcome(forecast);

  return (
    <div className="rounded-lg border border-line bg-white p-4 shadow-sm">
      <p className="text-sm font-extrabold text-slate-500">{title}</p>
      <p className="mt-1 text-lg font-extrabold text-ink">{expectedTerm}</p>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        จัดลงแผนแล้ว {forecast.plannedCredits}/{forecast.remainingCredits} หน่วยกิต
      </p>
    </div>
  );
}

function formatForecastOutcome(forecast: WhatIfSimulationResult["baselineForecast"]) {
  if (!forecast.canGraduate || !forecast.expectedAcademicYear || !forecast.expectedSemester) {
    return "ยังจัดแผนจนจบไม่ได้";
  }

  const semesterLabel = forecast.expectedSemester === 3 ? "เทอม 3/ฤดูร้อน" : `เทอม ${forecast.expectedSemester}`;
  return `จบได้${semesterLabel}/${forecast.expectedAcademicYear}`;
}

function formatDelayTerms(delayTerms: number | null) {
  if (delayTerms === null) return "ยังเทียบไม่ได้";
  if (delayTerms === 0) return "ไม่ช้าลง";
  if (delayTerms > 0) return `ช้าลง ${delayTerms} เทอม`;
  return `เร็วขึ้น ${Math.abs(delayTerms)} เทอม`;
}

function buildDecisionAdvice(result: WhatIfSimulationResult) {
  if (!result.simulatedForecast.canGraduate) {
    return "แผนนี้ยังไม่ควรใช้จริง เพราะระบบยังจัดรายวิชาจนจบไม่ได้";
  }

  if (result.graduationDelayTerms && result.graduationDelayTerms > 0) {
    return "แผนนี้ทำให้จบช้าลง ควรมีแผนสำรองก่อนตัดสินใจ";
  }

  if (result.newlyBlockedCourses.length > 0) {
    return "แผนนี้ยังจบได้ แต่ต้องระวังวิชาที่ถูก block เพิ่ม";
  }

  if (result.unlockedCourses.length > 0) {
    return "แผนนี้ช่วยให้มีวิชาที่เรียนต่อได้เพิ่มขึ้น";
  }

  return "แผนนี้ไม่ทำให้เทอมจบเปลี่ยน ใช้ประกอบการตัดสินใจได้";
}

function CourseList({
  title,
  courses,
  emptyText
}: {
  title: string;
  courses: WhatIfSimulationResult["unlockedCourses"];
  emptyText: string;
}) {
  return (
    <div className="rounded-lg border border-line bg-white p-4 shadow-sm">
      <p className="font-extrabold text-ink">{title}</p>
      <div className="mt-3 grid gap-2">
        {courses.length === 0 ? (
          <p className="text-sm leading-6 text-slate-500">{emptyText}</p>
        ) : (
          courses.map((course) => (
            <div className="rounded-lg bg-slate-50 p-3" key={course.courseCode}>
              <p className="text-sm font-extrabold text-[#007a64]">{course.courseCode}</p>
              <p className="text-sm font-semibold text-slate-800">{course.courseName}</p>
              <p className="mt-1 text-xs leading-5 text-slate-500">{course.reason}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function dedupeOfferings(offerings: OfferingOption[]) {
  const seen = new Set<string>();
  return offerings.filter((offering) => {
    if (seen.has(offering.courseCode)) return false;
    seen.add(offering.courseCode);
    return true;
  });
}

function extractCourseCode(value: string) {
  return value.trim().split(/\s+/)[0] ?? "";
}

function getDefaultAcademicYear(analysis: AnalysisResult) {
  return analysis.graduationForecast.terms.at(0)?.academicYear ?? 2568;
}

function getDefaultSemester(analysis: AnalysisResult) {
  return analysis.graduationForecast.terms.at(0)?.semester ?? 1;
}

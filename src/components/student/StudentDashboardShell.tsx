"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Badge } from "@/components/shared/Badge";
import { AcademicAppShell } from "@/components/shared/AcademicAppShell";
import { DashboardSummary } from "@/components/student/DashboardSummary";
import { EightYearStudyPlanDiagram } from "@/components/student/EightYearStudyPlanDiagram";
import { GraduationForecastPanel } from "@/components/student/GraduationForecastPanel";
import { GraduationWhatIfPanel } from "@/components/student/GraduationWhatIfPanel";
import type { AnalysisResult } from "@/lib/types";

type ActiveView = "summary" | "forecast" | "roadmap" | "simulator";

type Props = {
  analysis: AnalysisResult;
  programCode: string;
  userName?: string | null;
  userEmail?: string | null;
  studentCode?: string | null;
};

const studentViews: Array<{
  key: ActiveView;
  label: string;
  title: string;
  detail: string;
}> = [
  {
    key: "summary",
    label: "ภาพรวม",
    title: "ภาพรวมผลการเรียน",
    detail: "ดูสถานะหลัก GPAX หน่วยกิตที่ผ่านแล้ว หมวดวิชาที่ยังขาด วิชาที่ถูก block และคำแนะนำที่ควรทำต่อ"
  },
  {
    key: "forecast",
    label: "คาดการณ์วันจบ",
    title: "คาดการณ์วันจบ",
    detail: "ดูว่าแผนปัจจุบันพาไปถึงวันจบได้เมื่อไร และยังเหลือรายวิชาใดที่ต้องจัดลงเทอมอนาคต"
  },
  {
    key: "roadmap",
    label: "แผน 8 ปี",
    title: "แผนการเรียนรายเทอม 8 ปี",
    detail: "ดูรายวิชาเป็นปีและเทอม เพื่อเห็นลำดับการเรียน วิชาที่ผ่านแล้ว และวิชาที่อาจขวางการจบ"
  },
  {
    key: "simulator",
    label: "จำลองสถานการณ์",
    title: "จำลองผลกระทบก่อนตัดสินใจ",
    detail: "ลองถอนวิชา ลงวิชาเพิ่ม หรือจำลองว่าไม่ผ่าน prerequisite แล้วดูว่าแผนจบเปลี่ยนอย่างไร"
  }
];

export function StudentDashboardShell({ analysis, programCode, userName, userEmail, studentCode }: Props) {
  const [activeView, setActiveView] = useState<ActiveView>("summary");
  const activeMeta = studentViews.find((view) => view.key === activeView) ?? studentViews[0];
  const transcriptToolsHref = userEmail
    ? `/student/transcript-tools?ownerEmail=${encodeURIComponent(userEmail)}&ownerName=${encodeURIComponent(userName ?? "")}`
    : "/student/transcript-tools";

  const forecastLabel = formatForecastLabel(
    analysis.graduationForecast.canGraduate,
    analysis.graduationForecast.expectedAcademicYear,
    analysis.graduationForecast.expectedSemester
  );
  const forecastHeadline = analysis.graduationForecast.conditionLabel ?? forecastLabel;

  const sidebar = useMemo(
    () => (
      <>
        <div className="border-b border-slate-100 p-5">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">แฟ้มที่กำลังวิเคราะห์</p>
          <h2 className="mt-2 text-xl font-extrabold text-slate-900">{userName || "นักศึกษา"}</h2>
          <p className="mt-1 break-all text-sm text-slate-500">{userEmail || "Silpakorn Account"}</p>
          <div className="mt-4 rounded-md border border-[#b7ddd8] bg-[#effaf8] p-3">
            <p className="text-xs font-bold text-[#007a64]">หลักสูตร / รหัสนักศึกษา</p>
            <p className="mt-1 text-sm font-bold text-slate-800">
              {programCode} {studentCode ? `- ${studentCode}` : ""}
            </p>
          </div>
        </div>

        <div className="p-3">
          {studentViews.map((view) => {
            const isActive = activeView === view.key;
            return (
              <button
                className={`mb-2 flex w-full items-center gap-3 rounded-md px-4 py-3 text-left text-sm font-bold transition ${
                  isActive
                    ? "bg-gradient-to-r from-[#007a64] to-[#29a99a] text-white shadow-md"
                    : "text-slate-600 hover:bg-slate-50 hover:text-[#007a64]"
                }`}
                key={view.key}
                onClick={() => setActiveView(view.key)}
                type="button"
              >
                <span className={`h-2.5 w-2.5 rounded-full ${isActive ? "bg-white" : "border border-slate-400"}`} />
                {view.label}
              </button>
            );
          })}
        </div>

        <div className="border-t border-slate-100 p-4">
          <Link
            className="block rounded-md bg-[#007a64] px-4 py-3 text-center text-sm font-extrabold text-white hover:bg-[#006855]"
            href={transcriptToolsHref}
          >
            จัดการข้อมูลผลการเรียน
          </Link>
          <p className="mt-3 text-xs leading-5 text-slate-500">
            เริ่มจากตรวจ transcript ก่อน ระบบจึงคำนวณหน่วยกิต วันจบ และผลกระทบจาก prerequisite ได้แม่นขึ้น
          </p>
        </div>
      </>
    ),
    [activeView, programCode, studentCode, transcriptToolsHref, userEmail, userName]
  );

  return (
    <AcademicAppShell
      navItems={[
        { href: "/student", label: "หน้าแรกนักศึกษา", isActive: true },
        { href: transcriptToolsHref, label: "จัดการผลการเรียน" }
      ]}
      roleLabel="นักศึกษา"
      sidebar={sidebar}
      userEmail={userEmail}
      userName={userName}
    >
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2 text-sm font-bold">
            <Link className="text-[#007a64]" href="/student">หน้าแรกนักศึกษา</Link>
            <span className="text-slate-300">/</span>
            <span className="text-slate-400">{activeMeta.label}</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-700">Dashboard นักศึกษา</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            className="rounded-md bg-[#f59e0b] px-5 py-3 text-center text-sm font-extrabold text-white shadow-sm hover:bg-[#d98706]"
            href={transcriptToolsHref}
          >
            จัดการผลการเรียน
          </Link>
          <button
            className="rounded-md border border-[#007a64] bg-white px-5 py-3 text-sm font-extrabold text-[#007a64] shadow-sm hover:bg-[#effaf8]"
            onClick={() => setActiveView("simulator")}
            type="button"
          >
            จำลองสถานการณ์
          </button>
        </div>
      </div>

      <section className="overflow-hidden rounded-md bg-white shadow-sm ring-1 ring-slate-200">
        <div className="grid gap-4 border-b border-slate-200 p-5 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <Badge status={analysis.proStatus.tone}>{analysis.proStatus.label}</Badge>
              <span className="text-sm font-semibold text-slate-500">ข้อมูลสรุปล่าสุดจาก transcript ที่ยืนยันแล้ว</span>
            </div>
            <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-600">
              หน้านี้สรุปสถานะทางวิชาการ GPAX/GPA ล่าสุด หน่วยกิตที่ผ่านและยังขาด คาดการณ์เทอมจบ
              พร้อมปุ่มไปจัดการผลการเรียนหรือจำลองสถานการณ์ทันที
            </p>
          </div>
          <div className="rounded-md border border-[#b7ddd8] bg-[#effaf8] px-4 py-3 text-sm font-bold text-[#007a64]">
            ผลคาดการณ์: {forecastHeadline}
          </div>
        </div>

        <div className="grid divide-y divide-slate-200 bg-white sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-4">
          <OverviewMetric
            label="สถานะทางวิชาการ"
            value={analysis.academicEligibility.label}
            detail={analysis.academicEligibility.detail}
          />
          <OverviewMetric label="GPAX" value={analysis.gpax.toFixed(2)} detail={`GPA ล่าสุด ${analysis.latestGpa.toFixed(2)}`} />
          <OverviewMetric label="หน่วยกิตผ่านแล้ว" value={`${analysis.earnedCredits}/${analysis.totalCreditsMin}`} detail={`ยังขาด ${analysis.missingCredits} หน่วยกิต`} />
          <OverviewMetric label="คาดการณ์วันจบ" value={forecastHeadline} detail="อิงหลักสูตร prerequisite และวิชาที่เปิดสอน" />
        </div>
      </section>

      {activeView !== "summary" ? <SectionHeading title={activeMeta.title} detail={activeMeta.detail} /> : null}

      {activeView === "summary" ? (
        <DashboardSummary
          analysis={analysis}
          onOpenRoadmap={() => setActiveView("roadmap")}
          onOpenSimulator={() => setActiveView("simulator")}
          transcriptToolsHref={transcriptToolsHref}
        />
      ) : null}
      {activeView === "forecast" ? <GraduationForecastPanel analysis={analysis} /> : null}
      {activeView === "roadmap" ? <EightYearStudyPlanDiagram analysis={analysis} /> : null}
      {activeView === "simulator" ? <GraduationWhatIfPanel analysis={analysis} ownerEmail={userEmail} programCode={programCode} /> : null}
    </AcademicAppShell>
  );
}

function SectionHeading({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="rounded-md border-l-4 border-[#007a64] bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <p className="text-sm font-semibold text-[#007a64]">กำลังดู</p>
      <h2 className="mt-1 text-2xl font-bold text-slate-800">{title}</h2>
      <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-600">{detail}</p>
    </div>
  );
}

function OverviewMetric({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="min-h-32 p-5">
      <p className="text-sm font-semibold text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-extrabold text-slate-900">{value}</p>
      <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-600">{detail}</p>
    </div>
  );
}

function formatForecastLabel(canGraduate: boolean, academicYear?: number, semester?: number) {
  if (!canGraduate || !academicYear || !semester) return "ยังไม่พร้อมคำนวณ";
  return `${academicYear} / ${semester === 3 ? "ฤดูร้อน" : `เทอม ${semester}`}`;
}

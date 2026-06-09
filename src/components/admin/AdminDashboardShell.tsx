"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { AdminCrudPanel, type ResourceKey } from "@/components/admin/AdminCrudPanel";
import type { AdminStepKey } from "@/components/admin/AdminMenu";
import { AcademicAppShell } from "@/components/shared/AcademicAppShell";

type AdminDashboardShellProps = {
  importPanel: ReactNode;
  readinessPanel: ReactNode;
};

const workflowSteps: Array<{
  key: AdminStepKey;
  step: string;
  title: string;
  shortTitle: string;
  detail: string;
  resource?: ResourceKey;
}> = [
  {
    key: "overview",
    step: "1",
    title: "ตรวจความพร้อมข้อมูล",
    shortTitle: "ตรวจความพร้อม",
    detail: "เริ่มจากดูว่าข้อมูลพื้นฐานครบหรือยัง ถ้าพบจุดที่ขาดให้ไปนำเข้า CSV หรือแก้ข้อมูลตามลำดับ"
  },
  {
    key: "import",
    step: "2",
    title: "นำเข้าข้อมูลด้วย CSV",
    shortTitle: "Import CSV",
    detail: "นำเข้าข้อมูลจำนวนมากจาก template ก่อนค่อยแก้รายละเอียดรายหมวด เพื่อลดการกรอกซ้ำและลดข้อมูลตกหล่น"
  },
  {
    key: "programs",
    resource: "programs",
    step: "3",
    title: "จัดการหลักสูตร",
    shortTitle: "หลักสูตร",
    detail: "กำหนดรหัสหลักสูตร ปีหลักสูตร หน่วยกิตรวม และเกณฑ์ GPAX ที่ใช้วิเคราะห์"
  },
  {
    key: "structures",
    resource: "structures",
    step: "4",
    title: "จัดการโครงสร้างหลักสูตร",
    shortTitle: "โครงสร้าง",
    detail: "กำหนดหมวดวิชาและหน่วยกิตขั้นต่ำของแต่ละหมวดในหลักสูตร"
  },
  {
    key: "courses",
    resource: "courses",
    step: "5",
    title: "จัดการรายวิชา",
    shortTitle: "รายวิชา",
    detail: "เพิ่มหรือแก้ไขรหัสวิชา ชื่อวิชา หน่วยกิต หมวดวิชา และหลักสูตรที่เกี่ยวข้อง"
  },
  {
    key: "prerequisites",
    resource: "prerequisites",
    step: "6",
    title: "จัดการวิชาบังคับก่อน",
    shortTitle: "Prerequisite",
    detail: "กำหนดความสัมพันธ์ของรายวิชา เพื่อให้ระบบรู้ว่าวิชาใดปลดล็อกหรือขวางการเรียนต่อ"
  },
  {
    key: "study-plans",
    resource: "study-plans",
    step: "7",
    title: "จัดการแผนรายเทอม",
    shortTitle: "Study Plan",
    detail: "วางรายวิชาเป็นปีและเทอม แยกแผน RESEARCH และ COOP เพื่อใช้คาดการณ์วันจบ"
  },
  {
    key: "offerings",
    resource: "offerings",
    step: "8",
    title: "จัดการวิชาที่เปิดสอน",
    shortTitle: "วิชาเปิดสอน",
    detail: "ระบุว่าวิชาใดเปิดในเทอม 1 เทอม 2 หรือภาคฤดูร้อนของแต่ละปีการศึกษา"
  }
];

const transcriptCases = [
  { name: "แฟ้มของบัญชีนี้", email: "current account", program: "CS2565", status: "ใช้งานอยู่" },
  { name: "ตัวอย่าง CS", email: "friend_cs@silpakorn.edu", program: "CS2565", status: "แยกแฟ้มได้" },
  { name: "ตัวอย่าง IT", email: "friend_it@silpakorn.edu", program: "IT2565", status: "ไม่ปนกับ CS" }
];

export function AdminDashboardShell({ importPanel, readinessPanel }: AdminDashboardShellProps) {
  const [activeStep, setActiveStep] = useState<AdminStepKey>("overview");
  const activeWorkflowStep = useMemo(
    () => workflowSteps.find((item) => item.key === activeStep) ?? workflowSteps[0],
    [activeStep]
  );

  const sidebar = (
    <>
      <div className="border-b border-slate-100 p-5">
        <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Admin Setup</p>
        <h1 className="mt-2 text-2xl font-extrabold text-slate-800">ตั้งค่าข้อมูลก่อนเปิดให้นักศึกษาใช้</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          ทำตามลำดับนี้เพื่อลดข้อมูลตกหล่น และทำให้ forecast ของนักศึกษาอธิบายได้
        </p>
      </div>

      <div className="p-3">
        {workflowSteps.map((step) => {
          const isActive = activeStep === step.key;
          return (
            <button
              className={`mb-2 flex w-full items-center gap-3 rounded-md px-4 py-3 text-left text-sm font-bold transition ${
                isActive
                  ? "bg-gradient-to-r from-[#007a64] to-[#29a99a] text-white shadow-md"
                  : "text-slate-600 hover:bg-slate-50 hover:text-[#007a64]"
              }`}
              key={step.key}
              onClick={() => setActiveStep(step.key)}
              type="button"
            >
              <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-black ${isActive ? "bg-white text-[#007a64]" : "bg-slate-100 text-slate-500"}`}>
                {step.step}
              </span>
              {step.shortTitle}
            </button>
          );
        })}
      </div>
    </>
  );

  return (
    <AcademicAppShell
      navItems={[
        { label: "ตั้งค่าข้อมูลระบบ", isActive: true },
        { href: "/student", label: "มุมมองนักศึกษา" },
        { href: "/student/transcript-tools", label: "จัดการ transcript" }
      ]}
      roleLabel="ผู้ดูแลระบบ"
      sidebar={sidebar}
      userName="Admin"
      userEmail="APS Admin"
    >
      <div>
        <div className="mb-2 flex flex-wrap items-center gap-2 text-sm font-bold">
          <Link className="text-[#007a64]" href="/admin">ผู้ดูแลระบบ</Link>
          <span className="text-slate-300">/</span>
          <span className="text-slate-400">{activeWorkflowStep.shortTitle}</span>
        </div>
        <h1 className="text-3xl font-extrabold text-slate-700">{activeWorkflowStep.title}</h1>
        <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-600">{activeWorkflowStep.detail}</p>
      </div>

      {activeStep === "overview" ? (
        <div className="grid gap-5">
          <TranscriptCasePanel />
          {readinessPanel}
          <NextWorkflowAction
            detail="ถ้าผลตรวจยังไม่พร้อม ให้เริ่มจากนำเข้า CSV template ก่อน แล้วค่อยแก้รายละเอียดรายหมวด"
            label="ไป Step 2: Import CSV"
            onClick={() => setActiveStep("import")}
          />
        </div>
      ) : null}

      {activeStep === "import" ? (
        <div className="grid gap-5">
          {importPanel}
          <NextWorkflowAction
            detail="เมื่อนำเข้าข้อมูลตั้งต้นแล้ว ให้ตรวจหรือแก้หลักสูตรก่อน เพราะเป็นฐานของรายวิชาและแผนเรียนทั้งหมด"
            label="ไป Step 3: จัดการหลักสูตร"
            onClick={() => setActiveStep("programs")}
          />
        </div>
      ) : null}

      {activeWorkflowStep.resource ? (
        <AdminCrudPanel activeResource={activeWorkflowStep.resource} showResourceTabs={false} />
      ) : null}
    </AcademicAppShell>
  );
}

function NextWorkflowAction({ detail, label, onClick }: { detail: string; label: string; onClick: () => void }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-[#b7ddd8] bg-[#effaf8] p-4">
      <p className="text-sm font-semibold leading-6 text-slate-700">{detail}</p>
      <button
        className="rounded-md bg-[#007a64] px-4 py-3 text-sm font-extrabold text-white shadow-sm hover:bg-[#006653]"
        onClick={onClick}
        type="button"
      >
        {label}
      </button>
    </div>
  );
}

function TranscriptCasePanel() {
  return (
    <section className="overflow-hidden rounded-md bg-white shadow-sm ring-1 ring-slate-200">
      <div className="grid gap-4 border-b border-slate-200 p-5 lg:grid-cols-[1fr_auto] lg:items-center">
        <div>
          <p className="text-sm font-bold text-[#007a64]">แฟ้ม transcript หลายคน</p>
          <h2 className="mt-1 text-xl font-extrabold text-slate-800">หนึ่งบัญชีจัดการหลายแฟ้มได้ แต่ต้องแยกเจ้าของข้อมูลชัดเจน</h2>
          <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-600">
            ถ้าเพื่อนฝาก transcript ให้บัญชีเดียวอัปโหลด ควรเปิดแฟ้มด้วยอีเมลเจ้าของ transcript ทุกครั้ง
            เพื่อไม่ให้หลักสูตร CS2565 และ IT2565 ปนกันในผลวิเคราะห์
          </p>
        </div>
        <Link
          className="rounded-md bg-[#f59e0b] px-5 py-3 text-center text-sm font-extrabold text-white shadow-sm hover:bg-[#d98706]"
          href="/student/transcript-tools"
        >
          เปิดหน้าจัดการ transcript
        </Link>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="bg-[#365f9d] text-white">
            <tr>
              <th className="px-5 py-3">ชื่อแฟ้ม</th>
              <th className="px-5 py-3">อีเมลเจ้าของ transcript</th>
              <th className="px-5 py-3">หลักสูตร</th>
              <th className="px-5 py-3">สถานะ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {transcriptCases.map((item) => (
              <tr className="bg-white" key={item.email}>
                <td className="px-5 py-4 font-bold text-slate-800">{item.name}</td>
                <td className="px-5 py-4 text-slate-600">{item.email}</td>
                <td className="px-5 py-4 text-slate-600">{item.program}</td>
                <td className="px-5 py-4">
                  <span className="rounded-full border border-[#b7ddd8] bg-[#effaf8] px-3 py-1 text-xs font-bold text-[#007a64]">
                    {item.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

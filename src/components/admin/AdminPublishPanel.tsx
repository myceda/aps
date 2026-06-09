"use client";

import { useEffect, useState } from "react";

type AuditCheck = {
  id: string;
  title: string;
  status: "passed" | "failed";
  detail: string;
  issues: string[];
};

type PublishStatus = {
  programs: number;
  courses: number;
  structures: number;
  studyPlanItems: number;
  prerequisiteRules: number;
  courseOfferings: number;
  checks: AuditCheck[];
  issues: string[];
  readyToPublish: boolean;
};

type PublishPayload = {
  success: boolean;
  status?: PublishStatus;
  error?: string;
};

const statusCards: Array<{ key: keyof Pick<PublishStatus, "programs" | "courses" | "structures" | "studyPlanItems" | "prerequisiteRules" | "courseOfferings">; label: string }> = [
  { key: "programs", label: "หลักสูตร" },
  { key: "courses", label: "รายวิชา" },
  { key: "structures", label: "หมวดหน่วยกิต" },
  { key: "studyPlanItems", label: "Study plan" },
  { key: "prerequisiteRules", label: "Prerequisite" },
  { key: "courseOfferings", label: "Course offering" }
];

export function AdminPublishPanel() {
  const [status, setStatus] = useState<PublishStatus | null>(null);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function loadStatus() {
    setIsLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/admin/publish-check");
      const payload = (await response.json()) as PublishPayload;

      if (!payload.success || !payload.status) {
        setMessage(payload.error ?? "ตรวจสถานะ publish ไม่สำเร็จ");
        setStatus(null);
        return;
      }

      setStatus(payload.status);
    } catch {
      setMessage("เชื่อมต่อระบบตรวจ publish ไม่ได้");
      setStatus(null);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadStatus();
  }, []);

  const failedChecks = status?.checks.filter((check) => check.status === "failed") ?? [];

  return (
    <section className="surface p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-[#007a64]">ขั้นตอนที่ 8</p>
          <h2 className="mt-1 text-xl font-bold text-ink">Publish ข้อมูลให้นักศึกษาใช้</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            ขั้นนี้เป็น gate สุดท้ายก่อนใช้ข้อมูลกับ Student Dashboard, Graduation Forecast และ What-if Simulation
            ระบบจะบอกว่าอะไรครบแล้ว อะไรยังขาด และอะไรต้องแก้ก่อน publish
          </p>
        </div>
        <button
          className="rounded-md border border-line bg-white px-4 py-2 text-sm font-bold text-slate-700 disabled:opacity-60"
          disabled={isLoading}
          onClick={loadStatus}
          type="button"
        >
          {isLoading ? "กำลังตรวจ" : "ตรวจอีกครั้ง"}
        </button>
      </div>

      {message ? <p className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">{message}</p> : null}

      {status ? (
        <div className="mt-5 grid gap-4">
          <div className={`rounded-md border p-5 ${status.readyToPublish ? "border-emerald-200 bg-emerald-50" : "border-amber-300 bg-amber-50"}`}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className={`text-sm font-extrabold ${status.readyToPublish ? "text-emerald-700" : "text-amber-800"}`}>
                  {status.readyToPublish ? "พร้อม publish" : "ยังไม่พร้อม publish"}
                </p>
                <h3 className="mt-1 text-2xl font-extrabold text-ink">
                  {status.readyToPublish
                    ? "ข้อมูลหลักสูตรพร้อมให้นักศึกษาใช้วิเคราะห์"
                    : `พบ ${status.issues.length} จุดที่ต้องแก้ก่อนเปิดใช้งาน`}
                </h3>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-bold ${status.readyToPublish ? "bg-white text-emerald-700" : "bg-white text-amber-800"}`}>
                {status.readyToPublish ? "ผ่านทุก checklist" : `${failedChecks.length} checklist ต้องแก้`}
              </span>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-700">
              หมายเหตุ: ปุ่ม publish จริงควรถูกเพิ่มเมื่อมี requirement เรื่อง versioning/approval แล้ว ตอนนี้ APS ใช้ผลตรวจนี้เป็น gate ว่าข้อมูลพร้อมให้นักศึกษาใช้หรือยัง
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
            {statusCards.map((card) => (
              <div className="rounded-md border border-line bg-white p-3" key={card.key}>
                <p className="text-xs font-bold text-slate-500">{card.label}</p>
                <p className="mt-1 text-2xl font-extrabold text-ink">{status[card.key]}</p>
              </div>
            ))}
          </div>

          <div className="grid gap-3 lg:grid-cols-2">
            {status.checks.map((check) => (
              <div
                className={`rounded-md border p-4 ${check.status === "passed" ? "border-emerald-200 bg-white" : "border-amber-300 bg-amber-50"}`}
                key={check.id}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-bold text-ink">{check.title}</p>
                    <p className="mt-1 text-sm leading-6 text-slate-600">{check.detail}</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-bold ${check.status === "passed" ? "bg-emerald-50 text-emerald-700" : "bg-white text-amber-800"}`}>
                    {check.status === "passed" ? "ครบแล้ว" : "ต้องแก้"}
                  </span>
                </div>

                {check.issues.length > 0 ? (
                  <div className="mt-3 grid gap-2">
                    {check.issues.slice(0, 5).map((issue) => (
                      <p className="rounded-md bg-white px-3 py-2 text-sm leading-6 text-amber-900" key={issue}>
                        {issue}
                      </p>
                    ))}
                    {check.issues.length > 5 ? (
                      <p className="text-sm font-semibold text-amber-800">และอีก {check.issues.length - 5} รายการ</p>
                    ) : null}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}

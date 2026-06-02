import { Badge } from "@/components/shared/Badge";
import { StatCard } from "@/components/shared/StatCard";
import type { AnalysisResult } from "@/lib/types";

export function DashboardSummary({ analysis }: { analysis: AnalysisResult }) {
  const proStatus = analysis.proStatus;

  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-bold">ภาพรวมผลการเรียน</h2>
        <Badge status={proStatus.tone}>{proStatus.label}</Badge>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="GPAX ปัจจุบัน" value={analysis.gpax.toFixed(2)} detail="จาก transcript ล่าสุด" />
        <StatCard label="GPA ล่าสุด" value={analysis.latestGpa.toFixed(2)} detail="ใช้ตรวจแนวโน้มเทอมล่าสุด" />
        <StatCard label="หน่วยกิตผ่าน" value={analysis.earnedCredits} detail={`ขั้นต่ำ ${analysis.totalCreditsMin} หน่วยกิต`} />
        <StatCard label="หน่วยกิตที่ยังขาด" value={analysis.missingCredits} detail="คำนวณจากหลักสูตรที่เลือก" />
      </div>
      <div className="mt-4 rounded-md border border-line p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-teal">สถานะโปร</p>
            <h3 className="mt-1 text-xl font-bold">{proStatus.label}</h3>
            <p className="mt-1 text-sm leading-6 text-slate-600">{proStatus.summary}</p>
          </div>
          <Badge status={proStatus.tone}>{proStatus.label}</Badge>
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_0.9fr]">
          <div>
            <p className="text-sm font-semibold text-slate-700">เหตุผลที่ระบบใช้ประเมิน</p>
            <div className="mt-2 grid gap-2">
              {proStatus.reasons.map((reason) => (
                <div className="rounded-md bg-mist p-3" key={`${reason.title}-${reason.detail}`}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold">{reason.title}</p>
                    <Badge status={reason.severity}>{reason.severity === "urgent" ? "เร่งด่วน" : reason.severity === "watch" ? "ควรติดตาม" : "ปกติ"}</Badge>
                  </div>
                  <p className="mt-1 text-sm leading-6 text-slate-600">{reason.detail}</p>
                </div>
              ))}
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-700">สิ่งที่ควรทำต่อ</p>
            <div className="mt-2 grid gap-2">
              {proStatus.nextActions.map((action) => (
                <p className="rounded-md border border-line p-3 text-sm leading-6 text-slate-700" key={action}>
                  {action}
                </p>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

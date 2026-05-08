import { Badge } from "@/components/shared/Badge";
import { StatCard } from "@/components/shared/StatCard";
import type { AnalysisResult } from "@/lib/types";

export function DashboardSummary({ analysis }: { analysis: AnalysisResult }) {
  const statusLabel = {
    normal: "ปกติ",
    watch: "ควรติดตาม",
    urgent: "ต้องแก้ไขเร่งด่วน"
  }[analysis.riskStatus];

  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-bold">ภาพรวมผลการเรียน</h2>
        <Badge status={analysis.riskStatus}>{statusLabel}</Badge>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="GPAX ปัจจุบัน" value={analysis.gpax.toFixed(2)} detail="จาก transcript ล่าสุด" />
        <StatCard label="GPA ล่าสุด" value={analysis.latestGpa.toFixed(2)} detail="ใช้ตรวจแนวโน้มเทอมล่าสุด" />
        <StatCard label="หน่วยกิตผ่าน" value={analysis.earnedCredits} detail={`ขั้นต่ำ ${analysis.totalCreditsMin} หน่วยกิต`} />
        <StatCard label="หน่วยกิตที่ยังขาด" value={analysis.missingCredits} detail="คำนวณจากหลักสูตรที่เลือก" />
      </div>
    </section>
  );
}

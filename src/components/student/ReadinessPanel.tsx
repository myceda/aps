import { Badge } from "@/components/shared/Badge";
import type { AnalysisResult } from "@/lib/types";

const statusText = {
  normal: "ปกติ",
  watch: "ควรติดตาม",
  urgent: "ต้องแก้ไขเร่งด่วน"
};

export function ReadinessPanel({ analysis }: { analysis: AnalysisResult }) {
  return (
    <section className="surface p-4">
      <h2 className="text-lg font-bold">ความพร้อมตามกฎสำคัญ</h2>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        {analysis.readiness.map((item) => (
          <div className="rounded-md border border-line p-3" key={item.name}>
            <div className="flex items-start justify-between gap-3">
              <p className="font-semibold">{item.name}</p>
              <Badge status={item.status}>{statusText[item.status]}</Badge>
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-600">{item.detail}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

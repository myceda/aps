import type { RiskStatus } from "@/lib/types";

const styles: Record<RiskStatus, string> = {
  normal: "border-emerald-200 bg-emerald-50 text-emerald-700",
  watch: "border-amber-200 bg-amber-50 text-amber-700",
  urgent: "border-red-200 bg-red-50 text-red-700"
};

export function Badge({ status, children }: { status: RiskStatus; children: React.ReactNode }) {
  return <span className={`inline-flex rounded-lg border px-2.5 py-1 text-xs font-bold ${styles[status]}`}>{children}</span>;
}

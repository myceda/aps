import type { RiskStatus } from "@/lib/types";

const styles: Record<RiskStatus, string> = {
  normal: "border-leaf bg-green-50 text-leaf",
  watch: "border-amber bg-amber-50 text-amber",
  urgent: "border-coral bg-red-50 text-coral"
};

export function Badge({ status, children }: { status: RiskStatus; children: React.ReactNode }) {
  return <span className={`inline-flex rounded-md border px-2 py-1 text-xs font-bold ${styles[status]}`}>{children}</span>;
}

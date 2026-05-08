export function StatCard({ label, value, detail }: { label: string; value: string | number; detail?: string }) {
  return (
    <div className="surface p-4">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-bold text-ink">{value}</p>
      {detail ? <p className="mt-1 text-xs leading-5 text-slate-600">{detail}</p> : null}
    </div>
  );
}

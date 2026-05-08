export function ProgressBar({ value, max }: { value: number; max: number }) {
  const percent = max === 0 ? 0 : Math.min(100, Math.round((value / max) * 100));

  return (
    <div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-200">
        <div className="h-full rounded-full bg-teal" style={{ width: `${percent}%` }} />
      </div>
      <p className="mt-1 text-xs text-slate-500">
        {value}/{max} หน่วยกิต
      </p>
    </div>
  );
}

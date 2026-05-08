import { checkCurriculumCompleteness } from "@/lib/admin/completeness";

export async function AdminCompletenessPanel() {
  const status = await checkCurriculumCompleteness();

  return (
    <section className="surface p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold">ตรวจสอบความครบถ้วนก่อนเผยแพร่</h2>
          <p className="mt-1 text-sm text-slate-600">ตรวจ course master, program structure, study plan และ prerequisite</p>
        </div>
        <span className="rounded-md border border-line px-2 py-1 text-xs font-bold">
          {status.readyToPublish ? "พร้อมเผยแพร่" : "ยังต้องเติมข้อมูล"}
        </span>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-5">
        <Metric label="Programs" value={status.programs} />
        <Metric label="Courses" value={status.courses} />
        <Metric label="Structures" value={status.structures} />
        <Metric label="Plans" value={status.studyPlanItems} />
        <Metric label="Prereq" value={status.prerequisiteRules} />
      </div>
      {status.issues.length > 0 ? (
        <div className="mt-4 rounded-md border border-coral bg-red-50 p-3 text-sm text-coral">
          {status.issues.map((issue) => <p key={issue}>{issue}</p>)}
        </div>
      ) : null}
    </section>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-line p-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-xl font-bold">{value}</p>
    </div>
  );
}

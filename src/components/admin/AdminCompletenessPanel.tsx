import { checkCurriculumCompleteness } from "@/lib/admin/completeness";

const checklist = [
  "หลักสูตรต้องมีโครงสร้างหมวดวิชาและหน่วยกิตขั้นต่ำ",
  "รายวิชาต้องมีรหัส หน่วยกิต และหมวดวิชาที่ชัดเจน",
  "Study plan ต้องครอบคลุมรายปี/รายเทอมที่ต้องการแสดง",
  "Prerequisite ต้องอ้างถึงรายวิชาที่มีอยู่จริง",
  "วิชาเปิดแต่ละเทอมควรตรวจใน workflow ขั้นตอนที่ 5"
];

export async function AdminCompletenessPanel() {
  const status = await checkCurriculumCompleteness();

  return (
    <section className="surface p-4" id="admin-readiness">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-teal">Publish readiness</p>
          <h2 className="mt-1 text-lg font-bold text-ink">ตรวจความครบถ้วนก่อนเผยแพร่</h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            ใช้เช็กว่าข้อมูลหลักสูตรพร้อมให้ student dashboard, graduation forecast และ what-if simulation วิเคราะห์หรือยัง
          </p>
        </div>
        <span className={`rounded-md border px-3 py-2 text-xs font-bold ${status.readyToPublish ? "border-teal bg-mist text-teal" : "border-amber-300 bg-amber-50 text-amber-700"}`}>
          {status.readyToPublish ? "พร้อมเผยแพร่" : "ยังต้องเติมข้อมูล"}
        </span>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-5">
        <Metric label="หลักสูตร" value={status.programs} />
        <Metric label="รายวิชา" value={status.courses} />
        <Metric label="โครงสร้าง" value={status.structures} />
        <Metric label="Study plan" value={status.studyPlanItems} />
        <Metric label="Prerequisite" value={status.prerequisiteRules} />
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <div className="rounded-md border border-line bg-white p-3">
          <p className="font-bold text-ink">สิ่งที่ระบบต้องมีเพื่อวิเคราะห์ได้</p>
          <div className="mt-3 grid gap-2">
            {checklist.map((item) => (
              <p className="rounded-md bg-mist px-3 py-2 text-sm text-slate-700" key={item}>{item}</p>
            ))}
          </div>
        </div>

        <div className={`rounded-md border p-3 ${status.issues.length > 0 ? "border-amber-300 bg-amber-50" : "border-teal bg-mist"}`}>
          <p className={`font-bold ${status.issues.length > 0 ? "text-amber-700" : "text-teal"}`}>
            {status.issues.length > 0 ? "รายการที่ต้องแก้ก่อนเผยแพร่" : "ไม่พบปัญหาหลัก"}
          </p>
          {status.issues.length > 0 ? (
            <div className="mt-3 grid gap-2">
              {status.issues.map((issue) => <p className="text-sm leading-6 text-amber-800" key={issue}>{issue}</p>)}
            </div>
          ) : (
            <p className="mt-3 text-sm leading-6 text-slate-700">ข้อมูลหลักที่ใช้วิเคราะห์ครบตามเงื่อนไขพื้นฐานแล้ว</p>
          )}
        </div>
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-line bg-white p-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-xl font-bold text-ink">{value}</p>
    </div>
  );
}

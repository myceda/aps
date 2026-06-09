import { checkCurriculumCompleteness } from "@/lib/admin/completeness";

const checklistDescriptions = [
  "รายวิชาใน study plan ต้องมีอยู่จริงใน Course master",
  "prerequisite ต้องอ้างถึงรายวิชาที่มีจริงและไม่ข้ามหลักสูตรผิด owner",
  "รายวิชาในแผนต้องมี CourseOffering ในเทอมที่จำเป็น",
  "Research และ Coop ต้องมีรายวิชาใน Course master และ Study Plan ครบ",
  "course category ต้องเป็นหมวดที่ระบบใช้คำนวณได้",
  "credit รวมต่อหมวดต้องตรงกับ PDF หลักสูตร"
];

export async function AdminCompletenessPanel() {
  const status = await checkCurriculumCompleteness();
  const failedChecks = status.checks.filter((check) => check.status === "failed");

  return (
    <section className="surface p-5" id="admin-readiness">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-[#007a64]">ขั้นตอนที่ 1</p>
          <h2 className="mt-1 text-xl font-bold text-ink">ตรวจความพร้อม Curriculum Master Data</h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            ใช้ตรวจข้อมูลก่อน publish ให้นักศึกษาใช้งานจริง ถ้าข้อมูลหลักสูตรไม่พร้อม ผลวิเคราะห์ transcript,
            graduation forecast และ what-if จะเชื่อถือไม่ได้
          </p>
        </div>
        <span
          className={`rounded-md border px-3 py-2 text-xs font-bold ${
            status.readyToPublish
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-amber-300 bg-amber-50 text-amber-700"
          }`}
        >
          {status.readyToPublish ? "พร้อม publish" : "ยังไม่พร้อม publish"}
        </span>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        <Metric label="หลักสูตร" value={status.programs} />
        <Metric label="รายวิชา" value={status.courses} />
        <Metric label="หมวดหลักสูตร" value={status.structures} />
        <Metric label="แผนรายเทอม" value={status.studyPlanItems} />
        <Metric label="Prerequisite" value={status.prerequisiteRules} />
        <Metric label="วิชาเปิดสอน" value={status.courseOfferings} />
      </div>

      <div className="mt-4 grid gap-3">
        <div className="rounded-md border border-line bg-white p-4">
          <p className="font-bold text-ink">Checklist ที่ระบบตรวจให้ก่อน publish</p>
          <div className="mt-3 grid gap-2">
            {checklistDescriptions.map((item) => (
              <p className="rounded-md bg-mist px-3 py-2 text-sm text-slate-700" key={item}>
                {item}
              </p>
            ))}
          </div>
        </div>

        <div className="grid gap-3">
          {status.checks.map((check) => (
            <div
              className={`rounded-md border p-4 ${
                check.status === "passed" ? "border-emerald-200 bg-emerald-50" : "border-amber-300 bg-amber-50"
              }`}
              key={check.id}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className={`font-bold ${check.status === "passed" ? "text-emerald-700" : "text-amber-800"}`}>
                    {check.title}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-slate-700">{check.detail}</p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-bold ${
                    check.status === "passed" ? "bg-white text-emerald-700" : "bg-white text-amber-800"
                  }`}
                >
                  {check.status === "passed" ? "ผ่าน" : "ต้องแก้"}
                </span>
              </div>

              {check.issues.length > 0 ? (
                <ul className="mt-3 grid gap-2">
                  {check.issues.map((issue) => (
                    <li className="rounded-md bg-white px-3 py-2 text-sm leading-6 text-amber-900" key={issue}>
                      {issue}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ))}
        </div>

        <div
          className={`rounded-md border p-4 ${
            failedChecks.length > 0 ? "border-amber-300 bg-amber-50" : "border-emerald-200 bg-emerald-50"
          }`}
        >
          <p className={`font-bold ${failedChecks.length > 0 ? "text-amber-800" : "text-emerald-700"}`}>
            {failedChecks.length > 0 ? `พบ ${status.issues.length} จุดที่ต้องแก้ก่อน publish` : "ไม่พบปัญหาหลัก พร้อม publish"}
          </p>
          <p className="mt-1 text-sm leading-6 text-slate-700">
            เมื่อรายการนี้ผ่านทั้งหมด นักศึกษาจึงควรใช้ผลวิเคราะห์จาก APS เพื่อประกอบการวางแผนเรียน
          </p>
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

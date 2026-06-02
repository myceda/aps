import Link from "next/link";
import { AdminCompletenessPanel } from "@/components/admin/AdminCompletenessPanel";
import { AdminCrudPanel } from "@/components/admin/AdminCrudPanel";
import { AdminImportPanel } from "@/components/admin/AdminImportPanel";
import { AdminMenu } from "@/components/admin/AdminMenu";
import { requireUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

const workflowSteps = [
  {
    title: "1. จัดการหลักสูตร",
    detail: "กำหนดรหัสหลักสูตร ปีหลักสูตร หน่วยกิตรวม และเกณฑ์ GPAX ที่ระบบใช้วิเคราะห์"
  },
  {
    title: "1.1 จัดการโครงสร้างหลักสูตร",
    detail: "กำหนดหมวดวิชาและหน่วยกิตขั้นต่ำ เพื่อให้ระบบตรวจว่านักศึกษาเรียนครบตามหลักสูตรหรือยัง"
  },
  {
    title: "2. จัดการรายวิชา",
    detail: "เพิ่มรหัสวิชา ชื่อวิชา หน่วยกิต หมวดวิชา และหลักสูตรที่เกี่ยวข้อง"
  },
  {
    title: "3. จัดการ prerequisite",
    detail: "กำหนดวิชาบังคับก่อน เพื่อให้ระบบรู้ว่าวิชาใด block วิชาอื่นและใช้ใน what-if"
  },
  {
    title: "4. จัดการ study plan",
    detail: "วางรายวิชาเป็นปี/เทอม เพื่อใช้เป็นฐานคาดการณ์วันจบและ diagram 8 ปี"
  },
  {
    title: "5. จัดการวิชาเปิดแต่ละเทอม",
    detail: "ระบุว่าวิชาใดเปิดเทอม 1, เทอม 2 หรือเทอม 3/Summer ในปีการศึกษาใด"
  },
  {
    title: "6. ตรวจความครบถ้วน",
    detail: "ตรวจว่าข้อมูลพร้อมให้ student dashboard ใช้วิเคราะห์แผนจบหรือยัง"
  }
];

export default async function AdminPage() {
  await requireUser(["admin"]);

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4">
          <div>
            <p className="text-sm font-semibold text-teal">Admin workflow</p>
            <h1 className="text-2xl font-bold text-ink">จัดการข้อมูลหลักสูตรเพื่อให้ระบบวิเคราะห์ได้</h1>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              หน้านี้จัดเรียงงานของผู้ดูแลระบบตามลำดับที่ต้องกรอกจริง ไม่ใช่ให้แก้ JSON หรือเลือกตารางดิบ
            </p>
          </div>
          <Link className="rounded-md border border-line bg-white px-4 py-2 text-sm font-semibold" href="/">
            หน้าแรก
          </Link>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-5 px-6 py-6 lg:grid-cols-[300px_1fr]">
        <AdminMenu />
        <div className="grid gap-5">
          <section className="surface p-4">
            <p className="text-sm font-semibold text-teal">ลำดับงานของผู้ดูแลระบบ</p>
            <h2 className="mt-1 text-lg font-bold text-ink">กรอกข้อมูลตามขั้นตอน เพื่อให้ระบบวางแผนการเรียนได้ถูกต้อง</h2>
            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {workflowSteps.map((step) => (
                <div className="rounded-md border border-line bg-white p-3" key={step.title}>
                  <p className="font-bold text-ink">{step.title}</p>
                  <p className="mt-1 text-sm leading-6 text-slate-600">{step.detail}</p>
                </div>
              ))}
            </div>
          </section>

          <AdminCompletenessPanel />
          <AdminImportPanel />
          <AdminCrudPanel />
        </div>
      </div>
    </main>
  );
}

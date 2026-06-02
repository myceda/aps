"use client";

const menu = [
  { step: "ตรวจ", label: "ตรวจความครบถ้วน", href: "#admin-readiness", detail: "ดูว่าข้อมูลพร้อมเผยแพร่ให้นักศึกษาหรือยัง" },
  { step: "Import", label: "Import template", href: "#admin-import", detail: "ดาวน์โหลด CSV template และนำเข้าข้อมูลจาก Excel" },
  { step: "1", label: "หลักสูตร", resource: "programs", detail: "ชื่อหลักสูตร ปีหลักสูตร หน่วยกิตรวม และเกณฑ์ GPAX" },
  { step: "1.1", label: "โครงสร้างหลักสูตร", resource: "structures", detail: "หมวดวิชาและหน่วยกิตขั้นต่ำของแต่ละหมวด" },
  { step: "2", label: "รายวิชา", resource: "courses", detail: "รหัสวิชา ชื่อวิชา หน่วยกิต และหมวดวิชา" },
  { step: "3", label: "Prerequisite", resource: "prerequisites", detail: "วิชาบังคับก่อนและวิชาที่เรียนพร้อมกันได้" },
  { step: "4", label: "Study plan", resource: "study-plans", detail: "แผนรายปี/รายเทอมตามหลักสูตร" },
  { step: "5", label: "วิชาเปิดแต่ละเทอม", resource: "offerings", detail: "เทอม 1, เทอม 2 และเทอม 3/Summer" }
] as const;

export function AdminMenu() {
  function openResource(resource: string) {
    window.dispatchEvent(new CustomEvent("admin-resource-change", { detail: resource }));
    document.getElementById("admin-management")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <nav className="surface sticky top-4 h-fit p-4">
      <p className="text-sm font-semibold text-teal">Admin navigation</p>
      <h2 className="mt-1 text-lg font-bold text-ink">ตั้งค่าตาม workflow</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        เลือกงานที่ต้องจัดการ ระบบจะเปิดฟอร์มด้านขวาให้กรอกข้อมูลที่จำเป็นต่อการวิเคราะห์
      </p>

      <div className="mt-4 grid gap-2">
        {menu.map((item) => (
          "href" in item ? (
            <a className="rounded-md border border-line bg-white px-3 py-2 text-left hover:bg-mist" href={item.href} key={item.label}>
              <span className="text-xs font-bold text-teal">{item.step}</span>
              <span className="mt-1 block text-sm font-bold text-ink">{item.label}</span>
              <span className="mt-1 block text-xs leading-5 text-slate-500">{item.detail}</span>
            </a>
          ) : (
            <button className="rounded-md border border-line bg-white px-3 py-2 text-left hover:bg-mist" key={item.label} onClick={() => openResource(item.resource)}>
              <span className="text-xs font-bold text-teal">{item.step}</span>
              <span className="mt-1 block text-sm font-bold text-ink">{item.label}</span>
              <span className="mt-1 block text-xs leading-5 text-slate-500">{item.detail}</span>
            </button>
          )
        ))}
      </div>
    </nav>
  );
}

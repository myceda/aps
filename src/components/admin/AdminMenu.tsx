"use client";

export type AdminStepKey =
  | "overview"
  | "import"
  | "programs"
  | "courses"
  | "prerequisites"
  | "study-plans"
  | "offerings"
  | "publish";

const menu: Array<{
  step: string;
  key: AdminStepKey;
  label: string;
  detail: string;
}> = [
  {
    step: "ภาพรวม",
    key: "overview",
    label: "ตรวจความพร้อมเผยแพร่",
    detail: "ดูว่าข้อมูลพร้อมให้นักศึกษาใช้งานหรือยัง และนำเข้าข้อมูลจากแม่แบบ"
  },
  {
    step: "2",
    key: "import",
    label: "นำเข้าข้อมูล CSV",
    detail: "นำเข้าข้อมูลตั้งต้นจาก template ก่อนแก้รายละเอียดรายหมวด"
  },
  {
    step: "3",
    key: "programs",
    label: "จัดการหลักสูตร",
    detail: "ชื่อหลักสูตร ปีหลักสูตร หน่วยกิตรวม และหมวดหน่วยกิตขั้นต่ำ"
  },
  {
    step: "4",
    key: "courses",
    label: "จัดการรายวิชา",
    detail: "รหัสวิชา ชื่อวิชา หน่วยกิต และหมวดวิชา"
  },
  {
    step: "5",
    key: "prerequisites",
    label: "วิชาบังคับก่อน / วิชาตัวต่อ",
    detail: "กำหนดวิชาที่ต้องผ่านก่อนและวิชาที่เรียนพร้อมกันได้"
  },
  {
    step: "6",
    key: "study-plans",
    label: "แผนผังการเรียนรายเทอม",
    detail: "แผนรายปีและรายเทอมตามหลักสูตร"
  },
  {
    step: "7",
    key: "offerings",
    label: "จัดการวิชาเปิดแต่ละเทอม",
    detail: "กำหนดเทอม 1 เทอม 2 และภาคฤดูร้อน"
  },
  {
    step: "8",
    key: "publish",
    label: "Publish",
    detail: "ตรวจผลสุดท้ายก่อนเปิดให้นักศึกษาใช้"
  }
];

type AdminMenuProps = {
  activeStep: AdminStepKey;
  onStepChange: (step: AdminStepKey) => void;
};

export function AdminMenu({ activeStep, onStepChange }: AdminMenuProps) {
  return (
    <nav className="app-sidebar sticky top-4 h-fit p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-sky-200">เมนูผู้ดูแลระบบ</p>
      <h2 className="mt-1 text-lg font-bold">ตั้งค่าผู้ดูแลระบบ</h2>
      <p className="mt-2 text-sm leading-6 text-slate-300">
        จัดการข้อมูลตามลำดับงาน เพื่อให้ระบบคาดการณ์วันจบและระบบจำลองสถานการณ์เรียนทำงานได้ถูกต้อง
      </p>

      <div className="mt-4 grid gap-2">
        {menu.map((item) => (
          <button
            className={`app-sidebar-item px-3 py-2 text-left transition ${
              activeStep === item.key ? "bg-sky-600 text-white shadow-sm" : ""
            }`}
            key={item.key}
            onClick={() => onStepChange(item.key)}
            type="button"
          >
            <span className="text-xs font-bold text-sky-200">{item.step}</span>
            <span className="mt-1 block text-sm font-bold">{item.label}</span>
            <span className="mt-1 block text-xs leading-5 text-slate-300">{item.detail}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}

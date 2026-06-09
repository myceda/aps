import { AuthButtons } from "@/components/shared/AuthButtons";

export const dynamic = "force-dynamic";

const workflowCards = [
  {
    title: "นักศึกษา",
    description: "เข้าสู่ dashboard ดูสถานะ GPAX หน่วยกิตที่ผ่านแล้ว วิชาที่ยังขาด แผนจบ และเริ่มจำลอง What-if",
    steps: ["ตรวจ transcript", "ดูคาดการณ์วันจบ", "จำลองถอน/ลงเพิ่ม/ไม่ผ่าน"]
  },
  {
    title: "ผู้ดูแลระบบ",
    description: "เตรียมข้อมูลหลักสูตร รายวิชา prerequisite แผนรายเทอม และวิชาที่เปิดสอนก่อนเผยแพร่",
    steps: ["ตรวจความพร้อมข้อมูล", "นำเข้า CSV", "เผยแพร่ให้ระบบวิเคราะห์"]
  },
  {
    title: "Transcript Tools",
    description: "อ่าน PDF แบบมี text layer ก่อน แล้วให้ผู้ใช้ตรวจแก้ตารางเองเมื่อข้อมูลขาดหรือเรียงผิด",
    steps: ["อัปโหลด PDF", "ตรวจแถวรายวิชา", "ยืนยันเข้าฐานข้อมูล"]
  }
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#eef3f5] text-slate-900">
      <header className="bg-[#007a64] text-white shadow-sm">
        <div className="mx-auto flex h-24 max-w-7xl items-center justify-between px-5 sm:px-8">
          <div className="flex items-center gap-4">
            <div className="grid h-16 w-16 shrink-0 place-items-center rounded-full border border-white/40 bg-white/10 text-xs font-bold">
              SU
            </div>
            <div>
              <p className="text-lg font-bold leading-6">มหาวิทยาลัยศิลปากร</p>
              <p className="text-xl font-extrabold leading-7">ระบบวางแผนการศึกษา APS</p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm font-bold">
            <span className="hidden rounded-full bg-white/10 px-3 py-1 sm:inline-flex">TH</span>
            <span className="hidden text-sm sm:inline">Dark</span>
            <a className="rounded-lg bg-white px-4 py-2 text-[#007a64]" href="#login">
              เข้าสู่ระบบ
            </a>
          </div>
        </div>
      </header>

      <nav className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-20 max-w-7xl items-center gap-8 px-5 sm:px-8">
          <div className="text-5xl font-extrabold tracking-normal text-[#007a64]">
            APS<span className="text-[#f5c400]">.</span>SU
          </div>
          <div className="hidden items-center gap-8 text-base font-bold text-slate-500 md:flex">
            <span className="border-b-2 border-[#f5c400] py-1 text-[#007a64]">หน้าแรก</span>
            <span>ผลการวิเคราะห์</span>
            <span>Transcript Tools</span>
            <span>Admin Setup</span>
          </div>
        </div>
      </nav>

      <section className="mx-auto grid max-w-7xl gap-8 px-5 py-8 sm:px-8 lg:grid-cols-[minmax(360px,480px)_1fr] lg:py-12">
        <div id="login" className="rounded-lg bg-white p-8 shadow-[0_24px_80px_rgb(15_23_42/0.10)]">
          <div className="text-center">
            <p className="text-6xl font-extrabold tracking-normal text-[#007a64]">
              APS<span className="text-[#f5c400]">.</span>SU
            </p>
            <p className="mt-3 text-base font-semibold text-slate-600">
              เข้าสู่ระบบบริการการศึกษาเพื่อวางแผนการเรียน
            </p>
          </div>
          <div className="mt-8">
            <AuthButtons />
          </div>
        </div>

        <div className="grid content-start gap-5">
          <section className="rounded-lg border border-amber-200 bg-amber-50 px-5 py-4 text-slate-800">
            <p className="text-lg font-bold">ระบบนี้ตอบคำถามหลักก่อนลงทะเบียน</p>
            <p className="mt-2 text-sm leading-6">
              ตอนนี้เรียนผ่านพอหรือยัง, ยังขาดหมวดไหน, มีวิชา prerequisite ที่ block แผนจบไหม,
              และถ้าถอน/ลงเพิ่ม/ไม่ผ่านรายวิชา จะเลื่อนจบกี่เทอม
            </p>
          </section>

          <section className="grid gap-4 lg:grid-cols-3">
            {workflowCards.map((card) => (
              <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm" key={card.title}>
                <h2 className="text-xl font-extrabold text-[#007a64]">{card.title}</h2>
                <p className="mt-2 min-h-20 text-sm leading-6 text-slate-600">{card.description}</p>
                <ol className="mt-4 grid gap-2">
                  {card.steps.map((step, index) => (
                    <li className="flex items-center gap-3 text-sm font-semibold text-slate-700" key={step}>
                      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#007a64] text-xs text-white">
                        {index + 1}
                      </span>
                      {step}
                    </li>
                  ))}
                </ol>
              </article>
            ))}
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-extrabold text-slate-950">Logic ที่ระบบใช้วิเคราะห์</h2>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  แยกสิทธิ์ Student/Admin, อ่าน transcript, ตรวจหลักสูตร CS/IT ตามเจ้าของข้อมูล,
                  เช็ก prerequisite, วิชาที่เปิดสอน, credit limit และคาดการณ์วันจบ
                </p>
              </div>
              <div className="rounded-lg bg-[#f59e0b] px-4 py-3 text-sm font-extrabold text-white shadow-sm">
                คำนวณแผนล่วงหน้า
              </div>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}

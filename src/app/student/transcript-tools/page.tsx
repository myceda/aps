import Link from "next/link";
import { CurriculumSetup } from "@/components/student/CurriculumSetup";
import { TranscriptPreview } from "@/components/student/TranscriptPreview";
import { AcademicAppShell } from "@/components/shared/AcademicAppShell";
import { requireUser } from "@/lib/auth/session";
import { getStudentProgram, resolveTranscriptOwner } from "@/lib/db/repository";

export const dynamic = "force-dynamic";

type StudentTranscriptToolsPageProps = {
  searchParams?: Promise<{
    ownerEmail?: string;
    ownerName?: string;
  }>;
};

export default async function StudentTranscriptToolsPage({ searchParams }: StudentTranscriptToolsPageProps) {
  const user = await requireUser(["student", "admin"]);
  const params = await searchParams;
  const owner = await resolveTranscriptOwner(
    user,
    {
      ownerEmail: params?.ownerEmail,
      ownerName: params?.ownerName
    },
    { createIfMissing: Boolean(params?.ownerEmail) }
  );
  const studentProgram = await getStudentProgram(owner.id);
  const dashboardHref = owner.email ? `/student?ownerEmail=${encodeURIComponent(owner.email)}` : "/student";

  const sidebar = (
    <>
      <div className="border-b border-slate-100 p-5">
        <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Transcript Workflow</p>
        <h1 className="mt-2 text-2xl font-extrabold text-slate-800">จัดการข้อมูลผลการเรียน</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          เริ่มจากหลักสูตร แล้วค่อยอ่าน PDF และตรวจตารางก่อนยืนยันเข้าระบบวิเคราะห์
        </p>
      </div>
      <div className="grid gap-2 p-3">
        <StepNav step="1" title="ตั้งค่าหลักสูตร" detail="เลือก CS/IT, track และรหัสนักศึกษา" />
        <StepNav step="2" title="อัปโหลด/อ่าน PDF" detail="อ่าน text layer ก่อน ไม่ใช้ OCR เป็นหลัก" />
        <StepNav step="3" title="ตรวจและยืนยัน" detail="แก้แถวผิด เพิ่มรายวิชา และบันทึก" />
      </div>
      <div className="border-t border-slate-100 p-4">
        <Link
          className="block rounded-md border border-[#007a64] bg-white px-4 py-3 text-center text-sm font-extrabold text-[#007a64] hover:bg-emerald-50"
          href={dashboardHref}
        >
          กลับ Student Dashboard
        </Link>
      </div>
    </>
  );

  return (
    <AcademicAppShell
      navItems={[
        { href: dashboardHref, label: "หน้าแรกนักศึกษา" },
        { label: "จัดการผลการเรียน", isActive: true },
        { href: "/admin", label: "ผู้ดูแลระบบ" }
      ]}
      roleLabel={user.role === "admin" ? "ผู้ดูแลระบบ" : "นักศึกษา"}
      sidebar={sidebar}
      userEmail={owner.email}
      userName={owner.name}
    >
      <section className="overflow-hidden rounded-md bg-white shadow-sm ring-1 ring-slate-200">
        <div className="grid gap-5 border-b border-slate-200 p-5 lg:grid-cols-[1fr_360px]">
          <div>
            <div className="mb-2 flex flex-wrap items-center gap-2 text-sm font-bold">
              <Link className="text-[#007a64]" href={dashboardHref}>หน้าแรกนักศึกษา</Link>
              <span className="text-slate-300">/</span>
              <span className="text-slate-400">จัดการผลการเรียน</span>
            </div>
            <h1 className="text-3xl font-extrabold text-slate-700">ตั้งค่าหลักสูตร อัปโหลด PDF แล้วตรวจข้อมูลก่อนยืนยัน</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              หน้านี้คือจุดเริ่มต้นของการวิเคราะห์ ถ้า PDF อ่านไม่ครบ ให้แก้ไขหรือเพิ่มรายวิชาด้วยตัวเองก่อนบันทึก
              เพื่อให้ GPAX หน่วยกิตที่ขาด และวันจบคำนวณจากข้อมูลที่ถูกต้อง
            </p>
          </div>
          <div className="rounded-md border border-[#b7ddd8] bg-[#effaf8] p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-[#007a64]">แฟ้มข้อมูลที่กำลังจัดการ</p>
            <p className="mt-2 text-lg font-extrabold text-slate-800">{owner.name || "นักศึกษา"}</p>
            <p className="break-all text-sm text-slate-500">{owner.email}</p>
            <p className="mt-3 text-xs leading-5 text-slate-600">
              ถ้าเป็น transcript ของเพื่อน ให้เปิดแฟ้มด้วยอีเมลของเจ้าของ transcript เพื่อไม่ให้ผลวิเคราะห์ปนกับบัญชีที่ login
            </p>
          </div>
        </div>

        <form action="/student/transcript-tools" className="grid gap-3 border-b border-slate-200 bg-slate-50 p-5 lg:grid-cols-[1fr_1fr_auto]" method="get">
          <label className="text-sm font-bold text-slate-700">
            ชื่อเจ้าของ transcript
            <input
              className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
              defaultValue={owner.name}
              name="ownerName"
              placeholder="เช่น Sand, Nook, Minie"
            />
          </label>
          <label className="text-sm font-bold text-slate-700">
            อีเมลเจ้าของ transcript
            <input
              className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
              defaultValue={owner.email}
              name="ownerEmail"
              placeholder="friend@silpakorn.edu"
              type="email"
            />
          </label>
          <div className="flex items-end">
            <button className="w-full rounded-md bg-[#007a64] px-5 py-3 text-sm font-extrabold text-white hover:bg-[#006855]" type="submit">
              เปิด/สร้างแฟ้มนี้
            </button>
          </div>
        </form>

        <div className="grid divide-y divide-slate-200 md:grid-cols-3 md:divide-x md:divide-y-0">
          <StepIntro step="1" title="ตั้งค่าหลักสูตร" detail="เลือกหลักสูตร รหัสนักศึกษา และแผนการเรียนให้ตรงกับ transcript จริง" />
          <StepIntro step="2" title="อัปโหลด/อ่าน PDF" detail="ระบบอ่าน PDF ที่มี text layer ได้ก่อน ถ้าไฟล์เป็นภาพอาจต้องเพิ่มข้อมูลเอง" />
          <StepIntro step="3" title="ตรวจและยืนยัน" detail="ตรวจรหัสวิชา เกรด I/W/S/U เทอม และปี ก่อนอัปเดต Dashboard" />
        </div>
      </section>

      <section className="rounded-md bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <div className="mb-4">
          <p className="text-sm font-semibold text-[#007a64]">ขั้นตอนที่ 1</p>
          <h2 className="text-lg font-bold text-slate-800">ตั้งค่าหลักสูตรที่ใช้วิเคราะห์</h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            ข้อมูลนี้มีผลต่อหน่วยกิตคงเหลือ prerequisite และวันจบที่ระบบคาดการณ์
          </p>
        </div>
        <CurriculumSetup
          initialProgramCode={studentProgram?.program.code}
          initialStudentCode={studentProgram?.studentCode}
          initialTrack={studentProgram?.track}
          ownerEmail={owner.email}
          ownerName={owner.name}
        />
      </section>

      <TranscriptPreview ownerEmail={owner.email} ownerName={owner.name} />
    </AcademicAppShell>
  );
}

function StepNav({ step, title, detail }: { step: string; title: string; detail: string }) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
      <div className="flex items-start gap-3">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#007a64] text-xs font-black text-white">
          {step}
        </span>
        <div>
          <p className="text-sm font-extrabold text-slate-800">{title}</p>
          <p className="mt-1 text-xs leading-5 text-slate-500">{detail}</p>
        </div>
      </div>
    </div>
  );
}

function StepIntro({ step, title, detail }: { step: string; title: string; detail: string }) {
  return (
    <div className="p-5">
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#007a64] text-sm font-bold text-white">
        {step}
      </div>
      <h3 className="mt-3 text-lg font-bold text-slate-800">{title}</h3>
      <p className="mt-1 text-sm leading-6 text-slate-600">{detail}</p>
    </div>
  );
}

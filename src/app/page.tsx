import { AuthButtons } from "@/components/shared/AuthButtons";

export const dynamic = "force-dynamic";

export default function HomePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-10">
      <section className="w-full max-w-3xl rounded-lg border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="rounded-md border border-sky-200 bg-sky-50 px-4 py-3 text-sm font-semibold text-sky-800">
          รองรับเฉพาะบัญชีภายในมหาวิทยาลัยศิลปากรเท่านั้น
        </div>

        <div className="mt-6">
          <p className="text-sm font-semibold text-teal">Academic Planning Support</p>
          <h1 className="mt-3 text-3xl font-bold leading-tight text-ink sm:text-4xl">
            ระบบวิเคราะห์ผลการเรียนเทียบหลักสูตร
          </h1>
          <p className="mt-4 text-base leading-7 text-slate-600">
            กรุณาเข้าสู่ระบบด้วย Google Account ของมหาวิทยาลัยก่อนใช้งาน นักศึกษาใช้บัญชี @silpakorn.edu หรือ @su.ac.th
            ส่วนผู้ดูแลระบบใช้บัญชีที่กำหนดไว้ในระบบ
          </p>
        </div>

        <div className="mt-7">
          <AuthButtons />
        </div>
      </section>
    </main>
  );
}

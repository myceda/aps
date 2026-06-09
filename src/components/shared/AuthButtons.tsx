"use client";

import Link from "next/link";
import { signIn, signOut, useSession } from "next-auth/react";

export function AuthButtons() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-4 text-center text-sm font-bold text-slate-600">
        กำลังตรวจสอบสถานะการเข้าสู่ระบบ
      </div>
    );
  }

  if (session?.user) {
    const isAdmin = session.user.role === "admin";
    const dashboardHref = isAdmin ? "/admin" : "/student";
    const roleLabel = isAdmin ? "ผู้ดูแลระบบ" : "นักศึกษา";
    const dashboardLabel = isAdmin ? "เข้าสู่ Admin Panel" : "เข้าสู่ Student Dashboard";
    const helperText = isAdmin
      ? "บัญชีนี้สามารถจัดการข้อมูลหลักสูตร และเปิดแฟ้ม transcript ของนักศึกษาคนอื่นเพื่อช่วยตรวจได้"
      : "บัญชีนี้จะใช้ข้อมูล transcript ของตัวเองเพื่อวิเคราะห์แผนเรียนและวันจบ";

    return (
      <div className="grid gap-4">
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
          <p className="text-sm font-extrabold text-[#007a64]">เข้าสู่ระบบแล้ว: {roleLabel}</p>
          <p className="mt-1 break-all text-sm font-semibold text-slate-700">{session.user.email}</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">{helperText}</p>
        </div>

        <Link
          className="rounded-lg bg-[#007a64] px-5 py-4 text-center text-base font-extrabold text-white shadow-sm transition hover:bg-[#006855]"
          href={dashboardHref}
        >
          {dashboardLabel}
        </Link>

        <div className="grid gap-3 sm:grid-cols-2">
          <Link
            className="rounded-lg border border-[#007a64] bg-white px-4 py-3 text-center text-sm font-bold text-[#007a64] transition hover:bg-emerald-50"
            href="/student/transcript-tools"
          >
            จัดการ Transcript
          </Link>
          <button
            className="rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-600 transition hover:border-slate-400 hover:text-slate-900"
            onClick={() => signOut({ callbackUrl: "/" })}
            type="button"
          >
            ออกจากระบบ
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      <button
        className="w-full rounded-lg bg-[#007a64] px-5 py-4 text-base font-extrabold text-white shadow-sm transition hover:bg-[#006855]"
        onClick={() => signIn("google", { callbackUrl: "/auth/redirect" })}
        type="button"
      >
        เข้าสู่ระบบด้วยบัญชีมหาวิทยาลัย
      </button>
      <button
        className="w-full rounded-lg border border-[#007a64] bg-white px-5 py-3 text-base font-bold text-[#007a64] transition hover:bg-emerald-50"
        onClick={() => signIn("google", { callbackUrl: "/auth/redirect" })}
        type="button"
      >
        ใช้ Google Account ของ Silpakorn
      </button>
      <p className="text-center text-sm leading-6 text-slate-500">
        หลังเข้าสู่ระบบ APS จะตรวจบทบาทบัญชี แล้วพาไปยัง Student Dashboard หรือ Admin Panel โดยอัตโนมัติ
      </p>
    </div>
  );
}

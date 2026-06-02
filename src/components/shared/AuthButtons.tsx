"use client";

import Link from "next/link";
import { signIn, signOut, useSession } from "next-auth/react";

export function AuthButtons() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-600">
        กำลังตรวจสอบ session
      </div>
    );
  }

  if (session?.user) {
    const dashboardHref = session.user.role === "admin" ? "/admin" : "/student";
    const roleLabel = session.user.role === "admin" ? "ผู้ดูแลระบบ" : "นักศึกษา";

    return (
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 sm:p-5">
        <div className="flex flex-col gap-1">
          <p className="text-sm font-semibold text-sky-700">ยืนยันตัวตนสำเร็จ</p>
          <h2 className="text-2xl font-bold text-ink">ยินดีต้อนรับเข้าสู่ระบบ</h2>
          <p className="text-sm leading-6 text-slate-600">
            คุณเข้าสู่ระบบในบทบาท{roleLabel}แล้ว สามารถไปยังแดชบอร์ดเพื่อดูสถานะ แผนจบ และเครื่องมือวางแผนการเรียนได้ทันที
          </p>
        </div>

        <div className="mt-4 rounded-md border border-slate-200 bg-white px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">บัญชีที่ใช้งาน</p>
          <p className="mt-1 break-all text-sm font-semibold text-slate-700">{session.user.email}</p>
        </div>

        <div className="mt-5 grid gap-3">
          <Link
            className="rounded-md bg-sky-600 px-5 py-4 text-center text-base font-bold text-white shadow-sm transition hover:bg-sky-700"
            href={dashboardHref}
          >
            เข้าสู่แดชบอร์ดวางแผนการเรียน
          </Link>

          <div className="flex justify-end">
            <button
              className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-400 hover:text-slate-800"
              onClick={() => signOut({ callbackUrl: "/" })}
              type="button"
            >
              ออกจากระบบ
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      <button
        className="rounded-md bg-sky-600 px-5 py-4 text-base font-bold text-white shadow-sm transition hover:bg-sky-700"
        onClick={() => signIn("google", { callbackUrl: "/auth/redirect" })}
        type="button"
      >
        เข้าสู่ระบบด้วย Google Account
      </button>
    </div>
  );
}

"use client";

import Link from "next/link";
import { signIn, signOut, useSession } from "next-auth/react";

export function AuthButtons() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="rounded-md border border-line px-4 py-3 text-sm font-semibold text-slate-600">
        กำลังตรวจสอบ session
      </div>
    );
  }

  if (session?.user) {
    const dashboardHref = session.user.role === "admin" ? "/admin" : "/student";

    return (
      <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
        <Link
          className="rounded-md bg-teal px-4 py-3 text-center text-sm font-semibold text-white"
          href={dashboardHref}
        >
          เข้าสู่หน้าหลัก
        </Link>
        <button
          className="rounded-md border border-line px-4 py-3 text-sm font-semibold text-ink"
          onClick={() => signOut({ callbackUrl: "/" })}
          type="button"
        >
          ออกจากระบบ
        </button>
        <p className="text-sm text-slate-500 sm:col-span-2">{session.user.email}</p>
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      <button
        className="rounded-md bg-teal px-4 py-3 text-sm font-semibold text-white"
        onClick={() => signIn("google", { callbackUrl: "/auth/redirect" })}
        type="button"
      >
        Continue with Google
      </button>
    </div>
  );
}

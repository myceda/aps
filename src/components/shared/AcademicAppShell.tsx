import Link from "next/link";
import type { ReactNode } from "react";

export type AcademicNavItem = {
  href?: string;
  label: string;
  isActive?: boolean;
};

type AcademicAppShellProps = {
  children: ReactNode;
  navItems: AcademicNavItem[];
  roleLabel: string;
  sidebar: ReactNode;
  userEmail?: string | null;
  userName?: string | null;
};

export function AcademicAppShell({
  children,
  navItems,
  roleLabel,
  sidebar,
  userEmail,
  userName
}: AcademicAppShellProps) {
  return (
    <main className="min-h-screen bg-[#eef3f5] text-slate-800">
      <header className="bg-[#007a64] text-white">
        <div className="mx-auto flex max-w-[1480px] items-center justify-between gap-4 px-5 py-3">
          <div className="flex items-center gap-3">
            <div className="grid h-14 w-14 shrink-0 place-items-center rounded-full border-2 border-white/80 text-sm font-black">
              SU
            </div>
            <div>
              <p className="text-lg font-extrabold leading-6">มหาวิทยาลัยศิลปากร</p>
              <p className="text-lg font-extrabold leading-6">ระบบช่วยวางแผนการเรียน APS</p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-sm font-bold">
            <span className="hidden rounded-full bg-white/10 px-3 py-1 md:inline-flex">TH</span>
            <div className="hidden border-l border-white/30 pl-4 text-right md:block">
              <p>{userName || "ผู้ใช้งาน"}</p>
              <p className="text-xs font-semibold text-white/75">{roleLabel}</p>
              <p className="max-w-56 truncate text-xs font-semibold text-white/70">{userEmail || "Silpakorn Account"}</p>
            </div>
          </div>
        </div>
      </header>

      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-[1480px] flex-wrap items-center gap-8 px-5 py-4">
          <Link className="text-4xl font-black tracking-normal text-[#007a64]" href="/">
            APS<span className="text-[#f4c400]">.</span>SU
          </Link>
          <nav className="flex flex-wrap gap-6 text-sm font-bold text-slate-500">
            {navItems.map((item) => {
              const className = item.isActive ? "text-[#007a64]" : "hover:text-[#007a64]";
              return item.href ? (
                <Link className={className} href={item.href} key={item.label}>
                  {item.label}
                </Link>
              ) : (
                <span className={className} key={item.label}>
                  {item.label}
                </span>
              );
            })}
          </nav>
        </div>
      </div>

      <div className="mx-auto grid max-w-[1480px] gap-6 px-5 py-6 lg:grid-cols-[320px_1fr]">
        <aside className="self-start rounded-md bg-white shadow-sm ring-1 ring-slate-200">{sidebar}</aside>
        <section className="grid min-w-0 gap-5">{children}</section>
      </div>
    </main>
  );
}

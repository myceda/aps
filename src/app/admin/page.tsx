import Link from "next/link";
import { AdminCompletenessPanel } from "@/components/admin/AdminCompletenessPanel";
import { AdminCrudPanel } from "@/components/admin/AdminCrudPanel";
import { AdminMenu } from "@/components/admin/AdminMenu";
import { CurriculumEditor } from "@/components/admin/CurriculumEditor";
import { requireUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  await requireUser(["admin"]);

  return (
    <main className="min-h-screen">
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <p className="text-sm font-semibold text-teal">Admin</p>
            <h1 className="text-2xl font-bold">จัดการหลักสูตรและตรวจข้อมูลก่อนเผยแพร่</h1>
          </div>
          <Link className="rounded-md border border-line px-4 py-2 text-sm font-semibold" href="/">
            หน้าแรก
          </Link>
        </div>
      </header>
      <div className="mx-auto grid max-w-7xl gap-5 px-6 py-6 lg:grid-cols-[280px_1fr]">
        <AdminMenu />
        <div className="grid gap-5">
          <AdminCompletenessPanel />
          <AdminCrudPanel />
          <CurriculumEditor />
        </div>
      </div>
    </main>
  );
}

import { AdminCompletenessPanel } from "@/components/admin/AdminCompletenessPanel";
import { AdminDashboardShell } from "@/components/admin/AdminDashboardShell";
import { AdminImportPanel } from "@/components/admin/AdminImportPanel";
import { requireUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  await requireUser(["admin"]);

  return (
    <AdminDashboardShell
      importPanel={<AdminImportPanel />}
      readinessPanel={<AdminCompletenessPanel />}
    />
  );
}

import { NextResponse } from "next/server";
import { buildCsvTemplate, isAdminImportResource } from "@/lib/admin/import-template";
import { requireApiUser } from "@/lib/auth/api-guard";

export async function GET(_: Request, context: { params: Promise<{ resource: string }> }) {
  const auth = await requireApiUser(["admin"]);
  if (auth.error) return auth.error;

  const { resource } = await context.params;
  if (!isAdminImportResource(resource)) {
    return NextResponse.json({ success: false, error: "ไม่พบ template ที่เลือก" }, { status: 404 });
  }

  return new NextResponse(buildCsvTemplate(resource), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="aps-${resource}-template.csv"`
    }
  });
}

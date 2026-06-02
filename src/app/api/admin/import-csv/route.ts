import { NextResponse } from "next/server";
import { importAdminCsv, isAdminImportResource } from "@/lib/admin/import-template";
import { requireApiUser } from "@/lib/auth/api-guard";

export async function POST(request: Request) {
  const auth = await requireApiUser(["admin"]);
  if (auth.error) return auth.error;

  const formData = await request.formData();
  const resource = String(formData.get("resource") ?? "");
  const file = formData.get("file");

  if (!isAdminImportResource(resource)) {
    return NextResponse.json({ success: false, error: "ไม่พบประเภทข้อมูลที่ต้องการนำเข้า" }, { status: 400 });
  }

  if (!(file instanceof File)) {
    return NextResponse.json({ success: false, error: "กรุณาเลือกไฟล์ CSV" }, { status: 400 });
  }

  const result = await importAdminCsv(resource, await file.text());
  return NextResponse.json(result, { status: result.success ? 200 : 207 });
}

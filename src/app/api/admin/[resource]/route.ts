import { NextResponse } from "next/server";
import { createResource, isAdminResource, listResource } from "@/lib/admin/crud";
import { requireApiUser } from "@/lib/auth/api-guard";

export async function GET(_: Request, context: { params: Promise<{ resource: string }> }) {
  const auth = await requireApiUser(["admin"]);
  if (auth.error) return auth.error;

  const { resource } = await context.params;
  if (!isAdminResource(resource)) {
    return NextResponse.json({ success: false, error: "ไม่พบชุดข้อมูลผู้ดูแลระบบที่เลือก" }, { status: 404 });
  }

  return NextResponse.json({ success: true, items: await listResource(resource) });
}

export async function POST(request: Request, context: { params: Promise<{ resource: string }> }) {
  const auth = await requireApiUser(["admin"]);
  if (auth.error) return auth.error;

  const { resource } = await context.params;
  if (!isAdminResource(resource)) {
    return NextResponse.json({ success: false, error: "ไม่พบชุดข้อมูลผู้ดูแลระบบที่เลือก" }, { status: 404 });
  }

  try {
    const item = await createResource(resource, await request.json());
    return NextResponse.json({ success: true, item }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "เพิ่มข้อมูลไม่สำเร็จ" }, { status: 400 });
  }
}

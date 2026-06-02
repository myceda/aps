import { NextResponse } from "next/server";
import { deleteResource, isAdminResource, updateResource } from "@/lib/admin/crud";
import { requireApiUser } from "@/lib/auth/api-guard";

export async function PUT(request: Request, context: { params: Promise<{ resource: string; id: string }> }) {
  const auth = await requireApiUser(["admin"]);
  if (auth.error) return auth.error;

  const { resource, id } = await context.params;
  if (!isAdminResource(resource)) {
    return NextResponse.json({ success: false, error: "ไม่พบชุดข้อมูลผู้ดูแลระบบที่เลือก" }, { status: 404 });
  }

  try {
    const item = await updateResource(resource, Number(id), await request.json());
    return NextResponse.json({ success: true, item });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "อัปเดตข้อมูลไม่สำเร็จ" }, { status: 400 });
  }
}

export async function DELETE(_: Request, context: { params: Promise<{ resource: string; id: string }> }) {
  const auth = await requireApiUser(["admin"]);
  if (auth.error) return auth.error;

  const { resource, id } = await context.params;
  if (!isAdminResource(resource)) {
    return NextResponse.json({ success: false, error: "ไม่พบชุดข้อมูลผู้ดูแลระบบที่เลือก" }, { status: 404 });
  }

  try {
    const item = await deleteResource(resource, Number(id));
    return NextResponse.json({ success: true, item });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "ลบข้อมูลไม่สำเร็จ" }, { status: 400 });
  }
}

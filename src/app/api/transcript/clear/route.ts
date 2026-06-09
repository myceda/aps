import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth/api-guard";
import { deleteTranscriptData, resolveTranscriptOwner } from "@/lib/db/repository";

export async function DELETE(request: Request) {
  const auth = await requireApiUser(["student", "admin"]);
  if (auth.error) return auth.error;

  const url = new URL(request.url);
  const owner = await resolveTranscriptOwner(auth.user, {
    ownerEmail: url.searchParams.get("ownerEmail")
  });

  await deleteTranscriptData(owner.id);
  return NextResponse.json({ success: true, message: "ล้างข้อมูล transcript และผลวิเคราะห์เรียบร้อยแล้ว" });
}

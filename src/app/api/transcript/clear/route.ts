import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth/api-guard";
import { deleteTranscriptData } from "@/lib/db/repository";

export async function DELETE() {
  const auth = await requireApiUser(["student", "admin"]);
  if (auth.error) return auth.error;

  await deleteTranscriptData(auth.user.id);
  return NextResponse.json({ success: true, message: "ล้างข้อมูล transcript และผลวิเคราะห์เรียบร้อยแล้ว" });
}

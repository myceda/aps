import { NextResponse } from "next/server";
import { checkCurriculumCompleteness } from "@/lib/admin/completeness";
import { requireApiUser } from "@/lib/auth/api-guard";

export async function GET() {
  const auth = await requireApiUser(["admin"]);
  if (auth.error) return auth.error;

  return NextResponse.json({ success: true, status: await checkCurriculumCompleteness() });
}

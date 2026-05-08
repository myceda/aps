import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth/api-guard";
import { getCurriculumData } from "@/lib/db/repository";

export async function GET() {
  const auth = await requireApiUser(["admin"]);
  if (auth.error) return auth.error;

  const data = await getCurriculumData();
  return NextResponse.json({
    success: true,
    programs: data.programs,
    courses: data.courses,
    structures: data.structures,
    studyPlan: data.studyPlan,
    prerequisites: data.prerequisites
  });
}

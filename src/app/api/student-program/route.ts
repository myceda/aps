import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth/api-guard";
import { getStudentProgram, listPrograms, resolveTranscriptOwner, upsertStudentProgram } from "@/lib/db/repository";
import type { ProgramCode } from "@/lib/types";

export async function GET(request: Request) {
  const auth = await requireApiUser(["student", "admin"]);
  if (auth.error) return auth.error;

  const url = new URL(request.url);
  const owner = await resolveTranscriptOwner(auth.user, {
    ownerEmail: url.searchParams.get("ownerEmail")
  });

  const [studentProgram, programs] = await Promise.all([
    getStudentProgram(owner.id),
    listPrograms()
  ]);
  return NextResponse.json({ success: true, owner, studentProgram, programs });
}

export async function POST(request: Request) {
  const auth = await requireApiUser(["student", "admin"]);
  if (auth.error) return auth.error;

  const body = (await request.json()) as {
    programCode?: ProgramCode;
    studentCode?: string;
    track?: "research" | "coop";
    ownerEmail?: string;
    ownerName?: string;
  };

  if (!body.programCode || !body.studentCode || !body.track) {
    return NextResponse.json({ success: false, error: "programCode, studentCode and track are required" }, { status: 400 });
  }

  const owner = await resolveTranscriptOwner(auth.user, {
    ownerEmail: body.ownerEmail,
    ownerName: body.ownerName
  }, { createIfMissing: true });

  const studentProgram = await upsertStudentProgram(owner.id, {
    programCode: body.programCode,
    studentCode: body.studentCode,
    track: body.track
  });

  return NextResponse.json({ success: true, owner, studentProgram });
}

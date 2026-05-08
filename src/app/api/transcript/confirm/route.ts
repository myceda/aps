import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth/api-guard";
import { saveTranscriptPreview } from "@/lib/db/repository";
import type { TranscriptPreview } from "@/lib/types";
import { validateTranscriptPreview } from "@/lib/transcript/validator";

export async function POST(request: Request) {
  const auth = await requireApiUser(["student", "admin"]);
  if (auth.error) return auth.error;

  const body = (await request.json()) as TranscriptPreview & { uploadId?: number };
  const preview = validateTranscriptPreview(body);

  if (!preview.canConfirm) {
    return NextResponse.json({ success: false, preview, error: "Transcript preview still has validation warnings" }, { status: 400 });
  }

  const upload = await saveTranscriptPreview(auth.user.id, "confirmed-transcript.pdf", preview.courses, preview.summaries, body.uploadId);

  return NextResponse.json({
    success: true,
    uploadId: upload.id,
    savedRows: preview.courses.length,
    message: "Transcript confirmed and saved to PostgreSQL."
  });
}

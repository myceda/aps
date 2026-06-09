import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth/api-guard";
import { resolveTranscriptOwner, saveTranscriptPreview } from "@/lib/db/repository";
import type { TranscriptPreview } from "@/lib/types";
import { validateTranscriptPreview } from "@/lib/transcript/validator";

export async function POST(request: Request) {
  const auth = await requireApiUser(["student", "admin"]);
  if (auth.error) return auth.error;

  const body = (await request.json()) as TranscriptPreview & { uploadId?: number; ownerEmail?: string; ownerName?: string };
  const owner = await resolveTranscriptOwner(auth.user, body, { createIfMissing: true });
  const preview = validateTranscriptPreview(body);

  if (!preview.canConfirm) {
    return NextResponse.json({ success: false, preview, error: "Transcript preview still has blocking validation errors" }, { status: 400 });
  }

  const upload = await saveTranscriptPreview(owner.id, "confirmed-transcript.pdf", preview.courses, preview.summaries, body.uploadId);

  return NextResponse.json({
    success: true,
    uploadId: upload.id,
    savedRows: preview.courses.length,
    analysisStatus: "saved_for_reanalysis",
    message: "Transcript confirmed and saved to PostgreSQL. Dashboard analysis can be recalculated from the saved rows."
  });
}

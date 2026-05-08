import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth/api-guard";
import { createTranscriptUpload } from "@/lib/db/repository";
import { sampleTranscriptText } from "@/lib/transcript/sample-text";
import { parseTranscriptText } from "@/lib/transcript/parser";

export async function POST(request: Request) {
  const auth = await requireApiUser(["student", "admin"]);
  if (auth.error) return auth.error;

  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    const body = (await request.json()) as { text?: string };
    const preview = parseTranscriptText(body.text ?? sampleTranscriptText);
    const upload = await createTranscriptUpload(auth.user.id, "manual-transcript-text", preview.warnings.join("\n") || null);
    return NextResponse.json({ success: true, uploadId: upload.id, preview });
  }

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ success: false, error: "file is required" }, { status: 400 });
  }

  // unpdf is the intended extractor for text-based PDFs. If extraction fails,
  // the user still gets a reviewable preview response with warnings.
  try {
    const { extractText, getDocumentProxy } = await import("unpdf");
    const buffer = new Uint8Array(await file.arrayBuffer());
    const pdf = await getDocumentProxy(buffer);
    const result = await extractText(pdf, { mergePages: true });
    const text = Array.isArray(result.text) ? result.text.join("\n") : result.text;
    const preview = parseTranscriptText(text);
    const upload = await createTranscriptUpload(auth.user.id, file.name, preview.warnings.join("\n") || null);
    return NextResponse.json({ success: true, uploadId: upload.id, preview });
  } catch {
    const upload = await createTranscriptUpload(auth.user.id, file.name, "ไม่สามารถสกัดข้อความด้วย unpdf ได้");
    return NextResponse.json({
      success: true,
      uploadId: upload.id,
      preview: parseTranscriptText(""),
      warning: "ไม่สามารถสกัดข้อความด้วย unpdf ได้ ต้องให้ผู้ใช้ตรวจหรือแก้ไขด้วยตนเอง"
    });
  }
}

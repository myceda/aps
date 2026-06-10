import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth/api-guard";
import { createTranscriptUpload, resolveTranscriptOwner } from "@/lib/db/repository";
import type { TranscriptPreview } from "@/lib/types";
import { parseTranscriptText } from "@/lib/transcript/parser";
import { validateTranscriptPreview } from "@/lib/transcript/validator";

export const runtime = "nodejs";

type TranscriptPreviewResponse = {
  success: true;
  uploadId: number;
  preview: TranscriptPreview;
  intake: {
    method: "pdf-text" | "manual-text";
    status: "ready" | "needs_review" | "empty";
    message: string;
    nextActions: string[];
  };
};

export async function POST(request: Request) {
  const auth = await requireApiUser(["student", "admin"]);
  if (auth.error) return auth.error;

  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    const body = (await request.json()) as { text?: string; ownerEmail?: string; ownerName?: string };
    const owner = await resolveTranscriptOwner(auth.user, body, { createIfMissing: true });
    const preview = parseTranscriptText(body.text ?? "");
    const upload = await createTranscriptUpload(owner.id, "manual-transcript-text", preview.warnings.join("\n") || null);
    return NextResponse.json<TranscriptPreviewResponse>({
      success: true,
      uploadId: upload.id,
      preview,
      intake: buildIntakeState(preview, "manual-text")
    });
  }

  const form = await request.formData();
  const file = form.get("file");
  const owner = await resolveTranscriptOwner(auth.user, {
    ownerEmail: getFormString(form, "ownerEmail"),
    ownerName: getFormString(form, "ownerName")
  }, { createIfMissing: true });

  if (!(file instanceof File)) {
    return NextResponse.json({ success: false, error: "file is required" }, { status: 400 });
  }

  if (!isPdfFile(file)) {
    const preview = withWarning(
      parseTranscriptText(""),
      "ตอนนี้รองรับ PDF transcript ก่อน ส่วน CSV/Excel จะเพิ่มเป็นช่องทางนำเข้าในขั้นตอนถัดไป"
    );
    const upload = await createTranscriptUpload(owner.id, file.name, preview.warnings.join("\n"));
    return NextResponse.json<TranscriptPreviewResponse>({
      success: true,
      uploadId: upload.id,
      preview,
      intake: buildIntakeState(preview, "pdf-text")
    });
  }

  try {
    const pdfBytes = Buffer.from(await file.arrayBuffer());
    const text = await extractPdfText(pdfBytes);
    const preview = parseTranscriptText(text);
    const upload = await createTranscriptUpload(owner.id, file.name, preview.warnings.join("\n") || null);

    return NextResponse.json<TranscriptPreviewResponse>({
      success: true,
      uploadId: upload.id,
      preview,
      intake: buildIntakeState(preview, "pdf-text")
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown error";
    console.error("Transcript preview failed", error);

    const preview = withWarning(
      parseTranscriptText(""),
      `ระบบอ่านข้อความจาก PDF ไม่สำเร็จ (${message}) ผู้ใช้ยังสามารถเพิ่มรายวิชาด้วยตนเองก่อนบันทึกได้`
    );
    const upload = await createTranscriptUpload(owner.id, file.name, preview.warnings.join("\n"));

    return NextResponse.json<TranscriptPreviewResponse>({
      success: true,
      uploadId: upload.id,
      preview,
      intake: buildIntakeState(preview, "pdf-text")
    });
  }
}

async function extractPdfText(pdfBytes: Uint8Array) {
  const { extractText, getDocumentProxy } = await import("unpdf");
  const pdf = await getDocumentProxy(Uint8Array.from(pdfBytes));
  const result = await extractText(pdf, { mergePages: true });
  return Array.isArray(result.text) ? result.text.join("\n") : result.text;
}

function isPdfFile(file: File) {
  return file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
}

function getFormString(form: FormData, key: string) {
  const value = form.get(key);
  return typeof value === "string" ? value : undefined;
}

function withWarning(preview: TranscriptPreview, warning: string) {
  return validateTranscriptPreview({
    ...preview,
    warnings: [...preview.warnings, warning],
    canConfirm: false
  });
}

function buildIntakeState(preview: TranscriptPreview, method: "pdf-text" | "manual-text") {
  if (preview.courses.length === 0) {
    return {
      method,
      status: "empty" as const,
      message: "ยังไม่พบรายวิชาในไฟล์ แต่ยังสามารถเพิ่มรายวิชาด้วยตนเองเพื่อให้ระบบวิเคราะห์ต่อได้",
      nextActions: ["เพิ่มรายวิชาด้วยตนเอง", "ตรวจรหัสวิชา เกรด เทอม และปี", "ยืนยันและบันทึก transcript"]
    };
  }

  if (preview.warnings.length > 0 || preview.courses.some((course) => course.validationSeverity && course.validationSeverity !== "ok")) {
    return {
      method,
      status: "needs_review" as const,
      message: "อ่านรายวิชาได้แล้ว แต่มีบางแถวที่ต้องตรวจเพิ่มก่อนบันทึก",
      nextActions: ["ตรวจรายการแถวที่ต้องตรวจ", "แก้ข้อมูลในตาราง preview", "ยืนยันและบันทึก transcript"]
    };
  }

  return {
    method,
    status: "ready" as const,
    message: "อ่านรายวิชาได้และพร้อมให้ตรวจทานก่อนบันทึก",
    nextActions: ["ตรวจทานข้อมูล", "ยืนยันและบันทึก transcript"]
  };
}

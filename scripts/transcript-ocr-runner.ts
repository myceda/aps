import { readFile, writeFile } from "node:fs/promises";
import { extractStructuredTranscriptWithOcr } from "../src/lib/transcript/ocr";

async function main() {
  const [, , pdfPath, catalogPath, outputPath] = process.argv;
  if (!pdfPath || !catalogPath || !outputPath) {
    throw new Error("Usage: tsx scripts/transcript-ocr-runner.ts <pdfPath> <catalogPath> <outputPath>");
  }

  const [pdfBuffer, catalogJson] = await Promise.all([
    readFile(pdfPath),
    readFile(catalogPath, "utf-8")
  ]);
  const catalog = JSON.parse(catalogJson) as Array<{ code: string; nameTh: string; credits: number }>;
  const preview = await extractStructuredTranscriptWithOcr(new Uint8Array(pdfBuffer), catalog);
  await writeFile(outputPath, JSON.stringify(preview), "utf-8");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

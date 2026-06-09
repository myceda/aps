"use client";

import { useMemo, useState } from "react";
import type { AdminImportResource } from "@/lib/admin/import-template";

type ImportTemplateView = {
  resource: AdminImportResource;
  label: string;
  title: string;
  description: string;
  columns: string[];
};

const templates: ImportTemplateView[] = [
  {
    resource: "courses",
    label: "รายวิชา",
    title: "ข้อมูลรายวิชา",
    description: "ใช้เพิ่มรายวิชาจำนวนมากจากเอกสารหลักสูตรหรือไฟล์ Excel เดิม",
    columns: ["programCode", "code", "nameTh", "nameEn", "credits", "category", "groupName"]
  },
  {
    resource: "prerequisites",
    label: "วิชาตัวต่อ",
    title: "วิชาบังคับก่อน / วิชาตัวต่อ",
    description: "ใช้เพิ่มวิชาบังคับก่อน เพื่อให้ระบบคำนวณวิชาที่ขวางการจบได้",
    columns: ["courseCode", "prereqCourseCode", "isCorequisite", "conditionNote"]
  },
  {
    resource: "study-plans",
    label: "แผนรายเทอม",
    title: "แผนผังการเรียนรายเทอม",
    description: "ใช้เพิ่มแผนรายปี/รายเทอมสำหรับคาดการณ์วันจบและแผนผัง 8 ปี",
    columns: ["programCode", "courseCode", "yearLevel", "semester", "track", "placeholder", "credits"]
  },
  {
    resource: "offerings",
    label: "วิชาเปิดสอน",
    title: "วิชาเปิดแต่ละเทอม",
    description: "ใช้เพิ่มว่าวิชาใดเปิดในปีการศึกษาและเทอมใด",
    columns: ["courseCode", "academicYear", "semester"]
  },
  {
    resource: "rules",
    label: "กติกา",
    title: "กฎการวิเคราะห์",
    description: "ใช้เก็บกฎหรือเงื่อนไขหลักสูตรเป็นข้อมูลอ้างอิง",
    columns: ["programCode", "code", "name", "description"]
  }
];

type ImportResult = {
  success: boolean;
  created: number;
  failed: number;
  errors: string[];
  error?: string;
};

export function AdminImportPanel() {
  const [activeResource, setActiveResource] = useState<AdminImportResource>("courses");
  const [file, setFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  const activeTemplate = useMemo(
    () => templates.find((template) => template.resource === activeResource) ?? templates[0],
    [activeResource]
  );

  async function importCsv() {
    if (!file) {
      setResult({ success: false, created: 0, failed: 1, errors: ["กรุณาเลือกไฟล์ CSV ก่อนนำเข้า"] });
      return;
    }

    setIsImporting(true);
    setResult(null);

    const formData = new FormData();
    formData.append("resource", activeResource);
    formData.append("file", file);

    const response = await fetch("/api/admin/import-csv", {
      method: "POST",
      body: formData
    });
    const payload = await response.json();
    setResult(payload);
    setIsImporting(false);
  }

  return (
    <section className="surface p-5" id="admin-import">
      <div className="grid gap-4">
        <div>
          <p className="text-sm font-semibold text-sky-700">ขั้นตอนที่ 2</p>
          <h2 className="mt-1 text-xl font-bold text-ink">นำเข้าข้อมูลด้วย CSV</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            ถ้ามีข้อมูลจำนวนมาก ให้ดาวน์โหลดแม่แบบไปกรอกใน Excel แล้วนำเข้า CSV ก่อน จากนั้นค่อยไปแก้รายละเอียดรายหมวดในขั้นตอนถัดไป
          </p>
        </div>

        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="font-bold text-amber-900">อ่านก่อนนำเข้า</p>
          <p className="mt-1 text-sm leading-6 text-amber-800">
            การนำเข้าจะเพิ่มข้อมูลตามแถวใน CSV หากรหัสซ้ำหรืออ้างอิงวิชาที่ไม่มี ระบบจะแจ้งแถวที่ผิดให้แก้ในไฟล์แล้วอัปโหลดใหม่
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-5">
        {templates.map((template) => (
          <button
            className={`rounded-xl border p-3 text-left transition ${
              activeResource === template.resource
                ? "border-sky-300 bg-sky-50 text-sky-800 shadow-sm"
                : "border-line bg-white text-slate-700 hover:border-sky-200 hover:bg-sky-50/50"
            }`}
            key={template.resource}
            onClick={() => {
              setActiveResource(template.resource);
              setResult(null);
              setFile(null);
            }}
          >
            <span className="text-xs font-bold">แม่แบบ</span>
            <span className="mt-1 block font-bold">{template.title}</span>
          </button>
        ))}
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-xl border border-line bg-white p-4">
          <p className="font-bold text-ink">{activeTemplate.title}</p>
          <p className="mt-1 text-sm leading-6 text-slate-600">{activeTemplate.description}</p>

          <div className="mt-4 rounded-xl bg-mist p-3">
            <p className="text-sm font-bold text-ink">คอลัมน์ที่ต้องมี</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {activeTemplate.columns.map((column) => (
                <span className="rounded-lg border border-line bg-white px-2 py-1 text-xs font-semibold text-slate-700" key={column}>
                  {column}
                </span>
              ))}
            </div>
          </div>

          <a
            className="mt-4 inline-flex rounded-xl bg-slate-950 px-4 py-3 text-sm font-bold text-white shadow-sm hover:bg-slate-800"
            href={`/api/admin/import-template/${activeResource}`}
          >
            ดาวน์โหลดแม่แบบ CSV
          </a>
        </div>

        <div className="rounded-xl border border-line bg-white p-4">
          <p className="font-bold text-ink">อัปโหลดไฟล์ CSV ที่กรอกแล้ว</p>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            เลือกไฟล์ของแม่แบบที่ตรงกับหัวข้อด้านซ้าย ระบบจะตรวจชื่อคอลัมน์และรายงานแถวที่ผิดพลาด
          </p>

          <input
            accept=".csv,text/csv"
            className="mt-4 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm"
            type="file"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          />

          <button
            className="mt-3 rounded-xl bg-sky-600 px-4 py-3 text-sm font-bold text-white shadow-sm disabled:opacity-60"
            disabled={isImporting}
            onClick={importCsv}
          >
            {isImporting ? "กำลังนำเข้า" : "นำเข้า CSV แล้วตรวจผล"}
          </button>

          {result ? (
            <div className={`mt-4 rounded-xl border p-3 ${result.success ? "border-emerald-200 bg-emerald-50" : "border-amber-300 bg-amber-50"}`}>
              <p className={`font-bold ${result.success ? "text-emerald-700" : "text-amber-800"}`}>
                {result.success ? "นำเข้าสำเร็จ" : "นำเข้าได้บางส่วนหรือต้องแก้ไฟล์"}
              </p>
              <p className="mt-1 text-sm leading-6 text-slate-700">
                เพิ่มสำเร็จ {result.created ?? 0} แถว | ไม่สำเร็จ {result.failed ?? 0} แถว
              </p>
              {result.error ? <p className="mt-2 text-sm text-amber-800">{result.error}</p> : null}
              {result.errors?.length ? (
                <div className="mt-2 max-h-44 overflow-auto rounded-lg bg-white p-2">
                  {result.errors.map((error) => (
                    <p className="text-xs leading-5 text-amber-800" key={error}>{error}</p>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

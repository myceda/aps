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
    label: "courses",
    title: "รายวิชา",
    description: "ใช้เพิ่มรายวิชาจำนวนมากจากเอกสารหลักสูตรหรือไฟล์ Excel เดิม",
    columns: ["programCode", "code", "nameTh", "nameEn", "credits", "category", "groupName"]
  },
  {
    resource: "prerequisites",
    label: "prerequisites",
    title: "Prerequisite",
    description: "ใช้เพิ่มวิชาบังคับก่อน เพื่อให้ระบบคำนวณวิชาที่ block การจบได้",
    columns: ["courseCode", "prereqCourseCode", "isCorequisite", "conditionNote"]
  },
  {
    resource: "study-plans",
    label: "study_plan",
    title: "Study plan",
    description: "ใช้เพิ่มแผนรายปี/รายเทอมสำหรับ graduation forecast และ diagram 8 ปี",
    columns: ["programCode", "courseCode", "yearLevel", "semester", "track", "placeholder", "credits"]
  },
  {
    resource: "offerings",
    label: "course_offerings",
    title: "วิชาเปิดแต่ละเทอม",
    description: "ใช้เพิ่มว่าวิชาใดเปิดในปีการศึกษาและเทอมใด",
    columns: ["courseCode", "academicYear", "semester"]
  },
  {
    resource: "rules",
    label: "rules",
    title: "Rules",
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
    <section className="surface p-4" id="admin-import">
      <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
        <div>
          <p className="text-sm font-semibold text-teal">Import template</p>
          <h2 className="mt-1 text-lg font-bold text-ink">นำเข้าข้อมูลหลักสูตรด้วย Excel/CSV</h2>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">
            ดาวน์โหลด template ไปเปิดใน Excel กรอกข้อมูล แล้วบันทึกเป็น CSV เพื่อนำเข้าระบบ วิธีนี้เป็นเส้นทางหลักที่ควบคุมได้และตรวจสอบซ้ำได้ ส่วน PDF หลักสูตรควรใช้เป็นไฟล์อ้างอิงหรือแนบประกอบเท่านั้น
          </p>
        </div>

        <div className="rounded-md border border-amber-300 bg-amber-50 p-3">
          <p className="font-bold text-amber-800">หลักการใช้งาน</p>
          <p className="mt-1 text-sm leading-6 text-amber-800">
            Import จะเพิ่มข้อมูลตามแถวใน CSV ถ้ารหัสซ้ำหรืออ้างอิงวิชาที่ไม่มี ระบบจะแสดงแถวที่นำเข้าไม่สำเร็จให้แก้ในไฟล์แล้วอัปโหลดใหม่
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-5">
        {templates.map((template) => (
          <button
            className={`rounded-md border p-3 text-left ${activeResource === template.resource ? "border-teal bg-mist text-teal" : "border-line bg-white hover:bg-mist"}`}
            key={template.resource}
            onClick={() => {
              setActiveResource(template.resource);
              setResult(null);
              setFile(null);
            }}
          >
            <span className="text-xs font-bold">{template.label}</span>
            <span className="mt-1 block font-bold">{template.title}</span>
          </button>
        ))}
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-md border border-line bg-white p-3">
          <p className="font-bold text-ink">{activeTemplate.title}</p>
          <p className="mt-1 text-sm leading-6 text-slate-600">{activeTemplate.description}</p>

          <div className="mt-3 rounded-md bg-mist p-3">
            <p className="text-sm font-bold text-ink">Columns ที่ต้องมี</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {activeTemplate.columns.map((column) => (
                <span className="rounded-md border border-line bg-white px-2 py-1 text-xs font-semibold text-slate-700" key={column}>{column}</span>
              ))}
            </div>
          </div>

          <a
            className="mt-4 inline-flex rounded-md bg-teal px-4 py-2 text-sm font-semibold text-white"
            href={`/api/admin/import-template/${activeResource}`}
          >
            ดาวน์โหลด CSV template
          </a>
        </div>

        <div className="rounded-md border border-line bg-white p-3">
          <p className="font-bold text-ink">อัปโหลดไฟล์ CSV ที่กรอกแล้ว</p>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            เลือกไฟล์ของ template ที่ตรงกับหัวข้อด้านซ้าย ระบบจะตรวจชื่อ column และรายงานแถวที่ผิดพลาด
          </p>

          <input
            accept=".csv,text/csv"
            className="mt-4 w-full rounded-md border border-line bg-white px-3 py-2 text-sm"
            type="file"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          />

          <button
            className="mt-3 rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            disabled={isImporting}
            onClick={importCsv}
          >
            {isImporting ? "กำลังนำเข้า" : "นำเข้า CSV"}
          </button>

          {result ? (
            <div className={`mt-4 rounded-md border p-3 ${result.success ? "border-teal bg-mist" : "border-amber-300 bg-amber-50"}`}>
              <p className={`font-bold ${result.success ? "text-teal" : "text-amber-800"}`}>
                {result.success ? "นำเข้าสำเร็จ" : "นำเข้าได้บางส่วนหรือต้องแก้ไฟล์"}
              </p>
              <p className="mt-1 text-sm leading-6 text-slate-700">
                เพิ่มสำเร็จ {result.created ?? 0} แถว | ไม่สำเร็จ {result.failed ?? 0} แถว
              </p>
              {result.error ? <p className="mt-2 text-sm text-amber-800">{result.error}</p> : null}
              {result.errors?.length ? (
                <div className="mt-2 max-h-44 overflow-auto rounded-md bg-white p-2">
                  {result.errors.map((error) => <p className="text-xs leading-5 text-amber-800" key={error}>{error}</p>)}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

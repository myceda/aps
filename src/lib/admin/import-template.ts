import { createResource } from "@/lib/admin/crud";

export type AdminImportResource = "courses" | "prerequisites" | "study-plans" | "offerings" | "rules";

type ImportColumn = {
  key: string;
  label: string;
  required?: boolean;
  helper: string;
};

type ImportTemplate = {
  resource: AdminImportResource;
  label: string;
  fileName: string;
  description: string;
  columns: ImportColumn[];
  sampleRows: Record<string, string>[];
};

export const adminImportTemplates: ImportTemplate[] = [
  {
    resource: "courses",
    label: "courses",
    fileName: "aps-courses-template.csv",
    description: "นำเข้ารายวิชา รหัสวิชา หน่วยกิต หมวดวิชา และหลักสูตรที่เกี่ยวข้อง",
    columns: [
      { key: "programCode", label: "programCode", helper: "รหัสหลักสูตร เช่น CS2565 ถ้าเป็นวิชากลางให้เว้นว่าง" },
      { key: "code", label: "code", required: true, helper: "รหัสวิชา" },
      { key: "nameTh", label: "nameTh", required: true, helper: "ชื่อวิชาภาษาไทย" },
      { key: "nameEn", label: "nameEn", helper: "ชื่อวิชาภาษาอังกฤษ" },
      { key: "credits", label: "credits", required: true, helper: "จำนวนหน่วยกิต" },
      { key: "category", label: "category", required: true, helper: "หมวดวิชาให้ตรงกับโครงสร้างหลักสูตร" },
      { key: "groupName", label: "groupName", helper: "กลุ่มวิชา ถ้าไม่มีให้เว้นว่าง" }
    ],
    sampleRows: [
      { programCode: "CS2565", code: "517121", nameTh: "ทักษะการเขียนโปรแกรมคอมพิวเตอร์ 1", nameEn: "Computer Programming Skills I", credits: "4", category: "วิชาเฉพาะบังคับ", groupName: "แกน" }
    ]
  },
  {
    resource: "prerequisites",
    label: "prerequisites",
    fileName: "aps-prerequisites-template.csv",
    description: "นำเข้าความสัมพันธ์วิชาบังคับก่อนเพื่อใช้หา block chain และ what-if",
    columns: [
      { key: "courseCode", label: "courseCode", required: true, helper: "วิชาที่ต้องการปลดล็อก" },
      { key: "prereqCourseCode", label: "prereqCourseCode", required: true, helper: "วิชาบังคับก่อน" },
      { key: "isCorequisite", label: "isCorequisite", helper: "true ถ้าเรียนพร้อมกันได้ ไม่เช่นนั้นใช้ false" },
      { key: "conditionNote", label: "conditionNote", helper: "เงื่อนไขเพิ่มเติม" }
    ],
    sampleRows: [
      { courseCode: "517122", prereqCourseCode: "517121", isCorequisite: "false", conditionNote: "" }
    ]
  },
  {
    resource: "study-plans",
    label: "study_plan",
    fileName: "aps-study-plan-template.csv",
    description: "นำเข้าแผนรายปี/รายเทอมตามหลักสูตร เพื่อใช้ทำ graduation forecast และ diagram",
    columns: [
      { key: "programCode", label: "programCode", required: true, helper: "รหัสหลักสูตร" },
      { key: "courseCode", label: "courseCode", helper: "รหัสวิชา ถ้าเป็นวิชาเลือกแบบไม่ระบุรหัสให้เว้นว่าง" },
      { key: "yearLevel", label: "yearLevel", required: true, helper: "ชั้นปี เช่น 1 ถึง 8" },
      { key: "semester", label: "semester", required: true, helper: "1, 2 หรือ 3 สำหรับ Summer" },
      { key: "track", label: "track", helper: "RESEARCH, COOP หรือเว้นว่างถ้าใช้ทุก track" },
      { key: "placeholder", label: "placeholder", helper: "ข้อความแทนวิชา เช่น วิชาเลือกเฉพาะด้าน" },
      { key: "credits", label: "credits", required: true, helper: "จำนวนหน่วยกิต" }
    ],
    sampleRows: [
      { programCode: "CS2565", courseCode: "517121", yearLevel: "1", semester: "1", track: "", placeholder: "", credits: "4" }
    ]
  },
  {
    resource: "offerings",
    label: "course_offerings",
    fileName: "aps-course-offerings-template.csv",
    description: "นำเข้ารายวิชาที่เปิดในแต่ละปีการศึกษาและแต่ละเทอม",
    columns: [
      { key: "courseCode", label: "courseCode", required: true, helper: "รหัสวิชาที่เปิดสอน" },
      { key: "academicYear", label: "academicYear", required: true, helper: "ปีการศึกษา เช่น 2568" },
      { key: "semester", label: "semester", required: true, helper: "1, 2 หรือ 3 สำหรับ Summer" }
    ],
    sampleRows: [
      { courseCode: "517121", academicYear: "2568", semester: "1" }
    ]
  },
  {
    resource: "rules",
    label: "rules",
    fileName: "aps-rules-template.csv",
    description: "นำเข้าเงื่อนไขหรือกฎของหลักสูตรที่ admin ต้องการเก็บเป็นข้อมูลอ้างอิง",
    columns: [
      { key: "programCode", label: "programCode", helper: "รหัสหลักสูตร ถ้าเป็นกฎกลางให้เว้นว่าง" },
      { key: "code", label: "code", required: true, helper: "รหัสกฎ เช่น PRO_LOW" },
      { key: "name", label: "name", required: true, helper: "ชื่อกฎ" },
      { key: "description", label: "description", required: true, helper: "รายละเอียดกฎ" }
    ],
    sampleRows: [
      { programCode: "CS2565", code: "PRO_LOW", name: "เกณฑ์โปรต่ำ", description: "นักศึกษาที่ GPAX ต่ำกว่าเกณฑ์ที่มหาวิทยาลัยกำหนดต้องได้รับคำแนะนำแผนเรียน" }
    ]
  }
];

export function isAdminImportResource(value: string): value is AdminImportResource {
  return adminImportTemplates.some((template) => template.resource === value);
}

export function getImportTemplate(resource: AdminImportResource) {
  return adminImportTemplates.find((template) => template.resource === resource) ?? adminImportTemplates[0];
}

export function buildCsvTemplate(resource: AdminImportResource) {
  const template = getImportTemplate(resource);
  const headers = template.columns.map((column) => column.key);
  const lines = [
    headers.join(","),
    ...template.sampleRows.map((row) => headers.map((header) => escapeCsv(row[header] ?? "")).join(","))
  ];
  return `\uFEFF${lines.join("\r\n")}\r\n`;
}

export async function importAdminCsv(resource: AdminImportResource, csvText: string) {
  const template = getImportTemplate(resource);
  const rows = parseCsv(csvText);
  const headerIssues = validateHeaders(template, rows.headers);
  if (headerIssues.length > 0) {
    return {
      success: false,
      created: 0,
      failed: headerIssues.length,
      errors: headerIssues
    };
  }

  let created = 0;
  const errors: string[] = [];

  for (const [index, row] of rows.records.entries()) {
    const lineNumber = index + 2;
    const missing = template.columns
      .filter((column) => column.required && !row[column.key]?.trim())
      .map((column) => column.key);

    if (missing.length > 0) {
      errors.push(`แถว ${lineNumber}: ขาดข้อมูล ${missing.join(", ")}`);
      continue;
    }

    try {
      await createResource(resource, mapCsvRow(resource, row));
      created += 1;
    } catch (error) {
      errors.push(`แถว ${lineNumber}: ${error instanceof Error ? error.message : "นำเข้าไม่สำเร็จ"}`);
    }
  }

  return {
    success: errors.length === 0,
    created,
    failed: errors.length,
    errors
  };
}

function validateHeaders(template: ImportTemplate, headers: string[]) {
  const errors: string[] = [];
  const headerSet = new Set(headers);
  for (const column of template.columns) {
    if (!headerSet.has(column.key)) {
      errors.push(`ไม่พบ column ${column.key} ในไฟล์ ${template.label}`);
    }
  }
  return errors;
}

function mapCsvRow(resource: AdminImportResource, row: Record<string, string>) {
  if (resource === "courses") {
    return {
      programCode: clean(row.programCode),
      code: clean(row.code),
      nameTh: clean(row.nameTh),
      nameEn: clean(row.nameEn),
      credits: toNumber(row.credits),
      category: clean(row.category),
      groupName: clean(row.groupName)
    };
  }

  if (resource === "prerequisites") {
    return {
      courseCode: clean(row.courseCode),
      prereqCourseCode: clean(row.prereqCourseCode),
      isCorequisite: toBoolean(row.isCorequisite),
      conditionNote: clean(row.conditionNote)
    };
  }

  if (resource === "study-plans") {
    return {
      programCode: clean(row.programCode),
      courseCode: clean(row.courseCode),
      yearLevel: toNumber(row.yearLevel),
      semester: toNumber(row.semester),
      track: clean(row.track),
      placeholder: clean(row.placeholder),
      credits: toNumber(row.credits)
    };
  }

  if (resource === "offerings") {
    return {
      courseCode: clean(row.courseCode),
      academicYear: toNumber(row.academicYear),
      semester: toNumber(row.semester)
    };
  }

  return {
    programCode: clean(row.programCode),
    code: clean(row.code),
    name: clean(row.name),
    description: clean(row.description)
  };
}

function parseCsv(text: string) {
  const rows: string[][] = [];
  let current = "";
  let row: string[] = [];
  let inQuotes = false;
  const input = text.replace(/^\uFEFF/, "");

  for (let index = 0; index < input.length; index += 1) {
    const char = input[index];
    const next = input[index + 1];

    if (char === "\"" && inQuotes && next === "\"") {
      current += "\"";
      index += 1;
      continue;
    }

    if (char === "\"") {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === "," && !inQuotes) {
      row.push(current);
      current = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(current);
      rows.push(row);
      row = [];
      current = "";
      continue;
    }

    current += char;
  }

  if (current || row.length > 0) {
    row.push(current);
    rows.push(row);
  }

  const nonEmptyRows = rows.filter((item) => item.some((cell) => cell.trim()));
  const headers = (nonEmptyRows[0] ?? []).map((header) => header.trim());
  const records = nonEmptyRows.slice(1).map((cells) => {
    const record: Record<string, string> = {};
    headers.forEach((header, index) => {
      record[header] = cells[index]?.trim() ?? "";
    });
    return record;
  });

  return { headers, records };
}

function escapeCsv(value: string) {
  if (!/[",\r\n]/.test(value)) return value;
  return `"${value.replaceAll("\"", "\"\"")}"`;
}

function clean(value: string | undefined) {
  return value?.trim() ?? "";
}

function toNumber(value: string | undefined) {
  const number = Number(value);
  return Number.isFinite(number) ? number : value;
}

function toBoolean(value: string | undefined) {
  return ["true", "1", "yes", "y"].includes((value ?? "").trim().toLowerCase());
}

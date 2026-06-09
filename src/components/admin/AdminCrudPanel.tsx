"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

export type ResourceKey = "programs" | "structures" | "courses" | "prerequisites" | "study-plans" | "offerings";
type FormState = Record<string, string | number | boolean>;

type ProgramItem = {
  id: number;
  code: string;
  nameTh: string;
  nameEn: string;
  academicYear: number;
  totalCreditsMin: number;
  honorFirstClassMin: string | number;
  honorSecondClassMin: string | number;
};

type ProgramStructureItem = {
  id: number;
  category: string;
  minCredits: number;
  description?: string | null;
  program: ProgramItem;
};

type CourseItem = {
  id: number;
  code: string;
  nameTh: string;
  nameEn?: string | null;
  credits: number;
  category: string;
  groupName?: string | null;
  program?: { code: string } | null;
};

type PrerequisiteItem = {
  id: number;
  isCorequisite: boolean;
  conditionNote?: string | null;
  course: CourseItem;
  prereqCourse: CourseItem;
};

type StudyPlanItem = {
  id: number;
  yearLevel: number;
  semester: number;
  track?: "RESEARCH" | "COOP" | null;
  placeholder?: string | null;
  credits: number;
  program: ProgramItem;
  course?: CourseItem | null;
};

type OfferingItem = {
  id: number;
  academicYear: number;
  semester: number;
  isSummer: boolean;
  course: CourseItem;
};

type AdminItem = ProgramItem | ProgramStructureItem | CourseItem | PrerequisiteItem | StudyPlanItem | OfferingItem;

type SelectOption = { key?: string; value: string | number; label: string };

type FieldConfig = {
  name: string;
  label: string;
  type?: "text" | "number" | "select" | "checkbox";
  required?: boolean;
  helper?: string;
  options?: (state: AdminData) => SelectOption[];
};

type ResourceConfig = {
  key: ResourceKey;
  step: string;
  label: string;
  title: string;
  goal: string;
  description: string;
  checklist: string[];
  defaults: FormState;
  fields: FieldConfig[];
};

type AdminData = Record<ResourceKey, AdminItem[]>;

const emptyData: AdminData = {
  programs: [],
  structures: [],
  courses: [],
  prerequisites: [],
  "study-plans": [],
  offerings: []
};

const semesterOptions = [
  { key: "semester-1", value: 1, label: "เทอม 1" },
  { key: "semester-2", value: 2, label: "เทอม 2" },
  { key: "semester-3", value: 3, label: "เทอม 3 / ภาคฤดูร้อน" }
];

const trackOptions = [
  { key: "track-all", value: "", label: "ทุกกลุ่มแผนการเรียน" },
  { key: "track-research", value: "RESEARCH", label: "กลุ่มวิจัย" },
  { key: "track-coop", value: "COOP", label: "กลุ่มสหกิจศึกษา" }
];

const resourceConfigs: ResourceConfig[] = [
  {
    key: "programs",
    step: "3",
    label: "หลักสูตร",
    title: "จัดการหลักสูตร",
    goal: "สร้างเวอร์ชันหลักสูตรที่ระบบใช้เป็นฐานวิเคราะห์",
    description: "กำหนดชื่อหลักสูตร ปีหลักสูตร หน่วยกิตขั้นต่ำ และเกณฑ์ GPAX เพื่อให้ระบบรู้ว่านักศึกษาต้องเรียนครบเท่าไร",
    checklist: ["มีรหัสหลักสูตร เช่น CS2565 หรือ IT2565", "มีปีหลักสูตรและหน่วยกิตรวมขั้นต่ำ", "มีเกณฑ์ GPAX สำหรับสถานะและเกียรตินิยม"],
    defaults: {
      code: "",
      nameTh: "",
      nameEn: "",
      academicYear: 2568,
      totalCreditsMin: 126,
      honorFirstClassMin: 3.6,
      honorSecondClassMin: 3.25
    },
    fields: [
      { name: "code", label: "รหัสหลักสูตร", required: true, helper: "เช่น CS2565 หรือ IT2565" },
      { name: "nameTh", label: "ชื่อหลักสูตรภาษาไทย", required: true },
      { name: "nameEn", label: "ชื่อหลักสูตรภาษาอังกฤษ", required: true },
      { name: "academicYear", label: "ปีหลักสูตร", type: "number", required: true },
      { name: "totalCreditsMin", label: "หน่วยกิตขั้นต่ำ", type: "number", required: true },
      { name: "honorFirstClassMin", label: "GPAX เกียรตินิยมอันดับหนึ่ง", type: "number", required: true },
      { name: "honorSecondClassMin", label: "GPAX เกียรตินิยมอันดับสอง", type: "number", required: true }
    ]
  },
  {
    key: "structures",
    step: "3.2",
    label: "โครงสร้างหลักสูตร",
    title: "จัดการหมวดวิชาและหน่วยกิตขั้นต่ำ",
    goal: "บอกระบบว่าหลักสูตรต้องครบหมวดใดบ้าง",
    description: "ใช้ตรวจว่านักศึกษาเรียนครบหมวดวิชาและหน่วยกิตขั้นต่ำตามหลักสูตรหรือยัง",
    checklist: ["เลือกหลักสูตรให้ถูกต้อง", "ระบุชื่อหมวดวิชาให้ตรงกับเอกสารหลักสูตร", "ใส่หน่วยกิตขั้นต่ำของหมวดนั้น"],
    defaults: {
      programCode: "",
      category: "",
      minCredits: 0,
      description: ""
    },
    fields: [
      { name: "programCode", label: "หลักสูตร", type: "select", required: true, options: programOptions },
      { name: "category", label: "หมวดวิชา", required: true, helper: "เช่น วิชาเฉพาะบังคับ, วิชาเลือก, ศึกษาทั่วไป" },
      { name: "minCredits", label: "หน่วยกิตขั้นต่ำของหมวดนี้", type: "number", required: true },
      { name: "description", label: "คำอธิบายเพิ่มเติม" }
    ]
  },
  {
    key: "courses",
    step: "4",
    label: "รายวิชา",
    title: "จัดการรายวิชา",
    goal: "สร้างคลังรายวิชาที่ข้อมูลผลการเรียนและแผนเรียนจะนำไปเทียบ",
    description: "เพิ่มรหัสวิชา ชื่อวิชา หน่วยกิต หมวดวิชา และหลักสูตรที่เกี่ยวข้อง รายวิชากลางสามารถเว้นหลักสูตรว่างได้",
    checklist: ["รหัสวิชาตรงกับข้อมูลผลการเรียนและเอกสารหลักสูตร", "หน่วยกิตถูกต้อง", "หมวดวิชาตรงกับโครงสร้างหลักสูตร"],
    defaults: {
      programCode: "",
      code: "",
      nameTh: "",
      nameEn: "",
      credits: 3,
      category: "",
      groupName: ""
    },
    fields: [
      { name: "programCode", label: "หลักสูตร", type: "select", options: programOptions, helper: "เว้นว่างได้ถ้าเป็นวิชากลาง" },
      { name: "code", label: "รหัสวิชา", required: true },
      { name: "nameTh", label: "ชื่อวิชาภาษาไทย", required: true },
      { name: "nameEn", label: "ชื่อวิชาภาษาอังกฤษ" },
      { name: "credits", label: "หน่วยกิต", type: "number", required: true },
      { name: "category", label: "หมวดวิชา", required: true },
      { name: "groupName", label: "กลุ่มวิชา" }
    ]
  },
  {
    key: "prerequisites",
    step: "5",
    label: "วิชาบังคับก่อน / วิชาตัวต่อ",
    title: "จัดการวิชาบังคับก่อน / วิชาตัวต่อ",
    goal: "บอกระบบว่าวิชาใดต้องผ่านก่อน จึงจะลงวิชาต่อได้",
    description: "ข้อมูลนี้ใช้หาลำดับวิชาตัวต่อ ระบบจำลองสถานการณ์เรียน และคาดการณ์วันจบ",
    checklist: ["เลือกวิชาที่ต้องการปลดล็อก", "เลือกวิชาบังคับก่อนให้ถูก", "ระบุ corequisite ถ้าสามารถเรียนพร้อมกันได้"],
    defaults: {
      courseCode: "",
      prereqCourseCode: "",
      isCorequisite: false,
      conditionNote: ""
    },
    fields: [
      { name: "courseCode", label: "วิชาที่ต้องการปลดล็อก", type: "select", required: true, options: courseOptions },
      { name: "prereqCourseCode", label: "วิชาบังคับก่อน", type: "select", required: true, options: courseOptions },
      { name: "isCorequisite", label: "เรียนพร้อมกันได้", type: "checkbox" },
      { name: "conditionNote", label: "เงื่อนไขเพิ่มเติม" }
    ]
  },
  {
    key: "study-plans",
    step: "6",
    label: "แผนผังการเรียนรายเทอม",
    title: "จัดการแผนผังการเรียนรายปี/รายเทอม",
    goal: "วางรายวิชาตามปีและเทอม เพื่อใช้สร้างแผนจบและแผนผัง 8 ปี",
    description: "ถ้ายังไม่รู้รหัสวิชาแน่ชัด สามารถใช้ข้อความแทนเพื่อแสดงหมวดวิชาหรือวิชาเลือกได้",
    checklist: ["เลือกหลักสูตร", "ระบุชั้นปีและเทอม", "เลือกวิชาหรือกรอกข้อความแทน", "ใส่หน่วยกิตเพื่อให้แผนรวมถูกต้อง"],
    defaults: {
      programCode: "",
      courseCode: "",
      yearLevel: 1,
      semester: 1,
      track: "",
      placeholder: "",
      credits: 3
    },
    fields: [
      { name: "programCode", label: "หลักสูตร", type: "select", required: true, options: programOptions },
      { name: "courseCode", label: "รายวิชา", type: "select", options: courseOptions, helper: "เลือกวิชาหรือใช้ช่องข้อความแทนได้" },
      { name: "yearLevel", label: "ชั้นปี", type: "number", required: true },
      { name: "semester", label: "ภาคการศึกษา", type: "select", required: true, options: () => semesterOptions },
      { name: "track", label: "กลุ่มแผนการเรียน", type: "select", options: () => trackOptions },
      { name: "placeholder", label: "ข้อความแทนรายวิชา", helper: "เช่น วิชาเลือกเฉพาะด้าน 3 หน่วยกิต" },
      { name: "credits", label: "หน่วยกิต", type: "number", required: true }
    ]
  },
  {
    key: "offerings",
    step: "7",
    label: "วิชาเปิดแต่ละเทอม",
    title: "จัดการวิชาเปิดแต่ละเทอม",
    goal: "บอกระบบว่าวิชาใดเปิดในเทอมใด เพื่อคาดการณ์วันจบได้ใกล้ความจริง",
    description: "รองรับเทอม 1, เทอม 2 และเทอม 3 หรือภาคฤดูร้อน ไม่จำกัดเฉพาะภาคฤดูร้อน",
    checklist: ["เลือกวิชาที่เปิดสอน", "ระบุปีการศึกษา", "เลือกเทอม 1, 2 หรือ 3/ภาคฤดูร้อน"],
    defaults: {
      courseCode: "",
      academicYear: 2568,
      semester: 1
    },
    fields: [
      { name: "courseCode", label: "รายวิชา", type: "select", required: true, options: courseOptions },
      { name: "academicYear", label: "ปีการศึกษา", type: "number", required: true },
      { name: "semester", label: "ภาคการศึกษา", type: "select", required: true, options: () => semesterOptions }
    ]
  }
];

function programOptions(data: AdminData): SelectOption[] {
  return [
    { key: "program-empty", value: "", label: "เลือกหลักสูตร" },
    ...data.programs.map((program) => {
      const item = program as ProgramItem;
      return { key: `program-${item.id}`, value: item.code, label: `${item.code} ${item.nameTh}` };
    })
  ];
}

function courseOptions(data: AdminData): SelectOption[] {
  return [
    { key: "course-empty", value: "", label: "เลือกรายวิชา" },
    ...data.courses.map((course) => {
      const item = course as CourseItem;
      const programLabel = item.program?.code ?? "วิชากลาง";
      return { key: `course-${item.id}`, value: item.code, label: `${item.code} ${item.nameTh} (${programLabel})` };
    })
  ];
}

type AdminCrudPanelProps = {
  activeResource?: ResourceKey;
  showResourceTabs?: boolean;
};

export function AdminCrudPanel({ activeResource, showResourceTabs = true }: AdminCrudPanelProps = {}) {
  const [activeKey, setActiveKey] = useState<ResourceKey>(activeResource ?? "programs");
  const [data, setData] = useState<AdminData>(emptyData);
  const [form, setForm] = useState<FormState>(resourceConfigs[0].defaults);
  const [editId, setEditId] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [searchText, setSearchText] = useState("");

  const activeConfig = useMemo(
    () => resourceConfigs.find((config) => config.key === activeKey) ?? resourceConfigs[0],
    [activeKey]
  );

  const switchResource = useCallback((key: ResourceKey) => {
    const config = resourceConfigs.find((item) => item.key === key) ?? resourceConfigs[0];
    setActiveKey(key);
    setForm(config.defaults);
    setEditId(null);
    setMessage("");
    setSearchText("");
  }, []);

  useEffect(() => {
    if (activeResource && activeResource !== activeKey) {
      switchResource(activeResource);
    }
  }, [activeKey, activeResource, switchResource]);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const entries = await Promise.all(resourceConfigs.map(async (config) => {
        const response = await fetch(`/api/admin/${config.key}`);
        const payload = await response.json();
        return [config.key, payload.items ?? []] as const;
      }));
      setData(Object.fromEntries(entries) as AdminData);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const activeItems = data[activeKey];
  const filteredItems = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    if (!query) return activeItems;
    return activeItems.filter((item) => {
      const text = `${getItemTitle(activeKey, item)} ${getItemDescription(activeKey, item)}`.toLowerCase();
      return text.includes(query);
    });
  }, [activeItems, activeKey, searchText]);

  function updateField(name: string, value: string | number | boolean) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function submit() {
    setIsLoading(true);
    setMessage("");
    const endpoint = editId ? `/api/admin/${activeKey}/${editId}` : `/api/admin/${activeKey}`;
    const response = await fetch(endpoint, {
      method: editId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });
    const payload = await response.json();
    setMessage(payload.success ? "บันทึกข้อมูลสำเร็จ" : payload.error ?? "บันทึกข้อมูลไม่สำเร็จ");
    setIsLoading(false);

    if (payload.success) {
      resetForm();
      await loadData();
    }
  }

  async function remove(id: number) {
    setIsLoading(true);
    setMessage("");
    const response = await fetch(`/api/admin/${activeKey}/${id}`, { method: "DELETE" });
    const payload = await response.json();
    setMessage(payload.success ? "ลบข้อมูลสำเร็จ" : payload.error ?? "ลบข้อมูลไม่สำเร็จ");
    setIsLoading(false);

    if (payload.success) {
      await loadData();
    }
  }

  function resetForm() {
    setForm(activeConfig.defaults);
    setEditId(null);
  }

  function startEdit(item: AdminItem) {
    setForm(toFormState(activeKey, item));
    setEditId(item.id);
    setMessage("");
  }

  return (
    <section className="surface p-5" id="admin-management">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-sky-700">ขั้นตอนที่ {activeConfig.step}</p>
          <h2 className="mt-1 text-xl font-bold text-ink">{activeConfig.title}</h2>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">
            กรอกข้อมูลที่จำเป็นในฟอร์มด้านซ้าย แล้วตรวจรายการที่มีอยู่ด้านขวา ข้อมูลส่วนนี้จะถูกใช้คำนวณ dashboard นักศึกษา
          </p>
        </div>
        <button className="rounded-xl border border-line bg-white px-3 py-2 text-sm font-semibold disabled:opacity-60" disabled={isLoading} onClick={loadData}>
          โหลดข้อมูลใหม่
        </button>
      </div>

      {showResourceTabs ? (
        <div className="mt-4 grid gap-2 md:grid-cols-3 xl:grid-cols-6">
          {resourceConfigs.map((config) => (
            <button
              className={`rounded-xl border px-3 py-2 text-left text-sm ${activeKey === config.key ? "border-sky-300 bg-sky-50 text-sky-700" : "border-line bg-white hover:bg-mist"}`}
              key={config.key}
              onClick={() => switchResource(config.key)}
              type="button"
            >
              <span className="block text-xs font-bold">ขั้นตอน {config.step}</span>
              <span className="mt-1 block font-bold">{config.label}</span>
            </button>
          ))}
        </div>
      ) : null}

      <div className="mt-4 grid gap-3 rounded-2xl border border-line bg-mist p-4 lg:grid-cols-[1fr_320px]">
        <div>
          <p className="text-sm font-bold text-sky-700">เป้าหมายของขั้นตอนนี้</p>
          <p className="mt-1 font-bold text-ink">{activeConfig.goal}</p>
          <p className="mt-1 text-sm leading-6 text-slate-600">{activeConfig.description}</p>
        </div>
        <div className="rounded-xl bg-white p-3">
          <p className="text-sm font-bold text-ink">Checklist ก่อนบันทึก</p>
          <div className="mt-2 grid gap-1">
            {activeConfig.checklist.map((item) => (
              <p className="text-xs leading-5 text-slate-600" key={item}>{item}</p>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-2xl border border-line bg-white p-4 shadow-sm">
          <div>
            <h3 className="font-bold text-ink">ฟอร์มสำหรับเพิ่มหรือแก้ข้อมูล</h3>
            <p className="mt-1 text-sm leading-6 text-slate-600">กรอกช่องที่มี * ให้ครบก่อนบันทึก</p>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {activeConfig.fields.map((field) => (
              <FieldInput
                data={data}
                field={field}
                key={field.name}
                value={form[field.name]}
                onChange={(value) => updateField(field.name, value)}
              />
            ))}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button className="rounded-xl bg-sky-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-sky-700 disabled:opacity-60" disabled={isLoading} onClick={submit}>
              {editId ? "บันทึกการแก้ไข" : "เพิ่มรายการนี้"}
            </button>
            {editId ? (
              <button className="rounded-xl border border-line px-4 py-2 text-sm font-semibold" onClick={resetForm}>
                ยกเลิกแก้ไข
              </button>
            ) : null}
          </div>

          {message ? <p className="mt-3 rounded-md border border-line bg-mist p-3 text-sm text-slate-700">{message}</p> : null}
        </div>

        <div className="rounded-2xl border border-line bg-white">
          <div className="grid gap-3 border-b border-line bg-mist px-3 py-2 md:grid-cols-[1fr_220px]">
            <div>
              <p className="font-semibold text-ink">ข้อมูลที่มีอยู่ในขั้นตอนนี้</p>
              <p className="text-sm text-slate-500">แสดง {filteredItems.length}/{activeItems.length} รายการ</p>
            </div>
            <input
              className="rounded-md border border-line px-3 py-2 text-sm"
              placeholder="ค้นหา"
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
            />
          </div>
          <div className="max-h-[560px] overflow-auto p-3">
            {filteredItems.length === 0 ? (
              <p className="rounded-xl bg-white p-3 text-sm text-slate-500">ยังไม่มีข้อมูลในขั้นตอนนี้ ให้เริ่มจากฟอร์มด้านซ้ายหรือ import CSV</p>
            ) : (
              <div className="grid gap-2">
                {filteredItems.map((item) => (
                  <AdminListRow
                    item={item}
                    key={`${activeKey}-${item.id}`}
                    resource={activeKey}
                    onEdit={() => startEdit(item)}
                    onRemove={() => remove(item.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function FieldInput({
  data,
  field,
  value,
  onChange
}: {
  data: AdminData;
  field: FieldConfig;
  value: string | number | boolean | undefined;
  onChange: (value: string | number | boolean) => void;
}) {
  if (field.type === "checkbox") {
    return (
      <label className="flex items-center gap-2 rounded-md border border-line px-3 py-2 text-sm font-semibold">
        <input checked={Boolean(value)} type="checkbox" onChange={(event) => onChange(event.target.checked)} />
        {field.label}
      </label>
    );
  }

  if (field.type === "select") {
    return (
      <label className="text-sm font-semibold">
        {field.label}{field.required ? " *" : ""}
        <select className="mt-2 w-full rounded-md border border-line px-3 py-2" value={String(value ?? "")} onChange={(event) => onChange(event.target.value)}>
          {field.options?.(data).map((option) => (
            <option key={option.key ?? `${field.name}-${String(option.value)}`} value={option.value}>{option.label}</option>
          ))}
        </select>
        {field.helper ? <span className="mt-1 block text-xs font-normal text-slate-500">{field.helper}</span> : null}
      </label>
    );
  }

  return (
    <label className="text-sm font-semibold">
      {field.label}{field.required ? " *" : ""}
      <input
        className="mt-2 w-full rounded-md border border-line px-3 py-2"
        type={field.type ?? "text"}
        value={String(value ?? "")}
        onChange={(event) => onChange(field.type === "number" ? Number(event.target.value) : event.target.value)}
      />
      {field.helper ? <span className="mt-1 block text-xs font-normal text-slate-500">{field.helper}</span> : null}
    </label>
  );
}

function AdminListRow({
  item,
  resource,
  onEdit,
  onRemove
}: {
  item: AdminItem;
  resource: ResourceKey;
  onEdit: () => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-line bg-white p-3">
      <div>
        <p className="font-semibold text-ink">{getItemTitle(resource, item)}</p>
        <p className="mt-1 text-sm leading-6 text-slate-600">{getItemDescription(resource, item)}</p>
      </div>
      <div className="flex gap-2">
        <button className="rounded-md border border-line px-3 py-2 text-sm font-semibold" onClick={onEdit}>
          แก้ไข
        </button>
        <button className="rounded-md border border-coral px-3 py-2 text-sm font-semibold text-coral" onClick={onRemove}>
          ลบ
        </button>
      </div>
    </div>
  );
}

function toFormState(resource: ResourceKey, item: AdminItem): FormState {
  if (resource === "programs") {
    const program = item as ProgramItem;
    return {
      code: program.code,
      nameTh: program.nameTh,
      nameEn: program.nameEn,
      academicYear: program.academicYear,
      totalCreditsMin: program.totalCreditsMin,
      honorFirstClassMin: Number(program.honorFirstClassMin),
      honorSecondClassMin: Number(program.honorSecondClassMin)
    };
  }

  if (resource === "structures") {
    const structure = item as ProgramStructureItem;
    return {
      programCode: structure.program.code,
      category: structure.category,
      minCredits: structure.minCredits,
      description: structure.description ?? ""
    };
  }

  if (resource === "courses") {
    const course = item as CourseItem;
    return {
      programCode: course.program?.code ?? "",
      code: course.code,
      nameTh: course.nameTh,
      nameEn: course.nameEn ?? "",
      credits: course.credits,
      category: course.category,
      groupName: course.groupName ?? ""
    };
  }

  if (resource === "prerequisites") {
    const prerequisite = item as PrerequisiteItem;
    return {
      courseCode: prerequisite.course.code,
      prereqCourseCode: prerequisite.prereqCourse.code,
      isCorequisite: prerequisite.isCorequisite,
      conditionNote: prerequisite.conditionNote ?? ""
    };
  }

  if (resource === "study-plans") {
    const plan = item as StudyPlanItem;
    return {
      programCode: plan.program.code,
      courseCode: plan.course?.code ?? "",
      yearLevel: plan.yearLevel,
      semester: plan.semester,
      track: plan.track ?? "",
      placeholder: plan.placeholder ?? "",
      credits: plan.credits
    };
  }

  const offering = item as OfferingItem;
  return {
    courseCode: offering.course.code,
    academicYear: offering.academicYear,
    semester: offering.semester
  };
}

function getItemTitle(resource: ResourceKey, item: AdminItem) {
  if (resource === "programs") {
    const program = item as ProgramItem;
    return `${program.code} ${program.nameTh}`;
  }
  if (resource === "structures") {
    const structure = item as ProgramStructureItem;
    return `${structure.program.code} ${structure.category}`;
  }
  if (resource === "courses") {
    const course = item as CourseItem;
    return `${course.code} ${course.nameTh}`;
  }
  if (resource === "prerequisites") {
    const prerequisite = item as PrerequisiteItem;
    return `${prerequisite.course.code} ต้องผ่าน ${prerequisite.prereqCourse.code}`;
  }
  if (resource === "study-plans") {
    const plan = item as StudyPlanItem;
    return plan.course ? `${plan.course.code} ${plan.course.nameTh}` : plan.placeholder ?? "แถววางแผนแบบข้อความ";
  }
  const offering = item as OfferingItem;
  return `${offering.course.code} ${offering.course.nameTh}`;
}

function getItemDescription(resource: ResourceKey, item: AdminItem) {
  if (resource === "programs") {
    const program = item as ProgramItem;
    return `ปีหลักสูตร ${program.academicYear} | ขั้นต่ำ ${program.totalCreditsMin} หน่วยกิต`;
  }
  if (resource === "structures") {
    const structure = item as ProgramStructureItem;
    return `${structure.minCredits} หน่วยกิตขั้นต่ำ${structure.description ? ` | ${structure.description}` : ""}`;
  }
  if (resource === "courses") {
    const course = item as CourseItem;
    return `${course.program?.code ?? "วิชากลาง"} | ${course.credits} หน่วยกิต | ${course.category}`;
  }
  if (resource === "prerequisites") {
    const prerequisite = item as PrerequisiteItem;
    return `${prerequisite.isCorequisite ? "เรียนพร้อมกันได้" : "ต้องผ่านก่อน"}${prerequisite.conditionNote ? ` | ${prerequisite.conditionNote}` : ""}`;
  }
  if (resource === "study-plans") {
    const plan = item as StudyPlanItem;
    return `${plan.program.code} | ชั้นปี ${plan.yearLevel} | ${formatSemester(plan.semester)} | ${formatTrack(plan.track)} | ${plan.credits} หน่วยกิต`;
  }
  const offering = item as OfferingItem;
  return `ปีการศึกษา ${offering.academicYear} | ${formatSemester(offering.semester)}`;
}

function formatSemester(semester: number) {
  return semester === 3 ? "เทอม 3 / ภาคฤดูร้อน" : `เทอม ${semester}`;
}

function formatTrack(track?: string | null) {
  if (track === "RESEARCH") return "กลุ่มวิจัย";
  if (track === "COOP") return "กลุ่มสหกิจศึกษา";
  return "ทุกกลุ่มแผนการเรียน";
}

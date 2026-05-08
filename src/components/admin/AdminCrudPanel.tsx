"use client";

import { useEffect, useMemo, useState } from "react";

const resources = [
  "programs",
  "courses",
  "structures",
  "study-plans",
  "prerequisites",
  "rules",
  "offerings"
];

const examples: Record<string, string> = {
  programs: JSON.stringify({ code: "CS2570", nameTh: "หลักสูตรใหม่", nameEn: "New Program", academicYear: 2570, totalCreditsMin: 126, honorFirstClassMin: 3.6, honorSecondClassMin: 3.25 }, null, 2),
  courses: JSON.stringify({ programCode: "IT2565", code: "520999", nameTh: "รายวิชาตัวอย่าง", credits: 3, category: "วิชาเลือก" }, null, 2),
  structures: JSON.stringify({ programCode: "IT2565", category: "วิชาเลือกเสรี", minCredits: 6 }, null, 2),
  "study-plans": JSON.stringify({ programCode: "IT2565", courseCode: "520221", yearLevel: 2, semester: 1, track: "research", credits: 3 }, null, 2),
  prerequisites: JSON.stringify({ courseCode: "520221", prereqCourseCode: "520101", isCorequisite: false }, null, 2),
  rules: JSON.stringify({ programCode: "CS2565", code: "HONOR_2", name: "เกียรตินิยมอันดับสอง", description: "GPAX ขั้นต่ำ 3.25 และเป็นไปตามเงื่อนไขมหาวิทยาลัย" }, null, 2),
  offerings: JSON.stringify({ courseCode: "517261", academicYear: 2567, semester: 3, isSummer: true }, null, 2)
};

export function AdminCrudPanel() {
  const [resource, setResource] = useState(resources[0]);
  const [items, setItems] = useState<unknown[]>([]);
  const [payload, setPayload] = useState(examples[resources[0]]);
  const [editId, setEditId] = useState("");
  const [message, setMessage] = useState("");

  const endpoint = useMemo(() => `/api/admin/${resource}`, [resource]);

  useEffect(() => {
    setPayload(examples[resource]);
    setEditId("");
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resource]);

  async function load() {
    const response = await fetch(endpoint);
    const data = await response.json();
    setItems(data.items ?? []);
    setMessage(data.success ? "" : data.error ?? "โหลดข้อมูลไม่สำเร็จ");
  }

  async function submit(method: "POST" | "PUT") {
    setMessage("");
    const url = method === "PUT" ? `${endpoint}/${editId}` : endpoint;
    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: payload
    });
    const data = await response.json();
    setMessage(data.success ? "บันทึกสำเร็จ" : data.error ?? "บันทึกไม่สำเร็จ");
    await load();
  }

  async function remove() {
    if (!editId) {
      setMessage("กรุณาใส่ id ที่ต้องการลบ");
      return;
    }

    const response = await fetch(`${endpoint}/${editId}`, { method: "DELETE" });
    const data = await response.json();
    setMessage(data.success ? "ลบสำเร็จ" : data.error ?? "ลบไม่สำเร็จ");
    await load();
  }

  return (
    <section className="surface p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold">CRUD ข้อมูลหลักสูตรแบบถาวร</h2>
          <p className="mt-1 text-sm text-slate-600">ทุก action เขียนลง PostgreSQL ผ่าน API admin</p>
        </div>
        <select className="rounded-md border border-line px-3 py-2 text-sm font-semibold" value={resource} onChange={(event) => setResource(event.target.value)}>
          {resources.map((item) => <option key={item}>{item}</option>)}
        </select>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="grid gap-3">
          <label className="text-sm font-semibold">
            JSON payload
            <textarea className="mt-2 h-56 w-full rounded-md border border-line p-3 font-mono text-xs" value={payload} onChange={(event) => setPayload(event.target.value)} />
          </label>
          <label className="text-sm font-semibold">
            ID สำหรับแก้ไข/ลบ
            <input className="mt-2 w-full rounded-md border border-line px-3 py-2" value={editId} onChange={(event) => setEditId(event.target.value)} />
          </label>
          <div className="flex flex-wrap gap-2">
            <button className="rounded-md bg-teal px-4 py-2 text-sm font-semibold text-white" onClick={() => submit("POST")}>Create</button>
            <button className="rounded-md border border-line px-4 py-2 text-sm font-semibold" onClick={() => submit("PUT")}>Update</button>
            <button className="rounded-md border border-coral px-4 py-2 text-sm font-semibold text-coral" onClick={remove}>Delete</button>
            <button className="rounded-md border border-line px-4 py-2 text-sm font-semibold" onClick={load}>Refresh</button>
          </div>
          {message ? <p className="rounded-md border border-line bg-mist p-3 text-sm">{message}</p> : null}
        </div>

        <div className="max-h-96 overflow-auto rounded-md border border-line bg-slate-950 p-3">
          <pre className="whitespace-pre-wrap text-xs leading-5 text-slate-100">{JSON.stringify(items, null, 2)}</pre>
        </div>
      </div>
    </section>
  );
}

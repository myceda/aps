"use client";

import { useEffect, useState } from "react";

type ProgramOption = {
  code: string;
  nameTh: string;
};

export function CurriculumSetup({
  initialProgramCode,
  initialStudentCode,
  initialTrack,
  ownerEmail,
  ownerName
}: {
  initialProgramCode?: string;
  initialStudentCode?: string;
  initialTrack?: string;
  ownerEmail?: string;
  ownerName?: string;
}) {
  const [programCode, setProgramCode] = useState(initialProgramCode ?? "");
  const [programs, setPrograms] = useState<ProgramOption[]>([]);
  const [studentCode, setStudentCode] = useState(initialStudentCode ?? "");
  const [track, setTrack] = useState(initialTrack ?? "research");
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadPrograms() {
      const query = ownerEmail ? `?ownerEmail=${encodeURIComponent(ownerEmail)}` : "";
      const response = await fetch(`/api/student-program${query}`);
      const data = await response.json();
      const nextPrograms = Array.isArray(data.programs) ? data.programs : [];
      setPrograms(nextPrograms);
      if (!programCode && nextPrograms[0]?.code) {
        setProgramCode(nextPrograms[0].code);
      }
    }

    void loadPrograms();
  }, [ownerEmail, programCode]);

  async function save() {
    const response = await fetch("/api/student-program", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ programCode, studentCode, track, ownerEmail, ownerName })
    });
    const data = await response.json();
    setMessage(data.success ? "บันทึกหลักสูตรแล้ว กำลังโหลดข้อมูลใหม่" : data.error ?? "บันทึกไม่สำเร็จ");
    if (data.success) window.location.reload();
  }

  return (
    <section className="rounded-xl border border-line bg-white p-4">
      <h3 className="text-lg font-bold text-ink">ข้อมูลนี้ใช้เป็นฐานของการคำนวณทั้งหมด</h3>
      <p className="mt-1 text-sm leading-6 text-slate-600">
        ถ้าเลือกหลักสูตรหรือแผนผิด ระบบอาจบอกวิชาคงเหลือและวันจบผิดตามไปด้วย
      </p>
      <div className="mt-4 grid gap-3 md:grid-cols-4">
        <label className="text-sm font-semibold text-slate-700">
          หลักสูตร
          <select className="mt-2 w-full rounded-xl border border-line bg-white px-3 py-2" value={programCode} onChange={(event) => setProgramCode(event.target.value)}>
            {programs.length === 0 ? <option value="">ยังไม่มีหลักสูตรในระบบ</option> : null}
            {programs.map((program) => (
              <option key={program.code} value={program.code}>{program.code} {program.nameTh}</option>
            ))}
          </select>
        </label>
        <label className="text-sm font-semibold text-slate-700">
          รหัสนักศึกษา
          <input className="mt-2 w-full rounded-xl border border-line bg-white px-3 py-2" value={studentCode} onChange={(event) => setStudentCode(event.target.value)} placeholder="650710xxx" />
        </label>
        <label className="text-sm font-semibold text-slate-700">
          แผน
          <select className="mt-2 w-full rounded-xl border border-line bg-white px-3 py-2" value={track} onChange={(event) => setTrack(event.target.value)}>
            <option value="research">โครงงานวิจัย</option>
            <option value="coop">สหกิจศึกษา</option>
          </select>
        </label>
        <div className="flex items-end">
          <button className="w-full rounded-xl bg-slate-950 px-4 py-3 text-sm font-bold text-white shadow-sm disabled:opacity-60" disabled={!programCode || !studentCode} onClick={save}>
            บันทึกหลักสูตร
          </button>
        </div>
      </div>
      {message ? <p className="mt-3 rounded-xl border border-line bg-mist p-3 text-sm leading-6">{message}</p> : null}
    </section>
  );
}

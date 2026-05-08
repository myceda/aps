import { getCurriculumData } from "@/lib/db/repository";

export async function CurriculumEditor() {
  const { programs, courses } = await getCurriculumData();

  return (
    <section className="surface p-4">
      <h2 className="text-lg font-bold">ข้อมูลหลักสูตรและรายวิชา</h2>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div>
          <p className="text-sm font-semibold text-slate-600">หลักสูตร</p>
          <div className="mt-2 space-y-2">
            {programs.map((program) => (
              <div className="rounded-md border border-line p-3" key={program.code}>
                <p className="font-semibold">{program.code} {program.nameTh}</p>
                <p className="text-sm text-slate-600">ขั้นต่ำ {program.totalCreditsMin} หน่วยกิต</p>
              </div>
            ))}
          </div>
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-600">รายวิชาตัวอย่าง</p>
          <div className="mt-2 max-h-80 overflow-auto rounded-md border border-line">
            <table className="w-full text-left text-sm">
              <thead className="bg-mist">
                <tr>
                  <th className="px-3 py-2">รหัส</th>
                  <th className="px-3 py-2">ชื่อ</th>
                  <th className="px-3 py-2">หมวด</th>
                </tr>
              </thead>
              <tbody>
                {courses.slice(0, 20).map((course) => (
                  <tr className="border-t border-line" key={course.code}>
                    <td className="px-3 py-2 font-semibold">{course.code}</td>
                    <td className="px-3 py-2">{course.nameTh}</td>
                    <td className="px-3 py-2">{course.category}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}

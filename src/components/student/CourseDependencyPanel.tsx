import { Badge } from "@/components/shared/Badge";
import type { AnalysisResult, GradeStatus, RiskStatus } from "@/lib/types";

const statusText: Record<GradeStatus, string> = {
  passed: "ผ่านแล้ว",
  failed: "ยังไม่ผ่าน",
  withdrawn: "ถอนรายวิชา",
  not_taken: "ยังไม่ได้เรียน",
  non_credit: "ผ่านแบบไม่นับหน่วยกิต"
};

const statusTone: Record<GradeStatus, RiskStatus> = {
  passed: "normal",
  failed: "urgent",
  withdrawn: "watch",
  not_taken: "watch",
  non_credit: "normal"
};

export function CourseDependencyPanel({ analysis }: { analysis: AnalysisResult }) {
  return (
    <section className="surface p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold">วิชาบังคับก่อนและวิชาตัวต่อ</h2>
          <p className="mt-1 text-sm text-slate-600">
            แสดงความสัมพันธ์ของรายวิชาที่ต้องผ่านก่อน และรายวิชาปลายทางที่ได้รับผลกระทบ
          </p>
        </div>
        <Badge status={analysis.courseDependencies.some((item) => item.isBlocking) ? "urgent" : "normal"}>
          {analysis.courseDependencies.some((item) => item.isBlocking) ? "มีเงื่อนไขที่ยังบล็อก" : "ไม่มีตัวบล็อกหลัก"}
        </Badge>
      </div>

      <div className="mt-4 overflow-hidden rounded-md border border-line">
        <table className="w-full min-w-[980px] text-left text-sm">
          <thead className="bg-mist">
            <tr>
              <th className="px-3 py-2">วิชาตัวต่อ</th>
              <th className="px-3 py-2">สถานะวิชาตัวต่อ</th>
              <th className="px-3 py-2">ต้องผ่านก่อน</th>
              <th className="px-3 py-2">สถานะวิชาบังคับก่อน</th>
              <th className="px-3 py-2">แผนเรียน</th>
              <th className="px-3 py-2">ผลต่อการลงทะเบียน</th>
            </tr>
          </thead>
          <tbody>
            {analysis.courseDependencies.length === 0 ? (
              <tr>
                <td className="px-3 py-4 text-slate-600" colSpan={6}>
                  ยังไม่มีข้อมูลวิชาบังคับก่อนในหลักสูตรที่เลือก
                </td>
              </tr>
            ) : (
              analysis.courseDependencies.map((item) => (
                <tr className="border-t border-line align-top" key={`${item.prerequisiteCode}-${item.courseCode}`}>
                  <td className="px-3 py-3">
                    <p className="font-semibold">{item.courseCode}</p>
                    <p className="text-slate-600">{item.courseName}</p>
                    {item.note ? <p className="mt-1 text-xs text-slate-500">{item.note}</p> : null}
                  </td>
                  <td className="px-3 py-3">
                    <Badge status={statusTone[item.courseStatus]}>{statusText[item.courseStatus]}</Badge>
                  </td>
                  <td className="px-3 py-3">
                    <p className="font-semibold">{item.prerequisiteCode}</p>
                    <p className="text-slate-600">{item.prerequisiteName}</p>
                    {item.isCorequisite ? <p className="mt-1 text-xs text-slate-500">ลงควบคู่ได้</p> : null}
                  </td>
                  <td className="px-3 py-3">
                    <Badge status={statusTone[item.prerequisiteStatus]}>{statusText[item.prerequisiteStatus]}</Badge>
                  </td>
                  <td className="px-3 py-3 text-slate-700">
                    {item.plannedYear && item.plannedSemester
                      ? `ปี ${item.plannedYear} เทอม ${item.plannedSemester}`
                      : "ยังไม่อยู่ในแผนการเรียน"}
                  </td>
                  <td className="px-3 py-3">
                    {item.isBlocking ? (
                      <p className="font-semibold text-coral">ต้องผ่าน {item.prerequisiteCode} ก่อน</p>
                    ) : (
                      <p className="font-semibold text-teal">ปลดล็อกแล้ว</p>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

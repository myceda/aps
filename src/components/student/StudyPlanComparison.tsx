import { ProgressBar } from "@/components/shared/ProgressBar";
import type { AnalysisResult } from "@/lib/types";

export function StudyPlanComparison({ analysis }: { analysis: AnalysisResult }) {
  const missing = analysis.courseStatuses.filter((course) => course.status === "not_taken").slice(0, 8);

  return (
    <section className="surface p-4">
      <h2 className="text-lg font-bold">เทียบหลักสูตรและแผนการเรียน</h2>
      <div className="mt-4 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-3">
          {analysis.categoryProgress.map((category) => (
            <div key={category.category}>
              <div className="mb-1 flex justify-between text-sm">
                <span className="font-semibold">{category.category}</span>
                <span className="text-slate-500">ขาด {category.remainingCredits}</span>
              </div>
              <ProgressBar value={category.earnedCredits} max={category.requiredCredits} />
            </div>
          ))}
        </div>
        <div className="overflow-hidden rounded-md border border-line">
          <table className="w-full text-left text-sm">
            <thead className="bg-mist">
              <tr>
                <th className="px-3 py-2">รหัส</th>
                <th className="px-3 py-2">รายวิชาที่ยังไม่พบ</th>
                <th className="px-3 py-2">หมวด</th>
              </tr>
            </thead>
            <tbody>
              {missing.map((course) => (
                <tr className="border-t border-line" key={course.courseCode}>
                  <td className="px-3 py-2 font-semibold">{course.courseCode}</td>
                  <td className="px-3 py-2">{course.courseName}</td>
                  <td className="px-3 py-2">{course.category}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

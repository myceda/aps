import type { AnalysisResult } from "@/lib/types";

export function RiskImpactPanel({ analysis }: { analysis: AnalysisResult }) {
  const riskCourses = analysis.courseStatuses.filter((course) =>
    course.attempts.some((attempt) => ["F", "W"].includes(attempt.gradeChar))
  );

  return (
    <section className="surface p-4">
      <h2 className="text-lg font-bold">F/W และผลกระทบต่อ prerequisite</h2>
      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <div>
          <p className="text-sm font-semibold text-slate-600">รายวิชาที่เคยมี F/W</p>
          <div className="mt-2 space-y-2">
            {riskCourses.slice(0, 6).map((course) => (
              <div className="rounded-md border border-line p-3" key={course.courseCode}>
                <p className="font-semibold">{course.courseCode} {course.courseName}</p>
                <p className="text-sm text-slate-600">{course.reason}</p>
              </div>
            ))}
          </div>
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-600">ผลกระทบที่ระบบตรวจพบ</p>
          <div className="mt-2 space-y-2">
            {analysis.prerequisiteImpacts.length === 0 ? (
              <p className="text-sm text-slate-600">ไม่พบผลกระทบจาก prerequisite ในข้อมูลตัวอย่าง</p>
            ) : (
              analysis.prerequisiteImpacts.map((impact) => (
                <div className="rounded-md border border-line p-3" key={`${impact.failedPrereqCode}-${impact.blockedCourseCode}`}>
                  <p className="font-semibold">{impact.failedPrereqCode} กระทบ {impact.blockedCourseCode}</p>
                  <p className="text-sm text-slate-600">{impact.recommendation}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

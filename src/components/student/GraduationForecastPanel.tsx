import { Badge } from "@/components/shared/Badge";
import type { AnalysisResult } from "@/lib/types";

export function GraduationForecastPanel({ analysis }: { analysis: AnalysisResult }) {
  const forecast = analysis.graduationForecast;
  const status = forecast.canGraduate ? "normal" : forecast.terms.length > 0 ? "watch" : "urgent";
  const headline = forecast.conditionLabel ?? formatExpectedTerm(forecast.canGraduate, forecast.expectedAcademicYear, forecast.expectedSemester);

  return (
    <section className="surface p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-sky-700">คาดการณ์วันจบ</p>
          <h2 className="text-lg font-bold">ถ้าเรียนครบและผ่านเงื่อนไข จะจบเทอมไหน</h2>
          <p className="mt-1 text-sm text-slate-600">
            ระบบรองรับเทอม 1, เทอม 2 และเทอม 3/ภาคฤดูร้อน นักศึกษาจบได้ทุกเทอมถ้าเรียนครบและผ่านเงื่อนไข
          </p>
        </div>
        <Badge status={status}>{forecast.canGraduate ? "มีเส้นทางจบ" : "ต้องตรวจแผนเพิ่ม"}</Badge>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <div className="rounded-xl border border-line p-3">
          <p className="text-sm text-slate-500">คำตอบจากระบบ</p>
          <p className="mt-1 text-xl font-bold">{headline}</p>
          {forecast.conditionDetail ? <p className="mt-2 text-xs leading-5 text-slate-600">{forecast.conditionDetail}</p> : null}
        </div>
        <div className="rounded-xl border border-line p-3">
          <p className="text-sm text-slate-500">หน่วยกิตที่ยังเกี่ยวกับการจบ</p>
          <p className="mt-1 text-xl font-bold">{forecast.remainingCredits}</p>
        </div>
        <div className="rounded-xl border border-line p-3">
          <p className="text-sm text-slate-500">รอผล / จัดลงแผนแล้ว</p>
          <p className="mt-1 text-xl font-bold">{forecast.pendingCredits}/{forecast.plannedCredits}</p>
        </div>
      </div>

      {forecast.pendingCourses.length > 0 ? (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3">
          <p className="font-semibold text-amber-800">รายวิชาที่กำลังรอผล</p>
          <div className="mt-2 grid gap-2 md:grid-cols-2">
            {forecast.pendingCourses.map((course) => (
              <p className="text-sm text-slate-700" key={course.courseCode}>
                <span className="font-semibold">{course.courseCode}</span> {course.courseName}
              </p>
            ))}
          </div>
        </div>
      ) : null}

      <div className="mt-4 grid gap-3">
        {forecast.terms.length === 0 ? (
          <p className="rounded-xl border border-line bg-mist p-3 text-sm text-slate-600">
            ถ้าไม่มีแผนรายเทอมด้านล่าง แปลว่าไม่มีวิชาที่ยังต้องจัดลงเทอมใหม่ หรือยังไม่มีข้อมูลพอสำหรับวางแผน
          </p>
        ) : (
          forecast.terms.map((term) => (
            <div className="rounded-xl border border-line p-3" key={`${term.academicYear}-${term.semester}`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-bold">ปีการศึกษา {term.academicYear} {formatSemester(term.semester)}</h3>
                <p className="text-sm text-slate-500">{term.plannedCredits}/{term.creditLimit} หน่วยกิต</p>
              </div>
              <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                {term.courses.map((course) => (
                  <div className="rounded-xl bg-mist p-3" key={`${term.academicYear}-${term.semester}-${course.courseCode}`}>
                    <p className="font-semibold">{course.courseCode}</p>
                    <p className="mt-1 text-sm text-slate-700">{course.courseName}</p>
                    <p className="mt-2 text-xs text-slate-500">{course.credits} หน่วยกิต · {course.category}</p>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {forecast.blockedCourses.length > 0 ? (
        <div className="mt-4 rounded-xl border border-coral/40 bg-coral/5 p-3">
          <p className="font-semibold text-coral">วิชาที่ยังใส่ลงแผนไม่ได้</p>
          <div className="mt-2 grid gap-2 md:grid-cols-2">
            {forecast.blockedCourses.map((course) => (
              <p className="text-sm text-slate-700" key={course.courseCode}>
                <span className="font-semibold">{course.courseCode}</span> {course.reason}
              </p>
            ))}
          </div>
        </div>
      ) : null}

      {forecast.notes.length > 0 ? (
        <ul className="mt-4 grid gap-1 text-xs text-slate-500">
          {forecast.notes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

function formatExpectedTerm(canGraduate: boolean, academicYear?: number, semester?: number) {
  if (!canGraduate || !academicYear || !semester) return "ยังคาดการณ์ไม่ได้";
  return `จบได้${formatSemester(semester)} ${academicYear}`;
}

function formatSemester(semester: number) {
  return semester === 3 ? "เทอม 3 / ภาคฤดูร้อน" : `เทอม ${semester}`;
}

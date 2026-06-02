import { Badge } from "@/components/shared/Badge";
import type { AnalysisResult } from "@/lib/types";

export function GraduationForecastPanel({ analysis }: { analysis: AnalysisResult }) {
  const forecast = analysis.graduationForecast;
  const status = forecast.canGraduate ? "normal" : forecast.terms.length > 0 ? "watch" : "urgent";
  const expectedTerm = forecast.canGraduate && forecast.expectedAcademicYear && forecast.expectedSemester
    ? `ปีการศึกษา ${forecast.expectedAcademicYear} เทอม ${forecast.expectedSemester}`
    : "ยังคำนวณวันจบไม่ได้";

  return (
    <section className="surface p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-teal">คาดการณ์แผนจบ</p>
          <h2 className="text-lg font-bold">คาดการณ์แผนเรียนจนจบ</h2>
          <p className="mt-1 text-sm text-slate-600">
            ระบบจัดรายวิชาที่ยังเหลือลงเทอมอนาคตจากวิชาบังคับก่อน รายวิชาที่เปิดสอน และจำนวนหน่วยกิตสูงสุดต่อเทอม
          </p>
        </div>
        <Badge status={status}>{forecast.canGraduate ? "คาดว่าจะจบได้" : "ต้องตรวจแผนเพิ่ม"}</Badge>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <div className="rounded-md border border-line p-3">
          <p className="text-sm text-slate-500">คาดว่าจะจบ</p>
          <p className="mt-1 text-xl font-bold">{expectedTerm}</p>
        </div>
        <div className="rounded-md border border-line p-3">
          <p className="text-sm text-slate-500">หน่วยกิตที่ยังต้องวางแผน</p>
          <p className="mt-1 text-xl font-bold">{forecast.remainingCredits}</p>
        </div>
        <div className="rounded-md border border-line p-3">
          <p className="text-sm text-slate-500">หน่วยกิตที่จัดลงแผนแล้ว</p>
          <p className="mt-1 text-xl font-bold">{forecast.plannedCredits}</p>
        </div>
      </div>

      <div className="mt-4 grid gap-3">
        {forecast.terms.length === 0 ? (
          <p className="rounded-md border border-line bg-mist p-3 text-sm text-slate-600">
            ยังไม่มีแผนรายเทอมให้แสดง กรุณาอัปโหลดและยืนยัน transcript ก่อน
          </p>
        ) : (
          forecast.terms.map((term) => (
            <div className="rounded-md border border-line p-3" key={`${term.academicYear}-${term.semester}`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-bold">ปีการศึกษา {term.academicYear} เทอม {term.semester}</h3>
                <p className="text-sm text-slate-500">{term.plannedCredits}/{term.creditLimit} หน่วยกิต</p>
              </div>
              <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                {term.courses.map((course) => (
                  <div className="rounded-md bg-mist p-3" key={`${term.academicYear}-${term.semester}-${course.courseCode}`}>
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
        <div className="mt-4 rounded-md border border-coral/40 bg-coral/5 p-3">
          <p className="font-semibold text-coral">วิชาที่ยังจัดลงแผนไม่ได้</p>
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

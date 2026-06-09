import { Badge } from "@/components/shared/Badge";
import type { AnalysisResult, ProStatusLevel } from "@/lib/types";

export function StudentDashboardHero({ analysis }: { analysis: AnalysisResult }) {
  const forecast = analysis.graduationForecast;
  const hasTranscript = analysis.courseStatuses.length > 0;
  const expectedTerm = formatExpectedTerm(forecast.canGraduate, forecast.expectedAcademicYear, forecast.expectedSemester);
  const nextTerms = forecast.terms.slice(0, 3);
  const blockedCourses = forecast.blockedCourses.slice(0, 3);
  const progressPercent = analysis.totalCreditsMin > 0
    ? Math.min(100, Math.round((analysis.earnedCredits / analysis.totalCreditsMin) * 100))
    : 0;

  return (
    <section className="surface overflow-hidden p-0">
      <div className="grid gap-0 xl:grid-cols-[0.92fr_1.08fr]">
        <div className="bg-gradient-to-br from-sky-50 via-white to-emerald-50 p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-sky-700">แผงควบคุมภาพรวม</p>
              <h2 className="mt-1 text-2xl font-bold text-ink">แผนเรียนจนจบของคุณ</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                {hasTranscript
                  ? "ระบบใช้ข้อมูลผลการเรียนที่ยืนยันแล้วเทียบกับหลักสูตร เพื่อบอกสถานะ วิชาที่ขวางการจบ และแผนรายเทอมถัดไป"
                  : "เริ่มจากเลือกหลักสูตรและเพิ่มข้อมูลผลการเรียนก่อน ระบบจึงจะคำนวณแผนเรียนจนจบได้"}
              </p>
            </div>
            <Badge status={analysis.proStatus.tone}>{analysis.proStatus.label}</Badge>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <HeroMetric
              label="สถานะนักศึกษา"
              value={analysis.proStatus.label}
              detail={analysis.proStatus.summary}
              tone={analysis.proStatus.tone}
              proStatusLevel={analysis.proStatus.level}
            />
            <HeroMetric
              label="คาดว่าจะจบ"
              value={expectedTerm}
              detail={forecast.canGraduate ? "คำนวณจากวิชาที่ยังเหลือและเทอมที่เปิดสอน" : "ยังมีข้อมูลที่ต้องตรวจเพิ่ม"}
              tone={forecast.canGraduate ? "normal" : "watch"}
            />
            <HeroMetric
              label="หน่วยกิตผ่านแล้ว"
              value={`${analysis.earnedCredits}/${analysis.totalCreditsMin || "-"}`}
              detail={`${progressPercent}% ของขั้นต่ำตามหลักสูตร`}
              tone={progressPercent >= 80 ? "normal" : progressPercent >= 50 ? "watch" : "urgent"}
            />
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <a className="rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-sky-700" href="#graduation-forecast">
              ดูแผนจบ
            </a>
            <a className="rounded-xl border border-line bg-white px-4 py-2 text-sm font-semibold hover:bg-mist" href="#what-if-simulation">
              จำลองสถานการณ์เรียน
            </a>
            <a className="rounded-xl border border-line bg-white px-4 py-2 text-sm font-semibold hover:bg-mist" href="/student/transcript-tools">
              แก้ข้อมูลผลการเรียน
            </a>
          </div>
        </div>

        <div className="grid gap-4 p-5 sm:p-6">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-bold text-ink">แผนรายเทอมถัดไป</h3>
              <a className="text-sm font-semibold text-sky-700" href="#eight-year-plan">ดูแผน 8 ปี</a>
            </div>
            <div className="mt-3 grid gap-2">
              {nextTerms.length === 0 ? (
                <p className="rounded-xl border border-line bg-mist p-3 text-sm text-slate-600">
                  ยังไม่มีแผนรายเทอมให้แสดง กรุณายืนยันข้อมูลผลการเรียนและตรวจข้อมูลหลักสูตร
                </p>
              ) : (
                nextTerms.map((term) => (
                  <div className="rounded-xl border border-line bg-white p-3 shadow-sm" key={`${term.academicYear}-${term.semester}`}>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-semibold">{formatTerm(term.academicYear, term.semester)}</p>
                      <p className="text-xs text-slate-500">{term.plannedCredits}/{term.creditLimit} หน่วยกิต</p>
                    </div>
                    <p className="mt-1 text-sm leading-6 text-slate-700">{summarizeTermCourses(term.courses)}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-bold text-ink">วิชาที่ขวางการจบ</h3>
              <a className="text-sm font-semibold text-sky-700" href="#blocked-courses">ดูรายละเอียด</a>
            </div>
            <div className="mt-3 grid gap-2">
              {blockedCourses.length === 0 ? (
                <p className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
                  ยังไม่พบวิชาที่ขวางแผนจบหลัก
                </p>
              ) : (
                blockedCourses.map((course) => (
                  <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm leading-6 text-red-700" key={course.courseCode}>
                    <span className="font-semibold">{course.courseCode}</span> {course.reason}
                  </p>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function HeroMetric({
  label,
  value,
  detail,
  tone,
  proStatusLevel
}: {
  label: string;
  value: string;
  detail: string;
  tone: "normal" | "watch" | "urgent";
  proStatusLevel?: ProStatusLevel;
}) {
  const isProbation = proStatusLevel === "high_probation" || proStatusLevel === "low_probation";
  const toneClass = isProbation ? getProbationToneClass(proStatusLevel) : {
    normal: "border-emerald-200 bg-emerald-50",
    watch: "border-amber-200 bg-amber-50",
    urgent: "border-red-200 bg-red-50"
  }[tone];

  return (
    <div className={`rounded-2xl border p-3 shadow-sm ${toneClass}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-slate-600">{label}</p>
          <p className="mt-1 text-xl font-bold text-ink">{value}</p>
        </div>
        {isProbation ? (
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-current bg-white/80 text-3xl font-black leading-none" aria-hidden="true">
            !
          </div>
        ) : null}
      </div>
      <p className="mt-1 text-xs leading-5 text-slate-600">{detail}</p>
    </div>
  );
}

function getProbationToneClass(level: ProStatusLevel) {
  if (level === "low_probation") return "border-red-200 bg-red-50 text-red-700";
  if (level === "high_probation") return "border-amber-200 bg-amber-50 text-amber-700";
  return "border-amber-200 bg-amber-50";
}

function formatExpectedTerm(canGraduate: boolean, academicYear?: number, semester?: number) {
  if (!canGraduate || !academicYear || !semester) return "ยังคาดการณ์ไม่ได้";
  return formatTerm(academicYear, semester);
}

function formatTerm(academicYear: number, semester: number) {
  return `ปีการศึกษา ${academicYear} ${semester === 3 ? "ภาคฤดูร้อน" : `เทอม ${semester}`}`;
}

function summarizeTermCourses(courses: Array<{ courseCode: string }>) {
  if (courses.length === 0) return "ยังไม่มีรายวิชาที่จัดลงเทอมนี้";
  const visible = courses.slice(0, 5).map((course) => course.courseCode).join(", ");
  return courses.length > 5 ? `${visible} และอีก ${courses.length - 5} วิชา` : visible;
}

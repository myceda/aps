import { Badge } from "@/components/shared/Badge";
import { ProgressBar } from "@/components/shared/ProgressBar";
import { StatCard } from "@/components/shared/StatCard";
import type { AnalysisResult, RiskStatus } from "@/lib/types";

export function DashboardSummary({ analysis }: { analysis: AnalysisResult }) {
  const proStatus = analysis.proStatus;
  const academicEligibility = analysis.academicEligibility;
  const trackRequirement = analysis.trackRequirement;
  const isLowProbation = proStatus.level === "low_probation" || analysis.gpax < 2;
  const pendingScenario = buildPendingScenario(analysis);
  const answerCards = buildHumanAnswerCards(analysis);

  return (
    <section className="grid gap-4">
      {isLowProbation ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-5 text-red-700 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm font-bold">แจ้งเตือนสถานะโปรต่ำ</p>
              <h3 className="mt-1 text-xl font-extrabold">{proStatus.label}</h3>
              <p className="mt-2 max-w-3xl text-sm leading-6">{proStatus.summary}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-red-200 bg-white text-3xl font-black leading-none">
              !
            </div>
          </div>
        </div>
      ) : null}

      <div className="grid gap-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-bold text-[#007a64]">Academic Eligibility จาก APS</p>
            <h3 className="mt-1 text-xl font-extrabold text-slate-900">{academicEligibility.label}</h3>
            <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-700">{academicEligibility.detail}</p>
          </div>
          <Badge status={academicEligibility.tone}>{formatAcademicEligibilityBadge(analysis)}</Badge>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {answerCards.map((card) => (
            <div className={`rounded-md border bg-white p-4 shadow-sm ${getAnswerCardToneClass(card.tone)}`} key={card.label}>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{card.label}</p>
              <p className="mt-2 text-xl font-extrabold text-slate-950">{card.value}</p>
              <p className="mt-2 text-xs leading-5 text-slate-600">{card.detail}</p>
            </div>
          ))}
        </div>

        <p className="mt-4 rounded-md border border-[#b7ddd8] bg-white px-3 py-2 text-xs font-semibold leading-5 text-slate-600">
          สถานะ REG ไม่ได้คำนวณจากระบบ APS แต่เป็นข้อมูลจากการยื่นจบกับกองบริหารงานวิชาการ
        </p>

        {academicEligibility.pendingCourseCodes.length > 0 ? (
          <p className="mt-3 text-xs font-bold text-amber-700">
            รายวิชาที่รอผล: {academicEligibility.pendingCourseCodes.join(", ")}
          </p>
        ) : null}

        {pendingScenario ? (
          <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-900">
            <p className="font-extrabold">{pendingScenario.title}</p>
            <p>{pendingScenario.waitingLine}</p>
            <p>{pendingScenario.passLine}</p>
            <p>{pendingScenario.failLine}</p>
          </div>
        ) : null}

        <div className="mt-3 flex flex-wrap gap-2">
          {trackRequirement.requiredCourses.map((course) => (
            <span
              className="rounded-md border border-[#b7ddd8] bg-white px-2.5 py-1 text-xs font-bold text-slate-700"
              key={course.courseCode}
            >
              {course.courseCode}: {formatCourseStatus(course.status)}
            </span>
          ))}
        </div>
      </div>

      <div className="surface p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-sky-700">ภาพรวมผลการเรียน</p>
            <h2 className="mt-1 text-xl font-bold text-ink">ตอนนี้สถานะการเรียนเป็นอย่างไร</h2>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">
              ส่วนนี้สรุปข้อมูลที่ต้องเช็กก่อนวางแผนต่อ: เกรดเฉลี่ย หน่วยกิต และความคืบหน้าตามหลักสูตร
            </p>
          </div>
          <Badge status={proStatus.tone}>{proStatus.label}</Badge>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="GPAX ปัจจุบัน" value={analysis.gpax.toFixed(2)} detail="คะแนนเฉลี่ยสะสมจากข้อมูลที่ยืนยันแล้ว" />
          <StatCard label="GPA เทอมล่าสุด" value={analysis.latestGpa.toFixed(2)} detail="ใช้ดูแนวโน้มผลการเรียนล่าสุด" />
          <StatCard label="หน่วยกิตผ่านแล้ว" value={analysis.earnedCredits} detail={`จากขั้นต่ำ ${analysis.totalCreditsMin} หน่วยกิต`} />
          <StatCard label="หน่วยกิตที่ยังขาด" value={analysis.missingCredits} detail="ยังต้องเก็บให้ครบตามหลักสูตร" />
        </div>

        <div className="mt-5 rounded-md border border-sky-100 bg-sky-50 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-sky-800">แถบหน่วยกิตสะสม</p>
              <p className="mt-1 text-sm text-slate-600">
                ยิ่งแถบนี้ใกล้เต็ม แปลว่าหน่วยกิตที่ผ่านแล้วใกล้ครบตามเกณฑ์ขั้นต่ำของหลักสูตร
              </p>
            </div>
            <p className="text-lg font-extrabold text-sky-700">
              {analysis.earnedCredits}/{analysis.totalCreditsMin} หน่วยกิต
            </p>
          </div>
          <div className="mt-4">
            <ProgressBar value={analysis.earnedCredits} max={analysis.totalCreditsMin} />
          </div>
        </div>
      </div>
    </section>
  );
}

function buildHumanAnswerCards(analysis: AnalysisResult) {
  return [
    {
      label: "สถานะทางวิชาการ",
      value: formatAcademicStatus(analysis),
      detail: analysis.academicEligibility.detail,
      tone: analysis.academicEligibility.tone
    },
    {
      label: "สายที่ใช้ตรวจ",
      value: analysis.trackRequirement.track === "coop" ? "Coop" : "Research",
      detail: analysis.trackRequirement.detail,
      tone: getTrackTone(analysis)
    },
    {
      label: "คาดการณ์เทอมจบ",
      value: formatForecastTerm(analysis.academicEligibility.expectedAcademicYear, analysis.academicEligibility.expectedSemester),
      detail: analysis.graduationForecast.conditionLabel ?? "ระบบยังไม่มีข้อมูลพอสำหรับคาดการณ์เทอมจบ",
      tone: analysis.graduationForecast.canGraduate ? "normal" : "watch"
    },
    {
      label: "สถานะ REG",
      value: analysis.regGraduationStatus.label,
      detail: analysis.regGraduationStatus.detail,
      tone: formatRegTone(analysis.regGraduationStatus.status)
    }
  ] satisfies { label: string; value: string; detail: string; tone: RiskStatus }[];
}

function buildPendingScenario(analysis: AnalysisResult) {
  const pendingCodes = analysis.trackRequirement.pendingCourseCodes;
  if (pendingCodes.length === 0) return null;

  const pendingText = pendingCodes.join(", ");
  const forecastLabel = analysis.graduationForecast.conditionLabel?.replace("จบได้", "คาดว่าจบได้ภายใน");
  const trackPlanLabel = analysis.trackRequirement.track === "coop" ? "แผนสหกิจ" : "แผนโครงงานวิจัย";

  return {
    title: `เรียนครบตาม${trackPlanLabel}แล้ว`,
    waitingLine: `รอผลเกรด ${pendingText}`,
    passLine: `ถ้า ${pendingText} ผ่าน ${forecastLabel ?? "จะเข้าเงื่อนไขจบ"}`,
    failLine: "ถ้าไม่ผ่าน ต้องลงซ้ำ/วางแผนใหม่"
  };
}

function formatAcademicStatus(analysis: AnalysisResult) {
  if (analysis.academicEligibility.state === "eligible_now") return "เรียนครบแล้ว";
  if (analysis.academicEligibility.state === "eligible_if_pending_passed") return "รอเกรด";
  if (analysis.academicEligibility.state === "forecast_eligible") return "ยังวางแผนต่อได้";
  if (hasPrerequisiteBlock(analysis)) return "ติด prerequisite";
  return "ยังขาดวิชา";
}

function formatAcademicEligibilityBadge(analysis: AnalysisResult) {
  return formatAcademicStatus(analysis);
}

function hasPrerequisiteBlock(analysis: AnalysisResult) {
  return analysis.courseDependencies.some((dependency) => dependency.isBlocking) || analysis.graduationForecast.blockedCourses.length > 0;
}

function formatForecastTerm(academicYear?: number, semester?: number) {
  if (!academicYear || !semester) return "ยังคาดการณ์ไม่ได้";
  if (semester === 3) return `เทอม 3/${academicYear}`;
  return `เทอม ${semester}/${academicYear}`;
}

function getTrackTone(analysis: AnalysisResult): RiskStatus {
  if (analysis.trackRequirement.state === "passed") return "normal";
  if (analysis.trackRequirement.state === "pending") return "watch";
  return "urgent";
}

function formatRegTone(status: AnalysisResult["regGraduationStatus"]["status"]): RiskStatus {
  if (status === "approved") return "normal";
  if (status === "applied") return "watch";
  return "watch";
}

function getAnswerCardToneClass(tone: RiskStatus) {
  if (tone === "urgent") return "border-red-200";
  if (tone === "watch") return "border-amber-200";
  return "border-[#b7ddd8]";
}

function formatCourseStatus(status: AnalysisResult["trackRequirement"]["requiredCourses"][number]["status"]) {
  const labels: Record<AnalysisResult["trackRequirement"]["requiredCourses"][number]["status"], string> = {
    passed: "ผ่านแล้ว",
    failed: "ไม่ผ่าน",
    withdrawn: "ถอน",
    incomplete: "รอผลเกรด I",
    not_taken: "ยังไม่พบ",
    non_credit: "ผ่านไม่นับหน่วยกิต"
  };

  return labels[status];
}

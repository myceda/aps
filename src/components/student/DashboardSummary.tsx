import Link from "next/link";
import { Badge } from "@/components/shared/Badge";
import type { AnalysisResult } from "@/lib/types";

type DashboardSummaryProps = {
  analysis: AnalysisResult;
  onOpenRoadmap: () => void;
  onOpenSimulator: () => void;
  transcriptToolsHref: string;
};

export function DashboardSummary({ analysis, onOpenRoadmap, onOpenSimulator, transcriptToolsHref }: DashboardSummaryProps) {
  const proStatus = analysis.proStatus;
  const academicEligibility = analysis.academicEligibility;
  const trackRequirement = analysis.trackRequirement;
  const isLowProbation = proStatus.level === "low_probation" || analysis.gpax < 2;
  const pendingScenario = buildPendingScenario(analysis);

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

      <div className="grid gap-4 rounded-md bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-amber-200 bg-amber-50 p-4">
          <div>
            <p className="font-extrabold text-amber-900">เริ่มจากตรวจข้อมูลผลการเรียนก่อน</p>
            <p className="mt-1 text-sm leading-6 text-amber-800">
              ถ้า transcript อ่านไม่ครบ หรือเลือกหลักสูตร/สายผิด ผลคาดการณ์วันจบและรายวิชาที่เหลือจะผิดตามไปด้วย
            </p>
          </div>
          <Link
            className="rounded-md bg-[#f59e0b] px-4 py-2 text-sm font-extrabold text-white hover:bg-[#d98706]"
            href={transcriptToolsHref}
          >
            จัดการข้อมูลผลการเรียน
          </Link>
        </div>

        <div className="grid gap-3 lg:grid-cols-[1fr_1fr]">
          <div className="rounded-md border border-[#b7ddd8] bg-[#effaf8] p-3">
            <p className="text-xs font-bold text-[#007a64]">สถานะทางวิชาการจาก APS</p>
            <p className="mt-1 font-extrabold text-slate-900">{formatAcademicStatus(analysis)}</p>
            <p className="mt-1 text-xs leading-5 text-slate-600">{academicEligibility.detail}</p>
          </div>
          <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs font-bold text-slate-500">สถานะ REG</p>
            <p className="mt-1 font-extrabold text-slate-900">{analysis.regGraduationStatus.label}</p>
            <p className="mt-1 text-xs leading-5 text-slate-600">
              สถานะ REG ไม่ได้คำนวณจาก APS แต่เป็นข้อมูลจากการยื่นจบกับกองบริหารงานวิชาการ
            </p>
          </div>
        </div>

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

      <RemainingCoursesSection analysis={analysis} />
      <BlockedCoursesSection analysis={analysis} />
      <RoadmapPreview analysis={analysis} onOpenRoadmap={onOpenRoadmap} />
      <WhatIfEntry onOpenSimulator={onOpenSimulator} />
    </section>
  );
}

function RemainingCoursesSection({ analysis }: { analysis: AnalysisResult }) {
  const remainingCourses = analysis.courseStatuses
    .filter((course) => course.status === "not_taken" || course.status === "failed" || course.status === "withdrawn" || course.status === "incomplete")
    .slice(0, 10);

  return (
    <section className="rounded-md bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-[#007a64]">รายวิชาที่เหลือ</p>
          <h2 className="mt-1 text-xl font-extrabold text-slate-900">ยังต้องจัดการวิชาไหนบ้าง</h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            รวมวิชาที่ยังไม่พบใน transcript, ยังไม่ผ่าน, ถอน, หรือรอผลเกรด I
          </p>
        </div>
        <Badge status={remainingCourses.length > 0 ? "watch" : "normal"}>
          {remainingCourses.length > 0 ? `${remainingCourses.length} รายการ` : "ไม่พบวิชาค้าง"}
        </Badge>
      </div>

      {remainingCourses.length > 0 ? (
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {remainingCourses.map((course) => (
            <div className="rounded-md border border-slate-200 bg-slate-50 p-3" key={course.courseCode}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-extrabold text-slate-900">{course.courseCode}</p>
                  <p className="mt-1 text-sm leading-5 text-slate-700">{course.courseName}</p>
                </div>
                <span className="rounded-md bg-white px-2 py-1 text-xs font-bold text-slate-600">{course.credits} หน่วยกิต</span>
              </div>
              <p className="mt-2 text-xs font-bold text-[#007a64]">{formatCourseStatus(course.status)}</p>
              <p className="mt-1 text-xs leading-5 text-slate-500">{course.reason}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-4 rounded-md border border-[#b7ddd8] bg-[#effaf8] p-3 text-sm font-semibold text-[#007a64]">
          ไม่พบรายวิชาค้างจากข้อมูลที่ยืนยันแล้ว
        </p>
      )}
    </section>
  );
}

function BlockedCoursesSection({ analysis }: { analysis: AnalysisResult }) {
  const prerequisiteBlocks = analysis.courseDependencies.filter((dependency) => dependency.isBlocking).slice(0, 8);
  const forecastBlocks = analysis.graduationForecast.blockedCourses.slice(0, 8);
  const hasBlocks = prerequisiteBlocks.length > 0 || forecastBlocks.length > 0;

  return (
    <section className="rounded-md bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-[#007a64]">วิชาที่ถูก block</p>
          <h2 className="mt-1 text-xl font-extrabold text-slate-900">มี prerequisite ขวางการลงวิชาไหม</h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            ถ้ามีวิชาถูก block ต้องผ่านวิชาบังคับก่อน หรือรอข้อมูลวิชาเปิดสอนให้ครบก่อนวางแผนจบ
          </p>
        </div>
        <Badge status={hasBlocks ? "urgent" : "normal"}>{hasBlocks ? "ต้องตรวจ" : "ไม่พบ block"}</Badge>
      </div>

      {hasBlocks ? (
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          {prerequisiteBlocks.map((dependency) => (
            <div className="rounded-md border border-red-200 bg-red-50 p-3" key={`${dependency.courseCode}-${dependency.prerequisiteCode}`}>
              <p className="text-sm font-extrabold text-red-800">{dependency.courseCode} ถูก block</p>
              <p className="mt-1 text-sm leading-6 text-red-700">
                ต้องผ่าน {dependency.prerequisiteCode} ก่อน จึงควรวางลำดับเรียนใหม่
              </p>
            </div>
          ))}

          {forecastBlocks.map((course) => (
            <div className="rounded-md border border-amber-200 bg-amber-50 p-3" key={course.courseCode}>
              <p className="text-sm font-extrabold text-amber-900">{course.courseCode} ยังวางลงแผนไม่ได้</p>
              <p className="mt-1 text-sm leading-6 text-amber-800">{course.reason}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-4 rounded-md border border-[#b7ddd8] bg-[#effaf8] p-3 text-sm font-semibold text-[#007a64]">
          ยังไม่พบวิชาที่ติด prerequisite จากข้อมูลปัจจุบัน
        </p>
      )}
    </section>
  );
}

function RoadmapPreview({ analysis, onOpenRoadmap }: { analysis: AnalysisResult; onOpenRoadmap: () => void }) {
  const plannedTerms = analysis.graduationForecast.terms.slice(0, 3);

  return (
    <section className="rounded-md bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-[#007a64]">Roadmap รายเทอม</p>
          <h2 className="mt-1 text-xl font-extrabold text-slate-900">แผนต่อจากนี้ควรไปทางไหน</h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            แสดงเทอมถัดไปแบบย่อ ถ้าต้องดูทุกปีให้เปิดแผน 8 ปี
          </p>
        </div>
        <button
          className="rounded-md border border-[#007a64] px-4 py-2 text-sm font-extrabold text-[#007a64] hover:bg-[#effaf8]"
          onClick={onOpenRoadmap}
          type="button"
        >
          ดูแผน 8 ปี
        </button>
      </div>

      {plannedTerms.length > 0 ? (
        <div className="mt-4 grid gap-3 lg:grid-cols-3">
          {plannedTerms.map((term) => (
            <div className="rounded-md border border-slate-200 bg-slate-50 p-3" key={`${term.academicYear}-${term.semester}`}>
              <p className="font-extrabold text-slate-900">
                {formatForecastTerm(term.academicYear, term.semester)}
              </p>
              <p className="mt-1 text-xs font-bold text-slate-500">
                {term.plannedCredits}/{term.creditLimit} หน่วยกิต
              </p>
              <div className="mt-3 grid gap-2">
                {term.courses.slice(0, 4).map((course) => (
                  <p className="rounded bg-white px-2 py-1 text-xs font-semibold text-slate-700" key={course.courseCode}>
                    {course.courseCode} {course.courseName}
                  </p>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-4 rounded-md border border-[#b7ddd8] bg-[#effaf8] p-3 text-sm font-semibold text-[#007a64]">
          ตอนนี้ยังไม่มีวิชาที่ต้องจัดลงเทอมใหม่ หรือข้อมูลยังไม่พอสำหรับวาง roadmap
        </p>
      )}
    </section>
  );
}

function WhatIfEntry({ onOpenSimulator }: { onOpenSimulator: () => void }) {
  return (
    <section className="rounded-md border border-[#b7ddd8] bg-[#effaf8] p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-[#007a64]">What-if Simulation</p>
          <h2 className="mt-1 text-xl font-extrabold text-slate-900">ลองก่อนตัดสินใจจริง</h2>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">
            ใช้จำลองผลจากการถอนวิชา ลงวิชาเพิ่ม หรือไม่ผ่าน prerequisite แล้วดูว่าเทอมจบและวิชาที่ถูก block เปลี่ยนอย่างไร
          </p>
        </div>
        <button
          className="rounded-md bg-[#007a64] px-5 py-3 text-sm font-extrabold text-white hover:bg-[#006855]"
          onClick={onOpenSimulator}
          type="button"
        >
          เปิด What-if
        </button>
      </div>
    </section>
  );
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

function hasPrerequisiteBlock(analysis: AnalysisResult) {
  return analysis.courseDependencies.some((dependency) => dependency.isBlocking) || analysis.graduationForecast.blockedCourses.length > 0;
}

function formatForecastTerm(academicYear?: number, semester?: number) {
  if (!academicYear || !semester) return "ยังคาดการณ์ไม่ได้";
  if (semester === 3) return `เทอม 3/${academicYear}`;
  return `เทอม ${semester}/${academicYear}`;
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

import type { AnalysisResult, CourseDependency, GradeStatus, GraduationForecastCourse } from "@/lib/types";

type DiagramStatus = GradeStatus | "planned" | "blocked" | "empty";

type DiagramCourse = GraduationForecastCourse & {
  status: DiagramStatus;
  statusLabel: string;
  termKey: string;
};

const semesterLabels: Record<number, string> = {
  1: "เทอม 1",
  2: "เทอม 2",
  3: "ภาคฤดูร้อน"
};

const statusLabels: Record<DiagramStatus, string> = {
  passed: "ผ่านแล้ว",
  non_credit: "ผ่านไม่นับหน่วยกิต",
  planned: "แผนอนาคต",
  not_taken: "ยังไม่เรียน",
  withdrawn: "ถอน",
  incomplete: "รอเกรด",
  failed: "ตก/ไม่ผ่าน",
  blocked: "ถูกขวาง",
  empty: "ไม่มีวิชา"
};

const statusStyles: Record<DiagramStatus, string> = {
  passed: "border-emerald-200 bg-emerald-50 text-emerald-700",
  non_credit: "border-emerald-200 bg-emerald-50 text-emerald-700",
  planned: "border-sky-200 bg-sky-50 text-sky-900",
  not_taken: "border-line bg-white text-slate-700",
  withdrawn: "border-amber-200 bg-amber-50 text-amber-700",
  incomplete: "border-amber-200 bg-amber-50 text-amber-800",
  failed: "border-red-200 bg-red-50 text-red-700",
  blocked: "border-red-200 bg-red-50 text-red-700",
  empty: "border-dashed border-line bg-white text-slate-400"
};

export function EightYearStudyPlanDiagram({ analysis }: { analysis: AnalysisResult }) {
  const startAcademicYear = getStartAcademicYear(analysis);
  const diagramYears = Array.from({ length: 8 }, (_, yearIndex) => yearIndex + 1);
  const plannedByTerm = buildPlannedCourseMap(analysis, startAcademicYear);
  const blockedCourses = analysis.graduationForecast.blockedCourses;
  const visibleChains = getVisibleChains(analysis.courseDependencies);
  const graduationLabel = formatGraduationLabel(
    analysis.graduationForecast.canGraduate,
    analysis.graduationForecast.expectedAcademicYear,
    analysis.graduationForecast.expectedSemester
  );

  return (
    <div className="surface p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-sky-700">แผนการเรียนรายเทอม</p>
          <h2 className="text-xl font-bold text-ink">เห็นภาพรวมตั้งแต่ปี 1 ถึงปี 8</h2>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">
            ดูรายปีและรายเทอมโดยไม่ต้องลากตารางยาว สีของรายวิชาช่วยบอกว่าผ่านแล้ว วางแผนไว้ รอเกรด ถอน ไม่ผ่าน หรือถูก prerequisite ขวาง
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs font-semibold">
          <Legend status="planned" />
          <Legend status="incomplete" />
          <Legend status="withdrawn" />
          <Legend status="failed" />
          <Legend status="blocked" />
        </div>
      </div>

      {graduationLabel ? (
        <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
          <p className="text-base font-bold text-emerald-800">คาดว่าจะจบ: {graduationLabel}</p>
          <p className="mt-1 text-sm text-emerald-700">
            คำนวณจากวิชาที่ยังเหลือ prerequisite วิชาเปิดสอน และจำนวนหน่วยกิตสูงสุดต่อเทอม
          </p>
        </div>
      ) : (
        <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="font-bold text-amber-800">ยังคาดการณ์วันจบไม่ได้</p>
          <p className="mt-1 text-sm text-slate-700">ต้องตรวจข้อมูลผลการเรียน หลักสูตร หรือข้อมูลวิชาเปิดสอนให้ครบก่อน</p>
        </div>
      )}

      <div className="mt-5 grid gap-4 xl:grid-cols-2">
        {diagramYears.map((year) => (
          <div className="min-w-0 rounded-2xl border border-slate-100 bg-slate-50 p-3 shadow-sm" key={year}>
            <div className="mb-3 rounded-xl bg-white px-3 py-2">
              <p className="font-bold text-ink">ปี {year}</p>
              <p className="text-xs text-slate-500">ปีการศึกษา {startAcademicYear + year - 1}</p>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              {[1, 2, 3].map((semester) => (
                <TermColumn
                  courses={plannedByTerm.get(termKey(year, semester)) ?? []}
                  key={`${year}-${semester}`}
                  semester={semester}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1fr_0.95fr]">
        <div className="rounded-2xl border border-line bg-white p-4">
          <h3 className="font-bold text-ink">วิชาที่ขวางการจบ</h3>
          <div className="mt-3 grid gap-2">
            {blockedCourses.length === 0 ? (
              <p className="rounded-xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-700">ยังไม่พบวิชาที่ขวางแผนจบหลัก</p>
            ) : (
              blockedCourses.map((course) => (
                <CourseCard course={{ ...course, status: "blocked", statusLabel: statusLabels.blocked, termKey: "blocked" }} key={course.courseCode} />
              ))
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-line bg-white p-4">
          <h3 className="font-bold text-ink">ลำดับ prerequisite ที่ควรรู้</h3>
          <div className="mt-3 grid gap-2">
            {visibleChains.length === 0 ? (
              <p className="rounded-xl bg-mist p-3 text-sm text-slate-600">ยังไม่มีข้อมูลลำดับวิชาบังคับก่อนให้แสดง</p>
            ) : (
              visibleChains.map((chain) => <BlockChain chain={chain} key={`${chain.prerequisiteCode}-${chain.courseCode}`} />)
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function TermColumn({ semester, courses }: { semester: number; courses: DiagramCourse[] }) {
  const credits = courses.reduce((total, course) => total + course.credits, 0);

  return (
    <div className="min-w-0 bg-white rounded-xl p-4 border border-slate-100">
      <div className="border-b border-slate-100 pb-3">
        <p className="text-sm font-bold text-slate-950">{semesterLabels[semester]}</p>
        <p className="text-xs text-slate-500">{credits} หน่วยกิต</p>
      </div>
      <div className="mt-3 grid gap-2">
        {courses.length === 0 ? (
          <div className={`rounded-xl border px-3 py-10 text-center text-xs font-semibold ${statusStyles.empty}`}>
            ยังไม่มีวิชา
          </div>
        ) : (
          courses.map((course, index) => <CourseCard course={course} key={`${course.termKey}-${course.courseCode}-${index}`} />)
        )}
      </div>
    </div>
  );
}

function CourseCard({ course }: { course: DiagramCourse }) {
  const courseStyle = getCourseCardStyle(course);

  return (
    <article className={`rounded-xl border p-3 shadow-sm ${courseStyle}`}>
      <div className="flex items-center justify-between gap-2">
        <p className="whitespace-nowrap text-sm font-extrabold">{course.courseCode}</p>
        <span className="shrink-0 rounded-lg bg-white/80 px-2 py-1 text-[11px] font-bold">{course.credits} หน่วยกิต</span>
      </div>
      <p className="mt-1 line-clamp-2 text-xs leading-5">{course.courseName}</p>
      <div className="mt-2 flex flex-wrap gap-1">
        <span className="rounded-lg bg-white/80 px-2 py-1 text-[11px] font-bold">{course.statusLabel}</span>
        <span className="rounded-lg bg-white/80 px-2 py-1 text-[11px]">{course.category}</span>
      </div>
    </article>
  );
}

function getCourseCardStyle(course: DiagramCourse) {
  if (course.status === "blocked" || course.status === "failed") {
    return "border-red-200 bg-red-50 text-red-800";
  }
  if (course.status === "withdrawn" || course.status === "incomplete") {
    return "border-amber-200 bg-amber-50 text-amber-800";
  }

  const category = course.category.toLowerCase();
  if (category.includes("ศึกษา") || category.includes("general") || category.includes("gen")) {
    return "border-emerald-200 bg-emerald-50 text-emerald-900";
  }
  if (category.includes("เลือก") || category.includes("elective")) {
    return "border-violet-200 bg-violet-50 text-violet-900";
  }

  return "border-sky-200 bg-sky-50 text-sky-950";
}

function Legend({ status }: { status: DiagramStatus }) {
  return (
    <span className={`rounded-lg border px-2 py-1 ${statusStyles[status]}`}>
      {statusLabels[status]}
    </span>
  );
}

function BlockChain({ chain }: { chain: CourseDependency }) {
  const isBlocked = chain.isBlocking;

  return (
    <div className={`rounded-xl border p-3 ${isBlocked ? "border-red-200 bg-red-50" : "border-line bg-white"}`}>
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <ChainNode code={chain.prerequisiteCode} label={chain.prerequisiteName} status={chain.prerequisiteStatus} />
        <span className="font-bold text-slate-400">-&gt;</span>
        <ChainNode code={chain.courseCode} label={chain.courseName} status={chain.courseStatus} />
      </div>
      <p className={`mt-2 text-sm font-semibold ${isBlocked ? "text-red-700" : "text-sky-700"}`}>
        {isBlocked ? `ต้องผ่าน ${chain.prerequisiteCode} ก่อนจึงจะปลดล็อก ${chain.courseCode}` : "ลำดับวิชานี้ปลดล็อกแล้ว"}
      </p>
    </div>
  );
}

function ChainNode({ code, label, status }: { code: string; label: string; status: GradeStatus }) {
  return (
    <span className={`rounded-lg border px-2 py-1 ${statusStyles[status]}`}>
      <span className="font-bold">{code}</span> <span className="text-xs">{label}</span>
    </span>
  );
}

function buildPlannedCourseMap(analysis: AnalysisResult, startAcademicYear: number) {
  const courseStatusByCode = new Map(analysis.courseStatuses.map((course) => [course.courseCode, course.status]));
  const plannedByTerm = new Map<string, DiagramCourse[]>();

  for (const term of analysis.graduationForecast.terms) {
    const yearNumber = term.academicYear - startAcademicYear + 1;
    if (yearNumber < 1 || yearNumber > 8) continue;

    const key = termKey(yearNumber, term.semester);
    const courses: DiagramCourse[] = term.courses.map((course) => {
      const status = courseStatusByCode.get(course.courseCode);
      const diagramStatus: DiagramStatus =
        status === "failed" || status === "withdrawn" || status === "incomplete" ? status : "planned";
      return {
        ...course,
        status: diagramStatus,
        statusLabel: statusLabels[diagramStatus],
        termKey: key
      };
    });

    plannedByTerm.set(key, [...(plannedByTerm.get(key) ?? []), ...courses]);
  }

  return plannedByTerm;
}

function getVisibleChains(chains: CourseDependency[]) {
  const blockingChains = chains.filter((item) => item.isBlocking);
  return (blockingChains.length > 0 ? blockingChains : chains).slice(0, 8);
}

function getStartAcademicYear(analysis: AnalysisResult) {
  const firstForecastTerm = analysis.graduationForecast.terms.at(0);
  const firstTranscriptYear = analysis.courseStatuses
    .flatMap((course) => course.attempts.map((attempt) => attempt.academicYear))
    .sort((a, b) => a - b)
    .at(0);

  return firstTranscriptYear ?? firstForecastTerm?.academicYear ?? 2568;
}

function formatGraduationLabel(canGraduate: boolean, academicYear?: number, semester?: number) {
  if (!canGraduate || !academicYear || !semester) return "";
  return `ปีการศึกษา ${academicYear} / ${semester === 3 ? "ภาคฤดูร้อน" : `เทอม ${semester}`}`;
}

function termKey(year: number, semester: number) {
  return `${year}-${semester}`;
}

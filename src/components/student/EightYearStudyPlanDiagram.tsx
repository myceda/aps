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
  3: "Summer"
};

const statusStyles: Record<DiagramStatus, string> = {
  passed: "border-leaf bg-green-50 text-leaf",
  non_credit: "border-leaf bg-green-50 text-leaf",
  planned: "border-teal bg-teal/10 text-teal",
  not_taken: "border-line bg-white text-slate-700",
  withdrawn: "border-amber bg-amber-50 text-amber",
  failed: "border-coral bg-red-50 text-coral",
  blocked: "border-coral bg-red-50 text-coral",
  empty: "border-line bg-white text-slate-400"
};

const statusLabels: Record<DiagramStatus, string> = {
  passed: "ผ่านแล้ว",
  non_credit: "ผ่านไม่นับหน่วยกิต",
  planned: "อยู่ในแผน",
  not_taken: "ยังไม่ได้เรียน",
  withdrawn: "ถอน",
  failed: "ตก/ไม่ผ่าน",
  blocked: "ถูก block",
  empty: "ไม่มีวิชา"
};

export function EightYearStudyPlanDiagram({ analysis }: { analysis: AnalysisResult }) {
  const startAcademicYear = getStartAcademicYear(analysis);
  const diagramYears = Array.from({ length: 8 }, (_, yearIndex) => yearIndex + 1);
  const plannedByTerm = buildPlannedCourseMap(analysis, startAcademicYear);
  const blockedCourses = analysis.graduationForecast.blockedCourses;
  const blockingChains = analysis.courseDependencies.filter((item) => item.isBlocking).slice(0, 8);
  const visibleChains = blockingChains.length > 0 ? blockingChains : analysis.courseDependencies.slice(0, 8);

  return (
    <section className="surface p-4" id="eight-year-plan">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-teal">Diagram แผน 8 ปี</p>
          <h2 className="text-lg font-bold">แผนรายเทอมตั้งแต่ปี 1 ถึงปี 8</h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            แสดงปี 1 เทอม 1, ปี 1 เทอม 2, Summer ต่อเนื่องถึงปี 8 พร้อมสีสถานะของรายวิชาและ block chain ของ prerequisite
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs font-semibold">
          <Legend status="passed" />
          <Legend status="planned" />
          <Legend status="failed" />
          <Legend status="withdrawn" />
          <Legend status="blocked" />
        </div>
      </div>

      <div className="mt-4 overflow-x-auto rounded-md border border-line">
        <div className="min-w-[1180px]">
          <div className="grid grid-cols-8 border-b border-line bg-mist">
            {diagramYears.map((year) => (
              <div className="border-r border-line px-3 py-2 last:border-r-0" key={year}>
                <p className="font-bold">ปี {year}</p>
                <p className="text-xs text-slate-500">ปีการศึกษา {startAcademicYear + year - 1}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-8">
            {diagramYears.map((year) => (
              <div className="grid gap-3 border-r border-line p-3 last:border-r-0" key={year}>
                {[1, 2, 3].map((semester) => (
                  <TermColumn
                    courses={plannedByTerm.get(termKey(year, semester)) ?? []}
                    key={`${year}-${semester}`}
                    semester={semester}
                    year={year}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1fr_0.95fr]">
        <div className="rounded-md border border-line p-3">
          <h3 className="font-bold">วิชาที่ block การจบ</h3>
          <div className="mt-3 grid gap-2">
            {blockedCourses.length === 0 ? (
              <p className="rounded-md bg-green-50 p-3 text-sm font-semibold text-leaf">ยังไม่พบวิชาที่ block แผนจบหลัก</p>
            ) : (
              blockedCourses.map((course) => (
                <div className="rounded-md border border-coral bg-red-50 p-3" key={course.courseCode}>
                  <p className="font-semibold text-coral">{course.courseCode} {course.courseName}</p>
                  <p className="mt-1 text-sm leading-6 text-slate-700">{course.reason}</p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-md border border-line p-3">
          <h3 className="font-bold">Block chain ของ prerequisite</h3>
          <div className="mt-3 grid gap-2">
            {visibleChains.length === 0 ? (
              <p className="rounded-md bg-mist p-3 text-sm text-slate-600">ยังไม่มีข้อมูล prerequisite chain ให้แสดง</p>
            ) : (
              visibleChains.map((chain) => <BlockChain key={`${chain.prerequisiteCode}-${chain.courseCode}`} chain={chain} />)
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function TermColumn({ year, semester, courses }: { year: number; semester: number; courses: DiagramCourse[] }) {
  return (
    <div className="rounded-md border border-line bg-white">
      <div className="border-b border-line px-2 py-2">
        <p className="text-sm font-bold">ปี {year} {semesterLabels[semester]}</p>
        <p className="text-xs text-slate-500">{courses.reduce((total, course) => total + course.credits, 0)} หน่วยกิต</p>
      </div>
      <div className="grid min-h-24 gap-2 p-2">
        {courses.length === 0 ? (
          <div className={`rounded-md border px-2 py-3 text-center text-xs font-semibold ${statusStyles.empty}`}>
            ยังไม่มีวิชา
          </div>
        ) : (
          courses.map((course) => (
            <article className={`rounded-md border p-2 ${statusStyles[course.status]}`} key={`${course.termKey}-${course.courseCode}`}>
              <div className="flex items-start justify-between gap-2">
                <p className="font-bold">{course.courseCode}</p>
                <span className="shrink-0 rounded-md bg-white/70 px-2 py-1 text-[11px] font-bold">{course.statusLabel}</span>
              </div>
              <p className="mt-1 line-clamp-2 text-xs leading-5">{course.courseName}</p>
              <p className="mt-2 text-[11px]">{course.credits} หน่วยกิต · {course.category}</p>
            </article>
          ))
        )}
      </div>
    </div>
  );
}

function Legend({ status }: { status: DiagramStatus }) {
  return (
    <span className={`rounded-md border px-2 py-1 ${statusStyles[status]}`}>
      {statusLabels[status]}
    </span>
  );
}

function BlockChain({ chain }: { chain: CourseDependency }) {
  const isBlocked = chain.isBlocking;

  return (
    <div className={`rounded-md border p-3 ${isBlocked ? "border-coral bg-red-50" : "border-line bg-white"}`}>
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <ChainNode code={chain.prerequisiteCode} label={chain.prerequisiteName} status={chain.prerequisiteStatus} />
        <span className="font-bold text-slate-400">→</span>
        <ChainNode code={chain.courseCode} label={chain.courseName} status={chain.courseStatus} />
      </div>
      <p className={`mt-2 text-sm font-semibold ${isBlocked ? "text-coral" : "text-teal"}`}>
        {isBlocked ? `ต้องผ่าน ${chain.prerequisiteCode} ก่อนจึงจะปลดล็อก ${chain.courseCode}` : "chain นี้ปลดล็อกแล้ว"}
      </p>
    </div>
  );
}

function ChainNode({ code, label, status }: { code: string; label: string; status: GradeStatus }) {
  return (
    <span className={`rounded-md border px-2 py-1 ${statusStyles[status]}`}>
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
      const diagramStatus: DiagramStatus = status === "failed" || status === "withdrawn" ? status : "planned";
      return {
        ...course,
        status: diagramStatus,
        statusLabel: statusLabels[diagramStatus],
        termKey: key
      };
    });

    plannedByTerm.set(key, [...(plannedByTerm.get(key) ?? []), ...courses]);
  }

  for (const blockedCourse of analysis.graduationForecast.blockedCourses) {
    const key = termKey(8, 3);
    plannedByTerm.set(key, [
      ...(plannedByTerm.get(key) ?? []),
      { ...blockedCourse, status: "blocked", statusLabel: statusLabels.blocked, termKey: key }
    ]);
  }

  return plannedByTerm;
}

function getStartAcademicYear(analysis: AnalysisResult) {
  const firstForecastTerm = analysis.graduationForecast.terms.at(0);
  const firstTranscriptYear = analysis.courseStatuses
    .flatMap((course) => course.attempts.map((attempt) => attempt.academicYear))
    .sort((a, b) => a - b)
    .at(0);

  return firstTranscriptYear ?? firstForecastTerm?.academicYear ?? 2568;
}

function termKey(year: number, semester: number) {
  return `${year}-${semester}`;
}

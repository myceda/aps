import Link from "next/link";
import { CurriculumSetup } from "@/components/student/CurriculumSetup";
import { CourseDependencyPanel } from "@/components/student/CourseDependencyPanel";
import { DashboardSummary } from "@/components/student/DashboardSummary";
import { GpaxSimulator } from "@/components/student/GpaxSimulator";
import { ReadinessPanel } from "@/components/student/ReadinessPanel";
import { RiskImpactPanel } from "@/components/student/RiskImpactPanel";
import { StudyPlanComparison } from "@/components/student/StudyPlanComparison";
import { TranscriptPreview } from "@/components/student/TranscriptPreview";
import { analyzeAcademicPlanFromDatabase } from "@/lib/analysis";
import { requireUser } from "@/lib/auth/session";
import { getStudentProgram } from "@/lib/db/repository";
import type { ProgramCode } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function StudentPage() {
  const user = await requireUser(["student", "admin"]);
  const studentProgram = await getStudentProgram(user.id);
  const programCode = (studentProgram?.program.code ?? "CS2565") as ProgramCode;
  const analysis = await analyzeAcademicPlanFromDatabase(programCode, user.id);

  return (
    <main className="min-h-screen">
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <p className="text-sm font-semibold text-teal">Student</p>
            <h1 className="text-2xl font-bold">Dashboard วิเคราะห์ผลการเรียน</h1>
          </div>
          <Link className="rounded-md border border-line px-4 py-2 text-sm font-semibold" href="/">
            หน้าแรก
          </Link>
        </div>
      </header>
      <div className="mx-auto grid max-w-7xl gap-5 px-6 py-6">
        <CurriculumSetup
          initialProgramCode={studentProgram?.program.code}
          initialStudentCode={studentProgram?.studentCode}
          initialTrack={studentProgram?.track}
        />
        <DashboardSummary analysis={analysis} />
        <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
          <StudyPlanComparison analysis={analysis} />
          <TranscriptPreview />
        </div>
        <RiskImpactPanel analysis={analysis} />
        <CourseDependencyPanel analysis={analysis} />
        <ReadinessPanel analysis={analysis} />
        <GpaxSimulator programCode={programCode} />
      </div>
    </main>
  );
}

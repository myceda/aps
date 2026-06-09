import { StudentDashboardShell } from "@/components/student/StudentDashboardShell";
import { analyzeAcademicPlanFromDatabase } from "@/lib/analysis";
import { requireUser } from "@/lib/auth/session";
import { getStudentProgram, resolveProgramCode, resolveTranscriptOwner } from "@/lib/db/repository";

export const dynamic = "force-dynamic";

type StudentPageProps = {
  searchParams?: Promise<{
    ownerEmail?: string;
  }>;
};

export default async function StudentPage({ searchParams }: StudentPageProps) {
  const user = await requireUser(["student", "admin"]);
  const params = await searchParams;
  const owner = await resolveTranscriptOwner(user, {
    ownerEmail: params?.ownerEmail
  });
  const studentProgram = await getStudentProgram(owner.id);
  const programCode = await resolveProgramCode(owner.id, studentProgram?.program.code);
  const selectedTrack = studentProgram?.track === "coop" ? "coop" : "research";
  const analysis = await analyzeAcademicPlanFromDatabase(programCode, owner.id, selectedTrack);

  return (
    <StudentDashboardShell
      analysis={analysis}
      programCode={programCode}
      studentCode={studentProgram?.studentCode}
      userEmail={owner.email}
      userName={owner.name}
    />
  );
}

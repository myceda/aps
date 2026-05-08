import type { PlanTrack as PrismaPlanTrack, Prisma, UserRole } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import type {
  Course,
  GradeMapping,
  PrerequisiteRule,
  Program,
  ProgramCode,
  ProgramStructure,
  Recommendation,
  RiskStatus,
  StudyPlanItem,
  TranscriptCourse,
  TranscriptSummary
} from "@/lib/types";

export type AnalysisData = {
  programs: Program[];
  courses: Course[];
  structures: ProgramStructure[];
  prerequisites: PrerequisiteRule[];
  studyPlan: StudyPlanItem[];
  gradeMappings: GradeMapping[];
  transcriptCourses: TranscriptCourse[];
  transcriptSummaries: TranscriptSummary[];
  summerOfferings: Set<string>;
};

export async function getAnalysisData(userId: number, programCode: ProgramCode): Promise<AnalysisData> {
  const latestUpload = await prisma.transcriptUpload.findFirst({
    where: { userId, parseStatus: "CONFIRMED" },
    orderBy: { createdAt: "desc" }
  });
  const transcriptWhere = latestUpload ? { userId, uploadId: latestUpload.id } : { userId };

  const [programs, courses, structures, prerequisites, studyPlan, gradeMappings, transcriptCourses, transcriptSummaries, offerings] =
    await Promise.all([
      prisma.program.findMany(),
      prisma.course.findMany({ include: { program: true } }),
      prisma.programStructure.findMany({ include: { program: true } }),
      prisma.prerequisite.findMany({ include: { course: true, prereqCourse: true } }),
      prisma.studyPlan.findMany({ include: { program: true, course: true } }),
      prisma.gradeMapping.findMany(),
      prisma.studentGrade.findMany({ where: transcriptWhere, orderBy: [{ academicYear: "asc" }, { semester: "asc" }, { id: "asc" }] }),
      prisma.transcriptSemesterSummary.findMany({ where: transcriptWhere, orderBy: [{ academicYear: "asc" }, { semester: "asc" }] }),
      prisma.courseOffering.findMany({ where: { isSummer: true }, include: { course: true } })
    ]);

  if (!programs.some((program) => program.code === programCode)) {
    throw new Error(`Unknown program in database: ${programCode}`);
  }

  return {
    programs: programs.map(mapProgram),
    courses: courses.map((course) => ({
      code: course.code,
      nameTh: course.nameTh,
      credits: course.credits,
      category: course.category,
      groupName: course.groupName ?? undefined,
      programCode: (course.program?.code as ProgramCode | undefined) ?? undefined
    })),
    structures: structures.map((structure) => ({
      programCode: structure.program.code as ProgramCode,
      category: structure.category,
      minCredits: structure.minCredits,
      description: structure.description ?? undefined
    })),
    prerequisites: prerequisites.map((rule) => ({
      courseCode: rule.course.code,
      prereqCourseCode: rule.prereqCourse.code,
      isCorequisite: rule.isCorequisite,
      conditionNote: rule.conditionNote ?? undefined
    })),
    studyPlan: studyPlan.map((plan) => ({
      programCode: plan.program.code as ProgramCode,
      yearLevel: plan.yearLevel,
      semester: plan.semester,
      track: plan.track ? mapPlanTrack(plan.track) : undefined,
      courseCode: plan.course?.code,
      placeholder: plan.placeholder ?? undefined,
      credits: plan.credits
    })),
    gradeMappings: gradeMappings.map((grade) => ({
      gradeChar: grade.gradeChar,
      gradePoint: Number(grade.gradePoint),
      isPassing: grade.isPassing,
      isAttempt: grade.isAttempt,
      isCredit: grade.isCredit
    })),
    transcriptCourses: transcriptCourses.map((grade) => ({
      courseCode: grade.courseCode,
      courseName: grade.courseName,
      credits: grade.credits,
      gradeChar: grade.gradeChar,
      semester: grade.semester,
      academicYear: grade.academicYear,
      sourceRow: grade.sourceRow ?? ""
    })),
    transcriptSummaries: transcriptSummaries.map((summary) => ({
      semester: summary.semester,
      academicYear: summary.academicYear,
      gpa: Number(summary.gpa),
      gpax: Number(summary.gpax),
      creditAttempt: Number(summary.creditAttempt),
      gradePoint: Number(summary.gradePoint)
    })),
    summerOfferings: new Set(offerings.map((offering) => offering.course.code).filter(Boolean)),
  };
}

export async function getCurriculumData() {
  const data = await getAnalysisData(await getDemoUserId(), "CS2565");
  return {
    programs: data.programs,
    courses: data.courses,
    structures: data.structures,
    prerequisites: data.prerequisites,
    studyPlan: data.studyPlan
  };
}

export async function getStudentProgram(userId: number) {
  const studentProgram = await prisma.studentProgram.findFirst({
    where: { userId },
    include: { program: true },
    orderBy: { createdAt: "desc" }
  });

  if (!studentProgram) return null;

  return {
    id: studentProgram.id,
    studentCode: studentProgram.studentCode,
    track: mapPlanTrack(studentProgram.track),
    program: mapProgram(studentProgram.program)
  };
}

export async function upsertStudentProgram(userId: number, input: { programCode: ProgramCode; studentCode: string; track: "research" | "coop" }) {
  const program = await prisma.program.findUniqueOrThrow({ where: { code: input.programCode } });
  const existing = await prisma.studentProgram.findFirst({ where: { userId } });
  const data = {
    userId,
    programId: program.id,
    studentCode: input.studentCode,
    track: input.track === "coop" ? "COOP" as const : "RESEARCH" as const
  };

  if (existing) {
    return prisma.studentProgram.update({ where: { id: existing.id }, data });
  }

  return prisma.studentProgram.create({ data });
}

export async function listCourseOfferings(programCode: ProgramCode, academicYear?: number, semester?: number) {
  const offerings = await prisma.courseOffering.findMany({
    where: {
      academicYear,
      semester,
      course: {
        OR: [{ program: { code: programCode } }, { programId: null }]
      }
    },
    include: { course: true },
    orderBy: [{ academicYear: "desc" }, { semester: "asc" }, { course: { code: "asc" } }]
  });

  return offerings.map((offering) => ({
    id: offering.id,
    academicYear: offering.academicYear,
    semester: offering.semester,
    isSummer: offering.isSummer,
    courseCode: offering.course.code,
    courseName: offering.course.nameTh,
    credits: offering.course.credits
  }));
}

export async function getDemoUserId() {
  const user = await prisma.user.findFirst({ where: { email: "demo.student@su.ac.th" } });
  if (!user) throw new Error("Demo user is missing. Run npm run prisma:seed first.");
  return user.id;
}

export async function createTranscriptUpload(userId: number, fileName: string, warningText: string | null) {
  return prisma.transcriptUpload.create({
    data: {
      userId,
      fileName,
      parseStatus: warningText ? "NEEDS_REVIEW" : "PENDING",
      warningText
    }
  });
}

export async function saveTranscriptPreview(userId: number, fileName: string, courses: TranscriptCourse[], summaries: TranscriptSummary[], uploadId?: number) {
  const upload = uploadId
    ? await prisma.transcriptUpload.update({
        where: { id: uploadId },
        data: { parseStatus: "CONFIRMED", warningText: null }
      })
    : await prisma.transcriptUpload.create({
        data: {
          userId,
          fileName,
          parseStatus: "CONFIRMED"
        }
      });

  await prisma.$transaction([
    prisma.studentGrade.deleteMany({ where: { userId, uploadId: upload.id } }),
    prisma.transcriptSemesterSummary.deleteMany({ where: { userId, uploadId: upload.id } }),
    prisma.studentGrade.createMany({
      data: courses.map((course) => ({
        userId,
        uploadId: upload.id,
        courseCode: course.courseCode,
        courseName: course.courseName,
        credits: course.credits,
        gradeChar: course.gradeChar,
        semester: course.semester,
        academicYear: course.academicYear,
        sourceRow: course.sourceRow
      }))
    }),
    prisma.transcriptSemesterSummary.createMany({
      data: summaries.map((summary) => ({
        userId,
        uploadId: upload.id,
        semester: summary.semester,
        academicYear: summary.academicYear,
        gpa: summary.gpa,
        gpax: summary.gpax,
        creditAttempt: summary.creditAttempt,
        gradePoint: summary.gradePoint
      })),
      skipDuplicates: true
    })
  ]);

  return upload;
}

export async function saveAnalysisResult(userId: number, riskStatus: RiskStatus, summary: string, recommendations: Recommendation[]) {
  return prisma.analysisResult.create({
    data: {
      userId,
      riskStatus,
      summary,
      recommendations: {
        create: recommendations.map((recommendation) => ({
          message: recommendation.message,
          reason: recommendation.reason,
          priority: recommendation.priority
        }))
      }
    },
    include: { recommendations: true }
  });
}

export async function deleteTranscriptData(userId: number) {
  return prisma.$transaction([
    prisma.studentGrade.deleteMany({ where: { userId } }),
    prisma.transcriptSemesterSummary.deleteMany({ where: { userId } }),
    prisma.analysisResult.deleteMany({ where: { userId } }),
    prisma.transcriptUpload.deleteMany({ where: { userId } })
  ]);
}

export async function upsertUserByEmail(email: string, name: string, role: UserRole) {
  return prisma.user.upsert({
    where: { email },
    create: { email, name, role },
    update: { name, role }
  });
}

function mapProgram(program: Prisma.ProgramGetPayload<object>): Program {
  return {
    code: program.code as ProgramCode,
    nameTh: program.nameTh,
    nameEn: program.nameEn,
    academicYear: program.academicYear,
    totalCreditsMin: program.totalCreditsMin,
    honorFirstClassMin: Number(program.honorFirstClassMin),
    honorSecondClassMin: Number(program.honorSecondClassMin)
  };
}

function mapPlanTrack(track: PrismaPlanTrack) {
  return track === "COOP" ? "coop" : "research";
}

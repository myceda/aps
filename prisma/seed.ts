import { PrismaClient, UserRole } from "@prisma/client";
import {
  demoCourses,
  demoPrerequisites,
  demoPrograms,
  demoStructures,
  demoStudyPlan,
  demoTranscriptCourses,
  demoTranscriptSummaries,
  gradeMappings,
  summerOfferings
} from "../src/data/demo-data";

const prisma = new PrismaClient();

async function main() {
  for (const program of demoPrograms) {
    await prisma.program.upsert({
      where: { code: program.code },
      create: {
        code: program.code,
        nameTh: program.nameTh,
        nameEn: program.nameEn,
        academicYear: program.academicYear,
        totalCreditsMin: program.totalCreditsMin,
        honorFirstClassMin: program.honorFirstClassMin,
        honorSecondClassMin: program.honorSecondClassMin
      },
      update: {
        nameTh: program.nameTh,
        nameEn: program.nameEn,
        academicYear: program.academicYear,
        totalCreditsMin: program.totalCreditsMin,
        honorFirstClassMin: program.honorFirstClassMin,
        honorSecondClassMin: program.honorSecondClassMin
      }
    });
  }

  for (const grade of gradeMappings) {
    await prisma.gradeMapping.upsert({
      where: { gradeChar: grade.gradeChar },
      create: grade,
      update: grade
    });
  }

  for (const course of demoCourses) {
    const program = course.programCode
      ? await prisma.program.findUniqueOrThrow({ where: { code: course.programCode } })
      : null;
    const existing = await prisma.course.findFirst({
      where: { code: course.code, programId: program?.id ?? null }
    });

    const data = {
      code: course.code,
      nameTh: course.nameTh,
      credits: course.credits,
      category: course.category,
      groupName: course.groupName ?? null,
      programId: program?.id ?? null
    };

    if (existing) {
      await prisma.course.update({ where: { id: existing.id }, data });
    } else {
      await prisma.course.create({ data });
    }
  }

  for (const structure of demoStructures) {
    const program = await prisma.program.findUniqueOrThrow({ where: { code: structure.programCode } });
    const existing = await prisma.programStructure.findFirst({
      where: { programId: program.id, category: structure.category }
    });
    const data = {
      programId: program.id,
      category: structure.category,
      minCredits: structure.minCredits,
      description: structure.description ?? null
    };

    if (existing) {
      await prisma.programStructure.update({ where: { id: existing.id }, data });
    } else {
      await prisma.programStructure.create({ data });
    }
  }

  for (const plan of demoStudyPlan) {
    const program = await prisma.program.findUniqueOrThrow({ where: { code: plan.programCode } });
    const course = plan.courseCode ? await findCourseForProgram(plan.courseCode, program.id) : null;
    const existing = await prisma.studyPlan.findFirst({
      where: {
        programId: program.id,
        courseId: course?.id ?? null,
        yearLevel: plan.yearLevel,
        semester: plan.semester,
        track: plan.track === "coop" ? "COOP" : plan.track === "research" ? "RESEARCH" : null
      }
    });
    const data = {
      programId: program.id,
      courseId: course?.id ?? null,
      yearLevel: plan.yearLevel,
      semester: plan.semester,
      track: plan.track === "coop" ? "COOP" : plan.track === "research" ? "RESEARCH" : null,
      placeholder: plan.placeholder ?? null,
      credits: plan.credits
    } as const;

    if (existing) {
      await prisma.studyPlan.update({ where: { id: existing.id }, data });
    } else {
      await prisma.studyPlan.create({ data });
    }
  }

  for (const prereq of demoPrerequisites) {
    const course = await findCourseByCode(prereq.courseCode);
    const prereqCourse = await findCourseByCode(prereq.prereqCourseCode);
    if (!course || !prereqCourse) continue;

    await prisma.prerequisite.upsert({
      where: { courseId_prereqCourseId: { courseId: course.id, prereqCourseId: prereqCourse.id } },
      create: {
        courseId: course.id,
        prereqCourseId: prereqCourse.id,
        isCorequisite: prereq.isCorequisite ?? false,
        conditionNote: prereq.conditionNote ?? null
      },
      update: {
        isCorequisite: prereq.isCorequisite ?? false,
        conditionNote: prereq.conditionNote ?? null
      }
    });
  }

  for (const code of summerOfferings) {
    const course = await findCourseByCode(code);
    if (!course) continue;
    await prisma.courseOffering.upsert({
      where: { courseId_academicYear_semester: { courseId: course.id, academicYear: 2567, semester: 3 } },
      create: { courseId: course.id, academicYear: 2567, semester: 3, isSummer: true },
      update: { isSummer: true }
    });
  }

  const offeringPlans = demoStudyPlan.filter((plan) => plan.courseCode && plan.semester !== 3);
  for (const plan of offeringPlans) {
    const course = await findCourseByCode(plan.courseCode!);
    if (!course) continue;
    await prisma.courseOffering.upsert({
      where: { courseId_academicYear_semester: { courseId: course.id, academicYear: 2568, semester: plan.semester } },
      create: { courseId: course.id, academicYear: 2568, semester: plan.semester, isSummer: false },
      update: { isSummer: false }
    });
  }

  const adminEmail = process.env.ADMIN_EMAIL ?? process.env.ADMIN_EMAILS?.split(",")[0] ?? "ceda.isme@gmail.com";
  await prisma.user.upsert({
    where: { email: adminEmail },
    create: { email: adminEmail, name: "System Admin", role: UserRole.ADMIN },
    update: { role: UserRole.ADMIN }
  });

  const demoUser = await prisma.user.upsert({
    where: { email: "demo.student@su.ac.th" },
    create: { email: "demo.student@su.ac.th", name: "Demo Student", role: UserRole.STUDENT },
    update: { name: "Demo Student", role: UserRole.STUDENT }
  });
  const csProgram = await prisma.program.findUniqueOrThrow({ where: { code: "CS2565" } });
  await prisma.studentProgram.upsert({
    where: { id: 1 },
    create: { userId: demoUser.id, programId: csProgram.id, studentCode: "650710578", track: "RESEARCH" },
    update: { userId: demoUser.id, programId: csProgram.id, studentCode: "650710578", track: "RESEARCH" }
  });

  await prisma.studentGrade.deleteMany({ where: { userId: demoUser.id } });
  await prisma.transcriptSemesterSummary.deleteMany({ where: { userId: demoUser.id } });
  await prisma.transcriptUpload.deleteMany({ where: { userId: demoUser.id, fileName: "CS_F_demo_seed.pdf" } });
  const demoUpload = await prisma.transcriptUpload.create({
    data: {
      userId: demoUser.id,
      fileName: "CS_F_demo_seed.pdf",
      parseStatus: "CONFIRMED"
    }
  });
  await prisma.studentGrade.createMany({
    data: demoTranscriptCourses.map((course) => ({
      userId: demoUser.id,
      uploadId: demoUpload.id,
      courseId: null,
      courseCode: course.courseCode,
      courseName: course.courseName,
      credits: course.credits,
      gradeChar: course.gradeChar,
      semester: course.semester,
      academicYear: course.academicYear,
      sourceRow: course.sourceRow
    }))
  });
  await prisma.transcriptSemesterSummary.createMany({
    data: demoTranscriptSummaries.map((summary) => ({
      userId: demoUser.id,
      uploadId: demoUpload.id,
      semester: summary.semester,
      academicYear: summary.academicYear,
      gpa: summary.gpa,
      gpax: summary.gpax,
      creditAttempt: summary.creditAttempt,
      gradePoint: summary.gradePoint
    }))
  });

  console.log("Seed complete: programs, courses, rules, demo student transcript");
}

async function findCourseForProgram(code: string, programId: number) {
  return prisma.course.findFirst({
    where: {
      code,
      OR: [{ programId }, { programId: null }]
    },
    orderBy: { programId: "desc" }
  });
}

async function findCourseByCode(code: string) {
  return prisma.course.findFirst({ where: { code } });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

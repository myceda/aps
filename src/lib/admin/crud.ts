import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";

export const adminResources = [
  "programs",
  "courses",
  "structures",
  "study-plans",
  "prerequisites",
  "rules",
  "offerings"
] as const;

export type AdminResource = (typeof adminResources)[number];

export function isAdminResource(value: string): value is AdminResource {
  return adminResources.includes(value as AdminResource);
}

export async function listResource(resource: AdminResource) {
  switch (resource) {
    case "programs":
      return prisma.program.findMany({ orderBy: { code: "asc" } });
    case "courses":
      return prisma.course.findMany({ include: { program: true }, orderBy: { code: "asc" } });
    case "structures":
      return prisma.programStructure.findMany({ include: { program: true }, orderBy: { id: "asc" } });
    case "study-plans":
      return prisma.studyPlan.findMany({ include: { program: true, course: true }, orderBy: [{ programId: "asc" }, { yearLevel: "asc" }, { semester: "asc" }] });
    case "prerequisites":
      return prisma.prerequisite.findMany({ include: { course: true, prereqCourse: true }, orderBy: { id: "asc" } });
    case "rules":
      return prisma.rule.findMany({ include: { program: true }, orderBy: { code: "asc" } });
    case "offerings":
      return prisma.courseOffering.findMany({ include: { course: true }, orderBy: [{ academicYear: "desc" }, { semester: "asc" }] });
  }
}

export async function createResource(resource: AdminResource, input: Record<string, unknown>) {
  const data = await buildData(resource, input);
  switch (resource) {
    case "programs":
      return prisma.program.create({ data: data as Prisma.ProgramCreateInput });
    case "courses":
      return prisma.course.create({ data: data as Prisma.CourseCreateInput });
    case "structures":
      return prisma.programStructure.create({ data: data as Prisma.ProgramStructureCreateInput });
    case "study-plans":
      return prisma.studyPlan.create({ data: data as Prisma.StudyPlanCreateInput });
    case "prerequisites":
      return prisma.prerequisite.create({ data: data as Prisma.PrerequisiteCreateInput });
    case "rules":
      return prisma.rule.create({ data: data as Prisma.RuleCreateInput });
    case "offerings":
      return prisma.courseOffering.create({ data: data as Prisma.CourseOfferingCreateInput });
  }
}

export async function updateResource(resource: AdminResource, id: number, input: Record<string, unknown>) {
  const data = await buildData(resource, input);
  switch (resource) {
    case "programs":
      return prisma.program.update({ where: { id }, data: data as Prisma.ProgramUpdateInput });
    case "courses":
      return prisma.course.update({ where: { id }, data: data as Prisma.CourseUpdateInput });
    case "structures":
      return prisma.programStructure.update({ where: { id }, data: data as Prisma.ProgramStructureUpdateInput });
    case "study-plans":
      return prisma.studyPlan.update({ where: { id }, data: data as Prisma.StudyPlanUpdateInput });
    case "prerequisites":
      return prisma.prerequisite.update({ where: { id }, data: data as Prisma.PrerequisiteUpdateInput });
    case "rules":
      return prisma.rule.update({ where: { id }, data: data as Prisma.RuleUpdateInput });
    case "offerings":
      return prisma.courseOffering.update({ where: { id }, data: data as Prisma.CourseOfferingUpdateInput });
  }
}

export async function deleteResource(resource: AdminResource, id: number) {
  switch (resource) {
    case "programs":
      return prisma.program.delete({ where: { id } });
    case "courses":
      return prisma.course.delete({ where: { id } });
    case "structures":
      return prisma.programStructure.delete({ where: { id } });
    case "study-plans":
      return prisma.studyPlan.delete({ where: { id } });
    case "prerequisites":
      return prisma.prerequisite.delete({ where: { id } });
    case "rules":
      return prisma.rule.delete({ where: { id } });
    case "offerings":
      return prisma.courseOffering.delete({ where: { id } });
  }
}

async function buildData(resource: AdminResource, input: Record<string, unknown>) {
  switch (resource) {
    case "programs":
      return {
        code: requireString(input, "code"),
        nameTh: requireString(input, "nameTh"),
        nameEn: requireString(input, "nameEn"),
        academicYear: requireNumber(input, "academicYear"),
        totalCreditsMin: requireNumber(input, "totalCreditsMin"),
        honorFirstClassMin: requireNumber(input, "honorFirstClassMin"),
        honorSecondClassMin: requireNumber(input, "honorSecondClassMin")
      };
    case "courses": {
      const programCode = optionalString(input, "programCode");
      return {
        code: requireString(input, "code"),
        nameTh: requireString(input, "nameTh"),
        nameEn: optionalString(input, "nameEn"),
        credits: requireNumber(input, "credits"),
        category: requireString(input, "category"),
        groupName: optionalString(input, "groupName"),
        program: programCode ? { connect: { code: programCode } } : undefined
      };
    }
    case "structures":
      return {
        program: { connect: { code: requireString(input, "programCode") } },
        category: requireString(input, "category"),
        minCredits: requireNumber(input, "minCredits"),
        description: optionalString(input, "description")
      };
    case "study-plans": {
      const courseCode = optionalString(input, "courseCode");
      return {
        program: { connect: { code: requireString(input, "programCode") } },
        course: courseCode ? { connect: { id: await getCourseId(courseCode, optionalString(input, "programCode")) } } : undefined,
        yearLevel: requireNumber(input, "yearLevel"),
        semester: requireNumber(input, "semester"),
        track: optionalTrack(input, "track"),
        placeholder: optionalString(input, "placeholder"),
        credits: requireNumber(input, "credits")
      };
    }
    case "prerequisites":
      return {
        course: { connect: { id: await getCourseId(requireString(input, "courseCode")) } },
        prereqCourse: { connect: { id: await getCourseId(requireString(input, "prereqCourseCode")) } },
        isCorequisite: Boolean(input.isCorequisite ?? false),
        conditionNote: optionalString(input, "conditionNote")
      };
    case "rules": {
      const programCode = optionalString(input, "programCode");
      return {
        program: programCode ? { connect: { code: programCode } } : undefined,
        code: requireString(input, "code"),
        name: requireString(input, "name"),
        description: requireString(input, "description")
      };
    }
    case "offerings":
      return {
        course: { connect: { id: await getCourseId(requireString(input, "courseCode")) } },
        academicYear: requireNumber(input, "academicYear"),
        semester: requireNumber(input, "semester"),
        isSummer: Boolean(input.isSummer ?? false)
      };
  }
}

async function getCourseId(code: string, programCode?: string) {
  const program = programCode ? await prisma.program.findUnique({ where: { code: programCode } }) : null;
  const course = await prisma.course.findFirst({
    where: {
      code,
      OR: program ? [{ programId: program.id }, { programId: null }] : undefined
    },
    orderBy: { programId: "desc" }
  });

  if (!course) throw new Error(`Course not found: ${code}`);
  return course.id;
}

function requireString(input: Record<string, unknown>, key: string) {
  const value = input[key];
  if (typeof value !== "string" || value.trim() === "") throw new Error(`${key} is required`);
  return value.trim();
}

function optionalString(input: Record<string, unknown>, key: string) {
  const value = input[key];
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function requireNumber(input: Record<string, unknown>, key: string) {
  const value = input[key];
  const number = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(number)) throw new Error(`${key} must be a number`);
  return number;
}

function optionalTrack(input: Record<string, unknown>, key: string) {
  const value = optionalString(input, key)?.toUpperCase();
  if (value === "RESEARCH" || value === "COOP") return value;
  return undefined;
}

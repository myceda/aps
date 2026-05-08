export type UserRole = "student" | "admin";
export type ProgramCode = "CS2565" | "IT2565";
export type PlanTrack = "research" | "coop";
export type GradeStatus = "passed" | "failed" | "withdrawn" | "not_taken" | "non_credit";
export type RiskStatus = "normal" | "watch" | "urgent";

export type Program = {
  code: ProgramCode;
  nameTh: string;
  nameEn: string;
  academicYear: number;
  totalCreditsMin: number;
  honorFirstClassMin: number;
  honorSecondClassMin: number;
};

export type Course = {
  code: string;
  nameTh: string;
  credits: number;
  category: string;
  groupName?: string;
  programCode?: ProgramCode;
};

export type ProgramStructure = {
  programCode: ProgramCode;
  category: string;
  minCredits: number;
  description?: string;
};

export type StudyPlanItem = {
  programCode: ProgramCode;
  yearLevel: number;
  semester: number;
  track?: PlanTrack;
  courseCode?: string;
  placeholder?: string;
  credits: number;
};

export type PrerequisiteRule = {
  courseCode: string;
  prereqCourseCode: string;
  isCorequisite?: boolean;
  conditionNote?: string;
};

export type GradeMapping = {
  gradeChar: string;
  gradePoint: number;
  isPassing: boolean;
  isAttempt: boolean;
  isCredit: boolean;
};

export type TranscriptCourse = {
  courseCode: string;
  courseName: string;
  credits: number;
  gradeChar: string;
  semester: number;
  academicYear: number;
  sourceRow: string;
};

export type TranscriptSummary = {
  semester: number;
  academicYear: number;
  gpa: number;
  gpax: number;
  creditAttempt: number;
  gradePoint: number;
};

export type TranscriptPreview = {
  courses: TranscriptCourse[];
  summaries: TranscriptSummary[];
  warnings: string[];
  canConfirm: boolean;
};

export type CourseStatus = {
  courseCode: string;
  courseName: string;
  category: string;
  credits: number;
  status: GradeStatus;
  bestGrade?: string;
  attempts: TranscriptCourse[];
  reason: string;
};

export type CategoryProgress = {
  category: string;
  earnedCredits: number;
  requiredCredits: number;
  remainingCredits: number;
};

export type PrerequisiteImpact = {
  blockedCourseCode: string;
  blockedCourseName: string;
  failedPrereqCode: string;
  plannedYear: number;
  plannedSemester: number;
  hasSummerOffering: boolean;
  recommendation: string;
};

export type CourseDependency = {
  courseCode: string;
  courseName: string;
  courseStatus: GradeStatus;
  prerequisiteCode: string;
  prerequisiteName: string;
  prerequisiteStatus: GradeStatus;
  isCorequisite: boolean;
  isBlocking: boolean;
  plannedYear?: number;
  plannedSemester?: number;
  note?: string;
};

export type ReadinessCheck = {
  name: string;
  status: RiskStatus;
  detail: string;
};

export type Recommendation = {
  message: string;
  reason: string;
  priority: number;
};

export type AnalysisResult = {
  gpax: number;
  latestGpa: number;
  earnedCredits: number;
  totalCreditsMin: number;
  missingCredits: number;
  riskStatus: RiskStatus;
  categoryProgress: CategoryProgress[];
  courseStatuses: CourseStatus[];
  prerequisiteImpacts: PrerequisiteImpact[];
  courseDependencies: CourseDependency[];
  readiness: ReadinessCheck[];
  recommendations: Recommendation[];
};

export type SimulationCourseInput = {
  courseCode: string;
  credits: number;
  expectedGradeChar: string;
};

export type SimulationResult = {
  currentGpax: number;
  targetGpax: number;
  simulatedGpax: number;
  reachesTarget: boolean;
  requiredAverageForRemaining?: number;
};

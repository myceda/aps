export type UserRole = "student" | "admin";
export type ProgramCode = string;
export type PlanTrack = "research" | "coop";
export type GradeStatus = "passed" | "failed" | "withdrawn" | "incomplete" | "not_taken" | "non_credit";
export type RiskStatus = "normal" | "watch" | "urgent";
export type ProStatusLevel = "normal" | "high_probation" | "low_probation" | "risk_next_term";
export type AcademicEligibilityState =
  | "not_eligible"
  | "eligible_now"
  | "eligible_if_pending_passed"
  | "forecast_eligible";
export type RegGraduationStatus = "not_found" | "applied" | "approved";
export type TrackRequirementState = "passed" | "pending" | "missing";
export type GraduationReadiness =
  | "not_ready"
  | "ready_to_apply"
  | "applied_pending_result"
  | "approved"
  | "pending_incomplete_grade";

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

export type CourseOffering = {
  courseCode: string;
  academicYear: number;
  semester: number;
  isSummer?: boolean;
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
  validationSeverity?: "ok" | "warning" | "error";
  validationMessages?: string[];
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

export type TrackRequirementCourse = {
  courseCode: string;
  courseName: string;
  credits: number;
  status: GradeStatus;
  reason: string;
};

export type TrackRequirementResult = {
  track: PlanTrack;
  label: string;
  state: TrackRequirementState;
  isSatisfied: boolean;
  requiredCourses: TrackRequirementCourse[];
  missingCourseCodes: string[];
  pendingCourseCodes: string[];
  detail: string;
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

export type ProStatusReason = {
  title: string;
  detail: string;
  severity: RiskStatus;
};

export type ProStatus = {
  level: ProStatusLevel;
  label: string;
  tone: RiskStatus;
  summary: string;
  reasons: ProStatusReason[];
  nextActions: string[];
};

export type GraduationForecastCourse = {
  courseCode: string;
  courseName: string;
  credits: number;
  category: string;
  reason: string;
};

export type GraduationForecastTerm = {
  academicYear: number;
  semester: number;
  creditLimit: number;
  plannedCredits: number;
  courses: GraduationForecastCourse[];
};

export type GraduationForecast = {
  canGraduate: boolean;
  expectedAcademicYear?: number;
  expectedSemester?: number;
  condition?: "completed" | "pending_current_courses" | "planned_remaining_courses" | "blocked";
  conditionLabel?: string;
  conditionDetail?: string;
  remainingCredits: number;
  pendingCredits: number;
  plannedCredits: number;
  terms: GraduationForecastTerm[];
  pendingCourses: GraduationForecastCourse[];
  blockedCourses: GraduationForecastCourse[];
  notes: string[];
};

export type GraduationReadinessResult = {
  state: GraduationReadiness;
  label: string;
  detail: string;
  tone: RiskStatus;
  pendingCourseCodes: string[];
  expectedAcademicYear?: number;
  expectedSemester?: number;
};

export type AcademicEligibilityResult = {
  state: AcademicEligibilityState;
  label: string;
  detail: string;
  tone: RiskStatus;
  pendingCourseCodes: string[];
  trackRequirement: TrackRequirementResult;
  expectedAcademicYear?: number;
  expectedSemester?: number;
};

export type RegGraduationStatusResult = {
  status: RegGraduationStatus;
  label: string;
  detail: string;
  note: string;
  source: "reg" | "manual" | "missing";
};

export type WhatIfSimulationInput = {
  withdrawCourseCode?: string;
  addCourseCode?: string;
  failCourseCode?: string;
  academicYear: number;
  semester: number;
};

export type WhatIfSimulationResult = {
  baselineForecast: GraduationForecast;
  simulatedForecast: GraduationForecast;
  graduationDelayTerms: number | null;
  unlockedCourses: GraduationForecastCourse[];
  newlyBlockedCourses: GraduationForecastCourse[];
  summary: string;
  notes: string[];
};

export type AnalysisResult = {
  gpax: number;
  latestGpa: number;
  earnedCredits: number;
  totalCreditsMin: number;
  missingCredits: number;
  riskStatus: RiskStatus;
  proStatus: ProStatus;
  categoryProgress: CategoryProgress[];
  courseStatuses: CourseStatus[];
  prerequisiteImpacts: PrerequisiteImpact[];
  courseDependencies: CourseDependency[];
  readiness: ReadinessCheck[];
  graduationForecast: GraduationForecast;
  trackRequirement: TrackRequirementResult;
  academicEligibility: AcademicEligibilityResult;
  regGraduationStatus: RegGraduationStatusResult;
  graduationReadiness: GraduationReadinessResult;
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

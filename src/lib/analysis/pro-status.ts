import type { CourseStatus, PrerequisiteImpact, ProStatus, ProStatusReason } from "@/lib/types";

type ProStatusInput = {
  gpax: number;
  latestGpa: number;
  earnedCredits: number;
  totalCreditsMin: number;
  courseStatuses: CourseStatus[];
  prerequisiteImpacts: PrerequisiteImpact[];
};

const GPAX_PRO_HIGH = 1.8;
const GPAX_PRO_LOW = 2.0;
const GPAX_RISK_NEXT_TERM = 2.15;
const LATEST_GPA_RISK_NEXT_TERM = 2.0;
const MIN_CREDITS_PER_TERM = 9;

export function evaluateProStatus(input: ProStatusInput): ProStatus {
  const reasons: ProStatusReason[] = [];
  const nextActions: string[] = [];
  const blockedByPrerequisite = input.prerequisiteImpacts.length;
  const failedOrWithdrawnCourses = input.courseStatuses.filter((course) => course.status === "failed" || course.status === "withdrawn");
  const incompleteCourses = input.courseStatuses.filter((course) => course.status === "incomplete");
  const completedTermCount = countCompletedTerms(input.courseStatuses);
  const expectedCredits = Math.min(input.totalCreditsMin, completedTermCount * MIN_CREDITS_PER_TERM);
  const lowCreditGap = Math.max(expectedCredits - input.earnedCredits, 0);

  if (input.gpax > 0 && input.gpax < GPAX_PRO_HIGH) {
    reasons.push({
      title: "GPAX ต่ำกว่าเกณฑ์โปรสูง",
      detail: `GPAX ปัจจุบัน ${input.gpax.toFixed(2)} ต่ำกว่า ${GPAX_PRO_HIGH.toFixed(2)}`,
      severity: "urgent"
    });
    nextActions.push("ต้องจัดแผนเรียนซ้ำและลดความเสี่ยงก่อนลงวิชาตัวต่อ");
  } else if (input.gpax > 0 && input.gpax < GPAX_PRO_LOW) {
    reasons.push({
      title: "GPAX อยู่ในช่วงโปรต่ำ",
      detail: `GPAX ปัจจุบัน ${input.gpax.toFixed(2)} ต่ำกว่า ${GPAX_PRO_LOW.toFixed(2)}`,
      severity: "urgent"
    });
    nextActions.push("ควรจำลองเกรดเทอมถัดไปและเลือกวิชาที่ช่วยดึง GPAX กลับขึ้นก่อน");
  } else if (input.gpax > 0 && input.gpax < GPAX_RISK_NEXT_TERM) {
    reasons.push({
      title: "GPAX ใกล้เกณฑ์โปรต่ำ",
      detail: `GPAX ปัจจุบัน ${input.gpax.toFixed(2)} ยังสูงกว่าเกณฑ์ แต่มีพื้นที่กันชนไม่มาก`,
      severity: "watch"
    });
    nextActions.push("ควรวางแผนเทอมถัดไปให้ภาระเรียนเหมาะสมและหลีกเลี่ยงวิชาที่เสี่ยงตกซ้ำ");
  }

  if (input.latestGpa > 0 && input.latestGpa < LATEST_GPA_RISK_NEXT_TERM) {
    reasons.push({
      title: "GPA เทอมล่าสุดต่ำ",
      detail: `GPA เทอมล่าสุด ${input.latestGpa.toFixed(2)} ต่ำกว่า ${LATEST_GPA_RISK_NEXT_TERM.toFixed(2)} หากเทอมถัดไปยังต่ำอาจเสี่ยงโปรต่ำ`,
      severity: input.gpax < GPAX_PRO_LOW ? "urgent" : "watch"
    });
    nextActions.push("ตรวจวิชาเทอมล่าสุดที่ทำให้ GPA ลด แล้วเลือกวิชาเทอมถัดไปอย่างระมัดระวัง");
  }

  if (lowCreditGap >= 9) {
    reasons.push({
      title: "หน่วยกิตผ่านน้อยกว่าแผน",
      detail: `ผ่านแล้ว ${input.earnedCredits} หน่วยกิต จากขั้นต่ำที่ควรมีประมาณ ${expectedCredits} หน่วยกิต`,
      severity: lowCreditGap >= 18 ? "urgent" : "watch"
    });
    nextActions.push("เพิ่มแผนเรียนซ้ำหรือเทอม 3/Summer สำหรับวิชาที่เปิดสอน เพื่อลดช่องว่างหน่วยกิต");
  }

  if (incompleteCourses.length > 0) {
    reasons.push({
      title: "มีวิชารอเกรด",
      detail: `พบ ${incompleteCourses.length} วิชาที่เป็นเกรด I ต้องรอเกรดจริงก่อนนับว่าผ่าน`,
      severity: "watch"
    });
    nextActions.push("ติดตามเกรด I และอัปเดตผลการเรียนอีกครั้งเมื่ออาจารย์ประกาศเกรดจริง");
  }

  if (blockedByPrerequisite > 0) {
    reasons.push({
      title: "ถอนหรือตกวิชาที่เป็นตัวต่อ",
      detail: `พบ ${blockedByPrerequisite} รายการที่กระทบวิชาบังคับก่อนและอาจทำให้แผนจบเลื่อน`,
      severity: "urgent"
    });
    nextActions.push("ให้ลงวิชาบังคับก่อนที่ยังไม่ผ่านก่อนวิชาตัวต่อทุกครั้ง");
  } else if (failedOrWithdrawnCourses.length > 0) {
    reasons.push({
      title: "มีวิชาที่ถอนหรือตก",
      detail: `พบ ${failedOrWithdrawnCourses.length} วิชาที่ยังต้องติดตาม แม้ยังไม่พบผลกระทบตัวต่อโดยตรง`,
      severity: "watch"
    });
    nextActions.push("ตรวจว่าวิชาที่ถอนหรือตกเปิดสอนเทอมใด แล้ววางแผนเรียนซ้ำให้เร็วที่สุด");
  }

  return buildStatus(reasons, nextActions);
}

function buildStatus(reasons: ProStatusReason[], nextActions: string[]): ProStatus {
  const hasHighProbationReason = reasons.some((reason) => reason.title === "GPAX ต่ำกว่าเกณฑ์โปรสูง");
  const hasLowProbationReason = reasons.some((reason) => reason.title === "GPAX อยู่ในช่วงโปรต่ำ");
  const urgentReasonCount = reasons.filter((reason) => reason.severity === "urgent").length;
  const watchReasonCount = reasons.filter((reason) => reason.severity === "watch").length;

  if (hasHighProbationReason || urgentReasonCount >= 2) {
    return {
      level: "high_probation",
      label: "โปรสูง",
      tone: "urgent",
      summary: "นักศึกษาอยู่ในกลุ่มเสี่ยงสูง ต้องรีบปรับแผนเรียนและแก้รายวิชาที่กระทบตัวต่อ",
      reasons,
      nextActions: uniqueActions(nextActions)
    };
  }

  if (hasLowProbationReason || urgentReasonCount === 1) {
    return {
      level: "low_probation",
      label: "โปรต่ำ",
      tone: "urgent",
      summary: "นักศึกษาอยู่ในกลุ่มโปรต่ำ ควรเน้นแผนฟื้น GPAX และลดวิชาที่เสี่ยงตกซ้ำ",
      reasons,
      nextActions: uniqueActions(nextActions)
    };
  }

  if (watchReasonCount > 0) {
    return {
      level: "risk_next_term",
      label: "เสี่ยงโปรต่ำในเทอมถัดไป",
      tone: "watch",
      summary: "ยังไม่เข้าโปรต่ำ แต่มีสัญญาณที่ควรติดตามก่อนลงทะเบียนเทอมถัดไป",
      reasons,
      nextActions: uniqueActions(nextActions)
    };
  }

  return {
    level: "normal",
    label: "ปกติ",
    tone: "normal",
    summary: "ผลการเรียนยังไม่พบสัญญาณเสี่ยงหลักตามเกณฑ์ที่ระบบตรวจ",
    reasons: [
      {
        title: "ไม่พบสัญญาณเสี่ยงหลัก",
        detail: "GPAX, GPA เทอมล่าสุด, หน่วยกิตผ่าน และวิชาบังคับก่อนยังอยู่ในระดับที่ระบบประเมินว่าติดตามได้ตามปกติ",
        severity: "normal"
      }
    ],
    nextActions: ["ติดตาม GPAX และแผนรายเทอมต่อเนื่องหลังอัปโหลด transcript ครั้งถัดไป"]
  };
}

function countCompletedTerms(courseStatuses: CourseStatus[]) {
  const terms = new Set<string>();

  for (const course of courseStatuses) {
    for (const attempt of course.attempts) {
      if (attempt.academicYear && attempt.semester) {
        terms.add(`${attempt.academicYear}-${attempt.semester}`);
      }
    }
  }

  return terms.size;
}

function uniqueActions(actions: string[]) {
  return Array.from(new Set(actions)).slice(0, 4);
}

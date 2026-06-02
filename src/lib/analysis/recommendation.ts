import type { AnalysisResult, Recommendation } from "@/lib/types";

export function buildRecommendations(result: Omit<AnalysisResult, "recommendations">): Recommendation[] {
  const recommendations: Recommendation[] = [];

  if (result.proStatus.level === "high_probation" || result.proStatus.level === "low_probation") {
    recommendations.push({
      message: `จัดแผนฟื้นสถานะ ${result.proStatus.label} ก่อนลงวิชาหนักในเทอมถัดไป`,
      reason: result.proStatus.reasons.slice(0, 2).map((reason) => reason.title).join(", "),
      priority: 1
    });
  } else if (result.proStatus.level === "risk_next_term") {
    recommendations.push({
      message: "ตรวจแผนเทอมถัดไปเพื่อลดความเสี่ยงโปรต่ำ",
      reason: result.proStatus.reasons.slice(0, 2).map((reason) => reason.title).join(", "),
      priority: 2
    });
  }

  for (const impact of result.prerequisiteImpacts) {
    recommendations.push({
      message: impact.recommendation,
      reason: `${impact.failedPrereqCode} เคยได้ F/W และเป็นวิชาบังคับก่อนของ ${impact.blockedCourseCode}`,
      priority: impact.hasSummerOffering ? 1 : 2
    });
  }

  const missingRequired = result.courseStatuses.filter(
    (course) => course.category === "วิชาบังคับ" && course.status !== "passed"
  );
  if (missingRequired.length > 0) {
    recommendations.push({
      message: `จัดลำดับลงวิชาบังคับที่ยังไม่ผ่าน ${missingRequired.slice(0, 3).map((course) => course.courseCode).join(", ")}`,
      reason: "วิชาบังคับเป็นเงื่อนไขหลักของการจบการศึกษา",
      priority: 2
    });
  }

  if (result.gpax < 3.25) {
    recommendations.push({
      message: "ใช้ GPAX simulator เพื่อดูเกรดเฉลี่ยที่ควรทำในเทอมถัดไป",
      reason: "GPAX ปัจจุบันยังต่ำกว่าเกณฑ์เกียรตินิยมอันดับสอง",
      priority: 3
    });
  }

  return recommendations.sort((a, b) => a.priority - b.priority);
}

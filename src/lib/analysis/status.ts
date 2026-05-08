import { gradeMappings } from "@/data/demo-data";
import type { GradeMapping, GradeStatus, TranscriptCourse, TranscriptSummary } from "@/lib/types";

const mappingByGrade = createGradeMap(gradeMappings);

export function createGradeMap(mappings: GradeMapping[]) {
  return new Map<string, GradeMapping>(mappings.map((grade) => [grade.gradeChar, grade]));
}

export function getGradeMapping(gradeChar: string, gradeMap = mappingByGrade): GradeMapping {
  return (
    gradeMap.get(gradeChar) ?? {
      gradeChar,
      gradePoint: 0,
      isPassing: false,
      isAttempt: true,
      isCredit: false
    }
  );
}

export function getCourseStatus(attempts: TranscriptCourse[], gradeMap = mappingByGrade): GradeStatus {
  if (attempts.length === 0) return "not_taken";

  const latestPassingAttempt = findLastAttempt(attempts, (attempt) => getGradeMapping(attempt.gradeChar, gradeMap).isPassing);
  if (latestPassingAttempt) {
    const mapping = getGradeMapping(latestPassingAttempt.gradeChar, gradeMap);
    return mapping.isCredit ? "passed" : "non_credit";
  }

  const latestAttempt = attempts.at(-1);
  if (!latestAttempt) return "not_taken";
  if (latestAttempt.gradeChar === "W") return "withdrawn";
  return "failed";
}

export function calculateGpax(courses: TranscriptCourse[], gradeMap = mappingByGrade) {
  let attemptedCredits = 0;
  let gradePoints = 0;

  for (const course of courses) {
    const grade = getGradeMapping(course.gradeChar, gradeMap);
    if (!grade.isAttempt) continue;

    attemptedCredits += course.credits;
    gradePoints += course.credits * grade.gradePoint;
  }

  return {
    attemptedCredits,
    gradePoints,
    gpax: attemptedCredits === 0 ? 0 : Number((gradePoints / attemptedCredits).toFixed(2))
  };
}

export function getLatestTranscriptSummary(summaries: TranscriptSummary[]) {
  return summaries.reduce<TranscriptSummary | undefined>((latest, summary) => {
    if (!latest) return summary;
    if (summary.academicYear !== latest.academicYear) {
      return summary.academicYear > latest.academicYear ? summary : latest;
    }
    if (summary.semester !== latest.semester) {
      return summary.semester > latest.semester ? summary : latest;
    }
    return summary.creditAttempt >= latest.creditAttempt ? summary : latest;
  }, undefined);
}

export function calculateLatestTermGpa(courses: TranscriptCourse[], gradeMap = mappingByGrade) {
  const latestSemester = courses.reduce<{ academicYear: number; semester: number } | undefined>((latest, course) => {
    if (!latest) return { academicYear: course.academicYear, semester: course.semester };
    if (course.academicYear !== latest.academicYear) {
      return course.academicYear > latest.academicYear ? { academicYear: course.academicYear, semester: course.semester } : latest;
    }
    if (course.semester !== latest.semester) {
      return course.semester > latest.semester ? { academicYear: course.academicYear, semester: course.semester } : latest;
    }
    return latest;
  }, undefined);

  if (!latestSemester) return 0;

  const latestCourses = courses.filter(
    (course) => course.academicYear === latestSemester.academicYear && course.semester === latestSemester.semester
  );

  let attemptedCredits = 0;
  let gradePoints = 0;

  for (const course of latestCourses) {
    const grade = getGradeMapping(course.gradeChar, gradeMap);
    if (!grade.isAttempt) continue;
    attemptedCredits += course.credits;
    gradePoints += course.credits * grade.gradePoint;
  }

  return attemptedCredits === 0 ? 0 : Number((gradePoints / attemptedCredits).toFixed(2));
}

export function getBestPassedAttempt(attempts: TranscriptCourse[], gradeMap = mappingByGrade) {
  return findLastAttempt(attempts, (attempt) => getGradeMapping(attempt.gradeChar, gradeMap).isPassing);
}

function findLastAttempt(attempts: TranscriptCourse[], predicate: (attempt: TranscriptCourse) => boolean) {
  for (let index = attempts.length - 1; index >= 0; index -= 1) {
    if (predicate(attempts[index])) return attempts[index];
  }

  return undefined;
}

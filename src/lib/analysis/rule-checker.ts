import type { CourseStatus, Program, ReadinessCheck } from "@/lib/types";

export function checkReadiness(program: Program, courseStatuses: CourseStatus[], earnedCredits: number, gpax: number): ReadinessCheck[] {
  const passed = new Set(courseStatuses.filter((course) => course.status === "passed").map((course) => course.courseCode));
  const missingRequired = courseStatuses.filter((course) => course.category === "วิชาบังคับ" && course.status !== "passed");

  return [
    {
      name: "ความพร้อมโครงงานวิจัย 1",
      status: passed.has("517392") && earnedCredits >= 90 ? "normal" : "watch",
      detail: passed.has("517392")
        ? "ผ่านวิชาเตรียมความพร้อมแล้ว ตรวจหน่วยกิตขั้นต่ำประกอบก่อนลงโครงงาน 1"
        : "ควรผ่าน 517392 ก่อนใช้สิทธิ์ลงโครงงานวิจัย 1"
    },
    {
      name: "ความพร้อมโครงงานวิจัย 2",
      status: passed.has("517493") ? "normal" : "watch",
      detail: passed.has("517493") ? "ผ่านโครงงานวิจัย 1 แล้ว" : "ต้องผ่าน 517493 ก่อนตรวจความพร้อมโครงงานวิจัย 2"
    },
    {
      name: "เกณฑ์เกียรตินิยม",
      status: gpax >= program.honorSecondClassMin ? "normal" : "watch",
      detail:
        gpax >= program.honorFirstClassMin
          ? "GPAX อยู่ในช่วงเกียรตินิยมอันดับหนึ่งตามเกณฑ์เบื้องต้น"
          : gpax >= program.honorSecondClassMin
            ? "GPAX อยู่ในช่วงเกียรตินิยมอันดับสองตามเกณฑ์เบื้องต้น"
            : "GPAX ยังไม่ถึงเกณฑ์เกียรตินิยม ควรใช้ระบบจำลองวางแผนเทอมถัดไป"
    },
    {
      name: "ความเสี่ยงจบการศึกษา",
      status: missingRequired.length > 5 ? "urgent" : missingRequired.length > 0 ? "watch" : "normal",
      detail:
        missingRequired.length > 0
          ? `ยังมีวิชาบังคับที่ไม่ผ่าน ${missingRequired.length} รายวิชา`
          : "วิชาบังคับในชุดข้อมูลตัวอย่างผ่านครบแล้ว"
    }
  ];
}

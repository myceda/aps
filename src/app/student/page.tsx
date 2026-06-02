import Link from "next/link";
import { CourseOfferingOverview } from "@/components/student/CourseOfferingOverview";
import { CurriculumSetup } from "@/components/student/CurriculumSetup";
import { CourseDependencyPanel } from "@/components/student/CourseDependencyPanel";
import { DashboardSummary } from "@/components/student/DashboardSummary";
import { EightYearStudyPlanDiagram } from "@/components/student/EightYearStudyPlanDiagram";
import { GraduationForecastPanel } from "@/components/student/GraduationForecastPanel";
import { GraduationWhatIfPanel } from "@/components/student/GraduationWhatIfPanel";
import { GpaxSimulator } from "@/components/student/GpaxSimulator";
import { ReadinessPanel } from "@/components/student/ReadinessPanel";
import { RiskImpactPanel } from "@/components/student/RiskImpactPanel";
import { StudentDashboardHero } from "@/components/student/StudentDashboardHero";
import { StudentDashboardNav } from "@/components/student/StudentDashboardNav";
import { StudyPlanComparison } from "@/components/student/StudyPlanComparison";
import { TranscriptPreview } from "@/components/student/TranscriptPreview";
import { analyzeAcademicPlanFromDatabase } from "@/lib/analysis";
import { requireUser } from "@/lib/auth/session";
import { getStudentProgram, resolveProgramCode } from "@/lib/db/repository";

export const dynamic = "force-dynamic";

export default async function StudentPage() {
  const user = await requireUser(["student", "admin"]);
  const studentProgram = await getStudentProgram(user.id);
  const programCode = await resolveProgramCode(user.id, studentProgram?.program.code);
  const analysis = await analyzeAcademicPlanFromDatabase(programCode, user.id);

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4">
          <div>
            <p className="text-sm font-semibold text-teal">Student</p>
            <h1 className="text-2xl font-bold text-ink">ระบบวางแผนการเรียนตามหลักสูตร</h1>
            <p className="mt-1 text-sm text-slate-600">ดูสถานะ คาดการณ์แผนจบ และจำลองผลกระทบก่อนตัดสินใจลงทะเบียน</p>
          </div>
          <Link className="rounded-md border border-line px-4 py-2 text-sm font-semibold" href="/">
            หน้าแรก
          </Link>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-5 px-6 py-6">
        <StudentDashboardHero analysis={analysis} />
        <StudentDashboardNav />

        <section id="student-summary" className="grid gap-5">
          <SectionHeading
            eyebrow="1. สถานะนักศึกษา"
            title="ตรวจภาพรวมก่อนวางแผน"
            detail="เริ่มจากสถานะ GPAX หน่วยกิตที่ผ่าน และความพร้อมตามเงื่อนไขหลักสูตร"
          />
          <DashboardSummary analysis={analysis} />
        </section>

        <section id="graduation-forecast" className="grid gap-5">
          <SectionHeading
            eyebrow="2. คาดว่าจะจบเมื่อไร"
            title="แผนเรียนจากเทอมปัจจุบันจนจบ"
            detail="ระบบจัดวิชาที่เหลือตาม prerequisite เทอมที่เปิดสอน และ credit limit ต่อเทอม"
          />
          <GraduationForecastPanel analysis={analysis} />
        </section>

        <section id="eight-year-plan" className="grid gap-5">
          <SectionHeading
            eyebrow="3. แผนรายเทอม"
            title="มองแผนอนาคตเป็นปี 1 ถึงปี 8"
            detail="ใช้สำหรับอธิบายกับกรรมการและช่วยให้นักศึกษาเห็นลำดับวิชาต่อเนื่อง"
          />
          <EightYearStudyPlanDiagram analysis={analysis} />
        </section>

        <section id="blocked-courses" className="grid gap-5">
          <SectionHeading
            eyebrow="4. วิชาที่ block การจบ"
            title="ดูรายวิชาตัวต่อและผลกระทบ"
            detail="เน้นวิชาที่ตก ถอน หรือยังไม่ผ่าน prerequisite แล้วทำให้รายวิชาอื่นลงไม่ได้"
          />
          <div className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
            <RiskImpactPanel analysis={analysis} />
            <CourseDependencyPanel analysis={analysis} />
          </div>
        </section>

        <section id="what-if-simulation" className="grid gap-5">
          <SectionHeading
            eyebrow="5. What-if"
            title="จำลองถอน ลง หรือไม่ผ่านวิชา"
            detail="เปรียบเทียบแผนเดิมกับแผนหลังจำลอง เพื่อดูว่าจะจบช้ากี่เทอมและ block วิชาใดเพิ่ม"
          />
          <GraduationWhatIfPanel analysis={analysis} programCode={programCode} />
        </section>

        <section id="course-offerings" className="grid gap-5">
          <SectionHeading
            eyebrow="ข้อมูลประกอบการวางแผน"
            title="วิชาที่คาดว่าจะเปิดสอน"
            detail="แสดงทุกภาคการศึกษา ไม่จำกัดเฉพาะ Summer เพื่อใช้เลือกเรียนซ้ำหรือเรียนเพิ่มเติม"
          />
          <CourseOfferingOverview programCode={programCode} />
        </section>

        <section id="student-data-tools" className="grid gap-5">
          <SectionHeading
            eyebrow="6. เครื่องมือแก้ข้อมูล"
            title="ปรับข้อมูลนำเข้าเมื่อ transcript หรือหลักสูตรไม่ครบ"
            detail="ส่วนนี้เป็นเครื่องมือสนับสนุน ไม่ใช่หน้าหลักของระบบวางแผน"
          />
          <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
            <StudyPlanComparison analysis={analysis} />
            <div id="transcript-tools">
              <TranscriptPreview />
            </div>
          </div>
        </section>

        <section id="curriculum-tools" className="grid gap-5">
          <SectionHeading
            eyebrow="ตั้งค่าข้อมูลนักศึกษา"
            title="เลือกหลักสูตรและแผนการเรียน"
            detail="ใช้เมื่อข้อมูลนักศึกษายังไม่ตรงกับหลักสูตรหรือ track ที่ต้องการวิเคราะห์"
          />
          <CurriculumSetup
            initialProgramCode={studentProgram?.program.code}
            initialStudentCode={studentProgram?.studentCode}
            initialTrack={studentProgram?.track}
          />
        </section>

        <section id="student-risk-details" className="grid gap-5">
          <SectionHeading
            eyebrow="รายละเอียดเพิ่มเติม"
            title="ความพร้อมและ GPAX simulator"
            detail="ใช้ตรวจเงื่อนไขสำคัญ เช่น โปรต่ำ โปรสูง เกียรตินิยม โครงงาน หรือสหกิจศึกษา"
          />
          <ReadinessPanel analysis={analysis} />
          <GpaxSimulator programCode={programCode} />
        </section>
      </div>
    </main>
  );
}

function SectionHeading({ eyebrow, title, detail }: { eyebrow: string; title: string; detail: string }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <p className="text-sm font-semibold text-teal">{eyebrow}</p>
        <h2 className="mt-1 text-xl font-bold text-ink">{title}</h2>
        <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">{detail}</p>
      </div>
    </div>
  );
}

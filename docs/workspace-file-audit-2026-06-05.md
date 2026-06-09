# Workspace File Audit

วันที่ตรวจ: 05/06/2026

เอกสารนี้แยกประเภทไฟล์จาก `git status` เพื่อให้ทำงาน Step 0/Step 1 ต่อได้โดยไม่สับสนว่าไฟล์ใดเป็นงาน UI ปัจจุบัน ไฟล์ใดเป็นไฟล์เอกสาร และไฟล์ใดเป็น scratch/generated output

## ไฟล์งาน UI/ระบบที่มีการแก้ค้างอยู่

กลุ่มนี้น่าจะเป็นงานปรับ APS ปัจจุบัน ควรตรวจ `git diff` รายไฟล์ก่อนแก้ต่อ และห้าม revert โดยไม่ยืนยัน:

- `src/app/admin/page.tsx`
- `src/app/globals.css`
- `src/app/layout.tsx`
- `src/app/page.tsx`
- `src/app/student/page.tsx`
- `src/components/admin/AdminCompletenessPanel.tsx`
- `src/components/admin/AdminCrudPanel.tsx`
- `src/components/admin/AdminImportPanel.tsx`
- `src/components/admin/AdminMenu.tsx`
- `src/components/shared/AuthButtons.tsx`
- `src/components/shared/Badge.tsx`
- `src/components/shared/ProgressBar.tsx`
- `src/components/student/CourseDependencyPanel.tsx`
- `src/components/student/CurriculumSetup.tsx`
- `src/components/student/DashboardSummary.tsx`
- `src/components/student/EightYearStudyPlanDiagram.tsx`
- `src/components/student/GraduationForecastPanel.tsx`
- `src/components/student/GraduationWhatIfPanel.tsx`
- `src/components/student/StudentDashboardHero.tsx`
- `src/components/student/StudentDashboardNav.tsx`
- `src/components/student/TranscriptPreview.tsx`
- `tailwind.config.ts`

## ไฟล์/โฟลเดอร์ feature ใหม่ที่ยัง untracked

กลุ่มนี้ดูเป็นส่วนหนึ่งของงาน APS รอบล่าสุด ควรตรวจเนื้อหาก่อนตัดสินใจ stage:

- `src/app/student/transcript-tools/`
- `src/components/admin/AdminDashboardShell.tsx`
- `src/components/student/StudentDashboardShell.tsx`

## เอกสารประกอบงาน final

กลุ่มนี้เป็นเอกสารที่อาจมีประโยชน์ต่อรายงาน คู่มือ หรือพรีเซนต์:

- `docs/aps-final-ui-review-and-user-guide.md`
- `docs/database-updated-2026-06-03.sql`
- `docs/study-plan-architecture.mmd`
- `docs/thesis-update-2026-06-03.md`

## ไฟล์ scratch/generated ที่ไม่ใช่ source หลักของ APS

กลุ่มนี้ควรถูก ignore จาก lint/git และควรลบหรือย้ายออกเมื่อแน่ใจว่าไม่ต้องใช้แล้ว:

- `-d/`
- `angle_paras.txt`
- `angle_paras_esc.txt`
- `angle_paras_repr.txt`
- `final_body_esc.txt`
- `final_paragraphs.txt`
- `final_paragraphs_utf8.txt`
- `thesis_deep.txt`

## ไฟล์ที่เพิ่ม/แก้ใน Step 0 และ Step 1

- `AGENTS.md`: กติกาการทำงานกับ AI agent สำหรับ APS
- `eslint.config.mjs`: เพิ่ม ignore สำหรับ tool output และ scratch files
- `.gitignore`: เพิ่ม ignore สำหรับ generated/scratch files
- `README.md`: ปรับคำอธิบายโปรเจกต์ คำสั่งรัน และหมายเหตุการทำงาน
- `docs/workspace-file-audit-2026-06-05.md`: audit สถานะไฟล์ใน workspace

## ข้อเสนอแนะถัดไป

1. ตรวจ diff ของกลุ่ม UI ก่อนเริ่ม Step 2
2. ตัดสินใจว่าจะเก็บหรือทิ้งไฟล์ scratch หลังตรวจว่าข้อมูลในเอกสาร final ถูกนำไปใช้ครบแล้ว
3. ถ้าต้อง commit ให้ stage เฉพาะไฟล์ของ Step 0/Step 1 ก่อน เพื่อให้ history อ่านง่าย


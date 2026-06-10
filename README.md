# APS: Academic Planning Support

เว็บแอปสำหรับช่วยนักศึกษาวางแผนการเรียนตามหลักสูตร โดยนำข้อมูลผลการเรียนไปเทียบกับข้อมูลหลักสูตร รายวิชา วิชาบังคับก่อน แผนรายเทอม และวิชาที่เปิดสอน เพื่อคาดการณ์วันจบ วิเคราะห์ความเสี่ยง และจำลองผลกระทบก่อนตัดสินใจลงทะเบียน

## ผู้ใช้หลัก

- นักศึกษา: จัดการข้อมูลผลการเรียน ดู dashboard คาดการณ์วันจบ ดูแผน 8 ปี และจำลองสถานการณ์
- ผู้ดูแลระบบ: จัดการข้อมูลหลักสูตร รายวิชา prerequisite แผนรายเทอม วิชาที่เปิดสอน และ import CSV template

## Scope ปัจจุบัน

- Student Dashboard สำหรับ summary, progress, risk, readiness, graduation forecast, 8-year study plan และ what-if simulation
- What-if simulation ทำงานแบบ temporary state เพื่อเปรียบเทียบผลกระทบก่อนตัดสินใจ โดยไม่บันทึกทับข้อมูลผลการเรียนจริงและยังไม่บันทึก SimulationSession ถาวรในเวอร์ชัน final demo
- Transcript tools สำหรับ preview/validation ข้อมูลผลการเรียนก่อนยืนยัน
- Admin Control Panel สำหรับตรวจความพร้อมของข้อมูลและจัดการข้อมูลหลักสูตรผ่าน UI
- CSV import สำหรับข้อมูลหลักสูตรและข้อมูลประกอบการวิเคราะห์
- Analysis engine แยกจาก UI เพื่อให้อ่านและทดสอบง่าย
- Prisma schema สำหรับเชื่อมต่อฐานข้อมูล PostgreSQL

## Development

ติดตั้ง dependencies:

```bash
cmd /c npm install
```

รัน development server:

```bash
cmd /c npm run dev
```

ตรวจ type และ lint:

```bash
cmd /c npm run typecheck
cmd /c npm run lint
```

สร้าง `.env` จากค่าที่ใช้ในเครื่องก่อนเชื่อม PostgreSQL จริง ห้าม commit secret หรือ API key เข้า repo

## Project Notes

- อ่าน `AGENTS.md` ก่อนให้ AI agent แก้โค้ด
- งาน UI/UX และคู่มือ final อยู่ใน `docs/`
- ไฟล์ scratch จากการดึงเอกสาร เช่น `final_paragraphs*.txt`, `angle_paras*.txt`, `thesis_deep.txt` และโฟลเดอร์ `-d/` ไม่ใช่ source หลักของ APS
- หลังแก้โค้ดทุกครั้งควรตรวจ `git diff`, `npm run typecheck`, `npm run lint` และเปิดเว็บจริงถ้าเป็นงาน UI

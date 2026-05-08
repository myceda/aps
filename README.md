# APS: Academic Planning Support

เว็บแอปสำหรับวิเคราะห์ transcript เทียบกับหลักสูตร ช่วยให้นักศึกษาวางแผนการเรียน เห็นความเสี่ยงจาก F/W ตรวจ prerequisite และจำลอง GPAX เป้าหมาย

## Scope รอบแรก

- Student dashboard พร้อม summary, progress, risk, readiness, และ GPAX simulation
- Admin page สำหรับดูความครบถ้วนของข้อมูลหลักสูตรและจุดที่ต้องเติม
- Transcript preview/validation ก่อนยืนยัน
- Analysis engine แยกจาก UI เพื่อให้อ่านและทดสอบง่าย
- Prisma schema พร้อมต่อ PostgreSQL

## Development

```bash
cmd /c npm install
cmd /c npm run dev
```

สร้าง `.env` จาก `.env.example` ก่อนเชื่อม PostgreSQL จริง

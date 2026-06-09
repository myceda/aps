const links = [
  { href: "#student-summary", label: "หน้าแรก" },
  { href: "#graduation-forecast", label: "คาดการณ์วันจบ" },
  { href: "#eight-year-plan", label: "แผนผังการเรียนรายเทอม" },
  { href: "#course-offerings", label: "รายวิชาที่เปิดสอน" },
  { href: "#what-if-simulation", label: "ระบบจำลองสถานการณ์เรียน" },
  { href: "/student/transcript-tools", label: "ระบบจัดการไฟล์ผลการเรียน" },
  { href: "#student-risk-details", label: "สถานะเฝ้าระวัง" }
];

export function StudentDashboardNav() {
  return (
    <nav className="app-sidebar sticky top-4 h-fit p-4">
      <div className="mb-4">
        <p className="text-xs font-bold uppercase tracking-wide text-sky-200">เมนูนักศึกษา</p>
        <h2 className="mt-1 text-lg font-bold">แผงควบคุมภาพรวม</h2>
        <p className="mt-1 text-xs leading-5 text-slate-300">เลือกส่วนที่ต้องการดูเพื่อวางแผนการเรียนได้เร็วขึ้น</p>
      </div>
      <div className="grid gap-2">
        {links.map((link) => (
          <a className="app-sidebar-item flex items-center gap-2 px-3 py-2 text-sm font-semibold" href={link.href} key={link.href}>
            <span className="h-2 w-2 rounded-full bg-sky-300" aria-hidden="true" />
            <span>{link.label}</span>
          </a>
        ))}
      </div>
    </nav>
  );
}

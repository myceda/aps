const links = [
  { href: "#student-summary", label: "สถานะ" },
  { href: "#graduation-forecast", label: "คาดว่าจะจบ" },
  { href: "#eight-year-plan", label: "แผน 8 ปี" },
  { href: "#course-offerings", label: "วิชาเปิดสอน" },
  { href: "#what-if-simulation", label: "จำลองแผน" },
  { href: "#student-data-tools", label: "แก้ข้อมูล" },
  { href: "#student-risk-details", label: "รายละเอียดความเสี่ยง" }
];

export function StudentDashboardNav() {
  return (
    <nav className="surface p-3">
      <div className="flex flex-wrap gap-2">
        {links.map((link) => (
          <a className="rounded-md border border-line px-3 py-2 text-sm font-semibold hover:bg-mist" href={link.href} key={link.href}>
            {link.label}
          </a>
        ))}
      </div>
    </nav>
  );
}

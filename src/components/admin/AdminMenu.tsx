const menu = [
  "จัดการหลักสูตร",
  "จัดการรายวิชา",
  "จัดการโครงสร้างหลักสูตร",
  "จัดการแผนการเรียน",
  "จัดการ prerequisite",
  "จัดการ rule",
  "จัดการ course offering",
  "ตรวจสอบข้อมูลนำเข้า"
];

export function AdminMenu() {
  return (
    <nav className="surface p-4">
      <h2 className="text-lg font-bold">Admin Menu</h2>
      <div className="mt-3 grid gap-2">
        {menu.map((item) => (
          <button className="rounded-md border border-line px-3 py-2 text-left text-sm font-semibold hover:bg-mist" key={item}>
            {item}
          </button>
        ))}
      </div>
    </nav>
  );
}

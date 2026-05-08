import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function AuthRedirectPage() {
  const user = await requireUser();

  if (user.role === "admin") {
    redirect("/admin");
  }

  redirect("/student");
}

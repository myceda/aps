import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth/next-auth";
import type { UserRole } from "@/lib/types";

export async function getCurrentSession() {
  return getServerSession(authOptions);
}

export async function requireUser(allowedRoles?: UserRole[]) {
  const session = await getCurrentSession();

  if (!session?.user?.id || !session.user.role) {
    redirect("/");
  }

  if (allowedRoles && !allowedRoles.includes(session.user.role)) {
    redirect("/");
  }

  return session.user;
}

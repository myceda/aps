import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/session";
import type { UserRole } from "@/lib/types";

export async function requireApiUser(allowedRoles?: UserRole[]) {
  const session = await getCurrentSession();

  if (!session?.user?.id || !session.user.role) {
    return {
      error: NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 }),
      user: null
    };
  }

  if (allowedRoles && !allowedRoles.includes(session.user.role)) {
    return {
      error: NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 }),
      user: null
    };
  }

  return { error: null, user: session.user };
}

import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname.startsWith("/api/auth")) return NextResponse.next();

  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

  if (!token && (pathname.startsWith("/student") || pathname.startsWith("/admin"))) {
    const loginUrl = new URL("/", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (!token && pathname.startsWith("/api")) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  if ((pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) && token?.role !== "admin") {
    if (pathname.startsWith("/api/admin")) {
      return NextResponse.json({ error: "Admin permission required" }, { status: 403 });
    }

    return NextResponse.redirect(new URL("/", request.url));
  }

  const response = NextResponse.next();
  response.headers.set("x-aps-path", request.nextUrl.pathname);
  return response;
}

export const config = {
  matcher: ["/student/:path*", "/admin/:path*", "/api/:path*"]
};

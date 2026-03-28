import { NextRequest, NextResponse } from "next/server";

const protectedRoutes = ["/bookings", "/profile", "/admin"];
const authRoutes = ["/login", "/register"];

export default async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const token = req.cookies.get("token")?.value;

  const isProtected = protectedRoutes.some((route) =>
    path.startsWith(route)
  );
  const isAuthRoute = authRoutes.some((route) => path.startsWith(route));

  // Redirect to login if accessing protected route without token
  if (isProtected && !token) {
    const loginUrl = new URL("/login", req.nextUrl);
    loginUrl.searchParams.set("callbackUrl", path);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect authenticated users away from auth pages
  if (isAuthRoute && token) {
    return NextResponse.redirect(new URL("/", req.nextUrl));
  }

  // Block non-admin users from admin routes
  if (path.startsWith("/admin") && token) {
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      const role =
        payload.role ??
        payload[
          "http://schemas.microsoft.com/ws/2008/06/identity/claims/role"
        ];
      if (role !== "Admin") {
        return NextResponse.redirect(new URL("/", req.nextUrl));
      }
    } catch {
      return NextResponse.redirect(new URL("/login", req.nextUrl));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|.*\\.png$|.*\\.svg$|.*\\.ico$).*)"],
};

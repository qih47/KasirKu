import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const pathname = req.nextUrl.pathname;
    const isSuperAdmin = token?.role === "SUPER_ADMIN";

    // 1. Logika untuk rute /admin/login
    if (pathname === "/admin/login") {
      if (isSuperAdmin) {
        return NextResponse.redirect(new URL("/admin", req.url));
      }
      return NextResponse.next();
    }

    // 2. Logika untuk rute /admin/* lainnya (harus role SUPER_ADMIN)
    if (pathname.startsWith("/admin")) {
      if (!isSuperAdmin) {
        return NextResponse.redirect(new URL("/admin/login", req.url));
      }
      return NextResponse.next();
    }

    // 3. Logika untuk halaman login/register tenant jika sudah login
    if (token && (pathname.startsWith("/login") || pathname.startsWith("/register"))) {
      if (isSuperAdmin) {
        return NextResponse.redirect(new URL("/admin", req.url));
      }
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    // 4. Jika Super Admin mencoba mengakses /dashboard tenant
    if (isSuperAdmin && pathname.startsWith("/dashboard")) {
      return NextResponse.redirect(new URL("/admin", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ req, token }) => {
        const pathname = req.nextUrl.pathname;

        // Path publik
        if (
          pathname === "/" ||
          pathname === "/admin/login" ||
          pathname.startsWith("/login") ||
          pathname.startsWith("/register") ||
          pathname.startsWith("/api/auth") ||
          pathname.startsWith("/_next") ||
          pathname.includes(".")
        ) {
          return true;
        }

        // Khusus /admin/* butuh token
        if (pathname.startsWith("/admin")) {
          return token?.role === "SUPER_ADMIN";
        }

        // Path tenant (/dashboard, /pos, dll)
        return !!token;
      },
    },
    pages: {
      signIn: "/login",
    },
  }
);

export const config = {
  matcher: [
    "/admin",
    "/admin/:path*",
    "/dashboard",
    "/dashboard/:path*",
    "/pos",
    "/pos/:path*",
    "/settings",
    "/settings/:path*",
    "/login",
    "/register",
  ],
};

import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export const config = {
    matcher: [
        "/((?!api/|_next/|_static/|[\\w-]+\\.\\w+).*)",
    ],
};

export default async function middleware(req: NextRequest) {
    const url = req.nextUrl;
    const hostname = req.headers.get("host") || "";

    // Get session token (works for both Secure and non-Secure cookies)
    const session = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

    const appDomain = "app.cluaiz.com";
    const isLocal = process.env.RUNINGON === 'local';
    // REMOVE localhost from isAppSubdomain to prevent auto-rewrite to /dashboard
    const isAppSubdomain = hostname === appDomain || hostname.startsWith("app.");

    // --- 1. APP SUBDOMAIN LOGIC (app.cluaiz.com) ---
    if (isAppSubdomain) {
        // Define Auth Routes (Public on App Domain)
        const isAuthRoute = url.pathname.startsWith("/login") ||
            url.pathname.startsWith("/sign-up") ||
            url.pathname.startsWith("/register") ||
            url.pathname.startsWith("/api/auth");

        // Public routes
        const isPublicRoute = url.pathname.startsWith("/embed");

        // Unauthenticated -> Login
        if (!session && !isAuthRoute && !isPublicRoute) {
            return NextResponse.redirect(new URL("/login", req.url));
        }

        // Authenticated on Auth Route -> Dashboard
        if (session && (url.pathname === "/login" || url.pathname === "/register")) {
            return NextResponse.redirect(new URL("/", req.url));
        }

        // Rewrite Rules: "/" -> "/dashboard"
        if (url.pathname === "/") {
            return NextResponse.rewrite(new URL("/dashboard", req.url));
        }

        // Map /xyz -> /dashboard/xyz (Virtual Root)
        if (!url.pathname.startsWith("/dashboard") && !isAuthRoute && !isPublicRoute) {
            return NextResponse.rewrite(new URL(`/dashboard${url.pathname}`, req.url));
        }
    }
    // --- 2. MAIN DOMAIN & LOCALHOST LOGIC ---
    else {
        // Protect /dashboard routes explicitly since they aren't covered by Subdomain logic anymore
        if (url.pathname.startsWith("/dashboard")) {
            if (!session) {
                return NextResponse.redirect(new URL("/login", req.url));
            }
        }

        // Redirect Login/Signup ONLY if we are on Production Main Domain (cluaiz.com)
        // logic: If we are local, we stay here. If we are cluaiz.com, we go to app.cluaiz.com
        if (!isLocal && (url.pathname === "/login" || url.pathname === "/register" || url.pathname === "/signup" || url.pathname === "/dashboard/signup")) {
            const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://app.cluaiz.com";
            // Map /dashboard/signup -> /register
            const targetPath = url.pathname === "/dashboard/signup" ? "/register" : url.pathname;
            return NextResponse.redirect(`${appUrl}${targetPath}`);
        }
    }

    // Default Behavior
    return NextResponse.next();
}

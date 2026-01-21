import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("access_token");
  const path = request.nextUrl.pathname;

  // TERMINOLOGY CHANGE (Story 0.1): Redirect /feeds → /streams for creator routes
  // Public newsletter pages keep /feeds for backwards compatibility
  if (
    path.startsWith("/feeds") &&
    (path === "/feeds" || path.includes("/create") || path.includes("/edit"))
  ) {
    const newPath = path.replace("/feeds", "/streams");
    return NextResponse.redirect(new URL(newPath, request.url));
  }

  // Define public routes that don't require authentication
  const publicRoutes = [
    "/", // Home page
    "/discover", // Public newsletter discovery (subscriber)
    "/creator", // Public creator profiles
  ];

  // Check if it's a public route or public newsletter page
  const isPublicRoute =
    publicRoutes.some((route) => path === route || path.startsWith(route)) ||
    // Public newsletter pages: /feeds/[slug] (read-only, public view)
    (path.startsWith("/feeds/") && !path.includes("/edit") && !path.endsWith("/create"));

  // If it's a public route, allow access
  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Define creator-specific protected routes
  const creatorRoutes = ["/dashboard", "/content", "/revenue", "/settings"];
  const isCreatorRoute =
    creatorRoutes.some((route) => path.startsWith(route)) ||
    // Creator stream management: /streams, /streams/create, /streams/[id]/edit
    (path.startsWith("/streams") &&
      (path === "/streams" || path.includes("/edit") || path.includes("/create")));

  // Define subscriber-specific protected routes
  const subscriberRoutes = ["/subscriptions", "/portal"];
  const isSubscriberRoute = subscriberRoutes.some((route) => path.startsWith(route));

  // Define auth routes (login, register)
  const authRoutes = ["/login", "/register"];
  const isAuthRoute = authRoutes.some((route) => path.startsWith(route));

  // If trying to access creator route without token, redirect to creator login
  if (isCreatorRoute && !token) {
    const url = new URL("/login/creator", request.url);
    url.searchParams.set("from", path); // Preserve intended destination
    return NextResponse.redirect(url);
  }

  // If trying to access subscriber route without token, redirect to subscriber login
  if (isSubscriberRoute && !token) {
    const url = new URL("/login/subscriber", request.url);
    url.searchParams.set("from", path); // Preserve intended destination
    return NextResponse.redirect(url);
  }

  // If logged in and trying to access auth routes, redirect to dashboard
  if (isAuthRoute && token) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * 1. /api routes (API routes)
     * 2. /_next (Next.js internals)
     * 3. /fonts, /images (static files)
     * 4. /favicon.ico, /sitemap.xml, /robots.txt (public files)
     */
    "/((?!api|_next|fonts|images|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};

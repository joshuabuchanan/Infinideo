import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher(["/protected(.*)"]);
const isProtectedRoute = createRouteMatcher([
  "/studio(.*)",
  "/subscriptions",
  "/feed/subscribed",
  "/playlists(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  const videoMatch = req.nextUrl.pathname.match(/^\/feed\/dailymotion(?::|%3A)([A-Za-z0-9]+)$/i);
  if (videoMatch) {
    const rewrittenUrl = req.nextUrl.clone();
    rewrittenUrl.pathname = `/feed/source/dailymotion/${videoMatch[1]}`;
    return NextResponse.rewrite(rewrittenUrl);
  }

  // Keep /protected public so its page can render the inline sign-in form.
  if (isPublicRoute(req)) {
    return;
  }

  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for Clerk's auto-proxy path
    "/__clerk/:path*",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
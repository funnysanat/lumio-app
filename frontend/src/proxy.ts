import { clerkMiddleware } from '@clerk/nextjs/server';

// In Clerk v7, we rely on resource-based auth checks in the pages themselves.
// (e.g. using `await auth()` inside dashboard/page.tsx).
export default clerkMiddleware();

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};

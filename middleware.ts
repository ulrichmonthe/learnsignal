import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

// Public surface: the marketing site, the sign-in/up routes, and all API routes
// (each authed API route self-guards with auth() and returns 401). Everything
// else — dashboard, playground, scenarios, admin — requires a signed-in user.
const isPublicRoute = createRouteMatcher([
  '/',
  '/signals(.*)',
  '/waitlist',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/(.*)',
  '/jobs(.*)',
  '/u/(.*)',
])

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    // Skip Next internals and static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpg|jpeg|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}

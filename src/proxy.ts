import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/health',
  '/api/webhooks(.*)', // Clerk & payment webhook endpoints — verifyWebhook() is their only check
])

const isOnboardingRoute = createRouteMatcher(['/onboarding(.*)'])

export default clerkMiddleware(async (auth, req) => {
  if (
    process.env.NODE_ENV === 'development' &&
    req.nextUrl.pathname === '/api/send-email'
  ) {
    return
  }

  if (!isPublicRoute(req)) {
    await auth.protect()
  }

  const { userId, sessionClaims } = await auth()

  // Not logged in — let the public route / protect() handle it
  if (!userId) return

  const onboardingComplete =
    (sessionClaims?.metadata as Record<string, unknown> | undefined)
      ?.onboardingComplete === true

  // Already onboarded → don't let them back into /onboarding
  if (isOnboardingRoute(req) && onboardingComplete) {
    const url = req.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  // Not yet onboarded + trying to access a protected page → send to /onboarding
  if (!isOnboardingRoute(req) && !isPublicRoute(req) && !onboardingComplete) {
    const url = req.nextUrl.clone()
    url.pathname = '/onboarding'
    return NextResponse.redirect(url)
  }
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for Clerk's auto-proxy path
    '/__clerk/:path*',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
'use server'

import { auth, clerkClient } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { emailQueue } from '@/server/queue/queues'

/**
 * Called once when the user lands on /onboarding.
 * Reads name + email straight from Clerk — no webhook, no extra API route.
 * BullMQ deduplicates by jobId so React re-renders never queue a second email.
 */
export async function sendWelcomeEmail() {
  const { userId } = await auth()
  if (!userId) return

  const client = await clerkClient()
  const user = await client.users.getUser(userId)

  const email = user.emailAddresses[0]?.emailAddress
  const name =
    `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || 'there'

  if (!email) return

  try {
    await emailQueue.add(
      'welcome-email',
      { email, name },
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        jobId: `welcome-email_${userId}`, // dedup: same id = BullMQ ignores the duplicate
      }
    )
  } catch (err) {
    // Redis might not be running in dev — don't crash the page
    console.error('[sendWelcomeEmail] failed to queue email:', err)
  }
}

/**
 * Called when the user submits the onboarding form.
 * Sets onboardingComplete = true in Clerk publicMetadata so the middleware
 * stops redirecting them back here.
 */
export async function completeOnboarding(formData: FormData) {
  const { userId } = await auth()
  if (!userId) return

  // TODO: persist formData fields to your DB here (organizationName, address, nif, nis, rc, ai)

  const client = await clerkClient()
  await client.users.updateUserMetadata(userId, {
    publicMetadata: { onboardingComplete: true },
  })

  // Force a session token refresh so the middleware JWT claim is up-to-date
  redirect('/')
}

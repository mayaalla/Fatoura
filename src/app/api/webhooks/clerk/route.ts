import { verifyWebhook } from '@clerk/nextjs/webhooks'
import { NextRequest } from 'next/server'
import { emailQueue } from '@/server/queue/queues'

export async function POST(req: NextRequest) {
  // Verify the webhook signature — NEVER skip this
  let evt
  try {
    evt = await verifyWebhook(req) // reads CLERK_WEBHOOK_SIGNING_SECRET automatically
  } catch (err) {
    console.error('[clerk-webhook] Verification failed:', err)
    return new Response('Verification failed', { status: 400 })
  }

  if (evt.type === 'user.created') {
    const { email_addresses, first_name, last_name } = evt.data

    const email = email_addresses[0]?.email_address
    const name = `${first_name ?? ''} ${last_name ?? ''}`.trim() || 'there'

    if (!email) {
      console.warn('[clerk-webhook] user.created event has no email address, skipping.')
      return new Response('OK', { status: 200 })
    }

    // Enqueue the welcome email — the BullMQ worker picks it up and sends via Resend
    await emailQueue.add(
      'welcome-email',
      { email, name },
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        // Deduplicate: Svix retries the webhook, so guard against duplicate jobs
        jobId: `welcome-email:${evt.data.id}`,
      }
    )

    console.log(`[clerk-webhook] Queued welcome email for ${email}`)
  }

  return new Response('OK', { status: 200 })
}

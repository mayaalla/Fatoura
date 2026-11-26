## What your app does now

- Clerk handles sign-up and sign-in. Your sign-up and sign-in pages redirect an already signed-in user straight to invoices. Your home page does the same in src/app/page.tsx.
- src/proxy.ts protects routes based on whether someone is signed in. It does not check whether they have completed your business information.
- In schema.ts, users stores a Clerk user ID, name, and email. organizations holds the business name, address, and legal identifiers. memberships links a user to an organization.
- The organization name is required in the database. Address, NIF, NIS, RC, and AI are currently optional. The handwritten types in src/app/types.ts mirror the schema; the schema is the source of truth for database columns.
- Your invoice route is src/app/[app]/(app)/Invoices/page.tsx. The [app] part is a dynamic URL segment; the page currently checks sign-in but does not check for a completed business profile.
- Resend is installed, but email.service.ts currently has a hard-coded API key and does not send an email. BullMQ is installed, but the queue files and worker are empty.

The target flow should be:

Clerk sign-up → /onboarding → save business profile → queue welcome email → invoices

Clerk sign-in → check saved profile → /onboarding if incomplete, invoices if complete

## Steps to implement

### 1. Decide which business fields are required

Use the existing organization fields for the form:

- Business name
- Address
- NIF, NIS, RC, and AI

Decide which fields a user must provide before continuing. The schema comment says to confirm the legal identifiers with an accountant, so settle that before making them mandatory.

Use the same required-field list in the form validation and in the server-side “profile complete” check. If you decide fields that are nullable in the database must always be present, update schema.ts and create a reviewed Drizzle migration. Check existing rows first, since a migration that makes a column required will fail if existing records have NULL.

### 2. Put profile lookup and saving in one server-side place

Create src/server/services/onboarding.service.ts. Have it own the shared database operations:

- Find a user’s organization by looking up their Clerk ID in users, then following memberships.
- Decide whether the organization has every required business field.
- Save or update the user, organization, and owner membership.

Do not store business details or an onboarding-complete flag in Clerk. The business profile belongs to your organizations table, and completion can be calculated from its required fields.

There is one database detail to account for: src/server/db/drizzle.ts uses Drizzle’s Neon HTTP driver, which does not support db.transaction(). For the user, organization, and membership writes, use Drizzle’s db.batch() as one atomic database operation, with the IDs prepared so the related rows can refer to each other. Your seed script shows a separate node-postgres transaction pattern, but using the existing Neon HTTP connection with db.batch() avoids adding another connection path for this flow.

Your schema allows one user to have multiple memberships. Your described flow sounds like one business per account. If that is the rule, enforce it in the database as well as in the service, after checking existing data. That prevents retries or simultaneous submissions from creating two organizations for one user.

### 3. Create the onboarding route

Create these files:

- src/app/onboarding/page.tsx — require a signed-in user, check their profile, and show the form only if it is incomplete. If the profile is already complete, send them to invoices.
- src/app/onboarding/actions.ts — handle form submission on the server.
- src/app/onboarding/BusinessProfileForm.tsx — render the fields and show validation errors and the submitting state.
- src/app/onboarding/loading.tsx — provide a loading state while the page reads Clerk and database information.

In the server action, authenticate with Clerk, validate every submitted field on the server with Zod, then save the profile through the service. Take the Clerk user ID from the authenticated session. Get the user’s name and email from Clerk on the server; do not trust a hidden form field for identity or email.

Your project has cacheComponents: true in next.config.ts. Next.js 16’s auth guidance requires an appropriate loading or Suspense boundary for routes that read request-specific auth or database data. Invoices already has a loading.tsx; use the same approach for onboarding and for any route whose server page you change to make the profile check.

### 4. Route users through the profile check

Update these redirects:

- In src/app/sign-up/[[...sign-up]]/page.tsx, send a newly signed-up user to /onboarding.
- In src/app/sign-in/[[...sign-in]]/page.tsx, send an already signed-in user to / instead of directly to invoices.
- In src/app/page.tsx, look up the user’s profile and send them to /onboarding or invoices based on whether it is complete.
- In .env, check the existing Clerk fallback redirect settings. Set the sign-up fallback to /onboarding and the sign-in fallback to / so Clerk sends users through the same routing decision. Make sure the page redirects and Clerk settings do not point to conflicting destinations.

Most importantly, add the profile-completion check to src/app/[app]/(app)/Invoices/page.tsx itself. A user can type an invoice URL directly, so a redirect from the home page alone does not enforce your rule. If the profile is missing or incomplete, redirect to /onboarding.

Your current redirect uses the Clerk user ID as the dynamic URL segment. The schema’s workspace identity is the organization ID. When you save the organization, use its ID for the invoice URL if you keep this route structure. On every invoice request, verify through memberships that the signed-in Clerk user belongs to that organization; a URL value alone does not prove access.

Your app also has Clients, Products, and Settings pages. Since onboarding is a required first step, apply the same completion check to those pages too, so an incomplete user cannot enter another dashboard page directly. Keep Clerk authentication checks on each page and in every server action that reads or changes protected data. The current @clerk/nextjs version is 7.10.9; the Clerk guidance for that version marks createRouteMatcher as deprecated. Keep proxy.ts for Clerk middleware/session handling, and perform the profile and authorization checks in the server pages and actions.

### 5. Queue the welcome email after saving

Use the BullMQ setup already present:

- src/server/queue/connection.ts — connect to Redis.
- src/server/queue/queues.ts — define the welcome-email queue.
- src/server/queue/enqueue.ts — add the job after the database save succeeds.
- src/worker/index.ts — process the job in a separate worker process.
- src/server/services/email.service.ts — send the message through Resend using RESEND_API from src/server/config/env.ts.

The form action should wait for the database save and for the job to be accepted by the queue. It should not wait for Resend to finish sending; the worker does that in the background. Give each user’s welcome job a stable ID to reduce duplicate sends on retries. Run the worker separately during development with the existing worker:dev script, and deploy it as a separate process in production.

BullMQ needs a Redis TCP connection. Your environment variable is named UPSTASH_REDIS_REST_URL, so check that its value is a TCP Redis URL suitable for BullMQ; an Upstash REST HTTPS URL is a different connection type. If queueing fails after the profile is saved, the profile should stay saved and the user should still be able to continue. A database outbox would be needed if you require a guarantee that every successful profile save always results in a queued email.

## Important before using Resend

There is a Resend key literal in email.service.ts, and env.ts contains comments with secret-looking credentials. Treat the Resend, database, Clerk secret, and Redis credentials in source as exposed: rotate them and remove the literals before using this flow. Keep the replacement values in server-side environment variables. I did not print the values from .env.

## How to confirm the flow

After implementation, check these cases manually:

1. A new sign-up lands on /onboarding.
2. Submitting empty or invalid required fields keeps the user there and shows errors.
3. Opening an invoice URL directly while the profile is incomplete sends the user back to onboarding.
4. Logging out before completing the form and logging in again sends the user to onboarding.
5. Completing the form saves the user, organization, and membership, then sends them to invoices.
6. Logging out and back in after completion sends the user to invoices.
7. The email job is queued once, and the separate worker sends it. The sender address must be verified in Resend.

The Next.js guidance I used is in the installed authentication guide and Server Actions guide.

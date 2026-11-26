Here's the updated handbook, with only the parts touching Neon, Upstash, Resend and Clerk changed. I checked Upstash, Resend and Clerk against their current docs.

What changed:
- **Clerk** replaces Better Auth, so there's a `users` table, a `requireOrg()` helper and a new auth section.
- **Neon** replaces the Postgres container in production. There are two connection strings, and migrations use the direct one.
- **Upstash** replaces the Redis container in production, with a cost warning for BullMQ.
- **Resend** replaces Nodemailer in production. Mailpit stays for local dev and CI.
- The Docker, CI, CD, server setup and security sections are adjusted to match.

---

# Fatoura Project Handbook

Nov 25, 2026 · @MAYA

Fatoura is an 8-week build: an invoicing and payment-reminder platform on Next.js with background workers, Docker and GitHub Actions CI/CD. It uses managed services: Clerk for sign-in, Neon for Postgres, Upstash for Redis and Resend for email. This handbook holds the scope, architecture, paste-ready configs and a week-by-week plan, so you can start coding today.

## Start today

By tonight you will have a running Next.js app, local Postgres and Redis, Clerk sign-in working locally, and a green CI run on your first pull request. Work in this order.

- [ ] Install Node 24 LTS, Git, VS Code and Docker (Docker Desktop, or Docker Engine with Compose on Linux).
- [ ] Create a free Clerk account and a development instance, and copy its two keys. Neon, Upstash and Resend can wait until you deploy, because local development uses Docker containers.
- [ ] Scaffold the app and add the core packages (commands below).
- [ ] Create a private GitHub repo named `fatoura` and push the scaffold to it.
- [ ] Set `output: "standalone"` in `next.config.ts` and add a `/api/health` route that returns `{ "status": "ok" }`.
- [ ] Add the scripts below to `package.json`.
- [ ] Add `docker-compose.dev.yml` (see the Docker section) and run `docker compose -f docker-compose.dev.yml up -d`.
- [ ] Add Clerk: `proxy.ts`, `<ClerkProvider>` in the root layout, and sign-in and sign-up pages (see the Authentication section). Put the dev keys in `.env`, sign up, and check that your user appears in the Clerk dashboard.
- [ ] Add the CI workflow (see the CI section) with lint, typecheck and build only. Push a branch, open a pull request, and wait for green.
- [ ] Turn on branch protection for `main`: pull request required and CI must pass.
- [ ] Write `docs/adr/001-separate-worker.md` in ten lines: why jobs run in their own process, not inside Next.js.

```bash
node -v   # should print v24.x
npx create-next-app@latest fatoura --ts --eslint --tailwind --app --src-dir --use-npm --import-alias "@/*"
cd fatoura
npm i zod drizzle-orm pg bullmq ioredis pino @clerk/nextjs resend nodemailer
npm i -D drizzle-kit tsup tsx vitest @types/pg @types/nodemailer
```

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "lint": "eslint .",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "db:generate": "drizzle-kit generate",
    "db:migrate": "tsx src/server/db/migrate.ts",
    "build:worker": "tsup",
    "worker:dev": "tsx watch src/worker/index.ts"
  }
}
```

Working rules for the whole project:

1. Every change goes through a pull request, even though you work alone. The pull request history is part of your portfolio.
2. Use Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`). Small commits, one idea each.
3. Keep `main` deployable at all times.
4. Keep a `docs/devlog.md`. After each hard bug, write three lines: symptom, cause, fix. These become your case study.

## Product scope

Fatoura helps a freelancer or small shop in Algeria send invoices, get paid, and stop chasing late payments by hand. Build the MVP first, then V1, and treat the stretch items as optional.

| Feature | What it proves to an employer | Phase |
| --- | --- | --- |
| Sign-up, login (Clerk), workspaces, roles (owner, accountant, viewer) | Authentication, authorization, tenant isolation | MVP |
| Clients and products (keep this small) | Baseline data entry with validation | MVP |
| Invoices with line items, VAT and DZD amounts | Domain rules and correct money handling | MVP |
| PDF generation as a background job | Async work, file storage | MVP |
| Invoice email (Resend) as a background job, with retries | Handling failing external services | MVP |
| Public invoice page behind a secret token | Server Components, link security | MVP |
| Daily overdue scan and reminder sequence | Scheduled jobs, idempotency | V1 |
| Recurring monthly invoices | Scheduling and uniqueness constraints | V1 |
| Mock payment gateway with signed webhook | Webhooks, HMAC signatures, duplicate events | V1 |
| CSV export with a progress bar | Long-running jobs and job status UX | V1 |
| Audit log of who changed what | Traceability | V1 |
| Dashboard: outstanding, overdue, revenue by month | SQL aggregation | V1 |
| Bull Board page for queues (admin only) | Operational visibility | V1 |
| Arabic RTL interface and PDF | Internationalization | Stretch |
| S3-compatible storage adapter | Abstraction behind an interface | Stretch |
| OpenTelemetry traces from web to worker | Observability | Stretch |

Invoice status model: store `draft`, `sent`, `paid` and `void`. Treat "overdue" as derived (status is `sent` and the due date has passed) instead of storing it, so it can never be stale.

Non-goals: real card payments, real bank or SATIM integration, a full accounting module, a mobile app, and multi-currency. Saying what you left out is part of looking professional.

## Stack decisions

Every choice below has a reason you can defend in an interview. Pin major versions in `package.json` and check each tool's current docs before you start, because APIs change.

| Layer | Choice | Why | Alternative |
| --- | --- | --- | --- |
| Framework | Next.js (App Router), React, TypeScript | What you are learning; widely used | Remix, Nuxt |
| Validation | Zod | One schema for forms, API inputs and environment variables | Valibot |
| Database | PostgreSQL hosted on Neon (Docker Postgres locally and in CI) | Transactions and constraints that make jobs safe, and no database server to maintain | Supabase, Postgres on your own VPS |
| ORM | Drizzle ORM with drizzle-kit | Plain TypeScript, no code-generation step, simple Docker images | Prisma |
| Auth | Clerk | Hosted sign-in, so passwords never touch your server or database; ready-made UI components | Better Auth, Auth.js |
| Queue | BullMQ on Redis (Upstash in production, Docker Redis locally) | The default Node.js job queue, with retries, delays and schedulers | pg-boss (uses your Neon Postgres, no Redis) |
| Worker build | tsup | Bundles `src/worker` into `dist/` for the worker image | tsx in production |
| UI | Tailwind CSS and shadcn/ui | Fast, consistent, accessible components | Mantine |
| i18n | next-intl (French first, Arabic RTL later) | Locale routing and RTL support | Lingui |
| PDF | @react-pdf/renderer for French PDFs | Pure Node, no browser needed | Headless Chromium for Arabic |
| Email | Resend in production; Mailpit locally and in CI, behind one `Mailer` interface | Simple API, delivery handled for you, and the interface lets tests read emails without sending any | Nodemailer with any SMTP provider, SES |
| File storage | Local disk behind a `Storage` interface | No extra service; swap for S3 later | S3-compatible bucket |
| Logging | pino (JSON logs) | Structured, searchable | winston |
| Tests | Vitest, Testing Library, Playwright | Fast unit tests, real browser tests | Jest |
| Containers | Docker multi-stage build, Docker Compose | Reproducible builds and deploys | Kubernetes (too much for now) |
| CI/CD | GitHub Actions and GitHub Container Registry (GHCR) | Free for most projects, widely used | GitLab CI |
| Proxy and TLS | Caddy | Automatic HTTPS with a four-line config | Nginx, Traefik |
| Hosting | One VPS running Docker Compose (web, worker and Caddy only) | Cheap and enough to learn the real thing | Railway, Fly.io |

Decisions to record as short ADRs in `docs/adr/`:

1. **Separate worker process.** Long jobs never block web requests, and the worker restarts and scales on its own. Next.js only enqueues and returns.
2. **Two images from one Dockerfile.** The `web` target uses Next.js standalone output, which is small but only contains what the web server needs. The `worker` target installs its own production dependencies.
3. **Queue code in one folder.** Keep every BullMQ call inside `src/server/queue/`. If you later prefer pg-boss, only that folder changes.
4. **Derived overdue status.** Compute it from the due date instead of storing it.
5. **Money as integers.** Store amounts in centimes (1 DA = 100 centimes) to avoid floating-point errors.
6. **Managed services behind small interfaces.** Neon, Upstash, Resend and Clerk each have a reason (less to run, free tiers) and an exit plan (Postgres is standard, pg-boss replaces Redis, `Mailer` hides Resend, `requireOrg()` hides Clerk). Write the exit plan down.

## Repository structure

One repository, one `package.json`, two runtime entry points: the Next.js server and the worker. The folder `src/server` is the shared core that both use.

```text
fatoura/
├── .github/
│   ├── workflows/ci.yml
│   ├── workflows/cd.yml
│   └── dependabot.yml
├── deploy/
│   ├── docker-compose.yml          # production stack
│   ├── Caddyfile
│   └── .env.production.example
├── docs/
│   ├── adr/                        # architecture decision records
│   └── devlog.md
├── drizzle/                        # generated SQL migrations (commit them)
├── src/
│   ├── proxy.ts                    # Clerk middleware (middleware.ts on Next.js 15 or older)
│   ├── lib/
│   │   └── auth.ts                 # requireOrg(); web only, imports Clerk
│   ├── app/                        # Next.js routes (web only)
│   │   ├── sign-in/[[...sign-in]]/page.tsx
│   │   ├── sign-up/[[...sign-up]]/page.tsx
│   │   ├── [locale]/(app)/         # dashboard, invoices, clients, settings
│   │   ├── i/[token]/page.tsx      # public invoice page
│   │   └── api/
│   │       ├── health/route.ts
│   │       ├── webhooks/payments/route.ts
│   │       └── exports/[id]/route.ts
│   ├── server/                     # shared by web AND worker, no next/* or Clerk imports
│   │   ├── env.ts                  # Zod-validated environment variables
│   │   ├── db/                     # schema.ts, index.ts, migrate.ts
│   │   ├── queue/                  # connection.ts, queues.ts, enqueue.ts
│   │   ├── domain/                 # pure logic: invoices, payments, reminders
│   │   └── services/               # pdf/, mailer.ts, storage/, users.ts
│   └── worker/
│       ├── index.ts                # starts workers and schedulers, handles SIGTERM
│       ├── schedulers.ts
│       └── processors/             # one file per job
├── tests/                          # unit/, integration/, e2e/
├── tools/mock-gateway/             # tiny service that simulates a payment page
├── Dockerfile
├── docker-compose.dev.yml
├── drizzle.config.ts
├── tsup.config.ts
├── vitest.config.ts
├── next.config.ts
└── README.md
```

Rules that keep the codebase clean:

1. `src/server` never imports from `next/*`, `@clerk/*` or `src/app`, because the worker bundles it and has no Next.js runtime. Anything that touches Clerk lives in `src/lib/auth.ts`.
2. Business rules (totals, VAT, status changes, reminder dates) are pure functions in `src/server/domain`. No database, no network. They are the fastest tests you will write.
3. Route handlers and Server Actions stay thin: validate input with Zod, call a domain or service function, return the result.
4. Every job has one processor file and a Zod schema for its payload. Validate the payload as the first line of the processor.
5. Read environment variables only in `src/server/env.ts`. The app and the worker crash at startup if a variable is missing. Clerk's SDK reads its own `CLERK_*` variables directly, so list them in `env.ts` too, to get the same crash at startup when one is missing.

Three small config files to create now:

```ts
// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
};

export default nextConfig;
```

```ts
// drizzle.config.ts
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/server/db/schema.ts",
  out: "./drizzle",
  // Neon: use the direct (unpooled) connection for migrations.
  dbCredentials: { url: (process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL)! },
});
```

```ts
// tsup.config.ts
import { defineConfig } from "tsup";

export default defineConfig({
  entry: { worker: "src/worker/index.ts", migrate: "src/server/db/migrate.ts" },
  format: ["cjs"],
  target: "node24",
  outDir: "dist",
  clean: true,
  sourcemap: true,
});
```

## Data model

The database, not your code, should stop duplicate emails, duplicate payments and cross-tenant leaks. Each unique constraint below exists because a job can run twice.

| Table | Key columns | Constraint that matters |
| --- | --- | --- |
| users | clerk\_user\_id, name, email | Unique on clerk\_user\_id. A copy of what Clerk knows, created on first login |
| organizations | name, address, tax identifiers (NIF, NIS, RC, AI), locale | Tax identifier fields are on the organization, and you verify the legal list with an accountant |
| memberships | org\_id, user\_id (points to `users`), role | Unique on (org\_id, user\_id) |
| clients | org\_id, name, email, address | Index on org\_id |
| products | org\_id, name, unit price, VAT rate | Index on org\_id |
| invoice\_counters | org\_id, year, last\_number | Updated with `UPDATE ... RETURNING` inside the invoice transaction, so numbers never repeat |
| invoices | org\_id, client\_id, number, status, issue\_date, due\_date, subtotal, vat, total, public\_token, pdf\_key | Unique on (org\_id, number) and on public\_token; index on (org\_id, status, due\_date) |
| invoice\_items | invoice\_id, description, quantity, unit price, VAT rate | Foreign key to invoices |
| payments | invoice\_id, amount, method, provider, provider\_ref, paid\_at | Unique on (provider, provider\_ref) |
| webhook\_events | provider, event\_id, payload, received\_at, processed\_at | Unique on (provider, event\_id) |
| reminder\_rules | org\_id, offset\_days (for example -3, 0, 7), template | Index on org\_id |
| reminder\_log | invoice\_id, rule\_id, sent\_at | Unique on (invoice\_id, rule\_id) |
| email\_log | key, to, subject, status, attempts | Unique on key |
| recurring\_schedules | org\_id, client\_id, template, interval, next\_run\_date | Index on next\_run\_date |
| recurring\_runs | schedule\_id, period | Unique on (schedule\_id, period) |
| exports | org\_id, status, progress, file\_key, error | Index on (org\_id, created\_at) |
| audit\_log | org\_id, actor\_id, action, entity, entity\_id, before, after, created\_at | Append-only, never updated |

Clerk keeps passwords and sessions, so there are no password or session tables in your database. Your `users` table holds only the Clerk user id plus a copy of the name and email. Keep the copy because background jobs, such as "email the owner that an invoice was paid", run when nobody is logged in and should not have to call Clerk. Link `memberships` to your own `users.id`, not directly to the Clerk id.

### Money rules

1. Store every amount as an integer number of centimes (1 DA = 100 centimes). Use `bigint` with `mode: "number"` in Drizzle so large invoices do not overflow a 32-bit integer.
2. Store VAT rates in basis points (1900 means 19%). Confirm current Algerian VAT rates and invoice rules with an accountant before you rely on them.
3. Calculate VAT once per rate on the sum of the lines, rounding half up. Write this in an ADR, because per-line rounding gives different totals.
4. Put both examples below in your first unit tests.

| Case | Lines | VAT 19% | Total |
| --- | --- | --- | --- |
| Simple | 2 × 5 000,00 DA + 1 × 2 500,00 DA = 12 500,00 DA | 2 375,00 DA | 14 875,00 DA |
| Rounding | 3 × 33,33 DA = 99,99 DA | 19,00 DA per invoice (per-line rounding would give 18,99 DA) | 118,99 DA |

### Schema excerpt (Drizzle)

Create `src/server/db/schema.ts` with the three tables that carry the idempotency rules. Add the rest in the same style. Check your Drizzle version, because the third argument of `pgTable` has changed shape between releases.

```ts
import {
  bigint, date, index, jsonb, pgEnum, pgTable, text, timestamp, uniqueIndex, uuid,
} from "drizzle-orm/pg-core";

export const invoiceStatus = pgEnum("invoice_status", ["draft", "sent", "paid", "void"]);

export const invoices = pgTable(
  "invoices",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id").notNull(),
    clientId: uuid("client_id").notNull(),
    number: text("number").notNull(),
    status: invoiceStatus("status").notNull().default("draft"),
    issueDate: date("issue_date").notNull(),
    dueDate: date("due_date").notNull(),
    subtotalCentimes: bigint("subtotal_centimes", { mode: "number" }).notNull(),
    vatCentimes: bigint("vat_centimes", { mode: "number" }).notNull(),
    totalCentimes: bigint("total_centimes", { mode: "number" }).notNull(),
    publicToken: text("public_token").notNull(),
    pdfKey: text("pdf_key"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("invoices_org_number_uq").on(t.orgId, t.number),
    uniqueIndex("invoices_public_token_uq").on(t.publicToken),
    index("invoices_org_status_due_idx").on(t.orgId, t.status, t.dueDate),
  ],
);

export const reminderLog = pgTable(
  "reminder_log",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    invoiceId: uuid("invoice_id").notNull().references(() => invoices.id),
    ruleId: uuid("rule_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    sentAt: timestamp("sent_at", { withTimezone: true }),
  },
  (t) => [uniqueIndex("reminder_log_invoice_rule_uq").on(t.invoiceId, t.ruleId)],
);

export const webhookEvents = pgTable(
  "webhook_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    provider: text("provider").notNull(),
    eventId: text("event_id").notNull(),
    payload: jsonb("payload").notNull(),
    receivedAt: timestamp("received_at", { withTimezone: true }).notNull().defaultNow(),
    processedAt: timestamp("processed_at", { withTimezone: true }),
  },
  (t) => [uniqueIndex("webhook_events_provider_event_uq").on(t.provider, t.eventId)],
);
```

### Tenant isolation

Every query on tenant data must filter by `org_id`. Write repository functions that require `orgId` as their first argument, so a query without it cannot compile. Prove it with an integration test: a user from organization A requests an invoice from organization B and gets nothing. Postgres row-level security is a good stretch goal.

The `orgId` always comes from your own `memberships` table (through `requireOrg()` below), never from the URL, a form field or anything the browser sends.

### Authentication with Clerk

Clerk answers one question: "who is this person?" Your database answers the others: "which workspace do they belong to, and what can they do there?" Clerk's Organizations feature is not used, so roles and workspaces stay in your own tables.

Clerk's middleware reads the session on every request. On Next.js 16 the file is named `proxy.ts`; on Next.js 15 or older it is `middleware.ts`, and the code is the same. Clerk's current guidance deprecates listing protected routes in `createRouteMatcher()` and has you check authentication inside each resource instead. That matches this project's rule that every route and Server Action checks the session itself. The middleware stays plain, and the public invoice page and webhook routes are public simply because they never call `requireOrg()`.

```ts
// src/proxy.ts
import { clerkMiddleware } from "@clerk/nextjs/server";

export default clerkMiddleware();

export const config = {
  matcher: [
    // Skip Next.js internals and static files; copy the current version from Clerk's docs.
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
```

```ts
// src/lib/auth.ts  (web only: this file imports Clerk)
import { auth, currentUser } from "@clerk/nextjs/server";
import { ensureUserAndWorkspace } from "@/server/services/users";

export type OrgContext = { userId: string; orgId: string; role: "owner" | "accountant" | "viewer" };

export async function requireOrg(): Promise<OrgContext> {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) throw new Response("Unauthorized", { status: 401 });

  // First login: creates the users row, the workspace and the owner membership.
  // Later logins: just reads them. The Clerk API is only called the first time.
  return ensureUserAndWorkspace(clerkUserId, async () => {
    const u = await currentUser();
    return { name: u?.fullName ?? "", email: u?.primaryEmailAddress?.emailAddress ?? "" };
  });
}
```

Call `requireOrg()` first in every protected page, route handler and Server Action. Creating the `users` row on first login works on your laptop with no tunnel. Add Clerk webhooks later, only if you need to keep the name and email copy in sync. If you do, verify the signature, and record each event in `webhook_events` with provider `clerk` so duplicates are ignored the same way as payment events.

Two things to remember: the Clerk SDK reads its keys from environment variables, and the CSP you set in `next.config.ts` has to allow Clerk's own domains. Clerk's middleware has a `contentSecurityPolicy` option for this, so follow its docs.

## Background jobs

Fatoura runs eight jobs in a separate worker process. Next.js only enqueues work and returns immediately; the worker does the slow or unreliable part. Three rules make the jobs safe: assume each job runs more than once, retry with backoff, and log every attempt.

| Job | Trigger | What it does | Guard against duplicates | Retries |
| --- | --- | --- | --- | --- |
| `invoice.pdf` | Invoice is marked sent | Renders the PDF, saves it through the Storage interface, sets `pdf_key` | Job id `pdf-<invoiceId>`; skip if `pdf_key` is set | 5, exponential from 5 s |
| `invoice.email` | After the PDF is ready | Emails the client the public invoice link (through `Mailer`, so Resend in production) | `email_log` unique key `invoice-<invoiceId>` | 5, exponential from 30 s |
| `reminders.scan` | Scheduler, daily 07:00 (Africa/Algiers) | Finds sent invoices matching a reminder rule and enqueues sends | Unique (invoice\_id, rule\_id) in `reminder_log` | 3 |
| `reminder.send` | From the scan | Sends the reminder email and sets `sent_at` | `email_log` key `reminder-<invoiceId>-<ruleId>` | 5, exponential |
| `recurring.generate` | Scheduler, daily 06:00 | Creates invoices from schedules due today | Unique (schedule\_id, period) in `recurring_runs` | 3 |
| `export.csv` | User clicks Export | Streams rows to a CSV file and updates progress | Job id `export-<exportId>` | 2 |
| `payment.webhook` | Webhook route stores an event | Creates the payment, marks the invoice paid, writes the audit log | Unique (provider, event\_id) and (provider, provider\_ref) | 5 |
| `webhooks.sweep` | Scheduler, every minute | Re-enqueues stored events that were never processed | Same as `payment.webhook` | 3 |

### Rules for every job

1. **A job id stops duplicate enqueues. A database constraint stops duplicate effects. You need both.** Use hyphens in job ids, not colons.
2. **Pass ids, not data.** The payload is `{ invoiceId }`. The processor loads fresh data, so an old retry never emails stale amounts.
3. **Validate the payload first.** A bad payload throws `UnrecoverableError` so it fails once instead of retrying five times.
4. **Claim, then send.** For emails, insert the `email_log` row first with a unique key, send, then mark it sent. If the send fails, mark it failed and rethrow so the retry can claim it again. With Resend, the SDK returns `{ data, error }` instead of throwing, so your mailer must turn `error` into a thrown exception. Otherwise BullMQ sees a "successful" job and never retries. Also pass the same key to Resend as an idempotency key: the key should be unique per request and expires after 24 hours. That makes it a second safety net, and the `email_log` row stays the real guard.
5. **Retry with backoff.** Set `attempts` and an exponential `backoff` as queue defaults, and trim old jobs with `removeOnComplete` and `removeOnFail`. Resend limits requests per second, and exceeding the limit returns a 429 error; the docs currently give a default of 10 requests per second per team. A 429 is just a failed attempt, so backoff handles it. If it happens often, lower the `emails` worker concurrency or add a BullMQ `limiter`.
6. **Shut down gracefully.** On SIGTERM, close the workers so running jobs finish. Give the container a 60 second `stop_grace_period`.
7. **Log every attempt** with queue, job id, attempt number and duration, as JSON.
8. **Use the Algiers time zone** (`Africa/Algiers`) on every scheduler.

### Redis on Upstash

BullMQ is the one piece that needs care with Upstash.

1. **Use the TCP connection string**, from the TCP tab of the Upstash console. It starts with `rediss://` because Upstash requires TLS. BullMQ talks to Redis through ioredis over TCP, so the REST URL and token (used by `@upstash/redis`) are not what it needs. ioredis switches TLS on by itself when the URL starts with `rediss://`, so the connection code in the skeleton below does not change.
2. **Watch the bill.** BullMQ accesses Redis regularly even when no jobs are running, and Upstash's Pay-As-You-Go plan charges per request. Upstash recommends a Fixed plan for BullMQ use, to avoid a high command count and high costs. Check the free tier's current limits before you rely on it. This is also why local development uses a Docker Redis: idle polling from your laptop would burn commands for nothing.
3. **Leave eviction off.** BullMQ needs Redis to never delete keys on its own (the dev Compose file sets `noeviction` for the same reason). Check your database settings in the Upstash console.
4. **Use the region closest to your server**, so every queue call is fast.
5. **Escape hatch.** If command costs ever hurt, pg-boss stores its queue in your Neon Postgres and needs no Redis. Because all BullMQ calls live in `src/server/queue/`, only that folder changes (ADR 3).

### Payment webhook flow

1. On the public invoice page, the client clicks Pay. Fatoura asks the mock gateway for a payment session and redirects the client to its hosted page.
2. The mock gateway page has four buttons: succeed, fail, succeed with a duplicate webhook, and succeed after a 30 second delay.
3. The gateway sends `POST /api/webhooks/payments` with the event in the body and an HMAC-SHA256 signature of the raw body in a header, made with a shared secret. It also sends a timestamp, and you reject anything older than five minutes.
4. The route handler reads the raw body with `request.text()`, verifies the signature with `timingSafeEqual`, inserts the event into `webhook_events` (ignoring conflicts), enqueues `payment.webhook`, and returns 200 within milliseconds. This route is public: it never calls `requireOrg()`, because the gateway has no Clerk session. The signature is its only protection.
5. The processor checks that the amount matches the invoice, inserts the payment, marks the invoice paid in the same transaction, writes the audit log and enqueues a receipt email.
6. The sweeper job re-enqueues events with no `processed_at` older than a minute. Without it, a crash between the insert and the enqueue would lose a payment.
7. Write the test now: send the same webhook five times and assert there is exactly one payment.

### Code skeleton

```ts
// src/server/queue/queues.ts
import { Queue } from "bullmq";
import IORedis from "ioredis";
import { env } from "../env";

// REDIS_URL starts with rediss:// on Upstash (TLS is switched on automatically).
export const redisConnection = new IORedis(env.REDIS_URL, {
  maxRetriesPerRequest: null, // required by BullMQ workers
});

export type JobMap = {
  "invoice.pdf": { invoiceId: string };
  "invoice.email": { invoiceId: string };
  "reminder.send": { invoiceId: string; ruleId: string };
  "export.csv": { exportId: string };
  "payment.webhook": { eventId: string };
};

const defaultJobOptions = {
  attempts: 5,
  backoff: { type: "exponential" as const, delay: 5_000 },
  removeOnComplete: { age: 3_600, count: 1_000 },
  removeOnFail: { age: 7 * 24 * 3_600 },
};

const queues = new Map<string, Queue>();
export function getQueue(name: string) {
  if (!queues.has(name)) {
    queues.set(name, new Queue(name, { connection: redisConnection, defaultJobOptions }));
  }
  return queues.get(name)!;
}

// One place that knows which queue each job belongs to.
const queueOf: Record<keyof JobMap, string> = {
  "invoice.pdf": "invoices",
  "invoice.email": "emails",
  "reminder.send": "reminders",
  "export.csv": "exports",
  "payment.webhook": "payments",
};

export async function enqueue<K extends keyof JobMap>(name: K, data: JobMap[K], jobId: string) {
  await getQueue(queueOf[name]).add(name, data, { jobId });
}
```

```ts
// src/server/services/mailer.ts
import { Resend } from "resend";
import nodemailer from "nodemailer";
import { env } from "../env";

export type Mail = { to: string; subject: string; html: string; idempotencyKey?: string };
export interface Mailer {
  send(mail: Mail): Promise<void>;
}

// Production: Resend. The SDK returns { data, error } and does not throw,
// so we throw ourselves. That is what makes BullMQ retry.
class ResendMailer implements Mailer {
  private client = new Resend(env.RESEND_API_KEY);
  async send({ to, subject, html, idempotencyKey }: Mail) {
    const { error } = await this.client.emails.send({
      from: env.EMAIL_FROM,
      to,
      subject,
      html,
      idempotencyKey, // check the SDK docs for where your SDK version takes this option
    });
    if (error) throw new Error(`Resend: ${error.message}`);
  }
}

// Local and CI: Mailpit over SMTP. Nothing leaves your machine.
class SmtpMailer implements Mailer {
  private transport = nodemailer.createTransport({ host: env.SMTP_HOST, port: env.SMTP_PORT });
  async send({ to, subject, html }: Mail) {
    await this.transport.sendMail({ from: env.EMAIL_FROM, to, subject, html });
  }
}

export const mailer: Mailer = env.EMAIL_PROVIDER === "resend" ? new ResendMailer() : new SmtpMailer();
```

```sql
-- Claim an email slot: returns a row only if the email still needs sending.
INSERT INTO email_log (key, status, attempts, updated_at)
VALUES ($1, 'sending', 1, now())
ON CONFLICT (key) DO UPDATE
  SET status = 'sending', attempts = email_log.attempts + 1, updated_at = now()
  WHERE email_log.status = 'failed'
     OR (email_log.status = 'sending' AND email_log.updated_at < now() - interval '10 minutes')
RETURNING id;
```

```ts
// src/worker/processors/reminder-send.ts
import { UnrecoverableError, type Job } from "bullmq";
import { z } from "zod";

const payloadSchema = z.object({ invoiceId: z.string().uuid(), ruleId: z.string().uuid() });

export async function reminderSend(job: Job) {
  const parsed = payloadSchema.safeParse(job.data);
  if (!parsed.success) throw new UnrecoverableError("Invalid payload");
  const { invoiceId, ruleId } = parsed.data;

  const invoice = await getInvoiceForReminder(invoiceId); // loads fresh data
  if (!invoice || invoice.status !== "sent") return { skipped: "not payable" };

  const claim = await claimEmail(`reminder-${invoiceId}-${ruleId}`); // runs the SQL above
  if (!claim) return { skipped: "already sent" };

  try {
    await mailer.send({ to: invoice.clientEmail, subject: reminderSubject(invoice), html: renderReminder(invoice) });
    await markEmailSent(claim.id);
    await markReminderSent(invoiceId, ruleId);
    return { sent: true };
  } catch (err) {
    await markEmailFailed(claim.id);
    throw err; // BullMQ retries with backoff
  }
}
```

```ts
// src/worker/index.ts
import { Worker } from "bullmq";
import { redisConnection } from "@/server/queue/queues";
import { logger } from "@/server/logger";
import { processors } from "./processors"; // { invoices: fn, emails: fn, reminders: fn, ... }
import { registerSchedulers } from "./schedulers";

async function main() {
  const workers = Object.entries(processors).map(
    ([queueName, processor]) => new Worker(queueName, processor, { connection: redisConnection, concurrency: 5 }),
  );

  for (const w of workers) {
    w.on("completed", (job) => logger.info({ queue: w.name, jobId: job.id, name: job.name }, "job completed"));
    w.on("failed", (job, err) =>
      logger.error({ queue: w.name, jobId: job?.id, attempt: job?.attemptsMade, err }, "job failed"),
    );
  }

  await registerSchedulers();
  logger.info("worker started");

  const shutdown = async (signal: string) => {
    logger.info({ signal }, "shutting down");
    await Promise.all(workers.map((w) => w.close())); // waits for running jobs
    await redisConnection.quit();
    process.exit(0);
  };
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
  process.on("SIGINT", () => void shutdown("SIGINT"));
}

main().catch((err) => {
  logger.fatal({ err }, "worker crashed on startup");
  process.exit(1);
});
```

```ts
// src/worker/schedulers.ts
import { getQueue } from "@/server/queue/queues";

export async function registerSchedulers() {
  await getQueue("reminders").upsertJobScheduler(
    "reminders-scan-daily",
    { pattern: "0 7 * * *", tz: "Africa/Algiers" },
    { name: "reminders.scan", data: {} },
  );
  await getQueue("invoices").upsertJobScheduler(
    "recurring-generate-daily",
    { pattern: "0 6 * * *", tz: "Africa/Algiers" },
    { name: "recurring.generate", data: {} },
  );
  await getQueue("payments").upsertJobScheduler(
    "webhooks-sweep-minutely",
    { pattern: "* * * * *" },
    { name: "webhooks.sweep", data: {} },
  );
}
```

The helpers named in the processor (`getInvoiceForReminder`, `claimEmail`, `markEmailSent` and the others) are yours to write in `src/server/domain` and `src/server/services`. Job schedulers replaced repeatable jobs in recent BullMQ 5.x releases, so check the BullMQ docs for the exact API of the version you install. Cache the Redis connection on `globalThis` in Next.js development, so hot reloads do not open a new connection each time.

## Database on Neon

1. **Two connection strings.** Neon gives you a pooled one (the host name contains `-pooler`) and a direct one. Use the pooled string as `DATABASE_URL` for the running app and worker, and the direct string as `DATABASE_URL_UNPOOLED` for migrations. Both need `sslmode=require`.
2. **Standard driver.** Because the app runs as a long-lived server on your VPS, the normal `pg` driver with Drizzle's `node-postgres` adapter works. You do not need Neon's serverless driver. Keep the `Pool` size small, since the pooler already shares connections.
3. **Idle databases pause.** On smaller plans, Neon suspends an idle database after a few minutes, and the first query afterward is slower. Keep retries on startup and in the smoke test, and check Neon's plan page for the current rules. Note that Docker's health check calls `/api/health` every 15 seconds and that route queries the database, so it keeps Neon awake around the clock. That is fine on a paid plan. On a free plan, make the Docker health check skip the database query and keep the full check for the smoke test.
4. **Pick the region closest to your VPS.** From Algiers a European region is usually the closest, but check the latency yourself.
5. **Keep environments apart.** Use separate Neon projects or branches for development, staging and production, so a bad migration in staging never touches production.

## Docker

One Dockerfile builds two images: `web` (the Next.js server) and `worker` (the BullMQ process, which also runs migrations). Create `public/.gitkeep` so the `public` folder exists, because the web stage copies it.

### Dockerfile

```dockerfile
# syntax=docker/dockerfile:1.7
FROM node:24-alpine AS base
WORKDIR /app
RUN apk add --no-cache libc6-compat
ENV NEXT_TELEMETRY_DISABLED=1

# 1) All dependencies, used for building
FROM base AS deps
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci

# 2) Production dependencies only, used by the worker
FROM base AS prod-deps
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci --omit=dev

# 3) Build the Next.js app and the worker bundle
FROM base AS builder
# Clerk's publishable key is public by design. Next.js bakes NEXT_PUBLIC_ variables in at build time.
ARG NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
ENV NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=$NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN SKIP_ENV_VALIDATION=1 npm run build && npm run build:worker

# 4) Web image
FROM base AS web
ARG GIT_SHA=dev
ENV NODE_ENV=production PORT=3000 HOSTNAME=0.0.0.0 GIT_SHA=$GIT_SHA
RUN mkdir -p /data/storage && chown node:node /data/storage
COPY --from=builder --chown=node:node /app/public ./public
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static
USER node
EXPOSE 3000
CMD ["node", "server.js"]

# 5) Worker image (also runs migrations)
FROM base AS worker
ARG GIT_SHA=dev
ENV NODE_ENV=production GIT_SHA=$GIT_SHA
RUN mkdir -p /data/storage && chown node:node /data/storage
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/drizzle ./drizzle
COPY package.json ./
USER node
CMD ["node", "dist/worker.js"]
```

Why it looks like this:

1. The `web` target copies Next.js standalone output, which holds only what the web server needs. It contains no worker dependencies, so the worker gets its own `prod-deps` stage.
2. Both final stages run as the non-root `node` user.
3. `SKIP_ENV_VALIDATION=1` lets `next build` run without real secrets. Make `src/server/env.ts` skip validation when that variable is set, and validate at runtime.
4. Secrets are never baked into an image. They arrive at runtime through `env_file`. The one exception is Clerk's publishable key: it is safe to expose, and Next.js needs it at build time, so it is passed as a build argument.

Test both targets locally:

```bash
docker build --target web -t fatoura-web --build-arg GIT_SHA=local \
  --build-arg NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxx .
docker build --target worker -t fatoura-worker .
```

### .dockerignore

```text
node_modules
.next
dist
.git
.github
coverage
deploy
docs
tests/e2e
.env
.env.*
!.env.example
*.log
```

### Development Compose (`docker-compose.dev.yml`)

Local development runs Postgres, Redis and Mailpit in Docker, even though production uses Neon, Upstash and Resend. It is free, works offline, does not burn Upstash commands, and is the same kind of Postgres and Redis your CI tests against. Compose runs only the infrastructure. You run `npm run dev` and `npm run worker:dev` on your machine, so hot reload stays fast. If you prefer, you can point `DATABASE_URL` at a Neon development branch instead of the local container.

```yaml
services:
  postgres:
    image: postgres:17-alpine
    environment:
      POSTGRES_USER: fatoura
      POSTGRES_PASSWORD: fatoura
      POSTGRES_DB: fatoura
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U fatoura -d fatoura"]
      interval: 5s
      timeout: 5s
      retries: 10

  redis:
    image: redis:7-alpine
    command: ["redis-server", "--appendonly", "yes", "--maxmemory-policy", "noeviction"]
    ports:
      - "6379:6379"
    volumes:
      - redisdata:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 5s
      retries: 10

  mailpit:
    image: axllent/mailpit
    ports:
      - "1025:1025"   # SMTP
      - "8025:8025"   # web inbox at http://localhost:8025

volumes:
  pgdata:
  redisdata:
```

Your local `.env`:

```bash
DATABASE_URL=postgres://fatoura:fatoura@localhost:5432/fatoura
REDIS_URL=redis://localhost:6379
APP_URL=http://localhost:3000
# Clerk development instance (from the Clerk dashboard)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxx
CLERK_SECRET_KEY=sk_test_xxx
# Email: Mailpit locally, Resend only in production
EMAIL_PROVIDER=smtp
EMAIL_FROM="Fatoura <no-reply@localhost>"
SMTP_HOST=localhost
SMTP_PORT=1025
STORAGE_DIR=./.storage
PAYMENT_WEBHOOK_SECRET=dev-webhook-secret
TZ=Africa/Algiers
```

### Production Compose (`deploy/docker-compose.yml`)

This runs on your server. Postgres and Redis are no longer part of the stack, because they live at Neon and Upstash. Only Caddy faces the internet.

```yaml
name: fatoura

x-app: &app
  env_file: .env.production
  restart: unless-stopped

services:
  caddy:
    image: caddy:2-alpine
    restart: unless-stopped
    environment:
      APP_DOMAIN: ${APP_DOMAIN}
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile:ro
      - caddy_data:/data
      - caddy_config:/config
    depends_on:
      web:
        condition: service_healthy

  web:
    <<: *app
    image: ghcr.io/${GH_OWNER}/fatoura-web:${TAG:-latest}
    volumes:
      - storage:/data/storage
    depends_on:
      migrate:
        condition: service_completed_successfully
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://127.0.0.1:3000/api/health"]
      interval: 15s
      timeout: 5s
      retries: 5
      start_period: 20s

  worker:
    <<: *app
    image: ghcr.io/${GH_OWNER}/fatoura-worker:${TAG:-latest}
    command: ["node", "dist/worker.js"]
    stop_grace_period: 60s
    volumes:
      - storage:/data/storage
    depends_on:
      migrate:
        condition: service_completed_successfully

  migrate:
    image: ghcr.io/${GH_OWNER}/fatoura-worker:${TAG:-latest}
    env_file: .env.production
    command: ["node", "dist/migrate.js"]
    restart: "no"

volumes:
  caddy_data:
  caddy_config:
  storage:
```

```text
# deploy/Caddyfile
{$APP_DOMAIN} {
    encode zstd gzip
    reverse_proxy web:3000
}
```

Compose reads two files on the server. `.env` holds the Compose variables: `GH_OWNER`, `TAG` and `APP_DOMAIN`. `.env.production` holds the app secrets (see the CD section). If you have no domain yet, you can use a free wildcard DNS name for your server IP, such as one from sslip.io, so Caddy can still issue a certificate. Clerk's production instance and Resend's sender verification both need a domain you control, though. Until you have one, use Clerk's development keys and Resend's test sender, which is meant for testing only.

### Migration script and health endpoint

```ts
// src/server/db/migrate.ts
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";

async function main() {
  // Neon: migrations use the direct connection, not the pooler.
  const connectionString = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;
  const pool = new Pool({ connectionString });
  await migrate(drizzle(pool), { migrationsFolder: "./drizzle" });
  await pool.end();
  console.log("migrations applied");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

```ts
// src/app/api/health/route.ts
import { sql } from "drizzle-orm";
import { db } from "@/server/db";
import { redisConnection } from "@/server/queue/queues";

export const dynamic = "force-dynamic";

export async function GET() {
  const checks = { db: false, redis: false };
  try { await db.execute(sql`select 1`); checks.db = true; } catch {}
  try { checks.redis = (await redisConnection.ping()) === "PONG"; } catch {}
  const ok = checks.db && checks.redis;
  return Response.json(
    { status: ok ? "ok" : "degraded", checks, version: process.env.GIT_SHA ?? "dev" },
    { status: ok ? 200 : 503 },
  );
}
```

## CI workflow

Continuous integration runs on every pull request and on `main`. It should finish in under six minutes and fail loudly. It runs your tests against real Postgres and Redis (GitHub starts them as throwaway service containers, so CI never touches Neon or Upstash), then proves both Docker images build.

```yaml
# .github/workflows/ci.yml
name: CI

on:
  pull_request:
  push:
    branches: [main]

concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true

permissions:
  contents: read

jobs:
  checks:
    name: Lint, types, tests
    runs-on: ubuntu-latest
    timeout-minutes: 15

    services:
      postgres:
        image: postgres:17-alpine
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: fatoura_test
        ports:
          - 5432:5432
        options: >-
          --health-cmd "pg_isready -U test -d fatoura_test"
          --health-interval 5s
          --health-timeout 5s
          --health-retries 10
      redis:
        image: redis:7-alpine
        ports:
          - 6379:6379
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 5s
          --health-timeout 5s
          --health-retries 10

    env:
      DATABASE_URL: postgres://test:test@localhost:5432/fatoura_test
      REDIS_URL: redis://localhost:6379
      APP_URL: http://localhost:3000
      # Clerk development keys, stored in GitHub (Settings, Secrets and variables)
      NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: ${{ vars.CLERK_PUBLISHABLE_KEY_DEV }}
      CLERK_SECRET_KEY: ${{ secrets.CLERK_SECRET_KEY_DEV }}
      PAYMENT_WEBHOOK_SECRET: ci-webhook-secret
      EMAIL_PROVIDER: smtp
      EMAIL_FROM: ci@example.com
      SMTP_HOST: localhost
      SMTP_PORT: "1025"
      STORAGE_DIR: ./.storage
      TZ: Africa/Algiers

    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 24
          cache: npm
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck
      - run: npm run db:migrate
      - run: npm test
      - run: npm run build
        env:
          SKIP_ENV_VALIDATION: "1"

  docker:
    name: Docker build (${{ matrix.target }})
    runs-on: ubuntu-latest
    needs: checks
    timeout-minutes: 20
    strategy:
      matrix:
        target: [web, worker]
    steps:
      - uses: actions/checkout@v4
      - uses: docker/setup-buildx-action@v3
      - uses: docker/build-push-action@v6
        with:
          context: .
          target: ${{ matrix.target }}
          push: false
          build-args: |
            NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=${{ vars.CLERK_PUBLISHABLE_KEY_DEV }}
          cache-from: type=gha,scope=${{ matrix.target }}
          cache-to: type=gha,mode=max,scope=${{ matrix.target }}
```

What each part is for:

1. `concurrency` cancels an older run when you push again, so you never wait on stale results.
2. `permissions: contents: read` gives the workflow the least access it needs.
3. `services` starts Postgres and Redis with health checks, so integration tests hit real databases, not mocks. They are throwaway containers on purpose: tests never touch your Neon or Upstash data, and never use up Upstash commands.
4. `db:migrate` applies your migrations to the empty test database. This also proves your migrations work from scratch on every pull request.
5. The `docker` job builds both targets without pushing, so a broken Dockerfile fails the pull request and not the deploy.
6. The versions shown (`checkout@v4`, `setup-node@v4` and so on) were current when this was written. Dependabot, below, keeps them updated.
7. Tests never call Clerk or Resend. Clerk's `auth()` is mocked in tests, and email goes to Mailpit through `EMAIL_PROVIDER=smtp`. The Clerk keys exist only so the build can compile.

```yaml
# .github/dependabot.yml
version: 2
updates:
  - package-ecosystem: npm
    directory: /
    schedule:
      interval: weekly
    open-pull-requests-limit: 5
  - package-ecosystem: github-actions
    directory: /
    schedule:
      interval: weekly
  - package-ecosystem: docker
    directory: /
    schedule:
      interval: weekly
```

Branch protection for `main` (Settings, Branches): require a pull request, require the status checks `Lint, types, tests` and both `Docker build` jobs, and block force pushes.

Add the end-to-end tests in week 6, as a third job:

1. Install Chromium with `npx playwright install --with-deps chromium`.
2. Start the web app through Playwright's `webServer` option, and start the worker as a background step, because the invoice flow needs the PDF and email jobs to run.
3. Point SMTP at a Mailpit service container so the test can read the email.
4. Sign in through a Clerk test user or Clerk's testing helpers. Check Clerk's current testing guide for the supported approach.
5. Upload the Playwright report as an artifact when the job fails.

## CD workflow

Continuous delivery runs when code lands on `main`. It builds both images, pushes them to GitHub Container Registry (GHCR) tagged with the commit SHA, deploys over SSH, and then checks that the app answers. Production waits for your approval. Two files do the work: `cd.yml` builds and decides, and `deploy.yml` is a reusable workflow that deploys to one environment.

```yaml
# .github/workflows/cd.yml
name: CD

on:
  push:
    branches: [main]
  workflow_dispatch:
    inputs:
      tag:
        description: "Existing image tag to redeploy (rollback). Leave empty to build the current commit."
        required: false
        type: string

concurrency:
  group: cd
  cancel-in-progress: false

permissions:
  contents: read
  packages: write

jobs:
  build:
    name: Build and push (${{ matrix.target }})
    if: ${{ !inputs.tag }}
    runs-on: ubuntu-latest
    timeout-minutes: 25
    strategy:
      matrix:
        target: [web, worker]
    steps:
      - uses: actions/checkout@v4
      - name: Lowercase the owner name (GHCR needs lowercase)
        run: echo "OWNER=${GITHUB_REPOSITORY_OWNER,,}" >> "$GITHUB_ENV"
      - uses: docker/setup-buildx-action@v3
      - uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      - uses: docker/build-push-action@v6
        with:
          context: .
          target: ${{ matrix.target }}
          push: true
          build-args: |
            GIT_SHA=${{ github.sha }}
            NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=${{ vars.CLERK_PUBLISHABLE_KEY }}
          tags: |
            ghcr.io/${{ env.OWNER }}/fatoura-${{ matrix.target }}:${{ github.sha }}
            ghcr.io/${{ env.OWNER }}/fatoura-${{ matrix.target }}:latest
          cache-from: type=gha,scope=${{ matrix.target }}
          cache-to: type=gha,mode=max,scope=${{ matrix.target }}

  staging:
    needs: build
    if: ${{ !cancelled() && (needs.build.result == 'success' || needs.build.result == 'skipped') }}
    uses: ./.github/workflows/deploy.yml
    with:
      environment: staging
      tag: ${{ inputs.tag || github.sha }}
    secrets: inherit

  production:
    needs: staging
    if: ${{ !cancelled() && needs.staging.result == 'success' }}
    uses: ./.github/workflows/deploy.yml
    with:
      environment: production
      tag: ${{ inputs.tag || github.sha }}
    secrets: inherit
```

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  workflow_call:
    inputs:
      environment:
        required: true
        type: string
      tag:
        required: true
        type: string

permissions:
  contents: read

jobs:
  deploy:
    name: Deploy ${{ inputs.tag }} to ${{ inputs.environment }}
    runs-on: ubuntu-latest
    environment: ${{ inputs.environment }}
    timeout-minutes: 15
    steps:
      - uses: actions/checkout@v4

      - name: Set up SSH
        env:
          SSH_KEY: ${{ secrets.DEPLOY_SSH_KEY }}
          KNOWN_HOSTS: ${{ secrets.DEPLOY_KNOWN_HOSTS }}
        run: |
          install -m 700 -d ~/.ssh
          printf '%s\n' "$SSH_KEY" > ~/.ssh/id_ed25519
          chmod 600 ~/.ssh/id_ed25519
          printf '%s\n' "$KNOWN_HOSTS" > ~/.ssh/known_hosts

      - name: Copy deploy files
        run: |
          scp deploy/docker-compose.yml deploy/Caddyfile \
            "${{ vars.DEPLOY_USER }}@${{ vars.DEPLOY_HOST }}:${{ vars.DEPLOY_PATH }}/"

      - name: Deploy
        run: |
          OWNER="${GITHUB_REPOSITORY_OWNER,,}"
          ssh "${{ vars.DEPLOY_USER }}@${{ vars.DEPLOY_HOST }}" bash -s <<EOF
            set -euo pipefail
            cd "${{ vars.DEPLOY_PATH }}"
            sed -i '/^TAG=/d;/^GH_OWNER=/d' .env
            echo "TAG=${{ inputs.tag }}" >> .env
            echo "GH_OWNER=${OWNER}" >> .env
            docker compose pull
            docker compose up -d --remove-orphans
            docker image prune -f
          EOF

      - name: Smoke test
        run: |
          for i in $(seq 1 24); do
            if curl -fsS "${{ vars.APP_URL }}/api/health"; then
              echo; echo "Healthy"; exit 0
            fi
            echo "Waiting for the app... ($i/24)"; sleep 5
          done
          echo "Smoke test failed"; exit 1
```

How it behaves:

1. **Images are tagged with the commit SHA**, so every deploy is traceable and every old version stays available.
2. **Rollback** is a manual run: Actions, CD, Run workflow, and enter an older SHA in `tag`. The build job is skipped and the old images are deployed. Write database migrations that stay compatible with the previous version (add columns first, remove them in a later release), because rollback does not undo migrations. Neon's branching and point-in-time restore are your safety net for a migration that goes wrong, but a restore is a bigger step than a rollback, so keep migrations backward compatible.
3. **Approval gate.** In the `production` environment, add yourself as a required reviewer. The production job pauses until you approve it.
4. **One server only?** Delete the `staging` job and call `deploy.yml` once with `production`. A staging environment is nice, not required.
5. A failed smoke test fails the run, which is your signal to roll back. The smoke test also waits for Neon to wake up if it was paused.
6. **The Clerk publishable key is baked into the image**, so staging and production, which deploy the same image, share one key. Clerk's production instance is tied to one domain, so for a portfolio project the simplest path is a single deploy target (point 4).

### Managed services setup

Do this once, before your first deploy.

1. **Neon.** Create a project in the region closest to your server. Copy the pooled connection string (for `DATABASE_URL`) and the direct one (for `DATABASE_URL_UNPOOLED`). Both must include `sslmode=require`.
2. **Upstash.** Create a Redis database in the same region. Copy the TCP connection string that starts with `rediss://`. Leave eviction off, and look at the Fixed plan before the free tier's command limits surprise you.
3. **Resend.** Add your domain and create the DNS records it asks for. Production emails need a verified domain in the `from` address, while the test sender is for testing only. Create an API key and keep it only in `.env.production`.
4. **Clerk.** Keep using the development instance locally. For production, create a production instance on your domain. Copy the live publishable key into a GitHub repository variable named `CLERK_PUBLISHABLE_KEY`, and the live secret key into `.env.production`.

### One-time server setup

1. Rent a small Ubuntu LTS VPS. With the databases hosted elsewhere, 1 to 2 GB of RAM is a reasonable start. Check with `docker stats` after you deploy.
2. Create a non-root user named `deploy`, add it to the `docker` group, turn off SSH password login, and allow only ports 22, 80 and 443 in the firewall.
3. Install Docker Engine with the Compose plugin.
4. Create the project folder, for example `~/fatoura`, with two files: `.env` (Compose variables) and `.env.production` (app secrets, below). Run `chmod 600` on both. Create `.env` with `APP_DOMAIN`; the workflow adds `TAG` and `GH_OWNER`.
5. Generate a dedicated deploy key on your computer with `ssh-keygen -t ed25519 -f deploy_key -C github-actions`. Add the public key to `~/.ssh/authorized_keys` of the `deploy` user. The private key becomes the `DEPLOY_SSH_KEY` secret. Save the output of `ssh-keyscan -H <your-host>` as `DEPLOY_KNOWN_HOSTS`.
6. If your GHCR packages are private, log in once on the server with a personal access token that has only the `read:packages` scope: `docker login ghcr.io -u <github-user>`. Making the packages public is the simpler option for a portfolio project.
7. In GitHub, open Settings, Environments, and create `staging` and `production`. Add the variables and secrets from the table below. `CLERK_PUBLISHABLE_KEY` and `CLERK_PUBLISHABLE_KEY_DEV` are repository variables, not environment ones, because the build and CI jobs run outside the environments.

| Name | Type | Example or source |
| --- | --- | --- |
| `DEPLOY_HOST` | Variable | Server IP or hostname |
| `DEPLOY_USER` | Variable | `deploy` |
| `DEPLOY_PATH` | Variable | `/home/deploy/fatoura` |
| `APP_URL` | Variable | `https://fatoura.example.com` |
| `DEPLOY_SSH_KEY` | Secret | Private half of the deploy key |
| `DEPLOY_KNOWN_HOSTS` | Secret | Output of `ssh-keyscan -H <host>` |
| `CLERK_PUBLISHABLE_KEY` | Repository variable | Clerk production publishable key (used at image build) |
| `CLERK_PUBLISHABLE_KEY_DEV` | Repository variable | Clerk development publishable key (used by CI) |
| `CLERK_SECRET_KEY_DEV` | Repository secret | Clerk development secret key (used by CI) |

Contents of `.env.production` on the server:

```bash
NODE_ENV=production
APP_URL=https://fatoura.example.com
# Neon: pooled string for the app, direct string for migrations (both with sslmode=require)
DATABASE_URL=<pooled connection string from the Neon dashboard>
DATABASE_URL_UNPOOLED=<direct connection string from the Neon dashboard>
# Upstash: the TCP string, starting with rediss://
REDIS_URL=rediss://default:<password>@<endpoint>:6379
# Clerk production instance
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=<pk_live_...>
CLERK_SECRET_KEY=<sk_live_...>
# Resend
EMAIL_PROVIDER=resend
RESEND_API_KEY=<re_...>
EMAIL_FROM="Fatoura <no-reply@fatoura.example.com>"
PAYMENT_WEBHOOK_SECRET=<output of: openssl rand -hex 32>
STORAGE_DIR=/data/storage
TZ=Africa/Algiers
```

No server or no international card yet? Finish the CI workflow and the image publishing to GHCR first, since both are free. You can add the deploy target later without changing anything else, and I can help you look for options that work from Algeria. Neon, Upstash, Resend and Clerk all offer free tiers, but check each sign-up page for payment requirements and current limits.

## Quality and security

Test the parts where bugs cost money first: totals, status changes, duplicate jobs and tenant isolation. Skip chasing a coverage number. The table below says what to test at each layer.

| Layer | Tool | What to test | Runs in |
| --- | --- | --- | --- |
| Unit | Vitest | Totals and VAT rounding, status transitions, reminder date rules, Zod schemas | CI, every pull request |
| Integration | Vitest with real Postgres and Redis | Repositories require `orgId`; unique constraints; a processor run twice sends once; the webhook sent five times creates one payment; bad signature gets 401; with Clerk's `auth()` mocked, a signed-out request gets 401 and a new user gets a workspace once | CI, every pull request |
| Queue | Vitest with a real worker | A failing mailer retries and then succeeds (including a Resend-style `{ error }` result becoming a throw); SIGTERM lets a running job finish | CI, every pull request |
| End to end | Playwright | Sign up, create an invoice, see the PDF and the email, pay with the mock gateway, see paid status | CI, once the app is stable |
| Smoke | curl on `/api/health` | App, database and Redis are reachable after deploy | CD, every deploy |

Three tests worth writing first, because they prove the claims in your README:

1. Run the reminder processor twice with the same payload. Assert one email in Mailpit and one `reminder_log` row.
2. Post the same signed webhook five times. Assert one payment and an invoice marked paid once.
3. Sign in as a user in organization A and request an invoice by id from organization B. Assert a 404.

### Security checklist

Tick each item before you call the project done.

- [ ] Passwords live at Clerk and never reach your server, database or logs. Review Clerk's sign-up and bot protection settings, since you have no login routes of your own to rate-limit.
- [ ] Every protected page, route and Server Action calls `requireOrg()`, which checks the session and the role, not only the page UI.
- [ ] The public invoice page and the webhook routes never call `requireOrg()`, and a test proves they work signed out.
- [ ] Every database read and write filters by `org_id`, which comes from `memberships` and never from the request. A test proves isolation.
- [ ] The public invoice link uses a random token of at least 128 bits, and the page shows only that invoice.
- [ ] The webhook route verifies the HMAC signature with `timingSafeEqual`, rejects stale timestamps, and uses the raw body.
- [ ] All input is validated with Zod on the server, including job payloads.
- [ ] Secrets (Clerk secret key, Resend API key, Neon and Upstash connection strings) live only in GitHub Environments and the server's `.env.production`. `.env` files are in `.gitignore`.
- [ ] Development, staging and production use separate Neon, Upstash and Clerk credentials, so a mistake in one never touches another.
- [ ] Containers run as a non-root user. The server publishes only ports 80 and 443, and the connections to Neon and Upstash use TLS (`sslmode=require`, `rediss://`).
- [ ] Responses send security headers (Content-Security-Policy, X-Content-Type-Options, Referrer-Policy). Set them in `next.config.ts`, and allow Clerk's domains in the CSP.
- [ ] Dependabot is on, and CI runs `npm audit --omit=dev` so you see known vulnerabilities.
- [ ] Backups: Neon can restore to an earlier point in time (the window depends on your plan), but also run a periodic `pg_dump` over the direct connection to a place outside Neon, and test one restore.
- [ ] Logs never contain passwords, tokens, API keys or full card-like data.

### Operations

1. Use Bull Board for the queue dashboard, mounted at an admin-only route.
2. Log in JSON with pino. Include a request id in web logs, and pass the same id inside job data so you can follow one invoice from click to email.
3. Alert yourself on failures: a free uptime monitor on `/api/health`, a failed-jobs count on the admin page, and a look at Resend's dashboard for bounced emails. Keep an eye on Upstash's command usage, too.
4. Let the app fail fast. If `env.ts` finds a missing variable, the process exits with a clear message.

---

## Three decisions to settle before you code

1. **Staging or not.** Clerk's publishable key is baked into the image, so one image means one Clerk instance. For a portfolio project, I'd delete the staging job.
2. **Upstash plan.** Check the free tier's command limit against BullMQ's idle polling. If it doesn't fit, choose the Fixed plan, or pg-boss on Neon.
3. **A domain.** Clerk production and Resend both need one you control. Buy it before deploy week, not during it.

Want me to write the `ensureUserAndWorkspace` function next? It's the one piece of the Clerk flow I only sketched.
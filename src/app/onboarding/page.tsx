import { ArrowRight, Building2, Check, FileText } from 'lucide-react'
import Image from 'next/image'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { sendWelcomeEmail, completeOnboarding } from './actions'

function BusinessField({
  id,
  label,
  placeholder,
  autoComplete,
}: {
  id: string
  label: string
  placeholder: string
  autoComplete?: string
}) {
  return (
    <div className="space-y-2">
      <label
        htmlFor={id}
        className="flex items-center gap-1.5 text-sm font-medium text-foreground"
      >
        {label}
        <span aria-hidden="true" className="text-primary">
          *
        </span>
        <span className="sr-only">required</span>
      </label>
      <Input
        id={id}
        name={id}
        required
        autoComplete={autoComplete}
        placeholder={placeholder}
        className="min-h-11 rounded-xl border-border bg-background px-3.5 text-sm shadow-none placeholder:text-muted-foreground/75 focus-visible:border-primary focus-visible:ring-primary/20"
      />
    </div>
  )
}

export const instant = false

export default async function OnboardingPage() {
  // Fire-and-forget: queues the welcome email right after sign-up,
  // before the user does anything on this page. The BullMQ worker
  // handles sending in the background — this returns immediately.
  void sendWelcomeEmail()
  return (
    <main className="min-h-svh bg-background text-foreground">
      <div className="mx-auto flex min-h-svh w-full max-w-[1440px] flex-col px-4 py-5 sm:px-8 sm:py-7">
        <header className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <FileText aria-hidden="true" className="size-5" strokeWidth={2.2} />
          </span>
          <span className="text-lg font-semibold tracking-tight">Fatoura</span>
        </header>

        <div className="grid flex-1 items-center gap-6 py-8 lg:grid-cols-[minmax(270px,0.82fr)_minmax(0,1.18fr)] lg:gap-8 lg:py-10">
          <aside className="relative flex min-h-[300px] flex-col overflow-hidden rounded-3xl bg-black p-7 text-white sm:min-h-[340px] sm:p-9 lg:min-h-[600px] lg:p-10">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0"
            >
              <Image
                src="/Warm%20Amber%20Flow%20on%20Dark%20Canvas%20(1).png"
                alt=""
                fill
                sizes="(min-width: 1024px) 40vw, 100vw"
                className="-scale-y-100 object-cover"
              />
            </div>
            <div className="relative flex items-center gap-3">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-white/10 text-primary">
                <Building2 aria-hidden="true" className="size-5" />
              </span>
              <p className="text-sm font-medium text-white/75">
                Set up your workspace
              </p>
            </div>

            <div className="relative mt-8 max-w-sm sm:mt-10">
              <h1 className="text-3xl leading-tight font-semibold tracking-[-0.03em] sm:text-4xl">
                Put your business on every invoice.
              </h1>
              <p className="mt-4 max-w-[34ch] text-sm leading-6 text-white/70 sm:text-base">
                Add the details your customers need to recognize your business
                when they receive an invoice.
              </p>
            </div>

            <ol
              aria-label="Setup progress"
              className="relative mt-8 grid gap-4 border-t border-white/15 pt-6 sm:mt-10 sm:grid-cols-3 sm:gap-3 lg:mt-auto lg:grid-cols-1 lg:gap-4 lg:border-t-0 lg:pt-0"
            >
              <li className="flex items-center gap-3 text-sm text-white/65">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-white/10 text-primary">
                  <Check aria-hidden="true" className="size-4" strokeWidth={2.5} />
                </span>
                <span>Account created</span>
              </li>
              <li
                aria-current="step"
                className="flex items-center gap-3 text-sm font-medium text-white"
              >
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full border border-primary/70 bg-primary/15">
                  <span className="size-2 rounded-full bg-primary" />
                </span>
                <span>Business details</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-white/65">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full border border-white/25 text-xs">
                  3
                </span>
                <span>Invoices</span>
              </li>
            </ol>
          </aside>

          <section
            aria-labelledby="business-details-title"
            className="rounded-3xl border border-border bg-card shadow-lg shadow-foreground/5"
          >
            <form action={completeOnboarding}>
            <div className="p-6 sm:p-9 lg:p-10">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2
                    id="business-details-title"
                    className="text-2xl font-semibold tracking-[-0.025em] sm:text-[1.75rem]"
                  >
                    Business details
                  </h2>
                  <p className="mt-2 max-w-[52ch] text-sm leading-6 text-muted-foreground">
                    Enter your business information as it should appear on your
                    invoices.
                  </p>
                </div>
                <span className="rounded-full bg-accent px-3 py-1.5 text-xs font-medium text-accent-foreground">
                  All fields required
                </span>
              </div>

              <div
                aria-label="Business profile fields"
                className="mt-8 space-y-7"
                role="group"
              >
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <BusinessField
                      id="organizationName"
                      label="Business name"
                      placeholder="Name shown on your invoices"
                      autoComplete="organization"
                    />
                  </div>

                  <div className="space-y-2 sm:col-span-2">
                    <label
                      htmlFor="businessAddress"
                      className="flex items-center gap-1.5 text-sm font-medium text-foreground"
                    >
                      Business address
                      <span aria-hidden="true" className="text-primary">
                        *
                      </span>
                      <span className="sr-only">required</span>
                    </label>
                    <textarea
                      id="businessAddress"
                      name="address"
                      required
                      autoComplete="street-address"
                      rows={2}
                      placeholder="Street, city, and postal code"
                      className="flex min-h-20 w-full resize-y rounded-xl border border-border bg-background px-3.5 py-3 text-sm leading-5 text-foreground shadow-none outline-none transition-colors placeholder:text-muted-foreground/75 focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-primary/20"
                    />
                  </div>
                </div>

                <div>
                  <div className="mb-4 flex items-end justify-between gap-4 border-t border-border pt-6">
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">
                        Registration details
                      </h3>
                      <p className="mt-1 text-xs leading-5 text-muted-foreground">
                        Use the identifiers from your business documents.
                      </p>
                    </div>
                    <FileText
                      aria-hidden="true"
                      className="mb-1 size-4 shrink-0 text-muted-foreground"
                    />
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <BusinessField
                      id="nif"
                      label="NIF"
                      placeholder="Enter NIF"
                    />
                    <BusinessField
                      id="nis"
                      label="NIS"
                      placeholder="Enter NIS"
                    />
                    <BusinessField
                      id="rc"
                      label="RC"
                      placeholder="Enter RC"
                    />
                    <BusinessField
                      id="ai"
                      label="AI"
                      placeholder="Enter AI"
                    />
                  </div>
                </div>

                <div className="border-t border-border pt-6">
                  <Button
                    type="submit"
                    className="h-12 w-full rounded-xl px-5 text-sm font-semibold shadow-md shadow-primary/15 sm:w-auto sm:min-w-56"
                  >
                    Continue to invoices
                    <ArrowRight
                      aria-hidden="true"
                      className="ml-2 size-4"
                      strokeWidth={2.2}
                    />
                  </Button>
                  <p className="mt-3 text-xs leading-5 text-muted-foreground">
                    Your business details will be used on the invoices you create.
                  </p>
                </div>
              </div>
            </div>
            </form>
          </section>
        </div>

        <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-border/80 pt-4 text-xs text-muted-foreground">
          <span>Fatoura</span>
          <span>Business profile setup</span>
        </footer>
      </div>
    </main>
  )
}

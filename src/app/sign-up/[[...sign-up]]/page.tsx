import { SignUp } from '@clerk/nextjs'
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'

const authAppearance = {
  theme: 'simple' as const,
  variables: {
    borderRadius: 'var(--radius)',
    colorBackground: 'var(--card)',
    colorBorder: 'var(--border)',
    colorDanger: 'var(--destructive)',
    colorForeground: 'var(--card-foreground)',
    colorInput: 'var(--input)',
    colorInputForeground: 'var(--foreground)',
    colorMuted: 'var(--muted)',
    colorMutedForeground: 'var(--muted-foreground)',
    colorNeutral: 'var(--muted-foreground)',
    colorPrimary: 'oklch(0.6502 0.1825 36.6767)',
    colorPrimaryForeground: 'var(--primary-foreground)',
    colorRing: 'var(--ring)',
    fontFamily: 'Inter, system-ui, sans-serif',
    fontFamilyButtons: 'Inter, system-ui, sans-serif',
    fontFamilyMono: 'JetBrains Mono, monospace',
    fontSize: '0.875rem',
    fontWeight: { normal: 400, medium: 500, semibold: 600, bold: 700 },
    spacing: 'calc(var(--spacing) * 4)',
  },
  elements: {
    rootBox: { width: '100%' },
    cardBox: { width: '100%' },
    card: {
      width: '100%',
      padding: 'calc(var(--spacing) * 6)',
      color: 'var(--card-foreground)',
      backgroundColor: 'var(--card)',
      borderRadius: 'var(--radius)',
      boxShadow: 'var(--shadow-md)',
    },
    headerTitle: {
      color: 'var(--card-foreground)',
      fontFamily: 'Inter, system-ui, sans-serif',
      fontSize: '1.5rem',
      fontWeight: 600,
      letterSpacing: 'var(--tracking-normal)',
    },
    headerSubtitle: {
      color: 'var(--muted-foreground)',
      fontFamily: 'Inter, system-ui, sans-serif',
    },
    formFieldLabel: {
      color: 'var(--foreground)',
      fontFamily: 'Inter, system-ui, sans-serif',
      fontWeight: 500,
    },
    formFieldInput: {
      height: 'calc(var(--spacing) * 11)',
      paddingInline: 'calc(var(--spacing) * 3)',
      color: 'var(--foreground)',
      backgroundColor: 'var(--input)',
      borderColor: 'var(--border)',
      borderRadius: 'calc(var(--radius) - 2px)',
      fontFamily: 'Inter, system-ui, sans-serif',
      boxShadow: 'none',
      '&::placeholder': { color: 'var(--muted-foreground)' },
      '&:focus-visible': {
        borderColor: 'var(--ring)',
        boxShadow: '0 0 0 3px color-mix(in oklch, var(--ring), transparent 55%)',
      },
    },
    formButtonPrimary: {
      height: 'calc(var(--spacing) * 11)',
      color: 'var(--primary-foreground)',
      backgroundColor: 'oklch(0.6502 0.1825 36.6767)',
      borderRadius: 'calc(var(--radius) - 2px)',
      fontFamily: 'Inter, system-ui, sans-serif',
      fontWeight: 600,
      boxShadow: 'none',
      '&:hover': {
        backgroundColor: 'color-mix(in oklch, oklch(0.6502 0.1825 36.6767), black 10%)',
      },
      '&:focus-visible': {
        outline: 'none',
        boxShadow: '0 0 0 3px var(--background), 0 0 0 5px var(--ring)',
      },
      '&:disabled': { opacity: 0.5, cursor: 'not-allowed' },
    },
    socialButtonsBlockButton: {
      height: 'calc(var(--spacing) * 11)',
      color: 'var(--secondary-foreground)',
      backgroundColor: 'var(--secondary)',
      border: '1px solid var(--border)',
      borderRadius: 'calc(var(--radius) - 2px)',
      fontFamily: 'Inter, system-ui, sans-serif',
      boxShadow: 'none',
      '&:hover': { backgroundColor: 'var(--accent)' },
      '&:focus-visible': {
        outline: 'none',
        boxShadow: '0 0 0 3px color-mix(in oklch, var(--ring), transparent 55%)',
      },
    },
    socialButtonsBlockButtonText: {
      color: 'var(--secondary-foreground)',
      fontFamily: 'Inter, system-ui, sans-serif',
      fontWeight: 500,
    },
    dividerLine: { backgroundColor: 'var(--border)' },
    dividerText: {
      color: 'var(--muted-foreground)',
      fontFamily: 'Inter, system-ui, sans-serif',
    },
    formFieldAction: {
      color: 'oklch(0.6502 0.1825 36.6767)',
      fontFamily: 'Inter, system-ui, sans-serif',
      fontWeight: 500,
      textUnderlineOffset: '3px',
      '&:hover': { textDecoration: 'underline' },
    },
    footerActionText: {
      color: 'var(--muted-foreground)',
      fontFamily: 'Inter, system-ui, sans-serif',
    },
    footerActionLink: {
      color: 'oklch(0.6502 0.1825 36.6767)',
      fontFamily: 'Inter, system-ui, sans-serif',
      fontWeight: 500,
      textUnderlineOffset: '3px',
      '&:hover': { textDecoration: 'underline' },
    },
    formFieldErrorText: { color: 'var(--destructive)' },
    alertText: { color: 'var(--destructive)' },
    otpCodeFieldInput: {
      height: 'calc(var(--spacing) * 11)',
      color: 'var(--foreground)',
      backgroundColor: 'var(--input)',
      borderColor: 'var(--border)',
      borderRadius: 'calc(var(--radius) - 2px)',
      fontFamily: 'JetBrains Mono, monospace',
    },
  },
}

export const instant = false

export default async function Page() {
  const { userId } = await auth()
  if (userId) redirect(`/onboarding`)

  return (
    <Suspense>
      <>
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 z-0 bg-background"
        />
        <div className="relative z-10 w-full">
          <SignUp appearance={authAppearance} />
        </div>
      </>
    </Suspense>
  )
}

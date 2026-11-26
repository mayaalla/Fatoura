import { auth } from '@clerk/nextjs/server'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export const instant = false

export default async function Home() {
  const { userId } = await auth()
  if (userId) redirect(`/${userId}/Invoices`)

  return (
    <main className="flex min-h-screen items-center justify-center gap-4">
      <Link href="/sign-in">
        <button>Sign In</button>
      </Link>
      <Link href="/sign-up">
        <button>Sign Up</button>
      </Link>
    </main>
  )
}

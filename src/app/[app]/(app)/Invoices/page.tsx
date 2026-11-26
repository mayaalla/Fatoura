import { SignOutButton } from '@clerk/nextjs'
import { auth } from '@clerk/nextjs/server'

export default async function InvoicesPage() {
  await auth.protect()
  return (
    <>
      <h1>Invoices</h1>
      <SignOutButton redirectUrl="/sign-in">
        <button>Logout</button>
      </SignOutButton>
    </>
  )
}

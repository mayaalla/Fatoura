import { auth } from '@clerk/nextjs/server'

export default async function ClientsPage() {
  await auth.protect()
  return <h1>Clients</h1>
}

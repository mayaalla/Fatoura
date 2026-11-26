import { auth } from '@clerk/nextjs/server'

export default async function SettingsPage() {
  await auth.protect()
  return <h1>Settings</h1>
}

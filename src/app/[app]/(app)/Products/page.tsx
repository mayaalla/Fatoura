import { auth } from '@clerk/nextjs/server'

export default async function ProductsPage() {
  await auth.protect()
  return <h1>Products</h1>
}

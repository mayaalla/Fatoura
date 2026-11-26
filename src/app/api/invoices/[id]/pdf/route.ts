import { NextResponse } from 'next/server'

export async function GET() {
  // TODO: implement PDF generation for invoice by ID
  return NextResponse.json({ error: 'Not implemented' }, { status: 501 })
}

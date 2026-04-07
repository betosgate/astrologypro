import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json(
    { title: 'Not Implemented', status: 501, detail: 'Weekly subscription management coming soon.' },
    { status: 501 }
  )
}

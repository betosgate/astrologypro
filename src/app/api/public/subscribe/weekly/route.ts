import { NextResponse } from 'next/server'

export const dynamic = "force-dynamic";

export async function POST() {
  return NextResponse.json(
    { title: 'Not Implemented', status: 501, detail: 'Weekly subscription checkout coming soon.' },
    { status: 501 }
  )
}

import { NextResponse } from 'next/server'

export async function GET() {
  const res = NextResponse.json({ ok: true })
  // Clear cookie
  res.cookies.set('merchent_session', '', {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  })
  return res
}


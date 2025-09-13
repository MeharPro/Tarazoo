import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const url = new URL('/merchent/login', request.url)
  const res = NextResponse.redirect(url)
  res.cookies.set('merchent_session', '', { path: '/', maxAge: 0 })
  res.cookies.set('merchent_user', '', { path: '/', maxAge: 0 })
  return res
}


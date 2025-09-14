import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const url = new URL('/merchant/login', request.url)
  const res = NextResponse.redirect(url)
  res.cookies.set('merchant_session', '', { path: '/', maxAge: 0 })
  res.cookies.set('merchant_user', '', { path: '/', maxAge: 0 })
  return res
}

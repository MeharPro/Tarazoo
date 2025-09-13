import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get('content-type') || ''
    let username = ''
    let password = ''

    if (contentType.includes('application/json')) {
      const body = await request.json()
      username = (body.username || '').toString()
      password = (body.password || '').toString()
    } else if (contentType.includes('application/x-www-form-urlencoded')) {
      const form = await request.formData()
      username = (form.get('username') || '').toString()
      password = (form.get('password') || '').toString()
    } else {
      // Try to parse anyway
      const body = await request.json().catch(() => ({} as any))
      username = (body.username || '').toString()
      password = (body.password || '').toString()
    }

    // Fixed demo creds as requested: merchent / merchent
    if (username === 'merchent' && password === 'merchent') {
      const res = NextResponse.json({ ok: true, user: { username: 'merchent' } })
      // Set a simple session cookie (HttpOnly)
      res.cookies.set('merchent_session', '1', {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 12, // 12 hours
      })
      // Store username for profile display (not HttpOnly so client can read if needed)
      res.cookies.set('merchent_user', 'merchent', {
        httpOnly: false,
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 12,
      })
      return res
    }

    return NextResponse.json({ ok: false, error: 'Invalid credentials' }, { status: 401 })
  } catch (err) {
    return NextResponse.json({ ok: false, error: 'Unexpected error' }, { status: 500 })
  }
}

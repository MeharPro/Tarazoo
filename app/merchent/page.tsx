import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export default function MerchentIndex() {
  const cookieStore = cookies()
  const hasSession = Boolean(cookieStore.get('merchent_session'))
  if (hasSession) {
    redirect('/merchent/profile')
  } else {
    redirect('/merchent/login')
  }
}


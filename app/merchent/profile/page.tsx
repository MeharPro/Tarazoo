import { cookies } from 'next/headers'
import Link from 'next/link'

export const metadata = { title: 'Merchent Profile' }

export default function MerchentProfilePage() {
  const cookieStore = cookies()
  const username = cookieStore.get('merchent_user')?.value || 'Unknown'

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-3xl px-4 py-10">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Profile</h1>
          <a href="/merchent/logout" className="text-sm text-gray-700 hover:underline">Logout</a>
        </div>

        <div className="bg-white text-gray-900 shadow rounded-lg p-6">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xl font-semibold">
              {username.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-sm text-gray-500">Signed in as</p>
              <p className="text-xl font-semibold text-gray-900">{username}</p>
              <p className="text-sm text-gray-500 mt-1">Role: Merchant</p>
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <Link href="/merchent/dashboard" className="px-4 py-2 rounded-md bg-blue-600 text-white text-sm hover:bg-blue-700">Open Dashboard</Link>
            <Link href="/" className="px-4 py-2 rounded-md border text-sm text-gray-700 hover:bg-gray-50">Storefront</Link>
          </div>
        </div>
      </div>
    </div>
  )
}

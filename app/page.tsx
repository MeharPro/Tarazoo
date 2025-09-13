import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default function HomePage() {
  // Default to merchant sign-in/profile flow
  redirect('/merchent');
}

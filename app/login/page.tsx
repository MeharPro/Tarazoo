import { redirect } from 'next/navigation';

export default function LoginPage() {
  // Consolidate login to a single place
  redirect('/merchant/login');
}

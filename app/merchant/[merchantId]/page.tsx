import { DashboardClient } from 'components/dashboard/DashboardClient';

export default async function MerchantDashboardPage({ params }: { params: { merchantId: string } }) {
  const { merchantId } = params;
  return <DashboardClient merchantId={merchantId} />;
}


import { Carousel } from 'components/carousel';
import { ThreeItemGrid } from 'components/grid/three-items';
import Footer from 'components/layout/footer';
import ShopifySetup from 'components/setup/shopify-setup';
import { isShopifyConfigured } from 'lib/shopify/config';
import { syncShopifyToSupabase } from 'lib/shopify-supabase-sync';

export const metadata = {
  description:
    'High-performance ecommerce store built with Next.js, Vercel, and Shopify.',
  openGraph: {
    type: 'website'
  }
};

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const shopifyConfigured = isShopifyConfigured();

  if (!shopifyConfigured) {
    return <ShopifySetup />;
  }

  // Ensure Supabase has the latest Shopify data on each homepage load
  await syncShopifyToSupabase();

  return (
    <>
      <ThreeItemGrid />
      <Carousel />
      <Footer />
    </>
  );
}

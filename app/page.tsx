import { Carousel } from 'components/carousel';
import { ThreeItemGrid } from 'components/grid/three-items';
import Footer from 'components/layout/footer';
import ShopifySetup from 'components/setup/shopify-setup';
import Grid from 'components/grid';
import ProductGridItems from 'components/layout/product-grid-items';
import { getProducts } from 'lib/shopify';
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
  const products = await getProducts({ fresh: true });

  return (
    <>
      <ThreeItemGrid />
      <Carousel />
      {products?.length ? (
        <section className="mx-auto max-w-(--breakpoint-2xl) px-4 pb-8">
          <h2 className="mb-4 text-2xl font-bold">Products</h2>
          <Grid className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            <ProductGridItems products={products.slice(0, 12)} />
          </Grid>
        </section>
      ) : null}
      <Footer />
    </>
  );
}

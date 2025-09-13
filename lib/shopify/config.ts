// Check if Shopify credentials are configured
export function isShopifyConfigured(): boolean {
  return Boolean(
    process.env.SHOPIFY_STORE_DOMAIN && 
    process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN &&
    !process.env.SHOPIFY_STORE_DOMAIN.includes('[YOUR-STORE]') &&
    !process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN.includes('[PASTE')
  );
}

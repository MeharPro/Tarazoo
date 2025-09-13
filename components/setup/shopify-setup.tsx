'use client';

export default function ShopifySetup() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16">
      <div className="rounded-lg border border-neutral-200 bg-white p-8 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <h1 className="mb-4 text-3xl font-bold">Welcome to Next.js Commerce</h1>
        <p className="mb-8 text-lg text-neutral-600 dark:text-neutral-400">
          Your store needs to be configured with Shopify credentials to start selling.
        </p>

        <div className="space-y-8">
          <section>
            <h2 className="mb-3 text-xl font-semibold">🛠️ Quick Setup Guide</h2>
            <ol className="ml-6 list-decimal space-y-3 text-neutral-700 dark:text-neutral-300">
              <li>
                <strong>Create a Shopify store</strong> if you don't have one:
                <a
                  href="https://www.shopify.com/free-trial"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-2 text-blue-600 hover:underline dark:text-blue-400"
                >
                  Start free trial →
                </a>
              </li>
              <li>
                <strong>Create a Custom App</strong> in your Shopify admin:
                <ul className="ml-6 mt-2 list-disc space-y-1 text-sm">
                  <li>Go to Settings → Apps and sales channels → Develop apps</li>
                  <li>Create an app and configure Storefront API access</li>
                  <li>Enable all Storefront API scopes needed</li>
                </ul>
              </li>
              <li>
                <strong>Get your credentials:</strong>
                <ul className="ml-6 mt-2 list-disc space-y-1 text-sm">
                  <li>Copy your Storefront API access token</li>
                  <li>Note your store domain (e.g., your-store.myshopify.com)</li>
                </ul>
              </li>
              <li>
                <strong>Update your .env file</strong> with:
                <pre className="mt-2 rounded bg-neutral-100 p-3 text-sm dark:bg-neutral-800">
{`SHOPIFY_STORE_DOMAIN="your-store.myshopify.com"
SHOPIFY_STOREFRONT_ACCESS_TOKEN="your-token-here"
SHOPIFY_REVALIDATION_SECRET="your-secret"`}
                </pre>
              </li>
              <li>
                <strong>Restart your development server</strong> to apply the changes
              </li>
            </ol>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold">📚 Resources</h2>
            <div className="space-y-2">
              <a
                href="https://vercel.com/docs/integrations/ecommerce/shopify"
                target="_blank"
                rel="noopener noreferrer"
                className="block text-blue-600 hover:underline dark:text-blue-400"
              >
                → Complete Shopify Integration Guide
              </a>
              <a
                href="https://shopify.dev/docs/custom-storefronts/building-with-the-storefront-api"
                target="_blank"
                rel="noopener noreferrer"
                className="block text-blue-600 hover:underline dark:text-blue-400"
              >
                → Shopify Storefront API Documentation
              </a>
              <a
                href="https://github.com/vercel/commerce"
                target="_blank"
                rel="noopener noreferrer"
                className="block text-blue-600 hover:underline dark:text-blue-400"
              >
                → Next.js Commerce GitHub Repository
              </a>
            </div>
          </section>

          <section className="rounded-lg bg-amber-50 p-4 dark:bg-amber-900/20">
            <h3 className="mb-2 font-semibold text-amber-900 dark:text-amber-300">
              ⚠️ Current Status
            </h3>
            <p className="text-sm text-amber-800 dark:text-amber-400">
              Shopify credentials are not configured. The application is running in setup mode.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

# Setting Up Shopify Storefront API

## Step 1: Get Your Shopify Store Domain
Your store domain is: `your-store.myshopify.com`

## Step 2: Create a Storefront Access Token

1. Go to your Shopify Admin
2. Navigate to: **Settings** → **Apps and sales channels** → **Develop apps**
3. Click **Create an app**
4. Name it "Tarazoo Integration"
5. In the app configuration:
   - Go to **API credentials** tab
   - Under **Storefront API**, click **Configure**
   - Check these scopes:
     - `unauthenticated_read_product_listings`
     - `unauthenticated_read_product_inventory`
     - `unauthenticated_read_product_tags`
   - Click **Save**
6. Click **Install app**
7. Under **Storefront API access token**, click **Reveal token once**
8. Copy the token (it starts with something like `shpat_`)

## Step 3: Add to .env file

```bash
SHOPIFY_STORE_DOMAIN="your-store.myshopify.com"
SHOPIFY_STOREFRONT_ACCESS_TOKEN="your-token-here"
```

## Step 4: Test the connection

```bash
curl -X POST http://localhost:3000/api/sync-products
```

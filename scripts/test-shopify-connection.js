// Test Shopify connection
require('dotenv').config({ path: '.env' });

const SHOPIFY_STORE_DOMAIN = process.env.SHOPIFY_STORE_DOMAIN;
const SHOPIFY_STOREFRONT_ACCESS_TOKEN = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN;

async function testShopifyConnection() {
  if (!SHOPIFY_STORE_DOMAIN || !SHOPIFY_STOREFRONT_ACCESS_TOKEN) {
    console.log('❌ Shopify credentials not configured');
    console.log('\nTo connect to Shopify:');
    console.log('1. Go to your Shopify Admin');
    console.log('2. Settings → Apps and sales channels → Develop apps');
    console.log('3. Create an app called "Tarazoo Integration"');
    console.log('4. Configure Storefront API access with product read permissions');
    console.log('5. Get your Storefront Access Token');
    console.log('6. Add to .env:');
    console.log('   SHOPIFY_STORE_DOMAIN="your-store.myshopify.com"');
    console.log('   SHOPIFY_STOREFRONT_ACCESS_TOKEN="your-token"');
    return;
  }

  console.log('🔍 Testing Shopify connection...');
  console.log(`Store: ${SHOPIFY_STORE_DOMAIN}`);

  const query = `
    query {
      products(first: 3) {
        edges {
          node {
            id
            title
            handle
            variants(first: 1) {
              edges {
                node {
                  id
                  title
                  price {
                    amount
                    currencyCode
                  }
                  barcode
                  sku
                }
              }
            }
          }
        }
      }
    }
  `;

  try {
    const response = await fetch(`https://${SHOPIFY_STORE_DOMAIN}/api/2024-01/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': SHOPIFY_STOREFRONT_ACCESS_TOKEN
      },
      body: JSON.stringify({ query })
    });

    const data = await response.json();

    if (data.errors) {
      console.log('❌ Shopify API error:', data.errors);
      return;
    }

    if (data.data && data.data.products) {
      console.log('✅ Connected to Shopify successfully!');
      console.log(`\nFound ${data.data.products.edges.length} products:`);
      
      data.data.products.edges.forEach(({ node }) => {
        console.log(`\n📦 ${node.title}`);
        console.log(`   Handle: ${node.handle}`);
        if (node.variants.edges[0]) {
          const variant = node.variants.edges[0].node;
          console.log(`   Price: ${variant.price.currencyCode} ${variant.price.amount}`);
          console.log(`   Barcode: ${variant.barcode || 'No barcode set'}`);
          console.log(`   SKU: ${variant.sku || 'No SKU set'}`);
        }
      });

      console.log('\n💡 To add barcodes to products:');
      console.log('   Go to Shopify Admin → Products → Edit Product → Inventory → Barcode field');
    }
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
  }
}

testShopifyConnection();

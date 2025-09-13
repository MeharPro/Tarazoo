const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addGoogleCloudBottle() {
  const product = {
    product_id: 'google-cloud-bottle',
    merchant_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    sku: 'SKU-GCLOUD',
    name: 'Google Cloud Bottle',
    price_cents: 2499,
    barcode: '0000000000558',
    shopify_id: 'google-cloud-bottle',
    shopify_handle: 'google-cloud-bottle',
    image_url: 'https://via.placeholder.com/600x600/4285F4/ffffff?text=Google+Cloud+Bottle'
  };

  const { data, error } = await supabase
    .from('products')
    .upsert(product, {
      onConflict: 'product_id'
    })
    .select();

  if (error) {
    console.error('Error adding product:', error);
  } else {
    console.log('✅ Added Google Cloud Bottle');
    console.log('   Barcode: 0000000000558');
    console.log('   Price: $24.99');
  }
}

addGoogleCloudBottle();

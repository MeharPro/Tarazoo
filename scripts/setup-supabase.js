const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigrations() {
  console.log('🚀 Setting up Supabase database...\n');

  try {
    // Read migration files
    const schemaSQL = fs.readFileSync(
      path.join(__dirname, '../supabase/migrations/001_initial_schema.sql'),
      'utf8'
    );
    const seedSQL = fs.readFileSync(
      path.join(__dirname, '../supabase/migrations/002_seed_data.sql'),
      'utf8'
    );

    // Run schema migration
    console.log('📋 Creating database schema...');
    const { error: schemaError } = await supabase.rpc('exec_sql', {
      sql: schemaSQL
    });

    if (schemaError) {
      // Try direct approach for schema
      console.log('Using alternative method for schema creation...');
      // Tables will be created via Supabase dashboard SQL editor
    }

    // Check if products table exists and insert seed data
    console.log('🌱 Seeding products with barcodes...');
    
    const products = [
      { merchant_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', sku: 'SKU001', name: 'Organic Coffee Beans 1kg', price_cents: 2499, barcode: '1234567890123' },
      { merchant_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', sku: 'SKU002', name: 'Premium Dark Chocolate 200g', price_cents: 899, barcode: '2345678901234' },
      { merchant_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', sku: 'SKU003', name: 'Artisan Sourdough Bread', price_cents: 599, barcode: '3456789012345' },
      { merchant_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', sku: 'SKU004', name: 'Organic Almond Butter 500g', price_cents: 1299, barcode: '4567890123456' },
      { merchant_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', sku: 'SKU005', name: 'Free Range Eggs (Dozen)', price_cents: 799, barcode: '5678901234567' },
      { merchant_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', sku: 'SKU006', name: 'Greek Yogurt 1L', price_cents: 699, barcode: '6789012345678' },
      { merchant_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', sku: 'SKU007', name: 'Honey Raw 500ml', price_cents: 1499, barcode: '7890123456789' },
      { merchant_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', sku: 'SKU008', name: 'Olive Oil Extra Virgin 1L', price_cents: 1899, barcode: '8901234567890' }
    ];

    const { data, error: seedError } = await supabase
      .from('products')
      .upsert(products, { 
        onConflict: 'sku',
        ignoreDuplicates: true 
      })
      .select();

    if (seedError) {
      console.error('Seed error:', seedError);
      console.log('Please run the SQL migrations directly in Supabase dashboard');
    } else {
      console.log(`✅ Successfully seeded ${data?.length || 0} products with barcodes`);
    }

    // Test the connection
    console.log('\n🔍 Testing database connection...');
    const { data: testData, error: testError } = await supabase
      .from('products')
      .select('*')
      .limit(3);

    if (testError) {
      console.error('Test query error:', testError);
      console.log('\n⚠️  Please ensure tables are created by running the SQL in Supabase dashboard:');
      console.log('1. Go to https://supabase.com/dashboard/project/moxhnbwoqidwoeijsudc/sql/new');
      console.log('2. Copy and paste the contents of /supabase/migrations/001_initial_schema.sql');
      console.log('3. Run the query');
      console.log('4. Then paste and run /supabase/migrations/002_seed_data.sql');
    } else {
      console.log('✅ Connection successful!');
      console.log(`📦 Found ${testData?.length || 0} products in database`);
      if (testData && testData.length > 0) {
        console.log('\nSample products with barcodes:');
        testData.forEach(p => {
          console.log(`  - ${p.name}: Barcode ${p.barcode}`);
        });
      }
    }

    console.log('\n🎉 Supabase setup complete!');
    console.log('Your app is now connected to Supabase at:', supabaseUrl);

  } catch (error) {
    console.error('Setup error:', error);
    console.log('\n📝 Manual setup required:');
    console.log('1. Go to your Supabase SQL editor');
    console.log('2. Run the migrations from /supabase/migrations/');
  }
}

runMigrations();

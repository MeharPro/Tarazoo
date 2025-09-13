import { NextRequest, NextResponse } from 'next/server';
import { syncShopifyToSupabase } from 'lib/shopify-supabase-sync';

export async function POST(request: NextRequest) {
  try {
    const result = await syncShopifyToSupabase();
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: `Synced ${result.count} products from Shopify`,
        products: result.products
      });
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Sync API error:', error);
    return NextResponse.json(
      { success: false, error: 'Sync failed' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  // Trigger sync on GET for easy testing
  return POST(request);
}

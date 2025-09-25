'use server';

import { NextRequest, NextResponse } from 'next/server';
import { syncShopifyToSupabase, syncShopifyProductByHandle } from 'lib/shopify-supabase-sync';

export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const handle = searchParams.get('handle');
    if (handle) {
      const result = await syncShopifyProductByHandle(handle);
      if (!result.success) {
        return NextResponse.json({ error: 'Sync failed', details: result }, { status: 500 });
      }
      return NextResponse.json({ success: true, count: result.count || 0 });
    }
    const result = await syncShopifyToSupabase();
    if (!result.success) {
      return NextResponse.json({ error: 'Sync failed', details: result }, { status: 500 });
    }
    return NextResponse.json({ success: true, count: result.count || 0 });
  } catch (e: any) {
    return NextResponse.json({ error: 'Unexpected error', details: e?.message || String(e) }, { status: 500 });
  }
}


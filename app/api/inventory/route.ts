import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const filePath = path.join(process.cwd(), 'backend', 'data', 'inventory.json');

async function getInventory() {
  try {
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const json = JSON.parse(fileContent);
    if (Array.isArray(json)) return json;
    if (Array.isArray(json.items)) return json.items;
    return [];
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return [];
    }
    throw error;
  }
}

export async function GET() {
  try {
    const inventory = await getInventory();
    return NextResponse.json(inventory);
  } catch (error) {
    console.error('Error reading inventory data:', error);
    return NextResponse.json({ error: 'Failed to fetch inventory data' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const newSku = await request.json();
    const items = await getInventory();
    items.push(newSku);
    // Write back preserving object shape if file had items array
    let existing: any = {};
    try {
      const current = await fs.readFile(filePath, 'utf-8');
      existing = JSON.parse(current);
    } catch {}
    const payload = Array.isArray(existing.items) ? { items } : items;
    await fs.writeFile(filePath, JSON.stringify(payload, null, 2));
    return NextResponse.json(newSku, { status: 201 });
  } catch (error) {
    console.error('Error adding new SKU:', error);
    return NextResponse.json({ error: 'Failed to add new SKU' }, { status: 500 });
  }
}

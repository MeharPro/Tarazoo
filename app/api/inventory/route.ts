import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const filePath = path.join(process.cwd(), 'backend', 'data', 'inventory.json');

async function getInventory() {
  try {
    const fileContent = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(fileContent);
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
    const inventory = await getInventory();
    inventory.push(newSku);
    await fs.writeFile(filePath, JSON.stringify(inventory, null, 2));
    return NextResponse.json(newSku, { status: 201 });
  } catch (error) {
    console.error('Error adding new SKU:', error);
    return NextResponse.json({ error: 'Failed to add new SKU' }, { status: 500 });
  }
}

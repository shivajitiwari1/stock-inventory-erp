import { NextRequest, NextResponse } from 'next/server';
import { readJSON, writeJSON } from '@/lib/db';

export async function GET(_request: NextRequest, context: any) {
  const { id } = await context.params;
  try {
    const data = readJSON('products.json');
    const product = data.products.find((p: any) => p.id === id);

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json(product);
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, context: any) {
  const { id } = await context.params;
  try {
    const body = await request.json();
    const data = readJSON('products.json');
    const index = data.products.findIndex((p: any) => p.id === id);

    if (index === -1) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    data.products[index] = {
      ...data.products[index],
      ...body,
      updatedAt: new Date().toISOString(),
    };

    writeJSON('products.json', data);
    return NextResponse.json(data.products[index]);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, context: any) {
  const { id } = await context.params;
  try {
    const data = readJSON('products.json');
    const index = data.products.findIndex((p: any) => p.id === id);

    if (index === -1) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    data.products.splice(index, 1);
    writeJSON('products.json', data);

    // Cascade: remove inventory entries for this product
    const invData = readJSON('inventory.json');
    if (invData?.inventory) {
      invData.inventory = invData.inventory.filter((i: any) => i.productId !== id);
      writeJSON('inventory.json', invData);
    }

    // Cascade: remove stock movements for this product
    const movData = readJSON('stockMovements.json');
    if (movData?.stockMovements) {
      movData.stockMovements = movData.stockMovements.filter((m: any) => m.productId !== id);
      writeJSON('stockMovements.json', movData);
    }

    // Cascade: remove stock transfers for this product
    const trData = readJSON('stockTransfers.json');
    if (trData?.transfers) {
      trData.transfers = trData.transfers.filter((t: any) => t.productId !== id);
      writeJSON('stockTransfers.json', trData);
    }

    // Cascade: remove stock issues for this product
    const siData = readJSON('stockIssues.json');
    if (siData?.stockIssues) {
      siData.stockIssues = siData.stockIssues.filter((s: any) => s.productId !== id);
      writeJSON('stockIssues.json', siData);
    }

    return NextResponse.json({ message: 'Product deleted successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
  }
}

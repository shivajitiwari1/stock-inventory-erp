import { NextRequest, NextResponse } from 'next/server';
import { readJSON } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const reportType = searchParams.get('type') || 'stock';
    const warehouseId = searchParams.get('warehouseId');

    const products = readJSON('products.json');
    const inventory = readJSON('inventory.json');
    const movements = readJSON('stockMovements.json');

    if (!products || !inventory || !movements) {
      return NextResponse.json({ error: 'Failed to read data' }, { status: 500 });
    }

    let report: any = {};

    switch (reportType) {
      case 'stock':
        report = generateStockReport(products.products, inventory.inventory, warehouseId);
        break;
      case 'low-stock':
        report = generateLowStockReport(products.products, inventory.inventory, warehouseId);
        break;
      case 'valuation':
        report = generateValuationReport(products.products, inventory.inventory, warehouseId);
        break;
      case 'movement':
        report = generateMovementReport(movements.stockMovements, warehouseId);
        break;
      default:
        return NextResponse.json({ error: 'Unknown report type' }, { status: 400 });
    }

    return NextResponse.json(report);
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function generateStockReport(products: any[], inventory: any[], warehouseId?: string | null) {
  const items = inventory.filter((inv: any) => !warehouseId || inv.warehouseId === warehouseId);

  const report = items.map((inv: any) => {
    const product = products.find((p) => p.id === inv.productId);
    return {
      productId: inv.productId,
      productName: product?.name || 'Unknown',
      sku: product?.sku || '',
      category: product?.category || '',
      totalQuantity: inv.totalQuantity,
      availableQuantity: inv.availableQuantity,
      reservedQuantity: inv.reservedQuantity,
      damagedQuantity: inv.damagedQuantity,
      lostQuantity: inv.lostQuantity,
      warehouseId: inv.warehouseId,
    };
  });

  return {
    reportType: 'STOCK_REPORT',
    generatedAt: new Date().toISOString(),
    totalItems: report.length,
    totalQuantity: report.reduce((sum, item) => sum + item.totalQuantity, 0),
    items: report,
  };
}

function generateLowStockReport(products: any[], inventory: any[], warehouseId?: string | null) {
  const items = inventory.filter((inv: any) => !warehouseId || inv.warehouseId === warehouseId);

  const report = items
    .map((inv: any) => {
      const product = products.find((p) => p.id === inv.productId);
      return {
        productId: inv.productId,
        productName: product?.name || 'Unknown',
        sku: product?.sku || '',
        category: product?.category || '',
        currentQuantity: inv.availableQuantity,
        minQuantity: product?.minQuantity || 0,
        status: inv.availableQuantity === 0 ? 'OUT_OF_STOCK' : inv.availableQuantity <= (product?.minQuantity || 0) ? 'LOW_STOCK' : 'OK',
        warehouseId: inv.warehouseId,
      };
    })
    .filter((item) => item.status !== 'OK');

  return {
    reportType: 'LOW_STOCK_REPORT',
    generatedAt: new Date().toISOString(),
    alertCount: report.length,
    items: report,
  };
}

function generateValuationReport(products: any[], inventory: any[], warehouseId?: string | null) {
  const items = inventory.filter((inv: any) => !warehouseId || inv.warehouseId === warehouseId);

  const report = items.map((inv: any) => {
    const product = products.find((p) => p.id === inv.productId);
    const value = (product?.price || 0) * inv.totalQuantity;

    return {
      productId: inv.productId,
      productName: product?.name || 'Unknown',
      sku: product?.sku || '',
      unitPrice: product?.price || 0,
      totalQuantity: inv.totalQuantity,
      totalValue: value,
      warehouseId: inv.warehouseId,
    };
  });

  const totalValue = report.reduce((sum, item) => sum + item.totalValue, 0);

  return {
    reportType: 'INVENTORY_VALUATION_REPORT',
    generatedAt: new Date().toISOString(),
    totalValue,
    itemCount: report.length,
    items: report,
  };
}

function generateMovementReport(movements: any[], warehouseId?: string | null) {
  const items = movements.filter((mov: any) => !warehouseId || mov.warehouseId === warehouseId);

  const summary = {
    totalIn: 0,
    totalOut: 0,
    totalAdjustments: 0,
    totalTransfers: 0,
  };

  items.forEach((mov: any) => {
    if (mov.type === 'STOCK_IN') summary.totalIn += mov.quantity;
    else if (mov.type === 'STOCK_OUT') summary.totalOut += mov.quantity;
    else if (mov.type === 'ADJUSTMENT') summary.totalAdjustments += Math.abs(mov.quantity);
    else if (mov.type === 'TRANSFER') summary.totalTransfers += mov.quantity;
  });

  return {
    reportType: 'MOVEMENT_REPORT',
    generatedAt: new Date().toISOString(),
    period: 'All Time',
    summary,
    itemCount: items.length,
    recentMovements: items.slice(0, 50),
  };
}

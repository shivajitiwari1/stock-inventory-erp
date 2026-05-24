import { d1Query } from '@/lib/d1';

export interface DashboardStats {
  totalStock: number;
  availableStock: number;
  lowStockCount: number;
  outOfStockCount: number;
  lastUpdated: string;
}

export interface DashboardData {
  stats: DashboardStats;
  stockTrend: Array<{ date: string; quantity: number; product: string }>;
  categoryDistribution: Array<{ name: string; value: number }>;
  recentMovements: Array<any>;
  products: Array<any>;
}

export const getDashboardData = async (): Promise<DashboardData> => {
  const products = await d1Query('SELECT * FROM products');
  const inventory = await d1Query('SELECT * FROM inventory');
  const movements = await d1Query('SELECT * FROM stock_movements ORDER BY createdAt DESC LIMIT 100');
  const warehouses = await d1Query('SELECT * FROM warehouses');

  const totalStock = inventory.reduce((sum: number, item: any) => sum + (item.totalQuantity || 0), 0);
  const availableStock = inventory.reduce((sum: number, item: any) => sum + (item.availableQuantity || 0), 0);
  const lowStockCount = inventory.reduce((count: number, item: any) => {
    const product = products.find((p: any) => p.id === item.productId);
    return count + ((product?.minQuantity ?? 0) > 0 && item.availableQuantity <= (product?.minQuantity ?? 0) && item.availableQuantity > 0 ? 1 : 0);
  }, 0);
  const outOfStockCount = inventory.filter((item: any) => item.availableQuantity === 0).length;

  const categoryDistributionMap = products.reduce((map: any, product: any) => {
    const inventoryItem = inventory.find((item: any) => item.productId === product.id);
    const quantity = inventoryItem?.availableQuantity || 0;
    map[product.category] = (map[product.category] || 0) + quantity;
    return map;
  }, {} as Record<string, number>);

  const categoryDistribution = Object.entries(categoryDistributionMap).map(([name, value]) => ({ name, value: value as number }));

  const stockTrend = inventory
    .map((item: any) => {
      const product = products.find((p: any) => p.id === item.productId);
      return {
        date: new Date(item.lastUpdated).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        quantity: item.availableQuantity,
        product: product?.name || 'Unknown',
      };
    })
    .slice(-6);

  const recentMovements = movements
    .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 8)
    .map((movement: any) => {
      const product = products.find((p: any) => p.id === movement.productId);
      const warehouse = warehouses.find((w: any) => w.id === movement.warehouseId);
      return {
        ...movement,
        productName: product?.name || 'Unknown Product',
        sku: product?.sku || '',
        warehouseName: warehouse?.name || movement.warehouseId || 'Unknown Warehouse',
      };
    });

  return {
    stats: {
      totalStock,
      availableStock,
      lowStockCount,
      outOfStockCount,
      lastUpdated: inventory.reduce((latest: string, item: any) => {
        const current = new Date(item.lastUpdated).toISOString();
        return current > latest ? current : latest;
      }, new Date(0).toISOString()),
    },
    stockTrend,
    categoryDistribution,
    recentMovements,
    products, // Add products to the return object
  };
};

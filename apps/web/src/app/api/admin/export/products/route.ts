import { NextRequest } from 'next/server';
import { db, products, categories } from '@/lib/db';
import { desc, eq } from 'drizzle-orm';
import { verifyAdminToken } from '@/lib/auth/adminAuth';
import { ApiError } from '@/lib/api';
import {
  exportData,
  formatCurrency,
  formatDateTime,
  type ExportFormat,
} from '@/lib/utils/export';

export const dynamic = 'force-dynamic';

const PRODUCT_COLUMNS = [
  { header: 'ID', key: 'id', width: 36 },
  { header: 'SKU', key: 'sku', width: 15 },
  { header: 'Name', key: 'name', width: 30 },
  { header: 'Category', key: 'category', width: 20 },
  { header: 'Price', key: 'price', width: 12 },
  { header: 'Sale Price', key: 'salePrice', width: 12 },
  { header: 'Cost', key: 'costPrice', width: 12 },
  { header: 'Stock', key: 'inventory', width: 10 },
  { header: 'Low Stock Threshold', key: 'lowStockThreshold', width: 18 },
  { header: 'Status', key: 'status', width: 12 },
  { header: 'Gem Type', key: 'gemstoneType', width: 15 },
  { header: 'Carat Weight', key: 'caratWeight', width: 12 },
  { header: 'Clarity', key: 'clarity', width: 10 },
  { header: 'Color', key: 'color', width: 10 },
  { header: 'Cut', key: 'cut', width: 10 },
  { header: 'Origin', key: 'origin', width: 15 },
  { header: 'Views', key: 'viewCount', width: 10 },
  { header: 'Created', key: 'createdAt', width: 20 },
  { header: 'Inventory Value', key: 'inventoryValue', width: 15 },
];

export async function GET(request: NextRequest) {
  try {
    // Validate admin
    const adminUser = verifyAdminToken(request);
    if (!adminUser) {
      return ApiError.unauthorized('Admin access required');
    }

    const { searchParams } = new URL(request.url);
    const format = (searchParams.get('format') || 'csv') as ExportFormat;
    const categoryId = searchParams.get('categoryId');
    const status = searchParams.get('status');

    // Validate format
    if (!['csv', 'xlsx', 'pdf'].includes(format)) {
      return ApiError.validation('Invalid format. Use csv, xlsx, or pdf');
    }

    // Fetch products with category names
    const productsData = await db
      .select({
        id: products.id,
        sku: products.sku,
        name: products.name,
        categoryId: products.categoryId,
        categoryName: categories.name,
        price: products.price,
        salePrice: products.salePrice,
        costPrice: products.costPrice,
        inventory: products.inventory,
        lowStockThreshold: products.lowStockThreshold,
        isActive: products.isActive,
        gemstoneType: products.gemstoneType,
        caratWeight: products.caratWeight,
        clarity: products.clarity,
        color: products.color,
        cut: products.cut,
        origin: products.origin,
        viewCount: products.viewCount,
        createdAt: products.createdAt,
      })
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .orderBy(desc(products.createdAt));

    // Filter in memory for flexibility
    let filteredProducts = productsData;
    if (categoryId) {
      filteredProducts = filteredProducts.filter(p => p.categoryId === categoryId);
    }
    if (status) {
      const isActive = status === 'active';
      filteredProducts = filteredProducts.filter(p => p.isActive === isActive);
    }

    // Transform data for export
    const exportRows = filteredProducts.map(product => {
      const price = parseFloat(String(product.price || 0));
      const costPrice = parseFloat(String(product.costPrice || 0));
      const inventory = product.inventory || 0;

      return {
        id: product.id,
        sku: product.sku || '',
        name: product.name || '',
        category: product.categoryName || '',
        price: formatCurrency(product.price),
        salePrice: product.salePrice ? formatCurrency(product.salePrice) : '',
        costPrice: product.costPrice ? formatCurrency(product.costPrice) : '',
        inventory: inventory,
        lowStockThreshold: product.lowStockThreshold || 5,
        status: product.isActive ? 'active' : 'inactive',
        gemstoneType: product.gemstoneType || '',
        caratWeight: product.caratWeight || '',
        clarity: product.clarity || '',
        color: product.color || '',
        cut: product.cut || '',
        origin: product.origin || '',
        viewCount: product.viewCount || 0,
        createdAt: formatDateTime(product.createdAt),
        inventoryValue: formatCurrency(costPrice * inventory),
      };
    });

    // Calculate totals for PDF footer
    const totalInventoryValue = filteredProducts.reduce((sum, p) => {
      const costPrice = parseFloat(String(p.costPrice || 0));
      const inventory = p.inventory || 0;
      return sum + costPrice * inventory;
    }, 0);

    const filename = `products_inventory_${new Date().toISOString().split('T')[0]}`;

    return exportData({
      filename,
      title: `Products Inventory (Total Value: ${formatCurrency(totalInventoryValue)})`,
      columns: PRODUCT_COLUMNS,
      data: exportRows,
      format,
    });
  } catch (error) {
    console.error('Export products error:', error);
    return ApiError.internal('Failed to export products');
  }
}

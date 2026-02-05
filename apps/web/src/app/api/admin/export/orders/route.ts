import { NextRequest } from 'next/server';
import { db, orders } from '@/lib/db';
import { desc, gte, lte, and, eq, sql } from 'drizzle-orm';
import { verifyAdminToken } from '@/lib/auth/adminAuth';
import { ApiError } from '@/lib/api';
import {
  exportData,
  formatCurrency,
  formatDateTime,
  type ExportFormat,
} from '@/lib/utils/export';

export const dynamic = 'force-dynamic';

const ORDER_COLUMNS = [
  { header: 'Order ID', key: 'id', width: 36 },
  { header: 'Order Number', key: 'orderNumber', width: 15 },
  { header: 'Date', key: 'date', width: 20 },
  { header: 'Customer Name', key: 'customerName', width: 25 },
  { header: 'Customer Email', key: 'customerEmail', width: 30 },
  { header: 'Status', key: 'status', width: 12 },
  { header: 'Payment Status', key: 'paymentStatus', width: 15 },
  { header: 'Payment Method', key: 'paymentMethod', width: 15 },
  { header: 'Subtotal', key: 'subtotal', width: 12 },
  { header: 'Tax', key: 'tax', width: 10 },
  { header: 'Shipping', key: 'shipping', width: 10 },
  { header: 'Discount', key: 'discount', width: 10 },
  { header: 'Total', key: 'total', width: 12 },
  { header: 'Items Count', key: 'itemsCount', width: 12 },
  { header: 'Shipping Address', key: 'shippingAddress', width: 40 },
  { header: 'Tracking Number', key: 'trackingNumber', width: 20 },
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
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const status = searchParams.get('status');

    // Validate format
    if (!['csv', 'xlsx', 'pdf'].includes(format)) {
      return ApiError.validation('Invalid format. Use csv, xlsx, or pdf');
    }

    // Build query conditions
    const conditions = [];
    if (startDate) {
      conditions.push(gte(orders.createdAt, startDate));
    }
    if (endDate) {
      conditions.push(lte(orders.createdAt, endDate));
    }
    if (status) {
      conditions.push(eq(orders.status, status));
    }

    // Fetch orders
    const ordersData = await db
      .select({
        id: orders.id,
        orderNumber: orders.orderNumber,
        createdAt: orders.createdAt,
        customerName: orders.customerName,
        customerEmail: orders.customerEmail,
        status: orders.status,
        paymentStatus: orders.paymentStatus,
        paymentMethod: orders.paymentMethod,
        subtotal: orders.subtotal,
        taxAmount: orders.taxAmount,
        shippingCost: orders.shippingCost,
        discountAmount: orders.discountAmount,
        total: orders.total,
        itemCount: orders.itemCount,
        shippingAddressLine1: orders.shippingAddressLine1,
        shippingCity: orders.shippingCity,
        shippingProvince: orders.shippingProvince,
        shippingPostalCode: orders.shippingPostalCode,
        shippingCountry: orders.shippingCountry,
        trackingNumber: orders.trackingNumber,
      })
      .from(orders)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(orders.createdAt));

    // Transform data for export
    const exportRows = ordersData.map(order => ({
      id: order.id,
      orderNumber: order.orderNumber || '',
      date: formatDateTime(order.createdAt),
      customerName: order.customerName || '',
      customerEmail: order.customerEmail || '',
      status: order.status || '',
      paymentStatus: order.paymentStatus || '',
      paymentMethod: order.paymentMethod || '',
      subtotal: formatCurrency(order.subtotal),
      tax: formatCurrency(order.taxAmount),
      shipping: formatCurrency(order.shippingCost),
      discount: formatCurrency(order.discountAmount),
      total: formatCurrency(order.total),
      itemsCount: order.itemCount || 0,
      shippingAddress: [
        order.shippingAddressLine1,
        order.shippingCity,
        order.shippingProvince,
        order.shippingPostalCode,
        order.shippingCountry,
      ]
        .filter(Boolean)
        .join(', '),
      trackingNumber: order.trackingNumber || '',
    }));

    // Generate filename with date range
    const dateRange = startDate && endDate ? `_${startDate}_to_${endDate}` : '';
    const filename = `orders_export${dateRange}_${new Date().toISOString().split('T')[0]}`;

    return exportData({
      filename,
      title: 'Orders Report',
      columns: ORDER_COLUMNS,
      data: exportRows,
      format,
    });
  } catch (error) {
    console.error('Export orders error:', error);
    return ApiError.internal('Failed to export orders');
  }
}

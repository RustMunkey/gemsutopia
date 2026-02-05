import { NextRequest } from 'next/server';
import { db, orders } from '@/lib/db';
import { desc, eq, gte, lte, and, sql } from 'drizzle-orm';
import { verifyAdminToken } from '@/lib/auth/adminAuth';
import { ApiError } from '@/lib/api';
import {
  exportData,
  formatCurrency,
  formatDate,
  type ExportFormat,
} from '@/lib/utils/export';

export const dynamic = 'force-dynamic';

const TAX_REPORT_COLUMNS = [
  { header: 'Period', key: 'period', width: 15 },
  { header: 'Total Orders', key: 'totalOrders', width: 12 },
  { header: 'Gross Sales', key: 'grossSales', width: 15 },
  { header: 'Discounts', key: 'discounts', width: 12 },
  { header: 'Net Sales', key: 'netSales', width: 15 },
  { header: 'Tax Collected', key: 'taxCollected', width: 15 },
  { header: 'Shipping Collected', key: 'shippingCollected', width: 18 },
  { header: 'Total Revenue', key: 'totalRevenue', width: 15 },
  { header: 'Refunds', key: 'refunds', width: 12 },
  { header: 'Net Revenue', key: 'netRevenue', width: 15 },
];

const DETAILED_TAX_COLUMNS = [
  { header: 'Date', key: 'date', width: 12 },
  { header: 'Order #', key: 'orderNumber', width: 15 },
  { header: 'Customer', key: 'customer', width: 25 },
  { header: 'Province/State', key: 'province', width: 15 },
  { header: 'Subtotal', key: 'subtotal', width: 12 },
  { header: 'Tax Rate', key: 'taxRate', width: 10 },
  { header: 'Tax Amount', key: 'taxAmount', width: 12 },
  { header: 'Shipping', key: 'shipping', width: 10 },
  { header: 'Total', key: 'total', width: 12 },
  { header: 'Payment Method', key: 'paymentMethod', width: 15 },
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
    const reportType = searchParams.get('type') || 'summary'; // 'summary' or 'detailed'
    const groupBy = searchParams.get('groupBy') || 'month'; // 'day', 'week', 'month', 'quarter', 'year'

    // Validate format
    if (!['csv', 'xlsx', 'pdf'].includes(format)) {
      return ApiError.validation('Invalid format. Use csv, xlsx, or pdf');
    }

    // Default to current year if no dates
    const year = new Date().getFullYear();
    const defaultStart = `${year}-01-01`;
    const defaultEnd = `${year}-12-31`;

    const start = startDate || defaultStart;
    const end = endDate || defaultEnd;

    // Build conditions
    const conditions = [
      gte(orders.createdAt, start),
      lte(orders.createdAt, end),
      eq(orders.paymentStatus, 'paid'),
    ];

    if (reportType === 'detailed') {
      // Detailed report - individual transactions
      const ordersData = await db
        .select({
          id: orders.id,
          orderNumber: orders.orderNumber,
          createdAt: orders.createdAt,
          customerName: orders.customerName,
          customerEmail: orders.customerEmail,
          shippingProvince: orders.shippingProvince,
          subtotal: orders.subtotal,
          taxAmount: orders.taxAmount,
          shippingCost: orders.shippingCost,
          total: orders.total,
          paymentMethod: orders.paymentMethod,
        })
        .from(orders)
        .where(and(...conditions))
        .orderBy(desc(orders.createdAt));

      const exportRows = ordersData.map(order => {
        const subtotal = parseFloat(String(order.subtotal || 0));
        const taxAmount = parseFloat(String(order.taxAmount || 0));
        const taxRate = subtotal > 0 ? ((taxAmount / subtotal) * 100).toFixed(2) : '0.00';

        return {
          date: formatDate(order.createdAt),
          orderNumber: order.orderNumber || order.id.slice(0, 8),
          customer: order.customerName || order.customerEmail || '',
          province: order.shippingProvince || '',
          subtotal: formatCurrency(order.subtotal),
          taxRate: `${taxRate}%`,
          taxAmount: formatCurrency(order.taxAmount),
          shipping: formatCurrency(order.shippingCost),
          total: formatCurrency(order.total),
          paymentMethod: order.paymentMethod || '',
        };
      });

      const filename = `tax_report_detailed_${start}_to_${end}`;

      return exportData({
        filename,
        title: `Detailed Tax Report (${start} to ${end})`,
        columns: DETAILED_TAX_COLUMNS,
        data: exportRows,
        format,
      });
    } else {
      // Summary report - aggregated by period
      const dateFormat =
        groupBy === 'day'
          ? 'YYYY-MM-DD'
          : groupBy === 'week'
            ? 'IYYY-IW'
            : groupBy === 'quarter'
              ? 'YYYY-"Q"Q'
              : groupBy === 'year'
                ? 'YYYY'
                : 'YYYY-MM';

      const summaryData = await db
        .select({
          period: sql<string>`TO_CHAR(${orders.createdAt}, ${dateFormat})`,
          totalOrders: sql<number>`COUNT(*)`,
          grossSales: sql<number>`COALESCE(SUM(${orders.subtotal}), 0)`,
          discounts: sql<number>`COALESCE(SUM(${orders.discountAmount}), 0)`,
          taxCollected: sql<number>`COALESCE(SUM(${orders.taxAmount}), 0)`,
          shippingCollected: sql<number>`COALESCE(SUM(${orders.shippingCost}), 0)`,
          totalRevenue: sql<number>`COALESCE(SUM(${orders.total}), 0)`,
          refunds: sql<number>`COALESCE(SUM(CASE WHEN ${orders.status} = 'refunded' THEN ${orders.total} ELSE 0 END), 0)`,
        })
        .from(orders)
        .where(and(...conditions))
        .groupBy(sql`TO_CHAR(${orders.createdAt}, ${dateFormat})`)
        .orderBy(sql`TO_CHAR(${orders.createdAt}, ${dateFormat})`);

      const exportRows = summaryData.map(row => {
        const grossSales = parseFloat(String(row.grossSales || 0));
        const discounts = parseFloat(String(row.discounts || 0));
        const refunds = parseFloat(String(row.refunds || 0));
        const netSales = grossSales - discounts;

        return {
          period: row.period,
          totalOrders: row.totalOrders,
          grossSales: formatCurrency(grossSales),
          discounts: formatCurrency(discounts),
          netSales: formatCurrency(netSales),
          taxCollected: formatCurrency(row.taxCollected),
          shippingCollected: formatCurrency(row.shippingCollected),
          totalRevenue: formatCurrency(row.totalRevenue),
          refunds: formatCurrency(refunds),
          netRevenue: formatCurrency(parseFloat(String(row.totalRevenue || 0)) - refunds),
        };
      });

      // Add totals row
      const totals = exportRows.reduce(
        (acc, row) => ({
          totalOrders: acc.totalOrders + row.totalOrders,
          grossSales:
            acc.grossSales + parseFloat(row.grossSales.replace(/[$,]/g, '')),
          discounts:
            acc.discounts + parseFloat(row.discounts.replace(/[$,]/g, '')),
          taxCollected:
            acc.taxCollected + parseFloat(row.taxCollected.replace(/[$,]/g, '')),
          shippingCollected:
            acc.shippingCollected +
            parseFloat(row.shippingCollected.replace(/[$,]/g, '')),
          totalRevenue:
            acc.totalRevenue + parseFloat(row.totalRevenue.replace(/[$,]/g, '')),
          refunds:
            acc.refunds + parseFloat(row.refunds.replace(/[$,]/g, '')),
        }),
        {
          totalOrders: 0,
          grossSales: 0,
          discounts: 0,
          taxCollected: 0,
          shippingCollected: 0,
          totalRevenue: 0,
          refunds: 0,
        }
      );

      exportRows.push({
        period: 'TOTAL',
        totalOrders: totals.totalOrders,
        grossSales: formatCurrency(totals.grossSales),
        discounts: formatCurrency(totals.discounts),
        netSales: formatCurrency(totals.grossSales - totals.discounts),
        taxCollected: formatCurrency(totals.taxCollected),
        shippingCollected: formatCurrency(totals.shippingCollected),
        totalRevenue: formatCurrency(totals.totalRevenue),
        refunds: formatCurrency(totals.refunds),
        netRevenue: formatCurrency(totals.totalRevenue - totals.refunds),
      });

      const filename = `tax_report_summary_${groupBy}_${start}_to_${end}`;

      return exportData({
        filename,
        title: `Tax Summary Report by ${groupBy.charAt(0).toUpperCase() + groupBy.slice(1)} (${start} to ${end})`,
        columns: TAX_REPORT_COLUMNS,
        data: exportRows,
        format,
      });
    }
  } catch (error) {
    console.error('Export tax report error:', error);
    return ApiError.internal('Failed to export tax report');
  }
}

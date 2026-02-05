import { NextRequest } from 'next/server';
import { db, users, customerLoyalty, loyaltyTiers, storeCredits } from '@/lib/db';
import { desc, eq, sql } from 'drizzle-orm';
import { verifyAdminToken } from '@/lib/auth/adminAuth';
import { ApiError } from '@/lib/api';
import {
  exportData,
  formatCurrency,
  formatDateTime,
  type ExportFormat,
} from '@/lib/utils/export';

export const dynamic = 'force-dynamic';

const CUSTOMER_COLUMNS = [
  { header: 'ID', key: 'id', width: 36 },
  { header: 'Name', key: 'name', width: 25 },
  { header: 'Email', key: 'email', width: 30 },
  { header: 'Phone', key: 'phone', width: 15 },
  { header: 'Joined', key: 'createdAt', width: 20 },
  { header: 'Total Orders', key: 'totalOrders', width: 12 },
  { header: 'Total Spent', key: 'totalSpent', width: 15 },
  { header: 'Average Order', key: 'averageOrder', width: 15 },
  { header: 'Loyalty Tier', key: 'loyaltyTier', width: 15 },
  { header: 'Loyalty Points', key: 'loyaltyPoints', width: 15 },
  { header: 'Store Credit', key: 'storeCredit', width: 12 },
  { header: 'Email Verified', key: 'emailVerified', width: 15 },
  { header: 'Last Order', key: 'lastOrder', width: 20 },
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
    const tierId = searchParams.get('tierId');

    // Validate format
    if (!['csv', 'xlsx', 'pdf'].includes(format)) {
      return ApiError.validation('Invalid format. Use csv, xlsx, or pdf');
    }

    // Fetch customers with aggregated order data
    const customersData = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        phone: users.phone,
        createdAt: users.createdAt,
        emailVerified: users.emailVerified,
        totalOrders: sql<number>`COALESCE((SELECT COUNT(*) FROM orders WHERE orders.user_id = ${users.id}), 0)`,
        totalSpent: sql<number>`COALESCE((SELECT SUM(total) FROM orders WHERE orders.user_id = ${users.id} AND orders.payment_status = 'paid'), 0)`,
        lastOrderDate: sql<string>`(SELECT MAX(created_at) FROM orders WHERE orders.user_id = ${users.id})`,
      })
      .from(users)
      .orderBy(desc(users.createdAt));

    // Fetch loyalty data separately (using correct field names)
    const loyaltyData = await db
      .select({
        email: customerLoyalty.email,
        pointsBalance: customerLoyalty.pointsBalance,
        tierName: customerLoyalty.tierName,
        tierId: customerLoyalty.tierId,
      })
      .from(customerLoyalty);

    // Fetch store credits separately
    const storeCreditData = await db
      .select({
        email: storeCredits.email,
        balance: storeCredits.balance,
      })
      .from(storeCredits);

    // Create lookup maps
    const loyaltyMap = new Map(loyaltyData.map(l => [l.email, l]));
    const storeCreditMap = new Map(storeCreditData.map(s => [s.email, s]));

    // Transform data for export
    let exportRows = customersData.map(customer => {
      const loyalty = loyaltyMap.get(customer.email || '');
      const credit = storeCreditMap.get(customer.email || '');
      const totalSpent = parseFloat(String(customer.totalSpent || 0));
      const totalOrders = customer.totalOrders || 0;

      return {
        id: customer.id,
        name: customer.name || '',
        email: customer.email || '',
        phone: customer.phone || '',
        createdAt: formatDateTime(customer.createdAt),
        totalOrders: totalOrders,
        totalSpent: formatCurrency(totalSpent),
        averageOrder: totalOrders > 0 ? formatCurrency(totalSpent / totalOrders) : '$0.00',
        loyaltyTier: loyalty?.tierName || 'None',
        loyaltyPoints: loyalty?.pointsBalance || 0,
        storeCredit: formatCurrency(credit?.balance || 0),
        emailVerified: customer.emailVerified ? 'Yes' : 'No',
        lastOrder: customer.lastOrderDate ? formatDateTime(customer.lastOrderDate) : 'Never',
      };
    });

    // Filter by tier if specified
    if (tierId) {
      const tierInfo = await db
        .select({ name: loyaltyTiers.name })
        .from(loyaltyTiers)
        .where(eq(loyaltyTiers.id, tierId))
        .limit(1);

      if (tierInfo[0]) {
        exportRows = exportRows.filter(r => r.loyaltyTier === tierInfo[0].name);
      }
    }

    // Calculate summary
    const totalCustomers = exportRows.length;
    const totalRevenue = customersData.reduce(
      (sum, c) => sum + parseFloat(String(c.totalSpent || 0)),
      0
    );

    const filename = `customers_export_${new Date().toISOString().split('T')[0]}`;

    return exportData({
      filename,
      title: `Customers Report (${totalCustomers} customers, ${formatCurrency(totalRevenue)} total revenue)`,
      columns: CUSTOMER_COLUMNS,
      data: exportRows,
      format,
    });
  } catch (error) {
    console.error('Export customers error:', error);
    return ApiError.internal('Failed to export customers');
  }
}

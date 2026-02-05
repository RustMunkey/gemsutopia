import {
  pgTable,
  index,
  foreignKey,
  unique,
  uuid,
  text,
  integer,
  boolean,
  jsonb,
  timestamp,
  check,
  numeric,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const categories = pgTable(
  'categories',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    name: text().notNull(),
    slug: text().notNull(),
    description: text(),
    image: text(),
    parentId: uuid('parent_id'),
    sortOrder: integer('sort_order').default(0),
    isActive: boolean('is_active').default(true),
    isFeatured: boolean('is_featured').default(false),
    metaTitle: text('meta_title'),
    metaDescription: text('meta_description'),
    metadata: jsonb().default({}),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow(),
  },
  table => [
    index('idx_categories_active')
      .using('btree', table.isActive.asc().nullsLast().op('bool_ops'))
      .where(sql`(is_active = true)`),
    index('idx_categories_parent').using('btree', table.parentId.asc().nullsLast().op('uuid_ops')),
    index('idx_categories_slug').using('btree', table.slug.asc().nullsLast().op('text_ops')),
    foreignKey({
      columns: [table.parentId],
      foreignColumns: [table.id],
      name: 'categories_parent_id_fkey',
    }).onDelete('set null'),
    unique('categories_slug_key').on(table.slug),
  ]
);

export const products = pgTable(
  'products',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    name: text().notNull(),
    slug: text(),
    description: text(),
    shortDescription: text('short_description'),
    price: numeric({ precision: 10, scale: 2 }).notNull(),
    salePrice: numeric('sale_price', { precision: 10, scale: 2 }),
    onSale: boolean('on_sale').default(false),
    costPrice: numeric('cost_price', { precision: 10, scale: 2 }),
    inventory: integer().default(0),
    sku: text(),
    trackInventory: boolean('track_inventory').default(true),
    lowStockThreshold: integer('low_stock_threshold').default(5),
    images: text().array().default(['']),
    featuredImageIndex: integer('featured_image_index').default(0),
    videoUrl: text('video_url'),
    categoryId: uuid('category_id'),
    gemstoneType: text('gemstone_type'),
    caratWeight: numeric('carat_weight', { precision: 6, scale: 3 }),
    cut: text(),
    clarity: text(),
    color: text(),
    origin: text(),
    treatment: text(),
    certification: text(),
    certificationNumber: text('certification_number'),
    dimensions: jsonb(),
    weight: numeric({ precision: 10, scale: 3 }),
    shape: text(),
    sortOrder: integer('sort_order').default(0),
    isActive: boolean('is_active').default(true),
    featured: boolean().default(false),
    isNew: boolean('is_new').default(false),
    isBestseller: boolean('is_bestseller').default(false),
    metaTitle: text('meta_title'),
    metaDescription: text('meta_description'),
    viewCount: integer('view_count').default(0),
    purchaseCount: integer('purchase_count').default(0),
    averageRating: numeric('average_rating', { precision: 3, scale: 2 }).default('0'),
    reviewCount: integer('review_count').default(0),
    metadata: jsonb().default({}),
    tags: text().array().default(['']),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow(),
  },
  table => [
    index('idx_products_active')
      .using('btree', table.isActive.asc().nullsLast().op('bool_ops'))
      .where(sql`(is_active = true)`),
    index('idx_products_category').using(
      'btree',
      table.categoryId.asc().nullsLast().op('uuid_ops')
    ),
    index('idx_products_created').using(
      'btree',
      table.createdAt.desc().nullsFirst().op('timestamptz_ops')
    ),
    index('idx_products_featured')
      .using(
        'btree',
        table.featured.asc().nullsLast().op('bool_ops'),
        table.isActive.asc().nullsLast().op('bool_ops')
      )
      .where(sql`((featured = true) AND (is_active = true))`),
    index('idx_products_gemstone')
      .using('btree', table.gemstoneType.asc().nullsLast().op('text_ops'))
      .where(sql`(gemstone_type IS NOT NULL)`),
    index('idx_products_inventory')
      .using('btree', table.inventory.asc().nullsLast().op('int4_ops'))
      .where(sql`(inventory > 0)`),
    index('idx_products_price').using('btree', table.price.asc().nullsLast().op('numeric_ops')),
    index('idx_products_slug').using('btree', table.slug.asc().nullsLast().op('text_ops')),
    foreignKey({
      columns: [table.categoryId],
      foreignColumns: [categories.id],
      name: 'products_category_id_fkey',
    }).onDelete('set null'),
    unique('products_slug_key').on(table.slug),
    unique('products_sku_key').on(table.sku),
    check('products_price_check', sql`price >= (0)::numeric`),
    check('products_sale_price_check', sql`(sale_price IS NULL) OR (sale_price >= (0)::numeric)`),
    check('products_inventory_check', sql`inventory >= 0`),
  ]
);

export const payments = pgTable(
  'payments',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    orderId: uuid('order_id'),
    provider: text().notNull(),
    providerPaymentId: text('provider_payment_id'),
    providerCustomerId: text('provider_customer_id'),
    amount: numeric({ precision: 10, scale: 2 }).notNull(),
    currency: text().default('CAD'),
    feeAmount: numeric('fee_amount', { precision: 10, scale: 2 }).default('0'),
    netAmount: numeric('net_amount', { precision: 10, scale: 2 }),
    status: text().default('pending'),
    paymentMethodType: text('payment_method_type'),
    paymentMethodDetails: jsonb('payment_method_details').default({}),
    refundAmount: numeric('refund_amount', { precision: 10, scale: 2 }).default('0'),
    refundReason: text('refund_reason'),
    refundedAt: timestamp('refunded_at', { withTimezone: true, mode: 'string' }),
    providerResponse: jsonb('provider_response').default({}),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow(),
  },
  table => [
    index('idx_payments_order').using('btree', table.orderId.asc().nullsLast().op('uuid_ops')),
    index('idx_payments_provider_id').using(
      'btree',
      table.providerPaymentId.asc().nullsLast().op('text_ops')
    ),
    foreignKey({
      columns: [table.orderId],
      foreignColumns: [orders.id],
      name: 'payments_order_id_fkey',
    }).onDelete('set null'),
    check(
      'payments_provider_check',
      sql`provider = ANY (ARRAY['stripe'::text, 'paypal'::text, 'btc'::text, 'manual'::text])`
    ),
    check(
      'payments_status_check',
      sql`status = ANY (ARRAY['pending'::text, 'processing'::text, 'succeeded'::text, 'failed'::text, 'cancelled'::text, 'refunded'::text])`
    ),
  ]
);

export const users = pgTable(
  'users',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    email: text().notNull(),
    name: text(),
    firstName: text('first_name'),
    lastName: text('last_name'),
    phone: text(),
    avatarUrl: text('avatar_url'),
    addressLine1: text('address_line1'),
    addressLine2: text('address_line2'),
    city: text(),
    province: text(),
    postalCode: text('postal_code'),
    country: text().default('Canada'),
    emailVerified: boolean('email_verified').default(false),
    isActive: boolean('is_active').default(true),
    role: text().default('customer'),
    preferences: jsonb().default({}),
    currency: text().default('CAD'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow(),
    lastLoginAt: timestamp('last_login_at', { withTimezone: true, mode: 'string' }),
  },
  table => [
    index('idx_users_email').using('btree', table.email.asc().nullsLast().op('text_ops')),
    index('idx_users_role').using('btree', table.role.asc().nullsLast().op('text_ops')),
    unique('users_email_key').on(table.email),
    check(
      'users_role_check',
      sql`role = ANY (ARRAY['customer'::text, 'admin'::text, 'super_admin'::text])`
    ),
  ]
);

export const orders = pgTable(
  'orders',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    orderNumber: text('order_number').notNull(),
    userId: uuid('user_id'),
    customerEmail: text('customer_email').notNull(),
    customerName: text('customer_name'),
    customerPhone: text('customer_phone'),
    shippingAddressLine1: text('shipping_address_line1'),
    shippingAddressLine2: text('shipping_address_line2'),
    shippingCity: text('shipping_city'),
    shippingProvince: text('shipping_province'),
    shippingPostalCode: text('shipping_postal_code'),
    shippingCountry: text('shipping_country').default('Canada'),
    billingSameAsShipping: boolean('billing_same_as_shipping').default(true),
    billingAddressLine1: text('billing_address_line1'),
    billingAddressLine2: text('billing_address_line2'),
    billingCity: text('billing_city'),
    billingProvince: text('billing_province'),
    billingPostalCode: text('billing_postal_code'),
    billingCountry: text('billing_country'),
    subtotal: numeric({ precision: 10, scale: 2 }).notNull(),
    shippingCost: numeric('shipping_cost', { precision: 10, scale: 2 }).default('0'),
    taxAmount: numeric('tax_amount', { precision: 10, scale: 2 }).default('0'),
    discountAmount: numeric('discount_amount', { precision: 10, scale: 2 }).default('0'),
    total: numeric({ precision: 10, scale: 2 }).notNull(),
    currency: text().default('CAD'),
    discountCode: text('discount_code'),
    discountId: uuid('discount_id'),
    status: text().default('pending'),
    paymentMethod: text('payment_method'),
    paymentStatus: text('payment_status').default('pending'),
    paymentDetails: jsonb('payment_details').default({}),
    shippingMethod: text('shipping_method'),
    trackingNumber: text('tracking_number'),
    carrier: text(), // canada_post, ups, fedex, purolator, etc.
    carrierTrackingUrl: text('carrier_tracking_url'), // Direct link to carrier tracking
    shippedAt: timestamp('shipped_at', { withTimezone: true, mode: 'string' }),
    deliveredAt: timestamp('delivered_at', { withTimezone: true, mode: 'string' }),
    estimatedDelivery: timestamp('estimated_delivery', { withTimezone: true, mode: 'string' }),
    items: jsonb().default([]).notNull(),
    itemCount: integer('item_count').default(0),
    customerNotes: text('customer_notes'),
    adminNotes: text('admin_notes'),
    metadata: jsonb().default({}),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow(),
  },
  table => [
    index('idx_orders_created').using(
      'btree',
      table.createdAt.desc().nullsFirst().op('timestamptz_ops')
    ),
    index('idx_orders_email').using('btree', table.customerEmail.asc().nullsLast().op('text_ops')),
    index('idx_orders_number').using('btree', table.orderNumber.asc().nullsLast().op('text_ops')),
    index('idx_orders_status').using('btree', table.status.asc().nullsLast().op('text_ops')),
    index('idx_orders_user').using('btree', table.userId.asc().nullsLast().op('uuid_ops')),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
      name: 'orders_user_id_fkey',
    }).onDelete('set null'),
    unique('orders_order_number_key').on(table.orderNumber),
    check('orders_subtotal_check', sql`subtotal >= (0)::numeric`),
    check('orders_shipping_cost_check', sql`shipping_cost >= (0)::numeric`),
    check('orders_tax_amount_check', sql`tax_amount >= (0)::numeric`),
    check('orders_discount_amount_check', sql`discount_amount >= (0)::numeric`),
    check('orders_total_check', sql`total >= (0)::numeric`),
    check(
      'orders_status_check',
      sql`status = ANY (ARRAY['pending'::text, 'confirmed'::text, 'processing'::text, 'shipped'::text, 'delivered'::text, 'cancelled'::text, 'refunded'::text, 'failed'::text, 'disputed'::text, 'on_hold'::text])`
    ),
    check(
      'orders_payment_method_check',
      sql`payment_method = ANY (ARRAY['stripe'::text, 'paypal'::text, 'crypto'::text, 'btc'::text])`
    ),
    check(
      'orders_payment_status_check',
      sql`payment_status = ANY (ARRAY['pending'::text, 'paid'::text, 'failed'::text, 'refunded'::text, 'partially_refunded'::text])`
    ),
  ]
);

export const auctions = pgTable(
  'auctions',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    title: text().notNull(),
    slug: text(),
    description: text(),
    images: text().array().default(['']),
    featuredImageIndex: integer('featured_image_index').default(0),
    videoUrl: text('video_url'),
    startingBid: numeric('starting_bid', { precision: 10, scale: 2 }).notNull(),
    currentBid: numeric('current_bid', { precision: 10, scale: 2 }).default('0'),
    reservePrice: numeric('reserve_price', { precision: 10, scale: 2 }),
    buyNowPrice: numeric('buy_now_price', { precision: 10, scale: 2 }),
    bidIncrement: numeric('bid_increment', { precision: 10, scale: 2 }).default('1.00'),
    currency: text().default('CAD'),
    bidCount: integer('bid_count').default(0),
    highestBidderId: uuid('highest_bidder_id'),
    startTime: timestamp('start_time', { withTimezone: true, mode: 'string' }).notNull(),
    endTime: timestamp('end_time', { withTimezone: true, mode: 'string' }).notNull(),
    extendedEndTime: timestamp('extended_end_time', { withTimezone: true, mode: 'string' }),
    autoExtend: boolean('auto_extend').default(true),
    extendMinutes: integer('extend_minutes').default(5),
    extendThresholdMinutes: integer('extend_threshold_minutes').default(5),
    status: text().default('pending'),
    isActive: boolean('is_active').default(true),
    winnerId: uuid('winner_id'),
    winningBid: numeric('winning_bid', { precision: 10, scale: 2 }),
    wonAt: timestamp('won_at', { withTimezone: true, mode: 'string' }),
    productId: uuid('product_id'),
    gemstoneType: text('gemstone_type'),
    caratWeight: numeric('carat_weight', { precision: 6, scale: 3 }),
    cut: text(),
    clarity: text(),
    color: text(),
    origin: text(),
    certification: text(),
    metaTitle: text('meta_title'),
    metaDescription: text('meta_description'),
    metadata: jsonb().default({}),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow(),
  },
  table => [
    index('idx_auctions_active')
      .using(
        'btree',
        table.isActive.asc().nullsLast().op('bool_ops'),
        table.status.asc().nullsLast().op('text_ops')
      )
      .where(sql`(is_active = true)`),
    index('idx_auctions_current_bid').using(
      'btree',
      table.currentBid.desc().nullsFirst().op('numeric_ops')
    ),
    index('idx_auctions_end_time').using(
      'btree',
      table.endTime.asc().nullsLast().op('timestamptz_ops')
    ),
    index('idx_auctions_status').using('btree', table.status.asc().nullsLast().op('text_ops')),
    foreignKey({
      columns: [table.highestBidderId],
      foreignColumns: [users.id],
      name: 'auctions_highest_bidder_id_fkey',
    }).onDelete('set null'),
    foreignKey({
      columns: [table.winnerId],
      foreignColumns: [users.id],
      name: 'auctions_winner_id_fkey',
    }).onDelete('set null'),
    foreignKey({
      columns: [table.productId],
      foreignColumns: [products.id],
      name: 'auctions_product_id_fkey',
    }).onDelete('set null'),
    unique('auctions_slug_key').on(table.slug),
    check('auctions_starting_bid_check', sql`starting_bid >= (0)::numeric`),
    check('auctions_current_bid_check', sql`current_bid >= (0)::numeric`),
    check('auctions_check', sql`(reserve_price IS NULL) OR (reserve_price >= starting_bid)`),
    check('auctions_check1', sql`(buy_now_price IS NULL) OR (buy_now_price > starting_bid)`),
    check('auctions_bid_increment_check', sql`bid_increment > (0)::numeric`),
    check('auctions_bid_count_check', sql`bid_count >= 0`),
    check('auctions_check2', sql`end_time > start_time`),
    check(
      'auctions_status_check',
      sql`status = ANY (ARRAY['pending'::text, 'scheduled'::text, 'active'::text, 'ended'::text, 'sold'::text, 'cancelled'::text, 'no_sale'::text])`
    ),
  ]
);

export const orderItems = pgTable(
  'order_items',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    orderId: uuid('order_id').notNull(),
    productId: uuid('product_id'),
    productName: text('product_name').notNull(),
    productSku: text('product_sku'),
    productImage: text('product_image'),
    unitPrice: numeric('unit_price', { precision: 10, scale: 2 }).notNull(),
    quantity: integer().notNull(),
    subtotal: numeric({ precision: 10, scale: 2 }).notNull(),
    productDetails: jsonb('product_details').default({}),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
  },
  table => [
    index('idx_order_items_order').using('btree', table.orderId.asc().nullsLast().op('uuid_ops')),
    foreignKey({
      columns: [table.orderId],
      foreignColumns: [orders.id],
      name: 'order_items_order_id_fkey',
    }).onDelete('cascade'),
    foreignKey({
      columns: [table.productId],
      foreignColumns: [products.id],
      name: 'order_items_product_id_fkey',
    }).onDelete('set null'),
    check('order_items_quantity_check', sql`quantity > 0`),
  ]
);

export const bids = pgTable(
  'bids',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    auctionId: uuid('auction_id').notNull(),
    userId: uuid('user_id'),
    bidderEmail: text('bidder_email').notNull(),
    bidderName: text('bidder_name'),
    amount: numeric({ precision: 10, scale: 2 }).notNull(),
    maxBid: numeric('max_bid', { precision: 10, scale: 2 }),
    isAutoBid: boolean('is_auto_bid').default(false),
    status: text().default('active'),
    isWinning: boolean('is_winning').default(false),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
  },
  table => [
    index('idx_bids_auction').using('btree', table.auctionId.asc().nullsLast().op('uuid_ops')),
    index('idx_bids_user').using('btree', table.userId.asc().nullsLast().op('uuid_ops')),
    foreignKey({
      columns: [table.auctionId],
      foreignColumns: [auctions.id],
      name: 'bids_auction_id_fkey',
    }).onDelete('cascade'),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
      name: 'bids_user_id_fkey',
    }).onDelete('set null'),
    check('bids_amount_check', sql`amount > (0)::numeric`),
    check(
      'bids_status_check',
      sql`status = ANY (ARRAY['active'::text, 'outbid'::text, 'winning'::text, 'won'::text, 'cancelled'::text, 'retracted'::text])`
    ),
  ]
);

export const auctionWatchers = pgTable(
  'auction_watchers',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    auctionId: uuid('auction_id').notNull(),
    userId: uuid('user_id'),
    email: text().notNull(),
    notifyOutbid: boolean('notify_outbid').default(true),
    notifyEnding: boolean('notify_ending').default(true),
    notifyResult: boolean('notify_result').default(true),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
  },
  table => [
    foreignKey({
      columns: [table.auctionId],
      foreignColumns: [auctions.id],
      name: 'auction_watchers_auction_id_fkey',
    }).onDelete('cascade'),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
      name: 'auction_watchers_user_id_fkey',
    }).onDelete('cascade'),
    unique('auction_watchers_auction_id_email_key').on(table.auctionId, table.email),
  ]
);

export const reviews = pgTable(
  'reviews',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    productId: uuid('product_id'),
    userId: uuid('user_id'),
    orderId: uuid('order_id'),
    reviewerName: text('reviewer_name'),
    reviewerEmail: text('reviewer_email'),
    rating: integer().notNull(),
    title: text(),
    content: text(),
    images: text().array().default(['']),
    verifiedPurchase: boolean('verified_purchase').default(false),
    status: text().default('pending'),
    isFeatured: boolean('is_featured').default(false),
    adminResponse: text('admin_response'),
    adminResponseAt: timestamp('admin_response_at', { withTimezone: true, mode: 'string' }),
    helpfulCount: integer('helpful_count').default(0),
    notHelpfulCount: integer('not_helpful_count').default(0),
    metadata: jsonb().default({}),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow(),
  },
  table => [
    index('idx_reviews_product').using('btree', table.productId.asc().nullsLast().op('uuid_ops')),
    index('idx_reviews_status').using('btree', table.status.asc().nullsLast().op('text_ops')),
    foreignKey({
      columns: [table.productId],
      foreignColumns: [products.id],
      name: 'reviews_product_id_fkey',
    }).onDelete('cascade'),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
      name: 'reviews_user_id_fkey',
    }).onDelete('set null'),
    foreignKey({
      columns: [table.orderId],
      foreignColumns: [orders.id],
      name: 'reviews_order_id_fkey',
    }).onDelete('set null'),
    check('reviews_rating_check', sql`(rating >= 1) AND (rating <= 5)`),
    check(
      'reviews_status_check',
      sql`status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text, 'flagged'::text])`
    ),
  ]
);

export const wishlists = pgTable(
  'wishlists',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    userId: uuid('user_id'),
    guestEmail: text('guest_email'),
    sessionId: text('session_id'),
    name: text().default('My Wishlist'),
    isPublic: boolean('is_public').default(false),
    shareToken: text('share_token'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow(),
  },
  table => [
    index('idx_wishlists_user').using('btree', table.userId.asc().nullsLast().op('uuid_ops')),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
      name: 'wishlists_user_id_fkey',
    }).onDelete('cascade'),
    unique('wishlists_share_token_key').on(table.shareToken),
  ]
);

export const wishlistItems = pgTable(
  'wishlist_items',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    wishlistId: uuid('wishlist_id').notNull(),
    productId: uuid('product_id').notNull(),
    notes: text(),
    priority: integer().default(0),
    addedPrice: numeric('added_price', { precision: 10, scale: 2 }),
    notifyPriceDrop: boolean('notify_price_drop').default(true),
    notifyBackInStock: boolean('notify_back_in_stock').default(true),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
  },
  table => [
    index('idx_wishlist_items_wishlist').using(
      'btree',
      table.wishlistId.asc().nullsLast().op('uuid_ops')
    ),
    foreignKey({
      columns: [table.wishlistId],
      foreignColumns: [wishlists.id],
      name: 'wishlist_items_wishlist_id_fkey',
    }).onDelete('cascade'),
    foreignKey({
      columns: [table.productId],
      foreignColumns: [products.id],
      name: 'wishlist_items_product_id_fkey',
    }).onDelete('cascade'),
    unique('wishlist_items_wishlist_id_product_id_key').on(table.wishlistId, table.productId),
  ]
);

export const carts = pgTable(
  'carts',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    userId: uuid('user_id'),
    sessionId: text('session_id'),
    guestEmail: text('guest_email'),
    status: text().default('active'),
    itemCount: integer('item_count').default(0),
    subtotal: numeric({ precision: 10, scale: 2 }).default('0'),
    discountCode: text('discount_code'),
    discountAmount: numeric('discount_amount', { precision: 10, scale: 2 }).default('0'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow(),
    expiresAt: timestamp('expires_at', { withTimezone: true, mode: 'string' }).default(
      sql`(now() + '30 days'::interval)`
    ),
  },
  table => [
    index('idx_carts_session').using('btree', table.sessionId.asc().nullsLast().op('text_ops')),
    index('idx_carts_user').using('btree', table.userId.asc().nullsLast().op('uuid_ops')),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
      name: 'carts_user_id_fkey',
    }).onDelete('cascade'),
    check(
      'carts_status_check',
      sql`status = ANY (ARRAY['active'::text, 'abandoned'::text, 'converted'::text, 'merged'::text])`
    ),
  ]
);

export const cartItems = pgTable(
  'cart_items',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    cartId: uuid('cart_id').notNull(),
    productId: uuid('product_id').notNull(),
    quantity: integer().default(1).notNull(),
    unitPrice: numeric('unit_price', { precision: 10, scale: 2 }).notNull(),
    salePrice: numeric('sale_price', { precision: 10, scale: 2 }),
    productSnapshot: jsonb('product_snapshot').default({}),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow(),
  },
  table => [
    index('idx_cart_items_cart').using('btree', table.cartId.asc().nullsLast().op('uuid_ops')),
    foreignKey({
      columns: [table.cartId],
      foreignColumns: [carts.id],
      name: 'cart_items_cart_id_fkey',
    }).onDelete('cascade'),
    foreignKey({
      columns: [table.productId],
      foreignColumns: [products.id],
      name: 'cart_items_product_id_fkey',
    }).onDelete('cascade'),
    unique('cart_items_cart_id_product_id_key').on(table.cartId, table.productId),
    check('cart_items_quantity_check', sql`quantity > 0`),
  ]
);

export const notifications = pgTable(
  'notifications',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    userId: uuid('user_id'),
    email: text(),
    type: text().notNull(),
    title: text().notNull(),
    message: text().notNull(),
    actionUrl: text('action_url'),
    actionText: text('action_text'),
    orderId: uuid('order_id'),
    productId: uuid('product_id'),
    auctionId: uuid('auction_id'),
    isRead: boolean('is_read').default(false),
    readAt: timestamp('read_at', { withTimezone: true, mode: 'string' }),
    isEmailSent: boolean('is_email_sent').default(false),
    emailSentAt: timestamp('email_sent_at', { withTimezone: true, mode: 'string' }),
    priority: text().default('normal'),
    expiresAt: timestamp('expires_at', { withTimezone: true, mode: 'string' }),
    metadata: jsonb().default({}),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
  },
  table => [
    index('idx_notifications_read')
      .using(
        'btree',
        table.userId.asc().nullsLast().op('bool_ops'),
        table.isRead.asc().nullsLast().op('bool_ops')
      )
      .where(sql`(is_read = false)`),
    index('idx_notifications_user').using('btree', table.userId.asc().nullsLast().op('uuid_ops')),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
      name: 'notifications_user_id_fkey',
    }).onDelete('cascade'),
    foreignKey({
      columns: [table.orderId],
      foreignColumns: [orders.id],
      name: 'notifications_order_id_fkey',
    }).onDelete('set null'),
    foreignKey({
      columns: [table.productId],
      foreignColumns: [products.id],
      name: 'notifications_product_id_fkey',
    }).onDelete('set null'),
    foreignKey({
      columns: [table.auctionId],
      foreignColumns: [auctions.id],
      name: 'notifications_auction_id_fkey',
    }).onDelete('set null'),
    check(
      'notifications_type_check',
      sql`type = ANY (ARRAY['order_confirmation'::text, 'order_shipped'::text, 'order_delivered'::text, 'bid_placed'::text, 'outbid'::text, 'auction_won'::text, 'auction_lost'::text, 'auction_ending'::text, 'price_drop'::text, 'back_in_stock'::text, 'wishlist_sale'::text, 'review_approved'::text, 'review_response'::text, 'welcome'::text, 'password_reset'::text, 'account_update'::text, 'promo'::text, 'newsletter'::text, 'system'::text])`
    ),
    check(
      'notifications_priority_check',
      sql`priority = ANY (ARRAY['low'::text, 'normal'::text, 'high'::text, 'urgent'::text])`
    ),
  ]
);

export const emailSubscriptions = pgTable(
  'email_subscriptions',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    email: text().notNull(),
    userId: uuid('user_id'),
    newsletter: boolean().default(true),
    promotions: boolean().default(true),
    orderUpdates: boolean('order_updates').default(true),
    auctionUpdates: boolean('auction_updates').default(true),
    priceAlerts: boolean('price_alerts').default(true),
    stockAlerts: boolean('stock_alerts').default(true),
    isVerified: boolean('is_verified').default(false),
    verificationToken: text('verification_token'),
    verifiedAt: timestamp('verified_at', { withTimezone: true, mode: 'string' }),
    unsubscribeToken: text('unsubscribe_token'),
    unsubscribedAt: timestamp('unsubscribed_at', { withTimezone: true, mode: 'string' }),
    source: text().default('website'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow(),
  },
  table => [
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
      name: 'email_subscriptions_user_id_fkey',
    }).onDelete('set null'),
    unique('email_subscriptions_email_key').on(table.email),
    unique('email_subscriptions_unsubscribe_token_key').on(table.unsubscribeToken),
  ]
);

export const gemFacts = pgTable('gem_facts', {
  id: uuid().defaultRandom().primaryKey().notNull(),
  title: text().notNull(),
  content: text().notNull(),
  shortContent: text('short_content'),
  image: text(),
  videoUrl: text('video_url'),
  gemstoneType: text('gemstone_type'),
  category: text().default('general'),
  sortOrder: integer('sort_order').default(0),
  isActive: boolean('is_active').default(true),
  isFeatured: boolean('is_featured').default(false),
  source: text(),
  sourceUrl: text('source_url'),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow(),
});

export const pages = pgTable(
  'pages',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    slug: text().notNull(),
    title: text().notNull(),
    content: text(),
    excerpt: text(),
    template: text().default('default'),
    featuredImage: text('featured_image'),
    status: text().default('draft'),
    isInMenu: boolean('is_in_menu').default(false),
    menuOrder: integer('menu_order').default(0),
    metaTitle: text('meta_title'),
    metaDescription: text('meta_description'),
    ogImage: text('og_image'),
    requiresAuth: boolean('requires_auth').default(false),
    metadata: jsonb().default({}),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow(),
    publishedAt: timestamp('published_at', { withTimezone: true, mode: 'string' }),
  },
  table => [
    unique('pages_slug_key').on(table.slug),
    check(
      'pages_status_check',
      sql`status = ANY (ARRAY['draft'::text, 'published'::text, 'archived'::text])`
    ),
  ]
);

export const faq = pgTable('faq', {
  id: uuid().defaultRandom().primaryKey().notNull(),
  question: text().notNull(),
  answer: text().notNull(),
  category: text().default('general'),
  sortOrder: integer('sort_order').default(0),
  isActive: boolean('is_active').default(true),
  isFeatured: boolean('is_featured').default(false),
  viewCount: integer('view_count').default(0),
  helpfulCount: integer('helpful_count').default(0),
  notHelpfulCount: integer('not_helpful_count').default(0),
  metadata: jsonb().default({}),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow(),
});

export const discountUsage = pgTable(
  'discount_usage',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    discountCodeId: uuid('discount_code_id').notNull(),
    orderId: uuid('order_id'),
    userId: uuid('user_id'),
    customerEmail: text('customer_email').notNull(),
    discountAmount: numeric('discount_amount', { precision: 10, scale: 2 }).notNull(),
    usedAt: timestamp('used_at', { withTimezone: true, mode: 'string' }).defaultNow(),
  },
  table => [
    foreignKey({
      columns: [table.discountCodeId],
      foreignColumns: [discountCodes.id],
      name: 'discount_usage_discount_code_id_fkey',
    }).onDelete('cascade'),
    foreignKey({
      columns: [table.orderId],
      foreignColumns: [orders.id],
      name: 'discount_usage_order_id_fkey',
    }).onDelete('set null'),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
      name: 'discount_usage_user_id_fkey',
    }).onDelete('set null'),
  ]
);

export const contactSubmissions = pgTable(
  'contact_submissions',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    name: text().notNull(),
    email: text().notNull(),
    phone: text(),
    subject: text(),
    message: text().notNull(),
    status: text().default('new'),
    repliedAt: timestamp('replied_at', { withTimezone: true, mode: 'string' }),
    replyMessage: text('reply_message'),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    source: text().default('contact_form'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
  },
  table => [
    index('idx_contact_status').using('btree', table.status.asc().nullsLast().op('text_ops')),
    check(
      'contact_submissions_status_check',
      sql`status = ANY (ARRAY['new'::text, 'read'::text, 'replied'::text, 'spam'::text, 'archived'::text])`
    ),
  ]
);

export const banners = pgTable('banners', {
  id: uuid().defaultRandom().primaryKey().notNull(),
  title: text().notNull(),
  subtitle: text(),
  description: text(),
  image: text().notNull(),
  mobileImage: text('mobile_image'),
  videoUrl: text('video_url'),
  linkUrl: text('link_url'),
  linkText: text('link_text'),
  linkTarget: text('link_target').default('_self'),
  position: text().default('homepage_hero'),
  sortOrder: integer('sort_order').default(0),
  isActive: boolean('is_active').default(true),
  startDate: timestamp('start_date', { withTimezone: true, mode: 'string' }),
  endDate: timestamp('end_date', { withTimezone: true, mode: 'string' }),
  textColor: text('text_color').default('#ffffff'),
  overlayColor: text('overlay_color'),
  overlayOpacity: numeric('overlay_opacity', { precision: 3, scale: 2 }).default('0.3'),
  textPosition: text('text_position').default('center'),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow(),
});

export const siteSettings = pgTable(
  'site_settings',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    key: text().notNull(),
    value: jsonb().notNull(),
    type: text().default('string'),
    category: text().default('general'),
    label: text(),
    description: text(),
    isRequired: boolean('is_required').default(false),
    validationRules: jsonb('validation_rules').default({}),
    isPublic: boolean('is_public').default(false),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow(),
  },
  table => [
    index('idx_site_settings_key').using('btree', table.key.asc().nullsLast().op('text_ops')),
    unique('site_settings_key_key').on(table.key),
    check(
      'site_settings_type_check',
      sql`type = ANY (ARRAY['string'::text, 'number'::text, 'boolean'::text, 'json'::text, 'array'::text, 'html'::text])`
    ),
  ]
);

export const discountCodes = pgTable(
  'discount_codes',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    code: text().notNull(),
    description: text(),
    type: text().notNull(),
    value: numeric({ precision: 10, scale: 2 }).notNull(),
    maxDiscountAmount: numeric('max_discount_amount', { precision: 10, scale: 2 }),
    minimumOrderAmount: numeric('minimum_order_amount', { precision: 10, scale: 2 }).default('0'),
    minimumItems: integer('minimum_items').default(0),
    appliesTo: text('applies_to').default('all'),
    applicableProductIds: uuid('applicable_product_ids').array().default(['']),
    applicableCategoryIds: uuid('applicable_category_ids').array().default(['']),
    excludedProductIds: uuid('excluded_product_ids').array().default(['']),
    customerType: text('customer_type').default('all'),
    allowedCustomerIds: uuid('allowed_customer_ids').array().default(['']),
    allowedEmails: text('allowed_emails').array().default(['']),
    usageLimit: integer('usage_limit'),
    usageLimitPerCustomer: integer('usage_limit_per_customer').default(1),
    timesUsed: integer('times_used').default(0),
    isActive: boolean('is_active').default(true),
    startsAt: timestamp('starts_at', { withTimezone: true, mode: 'string' }).defaultNow(),
    expiresAt: timestamp('expires_at', { withTimezone: true, mode: 'string' }),
    freeShipping: boolean('free_shipping').default(false),
    autoApply: boolean('auto_apply').default(false),
    autoApplyPriority: integer('auto_apply_priority').default(0),
    metadata: jsonb().default({}),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow(),
  },
  table => [
    index('idx_discount_codes_code').using('btree', table.code.asc().nullsLast().op('text_ops')),
    unique('discount_codes_code_key').on(table.code),
    check(
      'discount_codes_type_check',
      sql`type = ANY (ARRAY['percentage'::text, 'fixed'::text, 'free_shipping'::text])`
    ),
    check(
      'discount_codes_applies_to_check',
      sql`applies_to = ANY (ARRAY['all'::text, 'specific_products'::text, 'specific_categories'::text, 'specific_collections'::text])`
    ),
    check(
      'discount_codes_customer_type_check',
      sql`customer_type = ANY (ARRAY['all'::text, 'new'::text, 'returning'::text, 'specific'::text])`
    ),
  ]
);

export const shippingZones = pgTable('shipping_zones', {
  id: uuid().defaultRandom().primaryKey().notNull(),
  name: text().notNull(),
  countries: text().array().default(['']),
  provinces: text().array().default(['']),
  postalCodes: text('postal_codes').array().default(['']),
  isDefault: boolean('is_default').default(false),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow(),
});

export const shippingMethods = pgTable(
  'shipping_methods',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    zoneId: uuid('zone_id'),
    name: text().notNull(),
    description: text(),
    type: text().notNull(),
    baseCost: numeric('base_cost', { precision: 10, scale: 2 }).default('0'),
    costPerKg: numeric('cost_per_kg', { precision: 10, scale: 2 }),
    minWeight: numeric('min_weight', { precision: 10, scale: 3 }),
    maxWeight: numeric('max_weight', { precision: 10, scale: 3 }),
    freeShippingThreshold: numeric('free_shipping_threshold', { precision: 10, scale: 2 }),
    minDeliveryDays: integer('min_delivery_days'),
    maxDeliveryDays: integer('max_delivery_days'),
    isActive: boolean('is_active').default(true),
    sortOrder: integer('sort_order').default(0),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow(),
  },
  table => [
    foreignKey({
      columns: [table.zoneId],
      foreignColumns: [shippingZones.id],
      name: 'shipping_methods_zone_id_fkey',
    }).onDelete('cascade'),
    check(
      'shipping_methods_type_check',
      sql`type = ANY (ARRAY['flat_rate'::text, 'free'::text, 'weight_based'::text, 'price_based'::text, 'item_based'::text, 'calculated'::text])`
    ),
  ]
);

export const taxRates = pgTable(
  'tax_rates',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    name: text().notNull(),
    rate: numeric({ precision: 5, scale: 4 }).notNull(),
    country: text().default('CA'),
    province: text(),
    type: text().default('standard'),
    taxClass: text('tax_class').default('default'),
    isCompound: boolean('is_compound').default(false),
    priority: integer().default(0),
    isActive: boolean('is_active').default(true),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow(),
  },
  table => [
    check(
      'tax_rates_type_check',
      sql`type = ANY (ARRAY['standard'::text, 'reduced'::text, 'zero'::text, 'exempt'::text])`
    ),
  ]
);

export const inventoryLogs = pgTable(
  'inventory_logs',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    productId: uuid('product_id').notNull(),
    quantityChange: integer('quantity_change').notNull(),
    previousQuantity: integer('previous_quantity').notNull(),
    newQuantity: integer('new_quantity').notNull(),
    reason: text().notNull(),
    notes: text(),
    orderId: uuid('order_id'),
    userId: uuid('user_id'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
  },
  table => [
    index('idx_inventory_logs_product').using(
      'btree',
      table.productId.asc().nullsLast().op('uuid_ops')
    ),
    foreignKey({
      columns: [table.productId],
      foreignColumns: [products.id],
      name: 'inventory_logs_product_id_fkey',
    }).onDelete('cascade'),
    foreignKey({
      columns: [table.orderId],
      foreignColumns: [orders.id],
      name: 'inventory_logs_order_id_fkey',
    }).onDelete('set null'),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
      name: 'inventory_logs_user_id_fkey',
    }).onDelete('set null'),
    check(
      'inventory_logs_reason_check',
      sql`reason = ANY (ARRAY['sale'::text, 'return'::text, 'adjustment'::text, 'restock'::text, 'damaged'::text, 'theft'::text, 'count'::text, 'import'::text])`
    ),
  ]
);

export const stats = pgTable('stats', {
  id: uuid().defaultRandom().primaryKey().notNull(),
  title: text().notNull(),
  value: text().notNull(),
  description: text(),
  icon: text(),
  dataSource: text('data_source').default('manual'),
  isRealTime: boolean('is_real_time').default(false),
  sortOrder: integer('sort_order').default(0),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow(),
});

export const siteContent = pgTable(
  'site_content',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    section: text().notNull(),
    key: text().notNull(),
    value: text().notNull(),
    contentType: text('content_type').default('text'),
    metadata: jsonb().default({}),
    isActive: boolean('is_active').default(true),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow(),
  },
  table => [
    index('idx_site_content_section').using(
      'btree',
      table.section.asc().nullsLast().op('text_ops')
    ),
    unique('site_content_section_key_unique').on(table.section, table.key),
  ]
);

export const featuredProducts = pgTable(
  'featured_products',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    name: text().notNull(),
    type: text().notNull(),
    description: text(),
    imageUrl: text('image_url').notNull(),
    cardColor: text('card_color'),
    price: numeric({ precision: 10, scale: 2 }),
    originalPrice: numeric('original_price', { precision: 10, scale: 2 }),
    productId: uuid('product_id'),
    sortOrder: integer('sort_order').default(0),
    isActive: boolean('is_active').default(true),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow(),
  },
  table => [
    foreignKey({
      columns: [table.productId],
      foreignColumns: [products.id],
      name: 'featured_products_product_id_fkey',
    }).onDelete('set null'),
  ]
);

export const reviewVotes = pgTable(
  'review_votes',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    reviewId: uuid('review_id').notNull(),
    userId: uuid('user_id'),
    ipAddress: text('ip_address'),
    isHelpful: boolean('is_helpful').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
  },
  table => [
    index('idx_review_votes_review').using('btree', table.reviewId.asc().nullsLast().op('uuid_ops')),
    foreignKey({
      columns: [table.reviewId],
      foreignColumns: [reviews.id],
      name: 'review_votes_review_id_fkey',
    }).onDelete('cascade'),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
      name: 'review_votes_user_id_fkey',
    }).onDelete('set null'),
  ]
);

export const abandonedCartEmails = pgTable(
  'abandoned_cart_emails',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    cartId: uuid('cart_id').notNull(),
    email: text().notNull(),
    emailType: text('email_type').notNull(),
    sentAt: timestamp('sent_at', { withTimezone: true, mode: 'string' }).defaultNow(),
    openedAt: timestamp('opened_at', { withTimezone: true, mode: 'string' }),
    clickedAt: timestamp('clicked_at', { withTimezone: true, mode: 'string' }),
    convertedAt: timestamp('converted_at', { withTimezone: true, mode: 'string' }),
  },
  table => [
    index('idx_abandoned_emails_cart').using('btree', table.cartId.asc().nullsLast().op('uuid_ops')),
    foreignKey({
      columns: [table.cartId],
      foreignColumns: [carts.id],
      name: 'abandoned_cart_emails_cart_id_fkey',
    }).onDelete('cascade'),
    check(
      'abandoned_cart_emails_type_check',
      sql`email_type = ANY (ARRAY['reminder_1'::text, 'reminder_2'::text, 'final'::text])`
    ),
  ]
);

// ============================================================================
// REFERRAL SYSTEM
// ============================================================================

export const referrals = pgTable(
  'referrals',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    // Referrer (the person sharing the code)
    referrerId: uuid('referrer_id'),
    referrerEmail: text('referrer_email').notNull(),
    referrerName: text('referrer_name'),
    // Unique referral code
    code: text().notNull(),
    // Reward settings for the referrer
    referrerRewardType: text('referrer_reward_type').default('percentage'), // percentage, fixed, credit
    referrerRewardValue: numeric('referrer_reward_value', { precision: 10, scale: 2 }).default('10'),
    referrerRewardCap: numeric('referrer_reward_cap', { precision: 10, scale: 2 }), // max reward amount
    // Discount for the referred person
    referredDiscountType: text('referred_discount_type').default('percentage'), // percentage, fixed
    referredDiscountValue: numeric('referred_discount_value', { precision: 10, scale: 2 }).default('10'),
    referredDiscountCap: numeric('referred_discount_cap', { precision: 10, scale: 2 }),
    // Usage tracking
    timesUsed: integer('times_used').default(0),
    totalRewardsEarned: numeric('total_rewards_earned', { precision: 10, scale: 2 }).default('0'),
    // Status
    isActive: boolean('is_active').default(true),
    expiresAt: timestamp('expires_at', { withTimezone: true, mode: 'string' }),
    // Metadata
    metadata: jsonb().default({}),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow(),
  },
  table => [
    index('idx_referrals_code').using('btree', table.code.asc().nullsLast().op('text_ops')),
    index('idx_referrals_referrer').using('btree', table.referrerId.asc().nullsLast().op('uuid_ops')),
    index('idx_referrals_email').using('btree', table.referrerEmail.asc().nullsLast().op('text_ops')),
    unique('referrals_code_key').on(table.code),
    foreignKey({
      columns: [table.referrerId],
      foreignColumns: [users.id],
      name: 'referrals_referrer_id_fkey',
    }).onDelete('set null'),
    check(
      'referrals_referrer_reward_type_check',
      sql`referrer_reward_type = ANY (ARRAY['percentage'::text, 'fixed'::text, 'credit'::text])`
    ),
    check(
      'referrals_referred_discount_type_check',
      sql`referred_discount_type = ANY (ARRAY['percentage'::text, 'fixed'::text])`
    ),
  ]
);

export const referralConversions = pgTable(
  'referral_conversions',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    referralId: uuid('referral_id').notNull(),
    // Referred person info
    referredUserId: uuid('referred_user_id'),
    referredEmail: text('referred_email').notNull(),
    referredName: text('referred_name'),
    // Order info
    orderId: uuid('order_id'),
    orderTotal: numeric('order_total', { precision: 10, scale: 2 }).notNull(),
    // Discount applied to the referred person
    discountApplied: numeric('discount_applied', { precision: 10, scale: 2 }).notNull(),
    // Reward earned by referrer
    referrerReward: numeric('referrer_reward', { precision: 10, scale: 2 }).notNull(),
    referrerRewardStatus: text('referrer_reward_status').default('pending'), // pending, credited, paid
    // Status
    status: text().default('completed'), // pending, completed, refunded
    // Metadata
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    metadata: jsonb().default({}),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
  },
  table => [
    index('idx_referral_conversions_referral').using('btree', table.referralId.asc().nullsLast().op('uuid_ops')),
    index('idx_referral_conversions_email').using('btree', table.referredEmail.asc().nullsLast().op('text_ops')),
    foreignKey({
      columns: [table.referralId],
      foreignColumns: [referrals.id],
      name: 'referral_conversions_referral_id_fkey',
    }).onDelete('cascade'),
    foreignKey({
      columns: [table.referredUserId],
      foreignColumns: [users.id],
      name: 'referral_conversions_referred_user_id_fkey',
    }).onDelete('set null'),
    foreignKey({
      columns: [table.orderId],
      foreignColumns: [orders.id],
      name: 'referral_conversions_order_id_fkey',
    }).onDelete('set null'),
    check(
      'referral_conversions_status_check',
      sql`status = ANY (ARRAY['pending'::text, 'completed'::text, 'refunded'::text])`
    ),
    check(
      'referral_reward_status_check',
      sql`referrer_reward_status = ANY (ARRAY['pending'::text, 'credited'::text, 'paid'::text])`
    ),
  ]
);

// Store credit / loyalty points for referrer rewards
export const storeCredits = pgTable(
  'store_credits',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    userId: uuid('user_id'),
    email: text().notNull(),
    // Balance tracking
    balance: numeric({ precision: 10, scale: 2 }).default('0').notNull(),
    totalEarned: numeric('total_earned', { precision: 10, scale: 2 }).default('0').notNull(),
    totalUsed: numeric('total_used', { precision: 10, scale: 2 }).default('0').notNull(),
    // Status
    isActive: boolean('is_active').default(true),
    // Timestamps
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow(),
  },
  table => [
    index('idx_store_credits_user').using('btree', table.userId.asc().nullsLast().op('uuid_ops')),
    index('idx_store_credits_email').using('btree', table.email.asc().nullsLast().op('text_ops')),
    unique('store_credits_email_key').on(table.email),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
      name: 'store_credits_user_id_fkey',
    }).onDelete('set null'),
  ]
);

export const storeCreditTransactions = pgTable(
  'store_credit_transactions',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    storeCreditId: uuid('store_credit_id').notNull(),
    // Transaction info
    type: text().notNull(), // earn, redeem, expire, adjust
    amount: numeric({ precision: 10, scale: 2 }).notNull(),
    balanceAfter: numeric('balance_after', { precision: 10, scale: 2 }).notNull(),
    // Source
    source: text().notNull(), // referral, order_refund, admin_adjustment, loyalty_reward
    sourceId: uuid('source_id'), // referral_conversion_id, order_id, etc.
    description: text(),
    // Related order (if redeeming)
    orderId: uuid('order_id'),
    // Metadata
    metadata: jsonb().default({}),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
  },
  table => [
    index('idx_credit_transactions_credit').using('btree', table.storeCreditId.asc().nullsLast().op('uuid_ops')),
    foreignKey({
      columns: [table.storeCreditId],
      foreignColumns: [storeCredits.id],
      name: 'credit_transactions_store_credit_id_fkey',
    }).onDelete('cascade'),
    foreignKey({
      columns: [table.orderId],
      foreignColumns: [orders.id],
      name: 'credit_transactions_order_id_fkey',
    }).onDelete('set null'),
    check(
      'credit_transactions_type_check',
      sql`type = ANY (ARRAY['earn'::text, 'redeem'::text, 'expire'::text, 'adjust'::text])`
    ),
    check(
      'credit_transactions_source_check',
      sql`source = ANY (ARRAY['referral'::text, 'order_refund'::text, 'admin_adjustment'::text, 'loyalty_reward'::text, 'purchase'::text])`
    ),
  ]
);

// ============================================================================
// REFUND REQUESTS
// ============================================================================

export const refundRequests = pgTable(
  'refund_requests',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    // Order info
    orderId: uuid('order_id').notNull(),
    orderNumber: text('order_number').notNull(),
    // Customer info
    userId: uuid('user_id'),
    customerEmail: text('customer_email').notNull(),
    customerName: text('customer_name'),
    // Request details
    reason: text().notNull(), // damaged, wrong_item, not_as_described, changed_mind, other
    reasonDetails: text('reason_details'),
    requestedAmount: numeric('requested_amount', { precision: 10, scale: 2 }).notNull(),
    // Items to refund (if partial refund)
    items: jsonb().default([]), // [{productId, name, quantity, amount}]
    // Status workflow
    status: text().default('pending'), // pending, under_review, approved, denied, refunded, cancelled
    // Admin handling
    reviewedBy: uuid('reviewed_by'),
    reviewedAt: timestamp('reviewed_at', { withTimezone: true, mode: 'string' }),
    adminNotes: text('admin_notes'),
    denialReason: text('denial_reason'),
    // Refund processing
    approvedAmount: numeric('approved_amount', { precision: 10, scale: 2 }),
    refundMethod: text('refund_method'), // original_payment, store_credit
    refundedAt: timestamp('refunded_at', { withTimezone: true, mode: 'string' }),
    providerRefundId: text('provider_refund_id'), // Stripe/PayPal refund ID
    // Evidence/attachments
    attachments: text().array().default(['']), // URLs to uploaded images
    // Metadata
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    metadata: jsonb().default({}),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow(),
  },
  table => [
    index('idx_refund_requests_order').using('btree', table.orderId.asc().nullsLast().op('uuid_ops')),
    index('idx_refund_requests_status').using('btree', table.status.asc().nullsLast().op('text_ops')),
    index('idx_refund_requests_email').using('btree', table.customerEmail.asc().nullsLast().op('text_ops')),
    index('idx_refund_requests_created').using('btree', table.createdAt.desc().nullsFirst().op('timestamptz_ops')),
    foreignKey({
      columns: [table.orderId],
      foreignColumns: [orders.id],
      name: 'refund_requests_order_id_fkey',
    }).onDelete('cascade'),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
      name: 'refund_requests_user_id_fkey',
    }).onDelete('set null'),
    foreignKey({
      columns: [table.reviewedBy],
      foreignColumns: [users.id],
      name: 'refund_requests_reviewed_by_fkey',
    }).onDelete('set null'),
    check(
      'refund_requests_reason_check',
      sql`reason = ANY (ARRAY['damaged'::text, 'wrong_item'::text, 'not_as_described'::text, 'changed_mind'::text, 'never_arrived'::text, 'other'::text])`
    ),
    check(
      'refund_requests_status_check',
      sql`status = ANY (ARRAY['pending'::text, 'under_review'::text, 'approved'::text, 'denied'::text, 'refunded'::text, 'cancelled'::text])`
    ),
    check(
      'refund_requests_method_check',
      sql`(refund_method IS NULL) OR (refund_method = ANY (ARRAY['original_payment'::text, 'store_credit'::text]))`
    ),
  ]
);

// ============================================================================
// LOYALTY SYSTEM
// ============================================================================

export const loyaltyTiers = pgTable(
  'loyalty_tiers',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    name: text().notNull(), // Bronze, Silver, Gold, Platinum
    slug: text().notNull(), // bronze, silver, gold, platinum
    // Qualification
    minSpend: numeric('min_spend', { precision: 10, scale: 2 }).default('0').notNull(), // Min lifetime spend to qualify
    minOrders: integer('min_orders').default(0), // Min orders to qualify (optional)
    // Benefits
    discountPercent: numeric('discount_percent', { precision: 5, scale: 2 }).default('0'), // % off all orders
    freeShipping: boolean('free_shipping').default(false),
    freeShippingThreshold: numeric('free_shipping_threshold', { precision: 10, scale: 2 }), // Free shipping above this amount
    prioritySupport: boolean('priority_support').default(false),
    earlyAccess: boolean('early_access').default(false), // Early access to new products/sales
    birthdayBonus: numeric('birthday_bonus', { precision: 10, scale: 2 }), // Birthday store credit
    // Display
    color: text().default('#808080'), // Tier badge color
    icon: text(), // Icon name or URL
    description: text(),
    benefits: text().array(), // List of benefit descriptions for display
    // Status
    sortOrder: integer('sort_order').default(0),
    isActive: boolean('is_active').default(true),
    isDefault: boolean('is_default').default(false), // Default tier for new customers
    // Timestamps
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow(),
  },
  table => [
    index('idx_loyalty_tiers_slug').using('btree', table.slug.asc().nullsLast().op('text_ops')),
    index('idx_loyalty_tiers_min_spend').using('btree', table.minSpend.asc().nullsLast().op('numeric_ops')),
    unique('loyalty_tiers_slug_key').on(table.slug),
    check('loyalty_tiers_discount_check', sql`discount_percent >= (0)::numeric AND discount_percent <= (100)::numeric`),
    check('loyalty_tiers_min_spend_check', sql`min_spend >= (0)::numeric`),
  ]
);

export const customerLoyalty = pgTable(
  'customer_loyalty',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    // Customer
    userId: uuid('user_id'),
    email: text().notNull(),
    // Current tier
    tierId: uuid('tier_id'),
    tierName: text('tier_name'), // Denormalized for quick access
    // Spend tracking
    lifetimeSpend: numeric('lifetime_spend', { precision: 12, scale: 2 }).default('0').notNull(),
    yearToDateSpend: numeric('year_to_date_spend', { precision: 12, scale: 2 }).default('0').notNull(),
    totalOrders: integer('total_orders').default(0).notNull(),
    // Points (optional points system)
    pointsBalance: integer('points_balance').default(0),
    pointsEarned: integer('points_earned').default(0),
    pointsRedeemed: integer('points_redeemed').default(0),
    // Status
    isActive: boolean('is_active').default(true),
    // Tier change tracking
    lastTierChange: timestamp('last_tier_change', { withTimezone: true, mode: 'string' }),
    nextTierProgress: numeric('next_tier_progress', { precision: 5, scale: 2 }), // % progress to next tier
    // Timestamps
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow(),
  },
  table => [
    index('idx_customer_loyalty_user').using('btree', table.userId.asc().nullsLast().op('uuid_ops')),
    index('idx_customer_loyalty_email').using('btree', table.email.asc().nullsLast().op('text_ops')),
    index('idx_customer_loyalty_tier').using('btree', table.tierId.asc().nullsLast().op('uuid_ops')),
    index('idx_customer_loyalty_spend').using('btree', table.lifetimeSpend.desc().nullsFirst().op('numeric_ops')),
    unique('customer_loyalty_email_key').on(table.email),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
      name: 'customer_loyalty_user_id_fkey',
    }).onDelete('set null'),
    foreignKey({
      columns: [table.tierId],
      foreignColumns: [loyaltyTiers.id],
      name: 'customer_loyalty_tier_id_fkey',
    }).onDelete('set null'),
  ]
);

export const loyaltyTierHistory = pgTable(
  'loyalty_tier_history',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    customerLoyaltyId: uuid('customer_loyalty_id').notNull(),
    // Tier change
    previousTierId: uuid('previous_tier_id'),
    previousTierName: text('previous_tier_name'),
    newTierId: uuid('new_tier_id'),
    newTierName: text('new_tier_name'),
    // Reason
    reason: text().notNull(), // upgrade, downgrade, manual_adjustment, new_customer
    notes: text(),
    // Spend at time of change
    lifetimeSpendAtChange: numeric('lifetime_spend_at_change', { precision: 12, scale: 2 }),
    // Triggered by
    triggeredBy: text('triggered_by').default('system'), // system, admin
    adminUserId: uuid('admin_user_id'),
    // Timestamp
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
  },
  table => [
    index('idx_tier_history_customer').using('btree', table.customerLoyaltyId.asc().nullsLast().op('uuid_ops')),
    index('idx_tier_history_created').using('btree', table.createdAt.desc().nullsFirst().op('timestamptz_ops')),
    foreignKey({
      columns: [table.customerLoyaltyId],
      foreignColumns: [customerLoyalty.id],
      name: 'tier_history_customer_loyalty_id_fkey',
    }).onDelete('cascade'),
    foreignKey({
      columns: [table.previousTierId],
      foreignColumns: [loyaltyTiers.id],
      name: 'tier_history_previous_tier_id_fkey',
    }).onDelete('set null'),
    foreignKey({
      columns: [table.newTierId],
      foreignColumns: [loyaltyTiers.id],
      name: 'tier_history_new_tier_id_fkey',
    }).onDelete('set null'),
    check(
      'tier_history_reason_check',
      sql`reason = ANY (ARRAY['upgrade'::text, 'downgrade'::text, 'manual_adjustment'::text, 'new_customer'::text, 'annual_reset'::text])`
    ),
  ]
);

// Targeted discount campaigns (admin creates campaigns for segments)
export const loyaltyCampaigns = pgTable(
  'loyalty_campaigns',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    name: text().notNull(),
    description: text(),
    // Targeting
    targetType: text('target_type').notNull(), // all, tier, segment, specific_customers
    targetTierIds: uuid('target_tier_ids').array(), // If targeting specific tiers
    targetEmails: text('target_emails').array(), // If targeting specific customers
    // Segment rules (JSON for flexible rules)
    segmentRules: jsonb('segment_rules').default({}), // e.g., {minDaysSinceOrder: 60, maxDaysSinceOrder: 180}
    // Discount
    discountType: text('discount_type').notNull(), // percentage, fixed, free_shipping
    discountValue: numeric('discount_value', { precision: 10, scale: 2 }).notNull(),
    discountCode: text('discount_code'), // Auto-generated or custom code
    // Validity
    startsAt: timestamp('starts_at', { withTimezone: true, mode: 'string' }).notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true, mode: 'string' }),
    usageLimit: integer('usage_limit'), // Total uses across all customers
    usageLimitPerCustomer: integer('usage_limit_per_customer').default(1),
    // Tracking
    timesUsed: integer('times_used').default(0),
    emailsSent: integer('emails_sent').default(0),
    // Status
    status: text().default('draft'), // draft, scheduled, active, paused, completed, cancelled
    isActive: boolean('is_active').default(true),
    // Timestamps
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow(),
  },
  table => [
    index('idx_campaigns_status').using('btree', table.status.asc().nullsLast().op('text_ops')),
    index('idx_campaigns_starts').using('btree', table.startsAt.asc().nullsLast().op('timestamptz_ops')),
    check(
      'campaigns_target_type_check',
      sql`target_type = ANY (ARRAY['all'::text, 'tier'::text, 'segment'::text, 'specific_customers'::text])`
    ),
    check(
      'campaigns_discount_type_check',
      sql`discount_type = ANY (ARRAY['percentage'::text, 'fixed'::text, 'free_shipping'::text])`
    ),
    check(
      'campaigns_status_check',
      sql`status = ANY (ARRAY['draft'::text, 'scheduled'::text, 'active'::text, 'paused'::text, 'completed'::text, 'cancelled'::text])`
    ),
  ]
);

// ============================================================================
// ADMIN AUTHENTICATION
// ============================================================================

export const adminSessions = pgTable(
  'admin_sessions',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    adminEmail: text('admin_email').notNull(),
    adminName: text('admin_name'),
    googleId: text('google_id'),
    tokenHash: text('token_hash').notNull(),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
    lastActiveAt: timestamp('last_active_at', { withTimezone: true, mode: 'string' }).defaultNow(),
    expiresAt: timestamp('expires_at', { withTimezone: true, mode: 'string' }).notNull(),
  },
  table => [
    index('idx_admin_sessions_email').using('btree', table.adminEmail.asc().nullsLast().op('text_ops')),
    index('idx_admin_sessions_token').using('btree', table.tokenHash.asc().nullsLast().op('text_ops')),
    index('idx_admin_sessions_expires').using('btree', table.expiresAt.asc().nullsLast().op('timestamptz_ops')),
  ]
);

export const adminAuditLog = pgTable(
  'admin_audit_log',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    adminEmail: text('admin_email').notNull(),
    action: text().notNull(),
    resourceType: text('resource_type'),
    resourceId: text('resource_id'),
    details: jsonb().default({}),
    previousValues: jsonb('previous_values'),
    newValues: jsonb('new_values'),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
  },
  table => [
    index('idx_audit_log_email').using('btree', table.adminEmail.asc().nullsLast().op('text_ops')),
    index('idx_audit_log_action').using('btree', table.action.asc().nullsLast().op('text_ops')),
    index('idx_audit_log_resource').using('btree', table.resourceType.asc().nullsLast().op('text_ops'), table.resourceId.asc().nullsLast().op('text_ops')),
    index('idx_audit_log_created').using('btree', table.createdAt.desc().nullsFirst().op('timestamptz_ops')),
    check(
      'audit_log_action_check',
      sql`action = ANY (ARRAY['login'::text, 'logout'::text, 'create'::text, 'update'::text, 'delete'::text, 'export'::text, 'import'::text, 'view'::text, 'bulk_action'::text])`
    ),
  ]
);

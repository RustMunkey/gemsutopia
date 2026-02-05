import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { eq } from 'drizzle-orm';
import { pgTable, uuid, text, integer } from 'drizzle-orm/pg-core';

const sql = neon(process.env.DATABASE_URL);
const db = drizzle(sql);

// Define minimal schema needed
const categories = pgTable('categories', {
  id: uuid('id').primaryKey(),
  slug: text('slug'),
});

const products = pgTable('products', {
  id: uuid('id').primaryKey(),
  name: text('name'),
  categoryId: uuid('category_id'),
  inventory: integer('inventory'),
});

async function setDiamondsSoldOut() {
  // Find diamonds category
  const diamondCats = await db.select().from(categories).where(eq(categories.slug, 'diamonds'));
  
  if (diamondCats.length === 0) {
    console.log('Diamonds category not found');
    return;
  }
  
  const diamondCategory = diamondCats[0];
  console.log('Found diamonds category:', diamondCategory.id);
  
  // Set all diamond products to 0 inventory
  const result = await db
    .update(products)
    .set({ inventory: 0 })
    .where(eq(products.categoryId, diamondCategory.id))
    .returning({ id: products.id, name: products.name });
  
  console.log('Updated', result.length, 'products to 0 inventory');
  result.forEach(p => console.log(' -', p.name));
}

setDiamondsSoldOut().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });

// Migration script to add video_url column to products table
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const FALLBACK_SUPABASE_URL = 'https://odqcbgwakcysfluoinmn.supabase.co';
const FALLBACK_SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9kcWNiZ3dha2N5c2ZsdW9pbm1uIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDYxNzE3MiwiZXhwIjoyMDcwMTkzMTcyfQ.CxABycRE9h852apONV3SRWUXXr2n5jKfeVWxwcXWq24';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || FALLBACK_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || FALLBACK_SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function migrateVideoColumn() {
  console.log('Starting migration to add video_url column to products table...');
  
  try {
    // First check if the products table exists
    const { data: tables, error: tableError } = await supabase.rpc('check_table_exists', { table_name: 'products' });
    
    if (tableError) {
      console.log('Unable to check table existence, proceeding anyway...');
    }
    
    // Add video_url column if it doesn't exist
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'products' 
            AND column_name = 'video_url'
          ) THEN
            ALTER TABLE products ADD COLUMN video_url TEXT;
            RAISE NOTICE 'Added video_url column to products table';
          ELSE
            RAISE NOTICE 'video_url column already exists in products table';
          END IF;
        END $$;
      `
    });
    
    if (error) {
      console.error('Error adding video_url column:', error);
      
      // Try alternative method using direct SQL
      console.log('Trying alternative approach...');
      const { error: altError } = await supabase.from('products').select('video_url').limit(1);
      
      if (altError && altError.message.includes('column "video_url" does not exist')) {
        console.log('video_url column does not exist. Please add it manually in the Supabase dashboard:');
        console.log('1. Go to your Supabase dashboard');
        console.log('2. Navigate to Table Editor -> products');
        console.log('3. Click "Add Column"');
        console.log('4. Name: video_url, Type: text, Nullable: true');
        console.log('5. Click Save');
        return;
      }
    } else {
      console.log('Migration completed successfully!');
      console.log('video_url column is now available in the products table');
    }
    
    // Migrate existing video URLs from metadata to the new column
    console.log('Migrating existing video URLs from metadata...');
    
    const { data: products, error: selectError } = await supabase
      .from('products')
      .select('id, video_url, metadata')
      .is('video_url', null);
    
    if (selectError) {
      console.error('Error fetching products:', selectError);
      return;
    }
    
    let migratedCount = 0;
    
    for (const product of products || []) {
      if (product.metadata && product.metadata.video_url) {
        const { error: updateError } = await supabase
          .from('products')
          .update({ video_url: product.metadata.video_url })
          .eq('id', product.id);
        
        if (updateError) {
          console.error(`Error updating product ${product.id}:`, updateError);
        } else {
          migratedCount++;
          console.log(`Migrated video URL for product ${product.id}`);
        }
      }
    }
    
    console.log(`Migration complete! Migrated ${migratedCount} video URLs from metadata to video_url column.`);
    
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

// Run the migration
migrateVideoColumn();
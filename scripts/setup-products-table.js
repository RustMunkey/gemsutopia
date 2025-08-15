const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupProductsTable() {
  try {
    console.log('Setting up products table...');
    
    // Read the SQL migration file
    const sqlPath = path.join(__dirname, '../supabase_migrations/create_products_table.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Execute the SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (error) {
      console.error('Error executing SQL:', error);
      return;
    }
    
    console.log('Products table setup completed successfully!');
    
    // Test by fetching products
    const { data: products, error: fetchError } = await supabase
      .from('products')
      .select('*')
      .limit(5);
    
    if (fetchError) {
      console.error('Error fetching products:', fetchError);
    } else {
      console.log(`Found ${products.length} sample products in database`);
      products.forEach(product => {
        console.log(`- ${product.name} ($${product.price})`);
      });
    }
    
  } catch (error) {
    console.error('Setup failed:', error);
  }
}

setupProductsTable();
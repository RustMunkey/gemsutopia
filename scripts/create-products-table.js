const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createProductsTable() {
  try {
    console.log('Creating products table and sample data...');
    
    // Insert sample products directly
    const sampleProducts = [
      {
        name: 'Alberta Sapphire',
        description: 'Hand-mined sapphire from Alberta, Canada. Premium quality gemstone with exceptional clarity and natural beauty.',
        price: 299.00,
        sale_price: 199.00,
        on_sale: true,
        category: 'sapphire',
        images: ['/images/Review1.jpg'],
        tags: ['sapphire', 'blue', 'alberta', 'canadian'],
        inventory: 5,
        featured: true,
        is_active: true,
        sku: 'SAP-ALB-001',
        weight: 2.5,
        metadata: {
          origin: 'Alberta, Canada',
          gem_type: 'sapphire',
          cut: 'oval',
          carat: 2.5,
          clarity: 'VVS1',
          color: 'blue'
        }
      },
      {
        name: 'Canadian Peridot',
        description: 'Hand-mined peridot from Alberta, Canada. Premium quality gemstone with exceptional clarity and natural beauty.',
        price: 199.00,
        sale_price: null,
        on_sale: false,
        category: 'peridot',
        images: ['/images/Review2.jpg'],
        tags: ['peridot', 'green', 'alberta', 'canadian'],
        inventory: 8,
        featured: true,
        is_active: true,
        sku: 'PER-CAN-001',
        weight: 1.8,
        metadata: {
          origin: 'Alberta, Canada',
          gem_type: 'peridot',
          cut: 'round',
          carat: 1.8,
          clarity: 'VS1',
          color: 'green'
        }
      },
      {
        name: 'Ammolite Gem',
        description: 'Hand-mined ammolite from Alberta, Canada. Premium quality gemstone with exceptional clarity and natural beauty.',
        price: 459.00,
        sale_price: 399.00,
        on_sale: true,
        category: 'ammolite',
        images: ['/images/Review3.jpg'],
        tags: ['ammolite', 'rainbow', 'alberta', 'canadian', 'rare'],
        inventory: 3,
        featured: true,
        is_active: true,
        sku: 'AMM-GEM-001',
        weight: 3.2,
        metadata: {
          origin: 'Alberta, Canada',
          gem_type: 'ammolite',
          cut: 'cabochon',
          carat: 3.2,
          clarity: 'AAA',
          color: 'rainbow'
        }
      }
    ];
    
    // Check if products table exists and has data
    const { data: existingProducts, error: fetchError } = await supabase
      .from('products')
      .select('id')
      .limit(1);
    
    if (fetchError) {
      console.log('Products table might not exist yet. That\'s expected for initial setup.');
      console.log('Please create the products table manually in Supabase SQL Editor using the migration file.');
      console.log('Migration file location: /supabase_migrations/create_products_table.sql');
      return;
    }
    
    if (existingProducts && existingProducts.length > 0) {
      console.log('Products table already has data. Skipping sample data insertion.');
    } else {
      console.log('Inserting sample products...');
      
      const { data, error } = await supabase
        .from('products')
        .insert(sampleProducts)
        .select();
      
      if (error) {
        console.error('Error inserting sample products:', error);
        return;
      }
      
      console.log(`Successfully inserted ${data.length} sample products!`);
    }
    
    // Fetch and display current products
    const { data: products, error: displayError } = await supabase
      .from('products')
      .select('name, price, featured, is_active')
      .order('name');
    
    if (displayError) {
      console.error('Error fetching products:', displayError);
    } else {
      console.log('\nCurrent products in database:');
      products.forEach(product => {
        const status = [];
        if (product.featured) status.push('Featured');
        if (product.is_active) status.push('Active');
        console.log(`- ${product.name} ($${product.price}) [${status.join(', ')}]`);
      });
    }
    
  } catch (error) {
    console.error('Setup failed:', error);
  }
}

createProductsTable();
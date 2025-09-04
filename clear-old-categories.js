// One-time script to clear old category values from products table
// Run this in your database or through a temporary API endpoint

const { createClient } = require('@supabase/supabase-js');

// Create admin client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function clearOldCategories() {
  try {
    console.log('Clearing old category values from products...');
    
    // Update all products to set category to null
    const { data, error } = await supabase
      .from('products')
      .update({ category: null })
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Update all products
    
    if (error) {
      console.error('Error clearing categories:', error);
    } else {
      console.log('Successfully cleared old category values from all products');
      console.log('Updated records:', data?.length || 'all products');
    }
  } catch (error) {
    console.error('Script error:', error);
  }
}

// Run the script
clearOldCategories();
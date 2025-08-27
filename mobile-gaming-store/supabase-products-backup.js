// Supabase Products Backup and Sync System
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs').promises;
const path = require('path');

// Supabase configuration
const SUPABASE_URL = "https://kokntkhxkymllafuubun.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtva250a2h4a3ltbGxhZnV1YnVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3NzYxODcsImV4cCI6MjA2ODM1MjE4N30.Ekc6HLszFSYTIgsvzTdKJWr85nFMUH2HQBQrg_uqXRc";

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// File paths
const PRODUCTS_FILE = path.join(__dirname, 'data', 'products.json');
const BACKUP_FILE = path.join(__dirname, 'data', 'products-backup.json');

// Create products table in Supabase if it doesn't exist
async function createProductsTable() {
  try {
    console.log('🗄️ Checking if products table exists in Supabase...');
    
    // Try to query the table to see if it exists
    const { data, error } = await supabase
      .from('products')
      .select('count')
      .limit(1);
    
    if (error && error.code === '42P01') {
      // Table doesn't exist, create it
      console.log('📋 Creating products table in Supabase...');
      
      // Note: This would require admin privileges
      // For now, we'll just log that the table needs to be created
      console.log('⚠️ Products table does not exist. Please create it manually in Supabase dashboard:');
      console.log(`
        CREATE TABLE products (
          id BIGINT PRIMARY KEY,
          name TEXT NOT NULL,
          price DECIMAL(10,2) NOT NULL,
          original_price DECIMAL(10,2),
          discount INTEGER DEFAULT 0,
          category TEXT,
          description TEXT,
          stock INTEGER DEFAULT 0,
          rating DECIMAL(3,2),
          reviews INTEGER DEFAULT 0,
          image TEXT,
          images JSONB,
          link TEXT,
          features JSONB,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          is_new BOOLEAN DEFAULT false
        );
      `);
      
      return false;
    } else if (error) {
      console.error('❌ Error checking products table:', error);
      return false;
    } else {
      console.log('✅ Products table exists in Supabase');
      return true;
    }
  } catch (error) {
    console.error('❌ Error creating products table:', error);
    return false;
  }
}

// Backup products to Supabase
async function backupProductsToSupabase() {
  try {
    console.log('🔄 Backing up products to Supabase...');
    
    // Read local products
    const productsData = await fs.readFile(PRODUCTS_FILE, 'utf8');
    const products = JSON.parse(productsData);
    
    if (!products || products.length === 0) {
      console.log('⚠️ No products to backup');
      return false;
    }
    
    // Check if table exists
    const tableExists = await createProductsTable();
    if (!tableExists) {
      console.log('❌ Cannot backup - products table does not exist');
      return false;
    }
    
    // Prepare products for Supabase (convert to proper format)
    const supabaseProducts = products.map(product => ({
      id: product.id,
      name: product.name,
      price: product.price,
      original_price: product.originalPrice,
      discount: product.discount || 0,
      category: product.category,
      description: product.description,
      stock: product.stock || 0,
      rating: product.rating,
      reviews: product.reviews || 0,
      image: product.image,
      images: product.images,
      link: product.link,
      features: product.features,
      created_at: product.createdAt,
      updated_at: product.updatedAt || product.createdAt,
      is_new: product.isNew || false
    }));
    
    // Upsert products to Supabase (insert or update)
    const { data, error } = await supabase
      .from('products')
      .upsert(supabaseProducts, { 
        onConflict: 'id',
        ignoreDuplicates: false 
      });
    
    if (error) {
      console.error('❌ Error backing up to Supabase:', error);
      return false;
    }
    
    console.log(`✅ Successfully backed up ${supabaseProducts.length} products to Supabase`);
    return true;
    
  } catch (error) {
    console.error('❌ Error in backup process:', error);
    return false;
  }
}

// Sync new products from local to Supabase
async function syncNewProducts() {
  try {
    console.log('🔄 Syncing new products to Supabase...');
    
    // Read local products
    const productsData = await fs.readFile(PRODUCTS_FILE, 'utf8');
    const localProducts = JSON.parse(productsData);
    
    // Get products from Supabase
    const { data: supabaseProducts, error } = await supabase
      .from('products')
      .select('id, updated_at');
    
    if (error) {
      console.error('❌ Error fetching Supabase products:', error);
      return false;
    }
    
    // Find new or updated products
    const supabaseIds = new Set(supabaseProducts.map(p => p.id));
    const newProducts = localProducts.filter(product => !supabaseIds.has(product.id));
    
    if (newProducts.length === 0) {
      console.log('✅ No new products to sync');
      return true;
    }
    
    console.log(`📦 Found ${newProducts.length} new products to sync`);
    
    // Prepare new products for Supabase
    const supabaseNewProducts = newProducts.map(product => ({
      id: product.id,
      name: product.name,
      price: product.price,
      original_price: product.originalPrice,
      discount: product.discount || 0,
      category: product.category,
      description: product.description,
      stock: product.stock || 0,
      rating: product.rating,
      reviews: product.reviews || 0,
      image: product.image,
      images: product.images,
      link: product.link,
      features: product.features,
      created_at: product.createdAt,
      updated_at: product.updatedAt || product.createdAt,
      is_new: product.isNew || false
    }));
    
    // Insert new products
    const { data, error: insertError } = await supabase
      .from('products')
      .insert(supabaseNewProducts);
    
    if (insertError) {
      console.error('❌ Error inserting new products:', insertError);
      return false;
    }
    
    console.log(`✅ Successfully synced ${newProducts.length} new products to Supabase`);
    return true;
    
  } catch (error) {
    console.error('❌ Error in sync process:', error);
    return false;
  }
}

// Get fresh products from Supabase
async function getFreshProductsFromSupabase() {
  try {
    console.log('🆕 Getting fresh products from Supabase...');
    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .gte('created_at', thirtyDaysAgo.toISOString())
      .eq('is_new', true)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('❌ Error fetching fresh products:', error);
      return [];
    }
    
    console.log(`✅ Found ${data.length} fresh products in Supabase`);
    return data;
    
  } catch (error) {
    console.error('❌ Error getting fresh products:', error);
    return [];
  }
}

// Monitor for new products and auto-sync
async function startProductMonitoring() {
  console.log('👀 Starting product monitoring...');
  
  // Initial sync
  await syncNewProducts();
  
  // Set up periodic sync (every 5 minutes)
  setInterval(async () => {
    await syncNewProducts();
  }, 5 * 60 * 1000);
  
  console.log('✅ Product monitoring started (syncs every 5 minutes)');
}

// Main function
async function main() {
  const command = process.argv[2];
  
  switch (command) {
    case 'backup':
      await backupProductsToSupabase();
      break;
    case 'sync':
      await syncNewProducts();
      break;
    case 'fresh':
      const freshProducts = await getFreshProductsFromSupabase();
      console.log('Fresh products:', freshProducts);
      break;
    case 'monitor':
      await startProductMonitoring();
      break;
    case 'create-table':
      await createProductsTable();
      break;
    default:
      console.log(`
Usage: node supabase-products-backup.js [command]

Commands:
  backup    - Backup all products to Supabase
  sync      - Sync only new products to Supabase
  fresh     - Get fresh products from Supabase
  monitor   - Start monitoring for new products
  create-table - Create products table in Supabase
      `);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  backupProductsToSupabase,
  syncNewProducts,
  getFreshProductsFromSupabase,
  startProductMonitoring,
  createProductsTable
};

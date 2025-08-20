const fs = require('fs').promises;
const path = require('path');

const PRODUCTS_FILE = path.join(__dirname, 'data', 'products.json');
const BACKUP_FILE = path.join(__dirname, 'data', 'products-backup.json');
const CLOUD_BACKUP_FILE = path.join(__dirname, 'data', 'products-cloud-backup.json');

// Backup products to a cloud-safe location
async function backupProducts() {
  try {
    const productsData = await fs.readFile(PRODUCTS_FILE, 'utf8');
    const products = JSON.parse(productsData);
    
    // Create backup with timestamp
    const backup = {
      timestamp: new Date().toISOString(),
      products: products,
      count: products.length
    };
    
    await fs.writeFile(CLOUD_BACKUP_FILE, JSON.stringify(backup, null, 2));
    console.log(`✅ Products backed up: ${products.length} products`);
    return true;
  } catch (error) {
    console.error('❌ Backup failed:', error.message);
    return false;
  }
}

// Restore products from backup
async function restoreProducts() {
  try {
    const backupData = await fs.readFile(CLOUD_BACKUP_FILE, 'utf8');
    const backup = JSON.parse(backupData);
    
    await fs.writeFile(PRODUCTS_FILE, JSON.stringify(backup.products, null, 2));
    console.log(`✅ Products restored: ${backup.products.length} products from ${backup.timestamp}`);
    return true;
  } catch (error) {
    console.error('❌ Restore failed:', error.message);
    return false;
  }
}

// Check if products need restoration
async function checkAndRestore() {
  try {
    // Check if main products file exists and has content
    const productsData = await fs.readFile(PRODUCTS_FILE, 'utf8');
    const products = JSON.parse(productsData);
    
    if (products.length === 0) {
      console.log('⚠️ Products file is empty, attempting restore...');
      return await restoreProducts();
    }
    
    console.log(`✅ Products file has ${products.length} products`);
    return true;
  } catch (error) {
    console.log('⚠️ Products file not found or corrupted, attempting restore...');
    return await restoreProducts();
  }
}

// Auto-backup before any changes
async function autoBackup() {
  try {
    await backupProducts();
    return true;
  } catch (error) {
    console.error('Auto-backup failed:', error.message);
    return false;
  }
}

module.exports = {
  backupProducts,
  restoreProducts,
  checkAndRestore,
  autoBackup
};

// Run if called directly
if (require.main === module) {
  const command = process.argv[2];
  
  switch (command) {
    case 'backup':
      backupProducts();
      break;
    case 'restore':
      restoreProducts();
      break;
    case 'check':
      checkAndRestore();
      break;
    default:
      console.log('Usage: node backup-products.js [backup|restore|check]');
  }
}

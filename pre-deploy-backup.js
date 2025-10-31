#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');

const PRODUCTS_FILE = path.join(__dirname, 'data', 'products.json');
const BACKUP_FILE = path.join(__dirname, 'data', 'products-backup.json');

async function backupBeforeDeploy() {
  try {
    console.log('🔄 Creating backup before deployment...');
    
    // Read current products
    const productsData = await fs.readFile(PRODUCTS_FILE, 'utf8');
    const products = JSON.parse(productsData);
    
    // Create backup with timestamp
    const backup = {
      timestamp: new Date().toISOString(),
      products: products,
      count: products.length,
      note: 'Auto-backup before deployment'
    };
    
    await fs.writeFile(BACKUP_FILE, JSON.stringify(backup, null, 2));
    console.log(`✅ Backup created: ${products.length} products saved to ${BACKUP_FILE}`);
    
    // Add backup file to git
    try {
      execSync('git add data/products-backup.json', { cwd: __dirname, stdio: 'inherit' });
      execSync('git commit -m "Auto-backup products before deployment"', { cwd: __dirname, stdio: 'inherit' });
      console.log('✅ Backup committed to git');
    } catch (gitError) {
      console.log('⚠️ Git commit failed (this is okay if not in a git repo):', gitError.message);
    }
    
    return true;
  } catch (error) {
    console.error('❌ Backup failed:', error.message);
    return false;
  }
}

// Run backup
backupBeforeDeploy().then(success => {
  process.exit(success ? 0 : 1);
});

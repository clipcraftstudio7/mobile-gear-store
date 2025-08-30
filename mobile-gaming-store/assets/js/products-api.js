// Products API Helper
// Provides fallback between server and static file

class ProductsAPI {
  constructor() {
    this.serverUrl = '/products';
    this.fallbackUrl = 'data/products.json';
    this.cache = null;
    this.cacheTime = null;
    this.cacheTimeout = 30000; // 30 seconds
  }

  async getProducts() {
    // Return cached data if recent
    if (this.cache && this.cacheTime && (Date.now() - this.cacheTime < this.cacheTimeout)) {
      console.log('📦 Using cached products');
      return this.cache;
    }

    try {
      console.log('🌐 Fetching products from server...');
      const response = await fetch(this.serverUrl);
      
      if (response.ok) {
        const products = await response.json();
        console.log(`✅ Loaded ${products.length} products from server`);
        
        // Cache the results
        this.cache = products;
        this.cacheTime = Date.now();
        
        return products;
      } else {
        console.warn('⚠️ Server responded with error, trying fallback...');
        throw new Error(`Server error: ${response.status}`);
      }
    } catch (error) {
      console.warn('❌ Server request failed:', error.message);
      console.log('📁 Falling back to static file...');
      
      try {
        const response = await fetch(this.fallbackUrl);
        if (response.ok) {
          const products = await response.json();
          console.log(`📁 Loaded ${products.length} products from static file`);
          return products;
        } else {
          throw new Error(`Static file error: ${response.status}`);
        }
      } catch (fallbackError) {
        console.error('❌ Both server and static file failed:', fallbackError);
        return [];
      }
    }
  }

  // Clear cache to force fresh fetch
  clearCache() {
    this.cache = null;
    this.cacheTime = null;
    console.log('🗑️ Products cache cleared');
  }

  // Check if server is available
  async isServerAvailable() {
    try {
      const response = await fetch('/health');
      return response.ok;
    } catch {
      return false;
    }
  }
}

// Create global instance
const productsAPI = new ProductsAPI();

// Make it available globally
window.productsAPI = productsAPI;
window.getProducts = () => productsAPI.getProducts();
window.clearProductsCache = () => productsAPI.clearCache();

console.log('📊 Products API helper loaded. Use getProducts() or window.productsAPI');

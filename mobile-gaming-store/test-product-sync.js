// Test Product Synchronization
console.log("🔄 Testing Product Synchronization...");

async function testProductSync() {
  console.log("\n=== 🔄 PRODUCT SYNC TEST ===");
  
  try {
    // Test 1: Check server availability
    console.log("\n📡 Testing server availability...");
    const serverAvailable = await window.productsAPI.isServerAvailable();
    console.log("Server available:", serverAvailable ? "✅ YES" : "❌ NO");
    
    // Test 2: Load products using smart API
    console.log("\n📦 Loading products using smart API...");
    const products = await window.getProducts();
    console.log(`Products loaded: ${products.length}`);
    
    if (products.length > 0) {
      // Test 3: Check recent products (newly added should have high IDs)
      console.log("\n🆕 Checking for recently added products...");
      const sortedProducts = products.sort((a, b) => b.id - a.id);
      const recentProducts = sortedProducts.slice(0, 5);
      
      console.log("5 Most Recent Products:");
      recentProducts.forEach((product, index) => {
        console.log(`${index + 1}. ID: ${product.id}, Name: ${product.name}, Category: ${product.category}`);
      });
      
      // Test 4: Check if products have organized image paths
      console.log("\n🖼️ Checking image organization...");
      const organizedProducts = products.filter(p => 
        p.image && p.image.includes('products-organized')
      );
      console.log(`Products with organized images: ${organizedProducts.length}/${products.length}`);
      
      // Test 5: Product display test
      console.log("\n🎯 Testing product display...");
      const isOnHomepage = window.location.pathname === "/" || window.location.pathname.includes("index.html");
      
      if (isOnHomepage) {
        const productContainer = document.querySelector('.trending-carousel, .categories, .products-grid');
        if (productContainer) {
          console.log("✅ Product container found on homepage");
          const productCards = productContainer.querySelectorAll('.product-card, .category-card');
          console.log(`Product cards visible: ${productCards.length}`);
        } else {
          console.log("⚠️ Product container not found on homepage");
        }
      }
      
      return true;
    } else {
      console.log("❌ No products loaded");
      return false;
    }
    
  } catch (error) {
    console.error("❌ Product sync test failed:", error);
    return false;
  }
}

// Test for specific new product
async function checkForNewProduct(productName) {
  console.log(`\n🔍 Searching for product: "${productName}"`);
  
  try {
    const products = await window.getProducts();
    const foundProduct = products.find(p => 
      p.name.toLowerCase().includes(productName.toLowerCase())
    );
    
    if (foundProduct) {
      console.log("✅ Product found!");
      console.log("Details:", {
        id: foundProduct.id,
        name: foundProduct.name,
        price: foundProduct.price,
        category: foundProduct.category,
        image: foundProduct.image
      });
      return foundProduct;
    } else {
      console.log("❌ Product not found");
      console.log("💡 Try clearing cache and reloading:");
      console.log("   window.clearProductsCache()");
      console.log("   location.reload()");
      return null;
    }
  } catch (error) {
    console.error("❌ Search failed:", error);
    return null;
  }
}

// Quick refresh function
async function refreshProducts() {
  console.log("🔄 Refreshing products...");
  window.clearProductsCache();
  
  const products = await window.getProducts();
  console.log(`✅ Refreshed! Now showing ${products.length} products`);
  
  // If on homepage, trigger a re-render
  if (typeof loadProducts === 'function') {
    console.log("🔄 Re-rendering products on page...");
    try {
      await loadProducts();
      console.log("✅ Page products refreshed");
    } catch (error) {
      console.log("⚠️ Page refresh failed:", error.message);
    }
  }
  
  return products;
}

// Make functions available globally
window.testProductSync = testProductSync;
window.checkForNewProduct = checkForNewProduct;
window.refreshProducts = refreshProducts;

// Auto-run test
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(testProductSync, 2000);
  });
} else {
  setTimeout(testProductSync, 2000);
}

console.log("🧪 Product sync test loaded!");
console.log("Commands:");
console.log("- testProductSync() - Run full sync test");
console.log("- checkForNewProduct('product name') - Search for specific product");
console.log("- refreshProducts() - Clear cache and reload products");

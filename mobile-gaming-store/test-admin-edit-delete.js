// Test Admin Edit and Delete Functions
console.log("🧪 Testing Admin Edit and Delete Functions...");

class AdminEditDeleteTester {
  constructor() {
    this.serverUrl = 'http://localhost:3000';
  }

  async testEditDeleteFunctionality() {
    console.log("\n=== ✏️🗑️ ADMIN EDIT & DELETE TEST ===");
    
    try {
      // Test 1: Check if we're on admin dashboard
      const isOnAdminPage = window.location.pathname.includes('admin-dashboard.html');
      console.log("On admin dashboard:", isOnAdminPage ? "✅ YES" : "❌ NO");
      
      if (!isOnAdminPage) {
        console.log("💡 Not on admin dashboard. Navigate to admin-dashboard.html to test edit/delete");
        return false;
      }

      // Test 2: Check admin elements exist
      await this.testAdminElements();
      
      // Test 3: Test product loading
      await this.testProductLoading();
      
      // Test 4: Test edit modal functionality
      this.testEditModalFunctionality();
      
      // Test 5: Test delete functionality
      this.testDeleteFunctionality();
      
      console.log("\n✅ Edit and Delete functionality tests completed!");
      return true;
      
    } catch (error) {
      console.error("❌ Edit/Delete test failed:", error);
      return false;
    }
  }

  async testAdminElements() {
    console.log("\n🔍 Testing Admin Dashboard Elements...");
    
    const elements = {
      'Products Grid': document.getElementById('products-grid'),
      'Edit Modal': document.getElementById('edit-modal-overlay'),
      'Edit Form': document.getElementById('edit-product-form'),
      'Delete Button': document.getElementById('delete-product-btn'),
      'Close Modal Button': document.getElementById('close-edit-modal')
    };
    
    let allPresent = true;
    for (const [name, element] of Object.entries(elements)) {
      const exists = !!element;
      console.log(`${name}: ${exists ? '✅' : '❌'}`);
      if (!exists) allPresent = false;
    }
    
    return allPresent;
  }

  async testProductLoading() {
    console.log("\n📦 Testing Product Loading...");
    
    try {
      const response = await fetch(`${this.serverUrl}/products`);
      if (response.ok) {
        const products = await response.json();
        console.log(`✅ Loaded ${products.length} products from server`);
        
        if (products.length > 0) {
          console.log("Sample product structure:", {
            id: products[0].id,
            name: products[0].name,
            hasAllFields: !!(products[0].price && products[0].category && products[0].description)
          });
          return true;
        } else {
          console.log("⚠️ No products found - add some products first");
          return false;
        }
      } else {
        console.log("❌ Failed to load products from server");
        return false;
      }
    } catch (error) {
      console.log("❌ Product loading error:", error.message);
      return false;
    }
  }

  testEditModalFunctionality() {
    console.log("\n✏️ Testing Edit Modal Functionality...");
    
    const modal = document.getElementById('edit-modal-overlay');
    const closeBtn = document.getElementById('close-edit-modal');
    const form = document.getElementById('edit-product-form');
    
    if (!modal || !closeBtn || !form) {
      console.log("❌ Edit modal elements missing");
      return false;
    }
    
    // Test modal show/hide
    console.log("Testing modal visibility toggle...");
    modal.classList.add('active');
    const isVisible = modal.classList.contains('active');
    console.log("Modal can be shown:", isVisible ? "✅" : "❌");
    
    modal.classList.remove('active');
    const isHidden = !modal.classList.contains('active');
    console.log("Modal can be hidden:", isHidden ? "✅" : "❌");
    
    // Test form fields
    const requiredFields = [
      'edit-product-id',
      'edit-product-name', 
      'edit-product-price',
      'edit-product-category',
      'edit-product-description'
    ];
    
    console.log("Checking form fields...");
    let allFieldsPresent = true;
    requiredFields.forEach(fieldId => {
      const field = document.getElementById(fieldId);
      const exists = !!field;
      console.log(`${fieldId}: ${exists ? '✅' : '❌'}`);
      if (!exists) allFieldsPresent = false;
    });
    
    return allFieldsPresent;
  }

  testDeleteFunctionality() {
    console.log("\n🗑️ Testing Delete Functionality...");
    
    const deleteBtn = document.getElementById('delete-product-btn');
    if (!deleteBtn) {
      console.log("❌ Delete button not found");
      return false;
    }
    
    console.log("✅ Delete button found");
    console.log("Delete button onclick:", typeof deleteBtn.onclick);
    console.log("Global deleteProduct function:", typeof window.deleteProduct);
    
    if (typeof window.deleteProduct === 'function') {
      console.log("✅ Delete function is available");
      return true;
    } else {
      console.log("❌ Delete function not available");
      return false;
    }
  }

  // Utility method to simulate editing a product
  async simulateEdit(productId, updates) {
    console.log(`\n🧪 Simulating edit for product ID: ${productId}`);
    console.log("Updates:", updates);
    
    try {
      const response = await fetch(`${this.serverUrl}/edit-product-enhanced`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: productId, updates })
      });
      
      const data = await response.json();
      
      if (data.success) {
        console.log("✅ Edit simulation successful:", data.message);
        return data;
      } else {
        console.log("❌ Edit simulation failed:", data.error);
        return null;
      }
    } catch (error) {
      console.log("❌ Edit simulation error:", error.message);
      return null;
    }
  }

  // Utility method to test product clicking
  testProductCardClicks() {
    console.log("\n🖱️ Testing Product Card Clicks...");
    
    const productCards = document.querySelectorAll('.product-card[data-id]');
    console.log(`Found ${productCards.length} clickable product cards`);
    
    if (productCards.length > 0) {
      console.log("✅ Product cards are available for clicking");
      console.log("💡 Click any product card to test the edit modal");
      
      // Add temporary visual indicator
      productCards.forEach((card, index) => {
        if (index < 3) { // Just highlight first 3
          card.style.border = "2px solid #25d366";
          card.style.cursor = "pointer";
          card.title = "Click to test edit functionality";
        }
      });
      
      return true;
    } else {
      console.log("❌ No clickable product cards found");
      return false;
    }
  }

  // Quick demo of edit and delete
  async runQuickDemo() {
    console.log("\n🎬 Running Quick Edit/Delete Demo...");
    
    try {
      // Get first product
      const products = await fetch(`${this.serverUrl}/products`).then(r => r.json());
      if (products.length === 0) {
        console.log("❌ No products available for demo");
        return;
      }
      
      const testProduct = products[0];
      console.log(`Using product: ${testProduct.name} (ID: ${testProduct.id})`);
      
      // Simulate edit
      const editResult = await this.simulateEdit(testProduct.id, {
        name: testProduct.name + " (Test Edit)",
        price: testProduct.price + 0.01
      });
      
      if (editResult) {
        console.log("✅ Edit demo successful");
        
        // Revert changes
        await this.simulateEdit(testProduct.id, {
          name: testProduct.name,
          price: testProduct.price
        });
        console.log("✅ Changes reverted");
      }
      
    } catch (error) {
      console.log("❌ Demo failed:", error.message);
    }
  }

  generateEditDeleteReport() {
    console.log("\n📊 EDIT & DELETE FUNCTIONALITY REPORT");
    console.log("=========================================");
    
    const checks = [
      { name: "On Admin Page", check: () => window.location.pathname.includes('admin-dashboard.html') },
      { name: "Products Grid", check: () => !!document.getElementById('products-grid') },
      { name: "Edit Modal", check: () => !!document.getElementById('edit-modal-overlay') },
      { name: "Edit Form", check: () => !!document.getElementById('edit-product-form') },
      { name: "Delete Button", check: () => !!document.getElementById('delete-product-btn') },
      { name: "Delete Function", check: () => typeof window.deleteProduct === 'function' },
      { name: "Product Cards", check: () => document.querySelectorAll('.product-card[data-id]').length > 0 }
    ];
    
    checks.forEach(({ name, check }) => {
      const result = check();
      console.log(`${name}: ${result ? '✅ READY' : '❌ NOT READY'}`);
    });
  }
}

// Create global tester instance
const editDeleteTester = new AdminEditDeleteTester();

// Make functions available globally
window.testEditDelete = () => editDeleteTester.testEditDeleteFunctionality();
window.testProductClicks = () => editDeleteTester.testProductCardClicks();
window.editDeleteReport = () => editDeleteTester.generateEditDeleteReport();
window.runEditDemo = () => editDeleteTester.runQuickDemo();
window.simulateProductEdit = (id, updates) => editDeleteTester.simulateEdit(id, updates);

// Auto-run basic tests if on admin page
if (window.location.pathname.includes('admin-dashboard.html')) {
  editDeleteTester.generateEditDeleteReport();
  setTimeout(() => {
    editDeleteTester.testProductCardClicks();
  }, 3000);
}

console.log("🧪 Edit/Delete test suite loaded!");
console.log("Commands:");
console.log("- testEditDelete() - Run full edit/delete test");
console.log("- testProductClicks() - Test product card clicking");
console.log("- editDeleteReport() - Quick status report"); 
console.log("- runEditDemo() - Run edit demonstration");
console.log("- simulateProductEdit(id, updates) - Test editing specific product");

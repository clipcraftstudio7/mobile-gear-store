// Complete Admin Dashboard Test Suite
console.log("🧪 Starting Complete Admin Test Suite...");

class AdminTester {
  constructor() {
    this.serverUrl = 'http://localhost:3000';
    this.adminId = 'b34bceb9-af1a-48f3-9460-f0d83d89b10b';
  }

  async runCompleteTest() {
    console.log("=== 🎯 COMPLETE ADMIN DASHBOARD TEST ===");
    
    try {
      // Test 1: Server Health
      await this.testServerHealth();
      
      // Test 2: Navbar Admin Link
      this.testAdminNavbarLink();
      
      // Test 3: Admin Dashboard Access
      this.testAdminDashboardAccess();
      
      // Test 4: Product Loading
      await this.testProductLoading();
      
      // Test 5: Image System
      await this.testImageSystem();
      
      // Test 6: Form Functionality
      this.testFormFunctionality();
      
      console.log("✅ Complete admin test finished!");
      return true;
      
    } catch (error) {
      console.error("❌ Admin test failed:", error);
      return false;
    }
  }

  async testServerHealth() {
    console.log("\n📡 Testing Server Health...");
    
    try {
      const response = await fetch(`${this.serverUrl}/health`);
      
      if (response.ok) {
        const data = await response.json();
        console.log("✅ Server is healthy:", data.status);
        return true;
      } else {
        console.error("❌ Server health check failed:", response.status);
        return false;
      }
    } catch (error) {
      console.error("❌ Cannot connect to server:", error.message);
      console.log("💡 Make sure to run: node server.js");
      return false;
    }
  }

  testAdminNavbarLink() {
    console.log("\n🔗 Testing Admin Navbar Link...");
    
    // Check if user is logged in as admin
    const currentUserId = window.currentUserId;
    console.log("Current user ID:", currentUserId);
    console.log("Expected admin ID:", this.adminId);
    console.log("Is admin?", currentUserId === this.adminId);
    
    // Check if admin link exists
    const adminLink = document.getElementById('admin-nav-item');
    console.log("Admin link element found:", !!adminLink);
    
    if (adminLink) {
      console.log("Admin link display:", adminLink.style.display);
      console.log("Admin link visible:", adminLink.style.display !== 'none');
      
      if (currentUserId === this.adminId && adminLink.style.display !== 'none') {
        console.log("✅ Admin navbar link working correctly");
        return true;
      } else {
        console.log("⚠️ Admin link not visible or user not admin");
        return false;
      }
    } else {
      console.log("❌ Admin link element not found");
      return false;
    }
  }

  testAdminDashboardAccess() {
    console.log("\n🎛️ Testing Admin Dashboard Access...");
    
    // Check if we're on admin dashboard
    const isOnAdminPage = window.location.pathname.includes('admin-dashboard.html');
    console.log("On admin dashboard page:", isOnAdminPage);
    
    if (isOnAdminPage) {
      // Test dashboard elements
      const addForm = document.getElementById('add-product-form');
      const productsContainer = document.getElementById('products-container');
      const imageUploadBoxes = document.querySelectorAll('.image-upload-box');
      
      console.log("Add product form found:", !!addForm);
      console.log("Products container found:", !!productsContainer);
      console.log("Image upload boxes found:", imageUploadBoxes.length);
      
      if (addForm && productsContainer) {
        console.log("✅ Admin dashboard elements present");
        return true;
      } else {
        console.log("❌ Missing admin dashboard elements");
        return false;
      }
    } else {
      console.log("💡 Not on admin dashboard page");
      return null;
    }
  }

  async testProductLoading() {
    console.log("\n📦 Testing Product Loading...");
    
    try {
      const response = await fetch(`${this.serverUrl}/products`);
      
      if (response.ok) {
        const products = await response.json();
        console.log(`✅ Loaded ${products.length} products from server`);
        
        // Test product structure
        if (products.length > 0) {
          const sampleProduct = products[0];
          console.log("Sample product structure:", {
            id: sampleProduct.id,
            name: sampleProduct.name,
            hasImage: !!sampleProduct.image,
            hasImages: !!sampleProduct.images,
            imageCount: sampleProduct.images ? sampleProduct.images.length : 0
          });
        }
        
        return true;
      } else {
        console.error("❌ Failed to load products:", response.status);
        return false;
      }
    } catch (error) {
      console.error("❌ Product loading error:", error);
      return false;
    }
  }

  async testImageSystem() {
    console.log("\n🖼️ Testing Image System...");
    
    // Test image fallback manager
    if (window.imageManager) {
      console.log("✅ Image fallback manager available");
      
      // Test a few image paths
      const testPaths = [
        'assets/images/products-organized/1-gaming-controller/1-main.jpg',
        'assets/images/products-organized/2-sy830-gaming-headset/1-main.jpg',
        'assets/images/default-product.svg'
      ];
      
      for (const path of testPaths) {
        try {
          const isValid = await window.imageManager.validateImage(path);
          console.log(`Image ${path}: ${isValid ? '✅ Valid' : '❌ Invalid'}`);
        } catch (error) {
          console.log(`Image ${path}: ❌ Error - ${error.message}`);
        }
      }
      
      return true;
    } else {
      console.log("❌ Image fallback manager not available");
      return false;
    }
  }

  testFormFunctionality() {
    console.log("\n📝 Testing Form Functionality...");
    
    const isOnAdminPage = window.location.pathname.includes('admin-dashboard.html');
    
    if (!isOnAdminPage) {
      console.log("💡 Not on admin page, skipping form tests");
      return null;
    }
    
    // Test add product form
    const addForm = document.getElementById('add-product-form');
    if (addForm) {
      const requiredFields = ['product-name', 'product-price', 'product-category'];
      const allFieldsPresent = requiredFields.every(fieldId => 
        document.getElementById(fieldId)
      );
      
      console.log("Required form fields present:", allFieldsPresent);
      
      // Test image upload boxes
      const imageBoxes = document.querySelectorAll('.image-upload-box input[type="file"]');
      console.log("Image upload inputs found:", imageBoxes.length);
      
      if (allFieldsPresent && imageBoxes.length > 0) {
        console.log("✅ Form functionality appears ready");
        return true;
      } else {
        console.log("❌ Form missing required elements");
        return false;
      }
    } else {
      console.log("❌ Add product form not found");
      return false;
    }
  }

  // Utility methods for manual testing
  async simulateProductAdd() {
    console.log("\n🔧 Simulating Product Add (Test Mode)...");
    
    const testProduct = {
      name: "Test Gaming Controller",
      price: 25.99,
      category: "Controllers",
      discount: 10,
      description: "Test product for admin dashboard",
      stock: 50,
      rating: 4.5,
      reviews: 25,
      features: ["Test Feature 1", "Test Feature 2"],
      productId: Date.now(),
      folderName: `${Date.now()}-test-controller`
    };
    
    try {
      // Note: This would need actual FormData for real upload
      console.log("Test product data:", testProduct);
      console.log("💡 To actually add this product, use the admin dashboard form");
      return true;
    } catch (error) {
      console.error("❌ Simulation failed:", error);
      return false;
    }
  }

  generateTestReport() {
    console.log("\n📊 ADMIN DASHBOARD TEST REPORT");
    console.log("=====================================");
    console.log("🔗 Navbar Integration: " + (this.testAdminNavbarLink() ? "✅ PASS" : "❌ FAIL"));
    console.log("🖼️ Image System: " + (window.imageManager ? "✅ READY" : "❌ NOT READY"));
    console.log("🎛️ Dashboard Access: " + (document.getElementById('add-product-form') ? "✅ AVAILABLE" : "❌ NOT AVAILABLE"));
    console.log("📡 Server Connection: Testing...");
    
    this.testServerHealth().then(serverOk => {
      console.log("📡 Server Connection: " + (serverOk ? "✅ CONNECTED" : "❌ DISCONNECTED"));
    });
  }
}

// Create global tester instance
const adminTester = new AdminTester();

// Make functions available globally
window.testCompleteAdmin = () => adminTester.runCompleteTest();
window.testAdminReport = () => adminTester.generateTestReport();
window.simulateAdd = () => adminTester.simulateProductAdd();

// Auto-run basic tests
adminTester.generateTestReport();

console.log("🧪 Admin test suite loaded!");
console.log("Commands:");
console.log("- testCompleteAdmin() - Run full test suite");
console.log("- testAdminReport() - Quick status report");
console.log("- simulateAdd() - Test product add simulation");

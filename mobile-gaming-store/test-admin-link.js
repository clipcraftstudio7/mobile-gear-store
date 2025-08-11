// Test Admin Dashboard Link
console.log("🧪 Testing Admin Dashboard Link...");

function testAdminLink() {
  console.log("=== Admin Dashboard Link Test ===");
  
  // Check if navbar is loaded
  const navbar = document.querySelector('.navbar');
  console.log("Navbar found:", !!navbar);
  
  // Check if admin nav item exists
  const adminNavItem = document.getElementById("admin-nav-item");
  console.log("Admin nav item found:", !!adminNavItem);
  
  if (adminNavItem) {
    console.log("Admin nav item display:", adminNavItem.style.display);
    console.log("Admin nav item innerHTML:", adminNavItem.innerHTML);
  }
  
  // Check navbar container
  const navbarContainer = document.getElementById("navbar-container");
  console.log("Navbar container found:", !!navbarContainer);
  
  if (navbarContainer) {
    console.log("Navbar container innerHTML length:", navbarContainer.innerHTML.length);
  }
  
  // Check if navbar-loader is working
  console.log("navbarLoader available:", !!window.navbarLoader);
  
  // Check current user
  console.log("Current user ID:", window.currentUserId);
  
  // Check Supabase
  console.log("Supabase available:", !!window.supabase);
}

// Run test when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(testAdminLink, 2000); // Wait 2 seconds for navbar to load
  });
} else {
  setTimeout(testAdminLink, 2000);
}

// Make function available globally
window.testAdminLink = testAdminLink;

console.log("🧪 Test script loaded. Run testAdminLink() in console or wait 2 seconds.");

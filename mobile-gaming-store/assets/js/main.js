// Supabase initialization
const SUPABASE_URL = "https://kokntkhxkymllafuubun.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtva250a2h4a3ltbGxhZnV1YnVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3NzYxODcsImV4cCI6MjA2ODM1MjE4N30.Ekc6HLszFSYTIgsvzTdKJWr85nFMUH2HQBQrg_uqXRc";

// Lightweight affiliate tracking
(function affiliateAttributionInit(){
  function setCookie(name, value, days){
    try {
      const d = new Date();
      d.setTime(d.getTime() + (days*24*60*60*1000));
      const expires = "expires=" + d.toUTCString();
      document.cookie = name + "=" + encodeURIComponent(value) + ";" + expires + ";path=/";
    } catch (e) {}
  }
  function getCookie(name){
    try {
      const cname = name + "=";
      const ca = document.cookie.split(';');
      for(let c of ca){
        while(c.charAt(0) === ' ') c = c.substring(1);
        if(c.indexOf(cname) === 0) return decodeURIComponent(c.substring(cname.length, c.length));
      }
    } catch(e) {}
    return null;
  }
  function storeAttribution(key, value){
    try { localStorage.setItem(key, value); } catch(e) {}
    setCookie(key, value, 30);
  }
  function readAttribution(key){
    try { const v = localStorage.getItem(key); if(v) return v; } catch(e) {}
    return getCookie(key);
  }
  function captureFromUrl(){
    try {
      const params = new URLSearchParams(window.location.search);
      const affiliateId = params.get('ref') || params.get('affiliate') || params.get('utm_affiliate');
      const source = params.get('utm_source');
      const campaign = params.get('utm_campaign');
      const medium = params.get('utm_medium');
      if(affiliateId){ storeAttribution('affiliate_id', affiliateId); }
      if(source){ storeAttribution('utm_source', source); }
      if(campaign){ storeAttribution('utm_campaign', campaign); }
      if(medium){ storeAttribution('utm_medium', medium); }
    } catch(e) {}
  }
  // Expose helpers globally for other scripts (e.g., checkout)
  window.__getAffiliateAttribution = function(){
    return {
      affiliate_id: readAttribution('affiliate_id') || '',
      utm_source: readAttribution('utm_source') || '',
      utm_campaign: readAttribution('utm_campaign') || '',
      utm_medium: readAttribution('utm_medium') || ''
    };
  };
  document.addEventListener('DOMContentLoaded', captureFromUrl);
})();

// Check if Supabase is available
if (typeof window.supabase !== "undefined") {
  supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  console.log("Supabase client created successfully");
} else {
  console.warn("Supabase not loaded yet, will initialize when available");
}

// Missing function that was causing errors
function renderTrendingCarousel(products) {
  console.log(
    "renderTrendingCarousel called with:",
    products.length,
    "products"
  );
  // Implementation can be added later if needed
  return "";
}

// Product loading and rendering functions
async function loadProducts() {
  try {
    // Use the smart products API with fallback
    const products = await window.getProducts();
    console.log("Loaded products:", products.length);
    if (products.length > 0) {
      console.log("First product:", products[0]);
    }
    return products;
  } catch (error) {
    console.error("Error loading products:", error);
    console.error("Error details:", error.message);
    return [];
  }
}

// Helper function to get fresh products (added within last 30 days or marked as new)
function getFreshProducts(products) {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
  
  // First, try to find products added in the last 30 days
  let freshProducts = products.filter(product => {
    if (!product.createdAt) return false;
    const productDate = new Date(product.createdAt);
    return productDate >= thirtyDaysAgo;
  });

  // If no recent products, show products marked as new
  if (freshProducts.length === 0) {
    freshProducts = products.filter(product => product.isNew === true);
  }

  // If still no products, show the most recent 6 products
  if (freshProducts.length === 0) {
    freshProducts = products
      .filter(product => product.createdAt)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 6);
  }

  // Sort by creation date (newest first)
  return freshProducts.sort((a, b) => {
    if (!a.createdAt || !b.createdAt) return 0;
    return new Date(b.createdAt) - new Date(a.createdAt);
  });
}

// Helper function to format time since added
function getTimeSinceAdded(createdAt) {
  if (!createdAt) return '';
  
  const now = new Date();
  const productDate = new Date(createdAt);
  const diffTime = Math.abs(now - productDate);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 1) return '1 day ago';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 14) return `${Math.ceil(diffDays / 7)} week${Math.ceil(diffDays / 7) > 1 ? 's' : ''} ago`;
  return '';
}

function createProductCard(product) {
  try {
    console.log("Creating product card for:", product.name);

    const discount =
      product.originalPrice && product.originalPrice > product.price
        ? Math.round(
            ((product.originalPrice - product.price) / product.originalPrice) *
              100
          )
        : 0;

    const stockClass = product.stock <= 3 ? "low-stock" : "in-stock";
    const stockText =
      product.stock <= 3 ? `Only ${product.stock} Left` : "In Stock";

    return `
    <div class="product-card enhanced" data-product-id="${product.id}">
      <div class="product-image-container" style="position: relative; overflow: hidden; border-radius: 12px;">
        <img src="${
          product.image || "assets/images/products/default.jpg"
        }" alt="${
      product.name
    }" class="product-image" style="width: 100%; height: 200px; object-fit: cover;" onerror="this.onerror=null;this.src='assets/images/products/default.jpg';" />
        <div class="product-overlay">
          <button class="quick-view-btn">👁️ Quick View</button>
          <button class="wishlist-btn">❤️</button>
        </div>
        ${discount > 0 ? `<div class="discount-badge">-${discount}%</div>` : ""}
        <div class="stock-indicator ${stockClass}">${stockText}</div>
      </div>
      <div class="product-info">
        <div class="product-header">
          <h3 class="product-title">${product.name}</h3>
          <div class="product-rating">
            <span class="stars">${"⭐".repeat(
              Math.round(product.rating || 4)
            )}</span>
            <span class="rating-count">(${product.reviews || 0})</span>
          </div>
        </div>
        <div class="product-price">
          ${
            product.originalPrice && product.originalPrice > product.price
              ? `<span class="original-price">$${product.originalPrice.toLocaleString()}</span>`
              : ""
          }
          <span class="discount-price">$${product.price.toLocaleString()}</span>
          ${
            product.originalPrice && product.originalPrice > product.price
              ? `<span class="savings">Save $${(
                  product.originalPrice - product.price
                ).toLocaleString()}</span>`
              : ""
          }
        </div>
        <p class="product-description">${product.description.substring(
          0,
          80
        )}...</p>
        ${
          product.features && product.features.length > 0
            ? `<div class="product-features">${product.features
                .slice(0, 3)
                .map((f) => `<span class="feature-tag">${f}</span>`)
                .join("")}</div>`
            : ""
        }
        <div class="product-actions" style="display:flex;gap:10px;">
          <button class="add-to-cart-btn" style="flex:1;" onclick="addToCartFromCard(${
            product.id
          })"><i class="fas fa-shopping-cart"></i> Add to Cart</button>
          <a href="product-template.html?id=${
            product.id
          }" class="add-to-cart-btn" style="flex:1;text-align:center;"><i class="fas fa-eye"></i> View Details</a>
        </div>
        <div class="product-meta">
          <span>Category: ${product.category}</span>
          <span>Stock: ${product.stock}</span>
        </div>
      </div>
    </div>
  `;
  } catch (error) {
    console.error("Error creating product card for:", product.name, error);
    return `<div class="product-card enhanced">
      <div class="product-info">
        <h3 class="product-title">Error loading product</h3>
        <p>Unable to display this product</p>
      </div>
    </div>`;
  }
}

// Enhanced product card for fresh arrivals with special styling
function createFreshProductCard(product) {
  try {
    console.log("Creating fresh product card for:", product.name);

    const discount =
      product.originalPrice && product.originalPrice > product.price
        ? Math.round(
            ((product.originalPrice - product.price) / product.originalPrice) *
              100
          )
        : 0;

    const stockClass = product.stock <= 3 ? "low-stock" : "in-stock";
    const stockText =
      product.stock <= 3 ? `Only ${product.stock} Left` : "In Stock";

    const timeSinceAdded = getTimeSinceAdded(product.createdAt);

    return `
    <div class="product-card enhanced" data-product-id="${product.id}">
      <div class="product-image-container" style="position: relative; overflow: hidden; border-radius: 12px;">
        <img src="${
          product.image || "assets/images/products/default.jpg"
        }" alt="${
      product.name
    }" class="product-image" style="width: 100%; height: 200px; object-fit: cover;" onerror="this.onerror=null;this.src='assets/images/products/default.jpg';" />
        <div class="product-overlay">
          <button class="quick-view-btn">👁️ Quick View</button>
          <button class="wishlist-btn">❤️</button>
        </div>
        ${discount > 0 ? `<div class="discount-badge">-${discount}%</div>` : ""}
        <div class="stock-indicator ${stockClass}">${stockText}</div>
        <div class="new-badge">NEW</div>
      </div>
      <div class="product-info">
        <div class="product-header">
          <h3 class="product-title">${product.name}</h3>
          <div class="product-rating">
            <span class="stars">${"⭐".repeat(
              Math.round(product.rating || 4)
            )}</span>
            <span class="rating-count">(${product.reviews || 0})</span>
          </div>
        </div>
        <div class="product-price">
          ${
            product.originalPrice && product.originalPrice > product.price
              ? `<span class="original-price">$${product.originalPrice.toLocaleString()}</span>`
              : ""
          }
          <span class="discount-price">$${product.price.toLocaleString()}</span>
          ${
            product.originalPrice && product.originalPrice > product.price
              ? `<span class="savings">Save $${(
                  product.originalPrice - product.price
                ).toLocaleString()}</span>`
              : ""
          }
        </div>
        <p class="product-description">${product.description.substring(
          0,
          80
        )}...</p>
        ${
          product.features && product.features.length > 0
            ? `<div class="product-features">${product.features
                .slice(0, 3)
                .map((f) => `<span class="feature-tag">${f}</span>`)
                .join("")}</div>`
            : ""
        }
        <div class="product-actions" style="display:flex;gap:10px;">
          <button class="add-to-cart-btn" style="flex:1;" onclick="addToCartFromCard(${
            product.id
          })"><i class="fas fa-shopping-cart"></i> Add to Cart</button>
          <a href="product-template.html?id=${
            product.id
          }" class="add-to-cart-btn" style="flex:1;text-align:center;"><i class="fas fa-eye"></i> View Details</a>
        </div>
        <div class="product-meta">
          <span>Category: ${product.category}</span>
          <span>Stock: ${product.stock}</span>
        </div>
      </div>
    </div>
  `;
  } catch (error) {
    console.error("Error creating fresh product card for:", product.name, error);
    return `<div class="product-card enhanced">
      <div class="product-info">
        <h3 class="product-title">Error loading product</h3>
        <p>Unable to display this product</p>
      </div>
    </div>`;
  }
}

// Global variables for load more functionality
let allProducts = [];
let currentPage = 1;
const productsPerPage = 12;

// Function to add product to cart by ID
function addToCartFromCard(productId) {
  console.log("addToCartFromCard called with productId:", productId);
  console.log("allProducts available:", allProducts.length);
  console.log("window.addToCart available:", typeof window.addToCart);

  const product = allProducts.find((p) => p.id === productId);
  if (product) {
    console.log("Product found:", product);
    if (typeof window.addToCart === "function") {
      console.log("Calling window.addToCart...");
      window.addToCart(product);
    } else {
      console.error("addToCart function not available");
      if (typeof showNotification === "function") {
        showNotification("Cart functionality not loaded yet", "error");
      } else {
        alert("Cart functionality not loaded yet");
      }
    }
  } else {
    console.error("Product not found:", productId);
    if (typeof showNotification === "function") {
      showNotification("Product not found", "error");
    } else {
      alert("Product not found");
    }
  }
}

async function renderProductGrids() {
  console.log("renderProductGrids called...");
  const products = await loadProducts();
  console.log("Products loaded:", products.length);
  if (products.length === 0) {
    console.log("No products found, showing fallback content");
    // Show fallback content
    const featuredGrid = document.getElementById("featured-products-grid");
    if (featuredGrid) {
      featuredGrid.innerHTML = `
        <div class="product-card enhanced">
          <div class="product-info">
            <h3 class="product-title">Products Loading...</h3>
            <p>Please wait while we load the products</p>
          </div>
        </div>
      `;
    }
    return;
  }

  // Store all products globally for load more functionality
  allProducts = products;
  console.log("All products stored globally:", allProducts.length);

  // Render featured products (first 6)
  const featuredGrid = document.getElementById("featured-products-grid");
  console.log("Featured grid element:", featuredGrid);
  console.log("Featured grid element type:", typeof featuredGrid);
  console.log(
    "Featured grid element tagName:",
    featuredGrid ? featuredGrid.tagName : "null"
  );
  if (featuredGrid) {
    const featuredProducts = products.slice(0, 6);
    console.log("Featured products:", featuredProducts.length);
    const featuredHTML = featuredProducts.map(createProductCard).join("");
    console.log("Featured HTML length:", featuredHTML.length);
    console.log("Featured HTML preview:", featuredHTML.substring(0, 200));
    featuredGrid.innerHTML = featuredHTML;
    console.log("Featured grid innerHTML set successfully");
  } else {
    console.error("Featured products grid not found!");
  }

  // Render best sellers (next 6)
  const bestSellersGrid = document.getElementById("best-sellers-grid");
  if (bestSellersGrid) {
    bestSellersGrid.innerHTML = products
      .slice(6, 12)
      .map(createProductCard)
      .join("");
  }

  // Render trending now (next 6)
  const trendingNowGrid = document.getElementById("trending-now-grid");
  if (trendingNowGrid) {
    trendingNowGrid.innerHTML = products
      .slice(12, 18)
      .map(createProductCard)
      .join("");
  }

  // Render fresh arrivals (truly new products)
  const freshArrivalsGrid = document.getElementById("fresh-arrivals-grid");
  if (freshArrivalsGrid) {
    const freshProducts = getFreshProducts(products);
    freshArrivalsGrid.innerHTML = freshProducts
      .slice(0, 6)
      .map(createFreshProductCard)
      .join("");
    
    // Update counter
    const counterElement = document.getElementById("new-products-count");
    if (counterElement) {
      counterElement.textContent = freshProducts.length;
    }
    
    // Also update the fresh arrivals manager if it exists
    if (window.freshArrivalsManager) {
      window.freshArrivalsManager.freshProducts = freshProducts;
      window.freshArrivalsManager.updateCounter();
    }
  }

  // Render accessories (filter by category)
  const accessoriesGrid = document.getElementById("accessories-grid");
  if (accessoriesGrid) {
    const accessories = products.filter(
      (p) =>
        p.category === "Accessories" ||
        p.category === "Mobile Accessories" ||
        p.category === "Gaming Accessories"
    );
    accessoriesGrid.innerHTML = accessories
      .slice(0, 6)
      .map(createProductCard)
      .join("");
  }

  // Render all products (initial load)
  renderAllProducts();
}

function renderAllProducts() {
  const allProductsGrid = document.getElementById("all-products-grid");
  if (allProductsGrid) {
    const startIndex = 0;
    const endIndex = currentPage * productsPerPage;
    const productsToShow = allProducts.slice(startIndex, endIndex);

    allProductsGrid.innerHTML = productsToShow.map(createProductCard).join("");

    // Update load more button state
    updateLoadMoreButton();

    // Add initial animation
    allProductsGrid.style.opacity = "0";
    allProductsGrid.style.transition = "opacity 0.5s ease";
    setTimeout(() => {
      allProductsGrid.style.opacity = "1";
    }, 100);
  }
}

function resetLoadMore() {
  currentPage = 1;
  renderAllProducts();
}

function loadMoreProducts() {
  const loadMoreBtn = document.getElementById("load-more-all-products");
  if (loadMoreBtn) {
    // Show loading state
    loadMoreBtn.innerHTML =
      '<i class="fas fa-spinner fa-spin btn-icon"></i> Loading...';
    loadMoreBtn.disabled = true;
  }

  // Simulate loading delay for better UX
  setTimeout(() => {
    currentPage++;
    const allProductsGrid = document.getElementById("all-products-grid");
    if (allProductsGrid) {
      const startIndex = 0;
      const endIndex = currentPage * productsPerPage;
      const productsToShow = allProducts.slice(startIndex, endIndex);

      // Add fade-in animation for new products
      allProductsGrid.style.opacity = "0.7";
      allProductsGrid.style.transition = "opacity 0.3s ease";

      setTimeout(() => {
        allProductsGrid.innerHTML = productsToShow
          .map(createProductCard)
          .join("");

        allProductsGrid.style.opacity = "1";

        // Update load more button state
        updateLoadMoreButton();

        // Scroll to show new products
        allProductsGrid.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
        });
      }, 300);
    }
  }, 500);
}

function updateLoadMoreButton() {
  const loadMoreBtn = document.getElementById("load-more-all-products");
  if (loadMoreBtn) {
    const totalPages = Math.ceil(allProducts.length / productsPerPage);

    if (currentPage >= totalPages) {
      // All products loaded
      loadMoreBtn.innerHTML =
        '<i class="fas fa-check btn-icon"></i> All Products Loaded';
      loadMoreBtn.disabled = true;
      loadMoreBtn.style.background = "#555";
      loadMoreBtn.style.cursor = "not-allowed";
    } else {
      // More products available
      const remainingProducts =
        allProducts.length - currentPage * productsPerPage;
      loadMoreBtn.innerHTML = `<i class="fas fa-plus btn-icon"></i> Load More (${remainingProducts} remaining)`;
      loadMoreBtn.disabled = false;
      loadMoreBtn.style.background =
        "linear-gradient(135deg, #25d366, #128c7e)";
      loadMoreBtn.style.cursor = "pointer";
    }
  }
}

// Update UI based on authentication state
async function updateAuthUI() {
  if (!supabase) {
    console.warn("Supabase not available for updateAuthUI");
    return;
  }

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const loginBtn = document.getElementById("login-btn");
    const userArea = document.getElementById("user-area");

    // Remove all previous user info blocks
    document.querySelectorAll("#user-info").forEach((el) => el.remove());

    if (user) {
      // Fetch user profile from Supabase
      let displayName = "";
      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("username, name, email")
          .eq("id", user.id)
          .single();
        if (profile) {
          displayName =
            profile.username ||
            profile.name ||
            profile.email ||
            user.email.split("@")[0];
        }
      } catch (e) {
        displayName = user.email.split("@")[0];
      }

      // Hide login button
      if (loginBtn) loginBtn.style.display = "none";

      // Show user initials and logout button
      const initials = displayName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .substring(0, 3)
        .toUpperCase();
      userArea.innerHTML = `
        <div id="user-info" style="
          display: flex; align-items: center; gap: 8px; padding: 4px 10px;
          background: rgba(37,211,102,0.08); border-radius: 18px; border: 1px solid #25d366;
        ">
          <a href="profile.html" style="
            width: 28px; height: 28px; border-radius: 50%;
            background: linear-gradient(135deg, #25d366, #128c7e);
            display: flex; align-items: center; justify-content: center;
            font-weight: bold; color: #111; font-size: 13px;
            border: 2px solid #fff; box-shadow: 0 1px 4px rgba(0,0,0,0.08);
            text-decoration: none;
          " title="Profile">
            ${initials}
          </a>
          <button id="logout-btn" style="
            padding: 4px 10px; border-radius: 8px; border: none;
            background: #ff4757; color: white; cursor: pointer; font-size: 13px; font-weight: 600;
            margin-left: 4px; transition: background 0.2s;
          " onmouseover="this.style.background='#ff3742'"
            onmouseout="this.style.background='#ff4757'">
            <i class="fas fa-sign-out-alt"></i>
          </button>
        </div>
      `;
      // Logout handler
      document.getElementById("logout-btn").onclick = async () => {
        try {
          await supabase.auth.signOut();
          updateAuthUI();
          if (typeof showNotification === "function") {
            showNotification("Logged out successfully!", "success");
          }
        } catch (error) {
          console.error("Logout error:", error);
          if (typeof showNotification === "function") {
            showNotification("Error logging out. Please try again.", "error");
          }
        }
      };
    } else {
      // Show login button
      if (loginBtn) loginBtn.style.display = "";
      userArea.innerHTML = `
        <a href="login.html" class="nav-btn login-btn" id="login-btn">Login</a>
      `;
    }
  } catch (error) {
    console.error("Error in updateAuthUI:", error);
  }
}

// Notification system
function showNotification(message, type = "info") {
  const notification = document.createElement("div");
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${
      type === "success" ? "#25d366" : type === "error" ? "#ff4757" : "#3742fa"
    };
    color: white;
    padding: 15px 25px;
    border-radius: 10px;
    font-weight: 600;
    z-index: 10000;
    transform: translateX(100%);
    transition: transform 0.3s ease;
    box-shadow: 0 5px 20px rgba(0, 0, 0, 0.3);
    max-width: 300px;
  `;
  notification.textContent = message;

  document.body.appendChild(notification);

  // Animate in
  setTimeout(() => {
    notification.style.transform = "translateX(0)";
  }, 100);

  // Remove after 3 seconds
  setTimeout(() => {
    notification.style.transform = "translateX(100%)";
    setTimeout(() => {
      if (notification.parentNode) {
        document.body.removeChild(notification);
      }
    }, 300);
  }, 3000);
}

// Initialize Supabase when it becomes available
function initializeSupabase() {
  if (typeof window.supabase !== "undefined" && !supabase) {
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log("Supabase client created successfully");
    updateAuthUI();
  }
}

// --- LIVE SEARCH FILTERING FOR ALL PRODUCT SECTIONS ---
(function setupLiveSearchFiltering() {
  // Wait for DOM and products to be loaded
  document.addEventListener("DOMContentLoaded", () => {
    // Wait for navbar and search input
    function tryInit() {
      const searchInput = document.getElementById("search-input");
      if (!searchInput || !window._allProducts) {
        setTimeout(tryInit, 100);
        return;
      }
      // Store original products for each section
      let products = window._allProducts;
      let featuredProducts = products.slice(0, 6);
      let bestSellers = products.slice(6, 12);
      let trendingNow = products.slice(12, 18);
      let freshProducts = getFreshProducts(products);
      let accessories = products
        .filter(
          (p) =>
            p.category === "Accessories" ||
            p.category === "Mobile Accessories" ||
            p.category === "Gaming Accessories"
        )
        .slice(0, 6);
      let allProductsList = products;

      // Helper to filter and render all sections
      function filterAndRenderSections(query) {
        const q = query.trim().toLowerCase();
        // Filter logic
        const filterFn = (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.category && p.category.toLowerCase().includes(q)) ||
          (p.description && p.description.toLowerCase().includes(q));
        // Filtered lists
        const filteredFeatured = q
          ? featuredProducts.filter(filterFn)
          : featuredProducts;
        const filteredBest = q ? bestSellers.filter(filterFn) : bestSellers;
        const filteredTrending = q ? trendingNow.filter(filterFn) : trendingNow;
        const filteredFresh = q ? freshProducts.filter(filterFn) : freshProducts;
        const filteredAccessories = q
          ? accessories.filter(filterFn)
          : accessories;
        const filteredAll = q
          ? allProductsList.filter(filterFn)
          : allProductsList;

        // Render
        const featuredGrid = document.getElementById("featured-products-grid");
        if (featuredGrid)
          featuredGrid.innerHTML = filteredFeatured
            .map(createProductCard)
            .join("");
        const bestGrid = document.getElementById("best-sellers-grid");
        if (bestGrid)
          bestGrid.innerHTML = filteredBest.map(createProductCard).join("");
        const trendingGrid = document.getElementById("trending-now-grid");
        if (trendingGrid)
          trendingGrid.innerHTML = filteredTrending.map(createProductCard).join("");
        const freshGrid = document.getElementById("fresh-arrivals-grid");
        if (freshGrid)
          freshGrid.innerHTML = filteredFresh.map(createFreshProductCard).join("");
        const accessoriesGrid = document.getElementById("accessories-grid");
        if (accessoriesGrid)
          accessoriesGrid.innerHTML = filteredAccessories
            .map(createProductCard)
            .join("");
        const allGrid = document.getElementById("all-products-grid");
        if (allGrid)
          allGrid.innerHTML = filteredAll.map(createProductCard).join("");
      }

      // Listen for input on search bar
      searchInput.addEventListener("input", (e) => {
        filterAndRenderSections(e.target.value);
      });

      // Also filter on page load if search bar has value
      if (searchInput.value) {
        filterAndRenderSections(searchInput.value);
      }
    }
    // Wait for products to be loaded by navbar
    if (window._allProducts) {
      tryInit();
    } else {
      // Wait for products.json to be loaded by navbar
      const checkProducts = setInterval(() => {
        if (window._allProducts) {
          clearInterval(checkProducts);
          tryInit();
        }
      }, 100);
    }
  });
})();

// Run on page load
window.addEventListener("DOMContentLoaded", function () {
  console.log("Main.js DOMContentLoaded - Starting initialization...");
  initializeSupabase();
  updateAuthUI();
  console.log("About to call renderProductGrids...");
  renderProductGrids(); // Load and display products

  // Add event listener for load more button
  const loadMoreBtn = document.getElementById("load-more-all-products");
  if (loadMoreBtn) {
    loadMoreBtn.addEventListener("click", loadMoreProducts);
  }

  // Initialize cart system if Supabase is available
  if (typeof window.supabase !== "undefined") {
    const supabaseClient = window.supabase.createClient(
      SUPABASE_URL,
      SUPABASE_ANON_KEY
    );
    if (typeof initializeCart === "function") {
      initializeCart(supabaseClient);
    }
  }

  // Listen for auth state changes and update UI
  if (supabase) {
    supabase.auth.onAuthStateChange(() => {
      updateAuthUI();
    });
  }

  // Make functions globally available
  window.addToCartFromCard = addToCartFromCard;

  // Verify cart functions are available
  console.log("Cart functions check:");
  console.log("- window.addToCart:", typeof window.addToCart);
  console.log("- window.addToCartFromCard:", typeof window.addToCartFromCard);
  console.log("- window.loadCart:", typeof window.loadCart);

  // --- Guest Login Prompt (with Continue Browsing) ---
  (function showGuestPromptOnce(){
    try {
      const key = 'guest_prompt_snooze_until';
      const snoozeUntil = parseInt(localStorage.getItem(key)||'0',10);
      const now = Date.now();
      const shouldSkip = snoozeUntil && now < snoozeUntil;
      if (shouldSkip) return;
      // Check auth state asynchronously
      (async () => {
        if (!supabase) return;
        const { data: { user } } = await supabase.auth.getUser();
        if (user) return;
        const overlay = document.createElement('div');
        overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center;z-index:50000;';
        const modal = document.createElement('div');
        modal.style.cssText = 'width:92%;max-width:520px;background:#181818;border:1px solid #333;border-radius:14px;padding:16px;box-shadow:0 10px 40px rgba(0,0,0,0.5);';
        modal.innerHTML = `
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <div style="font-weight:800;color:#25d366;font-size:1.1rem;display:flex;align-items:center;gap:8px;"><i class="fas fa-user-shield"></i> Welcome!</div>
            <button id="gp-close" style="background:transparent;border:none;color:#aaa;font-size:20px;cursor:pointer">&times;</button>
          </div>
          <div style="color:#ccc;margin-top:8px;">Log in to sync your cart, track orders, and get personalized deals.</div>
          <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:14px;flex-wrap:wrap;">
            <a href="login.html" style="background:linear-gradient(135deg,#25d366,#128c7e);color:#111;border:none;padding:10px 14px;border-radius:10px;font-weight:800;text-decoration:none;">Log in / Sign up</a>
            <button id="gp-continue" style="background:#222;border:1px solid #333;color:#e5e5e5;padding:10px 14px;border-radius:10px;font-weight:700;">Continue browsing</button>
          </div>`;
        overlay.appendChild(modal);
        document.body.appendChild(overlay);
        const closeAll = ()=>{ try{ overlay.remove(); }catch{} };
        modal.querySelector('#gp-close').onclick = closeAll;
        modal.querySelector('#gp-continue').onclick = ()=>{ try{ localStorage.setItem(key, String(Date.now() + 3*24*60*60*1000)); }catch{} closeAll(); };
      })();
    } catch(e) { console.warn('Guest prompt error', e); }
  })();
});

// --- CART LOGIC: Guest & User (Jumia-style) ---
let cart = [];
let supabase;
let currentUserId = null;

// Utility: Get cart key for localStorage
function getCartKey() {
  return currentUserId ? `cart_user_${currentUserId}` : "cart_guest";
}

// Load cart from localStorage and Supabase
async function loadCart() {
  // Load from localStorage first
  const localCart = localStorage.getItem(getCartKey());
  cart = localCart ? JSON.parse(localCart) : [];

  // If logged in, always use DB cart as source of truth (except for initial merge)
  if (supabase && currentUserId) {
    try {
      const { data: dbCart, error } = await supabase
        .from("carts")
        .select("items")
        .eq("user_id", currentUserId)
        .single();
      if (!error && dbCart && dbCart.items) {
        // Use DB cart directly, do NOT merge repeatedly
        cart = Array.isArray(dbCart.items) ? dbCart.items : [];
        localStorage.setItem(getCartKey(), JSON.stringify(cart));
      } else if (cart.length > 0) {
        // Save local cart to DB if DB is empty
        await saveCartToDatabase();
      }
    } catch (error) {
      console.error("Error loading cart from database:", error);
    }
  }
  await updateCartUI();
  console.log("Cart after loadCart:", cart); // Debug log
}

// Merge two carts (sum quantities for same product)
function mergeCarts(cartA, cartB) {
  const merged = [...cartA];
  for (const itemB of cartB) {
    const existing = merged.find((itemA) => itemA.id === itemB.id);
    if (existing) {
      existing.quantity += itemB.quantity;
    } else {
      merged.push({ ...itemB });
    }
  }
  return merged;
}

// Save cart to database
async function saveCartToDatabase() {
  if (!supabase || !currentUserId) return;
  try {
    const { error } = await supabase.from("carts").upsert(
      {
        user_id: currentUserId,
        items: cart,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );
    if (error) {
      console.error("Error saving cart to database:", error);
    }
  } catch (error) {
    console.error("Error saving cart to database:", error);
  }
}

// Add item to cart
async function addToCart(product) {
  console.log("addToCart called with product:", product);
  console.log("Current cart before adding:", cart);

  const existingItem = cart.find((item) => item.id === product.id);
  if (existingItem) {
    existingItem.quantity = Number(existingItem.quantity) + 1;
    console.log("Updated existing item quantity to:", existingItem.quantity);
  } else {
    cart.push({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      quantity: 1, // Always set to 1 for new items
      added_at: new Date().toISOString(),
    });
    console.log("Added new item to cart");
  }

  localStorage.setItem(getCartKey(), JSON.stringify(cart));
  console.log("Cart saved to localStorage:", getCartKey());

  if (currentUserId) {
    console.log("User logged in, saving to database...");
    await saveCartToDatabase();
  }

  await updateCartUI();
  console.log("Cart UI updated");

  // Update navbar counts
  if (window.navbar && typeof window.navbar.updateCounts === "function") {
    window.navbar.updateCounts();
  }
  if (typeof updateMobileBottomNav === "function") {
    updateMobileBottomNav();
  }

  // Show notification if function exists
  if (typeof showNotification === "function") {
    showNotification(`${product.name} added to cart!`, "success");
  } else {
    console.log(`${product.name} added to cart!`);
  }
}

// Remove item from cart
async function removeFromCart(productId) {
  cart = cart.filter((item) => item.id !== productId);
  localStorage.setItem(getCartKey(), JSON.stringify(cart));
  if (currentUserId) await saveCartToDatabase();
  await updateCartUI();

  // Update navbar counts
  if (window.navbar && typeof window.navbar.updateCounts === "function") {
    window.navbar.updateCounts();
  }
  if (typeof updateMobileBottomNav === "function") {
    updateMobileBottomNav();
  }

  // Show notification if function exists
  if (typeof showNotification === "function") {
    showNotification("Item removed from cart!", "info");
  } else {
    console.log("Item removed from cart!");
  }
}

// Update item quantity
async function updateQuantity(productId, quantity) {
  const item = cart.find((item) => item.id === productId);
  if (item) {
    if (quantity <= 0) {
      await removeFromCart(productId);
    } else {
      item.quantity = quantity;
      localStorage.setItem(getCartKey(), JSON.stringify(cart));
      if (currentUserId) await saveCartToDatabase();
      await updateCartUI();

      // Update navbar counts
      if (window.navbar && typeof window.navbar.updateCounts === "function") {
        window.navbar.updateCounts();
      }
      if (typeof updateMobileBottomNav === "function") {
        updateMobileBottomNav();
      }
    }
  }
}

// Clear cart
async function clearCart() {
  cart = [];
  localStorage.removeItem(getCartKey());
  if (currentUserId) await saveCartToDatabase();
  updateCartUI();

  // Update navbar counts
  if (window.navbar && typeof window.navbar.updateCounts === "function") {
    window.navbar.updateCounts();
  }
  if (typeof updateMobileBottomNav === "function") {
    updateMobileBottomNav();
  }

  // Show notification if function exists
  if (typeof showNotification === "function") {
    showNotification("Cart cleared!", "info");
  } else {
    console.log("Cart cleared!");
  }
}

// Get cart total
function getCartTotal() {
  return cart.reduce((total, item) => total + item.price * item.quantity, 0);
}

// Get subtotal (without shipping)
function getCartSubtotal() {
  return cart.reduce((total, item) => total + item.price * item.quantity, 0);
}

// Get shipping fee (only for checkout, not cart page)
function getShippingFee() {
  return 0; // No shipping fee displayed on cart page
}

// Defensive getCartCount
function getCartCount() {
  console.log("Cart array for count:", cart);
  return cart.reduce((count, item) => {
    const qty = parseInt(item.quantity, 10);
    return count + (isNaN(qty) ? 0 : qty);
  }, 0);
}

// Update cart UI
async function updateCartUI() {
  const cartCounts = document.querySelectorAll(".cart-count");
  const count = getCartCount();
  cartCounts.forEach((cartCount) => {
    cartCount.textContent = count;
    cartCount.style.display = count > 0 ? "flex" : "none";
    // Animation bump
    cartCount.classList.remove("bump");
    void cartCount.offsetWidth; // Trigger reflow
    cartCount.classList.add("bump");
  });

  // Update mobile navbar cart count specifically
  const cartCountMobile = document.getElementById("cart-count-mobile");
  if (cartCountMobile) {
    cartCountMobile.textContent = count;
    cartCountMobile.style.display = count > 0 ? "flex" : "none";
  }

  const cartBtn = document.querySelector(".cart-btn");
  if (cartBtn) {
    if (count > 0) {
      cartBtn.style.position = "relative";
    }
  }

  // Also update navbar loader cart count if available
  if (
    typeof window.navbarLoader !== "undefined" &&
    window.navbarLoader.updateCartCount
  ) {
    await window.navbarLoader.updateCartCount();
    console.log("Cart UI updated - also called navbar loader update");
  }
}

// Show cart modal (unchanged)
function showCartModal() {
  const modal = document.createElement("div");
  modal.id = "cart-modal";
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0, 0, 0, 0.8);
    z-index: 10000;
    display: flex;
    align-items: center;
    justify-content: center;
  `;

  const cartContent = `
    <div style="
      background: #1c1c1c;
      border-radius: 20px;
      padding: 30px;
      max-width: 600px;
      width: 90%;
      max-height: 80vh;
      overflow-y: auto;
      border: 1px solid #333;
    ">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <h2 style="color: #fff; margin: 0;">Shopping Cart (${getCartCount()} items)</h2>
        <button onclick="closeCartModal()" style="
          background: none;
          border: none;
          color: #fff;
          font-size: 24px;
          cursor: pointer;
        ">&times;</button>
      </div>
      
      ${
        cart.length === 0
          ? `
        <div style="text-align: center; padding: 40px; color: #ccc;">
          <i class="fas fa-shopping-cart" style="font-size: 3rem; margin-bottom: 20px; opacity: 0.5;"></i>
          <p>Your cart is empty</p>
          <a href="#featured-products" onclick="closeCartModal()" style="
            color: #25d366;
            text-decoration: none;
            font-weight: 600;
          ">Continue Shopping</a>
        </div>
      `
          : `
        <div style="margin-bottom: 20px;">
          ${cart
            .map(
              (item) => `
            <div style="
              display: flex;
              align-items: center;
              gap: 15px;
              padding: 15px;
              border-bottom: 1px solid #333;
            ">
              <img src="${item.image}" alt="${item.name}" style="
                width: 60px;
                height: 60px;
                object-fit: cover;
                border-radius: 10px;
              ">
              <div style="flex: 1;">
                <h4 style="color: #fff; margin: 0 0 5px 0; font-size: 14px;">${
                  item.name
                }</h4>
                <p style="color: #25d366; margin: 0; font-weight: 600;">$${item.price.toLocaleString()}</p>
              </div>
              <div style="display: flex; align-items: center; gap: 10px;">
                <button onclick="updateQuantity(${item.id}, ${
                item.quantity - 1
              })" style="
                  background: #333;
                  border: none;
                  color: #fff;
                  width: 30px;
                  height: 30px;
                  border-radius: 50%;
                  cursor: pointer;
                ">-</button>
                <span style="color: #fff; min-width: 20px; text-align: center;">${
                  item.quantity
                }</span>
                <button onclick="updateQuantity(${item.id}, ${
                item.quantity + 1
              })" style="
                  background: #25d366;
                  border: none;
                  color: #111;
                  width: 30px;
                  height: 30px;
                  border-radius: 50%;
                  cursor: pointer;
                ">+</button>
                <button onclick="removeFromCart(${item.id})" style="
                  background: #ff4757;
                  border: none;
                  color: #fff;
                  padding: 5px 10px;
                  border-radius: 5px;
                  cursor: pointer;
                  font-size: 12px;
                ">Remove</button>
              </div>
            </div>
          `
            )
            .join("")}
        </div>
        
        <div style="border-top: 1px solid #333; padding-top: 20px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <h3 style="color: #fff; margin: 0;">Total:</h3>
            <h3 style="color: #25d366; margin: 0;">$${getCartTotal().toLocaleString()}</h3>
          </div>
          
          <div style="display: flex; gap: 10px;">
            <button onclick="clearCart()" style="
              flex: 1;
              padding: 12px;
              background: #333;
              border: none;
              color: #fff;
              border-radius: 10px;
              cursor: pointer;
            ">Clear Cart</button>
            <button onclick="checkout()" style="
              flex: 2;
              padding: 12px;
              background: #25d366;
              border: none;
              color: #111;
              border-radius: 10px;
              cursor: pointer;
              font-weight: 600;
            ">Proceed to Checkout</button>
          </div>
        </div>
      `
      }
    </div>
  `;

  modal.innerHTML = cartContent;
  document.body.appendChild(modal);
}

// Close cart modal
function closeCartModal() {
  const modal = document.getElementById("cart-modal");
  if (modal) {
    modal.remove();
  }
}

// Checkout function
function checkout() {
  // If using Supabase and not logged in, redirect to login with redirect to checkout
  if (typeof window.supabase !== "undefined") {
    const supabaseClient = window.supabase.createClient(
      "https://kokntkhxkymllafuubun.supabase.co",
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtva250a2h4a3ltbGxhZnV1YnVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3NzYxODcsImV4cCI6MjA2ODM1MjE4N30.Ekc6HLszFSYTIgsvzTdKJWr85nFMUH2HQBQrg_uqXRc"
    );
    supabaseClient.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        // Not logged in, redirect to login with redirect to checkout.html
        window.location.href = `login.html?redirect=checkout.html`;
      } else {
        window.location.href = "checkout.html";
      }
    });
  } else if (!currentUserId) {
    // Fallback: if no supabase or no user, redirect to login
    window.location.href = `login.html?redirect=checkout.html`;
  } else {
    window.location.href = "checkout.html";
  }
}

// --- CART INIT & MERGE LOGIC ---

// Call this on page load and on auth state change
async function handleCartAuthChange(supabaseClient) {
  supabase = supabaseClient;
  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const prevUserId = currentUserId;
  currentUserId = user ? user.id : null;

  // Make currentUserId globally available for navbar
  window.currentUserId = currentUserId;

  // Use a flag to prevent repeated merging for the same login session
  let mergeFlagKey = currentUserId
    ? `cart_merged_for_user_${currentUserId}`
    : null;

  if (user && prevUserId !== currentUserId) {
    // User just logged in: merge guest cart into user cart if not already merged
    if (mergeFlagKey && !localStorage.getItem(mergeFlagKey)) {
      const guestCart = localStorage.getItem("cart_guest");
      if (guestCart) {
        const guestCartArr = JSON.parse(guestCart);
        const userCart = localStorage.getItem(getCartKey());
        cart = mergeCarts(guestCartArr, userCart ? JSON.parse(userCart) : []);
        localStorage.setItem(getCartKey(), JSON.stringify(cart));
        await saveCartToDatabase();
        localStorage.removeItem("cart_guest");
      } else {
        await loadCart();
      }
      localStorage.setItem(mergeFlagKey, "1"); // Mark as merged for this session
    } else {
      await loadCart();
    }
  } else if (!user) {
    // User just logged out: load guest cart and clear merge flag
    if (prevUserId) {
      localStorage.removeItem(`cart_merged_for_user_${prevUserId}`);
    }
    await loadCart();
  } else {
    // User already logged in: just load cart
    await loadCart();
  }
  await updateCartUI(); // Ensure UI is updated after auth change
  console.log("Cart after handleCartAuthChange:", cart); // Debug log
}

// --- INIT ---
document.addEventListener("DOMContentLoaded", async function () {
  console.log("Cart.js DOMContentLoaded - Initializing cart system...");

  // Cart button now links to cart.html page, no modal needed

  // Initialize cart with Supabase if available
  if (typeof window.supabase !== "undefined" || window.supabaseClient || window._ptSupabaseClient) {
    console.log("Supabase available, initializing with auth...");
    let supabaseClient = window._ptSupabaseClient || window.supabaseClient || null;
    if (!supabaseClient && window.supabase && typeof window.supabase.createClient === 'function') {
      supabaseClient = window.supabase.createClient(
        "https://kokntkhxkymllafuubun.supabase.co",
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtva250a2h4a3ltbGxhZnV1YnVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3NzYxODcsImV4cCI6MjA2ODM1MjE4N30.Ekc6HLszFSYTIgsvzTdKJWr85nFMUH2HQBQrg_uqXRc"
      );
    }
    if (supabaseClient) {
      handleCartAuthChange(supabaseClient);
      // Listen for auth state changes
      supabaseClient.auth.onAuthStateChange(() => {
        handleCartAuthChange(supabaseClient);
      });
    } else {
      console.log("Supabase SDK present but client not ready; using guest cart for now...");
      loadCart();
    }
  } else {
    console.log("Supabase not available, using guest cart only...");
    // Guest cart only
    loadCart();
  }

  // Initialize mobile navbar cart functionality
  async function initMobileNavbar() {
    const mobileNavbar = document.querySelector(".mobile-bottom-navbar");
    if (mobileNavbar && window.innerWidth <= 480) {
      mobileNavbar.style.display = "block";
      // Update cart count for mobile navbar
      await updateCartUI();
    }
  }

  // Initialize mobile navbar on load and resize
  await initMobileNavbar();
  window.addEventListener("resize", () => initMobileNavbar());

  console.log("Cart initialization complete");
});

// Function to initialize cart from main.js
function initializeCart(supabaseClient) {
  handleCartAuthChange(supabaseClient);
  // Listen for auth state changes
  supabaseClient.auth.onAuthStateChange(() => {
    handleCartAuthChange(supabaseClient);
  });
}

// Make functions globally available immediately
window.addToCart = addToCart;
window._mainAddToCart = addToCart;
window.removeFromCart = removeFromCart;
window.updateQuantity = updateQuantity;
window.clearCart = clearCart;
window.showCartModal = showCartModal;
window.closeCartModal = closeCartModal;
window.checkout = checkout;
window.loadCart = loadCart;
window.updateCartUI = function () {
  // Update cart icon if present
  const cartCount = document.querySelector(".cart-count");
  if (cartCount) {
    let count = 0;
    if (Array.isArray(cart)) {
      count = cart.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
    }
    cartCount.textContent = count;
    cartCount.style.display = count > 0 ? "flex" : "none";
  }
};

console.log("Cart functions made globally available:");
console.log("- addToCart:", typeof window.addToCart);
console.log("- loadCart:", typeof window.loadCart);
console.log("- updateCartUI:", typeof window.updateCartUI);

// Listen for cart changes and update UI
window.addEventListener("storage", async (e) => {
  if (e.key && e.key.includes("cart")) {
    await updateCartUI();
    // Also update navbar counts
    if (window.navbar && typeof window.navbar.updateCounts === "function") {
      window.navbar.updateCounts();
    }
    // Update mobile navbar
    if (typeof updateMobileBottomNav === "function") {
      updateMobileBottomNav();
    }
  }
});

// Update cart UI on page load
document.addEventListener("DOMContentLoaded", () => {
  setTimeout(updateCartUI, 100); // Small delay to ensure DOM is ready
  // Also update navbar counts
  setTimeout(() => {
    if (window.navbar && typeof window.navbar.updateCounts === "function") {
      window.navbar.updateCounts();
    }
    if (typeof updateMobileBottomNav === "function") {
      updateMobileBottomNav();
    }
  }, 200);
});

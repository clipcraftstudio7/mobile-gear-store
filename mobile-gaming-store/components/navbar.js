// Navbar Component JavaScript
class NavbarComponent {
  constructor() {
    this.navbar = document.getElementById("navbar");
    this.searchInput = document.getElementById("search-input");
    this.searchBtn = document.getElementById("search-btn");
    this.searchSuggestions = document.getElementById("search-suggestions");
    this.voiceBtn = document.getElementById("voice-btn");
    this.cartBtn = document.getElementById("cart-btn");
    this.cartCount = document.getElementById("cart-count");
    this.wishlistBtn = document.getElementById("wishlist-btn");
    this.wishlistCount = document.getElementById("wishlist-count");
    this.compareBtn = document.getElementById("compare-btn");
    this.compareCount = document.getElementById("compare-count");
    this.helpBtn = document.getElementById("help-btn");
    this.helpDropdown = document.getElementById("help-dropdown");

    this.lastScrollY = window.scrollY;
    this.isListening = false;
    this.recognition = null;

    this.init();
  }

  // Helper function to truncate long usernames
  truncateUsername(username, maxLength = 15) {
    if (!username) return "User";
    if (username.length <= maxLength) return username;
    return username.substring(0, maxLength - 3) + "...";
  }

  // Helper function to get user display info consistently
  getUserDisplayInfo(userData) {
    let displayName = "User";
    let initials = "U";
    let fullName = "User";

    if (userData.name) {
      displayName = this.truncateUsername(userData.name);
      fullName = userData.name;
      initials = userData.name.split(" ").map(n => n[0]).join("").toUpperCase().substring(0, 2);
    } else if (userData.username) {
      displayName = this.truncateUsername(userData.username);
      fullName = userData.username;
      initials = userData.username[0].toUpperCase();
    } else if (userData.email) {
      const emailName = userData.email.split("@")[0];
      displayName = this.truncateUsername(emailName);
      fullName = emailName;
      initials = emailName[0].toUpperCase();
    }

    return { displayName, initials, fullName };
  }

  // Create consistent desktop user HTML
  createDesktopUserHTML(userInfo) {
    return `
      <div class="user-dropdown" style="position:relative;">
        <a href="profile.html" class="user-avatar" style="
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: linear-gradient(135deg, #25d366, #128c7e);
          color: #111;
          font-weight: 700;
          font-size: 1.2rem;
          text-decoration: none;
          border: 2px solid rgba(37, 211, 102, 0.3);
          box-shadow: 0 4px 12px rgba(37, 211, 102, 0.3);
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
          flex-shrink: 0;
        ">
          <span style="position:relative;z-index:2;">${userInfo.initials}</span>
          <div style="position:absolute;top:0;left:0;right:0;bottom:0;background:linear-gradient(45deg,transparent,rgba(255,255,255,0.1),transparent);animation:pulse 2s infinite;"></div>
        </a>
        <div class="user-dropdown-menu" style="
          position: absolute;
          top: 100%;
          right: 0;
          background: #1a1a1a;
          border: 1px solid #333;
          border-radius: 12px;
          padding: 8px;
          margin-top: 8px;
          min-width: 200px;
          max-width: 280px;
          box-shadow: 0 8px 24px rgba(0,0,0,0.3);
          opacity: 0;
          visibility: hidden;
          transform: translateY(-10px);
          transition: all 0.3s ease;
          z-index: 1000;
        ">
          <div style="padding: 8px 12px; border-bottom: 1px solid #333; margin-bottom: 8px;">
            <div style="font-weight: 600; color: #25d366; font-size: 0.9rem; word-break: break-word; line-height: 1.3;" title="${userInfo.fullName}">${userInfo.displayName}</div>
            <div style="color: #999; font-size: 0.75rem; word-break: break-all;">${userInfo.email || "user@example.com"}</div>
          </div>
          <a href="profile.html" style="display:flex;align-items:center;gap:8px;padding:8px 12px;color:#ccc;text-decoration:none;border-radius:6px;transition:all 0.2s ease;">
            <i class="fas fa-user-edit" style="color:#25d366;"></i>
            <span>Edit Profile</span>
          </a>
          <a href="profile.html#orders" style="display:flex;align-items:center;gap:8px;padding:8px 12px;color:#ccc;text-decoration:none;border-radius:6px;transition:all 0.2s ease;">
            <i class="fas fa-shopping-bag" style="color:#25d366;"></i>
            <span>My Orders</span>
          </a>
          <a href="profile.html#messages" style="display:flex;align-items:center;gap:8px;padding:8px 12px;color:#ccc;text-decoration:none;border-radius:6px;transition:all 0.2s ease;">
            <i class="fas fa-bell" style="color:#25d366;"></i>
            <span>Messages</span>
          </a>
          <div style="border-top:1px solid #333;margin:8px 0;"></div>
          <button onclick="logout()" style="display:flex;align-items:center;gap:8px;padding:8px 12px;color:#ff4757;text-decoration:none;border-radius:6px;transition:all 0.2s ease;background:none;border:none;width:100%;text-align:left;cursor:pointer;">
            <i class="fas fa-sign-out-alt"></i>
            <span>Logout</span>
          </button>
        </div>
      </div>
    `;
  }

  // Create consistent mobile user HTML
  createMobileUserHTML(userInfo) {
    return `
      <div class="mobile-user-dropdown" style="position:relative;">
        <a href="profile.html" class="user-avatar" style="
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 2px;
          color: #25d366;
          font-size: 0.65rem;
          padding: 4px 2px;
          transition: all 0.3s ease;
          text-decoration: none;
        ">
          <div style="
            width: 36px;
            height: 36px;
            border-radius: 50%;
            background: linear-gradient(135deg, #25d366, #128c7e);
            display: flex;
            align-items: center;
            justify-content: center;
            color: #111;
            font-weight: 700;
            font-size: 1rem;
            margin-bottom: 2px;
            border: 2px solid rgba(37, 211, 102, 0.3);
            box-shadow: 0 3px 10px rgba(37, 211, 102, 0.3);
            position: relative;
            overflow: hidden;
            flex-shrink: 0;
          ">
            <span style="position:relative;z-index:2;">${userInfo.initials}</span>
            <div style="position:absolute;top:0;left:0;right:0;bottom:0;background:linear-gradient(45deg,transparent,rgba(255,255,255,0.1),transparent);animation:pulse 2s infinite;"></div>
          </div>
          <span style="font-size:0.6rem;color:#25d366;font-weight:600;">Account</span>
        </a>
        <div class="mobile-user-dropdown-menu" style="
          position: absolute;
          bottom: 100%;
          left: 50%;
          transform: translateX(-50%);
          background: #1a1a1a;
          border: 1px solid #333;
          border-radius: 12px;
          padding: 8px;
          margin-bottom: 8px;
          min-width: 180px;
          max-width: 250px;
          box-shadow: 0 8px 24px rgba(0,0,0,0.3);
          opacity: 0;
          visibility: hidden;
          transition: all 0.3s ease;
          z-index: 1000;
        ">
          <div style="padding: 8px 12px; border-bottom: 1px solid #333; margin-bottom: 8px; text-align: center;">
            <div style="font-weight: 600; color: #25d366; font-size: 0.85rem; word-break: break-word; line-height: 1.3;" title="${userInfo.fullName}">${userInfo.displayName}</div>
            <div style="color: #999; font-size: 0.7rem; word-break: break-all;">${userInfo.email || "user@example.com"}</div>
          </div>
          <a href="profile.html" style="display:flex;align-items:center;gap:8px;padding:8px 12px;color:#ccc;text-decoration:none;border-radius:6px;transition:all 0.2s ease;">
            <i class="fas fa-user-edit" style="color:#25d366;font-size:0.9rem;"></i>
            <span>Edit Profile</span>
          </a>
          <a href="profile.html#orders" style="display:flex;align-items:center;gap:8px;padding:8px 12px;color:#ccc;text-decoration:none;border-radius:6px;transition:all 0.2s ease;">
            <i class="fas fa-shopping-bag" style="color:#25d366;font-size:0.9rem;"></i>
            <span>My Orders</span>
          </a>
          <a href="profile.html#messages" style="display:flex;align-items:center;gap:8px;padding:8px 12px;color:#ccc;text-decoration:none;border-radius:6px;transition:all 0.2s ease;">
            <i class="fas fa-bell" style="color:#25d366;font-size:0.9rem;"></i>
            <span>Messages</span>
          </a>
          <div style="border-top:1px solid #333;margin:8px 0;"></div>
          <button onclick="logout()" style="display:flex;align-items:center;gap:8px;padding:8px 12px;color:#ff4757;text-decoration:none;border-radius:6px;transition:all 0.2s ease;background:none;border:none;width:100%;text-align:left;cursor:pointer;font-size:0.8rem;">
            <i class="fas fa-sign-out-alt" style="font-size:0.9rem;"></i>
            <span>Logout</span>
          </button>
        </div>
      </div>
    `;
  }

  async init() {
    this.setupScrollBehavior();
    this.setupSearch();
    this.setupVoiceSearch();
    this.setupEventListeners();
    await this.updateCounts();
    // Only update user area once per page load
    if (!window.__navbarUserAreaLoaded) {
      window.__navbarUserAreaLoaded = true;
      setTimeout(() => this.updateUserArea(), 0);
    }
  }

  // Auto-hide navbar on scroll
  setupScrollBehavior() {
    window.addEventListener("scroll", () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY > this.lastScrollY && currentScrollY > 100) {
        // Scrolling down
        this.navbar.classList.add("hidden");
      } else {
        // Scrolling up
        this.navbar.classList.remove("hidden");
      }

      this.lastScrollY = currentScrollY;
    });
  }

  // Search functionality
  setupSearch() {
    // Fetch products and cache
    if (!window._allProducts) {
      fetch("/products")
        .then((r) => r.json())
        .then((products) => {
          window._allProducts = products;
        });
    }
    const searchSuggestions = [
      {
        text: "Gaming Controllers",
        icon: "fas fa-gamepad",
        category: "Controllers",
      },
      { text: "Phone Cooling Fans", icon: "fas fa-fan", category: "Cooling" },
      { text: "Gaming Cases", icon: "fas fa-mobile-alt", category: "Cases" },
      {
        text: "Thumb Grips",
        icon: "fas fa-hand-paper",
        category: "Accessories",
      },
      { text: "Gaming Headsets", icon: "fas fa-headphones", category: "Audio" },
      { text: "Power Banks", icon: "fas fa-battery-full", category: "Power" },
      { text: "Gaming Chairs", icon: "fas fa-chair", category: "Furniture" },
      { text: "RGB Lighting", icon: "fas fa-lightbulb", category: "Lighting" },
    ];

    this.searchInput.addEventListener("input", async (e) => {
      const query = e.target.value.toLowerCase().trim();
      if (query.length > 0) {
        // Show product suggestions from server cache
        let products = window._allProducts || [];
        if (!products.length) {
          try {
            products = await fetch("/products").then((r) => r.json());
            window._allProducts = products;
          } catch {
            products = [];
          }
        }
        const filtered = products
          .filter(
            (p) =>
              p.name.toLowerCase().includes(query) ||
              (p.category && p.category.toLowerCase().includes(query)) ||
              (p.description && p.description.toLowerCase().includes(query))
          )
          .slice(0, 8);
        this.showProductSuggestions(filtered, query);
      } else {
        this.hideSearchSuggestions();
      }
    });

    this.searchInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        this.performSearch(this.searchInput.value);
      }
    });

    this.searchBtn.addEventListener("click", () => {
      this.performSearch(this.searchInput.value);
    });

    // Hide suggestions when clicking outside
    document.addEventListener("click", (e) => {
      if (
        !this.searchInput.contains(e.target) &&
        !this.searchSuggestions.contains(e.target)
      ) {
        this.hideSearchSuggestions();
      }
    });
  }

  showProductSuggestions(products, query) {
    if (!products.length) {
      this.searchSuggestions.innerHTML = `<div class="search-suggestion-item" style="color:#aaa;">No products found for "${query}"</div>`;
      this.searchSuggestions.style.display = "block";
      return;
    }
    this.searchSuggestions.innerHTML = products
      .map(
        (p) => `
      <div class="search-suggestion-item" onclick="window.location.href='${p.link}'">
        <img src="${p.image}" style="width:32px;height:32px;object-fit:cover;border-radius:6px;margin-right:10px;" />
        <span style="font-weight:600;">${p.name}</span>
        <span style="margin-left:auto;color:#25d366;font-weight:700;">$${p.price}</span>
      </div>
    `
      )
      .join("");
    this.searchSuggestions.style.display = "block";
  }

  hideSearchSuggestions() {
    this.searchSuggestions.style.display = "none";
  }

  selectSuggestion(text) {
    this.searchInput.value = text;
    this.hideSearchSuggestions();
    this.performSearch(text);
  }

  performSearch(query) {
    if (!query.trim()) return;
    // Redirect to search-results.html with query param
    window.location.href = `search-results.html?q=${encodeURIComponent(query)}`;
  }

  filterProducts(query) {
    // This would integrate with your product filtering system
    const products = document.querySelectorAll(".product-card");
    const searchTerm = query.toLowerCase();

    products.forEach((product) => {
      const title =
        product.querySelector(".product-title")?.textContent.toLowerCase() ||
        "";
      const description =
        product
          .querySelector(".product-description")
          ?.textContent.toLowerCase() || "";

      if (title.includes(searchTerm) || description.includes(searchTerm)) {
        product.style.display = "block";
      } else {
        product.style.display = "none";
      }
    });
  }

  // Voice search functionality
  setupVoiceSearch() {
    if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      this.recognition = new SpeechRecognition();

      this.recognition.continuous = false;
      this.recognition.interimResults = false;
      this.recognition.lang = "en-US";

      this.recognition.onstart = () => {
        this.isListening = true;
        this.voiceBtn.classList.add("listening");
        this.voiceBtn.innerHTML = '<i class="fas fa-microphone-slash"></i>';
      };

      this.recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        this.searchInput.value = transcript;
        this.performSearch(transcript);
      };

      this.recognition.onend = () => {
        this.isListening = false;
        this.voiceBtn.classList.remove("listening");
        this.voiceBtn.innerHTML = '<i class="fas fa-microphone"></i>';
      };

      this.recognition.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        this.isListening = false;
        this.voiceBtn.classList.remove("listening");
        this.voiceBtn.innerHTML = '<i class="fas fa-microphone"></i>';
      };
    }
  }

  toggleVoiceSearch() {
    if (!this.recognition) {
      alert("Voice search is not supported in your browser.");
      return;
    }

    if (this.isListening) {
      this.recognition.stop();
    } else {
      this.recognition.start();
    }
  }

  // Event listeners
  setupEventListeners() {
    // Voice search
    this.voiceBtn?.addEventListener("click", () => {
      this.toggleVoiceSearch();
    });

    // Cart button
    this.cartBtn?.addEventListener("click", () => {
      this.toggleCart();
    });

    // Wishlist button
    this.wishlistBtn?.addEventListener("click", () => {
      this.toggleWishlist();
    });

    // Compare button
    this.compareBtn?.addEventListener("click", () => {
      this.toggleCompare();
    });
  }

  // Update counter badges
  async updateCounts() {
    // Update cart count using the same system as cart.js
    const cartKey = window.currentUserId
      ? `cart_user_${window.currentUserId}`
      : "cart_guest";
    const cartItems = JSON.parse(localStorage.getItem(cartKey) || "[]");
    const cartCount = cartItems.reduce((count, item) => {
      const qty = parseInt(item.quantity, 10);
      return count + (isNaN(qty) ? 0 : qty);
    }, 0);
    this.updateCartCount(cartCount);

    // Update wishlist count
    const wishlistItems = JSON.parse(
      localStorage.getItem("wishlistItems") || "[]"
    );
    this.updateWishlistCount(wishlistItems.length);

    // Update compare count
    const compareItems = JSON.parse(
      localStorage.getItem("compareItems") || "[]"
    );
    this.updateCompareCount(compareItems.length);

    // Update message count
    await this.updateMessageCount();
  }

  updateCartCount(count) {
    if (this.cartCount) {
      this.cartCount.textContent = count;
      this.cartCount.style.display = count > 0 ? "flex" : "none";
    }

    // Also update mobile cart count
    const cartCountMobile = document.getElementById("cart-count-mobile");
    if (cartCountMobile) {
      cartCountMobile.textContent = count;
      cartCountMobile.style.display = count > 0 ? "flex" : "none";
    }
  }

  updateWishlistCount(count) {
    if (this.wishlistCount) {
      this.wishlistCount.textContent = count;
      this.wishlistCount.style.display = count > 0 ? "flex" : "none";
    }

    // Note: Mobile navbar doesn't have wishlist counter, but we keep this for consistency
  }

  updateCompareCount(count) {
    if (this.compareCount) {
      this.compareCount.textContent = count;
      this.compareCount.style.display = count > 0 ? "flex" : "none";
    }

    // Update compare badge in help dropdown
    const compareBadge = document.getElementById("compare-badge");
    if (compareBadge) {
      compareBadge.textContent = count;
      compareBadge.style.display = count > 0 ? "flex" : "none";
    }

    // Note: Mobile navbar doesn't have compare counter, but we keep this for consistency
  }

  async updateMessageCount() {
    try {
      // Use MessageCenter if available for consistent message counting
      if (
        window.messageCenter &&
        typeof window.messageCenter.updateMessageCount === "function"
      ) {
        window.messageCenter.updateMessageCount();
        return;
      }

      // Fallback: Get message count from Supabase
      if (window.supabase && window.supabase.auth) {
        const {
          data: { user },
        } = await window.supabase.auth.getUser();
        if (user) {
          const { data: messages, error } = await window.supabase
            .from("messages")
            .select("id")
            .eq("receiver_id", user.id)
            .eq("is_read", false); // Only count unread messages

          const messageCount = document.getElementById("message-count-mobile");
          if (messageCount) {
            const count = messages ? messages.length : 0;
            messageCount.textContent = count;
            messageCount.style.display = count > 0 ? "flex" : "none";
          }

          // Also update desktop message count if it exists
          const desktopMessageCount = document.getElementById("message-count");
          if (desktopMessageCount) {
            desktopMessageCount.textContent = count;
            desktopMessageCount.style.display = count > 0 ? "flex" : "none";
          }
        }
      } else {
        // Fallback to localStorage
        const unreadMessages = JSON.parse(
          localStorage.getItem("unreadMessages") || "[]"
        );
        const messageCount = document.getElementById("message-count-mobile");

        if (messageCount) {
          messageCount.textContent = unreadMessages.length;
          messageCount.style.display =
            unreadMessages.length > 0 ? "flex" : "none";
        }

        // Also update desktop message count if it exists
        const desktopMessageCount = document.getElementById("message-count");
        if (desktopMessageCount) {
          desktopMessageCount.textContent = unreadMessages.length;
          desktopMessageCount.style.display =
            unreadMessages.length > 0 ? "flex" : "none";
        }
      }
    } catch (error) {
      console.error("Error updating message count:", error);
      // Fallback to localStorage
      const unreadMessages = JSON.parse(
        localStorage.getItem("unreadMessages") || "[]"
      );
      const messageCount = document.getElementById("message-count-mobile");

      if (messageCount) {
        messageCount.textContent = unreadMessages.length;
        messageCount.style.display =
          unreadMessages.length > 0 ? "flex" : "none";
      }

      // Also update desktop message count if it exists
      const desktopMessageCount = document.getElementById("message-count");
      if (desktopMessageCount) {
        desktopMessageCount.textContent = unreadMessages.length;
        desktopMessageCount.style.display =
          unreadMessages.length > 0 ? "flex" : "none";
      }
    }
  }

  // Toggle functions
  toggleCart() {
    // Integrate with your cart system
    console.log("Toggle cart");
    // Example: document.getElementById('cart-sidebar')?.classList.toggle('open');
  }

  toggleWishlist() {
    // Integrate with your wishlist system
    console.log("Toggle wishlist");
    // Example: window.location.href = '/wishlist';
  }

  toggleCompare() {
    // Integrate with your compare system
    console.log("Toggle compare");
    // Example: document.getElementById('compare-modal')?.classList.toggle('open');
  }

  // Robust user area update
  updateUserArea() {
    const userArea = document.getElementById("user-area");
    const userAreaMobile = document.getElementById("user-area-mobile");

    console.log("updateUserArea called");
    console.log("userArea found:", !!userArea);
    console.log("userAreaMobile found:", !!userAreaMobile);
    console.log("Supabase available:", !!window.supabase);
    console.log(
      "Supabase auth available:",
      !!(window.supabase && window.supabase.auth)
    );

    // Update both desktop and mobile user areas
    const updateUserAreaElement = (element) => {
      if (!element) return;
      // Show skeleton while loading
      element.innerHTML =
        '<div class="user-skeleton"><span class="user-spinner"></span></div>';
    };

    updateUserAreaElement(userArea);
    updateUserAreaElement(userAreaMobile);

    // Show 'Signing you in...' popup
    this.showSignInPopup();

    // First check localStorage for user data (fallback for pages without Supabase)
    const localUser = localStorage.getItem("user");
    console.log("localStorage user data:", localUser);

    if (localUser) {
      try {
        const userData = JSON.parse(localUser);
        console.log("Found user in localStorage:", userData);
        this.hideSignInPopup();

        const userHtml = this.createDesktopUserHTML(this.getUserDisplayInfo(userData));

        const mobileUserHtml = this.createMobileUserHTML(this.getUserDisplayInfo(userData));

        // Hide admin dashboard link for localStorage users (not real auth)
        const adminNavItem = document.getElementById("admin-nav-item");
        if (adminNavItem) {
          console.log("🔒 localStorage user, hiding admin dashboard link");
          adminNavItem.style.display = "none";
        }

        if (userArea) {
          userArea.innerHTML = userHtml;
          userArea.dataset.loaded = "true";
          console.log("Desktop user area updated with localStorage data");
        }
        if (userAreaMobile) {
          userAreaMobile.innerHTML = mobileUserHtml;
          userAreaMobile.dataset.loaded = "true";
          console.log("Mobile user area updated with localStorage data");
        }
        return; // Exit early since we found user in localStorage
      } catch (error) {
        console.error("Error parsing localStorage user data:", error);
        // Continue to Supabase check
      }
    } else {
      console.log("No user data found in localStorage");
    }

    // Try to get user info from Supabase (if available)
    if (window.supabase && window.supabase.auth) {
      console.log("Supabase auth available, checking user...");
      window.supabase.auth
        .getUser()
        .then(({ data: { user } }) => {
          this.hideSignInPopup();
          console.log("User check result:", !!user);
          console.log("User email:", user?.email);
          console.log("User ID:", user?.id);
          console.log("User metadata:", user?.user_metadata);
          if (user) {
            // Get user initials from email or name
            let letter = "?";
            if (user.email) {
              letter = user.email[0].toUpperCase();
            } else if (user.user_metadata && user.user_metadata.name) {
              letter = user.user_metadata.name[0].toUpperCase();
            }

            // Get user profile data for more creative display
            const getUserDisplay = async () => {
              try {
                const { data: profile, error } = await window.supabase
                  .from("profiles")
                  .select("name, username")
                  .eq("id", user.id)
                  .single();

                const userData = {
                  name: profile?.name,
                  username: profile?.username,
                  email: user.email
                };

                return this.getUserDisplayInfo(userData);
              } catch (error) {
                const userData = {
                  email: user.email
                };
                return this.getUserDisplayInfo(userData);
              }
            };

            // Check if user is admin and show admin dashboard link
            const ADMIN_ID = "b34bceb9-af1a-48f3-9460-f0d83d89b10b";
            const adminNavItem = document.getElementById("admin-nav-item");
            if (adminNavItem) {
              if (user.id === ADMIN_ID) {
                console.log("✅ Admin user detected, showing admin dashboard link");
                adminNavItem.style.display = "block";
              } else {
                console.log("👤 Regular user, hiding admin dashboard link");
                adminNavItem.style.display = "none";
              }
            }

            getUserDisplay().then((userInfo) => {
              const userHtml = this.createDesktopUserHTML(userInfo);
              const mobileUserHtml = this.createMobileUserHTML(userInfo);

              if (userArea) {
                userArea.innerHTML = userHtml;
                userArea.dataset.loaded = "true";

                // Add dropdown functionality
                const userDropdown = userArea.querySelector(".user-dropdown");
                const dropdownMenu = userArea.querySelector(
                  ".user-dropdown-menu"
                );

                if (userDropdown && dropdownMenu) {
                  userDropdown.addEventListener("mouseenter", () => {
                    dropdownMenu.style.opacity = "1";
                    dropdownMenu.style.visibility = "visible";
                    dropdownMenu.style.transform = "translateY(0)";
                  });

                  userDropdown.addEventListener("mouseleave", () => {
                    dropdownMenu.style.opacity = "0";
                    dropdownMenu.style.visibility = "hidden";
                    dropdownMenu.style.transform = "translateY(-10px)";
                  });
                }
              }

              if (userAreaMobile) {
                userAreaMobile.innerHTML = mobileUserHtml;
                userAreaMobile.dataset.loaded = "true";

                // Add mobile dropdown functionality
                const mobileUserDropdown = userAreaMobile.querySelector(
                  ".mobile-user-dropdown"
                );
                const mobileDropdownMenu = userAreaMobile.querySelector(
                  ".mobile-user-dropdown-menu"
                );

                if (mobileUserDropdown && mobileDropdownMenu) {
                  // Touch/click events for mobile
                  let isDropdownOpen = false;

                  mobileUserDropdown.addEventListener("click", (e) => {
                    // Check if clicking on the avatar link specifically
                    const avatarLink = e.target.closest(
                      'a[href="profile.html"]'
                    );
                    if (avatarLink) {
                      // Allow navigation to profile page
                      console.log("Navigating to profile page");
                      return; // Don't prevent default, let the link work
                    }

                    // For other clicks, toggle dropdown
                    e.preventDefault();
                    e.stopPropagation();

                    if (isDropdownOpen) {
                      // Close dropdown
                      mobileDropdownMenu.style.opacity = "0";
                      mobileDropdownMenu.style.visibility = "hidden";
                      mobileDropdownMenu.style.transform =
                        "translateX(-50%) translateY(10px)";
                      isDropdownOpen = false;
                    } else {
                      // Open dropdown
                      mobileDropdownMenu.style.opacity = "1";
                      mobileDropdownMenu.style.visibility = "visible";
                      mobileDropdownMenu.style.transform =
                        "translateX(-50%) translateY(0)";
                      isDropdownOpen = true;
                    }
                  });

                  // Close dropdown when clicking outside
                  document.addEventListener("click", (e) => {
                    if (!mobileUserDropdown.contains(e.target)) {
                      mobileDropdownMenu.style.opacity = "0";
                      mobileDropdownMenu.style.visibility = "hidden";
                      mobileDropdownMenu.style.transform =
                        "translateX(-50%) translateY(10px)";
                      isDropdownOpen = false;
                    }
                  });

                  // Add touch events for better mobile experience
                  mobileUserDropdown.addEventListener("touchstart", (e) => {
                    e.preventDefault();
                    // Don't toggle on touchstart, let click handle it
                  });
                }
              }
            });
            if (userArea) {
              userArea.innerHTML = userHtml;
              userArea.dataset.loaded = "true";
            }
            if (userAreaMobile) {
              userAreaMobile.innerHTML = mobileUserHtml;
              userAreaMobile.dataset.loaded = "true";
            }
          } else {
            console.log("No user found, showing login buttons");
            const loginHtml = `
            <a href="login.html" class="nav-btn login-btn">Login</a>
          `;
            const mobileLoginHtml = `
            <a href="login.html" class="nav-btn login-btn" style="display:flex;flex-direction:column;align-items:center;gap:2px;color:#25d366;font-size:0.65rem;padding:4px 2px;text-decoration:none;transition:all 0.3s ease;">
              <i class="fas fa-user" style="font-size:1.1rem;margin-bottom:1px;color:#25d366;"></i>
              <span style="font-size:0.6rem;color:#25d366;font-weight:600;">Login</span>
            </a>
          `;
            if (userArea) {
              userArea.innerHTML = loginHtml;
              userArea.dataset.loaded = "true";
              console.log("Desktop login button updated");
            }
            if (userAreaMobile) {
              userAreaMobile.innerHTML = mobileLoginHtml;
              userAreaMobile.dataset.loaded = "true";
              console.log("Mobile login button updated");
            }
          }
        })
        .catch((error) => {
          console.error("Error getting user:", error);
          this.hideSignInPopup();
          
          // Hide admin dashboard link when auth error
          const adminNavItem = document.getElementById("admin-nav-item");
          if (adminNavItem) {
            console.log("🔒 Auth error, hiding admin dashboard link");
            adminNavItem.style.display = "none";
          }
          
          // Show login on error
          const loginHtml = `
          <a href="login.html" class="nav-btn login-btn">Login</a>
        `;
          const mobileLoginHtml = `
          <a href="login.html" class="nav-btn login-btn" style="display:flex;flex-direction:column;align-items:center;gap:2px;color:#25d366;font-size:0.65rem;padding:4px 2px;text-decoration:none;transition:all 0.3s ease;">
            <i class="fas fa-user" style="font-size:1.1rem;margin-bottom:1px;color:#25d366;"></i>
            <span style="font-size:0.6rem;color:#25d366;font-weight:600;">Login</span>
          </a>
        `;
          if (userArea) {
            userArea.innerHTML = loginHtml;
            userArea.dataset.loaded = "true";
          }
          if (userAreaMobile) {
            userAreaMobile.innerHTML = mobileLoginHtml;
            userAreaMobile.dataset.loaded = "true";
          }
        });
    } else {
      // Fallback: always show login
      this.hideSignInPopup();
      const loginHtml = `
        <a href="login.html" class="nav-btn login-btn">Login</a>
      `;
      const mobileLoginHtml = `
        <a href="login.html" class="nav-btn login-btn" style="display:flex;flex-direction:column;align-items:center;gap:2px;color:#25d366;font-size:0.65rem;padding:4px 2px;text-decoration:none;transition:all 0.3s ease;">
          <i class="fas fa-user" style="font-size:1.1rem;margin-bottom:1px;color:#25d366;"></i>
          <span style="font-size:0.6rem;color:#25d366;font-weight:600;">Login</span>
        </a>
      `;
      if (userArea) {
        userArea.innerHTML = loginHtml;
        userArea.dataset.loaded = "true";
      }
      if (userAreaMobile) {
        userAreaMobile.innerHTML = mobileLoginHtml;
        userAreaMobile.dataset.loaded = "true";
      }
    }
  }

  showSignInPopup() {
    if (document.getElementById("sign-in-popup")) return;
    const popup = document.createElement("div");
    popup.id = "sign-in-popup";
    popup.style.cssText = `
      position: fixed;
      top: 24px;
      right: 24px;
      background: #222;
      color: #fff;
      padding: 14px 28px;
      border-radius: 10px;
      box-shadow: 0 4px 16px rgba(0,0,0,0.18);
      font-weight: 600;
      font-size: 1rem;
      z-index: 9999;
      display: flex;
      align-items: center;
      gap: 10px;
      opacity: 0;
      transition: opacity 0.3s;
    `;
    popup.innerHTML =
      '<span class="user-spinner" style="width:18px;height:18px;border-width:2px;"></span> Signing you in...';
    document.body.appendChild(popup);
    setTimeout(() => {
      popup.style.opacity = 1;
    }, 10);
  }

  hideSignInPopup() {
    const popup = document.getElementById("sign-in-popup");
    if (popup) {
      popup.style.opacity = 0;
      setTimeout(() => {
        if (popup.parentNode) popup.parentNode.removeChild(popup);
      }, 300);
    }
  }
}

// Help dropdown functions (global scope for onclick handlers)
function openLiveChat() {
  console.log("Opening live chat...");
  // Integrate with your live chat system
  // Example: window.Intercom && window.Intercom('show');
}

function openFAQ() {
  console.log("Opening FAQ...");
  // Example: window.location.href = '/faq';
}

function openGuide() {
  console.log("Opening buying guide...");
  // Example: window.location.href = '/buying-guide';
}

function openComparison() {
  console.log("Opening product comparison...");
  // Example: document.getElementById('compare-modal')?.classList.add('open');
}

// After the NavbarComponent class definition and before DOMContentLoaded
function updateMobileBottomNav() {
  console.log("updateMobileBottomNav called"); // Debug log

  // Use navbar's updateCounts for consistent counter management
  if (window.navbar && typeof window.navbar.updateCounts === "function") {
    console.log("Calling navbar.updateCounts() from updateMobileBottomNav");
    window.navbar.updateCounts();
  } else {
    console.log("Navbar component not available, using fallback");
    // Fallback: update cart count only
    const cartKey = window.currentUserId
      ? `cart_user_${window.currentUserId}`
      : "cart_guest";
    const cartItems = JSON.parse(localStorage.getItem(cartKey) || "[]");
    const cartCount = cartItems.reduce((count, item) => {
      const qty = parseInt(item.quantity, 10);
      return count + (isNaN(qty) ? 0 : qty);
    }, 0);
    const cartCountMobile = document.getElementById("cart-count-mobile");
    if (cartCountMobile) {
      cartCountMobile.textContent = cartCount;
      cartCountMobile.style.display = cartCount > 0 ? "flex" : "none";
    }
  }
}

// Enhanced mobile navbar functionality
window.setupMobileNavbar = function () {
  console.log("Setting up enhanced mobile navbar...");

  const mobileNavbar = document.querySelector(".mobile-bottom-navbar");
  if (!mobileNavbar) {
    console.log("Mobile navbar not found");
    return;
  }

  // Set active state based on current page
  const currentPage = window.location.pathname.split("/").pop() || "index.html";
  const navLinks = mobileNavbar.querySelectorAll(".nav-link");

  navLinks.forEach((link) => {
    const href = link.getAttribute("href");
    if (
      href === currentPage ||
      (currentPage === "index.html" && href === "index.html")
    ) {
      link.classList.add("active");
    }
  });

  // Enhanced dropdown functionality
  const categoriesBtn = document.getElementById("mobile-categories-btn");
  const categoriesMenu = document.getElementById(
    "mobile-categories-dropup-menu"
  );
  const messagesBtn = document.getElementById("mobile-messages-btn");
  const messagesMenu = document.getElementById("mobile-messages-dropup-menu");

  // Categories dropdown
  if (categoriesBtn && categoriesMenu) {
    let categoriesOpen = false;

    categoriesBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();

      if (categoriesOpen) {
        categoriesMenu.style.opacity = "0";
        categoriesMenu.style.visibility = "hidden";
        categoriesMenu.style.transform = "translateX(-50%) translateY(10px)";
        categoriesOpen = false;
      } else {
        // Close other dropdowns first
        if (messagesMenu) {
          messagesMenu.style.opacity = "0";
          messagesMenu.style.visibility = "hidden";
          messagesMenu.style.transform = "translateX(-50%) translateY(10px)";
        }

        categoriesMenu.style.opacity = "1";
        categoriesMenu.style.visibility = "visible";
        categoriesMenu.style.transform = "translateX(-50%) translateY(0)";
        categoriesOpen = true;
      }
    });
  }

  // Messages: navigate directly to message center
  if (messagesBtn) {
    messagesBtn.addEventListener("click", (e) => {
      e.preventDefault();
      window.location.href = "message-center.html";
    });
  }

  // Close dropdowns when clicking outside (only categories uses dropup now)
  document.addEventListener("click", (e) => {
    if (!mobileNavbar.contains(e.target)) {
      if (categoriesMenu) {
        categoriesMenu.style.opacity = "0";
        categoriesMenu.style.visibility = "hidden";
        categoriesMenu.style.transform = "translateX(-50%) translateY(10px)";
      }
    }
  });

  // Enhanced hover effects
  const navItems = mobileNavbar.querySelectorAll(".nav-item");
  navItems.forEach((item) => {
    const link = item.querySelector(".nav-link");
    if (link) {
      link.addEventListener("mouseenter", () => {
        link.style.transform = "translateY(-2px)";
      });

      link.addEventListener("mouseleave", () => {
        link.style.transform = "translateY(0)";
      });
    }
  });

  console.log("Enhanced mobile navbar setup complete");
};

// Initialize navbar when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  window.navbar = new NavbarComponent();

  // Call updateMobileBottomNav after a delay to ensure Supabase is loaded
  setTimeout(() => {
    updateMobileBottomNav();
    // Also update mobile nav directly for better reliability
    if (typeof updateMobileNavDirect === "function") {
      updateMobileNavDirect();
    }
    // Force test and update mobile navbar
    if (typeof testAuthAndUpdate === "function") {
      testAuthAndUpdate();
    }
    // Fix mobile navbar authentication
    if (typeof fixMobileNavbarAuth === "function") {
      fixMobileNavbarAuth();
    }
    // Sync mobile navbar with desktop
    if (typeof syncMobileWithDesktop === "function") {
      syncMobileWithDesktop();
    }
    // Setup enhanced mobile navbar functionality
    if (typeof setupMobileNavbar === "function") {
      setupMobileNavbar();
    }
  }, 1000);
});

// Listen for storage changes to update counts
window.addEventListener("storage", (e) => {
  if (
    e.key === "cartItems" ||
    e.key === "wishlistItems" ||
    e.key === "compareItems" ||
    e.key.includes("cart_")
  ) {
    window.navbar?.updateCounts();
    updateMobileBottomNav();
  }
});

// Make updateMobileBottomNav globally available
window.updateMobileBottomNav = updateMobileBottomNav;

// Add a function to force show mobile navbar for testing
window.forceShowMobileNavbar = function () {
  console.log("=== Force Showing Mobile Navbar for Testing ===");

  const mobileNavbar = document.querySelector(".mobile-bottom-navbar");
  if (mobileNavbar) {
    // Force show the mobile navbar
    mobileNavbar.style.display = "flex";
    mobileNavbar.style.position = "fixed";
    mobileNavbar.style.bottom = "0";
    mobileNavbar.style.left = "0";
    mobileNavbar.style.right = "0";
    mobileNavbar.style.width = "100%";
    mobileNavbar.style.height = "50px";
    mobileNavbar.style.zIndex = "3001";
    mobileNavbar.style.background = "#1a1a1a";
    mobileNavbar.style.borderTop = "1px solid #333";
    mobileNavbar.style.boxShadow = "0 -1px 3px rgba(0, 0, 0, 0.1)";

    // Add padding to body to prevent content overlap
    document.body.style.paddingBottom = "50px";

    console.log("✅ Mobile navbar forced to show");

    // Test the authentication and update
    if (typeof testAuthAndUpdate === "function") {
      testAuthAndUpdate();
    }
  } else {
    console.log("❌ Mobile navbar element not found");
  }
};

// Add a function to hide mobile navbar
window.hideMobileNavbar = function () {
  console.log("=== Hiding Mobile Navbar ===");

  const mobileNavbar = document.querySelector(".mobile-bottom-navbar");
  if (mobileNavbar) {
    mobileNavbar.style.display = "none";
    document.body.style.paddingBottom = "";
    console.log("✅ Mobile navbar hidden");
  }
};

// Add a function to toggle mobile navbar visibility
window.toggleMobileNavbar = function () {
  const mobileNavbar = document.querySelector(".mobile-bottom-navbar");
  if (mobileNavbar) {
    if (mobileNavbar.style.display === "flex") {
      hideMobileNavbar();
    } else {
      forceShowMobileNavbar();
    }
  }
};

// Add a function to force update mobile navbar
window.forceUpdateMobileNav = function () {
  console.log("Force updating mobile navbar...");
  if (typeof updateMobileNavDirect === "function") {
    updateMobileNavDirect();
  }
  if (window.navbar && typeof window.navbar.updateUserArea === "function") {
    window.navbar.updateUserArea();
  }
};

// Set up auth state change listener
function setupAuthListener() {
  if (window.supabase && window.supabase.auth) {
    window.supabase.auth.onAuthStateChange((event, session) => {
      console.log(
        "Auth state changed:",
        event,
        session ? "User logged in" : "User logged out"
      );
      // Reset loaded state so user area can update
      const userArea = document.getElementById("user-area");
      const userAreaMobile = document.getElementById("user-area-mobile");
      if (userArea) {
        userArea.dataset.loaded = "false";
        console.log("Reset desktop user area");
      }
      if (userAreaMobile) {
        userAreaMobile.dataset.loaded = "false";
        console.log("Reset mobile user area");
      }

      updateMobileBottomNav();
      // Also update the navbar component user area
      if (window.navbar && typeof window.navbar.updateUserArea === "function") {
        window.navbar.updateUserArea();
      }

      // Sync mobile navbar with desktop after auth change
      setTimeout(() => {
        if (typeof syncMobileWithDesktop === "function") {
          syncMobileWithDesktop();
        }
      }, 500);
    });
  } else {
    // Retry after a delay if Supabase isn't loaded yet
    setTimeout(setupAuthListener, 500);
  }
}

// Initialize auth listener
setupAuthListener();

// Global logout function
async function logout() {
  try {
    // Clear localStorage user data
    localStorage.removeItem("user");

    if (window.supabase && window.supabase.auth) {
      const { error } = await window.supabase.auth.signOut();
      if (error) {
        console.error("Error logging out:", error);
      } else {
        // Redirect to home page
        window.location.href = "index.html";
      }
    } else {
      // Fallback redirect
      window.location.href = "index.html";
    }
  } catch (error) {
    console.error("Error in logout:", error);
    window.location.href = "index.html";
  }
}

// Add a manual test function
window.testMobileNav = function () {
  console.log("Testing mobile nav update...");
  updateMobileBottomNav();
};

// Add a test function for mobile navbar
window.testMobileNavbar = function () {
  console.log("Testing mobile navbar functionality...");

  // Test 1: Check if mobile navbar exists
  const mobileNavbar = document.querySelector(".mobile-bottom-navbar");
  console.log("Mobile navbar found:", !!mobileNavbar);

  // Test 2: Check if user area exists
  const userAreaMobile = document.getElementById("user-area-mobile");
  console.log("Mobile user area found:", !!userAreaMobile);

  // Test 3: Check current display state
  if (mobileNavbar) {
    console.log("Mobile navbar display:", mobileNavbar.style.display);
    console.log("Window width:", window.innerWidth);
    console.log("Should show on mobile:", window.innerWidth <= 480);
  }

  // Test 4: Force show mobile navbar
  if (mobileNavbar && window.innerWidth <= 480) {
    mobileNavbar.style.display = "flex";
    console.log("Forced mobile navbar to show");
  }

  // Test 5: Update user area
  if (window.navbar && typeof window.navbar.updateUserArea === "function") {
    window.navbar.updateUserArea();
    console.log("Updated user area");
  }
};

// Add a function to force show login button for testing
window.forceShowLogin = function () {
  console.log("Forcing show login button...");
  const userAreaMobile = document.getElementById("user-area-mobile");
  if (userAreaMobile) {
    userAreaMobile.dataset.loaded = "false";
    userAreaMobile.innerHTML = `
      <a href="login.html" class="nav-btn login-btn" style="display:flex;flex-direction:column;align-items:center;gap:2px;color:#25d366;font-size:0.65rem;padding:4px 2px;text-decoration:none;transition:all 0.3s ease;">
        <i class="fas fa-user" style="font-size:1.1rem;margin-bottom:1px;color:#25d366;"></i>
        <span style="font-size:0.6rem;color:#25d366;font-weight:600;">Login</span>
      </a>
    `;
    console.log("Forced login button display");
  }
};

// Add a function to test authentication state
window.testAuthState = async function () {
  console.log("Testing authentication state...");

  if (typeof window.supabase === "undefined") {
    console.log("❌ Supabase not available");
    return;
  }

  try {
    const {
      data: { user },
      error,
    } = await window.supabase.auth.getUser();
    if (error) {
      console.log("❌ Auth error:", error.message);
    } else if (user) {
      console.log("✅ User logged in:", user.email);
    } else {
      console.log("❌ No user logged in");
    }
  } catch (error) {
    console.log("❌ Error checking auth:", error);
  }
};

// Add a function to reset user area and force update
window.resetUserArea = function () {
  console.log("Resetting user area...");
  const userArea = document.getElementById("user-area");
  const userAreaMobile = document.getElementById("user-area-mobile");

  if (userArea) {
    userArea.dataset.loaded = "false";
    console.log("Reset desktop user area");
  }

  if (userAreaMobile) {
    userAreaMobile.dataset.loaded = "false";
    console.log("Reset mobile user area");
  }

  // Force update user area
  if (window.navbar && typeof window.navbar.updateUserArea === "function") {
    window.navbar.updateUserArea();
    console.log("Forced user area update");
  }
};

// Add a function to test the complete authentication flow
window.testCompleteAuthFlow = async function () {
  console.log("=== Testing Complete Authentication Flow ===");

  // Step 1: Check current auth state
  await testAuthState();

  // Step 2: Reset user areas
  resetUserArea();

  // Step 3: Wait a moment and check again
  setTimeout(async () => {
    console.log("=== After Reset ===");
    await testAuthState();

    // Step 4: Check what's displayed in mobile user area
    const userAreaMobile = document.getElementById("user-area-mobile");
    if (userAreaMobile) {
      console.log(
        "Mobile user area content:",
        userAreaMobile.innerHTML.substring(0, 200)
      );
    }
  }, 1000);
};

// Add a function to test profile linking
window.testProfileLink = function () {
  console.log("=== Testing Profile Link ===");

  const userAreaMobile = document.getElementById("user-area-mobile");
  if (userAreaMobile) {
    const profileLink = userAreaMobile.querySelector('a[href="profile.html"]');
    if (profileLink) {
      console.log("✅ Profile link found:", profileLink.href);
      console.log("Link text:", profileLink.textContent);

      // Test clicking the link
      console.log("Clicking profile link...");
      profileLink.click();
    } else {
      console.log("❌ Profile link not found");
    }
  } else {
    console.log("❌ Mobile user area not found");
  }
};

// Add a simple direct update function
window.updateMobileNavDirect = async function () {
  console.log("Direct mobile nav update called");
  const userAreaMobile = document.getElementById("user-area-mobile");

  if (!userAreaMobile) {
    console.log("userAreaMobile element not found");
    return;
  }

  // Check if Supabase is available
  if (typeof window.supabase === "undefined") {
    console.log("Supabase not available, showing login link");
    userAreaMobile.innerHTML = `
      <a href="login.html" class="nav-btn login-btn" style="display:flex;flex-direction:column;align-items:center;gap:2px;color:#25d366;font-size:0.65rem;padding:4px 2px;text-decoration:none;transition:all 0.3s ease;">
        <i class="fas fa-user" style="font-size:1.1rem;margin-bottom:1px;color:#25d366;"></i>
        <span style="font-size:0.6rem;color:#25d366;font-weight:600;">Login</span>
      </a>
    `;
    return;
  }

  try {
    // Get current user from Supabase
    const {
      data: { user },
      error: userError,
    } = await window.supabase.auth.getUser();

    if (userError || !user) {
      console.log("No user logged in, showing login link");
      userAreaMobile.innerHTML = `
        <a href="login.html" class="nav-btn login-btn" style="display:flex;flex-direction:column;align-items:center;gap:2px;color:#25d366;font-size:0.65rem;padding:4px 2px;text-decoration:none;transition:all 0.3s ease;">
          <i class="fas fa-user" style="font-size:1.1rem;margin-bottom:1px;color:#25d366;"></i>
          <span style="font-size:0.6rem;color:#25d366;font-weight:600;">Login</span>
        </a>
      `;
      return;
    }

    console.log("User logged in, showing profile with user data");

    // Get user profile data for display
    let userInfo = {
      displayName: user.email?.split("@")[0] || "User",
      initials: user.email?.[0]?.toUpperCase() || "U",
      hasName: false,
    };

    try {
      const { data: profile, error } = await window.supabase
        .from("profiles")
        .select("name, username")
        .eq("id", user.id)
        .single();

      if (profile && profile.name) {
        userInfo = {
          displayName: profile.name,
          initials: profile.name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase(),
          hasName: true,
        };
      } else if (profile && profile.username) {
        userInfo = {
          displayName: profile.username,
          initials: profile.username[0].toUpperCase(),
          hasName: true,
        };
      }
    } catch (profileError) {
      console.log("Profile not found, using default user info");
    }

    // Create enhanced mobile user HTML
    const mobileUserHtml = this.createMobileUserHTML(userInfo);

    userAreaMobile.innerHTML = mobileUserHtml;

    // Add mobile dropdown functionality
    const mobileUserDropdown = userAreaMobile.querySelector(
      ".mobile-user-dropdown"
    );
    const mobileDropdownMenu = userAreaMobile.querySelector(
      ".mobile-user-dropdown-menu"
    );

    if (mobileUserDropdown && mobileDropdownMenu) {
      // Touch/click events for mobile
      let isDropdownOpen = false;

      mobileUserDropdown.addEventListener("click", (e) => {
        // Check if clicking on the avatar link specifically
        const avatarLink = e.target.closest('a[href="profile.html"]');
        if (avatarLink) {
          // Allow navigation to profile page
          console.log("Navigating to profile page");
          return; // Don't prevent default, let the link work
        }

        // For other clicks, toggle dropdown
        e.preventDefault();
        e.stopPropagation();

        if (isDropdownOpen) {
          // Close dropdown
          mobileDropdownMenu.style.opacity = "0";
          mobileDropdownMenu.style.visibility = "hidden";
          mobileDropdownMenu.style.transform =
            "translateX(-50%) translateY(10px)";
          isDropdownOpen = false;
        } else {
          // Open dropdown
          mobileDropdownMenu.style.opacity = "1";
          mobileDropdownMenu.style.visibility = "visible";
          mobileDropdownMenu.style.transform = "translateX(-50%) translateY(0)";
          isDropdownOpen = true;
        }
      });

      // Close dropdown when clicking outside
      document.addEventListener("click", (e) => {
        if (!mobileUserDropdown.contains(e.target)) {
          mobileDropdownMenu.style.opacity = "0";
          mobileDropdownMenu.style.visibility = "hidden";
          mobileDropdownMenu.style.transform =
            "translateX(-50%) translateY(10px)";
          isDropdownOpen = false;
        }
      });

      // Add touch events for better mobile experience
      mobileUserDropdown.addEventListener("touchstart", (e) => {
        e.preventDefault();
        // Don't toggle on touchstart, let click handle it
      });
    }
  } catch (error) {
    console.error("Error updating mobile nav:", error);
    // Fallback to login link
    userAreaMobile.innerHTML = `
      <a href="login.html" class="nav-btn login-btn" style="display:flex;flex-direction:column;align-items:center;gap:2px;color:#25d366;font-size:0.65rem;padding:4px 2px;text-decoration:none;transition:all 0.3s ease;">
        <i class="fas fa-user" style="font-size:1.1rem;margin-bottom:1px;color:#25d366;"></i>
        <span style="font-size:0.6rem;color:#25d366;font-weight:600;">Login</span>
      </a>
    `;
  }
};

// Function to manually update message count (can be called from admin)
window.updateMessageCount = async function () {
  if (window.navbar && typeof window.navbar.updateMessageCount === "function") {
    await window.navbar.updateMessageCount();
  }
};

// Add a simple test function to check auth state and force update
window.testAuthAndUpdate = async function () {
  console.log("=== Testing Authentication and Mobile Navbar ===");

  // Check if Supabase is available
  if (typeof window.supabase === "undefined") {
    console.log("❌ Supabase not available");
    return;
  }

  try {
    // Get current user
    const {
      data: { user },
      error,
    } = await window.supabase.auth.getUser();

    if (error) {
      console.log("❌ Auth error:", error.message);
      return;
    }

    if (user) {
      console.log("✅ User logged in:", user.email);
      console.log("User ID:", user.id);

      // Force update mobile navbar to show account
      const userAreaMobile = document.getElementById("user-area-mobile");
      if (userAreaMobile) {
        console.log("Found mobile user area, updating...");

        // Get user profile data
        let userInfo = {
          displayName: user.email?.split("@")[0] || "User",
          initials: user.email?.[0]?.toUpperCase() || "U",
          hasName: false,
        };

        try {
          const { data: profile, error: profileError } = await window.supabase
            .from("profiles")
            .select("name, username")
            .eq("id", user.id)
            .single();

          if (profile && profile.name) {
            userInfo = {
              displayName: profile.name,
              initials: profile.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase(),
              hasName: true,
            };
          } else if (profile && profile.username) {
            userInfo = {
              displayName: profile.username,
              initials: profile.username[0].toUpperCase(),
              hasName: true,
            };
          }
        } catch (profileError) {
          console.log("Profile not found, using default user info");
        }

        // Create mobile user HTML
        const mobileUserHtml = this.createMobileUserHTML(userInfo);

        userAreaMobile.innerHTML = mobileUserHtml;
        userAreaMobile.dataset.loaded = "true";

        console.log("✅ Mobile navbar updated to show Account");

        // Add dropdown functionality
        const mobileUserDropdown = userAreaMobile.querySelector(
          ".mobile-user-dropdown"
        );
        const mobileDropdownMenu = userAreaMobile.querySelector(
          ".mobile-user-dropdown-menu"
        );

        if (mobileUserDropdown && mobileDropdownMenu) {
          let isDropdownOpen = false;

          mobileUserDropdown.addEventListener("click", (e) => {
            const avatarLink = e.target.closest('a[href="profile.html"]');
            if (avatarLink) {
              console.log("Navigating to profile page");
              return;
            }

            e.preventDefault();
            e.stopPropagation();

            if (isDropdownOpen) {
              mobileDropdownMenu.style.opacity = "0";
              mobileDropdownMenu.style.visibility = "hidden";
              mobileDropdownMenu.style.transform =
                "translateX(-50%) translateY(10px)";
              isDropdownOpen = false;
            } else {
              mobileDropdownMenu.style.opacity = "1";
              mobileDropdownMenu.style.visibility = "visible";
              mobileDropdownMenu.style.transform =
                "translateX(-50%) translateY(0)";
              isDropdownOpen = true;
            }
          });

          document.addEventListener("click", (e) => {
            if (!mobileUserDropdown.contains(e.target)) {
              mobileDropdownMenu.style.opacity = "0";
              mobileDropdownMenu.style.visibility = "hidden";
              mobileDropdownMenu.style.transform =
                "translateX(-50%) translateY(10px)";
              isDropdownOpen = false;
            }
          });
        }
      } else {
        console.log("❌ Mobile user area not found");
      }
    } else {
      console.log("❌ No user logged in");
      const userAreaMobile = document.getElementById("user-area-mobile");
      if (userAreaMobile) {
        userAreaMobile.innerHTML = `
          <a href="login.html" class="nav-btn login-btn" style="display:flex;flex-direction:column;align-items:center;gap:2px;color:#25d366;font-size:0.65rem;padding:4px 2px;text-decoration:none;transition:all 0.3s ease;">
            <i class="fas fa-user" style="font-size:1.1rem;margin-bottom:1px;color:#25d366;"></i>
            <span style="font-size:0.6rem;color:#25d366;font-weight:600;">Login</span>
          </a>
        `;
        console.log("✅ Mobile navbar updated to show Login");
      }
    }
  } catch (error) {
    console.error("❌ Error in testAuthAndUpdate:", error);
  }
};

// Add a comprehensive mobile navbar authentication fix
window.fixMobileNavbarAuth = async function () {
  console.log("=== Fixing Mobile Navbar Authentication ===");

  // Check if Supabase is available
  if (typeof window.supabase === "undefined") {
    console.log("❌ Supabase not available");
    return;
  }

  try {
    // Get current user
    const {
      data: { user },
      error,
    } = await window.supabase.auth.getUser();

    if (error) {
      console.log("❌ Auth error:", error.message);
      return;
    }

    console.log("🔍 Current user:", user ? user.email : "No user");

    // Get mobile user area
    const userAreaMobile = document.getElementById("user-area-mobile");
    if (!userAreaMobile) {
      console.log("❌ Mobile user area not found");
      return;
    }

    if (user) {
      console.log("✅ User logged in, updating mobile navbar...");

      // Get user profile data
      let userInfo = {
        displayName: user.email?.split("@")[0] || "User",
        initials: user.email?.[0]?.toUpperCase() || "U",
        hasName: false,
      };

      try {
        const { data: profile, error: profileError } = await window.supabase
          .from("profiles")
          .select("name, username")
          .eq("id", user.id)
          .single();

        if (profile && profile.name) {
          userInfo = {
            displayName: profile.name,
            initials: profile.name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase(),
            hasName: true,
          };
        } else if (profile && profile.username) {
          userInfo = {
            displayName: profile.username,
            initials: profile.username[0].toUpperCase(),
            hasName: true,
          };
        }
      } catch (profileError) {
        console.log("Profile not found, using default user info");
      }

      // Create mobile user HTML with Account display
      const mobileUserHtml = this.createMobileUserHTML(userInfo);

      // Update the mobile user area
      userAreaMobile.innerHTML = mobileUserHtml;
      userAreaMobile.dataset.loaded = "true";

      console.log("✅ Mobile navbar updated to show Account");

      // Add dropdown functionality
      const mobileUserDropdown = userAreaMobile.querySelector(
        ".mobile-user-dropdown"
      );
      const mobileDropdownMenu = userAreaMobile.querySelector(
        ".mobile-user-dropdown-menu"
      );

      if (mobileUserDropdown && mobileDropdownMenu) {
        let isDropdownOpen = false;

        mobileUserDropdown.addEventListener("click", (e) => {
          const avatarLink = e.target.closest('a[href="profile.html"]');
          if (avatarLink) {
            console.log("Navigating to profile page");
            return;
          }

          e.preventDefault();
          e.stopPropagation();

          if (isDropdownOpen) {
            mobileDropdownMenu.style.opacity = "0";
            mobileDropdownMenu.style.visibility = "hidden";
            mobileDropdownMenu.style.transform =
              "translateX(-50%) translateY(10px)";
            isDropdownOpen = false;
          } else {
            mobileDropdownMenu.style.opacity = "1";
            mobileDropdownMenu.style.visibility = "visible";
            mobileDropdownMenu.style.transform =
              "translateX(-50%) translateY(0)";
            isDropdownOpen = true;
          }
        });

        document.addEventListener("click", (e) => {
          if (!mobileUserDropdown.contains(e.target)) {
            mobileDropdownMenu.style.opacity = "0";
            mobileDropdownMenu.style.visibility = "hidden";
            mobileDropdownMenu.style.transform =
              "translateX(-50%) translateY(10px)";
            isDropdownOpen = false;
          }
        });
      }
    } else {
      console.log("❌ No user logged in, showing Login");
      userAreaMobile.innerHTML = `
        <a href="login.html" class="nav-btn login-btn" style="display:flex;flex-direction:column;align-items:center;gap:2px;color:#25d366;font-size:0.65rem;padding:4px 2px;text-decoration:none;transition:all 0.3s ease;">
          <i class="fas fa-user" style="font-size:1.1rem;margin-bottom:1px;color:#25d366;"></i>
          <span style="font-size:0.6rem;color:#25d366;font-weight:600;">Login</span>
        </a>
      `;
      console.log("✅ Mobile navbar updated to show Login");
    }
  } catch (error) {
    console.error("❌ Error in fixMobileNavbarAuth:", error);
  }
};

// Add a function to check and sync navbar states
window.checkNavbarStates = function () {
  console.log("=== Checking Navbar States ===");

  // Check desktop navbar
  const userArea = document.getElementById("user-area");
  const userAreaMobile = document.getElementById("user-area-mobile");

  console.log("Desktop user area:", userArea ? "Found" : "Not found");
  console.log("Mobile user area:", userAreaMobile ? "Found" : "Not found");

  if (userArea) {
    console.log(
      "Desktop navbar content:",
      userArea.innerHTML.substring(0, 200)
    );
  }

  if (userAreaMobile) {
    console.log(
      "Mobile navbar content:",
      userAreaMobile.innerHTML.substring(0, 200)
    );
  }

  // Check if mobile navbar is visible
  const mobileNavbar = document.querySelector(".mobile-bottom-navbar");
  if (mobileNavbar) {
    console.log("Mobile navbar display:", mobileNavbar.style.display);
    console.log("Mobile navbar visibility:", mobileNavbar.style.visibility);
  }
};

// Add a function to force sync mobile navbar with desktop
window.syncMobileWithDesktop = async function () {
  console.log("=== Syncing Mobile Navbar with Desktop ===");

  const userArea = document.getElementById("user-area");
  const userAreaMobile = document.getElementById("user-area-mobile");

  if (!userArea || !userAreaMobile) {
    console.log("❌ User areas not found");
    return;
  }

  // Check if desktop shows account (user is logged in)
  const desktopHasAccount =
    userArea.innerHTML.includes("user-avatar") ||
    userArea.innerHTML.includes("user-dropdown");

  console.log("Desktop shows account:", desktopHasAccount);

  if (desktopHasAccount) {
    console.log("✅ Desktop shows account, updating mobile...");

    // Get user info from desktop navbar
    const userAvatar = userArea.querySelector(".user-avatar");
    const userInitials = userAvatar ? userAvatar.textContent.trim() : "U";

    // Create mobile account display
    const mobileUserHtml = `
      <div class="mobile-user-dropdown" style="position:relative;">
        <a href="profile.html" class="user-avatar" style="display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;color:#25d366;font-size:0.65rem;padding:4px 2px;transition:all 0.3s ease;text-decoration:none;">
          <div style="width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,#25d366,#128c7e);display:flex;align-items:center;justify-content:center;color:#111;font-weight:700;font-size:1rem;margin-bottom:2px;border:2px solid rgba(37,211,102,0.3);box-shadow:0 3px 10px rgba(37,211,102,0.3);position:relative;overflow:hidden;">
            <span style="position:relative;z-index:2;">${userInitials}</span>
            <div style="position:absolute;top:0;left:0;right:0;bottom:0;background:linear-gradient(45deg,transparent,rgba(255,255,255,0.1),transparent);animation:pulse 2s infinite;"></div>
          </div>
          <span style="font-size:0.6rem;color:#25d366;font-weight:600;">Account</span>
        </a>
        <div class="mobile-user-dropdown-menu" style="position:absolute;bottom:100%;left:50%;transform:translateX(-50%);background:#1a1a1a;border:1px solid #333;border-radius:12px;padding:8px;margin-bottom:8px;min-width:160px;box-shadow:0 8px 24px rgba(0,0,0,0.3);opacity:0;visibility:hidden;transition:all 0.3s ease;z-index:1000;">
          <div style="padding:8px 12px;border-bottom:1px solid #333;margin-bottom:8px;text-align:center;">
            <div style="font-weight:600;color:#25d366;font-size:0.85rem;">User</div>
            <div style="color:#999;font-size:0.7rem;">Logged In</div>
          </div>
          <a href="profile.html" style="display:flex;align-items:center;gap:8px;padding:8px 12px;color:#ccc;text-decoration:none;border-radius:6px;transition:all 0.2s ease;font-size:0.8rem;">
            <i class="fas fa-user-edit" style="color:#25d366;font-size:0.9rem;"></i>
            <span>Edit Profile</span>
          </a>
          <a href="profile.html#orders" style="display:flex;align-items:center;gap:8px;padding:8px 12px;color:#ccc;text-decoration:none;border-radius:6px;transition:all 0.2s ease;font-size:0.8rem;">
            <i class="fas fa-shopping-bag" style="color:#25d366;font-size:0.9rem;"></i>
            <span>My Orders</span>
          </a>
          <a href="profile.html#messages" style="display:flex;align-items:center;gap:8px;padding:8px 12px;color:#ccc;text-decoration:none;border-radius:6px;transition:all 0.2s ease;font-size:0.8rem;">
            <i class="fas fa-bell" style="color:#25d366;font-size:0.9rem;"></i>
            <span>Messages</span>
          </a>
          <div style="border-top:1px solid #333;margin:8px 0;"></div>
          <button onclick="logout()" style="display:flex;align-items:center;gap:8px;padding:8px 12px;color:#ff4757;text-decoration:none;border-radius:6px;transition:all 0.2s ease;background:none;border:none;width:100%;text-align:left;cursor:pointer;font-size:0.8rem;">
            <i class="fas fa-sign-out-alt" style="font-size:0.9rem;"></i>
            <span>Logout</span>
          </button>
        </div>
      </div>
    `;

    userAreaMobile.innerHTML = mobileUserHtml;
    console.log("✅ Mobile navbar synced with desktop");
  } else {
    console.log("❌ Desktop shows login, updating mobile...");
    userAreaMobile.innerHTML = `
      <a href="login.html" class="nav-btn login-btn" style="display:flex;flex-direction:column;align-items:center;gap:2px;color:#25d366;font-size:0.65rem;padding:4px 2px;text-decoration:none;transition:all 0.3s ease;">
        <i class="fas fa-user" style="font-size:1.1rem;margin-bottom:1px;color:#25d366;"></i>
        <span style="font-size:0.6rem;color:#25d366;font-weight:600;">Login</span>
      </a>
    `;
    console.log("✅ Mobile navbar updated to show Login");
  }
};

// Export for module systems
if (typeof module !== "undefined" && module.exports) {
  module.exports = NavbarComponent;
}
// Add a function to test localStorage user data
window.testLocalStorageUser = function () {
  console.log("Testing localStorage user data...");

  const userData = localStorage.getItem("user");
  console.log("localStorage user data:", userData);

  if (userData) {
    try {
      const parsed = JSON.parse(userData);
      console.log("✅ Parsed user data:", parsed);
      return parsed;
    } catch (error) {
      console.log("❌ Error parsing user data:", error);
      return null;
    }
  } else {
    console.log("❌ No user data in localStorage");
    return null;
  }
};

// Add a function to manually set test user data
window.setTestUser = function () {
  const testUser = {
    name: "Test User",
    email: "test@example.com",
    id: "test-user-id",
  };

  localStorage.setItem("user", JSON.stringify(testUser));
  console.log("✅ Test user data set:", testUser);

  // Update navbar if available
  if (window.navbar && typeof window.navbar.updateUserArea === "function") {
    window.navbar.updateUserArea();
    console.log("✅ Navbar updated with test user");
  } else {
    console.log("❌ Navbar not available");
  }
};

// Add a function to clear test user data
window.clearTestUser = function () {
  localStorage.removeItem("user");
  console.log("✅ Test user data cleared");

  // Update navbar if available
  if (window.navbar && typeof window.navbar.updateUserArea === "function") {
    window.navbar.updateUserArea();
    console.log("✅ Navbar updated (cleared user)");
  } else {
    console.log("❌ Navbar not available");
  }
};

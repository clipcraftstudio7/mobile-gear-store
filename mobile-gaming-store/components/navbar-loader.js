// Navbar Loader Component
document.addEventListener("DOMContentLoaded", function () {
  const navbarContainer = document.getElementById("navbar-container");
  
  // Navbar loader initialized

  // Always load top announcement bar even if a page doesn't use navbar-container
  try {
    const annIdEarly = 'top-announcement-bar-script';
    if (!document.getElementById(annIdEarly)) {
      const sEarly = document.createElement('script');
      sEarly.id = annIdEarly;
      const currentPath = window.location.pathname;
      const isInProductsFolderEarly = currentPath.includes('/products/');
      const pEarly = isInProductsFolderEarly ? '../components/top-announcement-bar.js' : 'components/top-announcement-bar.js';
      sEarly.src = pEarly;
      sEarly.defer = true;
      document.body.appendChild(sEarly);
    }
  } catch (e) {
    console.warn('Failed to early-load top announcement bar', e);
  }

  if (navbarContainer) {
    // Load navbar HTML with better path resolution
    const currentPath = window.location.pathname;
    const isInProductsFolder = currentPath.includes('/products/');
    const navbarPath = isInProductsFolder ? '../components/navbar.html' : 'components/navbar.html';
    
    fetch(navbarPath)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.text();
      })
      .then((html) => {
        navbarContainer.innerHTML = html;
        // Navbar loaded successfully

        // Initialize navbar functionality after loading
        initializeNavbar();
        
        // Ensure site-wide banner popup is loaded once per page
        try {
          const bannerScriptId = 'site-banner-script';
          if (!document.getElementById(bannerScriptId)) {
            const bannerScript = document.createElement('script');
            bannerScript.id = bannerScriptId;
            const bannerPath = isInProductsFolder ? '../components/site-banner.js' : 'components/site-banner.js';
            bannerScript.src = bannerPath;
            bannerScript.defer = true;
            document.body.appendChild(bannerScript);
          }
        } catch (e) {
          console.warn('Failed to load site banner script', e);
        }

        // Load top announcement bar above navbar
        try {
          const annId = 'top-announcement-bar-script';
          if (!document.getElementById(annId)) {
            const s = document.createElement('script');
            s.id = annId;
            const p = isInProductsFolder ? '../components/top-announcement-bar.js' : 'components/top-announcement-bar.js';
            s.src = p;
            s.defer = true;
            document.body.appendChild(s);
          }
        } catch (e) {
          console.warn('Failed to load top announcement bar', e);
        }
        
        // Make navbar loader available globally for external calls
        window.navbarLoader = {
          initializeUserAuth,
          initializeMobileUserAuth, 
          updateCartCount,
          refreshNavbarData: async function() {
            await updateCartCount();
            await initializeUserAuth();
            await initializeMobileUserAuth();
          }
        };
        
        // Ensure navbar is visible
        const navbar = document.querySelector('.navbar');
        if (navbar) {
          navbar.style.display = 'flex';
          navbar.style.visibility = 'visible';
          navbar.style.position = 'fixed';
          navbar.style.top = '0';
          navbar.style.left = '0';
          navbar.style.width = '100%';
          navbar.style.zIndex = '1000';
                  // Navbar visibility ensured
      } else {
        // Navbar element not found after loading
      }
      })
      .catch((error) => {
        console.error("Error loading navbar:", error);
        console.log("Attempted to load navbar from:", navbarPath);
        console.log("Current location:", window.location.href);
        // Fallback navbar if loading fails
        navbarContainer.innerHTML = `
                    <nav class="navbar" id="navbar">
                        <div class="nav-container">
                            <div class="nav-logo">
                                <a href="/">
                                    <i class="fas fa-gamepad"></i>
                                    <span>Mobile Gear Hub</span>
                                </a>
                            </div>
                            <div class="search-container">
                                <i class="fas fa-search search-icon"></i>
                                <input type="text" class="search-input" placeholder="Search gaming gear, accessories..." id="search-input" />
                                <button class="search-btn" id="search-btn">
                                    <i class="fas fa-search"></i>
                                </button>
                            </div>
                            <ul class="nav-menu">
                                <li><a href="#categories">Categories</a></li>
                                <li><a href="help-center.html">Help Center</a></li>
                                <li><a href="about.html">About</a></li>
                            </ul>
                            <div class="nav-actions">
                                <a href="cart.html" class="nav-btn cart-btn" id="cart-btn">
                                    <i class="fas fa-shopping-cart"></i>
                                    <span class="cart-count" id="cart-count"></span>
                                </a>
                                <div id="user-area">
                                    <div class="user-skeleton">
                                        <span class="user-spinner"></span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </nav>
                `;
        initializeNavbar();
        
        // Ensure fallback navbar is visible
        const navbar = document.querySelector('.navbar');
        if (navbar) {
          navbar.style.display = 'flex';
          navbar.style.visibility = 'visible';
          navbar.style.position = 'fixed';
          navbar.style.top = '0';
          navbar.style.left = '0';
          navbar.style.width = '100%';
          navbar.style.zIndex = '1000';
          console.log("Fallback navbar visibility ensured");
        } else {
          console.log("Fallback navbar element not found");
        }
      });
  }
});

async function initializeNavbar() {
  console.log("Initializing navbar...");
  
  // Initialize search functionality
  const searchInput = document.getElementById("search-input");
  const searchBtn = document.getElementById("search-btn");

  if (searchInput && searchBtn) {
    console.log("Search elements found, adding event listeners");
    searchBtn.addEventListener("click", function () {
      performSearch(searchInput.value);
    });

    searchInput.addEventListener("keypress", function (e) {
      if (e.key === "Enter") {
        performSearch(searchInput.value);
      }
    });
  } else {
    console.log("Search elements not found");
  }

  // Initialize cart count
  await updateCartCount();

  // Initialize user authentication with Supabase
  initializeUserAuth();

  // Initialize mobile navbar functionality
  initializeMobileNavbar();
  
  console.log("Navbar initialization complete");
}

function performSearch(query) {
  if (query.trim()) {
    window.location.href = `search-results.html?q=${encodeURIComponent(query)}`;
  }
}

function _getSupabaseClientSafe() {
  if (window._ptSupabaseClient) return window._ptSupabaseClient;
  if (window.supabaseClient) return window.supabaseClient;
  if (window.supabase && typeof window.supabase.auth?.getUser === 'function') return window.supabase;
  return null;
}

async function updateCartCount() {
  const cartCount = document.getElementById("cart-count");
  if (cartCount) {
    // Updating Cart Count

    // Try to get current user ID from multiple sources
    let currentUserId = window.currentUserId;
    const client = _getSupabaseClientSafe();
    if (!currentUserId && client) {
      try {
        const { data: { session } = {} } = await client.auth.getSession();
        if (session && session.user) {
          currentUserId = session.user.id;
          window.currentUserId = currentUserId;
        }
      } catch (error) {
        console.log("Could not get user from Supabase session:", error);
      }
    }

    const cartKey = currentUserId ? `cart_user_${currentUserId}` : "cart_guest";
    const cart = JSON.parse(localStorage.getItem(cartKey) || "[]");
    const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 0), 0);

    cartCount.textContent = totalItems;
    cartCount.style.display = totalItems > 0 ? "flex" : "none";

    const mobileCartCount = document.getElementById("cart-count-mobile");
    if (mobileCartCount) {
      mobileCartCount.textContent = totalItems;
      mobileCartCount.style.display = totalItems > 0 ? "flex" : "none";
      // Mobile cart count updated
    }
  } else {
    // Cart count element not found
  }
}

async function initializeUserAuth() {
  const userArea = document.getElementById("user-area");
  if (!userArea) return;

  try {
    const client = _getSupabaseClientSafe();
    if (!client || typeof client.auth?.getUser !== 'function') {
      console.log("Supabase client not ready, retrying in 300ms...");
      // Supabase not ready; retry shortly
      setTimeout(initializeUserAuth, 300);
      return;
    }
    
    console.log("✅ Supabase client ready, getting user...");
    const { data: { user } = {}, error } = await client.auth.getUser();

    // Handle admin dashboard link visibility
    const ADMIN_ID = "b34bceb9-af1a-48f3-9460-f0d83d89b10b";
    const adminNavItem = document.getElementById("admin-nav-item");

    if (error) {
      console.error("Auth error:", error);
      if (adminNavItem) {
        adminNavItem.style.display = "none";
        console.log("🔒 Auth error, hiding admin dashboard link");
      }
      showGuestUser(userArea);
    } else if (user) {
      console.log("✅ User logged in:", user.email);
      window.currentUserId = user.id;
      
      // Check if user is admin and show/hide admin dashboard link
      if (adminNavItem) {
        if (user.id === ADMIN_ID) {
          adminNavItem.style.display = "block";
          console.log("✅ Admin user detected, showing admin dashboard link");
        } else {
          adminNavItem.style.display = "none";
          console.log("👤 Regular user, hiding admin dashboard link");
        }
      }
      
      showLoggedInUser(userArea, user);
    } else {
      console.log("👤 No user logged in, showing guest");
      if (adminNavItem) {
        adminNavItem.style.display = "none";
        console.log("🔒 No user, hiding admin dashboard link");
      }
      showGuestUser(userArea);
    }
  } catch (error) {
    console.error("Error initializing user auth:", error);
    showGuestUser(userArea);
  }
}

function showLoggedInUser(userArea, user) {
  // Helper function to truncate long usernames
  const truncateUsername = (username, maxLength = 15) => {
    if (!username) return "User";
    if (username.length <= maxLength) return username;
    return username.substring(0, maxLength - 3) + "...";
  };

  // Get user display info consistently
  const getUserDisplayInfo = (userData) => {
    let displayName = "User";
    let initials = "U";
    let fullName = "User";

    if (userData.name) {
      displayName = truncateUsername(userData.name);
      fullName = userData.name;
      initials = userData.name.split(" ").map(n => n[0]).join("").toUpperCase().substring(0, 2);
    } else if (userData.username) {
      displayName = truncateUsername(userData.username);
      fullName = userData.username;
      initials = userData.username[0].toUpperCase();
    } else if (userData.email) {
      const emailName = userData.email.split("@")[0];
      displayName = truncateUsername(emailName);
      fullName = emailName;
      initials = emailName[0].toUpperCase();
    }

    return { displayName, initials, fullName };
  };

  const userInfo = getUserDisplayInfo({ email: user.email, name: user.name, username: user.username });
  
  userArea.innerHTML = `
    <div class="dropdown" style="position: relative;">
      <button class="nav-btn" style="
        background: rgba(37, 211, 102, 0.15);
        color: #25d366;
        border: 1px solid rgba(37, 211, 102, 0.4);
        border-radius: 12px;
        padding: 10px 16px;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 14px;
        font-weight: 600;
        transition: all 0.3s ease;
        min-width: 60px;
        max-width: 200px;
        justify-content: center;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      "
      onmouseover="this.style.background='rgba(37, 211, 102, 0.25)'; this.style.borderColor='#25d366';"
      onmouseout="this.style.background='rgba(37, 211, 102, 0.15)'; this.style.borderColor='rgba(37, 211, 102, 0.4)';"
      title="${userInfo.fullName}"
      >
        <i class="fas fa-user-circle" style="font-size: 14px; color: #25d366; flex-shrink: 0;"></i>
        <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${userInfo.displayName}</span>
        <i class="fas fa-chevron-down" style="font-size: 10px; margin-left: 2px; flex-shrink: 0;"></i>
      </button>
      <div class="dropdown-content" style="
        display: none;
        position: absolute;
        top: 110%;
        right: 0;
        background: #1c1c1c;
        border: 1px solid #333;
        border-radius: 12px;
        padding: 8px 0;
        min-width: 200px;
        max-width: 280px;
        z-index: 1001;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
        backdrop-filter: blur(10px);
      ">
        <div style="padding: 8px 12px; border-bottom: 1px solid #333; margin-bottom: 8px;">
          <div style="font-weight: 600; color: #25d366; font-size: 0.9rem; word-break: break-word; line-height: 1.3;" title="${userInfo.fullName}">${userInfo.displayName}</div>
          <div style="color: #999; font-size: 0.75rem; word-break: break-all;">${user.email || "user@example.com"}</div>
        </div>
        <a href="profile.html" style="
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 18px;
          color: #fff;
          text-decoration: none;
          font-size: 14px;
          transition: background 0.2s ease;
        "
        onmouseover="this.style.background='rgba(37, 211, 102, 0.1)';"
        onmouseout="this.style.background='transparent';"
        >
          <i class="fas fa-user-circle" style="color: #25d366;"></i>
          Profile
        </a>
        <a href="#" onclick="logout()" style="
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 18px;
          color: #ff4757;
          text-decoration: none;
          font-size: 14px;
          transition: background 0.2s ease;
        "
        onmouseover="this.style.background='rgba(255, 71, 87, 0.1)';"
        onmouseout="this.style.background='transparent';"
        >
          <i class="fas fa-sign-out-alt"></i>
          Logout
        </a>
      </div>
    </div>
  `;

  // Add dropdown functionality
  const dropdown = userArea.querySelector(".dropdown");
  const dropdownContent = userArea.querySelector(".dropdown-content");

  if (dropdown && dropdownContent) {
    dropdown.addEventListener("click", function (e) {
      e.stopPropagation();
      const isVisible = dropdownContent.style.display === "block";
      dropdownContent.style.display = isVisible ? "none" : "block";
    });

    // Close dropdown when clicking outside
    document.addEventListener("click", function () {
      dropdownContent.style.display = "none";
    });
  }
}

function showGuestUser(userArea) {
  userArea.innerHTML = `
    <a href="login.html" class="nav-btn login-btn" style="
      background: rgba(37, 211, 102, 0.1);
      color: #25d366;
      border: 1px solid rgba(37, 211, 102, 0.4);
      border-radius: 12px;
      padding: 10px 18px;
      text-decoration: none;
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      font-weight: 600;
      transition: all 0.3s ease;
      min-width: 60px;
      justify-content: center;
    "
    onmouseover="this.style.background='rgba(37, 211, 102, 0.2)'; this.style.borderColor='#25d366';"
    onmouseout="this.style.background='rgba(37, 211, 102, 0.1)'; this.style.borderColor='rgba(37, 211, 102, 0.4)';"
    >
      <i class="fas fa-sign-in-alt" style="font-size: 14px;"></i>
      <span>Login</span>
    </a>
  `;
}

async function logout() {
  try {
    if (typeof window.supabase !== "undefined") {
      const supabase = window.supabase;
      await supabase.auth.signOut();
    }
    // Clear any localStorage user data
    localStorage.removeItem("user");
    localStorage.removeItem("currentUser");
    localStorage.removeItem("userData");

    // Refresh the page or update UI
    window.location.reload();
  } catch (error) {
    console.error("Logout error:", error);
  }
}

function initializeMobileNavbar() {
  console.log("=== Initializing Mobile Navbar ===");
  
  // Show mobile navbar on mobile devices
  const mobileNavbar = document.querySelector(".mobile-bottom-navbar");
  if (mobileNavbar) {
    // Check if we're on a mobile device
    const isMobile = window.innerWidth <= 768;
    if (isMobile) {
      mobileNavbar.style.display = "block";
      console.log("Mobile navbar shown on mobile device");
      
      // Test if mobile navbar is visible
      setTimeout(() => {
        const computedStyle = window.getComputedStyle(mobileNavbar);
        console.log("Mobile navbar display:", computedStyle.display);
        console.log("Mobile navbar visibility:", computedStyle.visibility);
        console.log("Mobile navbar opacity:", computedStyle.opacity);
      }, 100);
    } else {
      mobileNavbar.style.display = "none";
      console.log("Mobile navbar hidden on desktop");
    }
  } else {
    console.log("Mobile navbar element not found");
  }
  
  // Mobile categories dropdown
  const categoriesBtn = document.getElementById("mobile-categories-btn");
  const categoriesMenu = document.getElementById(
    "mobile-categories-dropup-menu"
  );
  
  console.log("Categories button found:", !!categoriesBtn);
  console.log("Categories menu found:", !!categoriesMenu);

  if (categoriesBtn && categoriesMenu) {
    categoriesBtn.addEventListener("click", function (e) {
      e.preventDefault();
      const isVisible = categoriesMenu.style.display === "block";
      if (isVisible) {
        categoriesMenu.style.display = "none";
        categoriesMenu.style.opacity = "0";
        categoriesMenu.style.visibility = "hidden";
      } else {
        categoriesMenu.style.display = "block";
        categoriesMenu.style.opacity = "1";
        categoriesMenu.style.visibility = "visible";
      }

      // Close messages menu if open
      const messagesMenu = document.getElementById(
        "mobile-messages-dropup-menu"
      );
      if (messagesMenu) {
        messagesMenu.style.display = "none";
        messagesMenu.style.opacity = "0";
        messagesMenu.style.visibility = "hidden";
      }
    });
  }

  // Mobile messages dropdown
  const messagesBtn = document.getElementById("mobile-messages-btn");
  const messagesMenu = document.getElementById("mobile-messages-dropup-menu");
  
  console.log("Messages button found:", !!messagesBtn);
  console.log("Messages menu found:", !!messagesMenu);
  
  if (messagesBtn) {
    console.log("Messages button href:", messagesBtn.href);
    console.log("Messages button onclick:", messagesBtn.onclick);
    console.log("Messages button style:", messagesBtn.style.cssText);
  }

  if (messagesBtn && messagesMenu) {
    console.log("Adding click event listener to messages button");
    
    // Test if button is clickable
    messagesBtn.style.cursor = "pointer";
    messagesBtn.style.pointerEvents = "auto";
    
    // Remove any existing event listeners to prevent conflicts
    const newMessagesBtn = messagesBtn.cloneNode(true);
    messagesBtn.parentNode.replaceChild(newMessagesBtn, messagesBtn);
    
    newMessagesBtn.addEventListener("click", function (e) {
      console.log("Messages button clicked!");
      e.preventDefault();
      
      // Toggle messages dropdown menu
      const isVisible = messagesMenu.style.display === "block";
      console.log("Messages menu currently visible:", isVisible);
      if (isVisible) {
        messagesMenu.style.display = "none";
        messagesMenu.style.opacity = "0";
        messagesMenu.style.visibility = "hidden";
        console.log("Hiding messages menu");
      } else {
        messagesMenu.style.display = "block";
        messagesMenu.style.opacity = "1";
        messagesMenu.style.visibility = "visible";
        messagesMenu.style.zIndex = "1001";
        messagesMenu.style.pointerEvents = "auto";
        console.log("Showing messages menu");
        console.log("Menu display:", messagesMenu.style.display);
        console.log("Menu opacity:", messagesMenu.style.opacity);
        console.log("Menu visibility:", messagesMenu.style.visibility);
        console.log("Menu z-index:", messagesMenu.style.zIndex);
      }

      // Close categories menu if open
      const categoriesMenu = document.getElementById(
        "mobile-categories-dropup-menu"
      );
      if (categoriesMenu) {
        categoriesMenu.style.display = "none";
        categoriesMenu.style.opacity = "0";
        categoriesMenu.style.visibility = "hidden";
      }
    });
    
    // Update the reference to use the new button
    const updatedMessagesBtn = newMessagesBtn;

    // Mark all read functionality
    const markAllReadBtn = messagesMenu.querySelector(".mark-all-read");
    if (markAllReadBtn) {
      markAllReadBtn.addEventListener("click", function (e) {
        e.stopPropagation();
        markAllMobileMessagesAsRead();
      });
    }

    // View all messages functionality
    const viewAllMessagesBtn = messagesMenu.querySelector(".view-all-messages");
    if (viewAllMessagesBtn) {
      viewAllMessagesBtn.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        window.location.href = "message-center.html";
      });
    }
  }

  // Hide dropdowns when clicking outside
  document.addEventListener("click", function (e) {
    if (
      categoriesMenu &&
      !categoriesBtn.contains(e.target) &&
      !categoriesMenu.contains(e.target)
    ) {
      categoriesMenu.style.display = "none";
      categoriesMenu.style.opacity = "0";
      categoriesMenu.style.visibility = "hidden";
    }
    if (
      messagesMenu &&
      !updatedMessagesBtn.contains(e.target) &&
      !messagesMenu.contains(e.target)
    ) {
      messagesMenu.style.display = "none";
      messagesMenu.style.opacity = "0";
      messagesMenu.style.visibility = "hidden";
    }
  });

  // Update mobile cart count
  updateMobileCartCount();

  // Initialize mobile user area
  initializeMobileUserAuth();

  // Initialize mobile message count and periodic updates
  
  // Handle window resize for mobile navbar visibility
  window.addEventListener('resize', function() {
    const mobileNavbar = document.querySelector(".mobile-bottom-navbar");
    if (mobileNavbar) {
      const isMobile = window.innerWidth <= 768;
      mobileNavbar.style.display = isMobile ? "block" : "none";
    }
  });
  initializeMobileMessageCount();
  
  // Force initial message count update
  setTimeout(() => {
    updateMobileMessageCount();
  }, 1000);
  
  // Debug message count
  setTimeout(() => {
    const messageCount = document.getElementById("message-count-mobile");
    if (messageCount) {
      console.log("=== Message Count Debug ===");
      console.log("Message count element found:", !!messageCount);
      console.log("Current count text:", messageCount.textContent);
      console.log("Current display style:", messageCount.style.display);
      console.log("Computed display:", window.getComputedStyle(messageCount).display);
      
      if (window.messageCenter) {
        const unreadCount = window.messageCenter.getUnreadMessages().length;
        console.log("Message center unread count:", unreadCount);
        console.log("All messages:", window.messageCenter.messages);
      }
    }
  }, 2000);
}

function updateMobileCartCount() {
  const cartCount = document.getElementById("cart-count-mobile");
  if (cartCount) {
    const cartKey = window.currentUserId
      ? `cart_user_${window.currentUserId}`
      : "cart_guest";
    const cart = JSON.parse(localStorage.getItem(cartKey) || "[]");
    const totalItems = cart.reduce(
      (sum, item) => sum + (item.quantity || 0),
      0
    );
    cartCount.textContent = totalItems;
    cartCount.style.display = totalItems > 0 ? "flex" : "none";
  }
}

// Mobile Messages Management
async function loadMobileMessages() {
  const messagesList = document.getElementById("mobile-messages-list");
  if (!messagesList) return;

  try {
    // Show loading state
    messagesList.innerHTML = '<div style="color: #ccc; text-align: center; padding: 10px;">Loading messages...</div>';

    // Try to load from database first
    if (window.supabase) {
      const { data: { user }, error: userError } = await window.supabase.auth.getUser();
      if (!userError && user) {
        const { data: messages, error } = await window.supabase
          .from("messages")
          .select("*")
          .eq("receiver_id", user.id)
          .order("created_at", { ascending: false })
          .limit(5); // Show last 5 messages

        if (!error && messages && messages.length > 0) {
          renderMobileMessages(messages);
          updateMobileMessageCount(messages.filter(m => !m.is_read).length);
          return;
        }
      }
    }

    // Fallback to localStorage
    const savedMessages = JSON.parse(localStorage.getItem("messages") || "[]");
    if (savedMessages.length > 0) {
      const recentMessages = savedMessages.slice(0, 5);
      renderMobileMessages(recentMessages);
      updateMobileMessageCount(recentMessages.filter(m => m.unread).length);
    } else {
      messagesList.innerHTML = '<div style="color: #ccc; text-align: center; padding: 10px;">No messages yet</div>';
      updateMobileMessageCount(0);
    }
  } catch (error) {
    console.error("Error loading mobile messages:", error);
    messagesList.innerHTML = '<div style="color: #ff4757; text-align: center; padding: 10px;">Error loading messages</div>';
  }
}

function renderMobileMessages(messages) {
  const messagesList = document.getElementById("mobile-messages-list");
  if (!messagesList) return;

  if (!messages || messages.length === 0) {
    messagesList.innerHTML = '<div style="color: #ccc; text-align: center; padding: 10px;">No messages yet</div>';
    return;
  }

  const messagesHtml = messages.map(msg => {
    const isUnread = msg.unread || !msg.is_read;
    const messageContent = msg.content || msg.text || "No content";
    const messageTitle = msg.title || messageContent.split(':')[0] || "Message";
    const messageText = messageContent.includes(':') ? messageContent.split(':').slice(1).join(':').trim() : messageContent;
    const messageTime = formatMessageTime(msg.created_at || msg.time);
    const messageIcon = getMessageIcon(msg.message_type || msg.type);

    return `
      <div class="message-item ${isUnread ? 'unread' : ''}" data-message-id="${msg.id}">
        <div class="message-icon">
          <i class="${messageIcon}"></i>
        </div>
        <div class="message-content">
          <div class="message-title">${messageTitle}</div>
          <div class="message-text">${messageText}</div>
          <div class="message-time">${messageTime}</div>
        </div>
      </div>
    `;
  }).join('');

  messagesList.innerHTML = messagesHtml;

  // Add click listeners for marking as read
  messagesList.querySelectorAll('.message-item').forEach(item => {
    item.addEventListener('click', async () => {
      const messageId = parseInt(item.dataset.messageId);
      await markMobileMessageAsRead(messageId);
      item.classList.remove('unread');
      updateMobileMessageCount();
    });
  });
}

async function markMobileMessageAsRead(messageId) {
  try {
    // Update in Supabase if available
    if (window.supabase && window.supabase.auth) {
      const { data: { user } } = await window.supabase.auth.getUser();
      if (user) {
        await window.supabase
          .from("messages")
          .update({ is_read: true })
          .eq("id", messageId)
          .eq("receiver_id", user.id);
      }
    }

    // Update in localStorage
    const savedMessages = JSON.parse(localStorage.getItem("messages") || "[]");
    const messageIndex = savedMessages.findIndex(m => m.id === messageId);
    if (messageIndex !== -1) {
      savedMessages[messageIndex].unread = false;
      localStorage.setItem("messages", JSON.stringify(savedMessages));
    }
  } catch (error) {
    console.error("Error marking message as read:", error);
  }
}

async function markAllMobileMessagesAsRead() {
  try {
    // Update in Supabase if available
    if (window.supabase && window.supabase.auth) {
      const { data: { user } } = await window.supabase.auth.getUser();
      if (user) {
        await window.supabase
          .from("messages")
          .update({ is_read: true })
          .eq("receiver_id", user.id)
          .eq("is_read", false);
      }
    }

    // Update in localStorage
    const savedMessages = JSON.parse(localStorage.getItem("messages") || "[]");
    savedMessages.forEach(msg => msg.unread = false);
    localStorage.setItem("messages", JSON.stringify(savedMessages));

    // Update UI
    const messagesList = document.getElementById("mobile-messages-list");
    if (messagesList) {
      messagesList.querySelectorAll('.message-item').forEach(item => {
        item.classList.remove('unread');
      });
    }

    updateMobileMessageCount(0);
  } catch (error) {
    console.error("Error marking all messages as read:", error);
  }
}

function getMessageIcon(type) {
  const iconMap = {
    order: "fas fa-shopping-cart",
    offer: "fas fa-tag",
    wishlist: "fas fa-heart",
    system: "fas fa-cog",
    promo: "fas fa-bullhorn",
  };
  return iconMap[type] || "fas fa-bell";
}

function formatMessageTime(timeString) {
  const time = new Date(timeString);
  const now = new Date();
  const diffMs = now - time;
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) {
    return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
  } else if (diffHours > 0) {
    return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  } else {
    return "Just now";
  }
}

function updateMobileMessageCount(count) {
  const messageCount = document.getElementById("message-count-mobile");
  if (messageCount) {
    if (count !== undefined) {
      messageCount.textContent = count;
      messageCount.style.display = count > 0 ? "flex" : "none";
    } else {
      // Calculate from current messages
      const messagesList = document.getElementById("mobile-messages-list");
      if (messagesList) {
        const unreadCount = messagesList.querySelectorAll(".message-item.unread").length;
        messageCount.textContent = unreadCount;
        messageCount.style.display = unreadCount > 0 ? "flex" : "none";
      }
    }
  }
}

async function initializeMobileMessageCount() {
  // Initial load
  await loadMobileMessages();
  
  // Set up periodic updates every 30 seconds
  setInterval(async () => {
    await loadMobileMessages();
  }, 30000);

  // Also update when message center updates
  if (window.messageCenter) {
    const originalUpdateCount = window.messageCenter.updateMessageCount;
    window.messageCenter.updateMessageCount = function() {
      originalUpdateCount.call(this);
      updateMobileMessageCount();
    };
  }
  
  // Force update message count on page load
  setTimeout(async () => {
    try {
      if (window.supabase) {
        const { data: { user }, error: userError } = await window.supabase.auth.getUser();
        if (!userError && user) {
          const { data: messages, error } = await window.supabase
            .from("messages")
            .select("id")
            .eq("receiver_id", user.id)
            .eq("is_read", false);
          
          const unreadCount = messages ? messages.length : 0;
          updateMobileMessageCount(unreadCount);
        }
      } else {
        // Fallback to localStorage
        const savedMessages = JSON.parse(localStorage.getItem("messages") || "[]");
        const unreadCount = savedMessages.filter(m => m.unread || !m.is_read).length;
        updateMobileMessageCount(unreadCount);
      }
    } catch (error) {
      console.error("Error updating initial message count:", error);
    }
  }, 2000);
}

async function initializeMobileUserAuth() {
  const userArea = document.getElementById("user-area-mobile");
  if (!userArea) {
    console.log("Mobile user area not found");
    return;
  }

  try {
    const client = _getSupabaseClientSafe();
    if (!client || typeof client.auth?.getUser !== 'function') {
      console.log("Mobile: Supabase client not ready, retrying in 300ms...");
      setTimeout(initializeMobileUserAuth, 300);
      return;
    }
    
    console.log("✅ Mobile: Supabase client ready, getting user...");
    const { data: { user } = {}, error } = await client.auth.getUser();

    if (error) {
      console.error("Mobile auth error:", error);
      showMobileGuestUser(userArea);
    } else if (user) {
      console.log("✅ Mobile: User logged in:", user.email);
      window.currentUserId = user.id;
      showMobileLoggedInUser(userArea, user);
    } else {
      console.log("👤 Mobile: No user logged in, showing guest");
      showMobileGuestUser(userArea);
    }
  } catch (error) {
    console.error("Error initializing mobile user auth:", error);
    showMobileGuestUser(userArea);
  }
}

function showMobileLoggedInUser(userArea, user) {
  // Helper function to truncate long usernames
  const truncateUsername = (username, maxLength = 15) => {
    if (!username) return "User";
    if (username.length <= maxLength) return username;
    return username.substring(0, maxLength - 3) + "...";
  };

  // Get user display info consistently
  const getUserDisplayInfo = (userData) => {
    let displayName = "User";
    let initials = "U";
    let fullName = "User";

    if (userData.name) {
      displayName = truncateUsername(userData.name);
      fullName = userData.name;
      initials = userData.name.split(" ").map(n => n[0]).join("").toUpperCase().substring(0, 2);
    } else if (userData.username) {
      displayName = truncateUsername(userData.username);
      fullName = userData.username;
      initials = userData.username[0].toUpperCase();
    } else if (userData.email) {
      const emailName = userData.email.split("@")[0];
      displayName = truncateUsername(emailName);
      fullName = emailName;
      initials = emailName[0].toUpperCase();
    }

    return { displayName, initials, fullName };
  };

  const userInfo = getUserDisplayInfo({ email: user.email, name: user.name, username: user.username });
  
  userArea.innerHTML = `
    <a href="profile.html" class="user-avatar" style="
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      background: rgba(37, 211, 102, 0.15);
      color: #25d366;
      border: 1px solid rgba(37, 211, 102, 0.4);
      border-radius: 50%;
      text-decoration: none;
      font-weight: 600;
      font-size: 16px;
      transition: all 0.3s ease;
    "
    onmouseover="this.style.background='rgba(37, 211, 102, 0.25)'; this.style.borderColor='#25d366';"
    onmouseout="this.style.background='rgba(37, 211, 102, 0.15)'; this.style.borderColor='rgba(37, 211, 102, 0.4)';"
    title="${userInfo.fullName}"
    >
      ${userInfo.initials}
    </a>
  `;
}

function showMobileGuestUser(userArea) {
  userArea.innerHTML = `
    <a href="login.html" class="login-btn" style="
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      background: rgba(37, 211, 102, 0.1);
      color: #25d366;
      border: 1px solid rgba(37, 211, 102, 0.4);
      border-radius: 50%;
      text-decoration: none;
      font-size: 16px;
      transition: all 0.3s ease;
    "
    onmouseover="this.style.background='rgba(37, 211, 102, 0.2)'; this.style.borderColor='#25d366';"
    onmouseout="this.style.background='rgba(37, 211, 102, 0.1)'; this.style.borderColor='rgba(37, 211, 102, 0.4)';"
    >
      <i class="fas fa-sign-in-alt"></i>
    </a>
  `;
}

// Function to refresh all navbar data
async function refreshNavbarData() {
  console.log("Refreshing navbar data...");

  // Update cart count
  await updateCartCount();

  // Update user authentication
  await initializeUserAuth();

  // Update mobile cart count
  updateMobileCartCount();

  // Update mobile user auth
  await initializeMobileUserAuth();

  console.log("Navbar data refreshed");
}

// Debug function to test cart count
window.testCartCount = function () {
  console.log("=== Testing Cart Count ===");
  console.log("window.currentUserId:", window.currentUserId);
  console.log(
    "window.supabase available:",
    typeof window.supabase !== "undefined"
  );

  // Check all possible cart keys
  const cartKeys = Object.keys(localStorage).filter((key) =>
    key.includes("cart")
  );
  console.log("All cart keys in localStorage:", cartKeys);

  cartKeys.forEach((key) => {
    const cart = JSON.parse(localStorage.getItem(key) || "[]");
    const totalItems = cart.reduce(
      (sum, item) => sum + (item.quantity || 0),
      0
    );
    console.log(`${key}: ${totalItems} items`, cart);
  });

  // Force update cart count
  updateCartCount();
};

// Export functions for use in other scripts
window.navbarLoader = {
  updateCartCount,
  initializeUserAuth,
  updateMobileCartCount,
  updateMobileMessageCount,
  initializeMobileUserAuth,
  logout,
  refreshNavbarData,
  testCartCount,
};

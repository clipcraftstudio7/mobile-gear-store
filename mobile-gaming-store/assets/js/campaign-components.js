// Campaign Components for Flash Sales, Banners, and Popups
// This file contains all the frontend components for the campaign system

class CampaignComponents {
  constructor() {
    // Separate sources: non-flash (hero/banner/popup) vs flash sales
    this.heroBannerCampaigns = [];
    this.flashCampaigns = [];
    this.popupShown = false;
    this.sessionId = this.generateSessionId();
    this.init();
  }

  // Initialize campaign components
  async init() {
    try {
      await this.loadCampaigns();
      this.renderCampaignHero();
      this.renderBannerStrip();
      this.renderFlashSales();
      this.renderFlashTeaser();
      this.renderBannerGrid();
      this.initPopupSystem();
      this.startCountdownTimers();
    } catch (error) {
      console.error('Error initializing campaign components:', error);
    }
  }

  // Generate unique session ID for guest users
  generateSessionId() {
    const existingId = localStorage.getItem('campaign_session_id');
    if (existingId) return existingId;
    
    const newId = 'guest-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('campaign_session_id', newId);
    return newId;
  }

  // Load campaigns from APIs: non-flash for banners/popups and flash for sales
  async loadCampaigns() {
    try {
      const [nonFlashRes, flashRes] = await Promise.all([
        fetch('/campaigns/active'), // hero/banner/popup
        fetch('/flashsales') // flash
      ]);
      const nonFlashData = await nonFlashRes.json();
      const flashData = await flashRes.json();
      this.heroBannerCampaigns = (nonFlashData && nonFlashData.campaigns) ? nonFlashData.campaigns : [];
      this.flashCampaigns = (flashData && flashData.campaigns) ? flashData.campaigns : [];
      console.log('Loaded campaigns:', {
        nonFlash: this.heroBannerCampaigns.length,
        flash: this.flashCampaigns.length
      });
    } catch (error) {
      console.error('Error loading campaigns:', error);
      this.heroBannerCampaigns = [];
      this.flashCampaigns = [];
    }
  }

  // Render campaign hero banner
  renderCampaignHero() {
    const heroCampaigns = this.heroBannerCampaigns.filter(c => 
      c.type === 'hero' && c.is_active
    );

    if (heroCampaigns.length === 0) return;

    const heroContainer = document.getElementById('campaign-hero');
    if (!heroContainer) return;

    const campaign = heroCampaigns[0]; // Show first active hero campaign
    const assets = campaign.campaign_assets || [];
    const heroAsset = assets.find(a => a.metadata?.position === 'hero');

    const heroHTML = `
      <div class="campaign-hero" data-campaign-id="${campaign.id}">
        <div class="hero-background" style="background-image: url('${heroAsset?.url || ''}')">
          <div class="hero-content">
            <h2 class="hero-title">${campaign.title}</h2>
            <p class="hero-description">${campaign.description}</p>
            <div class="hero-cta">
              <button class="hero-button" onclick="campaignComponents.handleHeroClick(${campaign.id})">
                ${campaign.preview_payload?.cta_text || 'Shop Now'}
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    heroContainer.innerHTML = heroHTML;
  }

  // Render small banner strip under hero
  renderBannerStrip() {
    const bannerCampaigns = this.heroBannerCampaigns.filter(c => (c.type === 'banner' || c.type === 'hero') && c.is_active);
    if (bannerCampaigns.length === 0) return;
    const strip = document.getElementById('campaign-banner-strip');
    if (!strip) return;
    const items = [];
    bannerCampaigns.forEach(c => {
      (c.campaign_assets || []).forEach(a => {
        const pos = (a.metadata && a.metadata.position) || 'strip';
        if (pos === 'strip') items.push({ c, a });
      });
    });
    if (!items.length) return;
    strip.innerHTML = `
      <div class="banner-strip">
        ${items.map(({c,a}) => `
          <div class="banner-pill" title="${a.alt || c.title}" onclick="campaignComponents.viewCampaign('${c.slug}')">
            ${a.url ? `<img src="${a.url}" alt="${a.alt || ''}"/>` : ''}
            <span>${c.title}</span>
          </div>
        `).join('')}
      </div>
    `;
  }

  // Render banner grid section below flash sales
  renderBannerGrid() {
    const section = document.getElementById('banner-grid');
    if (!section) return;
    // Use active hero/banner types
    const bannerCampaigns = this.heroBannerCampaigns.filter(c => (c.type === 'banner' || c.type === 'hero') && c.is_active);
    const cards = [];
    bannerCampaigns.forEach(c => {
      (c.campaign_assets || []).forEach(a => {
        // show assets that are not popup; prefer metadata.position in ['strip','grid','hero']
        const pos = (a.metadata && a.metadata.position) || 'grid';
        if (pos === 'grid' || pos === 'hero') {
          cards.push({ c, a });
        }
      });
    });
    if (!cards.length) {
      section.innerHTML = '';
      return;
    }
    section.innerHTML = cards.map(({c,a}) => `
      <div class="banner-card" onclick="campaignComponents.viewCampaign('${c.slug}')">
        ${a.url ? `<img src="${a.url}" alt="${a.alt || c.title}">` : ''}
        <div class="banner-card-body">
          <div class="banner-card-title">${c.title}</div>
          <div class="banner-card-text">${c.description || ''}</div>
        </div>
      </div>
    `).join('');
  }

  // Render flash sales section
  renderFlashSales() {
    const flashCampaigns = this.flashCampaigns.filter(c => 
      c.type === 'flash' && c.is_active && c.status === 'active'
    );

    if (flashCampaigns.length === 0) return;

    const flashContainer = document.getElementById('flash-sales-section');
    if (!flashContainer) return;

    let flashHTML = '<div class="flash-sales-container">';
    flashHTML += '<h2 class="flash-title">🔥 Flash Sales</h2>';
    flashHTML += '<div class="flash-grid">';

    flashCampaigns.forEach(campaign => {
      flashHTML += this.renderFlashCard(campaign);
    });

    flashHTML += '</div></div>';
    flashContainer.innerHTML = flashHTML;
  }

  // Render compact flash sale teaser (first active sale, countdown + a few products)
  renderFlashTeaser() {
    const teaser = document.getElementById('flash-sales-teaser');
    if (!teaser) return;

    const flashCampaigns = this.flashCampaigns.filter(c => c.type === 'flash' && c.is_active && c.status === 'active');
    if (!flashCampaigns.length) { teaser.innerHTML = ''; return; }

    const campaign = flashCampaigns[0];
    const products = (campaign.campaign_products || []).slice(0, 3);

    teaser.innerHTML = `
      <div class="flash-teaser" data-campaign-id="${campaign.id}" style="
        background: rgba(255,255,255,0.03); border: 1px solid #333; border-radius: 16px; padding: 14px; 
        margin: 16px auto; max-width: 1200px;">
        <div class="flash-teaser-header" style="display:flex; align-items:center; justify-content:space-between; gap:12px; margin-bottom:10px;">
          <div style="display:flex; align-items:center; gap:8px;">
            <span style="font-weight:800; color:#25d366;">🔥 Flash Sale</span>
            <span style="color:#aaa; font-size:0.9rem;">${campaign.title || ''}</span>
          </div>
          <div class="flash-countdown" data-end-time="${campaign.end_at}" style="color:#ffa502; font-weight:700;">
            Ends in <span class="countdown-time" id="countdown-${campaign.id}">${this.formatCountdown(campaign.time_left_seconds)}</span>
          </div>
        </div>
        <div class="flash-teaser-products" style="display:grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap:10px;">
          ${products.map(p => {
            const originalPrice = p.original_price || p.product?.price || 0;
            const salePrice = p.sale_price || 0;
            const discount = originalPrice > 0 ? Math.round(((originalPrice - salePrice) / originalPrice) * 100) : 0;
            const remainingStock = p.remaining_reserved_stock || 0;
            return `
              <div class="flash-teaser-card" style="
                background: rgba(255,255,255,0.03); border:1px solid #333; border-radius:12px; padding:10px;">
                <div style="position:relative;">
                  <img src="${p.product?.image || 'assets/images/default-product.jpg'}" alt="${p.product?.name || 'Product'}" style="width:100%; height:120px; object-fit:cover; border-radius:8px;"/>
                  ${discount > 0 ? `<div style=\"position:absolute; top:6px; right:6px; background:#ff4757; color:#fff; font-size:.7rem; border-radius:999px; padding:2px 6px;\">-${discount}%</div>` : ''}
                </div>
                <div style="margin-top:8px;">
                  <div style="font-size:.95rem; color:#fff; font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${p.product?.name || 'Product'}</div>
                  <div style="display:flex; align-items:center; gap:6px; margin-top:4px;">
                    <span style="text-decoration:line-through; color:#777; font-size:.9rem;">$${(originalPrice/100).toFixed(2)}</span>
                    <span style="color:#25d366; font-size:1rem; font-weight:800;">$${(salePrice/100).toFixed(2)}</span>
                  </div>
                </div>
              </div>`;
          }).join('')}
        </div>
        <div style="margin-top:10px; display:flex; justify-content:flex-end;">
          <button onclick="campaignComponents.viewAllFlash('${campaign.slug}')" style="
            background: linear-gradient(45deg, #25d366, #128c7e); color:#111; border:none; padding:8px 12px; border-radius:8px; font-weight:800;">View All</button>
        </div>
      </div>
    `;
  }

  // Render individual flash sale card
  renderFlashCard(campaign) {
    const products = campaign.campaign_products || [];
    const featuredProducts = products.slice(0, 4); // Show first 4 products

    return `
      <div class="flash-card" data-campaign-id="${campaign.id}">
        <div class="flash-header">
          <h3 class="flash-card-title">${campaign.title}</h3>
          <div class="flash-countdown" data-end-time="${campaign.end_at}">
            <span class="countdown-label">Ends in:</span>
            <span class="countdown-time" id="countdown-${campaign.id}">
              ${this.formatCountdown(campaign.time_left_seconds)}
            </span>
          </div>
        </div>
        
        <div class="flash-products">
          ${featuredProducts.map(product => this.renderProductCard(product, campaign)).join('')}
        </div>
        
        <div class="flash-footer">
          <button class="view-all-btn" onclick="campaignComponents.viewAllFlash('${campaign.slug}')">
            View All ${products.length} Items
          </button>
        </div>
      </div>
    `;
  }

  // Render product card for flash sales
  renderProductCard(product, campaign) {
    const originalPrice = product.original_price || product.product?.price || 0;
    const salePrice = product.sale_price || 0;
    const discount = originalPrice > 0 ? Math.round(((originalPrice - salePrice) / originalPrice) * 100) : 0;
    const remainingStock = product.remaining_reserved_stock || 0;

    return `
      <div class="flash-product-card" data-product-id="${product.product_id}">
        <div class="product-image">
          <img src="${product.product?.image || 'assets/images/default-product.jpg'}" 
               alt="${product.product?.name || 'Product'}" />
          ${discount > 0 ? `<div class="discount-badge">-${discount}%</div>` : ''}
        </div>
        
        <div class="product-info">
          <h4 class="product-name">${product.product?.name || 'Product'}</h4>
          <div class="product-pricing">
            <span class="original-price">$${(originalPrice / 100).toFixed(2)}</span>
            <span class="sale-price">$${(salePrice / 100).toFixed(2)}</span>
          </div>
          
          ${remainingStock > 0 ? `
            <div class="stock-indicator">
              <div class="stock-bar">
                <div class="stock-fill" style="width: ${Math.min(100, (remainingStock / product.reserved_stock) * 100)}%"></div>
              </div>
              <span class="stock-text">Only ${remainingStock} left!</span>
            </div>
          ` : '<div class="out-of-stock">Out of Stock</div>'}
          
          <button class="add-to-cart-btn" 
                  onclick="campaignComponents.addToCart(${product.id}, 1)"
                  ${remainingStock === 0 ? 'disabled' : ''}>
            ${remainingStock === 0 ? 'Sold Out' : 'Add to Cart'}
          </button>
        </div>
      </div>
    `;
  }

  // Initialize popup system
  initPopupSystem() {
    const popupCampaigns = this.heroBannerCampaigns.filter(c => 
      c.type === 'popup' && c.is_active
    );

    if (popupCampaigns.length === 0) return;

    const campaign = popupCampaigns[0];
    const rules = campaign.popup_rules || [];
    
    if (rules.length === 0) return;

    const rule = rules[0];
    
    // Check if popup was already shown in this session (once per visit)
    const sessionKey = `popup_shown_${campaign.id}`;
    const alreadyShown = sessionStorage.getItem(sessionKey);
    
    if (!alreadyShown) {
      this.setupPopupTriggers(campaign, rule, () => sessionStorage.setItem(sessionKey, 'true'));
    }
  }

  // Setup popup triggers
  setupPopupTriggers(campaign, rule, onShow) {
    switch (rule.trigger_type) {
      case 'time_on_page':
        setTimeout(() => {
          this.showPopup(campaign);
          if (onShow) onShow();
        }, rule.trigger_value * 1000);
        break;
        
      case 'exit_intent':
        this.setupExitIntent(campaign, onShow);
        break;
        
      case 'scroll':
        this.setupScrollTrigger(campaign, rule.trigger_value, onShow);
        break;
        
      case 'cart_value':
        this.setupCartValueTrigger(campaign, rule.trigger_value, onShow);
        break;
      default:
        this.showPopup(campaign);
        if (onShow) onShow();
    }
  }

  // Setup exit intent popup
  setupExitIntent(campaign, onShow) {
    document.addEventListener('mouseleave', (e) => {
      if (e.clientY <= 0 && !this.popupShown) {
        this.showPopup(campaign);
        if (onShow) onShow();
      }
    });
  }

  // Setup scroll trigger
  setupScrollTrigger(campaign, scrollPercent, onShow) {
    const threshold = (scrollPercent / 100) * document.body.scrollHeight;
    
    window.addEventListener('scroll', () => {
      if (window.scrollY >= threshold && !this.popupShown) {
        this.showPopup(campaign);
        if (onShow) onShow();
      }
    });
  }

  // Setup cart value trigger
  setupCartValueTrigger(campaign, minValue, onShow) {
    // This would integrate with your existing cart system
    // For now, we'll use a simple check
    const checkCartValue = () => {
      const cart = JSON.parse(localStorage.getItem('cart') || '[]');
      const totalValue = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      
      if (totalValue >= minValue && !this.popupShown) {
        this.showPopup(campaign);
        if (onShow) onShow();
      }
    };

    // Check on cart updates
    window.addEventListener('cartUpdated', checkCartValue);
  }

  // Show popup modal
  showPopup(campaign) {
    if (this.popupShown) return;

    const assets = campaign.campaign_assets || [];
    const popupAsset = assets.find(a => a.metadata?.position === 'popup');

    const popupHTML = `
      <div class="campaign-popup-overlay" id="campaign-popup">
        <div class="campaign-popup">
          <button class="popup-close" onclick="campaignComponents.closePopup()">&times;</button>
          
          <div class="popup-content">
            ${popupAsset ? `<img src="${popupAsset.url}" alt="${popupAsset.alt}" class="popup-image" />` : ''}
            
            <div class="popup-text">
              <h3>${campaign.title}</h3>
              <p>${campaign.description}</p>
            </div>
            
            <div class="popup-actions">
              <button class="popup-cta" onclick="campaignComponents.handlePopupClick(${campaign.id})">
                ${campaign.preview_payload?.cta_text || 'Get Started'}
              </button>
              <button class="popup-dismiss" onclick="campaignComponents.closePopup()">
                Maybe Later
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', popupHTML);
    this.popupShown = true;

    // Auto-close after 30 seconds
    setTimeout(() => {
      this.closePopup();
    }, 30000);
  }

  // Close popup
  closePopup() {
    const popup = document.getElementById('campaign-popup');
    if (popup) {
      popup.remove();
      this.popupShown = false;
    }
  }

  // Start countdown timers
  startCountdownTimers() {
    const countdownElements = document.querySelectorAll('.countdown-time');
    
    countdownElements.forEach(element => {
      const campaignId = element.id.replace('countdown-', '');
      const campaign = this.activeCampaigns.find(c => c.id == campaignId);
      
      if (campaign && campaign.time_left_seconds > 0) {
        this.updateCountdown(element, campaign.time_left_seconds);
      }
    });
  }

  // Update countdown timer
  updateCountdown(element, seconds) {
    const timer = setInterval(() => {
      seconds--;
      
      if (seconds <= 0) {
        clearInterval(timer);
        element.textContent = 'Ended';
        element.parentElement.classList.add('expired');
        return;
      }
      
      element.textContent = this.formatCountdown(seconds);
    }, 1000);
  }

  // Format countdown display
  formatCountdown(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  }

  // Handle hero banner click
  handleHeroClick(campaignId) {
    const campaign = this.activeCampaigns.find(c => c.id === campaignId);
    if (campaign) {
      this.viewCampaign(campaign.slug);
    }
  }

  // Handle popup click
  handlePopupClick(campaignId) {
    this.closePopup();
    const campaign = this.activeCampaigns.find(c => c.id === campaignId);
    if (campaign) {
      this.viewCampaign(campaign.slug);
    }
  }

  // View campaign details
  viewCampaign(slug) {
    window.location.href = `/flashsales/${slug}`;
  }

  // View all flash sales page
  viewAllFlash(slug) {
    window.location.href = `/flashsales.html`;
  }

  // Add product to cart (reserve)
  async addToCart(campaignProductId, quantity) {
    try {
      const response = await fetch('/cart/reserve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          campaign_product_id: campaignProductId,
          quantity: quantity,
          session_id: this.sessionId
        })
      });

      const data = await response.json();

      if (response.ok) {
        this.showReservationSuccess(data);
        this.updateCartCount();
      } else {
        this.showError(data.error);
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      this.showError('Failed to add item to cart');
    }
  }

  // Show reservation success message
  showReservationSuccess(data) {
    const message = `
      <div class="reservation-success">
        <i class="fas fa-check-circle"></i>
        <span>Item reserved for ${this.formatTimeLeft(data.reserved_until)}</span>
      </div>
    `;

    this.showNotification(message, 'success');
  }

  // Show error message
  showError(message) {
    const errorHTML = `
      <div class="reservation-error">
        <i class="fas fa-exclamation-circle"></i>
        <span>${message}</span>
      </div>
    `;

    this.showNotification(errorHTML, 'error');
  }

  // Show notification
  showNotification(content, type) {
    const notification = document.createElement('div');
    notification.className = `campaign-notification ${type}`;
    notification.innerHTML = content;

    document.body.appendChild(notification);

    // Remove after 5 seconds
    setTimeout(() => {
      notification.remove();
    }, 5000);
  }

  // Format time left for reservation
  formatTimeLeft(reservedUntil) {
    const now = new Date();
    const until = new Date(reservedUntil);
    const diff = Math.floor((until - now) / 1000 / 60);
    return `${diff} minutes`;
  }

  // Update cart count (integrate with existing cart system)
  updateCartCount() {
    // This should integrate with your existing cart system
    // For now, we'll trigger a custom event
    window.dispatchEvent(new CustomEvent('cartUpdated'));
  }
}

// Initialize campaign components when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.campaignComponents = new CampaignComponents();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CampaignComponents;
}

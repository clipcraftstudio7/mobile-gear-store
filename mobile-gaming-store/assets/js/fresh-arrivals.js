// Fresh Arrivals Dynamic System
class FreshArrivalsManager {
  constructor() {
    this.freshProducts = [];
    this.updateInterval = 30000; // 30 seconds
    this.init();
  }

  async init() {
    console.log('🚀 Initializing Fresh Arrivals Manager...');
    await this.loadFreshProducts();
    this.startPeriodicUpdates();
  }

  async loadFreshProducts() {
    try {
      // Load products from the products.json file
      const response = await fetch('data/products.json');
      const allProducts = await response.json();
      
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
      
      // First, try to find products added in the last 30 days
      let freshProducts = allProducts.filter(product => {
        if (!product.createdAt) return false;
        const productDate = new Date(product.createdAt);
        return productDate >= thirtyDaysAgo;
      });

      // If no recent products, show products marked as new
      if (freshProducts.length === 0) {
        freshProducts = allProducts.filter(product => product.isNew === true);
      }

      // If still no products, show the most recent 6 products
      if (freshProducts.length === 0) {
        freshProducts = allProducts
          .filter(product => product.createdAt)
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 6);
      }

      // Sort by creation date (newest first)
      this.freshProducts = freshProducts.sort((a, b) => {
        if (!a.createdAt || !b.createdAt) return 0;
        return new Date(b.createdAt) - new Date(a.createdAt);
      });

      this.renderFreshArrivals();
      this.updateCounter();
    } catch (error) {
      console.error('Error loading fresh products:', error);
      // Fallback: try to get products from the global allProducts if available
      if (typeof window.allProducts !== 'undefined' && window.allProducts.length > 0) {
        console.log('Using fallback: global allProducts');
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
        
        let freshProducts = window.allProducts.filter(product => {
          if (!product.createdAt) return false;
          const productDate = new Date(product.createdAt);
          return productDate >= thirtyDaysAgo;
        });

        // If no recent products, show products marked as new
        if (freshProducts.length === 0) {
          freshProducts = window.allProducts.filter(product => product.isNew === true);
        }

        // If still no products, show the most recent 6 products
        if (freshProducts.length === 0) {
          freshProducts = window.allProducts
            .filter(product => product.createdAt)
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 6);
        }

        this.freshProducts = freshProducts.sort((a, b) => {
          if (!a.createdAt || !b.createdAt) return 0;
          return new Date(b.createdAt) - new Date(a.createdAt);
        });

        this.renderFreshArrivals();
        this.updateCounter();
      }
    }
  }

  renderFreshArrivals() {
    const grid = document.getElementById('fresh-arrivals-grid');
    if (!grid) return;

    if (this.freshProducts.length === 0) {
      grid.innerHTML = `
        <div class="no-fresh-products">
          <div class="no-products-icon">🛍️</div>
          <h3>No Fresh Arrivals Yet</h3>
          <p>Check back soon for new gaming gear!</p>
        </div>
      `;
      return;
    }

    const html = this.freshProducts
      .slice(0, 6)
      .map(product => this.createFreshProductCard(product))
      .join('');

    grid.innerHTML = html;
  }

  createFreshProductCard(product) {
    const discount = product.originalPrice && product.originalPrice > product.price
      ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
      : 0;

    const timeSinceAdded = this.getTimeSinceAdded(product.createdAt);

    return `
      <div class="product-card fresh-arrival" data-product-id="${product.id}">
        <div class="product-image-container">
          <img src="${product.image || 'assets/images/default-product.svg'}" 
               alt="${product.name}" 
               class="product-image" 
               onerror="this.onerror=null;this.src='assets/images/default-product.svg';" />
                  <div class="new-badge">NEW</div>
          ${discount > 0 ? `<div class="discount-badge">-${discount}%</div>` : ""}
        </div>
        <div class="product-info">
          <h3 class="product-title">${product.name}</h3>
          <div class="product-price">
            ${product.originalPrice && product.originalPrice > product.price 
              ? `<span class="original-price">$${product.originalPrice.toLocaleString()}</span>` 
              : ""}
            <span class="discount-price">$${product.price.toLocaleString()}</span>
          </div>
          <p class="product-description">${product.description ? product.description.substring(0, 80) + '...' : ''}</p>
          <div class="product-actions">
            <button class="add-to-cart-btn" onclick="addToCartFromCard(${product.id})">
              Add to Cart
            </button>
            <a href="product-template.html?id=${product.id}" class="view-details-btn">
              View Details
            </a>
          </div>
        </div>
      </div>
    `;
  }

  getTimeSinceAdded(createdAt) {
    if (!createdAt) return '';
    const now = new Date();
    const created = new Date(createdAt);
    const diffInHours = Math.floor((now - created) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just Added';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    const diffInWeeks = Math.floor(diffInDays / 7);
    if (diffInWeeks < 4) return `${diffInWeeks}w ago`;
    return `${Math.floor(diffInDays / 30)}m ago`;
  }

  updateCounter() {
    const counter = document.getElementById('new-products-count');
    if (counter) {
      counter.textContent = this.freshProducts.length;
    }
  }

  startPeriodicUpdates() {
    setInterval(async () => {
      await this.loadFreshProducts();
    }, this.updateInterval);
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.freshArrivalsManager = new FreshArrivalsManager();
});

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
      const response = await fetch('/products');
      const allProducts = await response.json();
      
      const now = new Date();
      const fourteenDaysAgo = new Date(now.getTime() - (14 * 24 * 60 * 60 * 1000));
      
      this.freshProducts = allProducts.filter(product => {
        if (!product.createdAt) return false;
        const productDate = new Date(product.createdAt);
        return productDate >= fourteenDaysAgo;
      }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      this.renderFreshArrivals();
      this.updateCounter();
    } catch (error) {
      console.error('Error loading fresh products:', error);
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
               class="product-image" />
          <div class="new-badge">NEW</div>
          ${timeSinceAdded ? `<div class="time-badge">${timeSinceAdded}</div>` : ""}
          <div class="fresh-arrival-indicator">✨ Fresh</div>
        </div>
        <div class="product-info">
          <h3 class="product-title">${product.name}</h3>
          <div class="product-price">
            <span class="discount-price">$${product.price.toLocaleString()}</span>
          </div>
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
    return `${Math.floor(diffInHours / 24)}d ago`;
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

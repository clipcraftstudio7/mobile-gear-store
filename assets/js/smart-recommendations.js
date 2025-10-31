class SmartRecommendations {
  constructor() {
    this.allProducts = [];
    this.userBehavior = this.loadUserBehavior();
    this.currentTab = 'personalized';
    this.init();
  }

  async init() {
    await this.loadProducts();
    this.setupEventListeners();
    this.generateRecommendations();
  }

  async loadProducts() {
    try {
      const response = await fetch('/products');
      this.allProducts = await response.json();
    } catch (error) {
      console.error('Error loading products:', error);
      this.allProducts = [];
    }
  }

  loadUserBehavior() {
    const saved = localStorage.getItem('userBehavior');
    return saved ? JSON.parse(saved) : {
      viewedProducts: [],
      cartItems: [],
      searchHistory: [],
      categoryPreferences: {},
      lastVisit: null
    };
  }

  saveUserBehavior() {
    localStorage.setItem('userBehavior', JSON.stringify(this.userBehavior));
  }

  trackProductView(productId) {
    if (!this.userBehavior.viewedProducts.includes(productId)) {
      this.userBehavior.viewedProducts.unshift(productId);
      this.userBehavior.viewedProducts = this.userBehavior.viewedProducts.slice(0, 20);
      this.saveUserBehavior();
    }
  }

  trackCartAddition(productId) {
    if (!this.userBehavior.cartItems.includes(productId)) {
      this.userBehavior.cartItems.push(productId);
      this.saveUserBehavior();
    }
  }

  setupEventListeners() {
    const tabs = document.querySelectorAll('.recommendation-tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        this.switchTab(tab.dataset.tab);
      });
    });
  }

  switchTab(tabName) {
    // Update active tab
    document.querySelectorAll('.recommendation-tab').forEach(tab => {
      tab.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

    // Update active section
    document.querySelectorAll('.recommendation-section').forEach(section => {
      section.classList.remove('active');
    });
    document.querySelector(`[data-section="${tabName}"]`).classList.add('active');

    this.currentTab = tabName;
    this.generateRecommendations();
  }

  generateRecommendations() {
    switch (this.currentTab) {
      case 'personalized':
        this.showPersonalizedRecommendations();
        break;
      case 'trending':
        this.showTrendingRecommendations();
        break;
      case 'similar':
        this.showSimilarRecommendations();
        break;
      case 'bundle':
        this.showBundleRecommendations();
        break;
    }
  }

  showPersonalizedRecommendations() {
    const container = document.querySelector('[data-section="personalized"] .recommendation-grid');
    const recommendations = this.getPersonalizedRecommendations();
    
    container.innerHTML = recommendations.map(product => `
      <div class="recommendation-card">
        <div class="recommendation-product" onclick="window.location.href='product-template.html?id=${product.id}'">
          <img src="${product.image || 'assets/images/default-product.svg'}" alt="${product.name}">
          <div class="recommendation-product-info">
            <div class="recommendation-product-name">${product.name}</div>
            <div class="recommendation-product-price">$${product.price}</div>
            <div class="recommendation-product-rating">${'⭐'.repeat(Math.round(product.rating || 4))} (${product.reviews || 0})</div>
          </div>
        </div>
      </div>
    `).join('');
  }

  showTrendingRecommendations() {
    const container = document.querySelector('[data-section="trending"] .recommendation-grid');
    const recommendations = this.getTrendingRecommendations();
    
    container.innerHTML = recommendations.map(product => `
      <div class="recommendation-card">
        <div class="recommendation-product" onclick="window.location.href='product-template.html?id=${product.id}'">
          <img src="${product.image || 'assets/images/default-product.svg'}" alt="${product.name}">
          <div class="recommendation-product-info">
            <div class="recommendation-product-name">${product.name}</div>
            <div class="recommendation-product-price">$${product.price}</div>
            <div class="recommendation-product-rating">${'⭐'.repeat(Math.round(product.rating || 4))} (${product.reviews || 0})</div>
          </div>
        </div>
      </div>
    `).join('');
  }

  showSimilarRecommendations() {
    const container = document.querySelector('[data-section="similar"] .recommendation-grid');
    const recommendations = this.getSimilarRecommendations();
    
    container.innerHTML = recommendations.map(product => `
      <div class="recommendation-card">
        <div class="recommendation-product" onclick="window.location.href='product-template.html?id=${product.id}'">
          <img src="${product.image || 'assets/images/default-product.svg'}" alt="${product.name}">
          <div class="recommendation-product-info">
            <div class="recommendation-product-name">${product.name}</div>
            <div class="recommendation-product-price">$${product.price}</div>
            <div class="recommendation-product-rating">${'⭐'.repeat(Math.round(product.rating || 4))} (${product.reviews || 0})</div>
          </div>
        </div>
      </div>
    `).join('');
  }

  showBundleRecommendations() {
    const container = document.querySelector('[data-section="bundle"] .recommendation-grid');
    const bundles = this.getBundleRecommendations();
    
    container.innerHTML = bundles.map(bundle => `
      <div class="recommendation-card">
        <h4>${bundle.name}</h4>
        <p>${bundle.description}</p>
        <div class="bundle-products">
          ${bundle.products.map(product => `
            <div class="recommendation-product" onclick="window.location.href='product-template.html?id=${product.id}'">
              <img src="${product.image || 'assets/images/default-product.svg'}" alt="${product.name}">
              <div class="recommendation-product-info">
                <div class="recommendation-product-name">${product.name}</div>
                <div class="recommendation-product-price">$${product.price}</div>
              </div>
            </div>
          `).join('')}
        </div>
        <div class="bundle-total">Bundle Total: $${bundle.totalPrice}</div>
      </div>
    `).join('');
  }

  getPersonalizedRecommendations() {
    if (this.userBehavior.viewedProducts.length === 0) {
      return this.getPopularProducts();
    }

    const viewedCategories = this.userBehavior.viewedProducts.map(id => {
      const product = this.allProducts.find(p => p.id == id);
      return product ? product.category : null;
    }).filter(Boolean);

    const categoryScores = {};
    viewedCategories.forEach(category => {
      categoryScores[category] = (categoryScores[category] || 0) + 1;
    });

    const recommendations = this.allProducts
      .filter(product => !this.userBehavior.viewedProducts.includes(product.id))
      .sort((a, b) => {
        const scoreA = categoryScores[a.category] || 0;
        const scoreB = categoryScores[b.category] || 0;
        return scoreB - scoreA;
      })
      .slice(0, 6);

    return recommendations;
  }

  getTrendingRecommendations() {
    return this.allProducts
      .filter(product => product.rating >= 4 && product.reviews >= 10)
      .sort((a, b) => (b.rating * b.reviews) - (a.rating * a.reviews))
      .slice(0, 6);
  }

  getSimilarRecommendations() {
    if (this.userBehavior.viewedProducts.length === 0) {
      return this.getPopularProducts();
    }

    const lastViewed = this.userBehavior.viewedProducts[0];
    const lastProduct = this.allProducts.find(p => p.id == lastViewed);
    
    if (!lastProduct) return this.getPopularProducts();

    return this.allProducts
      .filter(product => product.id != lastViewed && product.category === lastProduct.category)
      .sort((a, b) => Math.abs(a.price - lastProduct.price) - Math.abs(b.price - lastProduct.price))
      .slice(0, 6);
  }

  getBundleRecommendations() {
    const bundles = [
      {
        name: "Mobile Gaming Starter Pack",
        description: "Essential accessories for mobile gaming",
        products: this.allProducts.filter(p => ['gaming-controller', 'cooling-fan'].includes(p.category)).slice(0, 2),
        totalPrice: 0
      },
      {
        name: "Pro Gaming Setup",
        description: "Complete mobile gaming experience",
        products: this.allProducts.filter(p => ['gaming-controller', 'cooling-fan', 'accessories'].includes(p.category)).slice(0, 3),
        totalPrice: 0
      }
    ];

    bundles.forEach(bundle => {
      bundle.totalPrice = bundle.products.reduce((sum, product) => sum + product.price, 0);
    });

    return bundles;
  }

  getPopularProducts() {
    return this.allProducts
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
      .slice(0, 6);
  }

  // Public methods for tracking
  trackView(productId) {
    this.trackProductView(productId);
  }

  trackCart(productId) {
    this.trackCartAddition(productId);
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.smartRecommendations = new SmartRecommendations();
});

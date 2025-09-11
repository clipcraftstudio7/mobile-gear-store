/**
 * Site-Wide Banner System
 * Displays notifications, promotions, and announcements across all pages
 */

class SiteBanner {
  constructor() {
    this.banners = [];
    this.isInitialized = false;
    this.init();
  }

  async init() {
    if (this.isInitialized) return;
    
    try {
      await this.loadBanners();
      this.renderBanners();
      this.isInitialized = true;
      
      // Refresh banners every 5 minutes
      setInterval(() => {
        this.loadBanners().then(() => this.renderBanners());
      }, 5 * 60 * 1000);
      
    } catch (error) {
      console.error('Site banner initialization error:', error);
    }
  }

  async loadBanners() {
    try {
      console.log('🔄 Loading site banners...');
      const response = await fetch('/api/site-banners/active');
      console.log('📡 Banner API response:', response.status, response.statusText);
      
      if (!response.ok) throw new Error(`Failed to fetch banners: ${response.status}`);
      
      const data = await response.json();
      console.log('📊 Banner data received:', data);
      this.banners = data.banners || [];
      console.log('🎯 Active banners found:', this.banners.length);
      
      // Filter banners for current page
      const currentPath = window.location.pathname;
      console.log('📍 Current page path:', currentPath);
      
      this.banners = this.banners.filter(banner => {
        const showOnAll = banner.show_on_pages.includes('all');
        const showOnCurrentPage = banner.show_on_pages.some(page => 
          currentPath.includes(page) || page === currentPath
        );
        
        console.log(`🎨 Banner "${banner.title}": show_on_pages=${JSON.stringify(banner.show_on_pages)}, showOnAll=${showOnAll}, showOnCurrentPage=${showOnCurrentPage}`);
        
        return showOnAll || showOnCurrentPage;
      });
      
      console.log('✅ Filtered banners for current page:', this.banners.length);
      
    } catch (error) {
      console.error('❌ Error loading site banners:', error);
      this.banners = [];
    }
  }

  renderBanners() {
    console.log('🎨 Rendering banners...', this.banners.length, 'banners to render');
    
    // Remove existing banners
    this.removeExistingBanners();
    
    if (this.banners.length === 0) {
      console.log('ℹ️ No banners to render');
      return;
    }
    
    // Group banners by position
    const topBanners = this.banners.filter(b => b.position === 'top');
    const bottomBanners = this.banners.filter(b => b.position === 'bottom');
    
    // Render top banners
    if (topBanners.length > 0) {
      this.renderBannerGroup(topBanners, 'top');
    }
    
    // Render bottom banners
    if (bottomBanners.length > 0) {
      this.renderBannerGroup(bottomBanners, 'bottom');
    }
    
    // Adjust page layout for banners
    this.adjustPageLayout();
  }

  renderBannerGroup(banners, position) {
    const container = document.createElement('div');
    container.className = `site-banner-container site-banner-${position}`;
    container.id = `site-banner-${position}`;
    
    banners.forEach((banner, index) => {
      const bannerElement = this.createBannerElement(banner, index);
      container.appendChild(bannerElement);
    });
    
    // Insert into page
    if (position === 'top') {
      document.body.insertBefore(container, document.body.firstChild);
    } else {
      document.body.appendChild(container);
    }
  }

  createBannerElement(banner, index) {
    const bannerEl = document.createElement('div');
    bannerEl.className = `site-banner site-banner-${banner.type}`;
    bannerEl.dataset.bannerId = banner.id;
    
    // Banner content with image support
    bannerEl.innerHTML = `
      <div class="site-banner-content">
        ${banner.banner_image ? `
          <div class="site-banner-image">
            <img src="${banner.banner_image}" alt="${banner.title}" loading="lazy">
          </div>
        ` : ''}
        <div class="site-banner-text">
          <strong class="site-banner-title">${banner.title}</strong>
          ${banner.message ? `<span class="site-banner-message">${banner.message}</span>` : ''}
        </div>
        <button class="site-banner-close" onclick="window.siteBanner.closeBanner(${banner.id})" aria-label="Close banner">
          <i class="fas fa-times"></i>
        </button>
      </div>
    `;
    
    // Add click handler for banner interaction
    bannerEl.addEventListener('click', (e) => {
      if (!e.target.closest('.site-banner-close')) {
        this.onBannerClick(banner);
      }
    });
    
    // Auto-hide after 10 seconds for info banners
    if (banner.type === 'info') {
      setTimeout(() => {
        this.closeBanner(banner.id);
      }, 10000);
    }
    
    return bannerEl;
  }

  closeBanner(bannerId) {
    const banner = document.querySelector(`[data-banner-id="${bannerId}"]`);
    if (banner) {
      banner.style.animation = 'slideOut 0.3s ease-out forwards';
      setTimeout(() => {
        banner.remove();
        this.adjustPageLayout();
      }, 300);
    }
    
    // Store dismissal in localStorage
    const dismissed = JSON.parse(localStorage.getItem('dismissedBanners') || '[]');
    if (!dismissed.includes(bannerId)) {
      dismissed.push(bannerId);
      localStorage.setItem('dismissedBanners', JSON.stringify(dismissed));
    }
  }

  onBannerClick(banner) {
    // Handle banner click events (e.g., redirect to promotion page)
    console.log('Banner clicked:', banner.title);
    
    // You can add custom click handling here
    // For example, redirect to a specific page or show a modal
  }

  removeExistingBanners() {
    const existingBanners = document.querySelectorAll('.site-banner-container');
    existingBanners.forEach(banner => banner.remove());
  }

  adjustPageLayout() {
    const topBanners = document.querySelector('.site-banner-top');
    const bottomBanners = document.querySelector('.site-banner-bottom');
    
    // Adjust body padding for top banners
    if (topBanners) {
      const bannerHeight = topBanners.offsetHeight;
      document.body.style.paddingTop = `${bannerHeight}px`;
    } else {
      document.body.style.paddingTop = '0';
    }
    
    // Adjust body padding for bottom banners
    if (bottomBanners) {
      const bannerHeight = bottomBanners.offsetHeight;
      document.body.style.paddingBottom = `${bannerHeight}px`;
    } else {
      document.body.style.paddingBottom = '0';
    }
  }
}

// CSS Styles for site banners
const bannerStyles = `
  .site-banner-container {
    position: fixed;
    left: 0;
    right: 0;
    z-index: 10000;
    animation: slideIn 0.3s ease-out;
  }
  
  .site-banner-top {
    top: 0;
  }
  
  .site-banner-bottom {
    bottom: 0;
  }
  
  .site-banner {
    padding: 12px 20px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    cursor: pointer;
    transition: all 0.3s ease;
  }
  
  .site-banner:last-child {
    border-bottom: none;
  }
  
  .site-banner:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  }
  
  .site-banner-success {
    background: linear-gradient(135deg, #25d366, #128c7e);
    color: white;
  }
  
  .site-banner-warning {
    background: linear-gradient(135deg, #ffa502, #ff6348);
    color: white;
  }
  
  .site-banner-info {
    background: linear-gradient(135deg, #45b7d1, #96c93d);
    color: white;
  }
  
  .site-banner-error {
    background: linear-gradient(135deg, #ff4757, #c44569);
    color: white;
  }
  
  .site-banner-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    max-width: 1200px;
    margin: 0 auto;
  }
  
  .site-banner-image {
    margin-right: 12px;
    flex-shrink: 0;
  }
  
  .site-banner-image img {
    width: 40px;
    height: 40px;
    object-fit: cover;
    border-radius: 6px;
    border: 2px solid rgba(255, 255, 255, 0.2);
  }
  
  .site-banner-text {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 12px;
  }
  
  .site-banner-title {
    font-weight: 700;
    font-size: 1rem;
  }
  
  .site-banner-message {
    font-size: 0.9rem;
    opacity: 0.9;
  }
  
  .site-banner-close {
    background: none;
    border: none;
    color: inherit;
    font-size: 1.2rem;
    cursor: pointer;
    padding: 4px;
    border-radius: 4px;
    transition: background 0.2s ease;
    margin-left: 12px;
  }
  
  .site-banner-close:hover {
    background: rgba(255, 255, 255, 0.2);
  }
  
  @keyframes slideIn {
    from {
      transform: translateY(-100%);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }
  
  @keyframes slideOut {
    from {
      transform: translateY(0);
      opacity: 1;
    }
    to {
      transform: translateY(-100%);
      opacity: 0;
    }
  }
  
  @media (max-width: 768px) {
    .site-banner {
      padding: 10px 15px;
    }
    
    .site-banner-content {
      flex-direction: column;
      gap: 8px;
      text-align: center;
    }
    
    .site-banner-text {
      flex-direction: column;
      gap: 4px;
    }
    
    .site-banner-title {
      font-size: 0.9rem;
    }
    
    .site-banner-message {
      font-size: 0.8rem;
    }
  }
`;

// Inject styles
const styleSheet = document.createElement('style');
styleSheet.textContent = bannerStyles;
document.head.appendChild(styleSheet);

// Initialize site banner system
console.log('🚀 Initializing site banner system...');
window.siteBanner = new SiteBanner();
console.log('✅ Site banner system initialized:', window.siteBanner);

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SiteBanner;
}


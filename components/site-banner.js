// Simple Kilmall-style banner carousel using Glide.js
(function () {
  // Disable the legacy top-of-page banner carousel by default
  if (!window || !window.ENABLE_SITE_TOP_BANNERS) {
    return;
  }
  function injectStyles() {
    if (document.getElementById('site-banner-styles')) return;
    const css = `
      .site-banner-section{width:100%;background:#0f1113;}
      .site-banner{max-width:1200px;margin:0 auto;padding:12px 16px;}
      .site-banner .glide__slides{align-items:stretch}
      .banner-card{display:grid;grid-template-columns:1.2fr 1fr;gap:18px;background:linear-gradient(145deg,#15181b,#0f1113);border:1px solid #222;border-radius:16px;overflow:hidden;box-shadow:0 6px 24px rgba(0,0,0,.35);min-height:240px}
      .banner-media{position:relative;background:#0b0d0f}
      .banner-media img{width:100%;height:100%;object-fit:cover}
      .banner-badges{position:absolute;top:10px;left:10px;display:flex;gap:8px}
      .banner-badge{background:#25d366;color:#111;font-weight:800;border-radius:999px;padding:6px 10px;font-size:.78rem;box-shadow:0 2px 10px rgba(37,211,102,.35)}
      .banner-content{display:flex;flex-direction:column;justify-content:center;padding:18px}
      .banner-title{color:#fff;font-weight:800;font-size:1.6rem;line-height:1.2;margin-bottom:6px}
      .banner-sub{color:#cbd5e1;font-size:.98rem;margin-bottom:12px}
      .banner-cta{display:inline-flex;align-items:center;gap:8px;background:linear-gradient(135deg,#25d366,#128c7e);color:#111;font-weight:800;border:none;border-radius:10px;padding:10px 14px;text-decoration:none;box-shadow:0 6px 18px rgba(37,211,102,.25)}
      .banner-meta{display:flex;gap:10px;margin-top:10px;color:#94a3b8;font-size:.85rem}
      @media(max-width:900px){.banner-card{grid-template-columns:1fr;min-height:auto}.banner-content{padding:14px}.banner-title{font-size:1.3rem}}
      .glide__bullet{background:#334155}
      .glide__bullet--active{background:#25d366}
      .glide__arrow{background:#111;color:#25d366;border:1px solid #334155}
    `;
    const style = document.createElement('style');
    style.id = 'site-banner-styles';
    style.textContent = css;
    document.head.appendChild(style);
  }

  function ensureContainer() {
    let existing = document.getElementById('site-banner');
    if (existing) return existing;
    const mount = document.getElementById('site-banner-mount');
    const section = mount || document.createElement('section');
    if (!mount) section.className = 'site-banner-section';
    section.innerHTML = `
      <div id="site-banner" class="site-banner" style="max-width:1200px;margin:0 auto;">
        <div class="glide" id="site-banner-glide">
          <div class="glide__track" data-glide-el="track">
            <ul class="glide__slides" id="site-banner-slides"></ul>
          </div>
          <div class="glide__bullets" data-glide-el="controls[nav]" id="site-banner-bullets"></div>
          <div class="glide__arrows" data-glide-el="controls">
            <button class="glide__arrow glide__arrow--left" data-glide-dir="<">◀</button>
            <button class="glide__arrow glide__arrow--right" data-glide-dir=">">▶</button>
          </div>
        </div>
      </div>`;
    if (!mount) {
      const header = document.querySelector('.header') || document.querySelector('nav.navbar');
      if (header && header.parentNode) header.parentNode.insertBefore(section, header.nextSibling);
      else document.body.insertBefore(section, document.body.firstChild);
    }
    return document.getElementById('site-banner');
  }

  function renderBanners(banners) {
    injectStyles();
    ensureContainer();
    const slides = document.getElementById('site-banner-slides');
    const bullets = document.getElementById('site-banner-bullets');
    if (!slides) return;
    slides.innerHTML = '';
    bullets.innerHTML = '';
    banners.forEach((b, i) => {
      const li = document.createElement('li');
      li.className = 'glide__slide';
      li.innerHTML = `
        <div class="banner-card">
          <div class="banner-media">
            <div class="banner-badges">${(b.badges||[]).map(x=>`<span class=\"banner-badge\">${x}</span>`).join('')}</div>
            <img src="${b.image}" alt="${b.title||'Banner'}" onerror="this.onerror=null;this.src='assets/images/default-product.svg'" />
          </div>
          <div class="banner-content">
            <div class="banner-title">${b.title||''}</div>
            <div class="banner-sub">${b.subtitle||''}</div>
            <div class="banner-meta">${b.meta?b.meta.map(m=>`<span>${m}</span>`).join(''):''}</div>
            ${b.ctaText?`<a class="banner-cta" href="${b.ctaLink||'#'}">${b.ctaText}</a>`:''}
          </div>
        </div>`;
      slides.appendChild(li);
      const bullet = document.createElement('button');
      bullet.className = 'glide__bullet';
      bullet.setAttribute('data-glide-dir', `=${i}`);
      bullets.appendChild(bullet);
    });
    if (typeof Glide !== 'undefined') {
      try {
        if (window.__siteBannerGlide) window.__siteBannerGlide.destroy();
        window.__siteBannerGlide = new Glide('#site-banner-glide', {
          type: 'carousel',
          perView: 1,
          autoplay: 4000,
          hoverpause: true,
          animationDuration: 600,
        });
        window.__siteBannerGlide.mount();
      } catch (e) { console.warn('Glide init failed', e); }
    }
  }

  async function loadBanners() {
    try {
      const res = await fetch('/banners');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length) { renderBanners(data); return; }
        if (Array.isArray(data.banners)) { renderBanners(data.banners); return; }
      }
    } catch {}
    // Fallback defaults
    renderBanners([
      {
        title: 'Mega Flash Sale',
        subtitle: 'Up to 50% OFF on hot gaming gear',
        image: 'assets/images/products-organized/1-gaming-controller/1-main.jpg',
        badges: ['Flash', 'Limited'],
        ctaText: 'Shop Now',
        ctaLink: '/flashsales.html',
        meta: ['Free returns', '24h dispatch']
      },
      {
        title: 'Cooling Essentials',
        subtitle: 'Keep FPS high with pro coolers',
        image: 'assets/images/products-organized/3-mobile-cooling-fan-dual/1-main.jpg',
        badges: ['Trending'],
        ctaText: 'Explore',
        ctaLink: '/category.html?cat=Cooling',
        meta: ['Top rated', 'Best value']
      }
    ]);
  }

  window.setSiteBanners = renderBanners;
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadBanners);
  } else {
    loadBanners();
  }
})();

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
    
    // Filter out dismissed banners (once per visit)
    const dismissed = JSON.parse(sessionStorage.getItem('dismissedBanners') || '[]');
    const availableBanners = this.banners.filter(banner => !dismissed.includes(banner.id));
    
    if (availableBanners.length === 0) {
      console.log('ℹ️ All banners have been dismissed in this session');
      return;
    }
    
    // Show ONE popup at a time, cycling through available banners
    this.renderBannerGroup(availableBanners, 'popup');
    
    // No layout adjustments needed for popup overlays
    this.adjustPageLayout();
  }

  renderBannerGroup(banners, position) {
    // Ensure only a single overlay exists
    this.removeExistingBanners();
    
    // Create overlay for popup effect
    const overlay = document.createElement('div');
    overlay.className = 'site-banner-overlay';
    overlay.id = `site-banner-overlay-${position}`;
    
    // Create container for the single visible banner
    const container = document.createElement('div');
    container.className = `site-banner-container site-banner-${position}`;
    container.id = `site-banner-${position}`;
    
    let currentIndex = 0;
    const renderAtIndex = (idx) => {
      container.innerHTML = '';
      const bannerElement = this.createBannerElement(banners[idx], idx);
      container.appendChild(bannerElement);
    };
    
    renderAtIndex(currentIndex);
    
    // Cycle through banners one at a time if more than one
    if (banners.length > 1) {
      // Clear any previous timer
      if (window.__siteBannerCycleTimer) {
        clearInterval(window.__siteBannerCycleTimer);
      }
      // Rotate every 5 minutes
      window.__siteBannerCycleTimer = setInterval(() => {
        currentIndex = (currentIndex + 1) % banners.length;
        renderAtIndex(currentIndex);
      }, 300000);
    }
    
    // Add container to overlay
    overlay.appendChild(container);
    
    // Click overlay background to close immediately
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        this.closeBannerOverlay(position);
      }
    });
    
    // Add overlay to page
    document.body.appendChild(overlay);
  }

  createBannerElement(banner, index) {
    const bannerEl = document.createElement('div');
    bannerEl.className = `site-banner site-banner-${banner.type}`;
    bannerEl.dataset.bannerId = banner.id;
    
    const imgSrc = banner.banner_image || banner.image || '';
    bannerEl.innerHTML = `
      <button class="site-banner-close site-banner-close--small" aria-label="Close">×</button>
      <div class="site-banner-content image-only">
        <img class="site-banner-photo" src="${imgSrc}" alt="" loading="lazy" onerror="this.style.display='none'">
      </div>
    `;
    
    const closeBtn = bannerEl.querySelector('.site-banner-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const overlay = bannerEl.closest('.site-banner-overlay');
        if (overlay) overlay.remove();
        if (window.__siteBannerCycleTimer) {
          clearInterval(window.__siteBannerCycleTimer);
          window.__siteBannerCycleTimer = null;
        }
        this.adjustPageLayout();
      });
    }
    
    return bannerEl;
  }

  closeBanner(bannerId) {
    const banner = document.querySelector(`[data-banner-id="${bannerId}"]`);
    if (banner) {
      const overlay = banner.closest('.site-banner-overlay');
      if (overlay) {
        this.closeBannerOverlay(overlay.id.replace('site-banner-overlay-', ''));
      }
    }
    
    // Store dismissal in sessionStorage (once per visit)
    const dismissed = JSON.parse(sessionStorage.getItem('dismissedBanners') || '[]');
    if (!dismissed.includes(bannerId)) {
      dismissed.push(bannerId);
      sessionStorage.setItem('dismissedBanners', JSON.stringify(dismissed));
    }
  }

  closeBannerOverlay(position) {
    const overlay = document.getElementById(`site-banner-overlay-${position}`);
    if (overlay) {
      overlay.style.animation = 'fadeOut 0.3s ease-out forwards';
      setTimeout(() => {
        overlay.remove();
        this.adjustPageLayout();
      }, 300);
    }
    if (window.__siteBannerCycleTimer) {
      clearInterval(window.__siteBannerCycleTimer);
      window.__siteBannerCycleTimer = null;
    }
  }

  onBannerClick(banner) {
    // Handle banner click events (e.g., redirect to promotion page)
    console.log('Banner clicked:', banner.title);
    
    // You can add custom click handling here
    // For example, redirect to a specific page or show a modal
  }

  removeExistingBanners() {
    const existingOverlays = document.querySelectorAll('.site-banner-overlay');
    existingOverlays.forEach(overlay => overlay.remove());
  }

  adjustPageLayout() {
    // For popup banners, we don't need to adjust page layout
    // since they appear as overlays and don't affect the page flow
    console.log('Page layout adjusted for popup banners');
  }
}

// CSS Styles for site banners - POPUP STYLE
const bannerStyles = `
  /* Overlay background for popup effect */
  .site-banner-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.7);
    z-index: 9999;
    display: flex;
    align-items: center;
    justify-content: center;
    animation: fadeIn 0.3s ease-out;
  }
  
  .site-banner-container {
    position: relative;
    z-index: 10000;
    max-width: none;
    max-height: none;
    width: auto;
    animation: none;
  }
  
  .site-banner {
    background: transparent !important;
    border-radius: 0 !important;
    box-shadow: none !important;
    border: none !important;
    cursor: default;
    transition: none;
    overflow: visible;
    position: relative;
  }
  
  .site-banner:hover { }
  
  .site-banner-success,
  .site-banner-warning,
  .site-banner-info,
  .site-banner-error {
    background: transparent !important;
    box-shadow: none !important;
    border: none !important;
    color: inherit;
  }
  
  .site-banner-content {
    display: block;
    padding: 0 !important;
    gap: 0;
    position: relative;
  }
  
  /* Image-only popup variant */
  .site-banner-content.image-only {
    padding: 0;
    display: block;
  }
  .site-banner-photo {
    display: block;
    width: 90vw;
    height: auto;
    max-height: 85vh;
    object-fit: contain;
    margin: 0;
  }
  
  .site-banner-image {
    flex-shrink: 0;
    position: relative;
  }
  
  .site-banner-image img {
    width: 120px;
    height: 120px;
    object-fit: cover;
    border-radius: 15px;
    border: 3px solid rgba(255, 255, 255, 0.3);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  }
  
  .site-banner-text {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 15px;
  }
  
  .site-banner-title {
    font-weight: 800;
    font-size: 2.2rem;
    line-height: 1.2;
    text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
  }
  
  .site-banner-message {
    font-size: 1.3rem;
    opacity: 0.95;
    line-height: 1.4;
    font-weight: 500;
  }
  
  .site-banner-close {
    position: absolute;
    top: -10px;
    right: -10px;
    background: rgba(0,0,0,0.7);
    border: none;
    color: #fff;
    font-size: 14px;
    line-height: 1;
    cursor: pointer;
    padding: 6px 8px;
    border-radius: 12px;
  }
  .site-banner-close--small {
    font-size: 14px;
    padding: 6px 8px;
  }
  
  .site-banner-close:hover { opacity: 0.9; }
  
  /* Decorative elements */
  .site-banner::before {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: linear-gradient(45deg, transparent, rgba(255, 255, 255, 0.1), transparent);
    animation: shimmer 3s infinite;
    pointer-events: none;
  }
  
  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
  
  @keyframes fadeOut {
    from {
      opacity: 1;
    }
    to {
      opacity: 0;
    }
  }
  
  @keyframes popupIn {
    from {
      transform: scale(0.8) translateY(-50px);
      opacity: 0;
    }
    to {
      transform: scale(1) translateY(0);
      opacity: 1;
    }
  }
  
  @keyframes slideOut {
    from {
      transform: scale(1) translateY(0);
      opacity: 1;
    }
    to {
      transform: scale(0.8) translateY(-50px);
      opacity: 0;
    }
  }
  
  @keyframes shimmer {
    0% {
      transform: translateX(-100%) translateY(-100%) rotate(45deg);
    }
    100% {
      transform: translateX(100%) translateY(100%) rotate(45deg);
    }
  }
  
  /* Mobile responsive */
  @media (max-width: 768px) {
    .site-banner-container {
      width: 95vw;
      max-height: 85vh;
    }
    
    .site-banner-content {
      padding: 25px;
      gap: 20px;
      flex-direction: column;
      text-align: center;
    }
    
    .site-banner-image img {
      width: 80px;
      height: 80px;
    }
    
    .site-banner-title {
      font-size: 1.6rem;
    }
    
    .site-banner-message {
      font-size: 1.1rem;
    }
    
    .site-banner-close {
      top: 15px;
      right: 15px;
      width: 40px;
      height: 40px;
      font-size: 1.4rem;
    }
  }
  
  @media (max-width: 480px) {
    .site-banner-title {
      font-size: 1.4rem;
    }
    
    .site-banner-message {
      font-size: 1rem;
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


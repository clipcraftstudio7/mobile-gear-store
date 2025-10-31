// Image Fallback System
// Handles missing images and provides fallbacks

class ImageFallbackManager {
  constructor() {
    this.defaultImage = 'assets/images/default-product.svg';
    this.placeholderImage = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAwIDQwMCA0MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iNDAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xNzUgMTUwSDE4NVYxNjBIMTc1VjE1MFoiIGZpbGw9IiM5Q0EzQUYiLz4KPHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIGZpbGw9Im5vbmUiIHZpZXdCb3g9IjAgMCA0MCA0MCI+CjxwYXRoIGQ9Ik0zNS4yIDM1LjJIMTYuOGMtLjk0IDAtMS42OC0uNzQtMS42OC0xLjY4VjE2LjhjMC0uOTQuNzQtMS42OCAxLjY4LTEuNjhoMTguNGMuOTQgMCAxLjY4Ljc0IDEuNjggMS42OHYxNi43NGMwIC45NC0uNzQgMS42Ni0xLjY4IDEuNjZ6bS0xLjY4LTMuMzZ2LTEwLjNsLTQuMjItNC4yMmMtLjMzLS4zMy0uODUtLjMzLTEuMTggMGwtMy4zNCAzLjM0LS45MS0uOTFjLS4zMy0uMzMtLjg1LS4zMy0xLjE4IDBsLTQuMTkgNC4xOXY4LjkxaDEzLjAydjEuMDZ6TTIyLjYgMTguNGMtMS4yNCAwLTIuMjQgMS0yLjI0IDIuMjRzMSAyLjI0IDIuMjQgMi4yNCAyLjI0LTEgMi4yNC0yLjI0LTEtMi4yNC0yLjI0LTIuMjR6IiBmaWxsPSIjOUNBM0FGIi8+Cjwvc3ZnPgo8L3N2Zz4K';
    this.errorImages = new Set();
    this.loadingImages = new Map();
    
    this.init();
  }

  init() {
    // Create default placeholder image if it doesn't exist
    this.createDefaultImage();
    
    // Listen for global image errors
    document.addEventListener('error', (e) => {
      if (e.target.tagName === 'IMG') {
        this.handleImageError(e.target);
      }
    }, true);
    
    console.log('🖼️ Image Fallback Manager initialized');
  }

  async createDefaultImage() {
    try {
      // Check if default image exists
      const response = await fetch(this.defaultImage);
      if (!response.ok) {
        console.log('📸 Creating default product image...');
        // Default image doesn't exist, we'll use SVG placeholder
      }
    } catch (error) {
      console.log('📸 Using SVG placeholder as default image');
    }
  }

  handleImageError(imgElement) {
    const originalSrc = imgElement.src;
    
    // Prevent infinite loops
    if (this.errorImages.has(originalSrc)) {
      console.warn('🚫 Image already failed, using placeholder:', originalSrc);
      imgElement.src = this.placeholderImage;
      return;
    }

    this.errorImages.add(originalSrc);
    console.warn('❌ Image failed to load:', originalSrc);

    // Try fallback strategies
    this.tryFallbackStrategies(imgElement, originalSrc);
  }

  async tryFallbackStrategies(imgElement, originalSrc) {
    const fallbackStrategies = [
      () => this.tryOrganizedPath(originalSrc),
      () => this.tryLegacyPath(originalSrc),
      () => this.tryAlternativeExtensions(originalSrc),
      () => this.defaultImage,
      () => this.placeholderImage
    ];

    for (const strategy of fallbackStrategies) {
      try {
        const fallbackSrc = strategy();
        if (fallbackSrc && fallbackSrc !== originalSrc) {
          const isValid = await this.validateImage(fallbackSrc);
          if (isValid) {
            console.log('✅ Found working fallback:', fallbackSrc);
            imgElement.src = fallbackSrc;
            return;
          }
        }
      } catch (error) {
        continue;
      }
    }

    // All strategies failed, use placeholder
    console.log('📷 Using placeholder for:', originalSrc);
    imgElement.src = this.placeholderImage;
    imgElement.alt = 'Product image not available';
  }

  tryOrganizedPath(originalSrc) {
    // Convert old paths to organized structure
    if (originalSrc.includes('/products/')) {
      const filename = originalSrc.split('/').pop();
      const productMatch = originalSrc.match(/product-(\d+)/);
      
      if (productMatch) {
        const productId = productMatch[1];
        // Try organized path
        return `assets/images/products-organized/${productId}-product/1-main.jpg`;
      }
    }
    return null;
  }

  tryLegacyPath(originalSrc) {
    // Convert organized paths to legacy structure
    if (originalSrc.includes('/products-organized/')) {
      const pathParts = originalSrc.split('/');
      const folderName = pathParts[pathParts.length - 2];
      const productId = folderName.split('-')[0];
      
      // Try legacy path
      return `assets/images/products/product-${productId}/main.jpg`;
    }
    return null;
  }

  tryAlternativeExtensions(originalSrc) {
    const extensions = ['.jpg', '.jpeg', '.png', '.webp', '.avif'];
    const basePath = originalSrc.replace(/\.[^/.]+$/, '');
    
    // Try different extensions
    for (const ext of extensions) {
      if (!originalSrc.endsWith(ext)) {
        return basePath + ext;
      }
    }
    return null;
  }

  async validateImage(src) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = src;
      
      // Timeout after 3 seconds
      setTimeout(() => resolve(false), 3000);
    });
  }

  // Public method to fix image with loading state
  async fixImageWithLoading(imgElement, originalSrc) {
    if (this.loadingImages.has(imgElement)) {
      return; // Already being processed
    }

    this.loadingImages.set(imgElement, true);

    // Show loading state
    const originalAlt = imgElement.alt;
    imgElement.alt = 'Loading...';
    imgElement.style.opacity = '0.5';

    try {
      // First check if original image works
      const isOriginalValid = await this.validateImage(originalSrc);
      if (isOriginalValid) {
        imgElement.src = originalSrc;
        imgElement.style.opacity = '1';
        imgElement.alt = originalAlt;
        return;
      }

      // Try fallback strategies
      await this.tryFallbackStrategies(imgElement, originalSrc);
    } finally {
      imgElement.style.opacity = '1';
      imgElement.alt = originalAlt;
      this.loadingImages.delete(imgElement);
    }
  }

  // Method to preload and fix all images on a page
  async fixAllImagesOnPage() {
    const images = document.querySelectorAll('img[src]');
    console.log(`🔍 Checking ${images.length} images on page...`);

    const promises = Array.from(images).map(async (img) => {
      const src = img.src;
      const isValid = await this.validateImage(src);
      
      if (!isValid) {
        console.log('🔧 Fixing invalid image:', src);
        await this.fixImageWithLoading(img, src);
      }
    });

    await Promise.all(promises);
    console.log('✅ All images checked and fixed');
  }

  // Method to get working image path for a product
  async getWorkingImagePath(productId, imageType = '1-main') {
    const possiblePaths = [
      `assets/images/products-organized/${productId}-product/${imageType}.jpg`,
      `assets/images/products-organized/${productId}-product/${imageType}.png`,
      `assets/images/products/product-${productId}/main.jpg`,
      `assets/images/products/product-${productId}/main.png`,
      this.defaultImage,
      this.placeholderImage
    ];

    for (const path of possiblePaths) {
      const isValid = await this.validateImage(path);
      if (isValid) {
        return path;
      }
    }

    return this.placeholderImage;
  }
}

// Initialize global image fallback manager
const imageManager = new ImageFallbackManager();

// Make it available globally
window.imageManager = imageManager;

// Utility functions
window.fixAllImages = () => imageManager.fixAllImagesOnPage();
window.getWorkingImage = (productId, imageType) => imageManager.getWorkingImagePath(productId, imageType);

// Auto-fix images when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => imageManager.fixAllImagesOnPage(), 1000);
  });
} else {
  setTimeout(() => imageManager.fixAllImagesOnPage(), 1000);
}

console.log('🖼️ Image fallback system loaded. Use fixAllImages() to manually fix images.');

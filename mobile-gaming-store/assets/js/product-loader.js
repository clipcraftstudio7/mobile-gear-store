// Universal Product Loader Script
// This script automatically loads product data from products.json for any product page

class ProductLoader {
  constructor() {
    this.products = [];
    this.currentProduct = null;
    this.init();
  }

  async init() {
    await this.loadProducts();
    this.loadCurrentProduct();
    this.updatePageContent();
  }

  async loadProducts() {
    try {
      const response = await fetch("/products");
      this.products = await response.json();
    } catch (error) {
      console.error("Error loading products:", error);
    }
  }

  loadCurrentProduct() {
    // Get product ID from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get("id");

    if (productId) {
      this.currentProduct = this.products.find((p) => p.id == productId);
    } else {
      // Try to get product ID from filename (e.g., product1.html -> id 1)
      const pathParts = window.location.pathname.split("/");
      const filename = pathParts[pathParts.length - 1];
      const match = filename.match(/product(\d+)\.html/);

      if (match) {
        const id = parseInt(match[1]);
        this.currentProduct = this.products.find((p) => p.id === id);
      } else {
        // Fallback to first product
        this.currentProduct = this.products[0];
      }
    }
  }

  updatePageContent() {
    if (!this.currentProduct) {
      console.error("Product not found");
      return;
    }

    this.updateTitle();
    this.updateProductInfo();
    this.updatePrice();
    this.updateImages();
    this.updateDescription();
    this.updateFeatures();
    this.updateMetaData();
    this.updateCartFunctions();
  }

  updateTitle() {
    // Update page title
    document.title = `${this.currentProduct.name} | MobileGaming`;

    // Update product title
    const titleElement = document.querySelector(".product-title");
    if (titleElement) {
      titleElement.textContent = this.currentProduct.name;
    }
  }

  updateProductInfo() {
    // Update category
    const categoryElement = document.querySelector(".product-category");
    if (categoryElement) {
      categoryElement.textContent = this.currentProduct.category;
    }

    // Update rating
    const ratingElement = document.querySelector(".product-rating .stars");
    if (ratingElement) {
      const stars = "⭐".repeat(Math.round(this.currentProduct.rating || 4));
      ratingElement.innerHTML = stars;
    }

    // Update review count
    const reviewElement = document.querySelector(".rating-count");
    if (reviewElement) {
      reviewElement.textContent = `(${
        this.currentProduct.reviews || 0
      } reviews)`;
    }
  }

  updatePrice() {
    const priceContainer = document.querySelector(".product-price");
    if (!priceContainer) return;

    if (
      this.currentProduct.originalPrice &&
      this.currentProduct.originalPrice > this.currentProduct.price
    ) {
      // Show discount
      priceContainer.innerHTML = `
        <span class="original-price">$${this.currentProduct.originalPrice.toLocaleString()}</span>
        <span class="current-price">$${this.currentProduct.price.toLocaleString()}</span>
        <span class="savings">Save $${(
          this.currentProduct.originalPrice - this.currentProduct.price
        ).toLocaleString()}</span>
      `;
    } else {
      // Show regular price only
      priceContainer.innerHTML = `
        <span class="current-price">$${this.currentProduct.price.toLocaleString()}</span>
      `;
    }
  }

  updateImages() {
    // Update main image
    const mainImage = document.getElementById("main-image");
    if (mainImage) {
      mainImage.src = this.currentProduct.image;
      mainImage.alt = this.currentProduct.name;
    }

    // Update thumbnails if they exist
    const thumbnails = document.querySelectorAll(".thumbnail");
    if (thumbnails.length > 0) {
      // For now, use the same image for all thumbnails
      // In a real implementation, you'd have multiple images per product
      thumbnails.forEach((thumb) => {
        thumb.src = this.currentProduct.image;
        thumb.alt = this.currentProduct.name;
      });
    }
  }

  updateDescription() {
    const descElement = document.querySelector(".product-description");
    if (descElement) {
      descElement.textContent = this.currentProduct.description;
    }
  }

  updateFeatures() {
    const featuresContainer = document.querySelector(".feature-tags");
    if (
      featuresContainer &&
      this.currentProduct.features &&
      this.currentProduct.features.length > 0
    ) {
      featuresContainer.innerHTML = this.currentProduct.features
        .map((feature) => `<span class="feature-tag">${feature}</span>`)
        .join("");
    }
  }

  updateMetaData() {
    // Update stock information
    const stockElements = document.querySelectorAll(
      ".detail-item .detail-value"
    );
    stockElements.forEach((element) => {
      const label = element.previousElementSibling?.textContent;
      if (label && label.includes("Stock")) {
        element.textContent = `${this.currentProduct.stock} in stock`;
      }
    });

    // Update discount information
    const discountElements = document.querySelectorAll(
      ".detail-item .detail-value"
    );
    discountElements.forEach((element) => {
      const label = element.previousElementSibling?.textContent;
      if (label && label.includes("Discount")) {
        if (this.currentProduct.discount > 0) {
          element.textContent = `${this.currentProduct.discount}% off`;
        } else {
          element.textContent = "No discount";
        }
      }
    });

    // Update rating in details
    const ratingElements = document.querySelectorAll(
      ".detail-item .detail-value"
    );
    ratingElements.forEach((element) => {
      const label = element.previousElementSibling?.textContent;
      if (label && label.includes("Rating")) {
        element.textContent = `${this.currentProduct.rating}/5`;
      }
    });

    // Update reviews in details
    const reviewElements = document.querySelectorAll(
      ".detail-item .detail-value"
    );
    reviewElements.forEach((element) => {
      const label = element.previousElementSibling?.textContent;
      if (label && label.includes("Reviews")) {
        element.textContent = `${this.currentProduct.reviews || 0} reviews`;
      }
    });
  }

  updateCartFunctions() {
    // Use the main cart.js addToCart if available
    const product = {
      id: this.currentProduct.id,
      name: this.currentProduct.name,
      price: this.currentProduct.price,
      image: this.currentProduct.image,
      quantity: 1,
    };
    window.addToCart = () => {
      if (typeof window._mainAddToCart === "function") {
        window._mainAddToCart(product);
      } else {
        alert("Cart system not loaded!");
      }
    };
    // Update buy now function
    window.buyNow = () => {
      if (typeof window._mainAddToCart === "function") {
        window._mainAddToCart(product);
        window.location.href = "../checkout.html";
      } else {
        alert("Cart system not loaded!");
      }
    };
  }
}

// Initialize the product loader when the page loads
document.addEventListener("DOMContentLoaded", function () {
  new ProductLoader();
});

// Product Page Loader
document.addEventListener("DOMContentLoaded", function () {
  // Get product ID from URL
  const urlParams = new URLSearchParams(window.location.search);
  const productId = urlParams.get("id") || getProductIdFromUrl();

  if (productId) {
    loadProductData(productId);
  }
});

function getProductIdFromUrl() {
  // Extract product ID from URL like product1.html -> 1
  const path = window.location.pathname;
  const match = path.match(/product(\d+)\.html$/);
  return match ? match[1] : null;
}

async function loadProductData(productId) {
  try {
    // Load products data
    const response = await fetch("/products");

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const products = await response.json();

    // Find the product by ID
    const product = products.find((p) => p.id == productId);

    if (product) {
      populateProductPage(product);
    } else {
      console.error("Product not found:", productId);
      showError("Product not found");
    }
  } catch (error) {
    console.error("Error loading product data:", error);
    showError("Error loading product data: " + error.message);
  }
}

function populateProductPage(product) {
  // Update page title
  document.title = `${product.name} - Mobile Gaming Store`;

  // Update breadcrumb
  const breadcrumb = document.querySelector(".breadcrumb");
  if (breadcrumb) {
    breadcrumb.innerHTML = `
            <a href="../index.html">Home</a> > 
            <a href="../index.html#${product.category.toLowerCase()}">${
      product.category
    }</a> > 
            ${product.name}
        `;
  }

  // Update main product image
  const mainImage = document.getElementById("main-image");
  if (mainImage) {
    mainImage.src = `../${product.image}`;
    mainImage.alt = `${product.name} - Main View`;
  }

  // Update thumbnails (create multiple thumbnails from the same image for now)
  const thumbnailGrid = document.querySelector(".thumbnail-grid");
  if (thumbnailGrid) {
    thumbnailGrid.innerHTML = `
            <img class="thumbnail active" src="../${product.image}" alt="${product.name} Front View" onclick="changeImage(this, '../${product.image}')" />
            <img class="thumbnail" src="../${product.image}" alt="${product.name} Side View" onclick="changeImage(this, '../${product.image}')" />
            <img class="thumbnail" src="../${product.image}" alt="${product.name} Back View" onclick="changeImage(this, '../${product.image}')" />
            <img class="thumbnail" src="../${product.image}" alt="${product.name} Detail View" onclick="changeImage(this, '../${product.image}')" />
            <img class="thumbnail" src="../${product.image}" alt="${product.name} Package View" onclick="changeImage(this, '../${product.image}')" />
        `;
  }

  // Update product info
  const productTitle = document.querySelector(".product-title");
  if (productTitle) {
    productTitle.textContent = product.name;
  }

  const productCategory = document.querySelector(".product-category");
  if (productCategory) {
    productCategory.textContent = product.category;
  }

  const productRating = document.querySelector(".product-rating .stars");
  if (productRating) {
    productRating.innerHTML = "⭐".repeat(Math.round(product.rating || 4));
  }

  const ratingCount = document.querySelector(".rating-count");
  if (ratingCount) {
    ratingCount.textContent = `(${product.reviews || 0} reviews)`;
  }

  // Update pricing
  const originalPrice = document.querySelector(".original-price");
  const currentPrice = document.querySelector(".current-price");
  const savings = document.querySelector(".savings");

  if (product.originalPrice && product.originalPrice > product.price) {
    if (originalPrice)
      originalPrice.textContent = `$${product.originalPrice.toLocaleString()}`;
    if (currentPrice)
      currentPrice.textContent = `$${product.price.toLocaleString()}`;
    if (savings)
      savings.textContent = `Save $${(
        product.originalPrice - product.price
      ).toLocaleString()}`;
  } else {
    if (originalPrice) originalPrice.style.display = "none";
    if (currentPrice)
      currentPrice.textContent = `$${product.price.toLocaleString()}`;
    if (savings) savings.style.display = "none";
  }

  // Update description
  const productDescription = document.querySelector(".product-description");
  if (productDescription) {
    productDescription.textContent = product.description;
  }

  // Update product details
  const detailItems = document.querySelectorAll(".detail-item");
  detailItems.forEach((item) => {
    const label = item.querySelector(".detail-label");
    const value = item.querySelector(".detail-value");

    if (label && value) {
      const labelText = label.textContent.toLowerCase();

      if (labelText.includes("stock")) {
        value.textContent = `${product.stock} in stock`;
      } else if (
        labelText.includes("discount") &&
        product.originalPrice &&
        product.originalPrice > product.price
      ) {
        const discountPercent = Math.round(
          ((product.originalPrice - product.price) / product.originalPrice) *
            100
        );
        value.textContent = `${discountPercent}% off`;
      } else if (labelText.includes("reviews")) {
        value.textContent = `${product.reviews || 0} reviews`;
      } else if (labelText.includes("rating")) {
        value.textContent = `${product.rating || 4}/5`;
      }
    }
  });

  // Update related products (load a few random products)
  loadRelatedProducts(product.category, product.id);
}

function loadRelatedProducts(category, currentProductId) {
  fetch("/products")
    .then((response) => response.json())
    .then((products) => {
      // Filter products by category and exclude current product
      const relatedProducts = products
        .filter((p) => p.category === category && p.id != currentProductId)
        .slice(0, 4);

      // If not enough products in same category, add some random ones
      if (relatedProducts.length < 4) {
        const randomProducts = products
          .filter((p) => p.id != currentProductId)
          .sort(() => 0.5 - Math.random())
          .slice(0, 4 - relatedProducts.length);
        relatedProducts.push(...randomProducts);
      }

      updateRelatedProductsSection(relatedProducts);
    })
    .catch((error) => {
      console.error("Error loading related products:", error);
    });
}

function updateRelatedProductsSection(relatedProducts) {
  const relatedGrid = document.querySelector(".related-grid");
  if (relatedGrid) {
    relatedGrid.innerHTML = relatedProducts
      .map(
        (product) => `
            <div class="related-card" onclick="window.location.href='product${
              product.id
            }.html'">
                <img class="related-image" src="../${product.image}" alt="${
          product.name
        }" />
                <div class="related-info">
                    <div class="related-name">${product.name}</div>
                    <div class="related-price">$${product.price.toLocaleString()}</div>
                    <div class="related-rating">${"⭐".repeat(
                      Math.round(product.rating || 4)
                    )} (${product.reviews || 0} reviews)</div>
                </div>
            </div>
        `
      )
      .join("");
  }
}

function showError(message) {
  const container = document.querySelector(".product-container");
  if (container) {
    container.innerHTML = `
            <div style="text-align: center; padding: 50px;">
                <h2>Error</h2>
                <p>${message}</p>
                <a href="../index.html" style="color: #25d366;">Return to Home</a>
            </div>
        `;
  }
}

// Image change function (if it doesn't exist)
if (typeof changeImage === "undefined") {
  function changeImage(thumbnail, newSrc) {
    // Remove active class from all thumbnails
    document.querySelectorAll(".thumbnail").forEach((thumb) => {
      thumb.classList.remove("active");
    });

    // Add active class to clicked thumbnail
    thumbnail.classList.add("active");

    // Change main image
    const mainImage = document.getElementById("main-image");
    if (mainImage) {
      mainImage.src = newSrc;
    }
  }
}

const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");
const multer = require("multer");

const app = express();
const PORT = process.env.PORT || 3000;

// Add health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Path to your products.json file
const PRODUCTS_PATH = path.join(
  __dirname,
  "mobile-gaming-store/data/products.json"
);

app.use(cors());
app.use(express.json());

// Serve static files from mobile-gaming-store directory
app.use(express.static(path.join(__dirname, 'mobile-gaming-store')));

// Add a root route to serve index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'mobile-gaming-store', 'index.html'));
});

const upload = multer({
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      cb(
        null,
        path.join(__dirname, "mobile-gaming-store/assets/images/products/")
      );
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      const ext = path.extname(file.originalname);
      cb(null, file.fieldname + "-" + uniqueSuffix + ext);
    },
  }),
});

// Endpoint to add a product (with file upload support)
app.post(
  "/add-product",
  upload.fields([
    { name: "imageFile1" },
    { name: "imageFile2" },
    { name: "imageFile3" },
    { name: "imageFile4" },
    { name: "imageFile5" },
  ]),
  (req, res) => {
    const { name, price, category, discount, description } = req.body;
    // Collect images: prefer file, fallback to URL
    const images = [];
    for (let i = 1; i <= 5; i++) {
      // If file uploaded, use its path
      if (
        req.files &&
        req.files[`imageFile${i}`] &&
        req.files[`imageFile${i}`][0]
      ) {
        // Store relative path for frontend use
        const relPath = path
          .relative(
            path.join(__dirname, "mobile-gaming-store"),
            req.files[`imageFile${i}`][0].path
          )
          .replace(/\\/g, "/");
        images.push("assets/" + relPath.split("assets/")[1]);
      } else if (req.body[`imageUrl${i}`]) {
        images.push(req.body[`imageUrl${i}`]);
      }
    }
    if (!name || !price || !category || !images[0] || !description) {
      return res.status(400).json({ error: "Missing fields" });
    }
    fs.readFile(PRODUCTS_PATH, "utf8", (err, data) => {
      if (err)
        return res.status(500).json({ error: "Failed to read products.json" });
      let products = [];
      try {
        products = JSON.parse(data);
      } catch {
        products = [];
      }
      const newProduct = {
        id: Date.now(),
        name,
        category,
        price: parseFloat(price),
        discount: discount ? parseFloat(discount) : 0,
        images,
        image: images[0], // for compatibility
        description,
      };
      products.push(newProduct);
      fs.writeFile(PRODUCTS_PATH, JSON.stringify(products, null, 2), (err) => {
        if (err)
          return res
            .status(500)
            .json({ error: "Failed to write products.json" });
        res.json({ success: true, product: newProduct });
      });
    });
  }
);

// Enhanced endpoint for organized image structure
const organizedUpload = multer({
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      const folderName = req.body.folderName;
      const destPath = path.join(__dirname, "mobile-gaming-store/assets/images/products-organized", folderName);
      
      // Create directory if it doesn't exist
      if (!fs.existsSync(destPath)) {
        fs.mkdirSync(destPath, { recursive: true });
      }
      
      cb(null, destPath);
    },
    filename: function (req, file, cb) {
      // Use organized naming: 1-main.jpg, 2-angle.jpg, etc.
      const fieldIndex = file.fieldname.replace('imageFile', '');
      const imageNames = ['1-main.jpg', '2-angle.jpg', '3-detail.jpg', '4-context.jpg', '5-package.jpg'];
      const fileName = imageNames[parseInt(fieldIndex) - 1] || `${fieldIndex}-image.jpg`;
      cb(null, fileName);
    },
  }),
});

// Enhanced add product endpoint with organized images
app.post(
  "/add-product-organized",
  organizedUpload.fields([
    { name: "imageFile1" },
    { name: "imageFile2" },
    { name: "imageFile3" },
    { name: "imageFile4" },
    { name: "imageFile5" },
  ]),
  (req, res) => {
    const { name, price, category, discount, description, stock, rating, reviews, productId, folderName, features } = req.body;
    
    if (!name || !price || !category || !description || !productId || !folderName) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Generate organized image paths
    const basePath = `assets/images/products-organized/${folderName}`;
    const images = [
      `${basePath}/1-main.jpg`,
      `${basePath}/2-angle.jpg`,
      `${basePath}/3-detail.jpg`,
      `${basePath}/4-context.jpg`,
      `${basePath}/5-package.jpg`
    ];

    fs.readFile(PRODUCTS_PATH, "utf8", (err, data) => {
      if (err) return res.status(500).json({ error: "Failed to read products.json" });
      
      let products = [];
      try {
        products = JSON.parse(data);
      } catch {
        products = [];
      }

      const newProduct = {
        id: parseInt(productId),
        name,
        category,
        price: parseFloat(price),
        originalPrice: parseFloat(price) / (1 - (parseFloat(discount) || 0) / 100),
        discount: parseFloat(discount) || 0,
        stock: parseInt(stock) || 10,
        rating: parseFloat(rating) || 4.5,
        reviews: parseInt(reviews) || 50,
        image: images[0], // Main image
        images, // All images
        link: `product-template.html?id=${productId}`,
        description,
        features: features ? JSON.parse(features) : []
      };

      products.push(newProduct);

      fs.writeFile(PRODUCTS_PATH, JSON.stringify(products, null, 2), (err) => {
        if (err) return res.status(500).json({ error: "Failed to write products.json" });
        res.json({ success: true, product: newProduct });
      });
    });
  }
);

// Enhanced edit product endpoint
app.post("/edit-product-enhanced", (req, res) => {
  const { id, ...updates } = req.body;
  if (!id) return res.status(400).json({ error: "Missing product id" });
  
  fs.readFile(PRODUCTS_PATH, "utf8", (err, data) => {
    if (err) return res.status(500).json({ error: "Failed to read products.json" });
    
    let products = [];
    try {
      products = JSON.parse(data);
    } catch {
      return res.status(500).json({ error: "Invalid products.json" });
    }
    
    const idx = products.findIndex((p) => String(p.id) === String(id));
    if (idx === -1) return res.status(404).json({ error: "Product not found" });
    
    // Update fields while preserving image structure
    products[idx] = { 
      ...products[idx], 
      ...updates,
      // Recalculate originalPrice if price or discount changed
      originalPrice: updates.price ? parseFloat(updates.price) / (1 - (parseFloat(updates.discount) || 0) / 100) : products[idx].originalPrice
    };
    
    fs.writeFile(PRODUCTS_PATH, JSON.stringify(products, null, 2), (err) => {
      if (err) return res.status(500).json({ error: "Failed to write products.json" });
      res.json({ success: true, product: products[idx] });
    });
  });
});

// Delete product endpoint
app.post("/delete-product", (req, res) => {
  const { id } = req.body;
  if (!id) return res.status(400).json({ error: "Missing product id" });
  
  fs.readFile(PRODUCTS_PATH, "utf8", (err, data) => {
    if (err) return res.status(500).json({ error: "Failed to read products.json" });
    
    let products = [];
    try {
      products = JSON.parse(data);
    } catch {
      return res.status(500).json({ error: "Invalid products.json" });
    }
    
    const productIndex = products.findIndex((p) => String(p.id) === String(id));
    if (productIndex === -1) return res.status(404).json({ error: "Product not found" });
    
    // Get product info before deletion for cleanup
    const product = products[productIndex];
    
    // Remove product from array
    products.splice(productIndex, 1);
    
    fs.writeFile(PRODUCTS_PATH, JSON.stringify(products, null, 2), (err) => {
      if (err) return res.status(500).json({ error: "Failed to write products.json" });
      
      // TODO: Optionally delete product images folder
      // This is commented out for safety - you can enable it if needed
      /*
      if (product.images && product.images[0]) {
        const folderPath = path.dirname(path.join(__dirname, "mobile-gaming-store", product.images[0]));
        fs.rmdir(folderPath, { recursive: true }, (err) => {
          if (err) console.log("Could not delete product images folder:", err);
        });
      }
      */
      
      res.json({ success: true, message: "Product deleted successfully" });
    });
  });
});

// Original edit endpoint (for backward compatibility)
app.post("/edit-product", (req, res) => {
  const { id, ...updates } = req.body;
  if (!id) return res.status(400).json({ error: "Missing product id" });
  fs.readFile(PRODUCTS_PATH, "utf8", (err, data) => {
    if (err)
      return res.status(500).json({ error: "Failed to read products.json" });
    let products = [];
    try {
      products = JSON.parse(data);
    } catch {
      return res.status(500).json({ error: "Invalid products.json" });
    }
    const idx = products.findIndex((p) => String(p.id) === String(id));
    if (idx === -1) return res.status(404).json({ error: "Product not found" });
    // Update fields
    products[idx] = { ...products[idx], ...updates };
    fs.writeFile(PRODUCTS_PATH, JSON.stringify(products, null, 2), (err) => {
      if (err)
        return res.status(500).json({ error: "Failed to write products.json" });
      res.json({ success: true, product: products[idx] });
    });
  });
});

// (Optional) Serve your products.json for testing
app.get("/products", (req, res) => {
  fs.readFile(PRODUCTS_PATH, "utf8", (err, data) => {
    if (err)
      return res.status(500).json({ error: "Failed to read products.json" });
    res.type("json").send(data);
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Backend server running on port ${PORT}`);
  console.log(`📁 Static files served from: ${path.join(__dirname, 'mobile-gaming-store')}`);
  console.log(`🌐 Health check available at: /health`);
  console.log(`📦 Products API available at: /products`);
});

// Add error handling
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
});

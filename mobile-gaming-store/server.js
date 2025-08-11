const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const fsSync = require('fs');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the current directory
app.use(express.static('.'));

// Ensure products-organized directory exists
const ensureProductsOrganizedDir = async () => {
  const dir = path.join(__dirname, 'assets', 'images', 'products-organized');
  try {
    await fs.access(dir);
  } catch (error) {
    await fs.mkdir(dir, { recursive: true });
    console.log('📁 Created products-organized directory');
  }
};

// Multer configuration for organized uploads
const organizedUpload = multer({
  storage: multer.diskStorage({
    destination: async (req, file, cb) => {
      const { folderName } = req.body;
      if (!folderName) {
        return cb(new Error('Folder name is required'));
      }

      const uploadPath = path.join(__dirname, 'assets', 'images', 'products-organized', folderName);
      
      try {
        await fs.mkdir(uploadPath, { recursive: true });
        cb(null, uploadPath);
      } catch (error) {
        cb(error);
      }
    },
    filename: (req, file, cb) => {
      const { originalname } = file;
      const ext = path.extname(originalname);
      
      // Determine file number based on existing files
      const imageFields = ['mainImage', 'angleImage', 'detailImage', 'featureImage', 'packageImage'];
      const fieldIndex = imageFields.indexOf(file.fieldname);
      const imageNumber = fieldIndex !== -1 ? fieldIndex + 1 : 1;
      
      const imageNames = {
        1: '1-main',
        2: '2-angle', 
        3: '3-detail',
        4: '4-feature',
        5: '5-package'
      };
      
      const filename = `${imageNames[imageNumber] || `${imageNumber}-image`}${ext}`;
      cb(null, filename);
    }
  }),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp|avif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Routes

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'Server is running', timestamp: new Date().toISOString() });
});

// Get all products
app.get('/products', async (req, res) => {
  try {
    const productsPath = path.join(__dirname, 'data', 'products.json');
    const productsData = await fs.readFile(productsPath, 'utf8');
    const products = JSON.parse(productsData);
    res.json(products);
  } catch (error) {
    console.error('Error reading products:', error);
    res.status(500).json({ error: 'Failed to read products' });
  }
});

// Add new product with organized image structure
app.post('/add-product-organized', organizedUpload.fields([
  { name: 'mainImage', maxCount: 1 },
  { name: 'angleImage', maxCount: 1 },
  { name: 'detailImage', maxCount: 1 },
  { name: 'featureImage', maxCount: 1 },
  { name: 'packageImage', maxCount: 1 }
]), async (req, res) => {
  try {
    console.log('📦 Adding new product with organized structure');
    console.log('Request body:', req.body);
    console.log('Files:', req.files);

    const {
      name,
      price,
      category,
      discount = 0,
      description,
      stock = 0,
      rating = 0,
      reviews = 0,
      features,
      productId,
      folderName
    } = req.body;

    // Validate required fields
    if (!name || !price || !category || !productId || !folderName) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['name', 'price', 'category', 'productId', 'folderName']
      });
    }

    // Parse features if it's a string
    let parsedFeatures = [];
    if (features) {
      try {
        parsedFeatures = typeof features === 'string' ? JSON.parse(features) : features;
      } catch (e) {
        console.warn('Failed to parse features, using as string');
        parsedFeatures = [features];
      }
    }

    // Generate image paths
    const imagePaths = [];
    const imageFields = ['mainImage', 'angleImage', 'detailImage', 'featureImage', 'packageImage'];
    const imageNames = ['1-main.jpg', '2-angle.jpg', '3-detail.jpg', '4-feature.jpg', '5-package.jpg'];
    
    for (let i = 0; i < 5; i++) {
      imagePaths.push(`assets/images/products-organized/${folderName}/${imageNames[i]}`);
    }

    // Calculate original price
    const originalPrice = discount > 0 ? Math.round(parseFloat(price) / (1 - discount / 100)) : parseFloat(price);

    // Create new product object
    const newProduct = {
      id: parseInt(productId),
      name: name.trim(),
      price: parseFloat(price),
      originalPrice: originalPrice,
      discount: parseInt(discount),
      image: imagePaths[0], // Main image
      images: imagePaths, // All images
      category: category.trim(),
      description: description ? description.trim() : '',
      stock: parseInt(stock),
      rating: parseFloat(rating),
      reviews: parseInt(reviews),
      features: parsedFeatures,
      link: `product.html?id=${productId}`
    };

    // Read existing products
    const productsPath = path.join(__dirname, 'data', 'products.json');
    let products = [];
    
    try {
      const productsData = await fs.readFile(productsPath, 'utf8');
      products = JSON.parse(productsData);
    } catch (error) {
      console.log('No existing products file, creating new one');
    }

    // Add new product
    products.push(newProduct);

    // Save updated products
    await fs.writeFile(productsPath, JSON.stringify(products, null, 2));

    console.log('✅ Product added successfully:', newProduct.name);
    res.json({ 
      message: 'Product added successfully', 
      product: newProduct,
      imagePaths: imagePaths
    });

  } catch (error) {
    console.error('❌ Error adding product:', error);
    res.status(500).json({ 
      error: 'Failed to add product', 
      details: error.message 
    });
  }
});

// Edit existing product with enhanced fields
app.post('/edit-product-enhanced', async (req, res) => {
  try {
    console.log('✏️ Editing product with enhanced fields');
    console.log('Request body:', req.body);

    const { id, updates } = req.body;

    if (!id || !updates) {
      return res.status(400).json({ error: 'Product ID and updates are required' });
    }

    // Read existing products
    const productsPath = path.join(__dirname, 'data', 'products.json');
    const productsData = await fs.readFile(productsPath, 'utf8');
    let products = JSON.parse(productsData);

    // Find product to update
    const productIndex = products.findIndex(p => p.id === parseInt(id));
    if (productIndex === -1) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const existingProduct = products[productIndex];

    // Parse features if provided
    let parsedFeatures = existingProduct.features || [];
    if (updates.features !== undefined) {
      try {
        parsedFeatures = typeof updates.features === 'string' ? 
          JSON.parse(updates.features) : updates.features;
      } catch (e) {
        console.warn('Failed to parse features, keeping existing');
      }
    }

    // Calculate original price if price or discount changed
    let originalPrice = existingProduct.originalPrice;
    if (updates.price !== undefined || updates.discount !== undefined) {
      const newPrice = updates.price !== undefined ? parseFloat(updates.price) : existingProduct.price;
      const newDiscount = updates.discount !== undefined ? parseInt(updates.discount) : (existingProduct.discount || 0);
      originalPrice = newDiscount > 0 ? Math.round(newPrice / (1 - newDiscount / 100)) : newPrice;
    }

    // Update product with new data
    const updatedProduct = {
      ...existingProduct,
      name: updates.name !== undefined ? updates.name.trim() : existingProduct.name,
      price: updates.price !== undefined ? parseFloat(updates.price) : existingProduct.price,
      originalPrice: originalPrice,
      discount: updates.discount !== undefined ? parseInt(updates.discount) : existingProduct.discount,
      category: updates.category !== undefined ? updates.category.trim() : existingProduct.category,
      description: updates.description !== undefined ? updates.description.trim() : existingProduct.description,
      stock: updates.stock !== undefined ? parseInt(updates.stock) : existingProduct.stock,
      rating: updates.rating !== undefined ? parseFloat(updates.rating) : existingProduct.rating,
      reviews: updates.reviews !== undefined ? parseInt(updates.reviews) : existingProduct.reviews,
      features: parsedFeatures
    };

    products[productIndex] = updatedProduct;

    // Save updated products
    await fs.writeFile(productsPath, JSON.stringify(products, null, 2));

    console.log('✅ Product updated successfully:', updatedProduct.name);
    res.json({ 
      success: true,
      message: 'Product updated successfully', 
      product: updatedProduct 
    });

  } catch (error) {
    console.error('❌ Error updating product:', error);
    res.status(500).json({ 
      error: 'Failed to update product', 
      details: error.message 
    });
  }
});

// Delete product
app.post('/delete-product', async (req, res) => {
  try {
    console.log('🗑️ Deleting product');
    const { id } = req.body;

    if (!id) {
      return res.status(400).json({ error: 'Product ID is required' });
    }

    // Read existing products
    const productsPath = path.join(__dirname, 'data', 'products.json');
    const productsData = await fs.readFile(productsPath, 'utf8');
    let products = JSON.parse(productsData);

    // Find product to delete
    const productIndex = products.findIndex(p => p.id === parseInt(id));
    if (productIndex === -1) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const deletedProduct = products[productIndex];
    
    // Remove product from array
    products.splice(productIndex, 1);

    // Save updated products
    await fs.writeFile(productsPath, JSON.stringify(products, null, 2));

    console.log('✅ Product deleted successfully:', deletedProduct.name);
    res.json({ 
      success: true,
      message: 'Product deleted successfully', 
      deletedProduct: deletedProduct 
    });

  } catch (error) {
    console.error('❌ Error deleting product:', error);
    res.status(500).json({ 
      error: 'Failed to delete product', 
      details: error.message 
    });
  }
});

// Legacy endpoints for backward compatibility
app.post('/add-product', async (req, res) => {
  try {
    const { name, price, category, image } = req.body;

    if (!name || !price || !category) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const newProduct = {
      id: Date.now(),
      name: name.trim(),
      price: parseFloat(price),
      category: category.trim(),
      image: image || 'assets/images/default-product.jpg',
      link: `product.html?id=${Date.now()}`
    };

    const productsPath = path.join(__dirname, 'data', 'products.json');
    let products = [];
    
    try {
      const productsData = await fs.readFile(productsPath, 'utf8');
      products = JSON.parse(productsData);
    } catch (error) {
      console.log('No existing products file, creating new one');
    }

    products.push(newProduct);
    await fs.writeFile(productsPath, JSON.stringify(products, null, 2));

    res.json({ message: 'Product added successfully', product: newProduct });
  } catch (error) {
    console.error('Error adding product:', error);
    res.status(500).json({ error: 'Failed to add product' });
  }
});

app.post('/edit-product', async (req, res) => {
  try {
    const { id, name, price, category } = req.body;

    if (!id || !name || !price || !category) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const productsPath = path.join(__dirname, 'data', 'products.json');
    const productsData = await fs.readFile(productsPath, 'utf8');
    let products = JSON.parse(productsData);

    const productIndex = products.findIndex(p => p.id === parseInt(id));
    if (productIndex === -1) {
      return res.status(404).json({ error: 'Product not found' });
    }

    products[productIndex] = {
      ...products[productIndex],
      name: name.trim(),
      price: parseFloat(price),
      category: category.trim()
    };

    await fs.writeFile(productsPath, JSON.stringify(products, null, 2));

    res.json({ message: 'Product updated successfully', product: products[productIndex] });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum size is 10MB.' });
    }
  }
  
  res.status(500).json({ 
    error: 'Internal server error', 
    details: error.message 
  });
});

// Start server
const startServer = async () => {
  await ensureProductsOrganizedDir();
  
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📁 Serving files from: ${__dirname}`);
    console.log(`🛒 Products endpoint: http://localhost:${PORT}/products`);
    console.log(`⚡ Health check: http://localhost:${PORT}/health`);
  });
};

startServer().catch(console.error);

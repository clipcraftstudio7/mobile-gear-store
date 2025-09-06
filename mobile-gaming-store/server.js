const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const fsSync = require('fs');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const { autoBackup, checkAndRestore } = require('./backup-products');

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

// Supabase configuration (prefer env vars, fallback to current values)
const SUPABASE_URL = process.env.SUPABASE_URL || "https://kokntkhxkymllafuubun.supabase.co";
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtva250a2h4a3ltbGxhZnV1YnVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3NzYxODcsImV4cCI6MjA2ODM1MjE4N30.Ekc6HLszFSYTIgsvzTdKJWr85nFMUH2HQBQrg_uqXRc";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const USE_SUPABASE_STORAGE = (process.env.USE_SUPABASE_STORAGE || 'false').toLowerCase() === 'true';
const SUPABASE_STORAGE_BUCKET = process.env.SUPABASE_STORAGE_BUCKET || 'product-images';
// Prefer Supabase as the primary data source; fallback to JSON only if explicitly set
const PRODUCTS_SOURCE = (process.env.PRODUCTS_SOURCE || 'supabase').toLowerCase();

// Initialize Supabase clients
// - Public for auth/user context
// - Admin for server-side DB ops (bypasses RLS)
const supabasePublic = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from this app's directory
app.use(express.static(__dirname));

// Serve index.html at root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

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

// Multer configuration for organized uploads (write to base, move later)
const organizedUpload = multer({
  storage: multer.diskStorage({
    destination: async (req, file, cb) => {
      try {
        const basePath = path.join(__dirname, 'assets', 'images', 'products-organized');
        await fs.mkdir(basePath, { recursive: true });
        cb(null, basePath);
      } catch (error) {
        cb(error);
      }
    },
    filename: (req, file, cb) => {
      const { originalname } = file;
      const ext = path.extname(originalname);
      // Determine filename from field name
      const imageFields = ['mainImage', 'angleImage', 'detailImage', 'featureImage', 'packageImage'];
      const fieldIndex = imageFields.indexOf(file.fieldname);
      const imageNumber = fieldIndex !== -1 ? fieldIndex + 1 : 1;
      const imageNames = { 1: '1-main', 2: '2-angle', 3: '3-detail', 4: '4-context', 5: '5-package' };
      const filename = `${imageNames[imageNumber] || `${imageNumber}-image`}${ext || '.jpg'}`;
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

// Ensure campaign assets directory exists
const ensureCampaignAssetsDir = async () => {
  const dir = path.join(__dirname, 'assets', 'images', 'campaigns');
  try {
    await fs.mkdir(dir, { recursive: true });
  } catch {}
};

// Multer for campaign asset uploads (images)
const campaignAssetStorage = multer.diskStorage({
  destination: async (req, file, cb) => {
    try {
      const campaignId = String(req.params.id || 'general');
      const uploadPath = path.join(__dirname, 'assets', 'images', 'campaigns', campaignId);
      await fs.mkdir(uploadPath, { recursive: true });
      cb(null, uploadPath);
    } catch (e) {
      cb(e);
    }
  },
  filename: (req, file, cb) => {
    const original = file.originalname.replace(/[^a-zA-Z0-9._-]+/g, '-');
    const stamp = Date.now();
    const ext = path.extname(original) || '.jpg';
    cb(null, `asset-${stamp}${ext}`);
  }
});

const campaignAssetUpload = multer({
  storage: campaignAssetStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const ok = /^image\/(png|jpe?g|webp|gif|svg\+xml)$/.test(file.mimetype);
    if (!ok) return cb(new Error('Unsupported file type'));
    cb(null, true);
  }
});

// Routes

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'Server is running', timestamp: new Date().toISOString() });
});

// Detailed health status: server, Supabase DB, and Storage (if enabled)
app.get('/health/details', async (req, res) => {
  const status = {
    server: { ok: true, time: new Date().toISOString() },
    supabase: { ok: false, error: null },
    storage: { enabled: USE_SUPABASE_STORAGE, ok: false, error: null },
    config: {
      productsSource: PRODUCTS_SOURCE,
      useStorage: USE_SUPABASE_STORAGE,
      storageBucket: SUPABASE_STORAGE_BUCKET
    }
  };

  try {
    const { error } = await supabase.from('products').select('id').limit(1);
    if (error) {
      status.supabase.error = error.message;
    } else {
      status.supabase.ok = true;
    }
  } catch (e) {
    status.supabase.error = e.message;
  }

  if (USE_SUPABASE_STORAGE) {
    try {
      // Attempt a lightweight public URL generation (does not create objects)
      const testPath = 'health/ok.txt';
      const { data } = supabase.storage.from(SUPABASE_STORAGE_BUCKET).getPublicUrl(testPath);
      if (data && data.publicUrl) {
        status.storage.ok = true;
      } else {
        status.storage.error = 'Failed to derive public URL';
      }
    } catch (e) {
      status.storage.error = e.message;
    }
  } else {
    status.storage.ok = false;
  }

  res.json(status);
});

// Get all products with enhanced filtering (source: Supabase or JSON)
app.get('/products', async (req, res) => {
  try {
    if (PRODUCTS_SOURCE === 'json') {
      console.log('📦 Fetching products from local JSON...');
      const productsPath = path.join(__dirname, 'data', 'products.json');
      const productsData = await fs.readFile(productsPath, 'utf8');
      const localProducts = JSON.parse(productsData);
      return res.json(localProducts);
    }

    console.log('📦 Fetching products from Supabase...');

    // Fetch products from Supabase
    const { data: products, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('❌ Error fetching from Supabase:', error);
      // Fallback to local file if Supabase fails
      try {
        const productsPath = path.join(__dirname, 'data', 'products.json');
        const productsData = await fs.readFile(productsPath, 'utf8');
        const localProducts = JSON.parse(productsData);
        console.log('📁 Using local products as fallback');
        res.json(localProducts);
        return;
      } catch (fallbackError) {
        console.error('❌ Fallback also failed:', fallbackError);
        res.status(500).json({ error: 'Failed to read products' });
        return;
      }
    }
    
    // Convert Supabase format to frontend format
    const formattedProducts = products.map(product => ({
      id: product.id,
      name: product.name,
      price: product.price,
      originalPrice: product.original_price,
      discount: product.discount || 0,
      category: product.category,
      description: product.description,
      stock: product.stock || 0,
      rating: product.rating,
      reviews: product.reviews || 0,
      image: product.image,
      images: product.images,
      link: product.link,
      features: product.features || [],
      createdAt: product.created_at,
      updatedAt: product.updated_at,
      isNew: product.is_new || false
    }));
    
    // Check if client wants fresh products only
    const freshOnly = req.query.fresh === 'true';
    const lastUpdate = req.query.lastUpdate;
    
    if (freshOnly) {
      const now = new Date();
      const fourteenDaysAgo = new Date(now.getTime() - (14 * 24 * 60 * 60 * 1000));
      const freshProducts = formattedProducts.filter(product => {
        if (!product.createdAt) return false;
        const productDate = new Date(product.createdAt);
        return productDate >= fourteenDaysAgo;
      }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      res.json(freshProducts);
    } else if (lastUpdate) {
      // Return only products updated since lastUpdate
      const lastUpdateTime = new Date(lastUpdate);
      const updatedProducts = formattedProducts.filter(product => {
        if (!product.updatedAt) return false;
        const productUpdateTime = new Date(product.updatedAt);
        return productUpdateTime > lastUpdateTime;
      });
      
      res.json({
        hasUpdates: updatedProducts.length > 0,
        products: updatedProducts,
        lastUpdate: new Date().toISOString()
      });
    } else {
      res.json(formattedProducts);
    }
    
    console.log(`✅ Fetched ${formattedProducts.length} products from Supabase`);
  } catch (error) {
    console.error('❌ Error reading products:', error);
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
  let step = 'start';
  try {
    console.log('📦 Adding new product with organized structure');
    console.log('Request body:', req.body);
    console.log('Files:', Object.keys(req.files || {}));

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

    step = 'validate-inputs';
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

    // Move uploaded files into the correct folder (if not using storage)
    step = 'prepare-folders';
    const basePath = path.join(__dirname, 'assets', 'images', 'products-organized');
    const targetFolder = path.join(basePath, folderName);
    try {
      await fs.mkdir(targetFolder, { recursive: true });
    } catch (e) {
      console.error('❌ Failed to ensure target folder', targetFolder, e.message);
      return res.status(500).json({ error: 'Failed to create product images folder', details: e.message, step });
    }

    // Generate image paths using actual uploaded filenames (preserve extensions)
    let imagePaths = [];
    const imageFields = ['mainImage', 'angleImage', 'detailImage', 'featureImage', 'packageImage'];
    const defaultNames = ['1-main.jpg', '2-angle.jpg', '3-detail.jpg', '4-context.jpg', '5-package.jpg'];

    imagePaths = imageFields.map((field, idx) => {
      const fileMeta = (req.files && req.files[field] && req.files[field][0]) ? req.files[field][0] : null;
      const filename = fileMeta?.filename || defaultNames[idx];
      return `assets/images/products-organized/${folderName}/${filename}`;
    });

    // Move physical files into the folderName directory (non-storage path)
    step = 'move-files';
    for (const field of imageFields) {
      const fileMeta = (req.files && req.files[field] && req.files[field][0]) ? req.files[field][0] : null;
      if (!fileMeta) continue;
      const src = fileMeta.path;
      const dest = path.join(targetFolder, path.basename(fileMeta.filename));
      try {
        if (src !== dest) {
          await fs.rename(src, dest);
        }
      } catch (e) {
        console.warn('⚠️ File move failed, attempting copy', { src, dest, err: e.message });
        try {
          const buf = await fs.readFile(src);
          await fs.writeFile(dest, buf);
        } catch (e2) {
          console.error('❌ File move+copy failed for', dest, e2.message);
          return res.status(500).json({ error: 'Failed to store uploaded image', details: e2.message, step });
        }
      }
    }

    // Optionally upload to Supabase Storage and replace URLs with public URLs
    if (USE_SUPABASE_STORAGE) {
      step = 'storage-upload';
      const uploadedPaths = [];
      for (let i = 0; i < imageFields.length; i++) {
        try {
          const field = imageFields[i];
          const fileMeta = (req.files && req.files[field] && req.files[field][0]) ? req.files[field][0] : null;
          if (!fileMeta) {
            uploadedPaths.push(null);
            continue;
          }

          // Read the file (now moved) from target folder
          const localPath = path.join(targetFolder, fileMeta.filename);
          const buffer = await fs.readFile(localPath);
          const ext = path.extname(localPath).toLowerCase();
          const contentType = ext === '.png' ? 'image/png'
            : (ext === '.webp' ? 'image/webp'
            : (ext === '.gif' ? 'image/gif'
            : (ext === '.avif' ? 'image/avif' : 'image/jpeg')));

          // Use the same filename saved by multer to preserve extension
          const storagePath = `products-organized/${folderName}/${fileMeta.filename}`;
          const { error: upErr } = await supabase
            .storage
            .from(SUPABASE_STORAGE_BUCKET)
            .upload(storagePath, buffer, { upsert: true, contentType });
          if (upErr) {
            console.warn('Storage upload failed for', storagePath, upErr.message);
            uploadedPaths.push(null);
            continue;
          }

          const { data: pub } = supabase.storage.from(SUPABASE_STORAGE_BUCKET).getPublicUrl(storagePath);
          if (pub && pub.publicUrl) {
            uploadedPaths.push(pub.publicUrl);
          } else {
            uploadedPaths.push(null);
          }
        } catch (e) {
          console.warn('Storage upload exception:', e.message);
          uploadedPaths.push(null);
        }
      }

      // Replace any successfully uploaded URLs
      imagePaths = imagePaths.map((localUrl, idx) => uploadedPaths[idx] || localUrl);
    }

    // Calculate original price
    const originalPrice = discount > 0 ? Math.round(parseFloat(price) / (1 - discount / 100)) : parseFloat(price);

    // Create new product object
    step = 'build-product';
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
      link: `product.html?id=${productId}`,
      createdAt: new Date().toISOString(),
      isNew: true
    };

    // Save product to Supabase
    const supabaseProduct = {
      id: parseInt(productId),
      name: name.trim(),
      price: parseFloat(price),
      original_price: originalPrice,
      discount: parseInt(discount),
      category: category.trim(),
      description: description ? description.trim() : '',
      stock: parseInt(stock),
      rating: parseFloat(rating),
      reviews: parseInt(reviews),
      image: imagePaths[0], // Main image
      images: imagePaths, // All images
      link: `product.html?id=${productId}`,
      features: parsedFeatures,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_new: true
    };

    // Insert product into Supabase
    step = 'insert-supabase';
    const { data: insertedProduct, error: insertError } = await supabase
      .from('products')
      .insert([supabaseProduct])
      .select()
      .single();

    let savedTo = 'supabase';
    if (insertError) {
      console.error('❌ Error inserting product to Supabase:', insertError);
      
      // Fallback: save to local JSON if Supabase fails
      try {
        step = 'fallback-json';
        const productsPath = path.join(__dirname, 'data', 'products.json');
        let products = [];
        
        try {
          const productsData = await fs.readFile(productsPath, 'utf8');
          products = JSON.parse(productsData);
        } catch (error) {
          console.log('No existing products file, creating new one');
        }

        // Ensure data directory exists before writing
        const dataDir = path.dirname(productsPath);
        try { await fs.mkdir(dataDir, { recursive: true }); } catch {}

        products.push(newProduct);
        await fs.writeFile(productsPath, JSON.stringify(products, null, 2));
        console.log('✅ Product saved to local JSON as fallback');
        savedTo = 'json';
      } catch (fallbackError) {
        console.error('❌ Fallback save also failed:', fallbackError);
        return res.status(500).json({ 
          error: 'Failed to save product to both Supabase and local file', 
          details: insertError?.message || String(insertError),
          step
        });
      }
    }

    console.log('✅ Product added successfully to Supabase:', newProduct.name);
    res.json({ 
      message: savedTo === 'supabase' ? 'Product added to Supabase' : 'Product saved to local JSON (Supabase insert failed)', 
      savedTo,
      product: newProduct,
      imagePaths: imagePaths,
      supabaseId: insertedProduct?.id || null,
      storage: { enabled: USE_SUPABASE_STORAGE, bucket: SUPABASE_STORAGE_BUCKET }
    });

  } catch (error) {
    console.error('❌ Error adding product:', error);
    res.status(500).json({ 
      error: 'Failed to add product', 
      details: error?.message || String(error),
      step
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

    // Get existing product from Supabase
    const { data: existingProduct, error: fetchError } = await supabase
      .from('products')
      .select('*')
      .eq('id', parseInt(id))
      .single();

    if (fetchError || !existingProduct) {
      console.error('❌ Error fetching product from Supabase:', fetchError);
      return res.status(404).json({ error: 'Product not found' });
    }

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

    // Prepare update data for Supabase
    const updateData = {
      name: updates.name !== undefined ? updates.name.trim() : existingProduct.name,
      price: updates.price !== undefined ? parseFloat(updates.price) : existingProduct.price,
      original_price: originalPrice,
      discount: updates.discount !== undefined ? parseInt(updates.discount) : existingProduct.discount,
      category: updates.category !== undefined ? updates.category.trim() : existingProduct.category,
      description: updates.description !== undefined ? updates.description.trim() : existingProduct.description,
      stock: updates.stock !== undefined ? parseInt(updates.stock) : existingProduct.stock,
      rating: updates.rating !== undefined ? parseFloat(updates.rating) : existingProduct.rating,
      reviews: updates.reviews !== undefined ? parseInt(updates.reviews) : existingProduct.reviews,
      features: parsedFeatures,
      updated_at: new Date().toISOString()
    };

    // Update product in Supabase
    const { data: updatedProduct, error: updateError } = await supabase
      .from('products')
      .update(updateData)
      .eq('id', parseInt(id))
      .select()
      .single();

    if (updateError) {
      console.error('❌ Error updating product in Supabase:', updateError);
      return res.status(500).json({ 
        error: 'Failed to update product in Supabase', 
        details: updateError.message 
      });
    }

    // Convert back to frontend format
    const formattedProduct = {
      id: updatedProduct.id,
      name: updatedProduct.name,
      price: updatedProduct.price,
      originalPrice: updatedProduct.original_price,
      discount: updatedProduct.discount || 0,
      category: updatedProduct.category,
      description: updatedProduct.description,
      stock: updatedProduct.stock || 0,
      rating: updatedProduct.rating,
      reviews: updatedProduct.reviews || 0,
      image: updatedProduct.image,
      images: updatedProduct.images,
      link: updatedProduct.link,
      features: updatedProduct.features || [],
      createdAt: updatedProduct.created_at,
      updatedAt: updatedProduct.updated_at,
      isNew: updatedProduct.is_new || false
    };

    console.log('✅ Product updated successfully in Supabase:', formattedProduct.name);
    res.json({ 
      success: true,
      message: 'Product updated successfully in Supabase', 
      product: formattedProduct 
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

    // Get product from Supabase before deleting
    const { data: existingProduct, error: fetchError } = await supabase
      .from('products')
      .select('*')
      .eq('id', parseInt(id))
      .single();

    if (fetchError || !existingProduct) {
      console.error('❌ Error fetching product from Supabase:', fetchError);
      return res.status(404).json({ error: 'Product not found' });
    }

    // Delete product from Supabase
    const { error: deleteError } = await supabase
      .from('products')
      .delete()
      .eq('id', parseInt(id));

    if (deleteError) {
      console.error('❌ Error deleting product from Supabase:', deleteError);
      return res.status(500).json({ 
        error: 'Failed to delete product from Supabase', 
        details: deleteError.message 
      });
    }

    // Convert to frontend format
    const deletedProduct = {
      id: existingProduct.id,
      name: existingProduct.name,
      price: existingProduct.price,
      originalPrice: existingProduct.original_price,
      discount: existingProduct.discount || 0,
      category: existingProduct.category,
      description: existingProduct.description,
      stock: existingProduct.stock || 0,
      rating: existingProduct.rating,
      reviews: existingProduct.reviews || 0,
      image: existingProduct.image,
      images: existingProduct.images,
      link: existingProduct.link,
      features: existingProduct.features || [],
      createdAt: existingProduct.created_at,
      updatedAt: existingProduct.updated_at,
      isNew: existingProduct.is_new || false
    };

    console.log('✅ Product deleted successfully from Supabase:', deletedProduct.name);
    res.json({ 
      success: true,
      message: 'Product deleted successfully from Supabase', 
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

// ============================================================================
// CAMPAIGN API ENDPOINTS
// ============================================================================

// Helper function to verify admin JWT
const verifyAdminToken = async (req, res, next) => {
  try {
    // Dev bypass: allow ADMIN_ID header to pass when no token (non-production convenience)
    const adminIdHeader = req.headers['x-admin-id'];
    const isDevBypassEnabled = process.env.ALLOW_ADMIN_BYPASS === 'true';

    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      if (isDevBypassEnabled && adminIdHeader) {
        // Minimal profile with admin role for bypass
        req.user = { id: String(adminIdHeader) };
        return next();
      }
      return res.status(401).json({ error: 'No token provided' });
    }

    // Verify token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Check if user has admin role (you can customize this based on your user roles)
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(401).json({ error: 'Token verification failed' });
  }
};

// Rate limiting middleware
const rateLimit = require('express-rate-limit');
const campaignLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { error: 'Too many requests, please try again later.' }
});

// ============================================================================
// ADMIN ENDPOINTS (Protected)
// ============================================================================

// List campaigns with nested relations (for admin dashboard)
app.get('/admin/campaigns', verifyAdminToken, async (req, res) => {
  try {
    const { data: campaigns, error } = await supabase
      .from('campaigns')
      .select(`
        *,
        campaign_products ( id ),
        campaign_assets ( id ),
        popup_rules ( id )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Campaigns list error:', error);
      return res.status(500).json({ error: 'Failed to list campaigns' });
    }

    // Map counts for light payload
    const withCounts = (campaigns || []).map(c => ({
      ...c,
      campaign_products_count: c.campaign_products?.length || 0,
      campaign_assets_count: c.campaign_assets?.length || 0,
      popup_rules_count: c.popup_rules?.length || 0,
    }));

    res.json({ campaigns: withCounts });
  } catch (error) {
    console.error('Campaigns list error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get a single campaign with full relations
app.get('/admin/campaigns/:id', verifyAdminToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { data: campaign, error } = await supabase
      .from('campaigns')
      .select(`
        *,
        campaign_products (*),
        campaign_assets (*),
        popup_rules (*)
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Get campaign error:', error);
      return res.status(500).json({ error: 'Failed to fetch campaign' });
    }
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }
    res.json({ campaign });
  } catch (error) {
    console.error('Get campaign error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create a campaign
app.post('/admin/campaigns', verifyAdminToken, async (req, res) => {
  try {
    const { slug, title, description, type, start_at, end_at, preview_payload } = req.body;
    
    if (!slug || !title || !type) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if slug already exists
    const { data: existingCampaign } = await supabase
      .from('campaigns')
      .select('id')
      .eq('slug', slug)
      .single();

    if (existingCampaign) {
      return res.status(400).json({ error: 'Campaign slug already exists' });
    }

    const { data: campaign, error } = await supabase
      .from('campaigns')
      .insert({
        slug,
        title,
        description,
        type,
        start_at,
        end_at,
        preview_payload,
        created_by: req.user.id
      })
      .select()
      .single();

    if (error) {
      console.error('Campaign creation error:', error);
      return res.status(500).json({ error: 'Failed to create campaign' });
    }

    res.status(201).json({ message: 'Campaign created successfully', campaign });
  } catch (error) {
    console.error('Campaign creation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete a campaign (cascade deletes products/assets/rules due to FK)
app.delete('/admin/campaigns/:id', verifyAdminToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase
      .from('campaigns')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Delete campaign error:', error);
      return res.status(500).json({ error: 'Failed to delete campaign' });
    }

    res.json({ message: 'Campaign deleted' });
  } catch (error) {
    console.error('Delete campaign error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ----------------------------------------------------------------------------
// Campaign Assets (Banners) Management
// ----------------------------------------------------------------------------

// Add a campaign asset (banner/promo asset)
app.post('/admin/campaigns/:id/assets', verifyAdminToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { asset_type, url, alt, width, height, metadata } = req.body;

    if (!asset_type || !url) {
      return res.status(400).json({ error: 'asset_type and url are required' });
    }

    const { data: inserted, error } = await supabase
      .from('campaign_assets')
      .insert({
        campaign_id: parseInt(id),
        asset_type,
        url,
        alt,
        width,
        height,
        metadata: metadata || {}
      })
      .select()
      .single();

    if (error) {
      console.error('Add asset error:', error);
      return res.status(500).json({ error: 'Failed to add asset' });
    }

    res.status(201).json({ message: 'Asset added', asset: inserted });
  } catch (error) {
    console.error('Add asset error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Upload a campaign asset image and create asset record
app.post('/admin/campaigns/:id/assets/upload', verifyAdminToken, campaignAssetUpload.single('file'), async (req, res) => {
  try {
    const { id } = req.params;
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Optional fields
    const alt = req.body.alt || null;
    const position = req.body.position || null; // e.g., hero|strip|grid|popup
    const asset_type = req.body.asset_type || 'image';
    let metadata = {};
    if (req.body.metadata) {
      try { metadata = JSON.parse(req.body.metadata); } catch {}
    }
    if (position) {
      metadata.position = position;
    }

    const relativeUrl = path.join('assets', 'images', 'campaigns', String(id), req.file.filename).replace(/\\/g, '/');

    const { data: inserted, error } = await supabase
      .from('campaign_assets')
      .insert({
        campaign_id: parseInt(id),
        asset_type,
        url: `/${relativeUrl}`,
        alt,
        width: null,
        height: null,
        metadata
      })
      .select()
      .single();

    if (error) {
      console.error('Upload asset error:', error);
      return res.status(500).json({ error: 'Failed to save asset' });
    }

    res.status(201).json({ message: 'Asset uploaded', asset: inserted });
  } catch (error) {
    console.error('Upload asset error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update a campaign asset
app.put('/admin/assets/:assetId', verifyAdminToken, async (req, res) => {
  try {
    const { assetId } = req.params;
    const updateData = req.body;

    const { data: asset, error } = await supabase
      .from('campaign_assets')
      .update({
        ...updateData,
        // metadata can be replaced entirely by client
      })
      .eq('id', assetId)
      .select()
      .single();

    if (error) {
      console.error('Update asset error:', error);
      return res.status(500).json({ error: 'Failed to update asset' });
    }

    if (!asset) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    res.json({ message: 'Asset updated', asset });
  } catch (error) {
    console.error('Update asset error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete a campaign asset
app.delete('/admin/campaigns/:id/assets/:assetId', verifyAdminToken, async (req, res) => {
  try {
    const { id, assetId } = req.params;

    const { error } = await supabase
      .from('campaign_assets')
      .delete()
      .eq('id', assetId)
      .eq('campaign_id', id);

    if (error) {
      console.error('Delete asset error:', error);
      return res.status(500).json({ error: 'Failed to delete asset' });
    }

    res.json({ message: 'Asset deleted' });
  } catch (error) {
    console.error('Delete asset error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ----------------------------------------------------------------------------
// Popup Rules Management
// ----------------------------------------------------------------------------

// Add popup rule
app.post('/admin/campaigns/:id/popup_rules', verifyAdminToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { trigger_type, trigger_value, device_target, geo_target, frequency_days, show_once } = req.body;

    if (!trigger_type) {
      return res.status(400).json({ error: 'trigger_type is required' });
    }

    const { data: rule, error } = await supabase
      .from('popup_rules')
      .insert({
        campaign_id: parseInt(id),
        trigger_type,
        trigger_value,
        device_target,
        geo_target,
        frequency_days,
        show_once
      })
      .select()
      .single();

    if (error) {
      console.error('Add popup rule error:', error);
      return res.status(500).json({ error: 'Failed to add popup rule' });
    }

    res.status(201).json({ message: 'Popup rule added', rule });
  } catch (error) {
    console.error('Add popup rule error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update popup rule
app.put('/admin/popup_rules/:ruleId', verifyAdminToken, async (req, res) => {
  try {
    const { ruleId } = req.params;
    const updateData = req.body;

    const { data: rule, error } = await supabase
      .from('popup_rules')
      .update(updateData)
      .eq('id', ruleId)
      .select()
      .single();

    if (error) {
      console.error('Update popup rule error:', error);
      return res.status(500).json({ error: 'Failed to update popup rule' });
    }

    if (!rule) {
      return res.status(404).json({ error: 'Popup rule not found' });
    }

    res.json({ message: 'Popup rule updated', rule });
  } catch (error) {
    console.error('Update popup rule error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete popup rule
app.delete('/admin/popup_rules/:ruleId', verifyAdminToken, async (req, res) => {
  try {
    const { ruleId } = req.params;

    const { error } = await supabase
      .from('popup_rules')
      .delete()
      .eq('id', ruleId);

    if (error) {
      console.error('Delete popup rule error:', error);
      return res.status(500).json({ error: 'Failed to delete popup rule' });
    }

    res.json({ message: 'Popup rule deleted' });
  } catch (error) {
    console.error('Delete popup rule error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update a campaign
app.put('/admin/campaigns/:id', verifyAdminToken, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const { data: campaign, error } = await supabase
      .from('campaigns')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Campaign update error:', error);
      return res.status(500).json({ error: 'Failed to update campaign' });
    }

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    res.json({ message: 'Campaign updated successfully', campaign });
  } catch (error) {
    console.error('Campaign update error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Bulk add products to campaign
app.post('/admin/campaigns/:id/products', verifyAdminToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { products } = req.body;

    if (!products || !Array.isArray(products)) {
      return res.status(400).json({ error: 'Products array is required' });
    }

    // Verify campaign exists
    const { data: campaign } = await supabase
      .from('campaigns')
      .select('id')
      .eq('id', id)
      .single();

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    // Prepare products data
    const campaignProducts = products.map(product => ({
      campaign_id: parseInt(id),
      product_id: product.product_id,
      original_price: product.original_price,
      sale_price: product.sale_price,
      reserved_stock: product.reserved_stock || 0,
      max_per_customer: product.max_per_customer || 1,
      display_order: product.display_order || 0,
      metadata: product.metadata || {}
    }));

    const { data: insertedProducts, error } = await supabase
      .from('campaign_products')
      .insert(campaignProducts)
      .select();

    if (error) {
      console.error('Product addition error:', error);
      return res.status(500).json({ error: 'Failed to add products to campaign' });
    }

    res.json({ 
      message: 'Products added to campaign successfully', 
      products: insertedProducts 
    });
  } catch (error) {
    console.error('Product addition error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update a campaign product (e.g., sale_price, reserved_stock, limits)
app.put('/admin/campaign_products/:campaignProductId', verifyAdminToken, async (req, res) => {
  try {
    const { campaignProductId } = req.params;
    const updateData = req.body;

    const { data: cp, error } = await supabase
      .from('campaign_products')
      .update({
        original_price: updateData.original_price,
        sale_price: updateData.sale_price,
        reserved_stock: updateData.reserved_stock,
        max_per_customer: updateData.max_per_customer,
        display_order: updateData.display_order,
        metadata: updateData.metadata
      })
      .eq('id', campaignProductId)
      .select()
      .single();

    if (error) {
      console.error('Update campaign product error:', error);
      return res.status(500).json({ error: 'Failed to update campaign product' });
    }

    if (!cp) {
      return res.status(404).json({ error: 'Campaign product not found' });
    }

    res.json({ message: 'Campaign product updated', campaign_product: cp });
  } catch (error) {
    console.error('Update campaign product error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete a campaign product
app.delete('/admin/campaign_products/:campaignProductId', verifyAdminToken, async (req, res) => {
  try {
    const { campaignProductId } = req.params;

    const { error } = await supabase
      .from('campaign_products')
      .delete()
      .eq('id', campaignProductId);

    if (error) {
      console.error('Delete campaign product error:', error);
      return res.status(500).json({ error: 'Failed to delete campaign product' });
    }

    res.json({ message: 'Campaign product deleted' });
  } catch (error) {
    console.error('Delete campaign product error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Activate campaign
app.post('/admin/campaigns/:id/activate', verifyAdminToken, async (req, res) => {
  try {
    const { id } = req.params;

    const { data: campaign, error } = await supabase
      .from('campaigns')
      .update({ 
        is_active: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Campaign activation error:', error);
      return res.status(500).json({ error: 'Failed to activate campaign' });
    }

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    res.json({ message: 'Campaign activated successfully', campaign });
  } catch (error) {
    console.error('Campaign activation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Deactivate campaign
app.post('/admin/campaigns/:id/deactivate', verifyAdminToken, async (req, res) => {
  try {
    const { id } = req.params;

    const { data: campaign, error } = await supabase
      .from('campaigns')
      .update({ 
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Campaign deactivation error:', error);
      return res.status(500).json({ error: 'Failed to deactivate campaign' });
    }

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    res.json({ message: 'Campaign deactivated successfully', campaign });
  } catch (error) {
    console.error('Campaign deactivation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get campaign preview
app.get('/admin/campaigns/:id/preview', verifyAdminToken, async (req, res) => {
  try {
    const { id } = req.params;

    const { data: campaign, error } = await supabase
      .from('campaigns')
      .select(`
        *,
        campaign_products (
          *,
          product:products (*)
        ),
        campaign_assets (*)
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Campaign preview error:', error);
      return res.status(500).json({ error: 'Failed to get campaign preview' });
    }

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    // Calculate time left for flash sales
    if (campaign.type === 'flash' && campaign.start_at && campaign.end_at) {
      const now = new Date();
      const startTime = new Date(campaign.start_at);
      const endTime = new Date(campaign.end_at);
      
      if (now < startTime) {
        campaign.time_left_seconds = Math.floor((startTime - now) / 1000);
        campaign.status = 'upcoming';
      } else if (now >= startTime && now <= endTime) {
        campaign.time_left_seconds = Math.floor((endTime - now) / 1000);
        campaign.status = 'active';
      } else {
        campaign.time_left_seconds = 0;
        campaign.status = 'expired';
      }
    }

    res.json({ campaign });
  } catch (error) {
    console.error('Campaign preview error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============================================================================
// PUBLIC ENDPOINTS (Rate Limited)
// ============================================================================

// Get active hero/banner/popup campaigns with assets and rules
app.get('/campaigns/active', campaignLimiter, async (req, res) => {
  try {
    const nowIso = new Date().toISOString();
    const { data: campaigns, error } = await supabase
      .from('campaigns')
      .select(`
        *,
        campaign_assets (*),
        popup_rules (*)
      `)
      .in('type', ['hero', 'banner', 'popup'])
      .eq('is_active', true)
      .or(`and(start_at.lte.${nowIso},end_at.gte.${nowIso}),and(start_at.is.null,end_at.is.null),and(start_at.is.null,end_at.gte.${nowIso}),and(start_at.lte.${nowIso},end_at.is.null)`) // active window or open-ended
      .order('start_at', { ascending: true });

    if (error) {
      console.error('Active campaigns fetch error:', error);
      return res.status(500).json({ error: 'Failed to fetch active campaigns' });
    }

    res.json({ campaigns: campaigns || [] });
  } catch (error) {
    console.error('Active campaigns fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get active and upcoming flash sales
app.get('/flashsales', campaignLimiter, async (req, res) => {
  try {
    const now = new Date().toISOString();
    
    const { data: campaigns, error } = await supabase
      .from('campaigns')
      .select(`
        *,
        campaign_products (
          *,
          product:products (*)
        ),
        campaign_assets (*)
      `)
      .eq('type', 'flash')
      .or(`start_at.gte.${now},and(is_active.eq.true,end_at.gte.${now})`)
      .order('start_at', { ascending: true });

    if (error) {
      console.error('Flash sales fetch error:', error);
      return res.status(500).json({ error: 'Failed to fetch flash sales' });
    }

    // Calculate time left for each campaign
    const campaignsWithTimeLeft = campaigns.map(campaign => {
      const now = new Date();
      const startTime = new Date(campaign.start_at);
      const endTime = new Date(campaign.end_at);
      
      if (now < startTime) {
        campaign.time_left_seconds = Math.floor((startTime - now) / 1000);
        campaign.status = 'upcoming';
      } else if (now >= startTime && now <= endTime) {
        campaign.time_left_seconds = Math.floor((endTime - now) / 1000);
        campaign.status = 'active';
      } else {
        campaign.time_left_seconds = 0;
        campaign.status = 'expired';
      }
      
      return campaign;
    });

    res.json({ campaigns: campaignsWithTimeLeft });
  } catch (error) {
    console.error('Flash sales fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get campaign detail by slug
app.get('/flashsales/:slug', campaignLimiter, async (req, res) => {
  try {
    const { slug } = req.params;

    const { data: campaign, error } = await supabase
      .from('campaigns')
      .select(`
        *,
        campaign_products (
          *,
          product:products (*)
        ),
        campaign_assets (*)
      `)
      .eq('slug', slug)
      .eq('type', 'flash')
      .single();

    if (error) {
      console.error('Campaign detail error:', error);
      return res.status(500).json({ error: 'Failed to fetch campaign' });
    }

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    // Calculate remaining reserved stock for each product
    const productsWithStock = await Promise.all(
      campaign.campaign_products.map(async (cp) => {
        const { data: reservations } = await supabase
          .from('stock_reservations')
          .select('quantity')
          .eq('campaign_product_id', cp.id)
          .eq('consumed', false)
          .gte('reserved_until', new Date().toISOString());

        const reservedQuantity = reservations?.reduce((sum, r) => sum + r.quantity, 0) || 0;
        const remainingStock = Math.max(0, cp.reserved_stock - reservedQuantity);

        return {
          ...cp,
          remaining_reserved_stock: remainingStock
        };
      })
    );

    campaign.campaign_products = productsWithStock;

    // Calculate time left
    const now = new Date();
    const startTime = new Date(campaign.start_at);
    const endTime = new Date(campaign.end_at);
    
    if (now < startTime) {
      campaign.time_left_seconds = Math.floor((startTime - now) / 1000);
      campaign.status = 'upcoming';
    } else if (now >= startTime && now <= endTime) {
      campaign.time_left_seconds = Math.floor((endTime - now) / 1000);
      campaign.status = 'active';
    } else {
      campaign.time_left_seconds = 0;
      campaign.status = 'expired';
    }

    res.json({ campaign });
  } catch (error) {
    console.error('Campaign detail error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Reserve product for cart
app.post('/cart/reserve', campaignLimiter, async (req, res) => {
  try {
    const { campaign_product_id, quantity, session_id } = req.body;
    
    if (!campaign_product_id || !quantity || !session_id) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Get campaign product details
    const { data: campaignProduct, error: cpError } = await supabase
      .from('campaign_products')
      .select(`
        *,
        campaign:campaigns (*)
      `)
      .eq('id', campaign_product_id)
      .single();

    if (cpError || !campaignProduct) {
      return res.status(404).json({ error: 'Campaign product not found' });
    }

    // Check if campaign is active
    if (!campaignProduct.campaign.is_active) {
      return res.status(400).json({ error: 'Campaign is not active' });
    }

    // Check campaign time
    const now = new Date();
    const startTime = new Date(campaignProduct.campaign.start_at);
    const endTime = new Date(campaignProduct.campaign.end_at);
    
    if (now < startTime || now > endTime) {
      return res.status(400).json({ error: 'Campaign is not running' });
    }

    // Check if user has already reserved this product
    const { data: existingReservations } = await supabase
      .from('stock_reservations')
      .select('quantity')
      .eq('campaign_product_id', campaign_product_id)
      .eq('session_id', session_id)
      .eq('consumed', false)
      .gte('reserved_until', now.toISOString());

    const alreadyReserved = existingReservations?.reduce((sum, r) => sum + r.quantity, 0) || 0;
    
    if (alreadyReserved + quantity > campaignProduct.max_per_customer) {
      return res.status(400).json({ 
        error: `Maximum ${campaignProduct.max_per_customer} items per customer. Already reserved: ${alreadyReserved}` 
      });
    }

    // Check available stock
    const { data: allReservations } = await supabase
      .from('stock_reservations')
      .select('quantity')
      .eq('campaign_product_id', campaign_product_id)
      .eq('consumed', false)
      .gte('reserved_until', now.toISOString());

    const totalReserved = allReservations?.reduce((sum, r) => sum + r.quantity, 0) || 0;
    const availableStock = campaignProduct.reserved_stock - totalReserved;

    if (quantity > availableStock) {
      return res.status(400).json({ 
        error: `Only ${availableStock} items available` 
      });
    }

    // Create reservation
    const reservationTTL = 10 * 60 * 1000; // 10 minutes for guests
    const reservedUntil = new Date(Date.now() + reservationTTL);

    const { data: reservation, error: reservationError } = await supabase
      .from('stock_reservations')
      .insert({
        campaign_product_id,
        session_id,
        quantity,
        reserved_until: reservedUntil.toISOString()
      })
      .select()
      .single();

    if (reservationError) {
      console.error('Reservation creation error:', reservationError);
      return res.status(500).json({ error: 'Failed to create reservation' });
    }

    res.json({ 
      message: 'Product reserved successfully',
      reservation,
      reserved_until: reservedUntil.toISOString()
    });
  } catch (error) {
    console.error('Reservation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Checkout endpoint (consumes reservations)
app.post('/cart/checkout', campaignLimiter, async (req, res) => {
  try {
    const { session_id, reservation_ids } = req.body;
    
    if (!session_id || !reservation_ids || !Array.isArray(reservation_ids)) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Get all reservations for this session
    const { data: reservations, error: reservationsError } = await supabase
      .from('stock_reservations')
      .select(`
        *,
        campaign_product:campaign_products (*)
      `)
      .in('id', reservation_ids)
      .eq('session_id', session_id)
      .eq('consumed', false)
      .gte('reserved_until', new Date().toISOString());

    if (reservationsError) {
      console.error('Reservations fetch error:', reservationsError);
      return res.status(500).json({ error: 'Failed to fetch reservations' });
    }

    if (reservations.length === 0) {
      return res.status(400).json({ error: 'No valid reservations found' });
    }

    // Use transaction to consume reservations and update stock
    const { error: transactionError } = await supabase.rpc('consume_reservations', {
      reservation_ids: reservation_ids
    });

    if (transactionError) {
      console.error('Transaction error:', transactionError);
      return res.status(500).json({ error: 'Failed to process checkout' });
    }

    res.json({ 
      message: 'Checkout completed successfully',
      consumed_reservations: reservations.length
    });
  } catch (error) {
    console.error('Checkout error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get campaign metrics
app.get('/campaigns/:id/metrics', verifyAdminToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { start_date, end_date } = req.query;

    let query = supabase
      .from('campaign_metrics')
      .select('*')
      .eq('campaign_id', id)
      .order('metric_date', { ascending: true });

    if (start_date) {
      query = query.gte('metric_date', start_date);
    }
    if (end_date) {
      query = query.lte('metric_date', end_date);
    }

    const { data: metrics, error } = await query;

    if (error) {
      console.error('Metrics fetch error:', error);
      return res.status(500).json({ error: 'Failed to fetch metrics' });
    }

    res.json({ metrics });
  } catch (error) {
    console.error('Metrics fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
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
  
  // Check and restore products on startup
  await checkAndRestore();
  
  app.listen(PORT, HOST, () => {
    const displayHost = HOST === '0.0.0.0' ? 'localhost' : HOST;
    console.log(`🚀 Server running on http://${displayHost}:${PORT}`);
    console.log(`📁 Serving files from: ${__dirname}`);
    console.log(`🛒 Products endpoint: http://localhost:${PORT}/products`);
    console.log(`⚡ Health check: http://localhost:${PORT}/health`);
  });
};

startServer().catch(console.error);

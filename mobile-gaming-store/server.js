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
const USE_SUPABASE_STORAGE = (process.env.USE_SUPABASE_STORAGE || 'true').toLowerCase() === 'true';
const SUPABASE_STORAGE_BUCKET = process.env.SUPABASE_STORAGE_BUCKET || 'product-images';
// Prefer Supabase as the primary data source; fallback to JSON only if explicitly set
const PRODUCTS_SOURCE = (process.env.PRODUCTS_SOURCE || 'supabase').toLowerCase();
// Admin overrides for development or fixed admin
const ALLOW_ADMIN_BYPASS = (process.env.ALLOW_ADMIN_BYPASS || 'true').toLowerCase() === 'true';
const ADMIN_ID_ENV = process.env.ADMIN_ID || '';
const ADMIN_SECRET = process.env.ADMIN_SECRET || '';

// Initialize Supabase clients
// - Public for auth/user context
// - Admin for server-side DB ops (bypasses RLS)
const supabasePublic = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY);

// Local fallback storage for campaigns (dev-friendly)
const CAMPAIGNS_FILE = path.join(__dirname, 'data', 'campaigns.json');

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

// Lightweight banners endpoint (for site banner carousel)
app.get('/banners', async (req, res) => {
  try {
    // Scan candidate directories for banner images (supports your campaign banner folder)
    const candidateDirs = [
      path.join(__dirname, 'assets', 'images', 'banners'),
      path.join(__dirname, 'assets', 'campaing banner'), // note: current folder name
      path.join(__dirname, 'assets', 'images', 'campaigns'),
      path.join(__dirname, 'assets', 'campaigns')
    ];

    let foundDir = '';
    let imageFiles = [];
    for (const dir of candidateDirs) {
      try {
        const files = await fs.readdir(dir);
        const imgs = files.filter(f => /\.(png|jpe?g|webp|avif|svg)$/i.test(f));
        if (imgs.length) { foundDir = dir; imageFiles = imgs; break; }
      } catch {}
    }

    if (foundDir && imageFiles.length) {
      const publicPrefix = foundDir.replace(__dirname + path.sep, '').replace(/\\/g, '/');
      const banners = imageFiles.slice(0, 20).map((f) => {
        const base = f.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ');
        return {
          title: base.charAt(0).toUpperCase() + base.slice(1),
          subtitle: 'Featured banner',
          image: `${publicPrefix}/${f}`,
          badges: ['Featured'],
          ctaText: 'Explore',
          ctaLink: '/flashsales.html',
          meta: ['Limited time']
        };
      });
      return res.json(banners);
    }

    // Default set if no banner assets present
    return res.json([
      { title: 'Mega Flash Sale', subtitle: 'Up to 50% OFF on hot gaming gear', image: 'assets/images/products-organized/1-gaming-controller/1-main.jpg', badges: ['Flash','Limited'], ctaText: 'Shop Now', ctaLink: '/flashsales.html', meta: ['Free returns','24h dispatch'] },
      { title: 'Cooling Essentials', subtitle: 'Keep FPS high with pro coolers', image: 'assets/images/products-organized/3-mobile-cooling-fan-dual/1-main.jpg', badges: ['Trending'], ctaText: 'Explore', ctaLink: '/category.html?cat=Cooling', meta: ['Top rated','Best value'] }
    ]);
  } catch (e) {
    res.json([]);
  }
});

// ===== SITE-WIDE BANNER MANAGEMENT ENDPOINTS =====
console.log('🎯 Loading site banner endpoints...');

// Available banner assets
const availableBannerAssets = [
  {
    filename: "Gray and White Modern Headphone Instagram Post.png",
    path: "assets/campaing banner/Gray and White Modern Headphone Instagram Post.png",
    type: "headphone-promo",
    description: "Modern headphone promotion banner"
  },
  {
    filename: "i.png",
    path: "assets/campaing banner/i.png",
    type: "info",
    description: "Info banner"
  },
  {
    filename: "jty.png", 
    path: "assets/campaing banner/jty.png",
    type: "gaming",
    description: "Gaming promotion banner"
  },
  {
    filename: "u.png",
    path: "assets/campaing banner/u.png", 
    type: "special",
    description: "Special offer banner"
  }
];

// In-memory storage for site banners (replace with database later)
let siteBanners = [
  {
    id: 1,
    title: "🎮 Welcome to Mobile Gaming Store!",
    message: "Get 15% off your first order with code WELCOME15",
    type: "success", // success, warning, info, error
    is_active: true,
    position: "top", // top, bottom
    show_on_pages: ["all"], // ["all"] or specific page paths
    banner_image: "assets/campaing banner/Gray and White Modern Headphone Instagram Post.png",
    start_date: new Date().toISOString(),
    end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 2,
    title: "🔥 TEST BANNER - This Should Show!",
    message: "If you can see this, the banner system is working!",
    type: "warning",
    is_active: true,
    position: "top",
    show_on_pages: ["all"],
    banner_image: "assets/campaing banner/i.png",
    start_date: new Date().toISOString(),
    end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 3,
    title: "🎮 Gaming Gear Sale!",
    message: "Get 20% off all gaming accessories - Limited time offer!",
    type: "success",
    is_active: true,
    position: "top",
    show_on_pages: ["all"],
    banner_image: "assets/campaing banner/jty.png",
    start_date: new Date().toISOString(),
    end_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days from now
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

// Get active site banners (public endpoint)
app.get('/api/site-banners/active', async (req, res) => {
  try {
    console.log('📡 Site banners API called');
    const now = new Date().toISOString();
    console.log('⏰ Current time:', now);
    console.log('📊 Total banners in storage:', siteBanners.length);
    
    const activeBanners = siteBanners.filter(banner => {
      const isActive = banner.is_active;
      const isInDateRange = banner.start_date <= now && banner.end_date >= now;
      
      console.log(`🎯 Banner "${banner.title}": active=${isActive}, inRange=${isInDateRange}, start=${banner.start_date}, end=${banner.end_date}`);
      
      return isActive && isInDateRange;
    });
    
    console.log('✅ Active banners found:', activeBanners.length);
    res.json({ banners: activeBanners });
  } catch (error) {
    console.error('❌ Get active banners error:', error);
    res.status(500).json({ error: 'Failed to fetch active banners' });
  }
});

console.log('✅ Site banner endpoints loaded successfully!');

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
      // Determine filename from field name (supports canonical and legacy fields)
      const canonicalFields = ['mainImage', 'angleImage', 'detailImage', 'featureImage', 'packageImage'];
      const legacyFields = ['imageFile1', 'imageFile2', 'imageFile3', 'imageFile4', 'imageFile5'];
      let imageNumber = 1;
      const canonIdx = canonicalFields.indexOf(file.fieldname);
      if (canonIdx !== -1) {
        imageNumber = canonIdx + 1;
      } else {
        const legacyIdx = legacyFields.indexOf(file.fieldname);
        if (legacyIdx !== -1) {
          imageNumber = legacyIdx + 1;
        } else if (/^imageFile(\d+)$/.test(file.fieldname)) {
          const n = parseInt(file.fieldname.replace('imageFile', ''), 10);
          if (!Number.isNaN(n) && n >= 1 && n <= 5) imageNumber = n;
        }
      }
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
  { name: 'packageImage', maxCount: 1 },
  // Accept legacy names as well to avoid Unexpected field
  { name: 'imageFile1', maxCount: 1 },
  { name: 'imageFile2', maxCount: 1 },
  { name: 'imageFile3', maxCount: 1 },
  { name: 'imageFile4', maxCount: 1 },
  { name: 'imageFile5', maxCount: 1 }
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
    const canonicalFields = ['mainImage', 'angleImage', 'detailImage', 'featureImage', 'packageImage'];
    const legacyFields = ['imageFile1', 'imageFile2', 'imageFile3', 'imageFile4', 'imageFile5'];
    const defaultNames = ['1-main.jpg', '2-angle.jpg', '3-detail.jpg', '4-context.jpg', '5-package.jpg'];

    const getFileMetaAt = (index) => {
      return (req.files && req.files[canonicalFields[index]] && req.files[canonicalFields[index]][0])
        || (req.files && req.files[legacyFields[index]] && req.files[legacyFields[index]][0])
        || null;
    };

    imagePaths = Array.from({ length: 5 }).map((_, idx) => {
      const fileMeta = getFileMetaAt(idx);
      const filename = fileMeta?.filename || defaultNames[idx];
      return `assets/images/products-organized/${folderName}/${filename}`;
    });

    // Move physical files into the folderName directory (non-storage path)
    step = 'move-files';
    for (let i = 0; i < 5; i++) {
      const fileMeta = getFileMetaAt(i);
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
      console.log('☁️ Uploading images to Supabase storage...');
      const uploadedPaths = [];
      
      for (let i = 0; i < 5; i++) {
        try {
          const fileMeta = getFileMetaAt(i);
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
          console.log(`📤 Uploading ${fileMeta.filename} to ${storagePath}`);
          
          const { error: upErr } = await supabase
            .storage
            .from(SUPABASE_STORAGE_BUCKET)
            .upload(storagePath, buffer, { upsert: true, contentType });
            
          if (upErr) {
            console.error('❌ Storage upload failed for', storagePath, upErr.message);
            uploadedPaths.push(null);
            continue;
          }

          const { data: pub } = supabase.storage.from(SUPABASE_STORAGE_BUCKET).getPublicUrl(storagePath);
          if (pub && pub.publicUrl) {
            console.log('✅ Uploaded to:', pub.publicUrl);
            uploadedPaths.push(pub.publicUrl);
          } else {
            console.warn('⚠️ No public URL generated for', storagePath);
            uploadedPaths.push(null);
          }
        } catch (e) {
          console.error('❌ Storage upload exception:', e.message);
          uploadedPaths.push(null);
        }
      }

      // Replace any successfully uploaded URLs
      const originalPaths = [...imagePaths];
      imagePaths = imagePaths.map((localUrl, idx) => uploadedPaths[idx] || localUrl);
      
      console.log('📊 Upload Summary:');
      console.log('  Original paths:', originalPaths);
      console.log('  Final paths:', imagePaths);
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
    // Dev bypass: allow ADMIN_ID header or ADMIN_SECRET to pass when no token (non-production convenience)
    const adminIdHeader = req.headers['x-admin-id'] || '';
    const adminSecretHeader = req.headers['x-admin-secret'] || '';
    const isDevBypassEnabled = ALLOW_ADMIN_BYPASS;

    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      if (isDevBypassEnabled && (adminIdHeader || adminSecretHeader)) {
        // Minimal profile with admin role for bypass
        req.user = { id: String(adminIdHeader || ADMIN_ID_ENV || 'dev-admin') };
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
      .maybeSingle();

    const idIsEnvAdmin = ADMIN_ID_ENV && user.id === ADMIN_ID_ENV;
    const headerIdIsEnvAdmin = ADMIN_ID_ENV && adminIdHeader && String(adminIdHeader) === ADMIN_ID_ENV;
    const secretMatches = ADMIN_SECRET && adminSecretHeader && adminSecretHeader === ADMIN_SECRET;
    const hasAdminRole = !!profile && profile.role === 'admin';

    if (!(hasAdminRole || idIsEnvAdmin || headerIdIsEnvAdmin || (isDevBypassEnabled && secretMatches))) {
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

    if (!error) {
    const withCounts = (campaigns || []).map(c => ({
      ...c,
      campaign_products_count: c.campaign_products?.length || 0,
      campaign_assets_count: c.campaign_assets?.length || 0,
      popup_rules_count: c.popup_rules?.length || 0,
    }));
      return res.json({ campaigns: withCounts });
    }

    console.warn('⚠️ Falling back to local campaigns.json due to Supabase error:', error.message);
    try {
      const raw = await fs.readFile(CAMPAIGNS_FILE, 'utf8');
      const localCampaigns = JSON.parse(raw);
      return res.json({ campaigns: localCampaigns });
    } catch (e) {
      return res.status(500).json({ error: 'Failed to list campaigns' });
    }
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

    if (!error && campaign) {
      return res.json({ campaign });
    }
    // Fallback to local file
    try {
      const raw = await fs.readFile(CAMPAIGNS_FILE, 'utf8');
      const localCampaigns = JSON.parse(raw);
      const local = localCampaigns.find(c => String(c.id) === String(id));
      if (!local) return res.status(404).json({ error: 'Campaign not found' });
      return res.json({ campaign: local });
    } catch (e) {
      return res.status(500).json({ error: 'Failed to fetch campaign' });
    }
  } catch (error) {
    console.error('Get campaign error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create a campaign (with local JSON fallback)
app.post('/admin/campaigns', verifyAdminToken, async (req, res) => {
  try {
    const { slug, title, description, type, start_at, end_at, preview_payload } = req.body;
    
    if (!slug || !title || !type) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Try to check slug in Supabase (best-effort)
    let slugTaken = false;
    try {
    const { data: existingCampaign } = await supabase
      .from('campaigns')
      .select('id')
      .eq('slug', slug)
      .single();
      if (existingCampaign) slugTaken = true;
    } catch {}

    // Also check slug in local file
    try {
      const raw = await fs.readFile(CAMPAIGNS_FILE, 'utf8');
      const locals = JSON.parse(raw);
      if (locals.find(c => c.slug === slug)) slugTaken = true;
    } catch {}

    if (slugTaken) {
      return res.status(400).json({ error: 'Campaign slug already exists' });
    }

    // Attempt Supabase insert first
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

    if (!error && campaign) {
      return res.status(201).json({ message: 'Campaign created successfully', campaign });
    }

    console.warn('⚠️ Supabase insert failed, falling back to local campaigns.json');
    // Fallback to local JSON
    try {
      let locals = [];
      try {
        const raw = await fs.readFile(CAMPAIGNS_FILE, 'utf8');
        locals = JSON.parse(raw);
      } catch {}

      const newCampaign = {
        id: Date.now(),
        slug,
        title,
        description: description || '',
        type,
        start_at: start_at || null,
        end_at: end_at || null,
        preview_payload: preview_payload || null,
        is_active: false,
        created_at: new Date().toISOString(),
        created_by: req.user?.id || null
      };
      locals.unshift(newCampaign);
      // ensure directory exists
      try { await fs.mkdir(path.dirname(CAMPAIGNS_FILE), { recursive: true }); } catch {}
      await fs.writeFile(CAMPAIGNS_FILE, JSON.stringify(locals, null, 2));
      return res.status(201).json({ message: 'Campaign created (local)', campaign: newCampaign });
    } catch (e) {
      console.error('Campaign creation fallback error:', e);
      return res.status(500).json({ error: 'Failed to create campaign' });
    }
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

    if (!error && campaign) {
      return res.json({ message: 'Campaign activated successfully', campaign });
    }

    // Fallback to local JSON when Supabase fails
    console.warn('⚠️ Supabase activation failed, falling back to local campaigns.json');
    try {
      const raw = await fs.readFile(CAMPAIGNS_FILE, 'utf8');
      const campaigns = JSON.parse(raw);
      const idx = campaigns.findIndex(c => String(c.id) === String(id));
      if (idx === -1) return res.status(404).json({ error: 'Campaign not found' });
      campaigns[idx].is_active = true;
      campaigns[idx].updated_at = new Date().toISOString();
      await fs.writeFile(CAMPAIGNS_FILE, JSON.stringify(campaigns, null, 2));
      return res.json({ message: 'Campaign activated (local)', campaign: campaigns[idx] });
    } catch (e) {
      console.error('Local activation fallback error:', e);
      return res.status(500).json({ error: 'Failed to activate campaign' });
    }
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

    if (!error && campaign) {
      return res.json({ message: 'Campaign deactivated successfully', campaign });
    }

    // Fallback to local JSON when Supabase fails
    console.warn('⚠️ Supabase deactivation failed, falling back to local campaigns.json');
    try {
      const raw = await fs.readFile(CAMPAIGNS_FILE, 'utf8');
      const campaigns = JSON.parse(raw);
      const idx = campaigns.findIndex(c => String(c.id) === String(id));
      if (idx === -1) return res.status(404).json({ error: 'Campaign not found' });
      campaigns[idx].is_active = false;
      campaigns[idx].updated_at = new Date().toISOString();
      await fs.writeFile(CAMPAIGNS_FILE, JSON.stringify(campaigns, null, 2));
      return res.json({ message: 'Campaign deactivated (local)', campaign: campaigns[idx] });
    } catch (e) {
      console.error('Local deactivation fallback error:', e);
      return res.status(500).json({ error: 'Failed to deactivate campaign' });
    }
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

// ===== ADMIN CAMPAIGN MANAGEMENT ENDPOINTS =====

// Admin authentication middleware
const verifyAdmin = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const adminIdHeader = req.headers['x-admin-id'];
    const adminSecretHeader = req.headers['x-admin-secret'];

    // Check for admin bypass (development mode)
    if (ALLOW_ADMIN_BYPASS && adminIdHeader) {
      console.log('🔓 Admin bypass enabled for user:', adminIdHeader);
      req.adminId = adminIdHeader;
      return next();
    }

    // Check for admin secret
    if (ADMIN_SECRET && adminSecretHeader === ADMIN_SECRET) {
      console.log('🔑 Admin secret verified');
      req.adminId = adminIdHeader || 'admin';
      return next();
    }

    // Standard JWT verification
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const { data: { user }, error } = await supabasePublic.auth.getUser(token);
      
      if (error || !user) {
        return res.status(401).json({ error: 'Invalid token' });
      }

      // Check if user is admin (you can implement your own admin check logic)
      req.adminId = user.id;
      return next();
    }

    return res.status(401).json({ error: 'Admin authentication required' });
  } catch (error) {
    console.error('Admin auth error:', error);
    return res.status(500).json({ error: 'Authentication error' });
  }
};

// Get all campaigns
app.get('/admin/campaigns', verifyAdmin, async (req, res) => {
  try {
    // For now, return empty array since we don't have campaigns table yet
    // This will be replaced with actual database queries once tables are created
    res.json({ 
      campaigns: [],
      message: 'Campaign system ready - database tables need to be created'
    });
  } catch (error) {
    console.error('Get campaigns error:', error);
    res.status(500).json({ error: 'Failed to fetch campaigns' });
  }
});

// Get single campaign
app.get('/admin/campaigns/:id', verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    // For now, return a sample campaign structure
    const sampleCampaign = {
      id: parseInt(id),
      slug: 'sample-campaign',
      title: 'Sample Campaign',
      type: 'flash',
      is_active: true,
      start_at: new Date().toISOString(),
      end_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      description: 'This is a sample campaign',
      preview_payload: {
        theme: 'dark',
        colors: {
          primary: '#25d366',
          secondary: '#128c7e',
          background: '#111111',
          text: '#ffffff'
        },
        banner: {
          title: 'Mega Flash Sale!',
          subtitle: 'Up to 50% off gaming gear',
          ctaText: 'Shop Now',
          ctaLink: '/flashsales.html',
          image: 'assets/images/campaigns/banner-default.jpg'
        },
        popup: {
          enabled: true,
          image: 'assets/images/campaigns/popup-default.jpg',
          headline: 'Limited Time Offer',
          body: 'Grab your favorites before they\'re gone!',
          ctaText: 'Browse Deals',
          ctaLink: '/flashsales.html'
        }
      },
      campaign_products: [],
      campaign_assets: [],
      popup_rules: []
    };

    res.json({ campaign: sampleCampaign });
  } catch (error) {
    console.error('Get campaign error:', error);
    res.status(500).json({ error: 'Failed to fetch campaign' });
  }
});

// Create new campaign
app.post('/admin/campaigns', verifyAdmin, async (req, res) => {
  try {
    const campaignData = req.body;
    
    // For now, return a mock created campaign
    const newCampaign = {
      id: Date.now(), // Mock ID
      ...campaignData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    console.log('📝 Campaign created (mock):', newCampaign.title);
    res.json({ 
      campaign: newCampaign,
      message: 'Campaign created successfully (mock - database integration needed)'
    });
  } catch (error) {
    console.error('Create campaign error:', error);
    res.status(500).json({ error: 'Failed to create campaign' });
  }
});

// Update campaign
app.put('/admin/campaigns/:id', verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const campaignData = req.body;
    
    console.log('📝 Campaign updated (mock):', id, campaignData.title);
    res.json({ 
      campaign: { id: parseInt(id), ...campaignData },
      message: 'Campaign updated successfully (mock - database integration needed)'
    });
  } catch (error) {
    console.error('Update campaign error:', error);
    res.status(500).json({ error: 'Failed to update campaign' });
  }
});

// Delete campaign
app.delete('/admin/campaigns/:id', verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('🗑️ Campaign deleted (mock):', id);
    res.json({ 
      message: 'Campaign deleted successfully (mock - database integration needed)'
    });
  } catch (error) {
    console.error('Delete campaign error:', error);
    res.status(500).json({ error: 'Failed to delete campaign' });
  }
});

// Activate campaign
app.post('/admin/campaigns/:id/activate', verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('▶️ Campaign activated (mock):', id);
    res.json({ 
      message: 'Campaign activated successfully (mock - database integration needed)'
    });
  } catch (error) {
    console.error('Activate campaign error:', error);
    res.status(500).json({ error: 'Failed to activate campaign' });
  }
});

// Deactivate campaign
app.post('/admin/campaigns/:id/deactivate', verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('⏸️ Campaign deactivated (mock):', id);
    res.json({ 
      message: 'Campaign deactivated successfully (mock - database integration needed)'
    });
  } catch (error) {
    console.error('Deactivate campaign error:', error);
    res.status(500).json({ error: 'Failed to deactivate campaign' });
  }
});

// Campaign products management
app.post('/admin/campaigns/:id/products', verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { products } = req.body;
    
    console.log('📦 Campaign products added (mock):', id, products.length, 'products');
    res.json({ 
      message: 'Products added to campaign successfully (mock - database integration needed)'
    });
  } catch (error) {
    console.error('Add campaign products error:', error);
    res.status(500).json({ error: 'Failed to add products to campaign' });
  }
});

// Campaign assets management
app.post('/admin/campaigns/:id/assets', verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const assetData = req.body;
    
    console.log('🖼️ Campaign asset added (mock):', id, assetData.url);
    res.json({ 
      message: 'Asset added to campaign successfully (mock - database integration needed)'
    });
  } catch (error) {
    console.error('Add campaign asset error:', error);
    res.status(500).json({ error: 'Failed to add asset to campaign' });
  }
});

// Campaign popup rules management
app.post('/admin/campaigns/:id/popup_rules', verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const ruleData = req.body;
    
    console.log('🎯 Campaign popup rule added (mock):', id, ruleData.trigger_type);
    res.json({ 
      message: 'Popup rule added to campaign successfully (mock - database integration needed)'
    });
  } catch (error) {
    console.error('Add campaign popup rule error:', error);
    res.status(500).json({ error: 'Failed to add popup rule to campaign' });
  }
});

// Get campaign preview
app.get('/admin/campaigns/:id/preview', verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    const previewData = {
      id: parseInt(id),
      slug: 'sample-campaign',
      title: 'Sample Campaign Preview',
      type: 'flash',
      is_active: true,
      preview_payload: {
        theme: 'dark',
        colors: {
          primary: '#25d366',
          secondary: '#128c7e',
          background: '#111111',
          text: '#ffffff'
        },
        banner: {
          title: 'Mega Flash Sale!',
          subtitle: 'Up to 50% off gaming gear',
          ctaText: 'Shop Now',
          ctaLink: '/flashsales.html',
          image: 'assets/images/campaigns/banner-default.jpg'
        },
        popup: {
          enabled: true,
          image: 'assets/images/campaigns/popup-default.jpg',
          headline: 'Limited Time Offer',
          body: 'Grab your favorites before they\'re gone!',
          ctaText: 'Browse Deals',
          ctaLink: '/flashsales.html'
        }
      }
    };

    res.json({ campaign: previewData });
  } catch (error) {
    console.error('Get campaign preview error:', error);
    res.status(500).json({ error: 'Failed to get campaign preview' });
  }
});


// Get single site banner
app.get('/admin/site-banners/:id', verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const banner = siteBanners.find(b => b.id === parseInt(id));
    
    if (!banner) {
      return res.status(404).json({ error: 'Banner not found' });
    }
    
    res.json({ banner });
  } catch (error) {
    console.error('Get site banner error:', error);
    res.status(500).json({ error: 'Failed to fetch site banner' });
  }
});

// Create new site banner
app.post('/admin/site-banners', verifyAdmin, async (req, res) => {
  try {
    const bannerData = req.body;
    
    const newBanner = {
      id: Date.now(), // Simple ID generation
      title: bannerData.title || 'New Banner',
      message: bannerData.message || '',
      type: bannerData.type || 'info',
      is_active: bannerData.is_active !== false,
      position: bannerData.position || 'top',
      show_on_pages: bannerData.show_on_pages || ['all'],
      banner_image: bannerData.banner_image || availableBannerAssets[0].path,
      start_date: bannerData.start_date || new Date().toISOString(),
      end_date: bannerData.end_date || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    siteBanners.push(newBanner);
    
    console.log('📢 Site banner created:', newBanner.title);
    res.json({ 
      banner: newBanner,
      message: 'Site banner created successfully'
    });
  } catch (error) {
    console.error('Create site banner error:', error);
    res.status(500).json({ error: 'Failed to create site banner' });
  }
});

// Update site banner
app.put('/admin/site-banners/:id', verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const bannerData = req.body;
    
    const bannerIndex = siteBanners.findIndex(b => b.id === parseInt(id));
    
    if (bannerIndex === -1) {
      return res.status(404).json({ error: 'Banner not found' });
    }
    
    siteBanners[bannerIndex] = {
      ...siteBanners[bannerIndex],
      ...bannerData,
      updated_at: new Date().toISOString()
    };
    
    console.log('📢 Site banner updated:', siteBanners[bannerIndex].title);
    res.json({ 
      banner: siteBanners[bannerIndex],
      message: 'Site banner updated successfully'
    });
  } catch (error) {
    console.error('Update site banner error:', error);
    res.status(500).json({ error: 'Failed to update site banner' });
  }
});

// Delete site banner
app.delete('/admin/site-banners/:id', verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    const bannerIndex = siteBanners.findIndex(b => b.id === parseInt(id));
    
    if (bannerIndex === -1) {
      return res.status(404).json({ error: 'Banner not found' });
    }
    
    const deletedBanner = siteBanners.splice(bannerIndex, 1)[0];
    
    console.log('🗑️ Site banner deleted:', deletedBanner.title);
    res.json({ 
      message: 'Site banner deleted successfully'
    });
  } catch (error) {
    console.error('Delete site banner error:', error);
    res.status(500).json({ error: 'Failed to delete site banner' });
  }
});

// Toggle site banner status
app.post('/admin/site-banners/:id/toggle', verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    const bannerIndex = siteBanners.findIndex(b => b.id === parseInt(id));
    
    if (bannerIndex === -1) {
      return res.status(404).json({ error: 'Banner not found' });
    }
    
    siteBanners[bannerIndex].is_active = !siteBanners[bannerIndex].is_active;
    siteBanners[bannerIndex].updated_at = new Date().toISOString();
    
    const status = siteBanners[bannerIndex].is_active ? 'activated' : 'deactivated';
    console.log('🔄 Site banner', status + ':', siteBanners[bannerIndex].title);
    
    res.json({ 
      banner: siteBanners[bannerIndex],
      message: `Site banner ${status} successfully`
    });
  } catch (error) {
    console.error('Toggle site banner error:', error);
    res.status(500).json({ error: 'Failed to toggle site banner' });
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

// ============================================================================
// AFFILIATE PROGRAM ENDPOINTS
// ============================================================================

// Public: submit affiliate application
app.post('/affiliates/apply', async (req, res) => {
  try {
    const { full_name, email, social_handle, audience_size, website, promo_plan, preferred_code } = req.body || {};
    if(!full_name || !email || !social_handle || !promo_plan){
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Try Supabase first
    let inserted = null;
    try {
      const { data, error } = await supabase
        .from('affiliates_applications')
        .insert({
          full_name,
          email,
          social_handle,
          audience_size,
          website,
          promo_plan,
          preferred_code,
          status: 'pending',
          created_at: new Date().toISOString()
        })
        .select()
        .single();
      if (error) throw error;
      inserted = data;
    } catch (e) {
      // Local fallback
      const file = path.join(__dirname, 'data', 'affiliates_applications.json');
      let arr = [];
      try { const raw = await fs.readFile(file, 'utf8'); arr = JSON.parse(raw); } catch {}
      const appRec = {
        id: Date.now(), full_name, email, social_handle, audience_size, website, promo_plan, preferred_code,
        status: 'pending', created_at: new Date().toISOString()
      };
      arr.unshift(appRec);
      try { await fs.mkdir(path.dirname(file), { recursive: true }); } catch {}
      await fs.writeFile(file, JSON.stringify(arr, null, 2));
      inserted = appRec;
    }

    return res.status(201).json({ message: 'Application received', application: inserted });
  } catch (error) {
    console.error('Affiliate apply error:', error);
    res.status(500).json({ error: 'Failed to submit application' });
  }
});

// Admin: list applications
app.get('/admin/affiliates/applications', verifyAdminToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('affiliates_applications')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && data) return res.json({ applications: data });

    // Fallback
    try {
      const file = path.join(__dirname, 'data', 'affiliates_applications.json');
      const raw = await fs.readFile(file, 'utf8');
      const arr = JSON.parse(raw);
      return res.json({ applications: arr });
    } catch {
      return res.json({ applications: [] });
    }
  } catch (error) {
    console.error('List affiliate applications error:', error);
    res.status(500).json({ error: 'Failed to fetch applications' });
  }
});

// Admin: approve application -> create affiliate profile with code
app.post('/admin/affiliates/applications/:id/approve', verifyAdminToken, async (req, res) => {
  try {
    const { id } = req.params;
    // Mark application approved
    try {
      await supabase
        .from('affiliates_applications')
        .update({ status: 'approved', reviewed_at: new Date().toISOString() })
        .eq('id', id);
    } catch {}

    // Create affiliate record
    const { preferred_code } = req.body || {};
    const { data: app } = await supabase
      .from('affiliates_applications')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    const code = (preferred_code || app?.preferred_code || (app?.full_name||'AFF').replace(/[^A-Za-z0-9]/g,'').slice(0,8) || 'AFF')
      .toUpperCase();

    let affiliateRow = null;
    try {
      const { data, error } = await supabase
        .from('affiliates')
        .insert({
          code,
          full_name: app?.full_name || null,
          email: app?.email || null,
          status: 'active',
          default_rate: 0.1,
          created_at: new Date().toISOString()
        })
        .select()
        .single();
      if (error) throw error;
      affiliateRow = data;
    } catch (e) {
      // best-effort only
    }

    return res.json({ message: 'Approved', code: code, affiliate: affiliateRow });
  } catch (error) {
    console.error('Approve affiliate error:', error);
    res.status(500).json({ error: 'Failed to approve application' });
  }
});

// Admin: reject application
app.post('/admin/affiliates/applications/:id/reject', verifyAdminToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body || {};
    try {
      await supabase
        .from('affiliates_applications')
        .update({ status: 'rejected', reviewed_at: new Date().toISOString(), reject_reason: reason || null })
        .eq('id', id);
    } catch {}
    return res.json({ message: 'Rejected' });
  } catch (error) {
    console.error('Reject affiliate error:', error);
    res.status(500).json({ error: 'Failed to reject application' });
  }
});

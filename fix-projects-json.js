const fs = require("fs");
const path = require("path");

const jsonPath = path.join(__dirname, "data", "products.json");
const products = JSON.parse(fs.readFileSync(jsonPath, "utf8"));

const fixed = products.map((p, i) => {
  // Ensure required fields
  const price = Number(p.price) || 0;
  let originalPrice = Number(p.originalPrice);
  if (!originalPrice || originalPrice < price) originalPrice = price;
  let discount = Number(p.discount);
  if (!discount && originalPrice > price) {
    discount = Math.round((100 * (originalPrice - price)) / originalPrice);
  }
  if (!discount || originalPrice === price) discount = 0;

  return {
    id: p.id || i + 1,
    name: p.name || `Product ${i + 1}`,
    price,
    originalPrice,
    discount,
    image: p.image || "",
    link: p.link || "",
    category: p.category || "Other",
    description: p.description || "",
    stock: typeof p.stock === "number" ? p.stock : 10,
    rating: typeof p.rating === "number" ? p.rating : 4.5,
    reviews: typeof p.reviews === "number" ? p.reviews : 0,
    features: Array.isArray(p.features) ? p.features : [],
  };
});

fs.writeFileSync(jsonPath, JSON.stringify(fixed, null, 2));
console.log(`✅ Fixed ${fixed.length} products in ${jsonPath}`);

const fs = require("fs");
const path = require("path");
const cheerio = require("cheerio");

const productsDir = path.join(__dirname, "mobile-gaming-store", "products");
const imagesBase = "assets/images/products/";
const outputJson = path.join(__dirname, "data", "products.json");

function getMainImage($) {
  // Try to find the main image in the product page
  let img = $(".main-image").attr("src");
  if (!img) {
    img = $("img").first().attr("src");
  }
  // Remove leading ../ or ./ if present
  return img ? img.replace(/^(\.\.\/)+assets\/images\/products\//, "") : "";
}

function getText($, selector) {
  return $(selector).first().text().trim();
}

function getMeta($, name) {
  return $(`meta[name="${name}"]`).attr("content") || "";
}

function getPrice($) {
  // Try to find price in .current-price or similar
  let price = $(".current-price")
    .first()
    .text()
    .replace(/[^0-9.]/g, "");
  return price ? parseFloat(price) : null;
}

function getCategory($) {
  return $(".product-category").first().text().trim() || "";
}

function getStock($) {
  // Try to find stock info in details
  let stockText = $('.detail-item:contains("Stock") .detail-value').text();
  let match = stockText.match(/([0-9]+)/);
  return match ? parseInt(match[1], 10) : 10;
}

function getRating($) {
  // Try to find rating in details or stars
  let ratingText = $('.detail-item:contains("Rating") .detail-value').text();
  let match = ratingText.match(/([0-9.]+)/);
  return match ? parseFloat(match[1]) : 4.5;
}

function getDescription($) {
  // Try to get product description
  let desc = $(".product-description").first().text().trim();
  if (!desc) desc = getMeta($, "description");
  return desc;
}

function getName($) {
  let name = $(".product-title").first().text().trim();
  if (!name) name = $("title").text().split("-")[0].trim();
  return name;
}

function getIdFromFilename(filename) {
  let match = filename.match(/product(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}

const products = [];

fs.readdirSync(productsDir).forEach((file) => {
  if (file.startsWith("product") && file.endsWith(".html")) {
    const filePath = path.join(productsDir, file);
    const html = fs.readFileSync(filePath, "utf8");
    const $ = cheerio.load(html);

    const id = getIdFromFilename(file);
    const name = getName($);
    const price = getPrice($);
    const description = getDescription($);
    const image = getMainImage($);
    const category = getCategory($);
    const rating = getRating($);
    const stock = getStock($);
    const link = "products/" + file;

    products.push({
      id,
      name,
      price,
      description,
      image,
      category,
      rating,
      stock,
      link,
    });
  }
});

if (!fs.existsSync(path.dirname(outputJson))) {
  fs.mkdirSync(path.dirname(outputJson), { recursive: true });
}
fs.writeFileSync(outputJson, JSON.stringify(products, null, 2));
console.log(`✅ Generated ${products.length} products in ${outputJson}`);

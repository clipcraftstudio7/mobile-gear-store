const fs = require("fs");
const path = require("path");

// Social media URLs from README.md
const socialLinks = {
  facebook: "https://www.facebook.com/share/1EtKUXckLm/",
  tiktok: "https://www.tiktok.com/@mobilegear.hub?_t=ZM-8yVp0OzGZqH&_r=1",
  instagram:
    "https://www.instagram.com/mobile.gearhub?igsh=MXFyMWI1enlwMzBydQ==",
  youtube: "https://youtube.com/@mobilegearhub?si=fWzMZvcXYKcIGo0q",
};

// Function to update social links in a file
function updateSocialLinks(filePath) {
  try {
    let content = fs.readFileSync(filePath, "utf8");

    // Replace placeholder social links with real URLs
    content = content.replace(
      /<a href="#"><i class="fab fa-facebook"><\/i><\/a>/g,
      `<a href="${socialLinks.facebook}" target="_blank"><i class="fab fa-facebook"></i></a>`
    );

    content = content.replace(
      /<a href="#"><i class="fab fa-twitter"><\/i><\/a>/g,
      `<a href="${socialLinks.tiktok}" target="_blank"><i class="fab fa-tiktok"></i></a>`
    );

    content = content.replace(
      /<a href="#"><i class="fab fa-instagram"><\/i><\/a>/g,
      `<a href="${socialLinks.instagram}" target="_blank"><i class="fab fa-instagram"></i></a>`
    );

    content = content.replace(
      /<a href="#"><i class="fab fa-youtube"><\/i><\/a>/g,
      `<a href="${socialLinks.youtube}" target="_blank"><i class="fab fa-youtube"></i></a>`
    );

    fs.writeFileSync(filePath, content, "utf8");
    console.log(`Updated: ${filePath}`);
  } catch (error) {
    console.error(`Error updating ${filePath}:`, error.message);
  }
}

// Get all product HTML files
const productsDir = path.join(__dirname, "products");
const files = fs
  .readdirSync(productsDir)
  .filter((file) => file.endsWith(".html"));

console.log(`Found ${files.length} product files to update...`);

// Update each file
files.forEach((file) => {
  const filePath = path.join(productsDir, file);
  updateSocialLinks(filePath);
});

console.log("Social links update completed!");

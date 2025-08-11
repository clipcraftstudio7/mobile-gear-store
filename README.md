# Mobile Gaming Store

A full-stack e-commerce platform for mobile gaming accessories and gear.

## Features

- Product catalog with images
- Shopping cart functionality
- Admin dashboard for product management
- Responsive design
- Image upload and management

## Tech Stack

- **Backend**: Node.js, Express.js
- **Frontend**: HTML, CSS, JavaScript
- **File Upload**: Multer
- **Static File Serving**: Express static middleware

## Local Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the server:
   ```bash
   npm start
   ```

3. Open http://localhost:3000 in your browser

## Deployment

This project is configured for deployment on Railway.

## API Endpoints

- `GET /products` - Get all products
- `POST /add-product` - Add a new product
- `POST /add-product-organized` - Add product with organized images
- `POST /edit-product` - Edit existing product
- `POST /delete-product` - Delete product

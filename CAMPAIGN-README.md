# Flash Sales, Banners & Popups System

Complete promotional system for Mobile Gaming Store with flash sales, banner management, and popup campaigns.

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Database Setup
Run migrations in order:
```bash
# Run these in your Supabase SQL editor:
# 001_create_campaign_tables.sql
# 002_sample_campaign_data.sql  
# 003_create_consume_reservations_function.sql
```

### 3. Environment Variables
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key
```

### 4. Start Services
```bash
# Main server
npm start

# Background worker (separate terminal)
node workers/campaign-worker.js
```

## 📊 Database Tables

- `campaigns` - Campaign metadata and scheduling
- `campaign_products` - Product links with pricing/stock
- `campaign_assets` - Images, videos, HTML assets
- `popup_rules` - Targeting and trigger rules
- `stock_reservations` - TTL-based cart reservations
- `campaign_metrics` - Performance tracking

## 🔌 API Endpoints

### Admin (Protected)
- `POST /admin/campaigns` - Create campaign
- `PUT /admin/campaigns/:id` - Update campaign
- `POST /admin/campaigns/:id/products` - Add products
- `POST /admin/campaigns/:id/activate` - Activate
- `GET /admin/campaigns/:id/preview` - Preview

### Public (Rate Limited)
- `GET /flashsales` - List active campaigns
- `GET /flashsales/:slug` - Campaign details
- `POST /cart/reserve` - Reserve product
- `POST /cart/checkout` - Checkout

## 🧪 Testing

Import Postman collection: `postman/Campaign-API.postman_collection.json`

Sample data included for testing:
- Black Friday Flash Sale
- Weekend Gaming Sale
- Mobile Gaming Hero Banner
- Exit Intent Popup

## 🔧 Features

- **Flash Sales**: Time-limited with reserved stock
- **Banner Management**: Hero banners and promotional displays
- **Popup Campaigns**: Exit-intent, time-based, scroll-triggered
- **Stock Reservation**: TTL-based cart reservations
- **Analytics**: Comprehensive metrics tracking
- **Background Workers**: Automated activation/deactivation
- **Rate Limiting**: Protection against abuse
- **Atomic Transactions**: Database-level concurrency control

## 📈 Usage Example

```javascript
// Create flash sale
const campaign = await fetch('/admin/campaigns', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer ' + adminToken },
  body: JSON.stringify({
    slug: 'black-friday-2025',
    title: 'Black Friday Flash Sale',
    type: 'flash',
    start_at: '2025-11-28T10:00:00+03:00',
    end_at: '2025-11-28T13:00:00+03:00'
  })
});

// Reserve product
const reservation = await fetch('/cart/reserve', {
  method: 'POST',
  body: JSON.stringify({
    campaign_product_id: 1,
    quantity: 1,
    session_id: 'guest-123'
  })
});
```

## 🚨 Monitoring

- Health checks for database connectivity
- Worker process status monitoring
- Error rate tracking
- Campaign activation alerts

## 🔒 Security

- JWT-based admin authentication
- Rate limiting on public endpoints
- Input validation and sanitization
- CORS configuration

## 📝 Assumptions

- User roles in `profiles` table with `role` column
- Separate product stock management
- Guest sessions via session_id
- UTC+3 timezone (Kenya)
- CDN-based asset hosting

## 🐛 Troubleshooting

**Campaign not activating?**
- Check worker process status
- Verify database functions
- Check timezone settings

**Stock reservation failures?**
- Verify campaign is active
- Check available stock
- Validate session_id

**API rate limiting?**
- Check request frequency
- Review rate limit settings

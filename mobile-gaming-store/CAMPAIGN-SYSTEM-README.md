# Flash Sales, Banners, and Popups System

A comprehensive advertising and promotional system for the Mobile Gaming Store, featuring flash sales, banner management, and popup campaigns with advanced targeting and analytics.

## 🚀 Features

### Core Functionality
- **Flash Sales**: Time-limited sales with reserved stock and per-customer limits
- **Banner Management**: Hero banners, promotional banners with scheduling
- **Popup Campaigns**: Exit-intent, time-based, and scroll-triggered popups
- **Stock Reservation**: TTL-based cart reservations to prevent overselling
- **Analytics**: Comprehensive metrics tracking and reporting
- **Admin Panel**: 3-step wizard for campaign creation and management

### Advanced Features
- **Atomic Transactions**: Database-level concurrency control
- **Rate Limiting**: Protection against abuse and scraping
- **Background Workers**: Automated campaign activation/deactivation
- **A/B Testing**: Support for campaign variants
- **Responsive Design**: Mobile-optimized components
- **Real-time Countdown**: Server-side time calculation with client polling

## 📋 Prerequisites

- Node.js 16+ 
- PostgreSQL (Supabase)
- Supabase account with service key
- Environment variables configured

## 🛠️ Installation

### 1. Install Dependencies

```bash
npm install
```

### 2. Database Setup

Run the migration files in order:

```bash
# Connect to your Supabase database and run:
psql -h your-supabase-host -U postgres -d postgres -f migrations/001_create_campaign_tables.sql
psql -h your-supabase-host -U postgres -d postgres -f migrations/002_sample_campaign_data.sql
psql -h your-supabase-host -U postgres -d postgres -f migrations/003_create_consume_reservations_function.sql
```

### 3. Environment Variables

Create a `.env` file in the root directory:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key
PORT=3000
NODE_ENV=production
```

### 4. Start Services

```bash
# Start the main server
npm start

# Start the background worker (in a separate terminal)
node workers/campaign-worker.js
```

## 📊 Database Schema

### Core Tables

#### `campaigns`
- Campaign metadata and scheduling
- Types: flash, banner, popup, hero
- Preview payload for custom layouts

#### `campaign_products`
- Links products to campaigns
- Campaign-specific pricing and stock allocation
- Per-customer limits

#### `campaign_assets`
- Images, videos, and HTML assets
- Multiple variants for A/B testing

#### `popup_rules`
- Targeting rules (device, geo, frequency)
- Trigger conditions (time, scroll, exit-intent)

#### `stock_reservations`
- TTL-based cart reservations
- Atomic stock management

#### `campaign_metrics`
- Daily performance tracking
- Impressions, clicks, conversions, revenue

## 🔌 API Endpoints

### Admin Endpoints (Protected)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/admin/campaigns` | Create campaign |
| PUT | `/admin/campaigns/:id` | Update campaign |
| POST | `/admin/campaigns/:id/products` | Add products to campaign |
| POST | `/admin/campaigns/:id/activate` | Activate campaign |
| POST | `/admin/campaigns/:id/deactivate` | Deactivate campaign |
| GET | `/admin/campaigns/:id/preview` | Get campaign preview |

### Public Endpoints (Rate Limited)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/flashsales` | List active/upcoming flash sales |
| GET | `/flashsales/:slug` | Get campaign details |
| POST | `/cart/reserve` | Reserve product for cart |
| POST | `/cart/checkout` | Checkout (consumes reservations) |
| GET | `/campaigns/:id/metrics` | Get campaign metrics |

## 🎯 Usage Examples

### Creating a Flash Sale

```javascript
// Create campaign
const campaign = await fetch('/admin/campaigns', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + adminToken,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    slug: 'black-friday-2025',
    title: 'Black Friday Flash Sale',
    type: 'flash',
    start_at: '2025-11-28T10:00:00+03:00',
    end_at: '2025-11-28T13:00:00+03:00',
    preview_payload: {
      hero_image: 'https://cdn.example.com/hero.jpg',
      theme: 'dark'
    }
  })
});

// Add products
await fetch('/admin/campaigns/1/products', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + adminToken,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    products: [
      {
        product_id: 1,
        original_price: 2999.00,
        sale_price: 899.00,
        reserved_stock: 50,
        max_per_customer: 2
      }
    ]
  })
});
```

### Frontend Integration

```javascript
// Get active flash sales
const response = await fetch('/flashsales');
const { campaigns } = await response.json();

// Reserve product
const reservation = await fetch('/cart/reserve', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    campaign_product_id: 1,
    quantity: 1,
    session_id: 'guest-123'
  })
});
```

## 🧪 Testing

### Postman Collection

Import the provided Postman collection:
```
postman/Campaign-API.postman_collection.json
```

### Sample Data

The system includes sample campaigns and products for testing:
- Black Friday Flash Sale
- Weekend Gaming Sale
- Mobile Gaming Hero Banner
- Exit Intent Popup
- Fan Festival Flash

### Test Scenarios

1. **Scheduled Flash Sale**: Create campaign for future start, verify activation
2. **Stock Reservation**: Add to cart, verify TTL and stock deduction
3. **Concurrent Checkout**: Test race conditions and atomicity
4. **Popup Targeting**: Verify device and frequency rules
5. **Admin Preview**: Test desktop/mobile preview modes

## 🔧 Configuration

### Rate Limiting

```javascript
// Default: 100 requests per 15 minutes
const campaignLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
```

### Reservation TTL

```javascript
// Guest users: 10 minutes
// Logged-in users: 20 minutes
const reservationTTL = 10 * 60 * 1000;
```

### Worker Schedule

```javascript
// Clean expired reservations: Every 5 minutes
// Update campaign status: Every minute
// Update metrics: Every hour
```

## 📈 Analytics

### Metrics Tracked

- **Impressions**: Campaign views
- **Clicks**: User interactions
- **Add to Cart**: Product reservations
- **Purchases**: Completed checkouts
- **Revenue**: Total sales value

### Dashboard Integration

```javascript
// Get campaign metrics
const metrics = await fetch('/campaigns/1/metrics?start_date=2025-01-01&end_date=2025-01-31', {
  headers: { 'Authorization': 'Bearer ' + adminToken }
});
```

## 🚨 Monitoring

### Health Checks

- Database connectivity
- Worker process status
- API response times
- Error rates

### Alerts

- Campaign activation failures
- Stock reservation errors
- Worker process crashes
- High error rates

## 🔒 Security

### Authentication

- JWT-based admin authentication
- Supabase Auth integration
- Role-based access control

### Rate Limiting

- Public endpoint protection
- Admin endpoint throttling
- IP-based limits

### Data Protection

- Input validation
- SQL injection prevention
- XSS protection
- CORS configuration

## 🚀 Deployment

### Render Deployment

1. Connect your GitHub repository
2. Set environment variables
3. Deploy main application
4. Deploy worker as separate service

### Environment Variables

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key
NODE_ENV=production
PORT=3000
```

### Worker Deployment

```bash
# Start worker process
node workers/campaign-worker.js

# Or use PM2
pm2 start workers/campaign-worker.js --name campaign-worker
```

## 📝 Assumptions

1. **User Roles**: Assumes `profiles` table with `role` column
2. **Product Stock**: Main product stock management separate from campaign stock
3. **Session Management**: Guest sessions handled via session_id
4. **Timezone**: Default to UTC+3 (Kenya)
5. **Image Storage**: CDN-based asset hosting

## 🐛 Troubleshooting

### Common Issues

1. **Campaign Not Activating**
   - Check worker process status
   - Verify database functions
   - Check timezone settings

2. **Stock Reservation Failures**
   - Verify campaign is active
   - Check available stock
   - Validate session_id

3. **API Rate Limiting**
   - Check request frequency
   - Verify IP whitelisting
   - Review rate limit settings

### Debug Mode

```javascript
// Enable debug logging
process.env.DEBUG = 'campaign:*';
```

## 📞 Support

For issues and questions:
- Check the troubleshooting section
- Review API documentation
- Test with Postman collection
- Verify database migrations

## 🔄 Updates

### Version History

- **v1.0.0**: Initial release with core functionality
- Flash sales, banners, popups
- Stock reservation system
- Admin panel integration
- Background worker processes

### Future Enhancements

- Advanced A/B testing
- Machine learning recommendations
- Social media integration
- Email campaign automation
- Advanced analytics dashboard

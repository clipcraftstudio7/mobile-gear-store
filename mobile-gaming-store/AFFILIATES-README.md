# Affiliate Tracking (Lightweight)

This project now captures affiliate/referral parameters from the URL on every page and attaches attribution to orders placed at checkout.

## How it works
- Global capture in `assets/js/main.js` stores these params for 30 days (cookie + localStorage):
  - `ref` (preferred), `affiliate`, or `utm_affiliate`
  - `utm_source`, `utm_campaign`, `utm_medium`
- On PayPal success, `assets/js/checkout.js` reads the stored values and includes them on the order under `order.attribution`.

Example order shape (simplified):
```
{
  user_id: "...",
  total: 123.45,
  items: [...],
  payment: {...},
  attribution: {
    affiliate_id: "AFF123",
    utm_source: "tiktok",
    utm_campaign: "summer-sale",
    utm_medium: "influencer"
  }
}
```

## Test it
1. Open your site with an affiliate code in the URL:
   - `index.html?ref=AFF123`
   - or `?utm_source=tiktok&utm_campaign=summer-sale&utm_affiliate=AFF123`
2. Browse and checkout normally with PayPal Sandbox.
3. In Supabase, open the `orders` table and verify the `attribution` field is present on the inserted row.

## Notes / Requirements
- Ensure your `orders` table exists and can store the `attribution` object. Recommended column: `attribution JSONB`.
- This is first-touch attribution with a 30-day cookie window.
- No commission calculation is performed yet—this only records attribution data on orders.

## Next steps (optional, custom program)
- Create `affiliates` table (id, code, name, status, default_rate, created_at, ...).
- Create `affiliate_commissions` table (order_id, affiliate_id/code, amount, status, payout_ref, ...).
- On order creation, compute commission and insert a row in `affiliate_commissions`.
- Add a simple admin page to list attributed orders and commissions, approve/mark paid.
- Add fraud checks (self-purchase, coupon abuse) and cap commissionable categories if needed.

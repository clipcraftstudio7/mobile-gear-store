-- Sample Campaign Data
-- Description: Inserts sample campaigns for testing the flash sales system
-- Date: 2025-01-27

-- Sample Campaign 1: Black Friday Flash Sale
INSERT INTO campaigns (slug, title, description, type, start_at, end_at, is_active, preview_payload, created_by) VALUES (
    'black-friday-2025',
    'Black Friday Gaming Gear Flash Sale',
    'Get up to 70% off on premium mobile gaming accessories. Limited time only!',
    'flash',
    '2025-11-28 10:00:00+03:00',
    '2025-11-28 13:00:00+03:00',
    false,
    '{"hero_image": "https://cdn.example.com/black-friday-hero.jpg", "theme": "dark", "cta_text": "Shop Now - 70% Off", "background_color": "#1a1a1a"}',
    1
);

-- Sample Campaign 2: Weekend Gaming Sale
INSERT INTO campaigns (slug, title, description, type, start_at, end_at, is_active, preview_payload, created_by) VALUES (
    'weekend-gaming-sale',
    'Weekend Gaming Gear Bonanza',
    'Weekend warriors unite! Special discounts on controllers, triggers, and accessories.',
    'flash',
    '2025-01-25 14:00:00+03:00',
    '2025-01-26 23:59:59+03:00',
    false,
    '{"hero_image": "https://cdn.example.com/weekend-sale-hero.jpg", "theme": "blue", "cta_text": "Weekend Special", "background_color": "#1e3a8a"}',
    1
);

-- Sample Campaign 3: Mobile Gaming Hero Banner
INSERT INTO campaigns (slug, title, description, type, start_at, end_at, is_active, preview_payload, created_by) VALUES (
    'mobile-gaming-hero',
    'Level Up Your Mobile Gaming',
    'Discover the latest mobile gaming accessories that will take your gameplay to the next level.',
    'hero',
    '2025-01-20 00:00:00+03:00',
    '2025-02-20 23:59:59+03:00',
    true,
    '{"hero_image": "https://cdn.example.com/mobile-gaming-hero.jpg", "theme": "green", "cta_text": "Explore Now", "background_color": "#059669"}',
    1
);

-- Sample Campaign 4: Exit Intent Popup
INSERT INTO campaigns (slug, title, description, type, start_at, end_at, is_active, preview_payload, created_by) VALUES (
    'exit-intent-special',
    'Wait! Don\'t Miss This Special Offer',
    'Get 15% off your first order when you sign up for our newsletter.',
    'popup',
    '2025-01-15 00:00:00+03:00',
    '2025-03-15 23:59:59+03:00',
    true,
    '{"popup_image": "https://cdn.example.com/newsletter-popup.jpg", "theme": "light", "cta_text": "Get 15% Off", "background_color": "#ffffff"}',
    1
);

-- Sample Campaign 5: Fan Festival Flash
INSERT INTO campaigns (slug, title, description, type, start_at, end_at, is_active, preview_payload, created_by) VALUES (
    'fan-festival-2025',
    'Fan Festival Flash — 3 hours',
    'Join the gaming community celebration with exclusive deals on premium gear.',
    'flash',
    '2025-08-30 14:00:00+03:00',
    '2025-08-30 17:00:00+03:00',
    false,
    '{"hero_image": "https://cdn.example.com/fan-festival-hero.jpg", "theme": "purple", "cta_text": "Join Festival", "background_color": "#7c3aed"}',
    1
);

-- Sample Campaign Products (linking to existing products)
-- Campaign 1 Products
INSERT INTO campaign_products (campaign_id, product_id, original_price, sale_price, reserved_stock, max_per_customer, display_order) VALUES
(1, 1, 2999.00, 899.00, 50, 2, 1),
(1, 2, 1999.00, 599.00, 75, 3, 2),
(1, 3, 3999.00, 1199.00, 25, 1, 3),
(1, 4, 1499.00, 449.00, 100, 5, 4);

-- Campaign 2 Products
INSERT INTO campaign_products (campaign_id, product_id, original_price, sale_price, reserved_stock, max_per_customer, display_order) VALUES
(2, 5, 2499.00, 1749.00, 40, 2, 1),
(2, 6, 1799.00, 1259.00, 60, 3, 2),
(2, 7, 3299.00, 2309.00, 30, 1, 3);

-- Campaign 3 Products (Hero Banner - no specific products, just showcase)
INSERT INTO campaign_products (campaign_id, product_id, original_price, sale_price, reserved_stock, max_per_customer, display_order) VALUES
(3, 8, 1999.00, 1999.00, 0, 0, 1),
(3, 9, 2999.00, 2999.00, 0, 0, 2);

-- Campaign 4 Products (Popup - newsletter signup, no products)
-- No products for popup campaign

-- Campaign 5 Products
INSERT INTO campaign_products (campaign_id, product_id, original_price, sale_price, reserved_stock, max_per_customer, display_order) VALUES
(5, 10, 3999.00, 2399.00, 35, 2, 1),
(5, 11, 2799.00, 1679.00, 50, 3, 2),
(5, 12, 1899.00, 1139.00, 80, 4, 3);

-- Sample Campaign Assets
INSERT INTO campaign_assets (campaign_id, asset_type, url, alt, width, height, metadata) VALUES
(1, 'image', 'https://cdn.example.com/black-friday-hero.jpg', 'Black Friday Gaming Sale', 1920, 600, '{"position": "hero", "variant": "A"}'),
(2, 'image', 'https://cdn.example.com/weekend-sale-hero.jpg', 'Weekend Gaming Sale', 1920, 600, '{"position": "hero", "variant": "A"}'),
(3, 'image', 'https://cdn.example.com/mobile-gaming-hero.jpg', 'Mobile Gaming Hero', 1920, 600, '{"position": "hero", "variant": "A"}'),
(4, 'image', 'https://cdn.example.com/newsletter-popup.jpg', 'Newsletter Signup', 600, 400, '{"position": "popup", "variant": "A"}'),
(5, 'image', 'https://cdn.example.com/fan-festival-hero.jpg', 'Fan Festival', 1920, 600, '{"position": "hero", "variant": "A"}');

-- Sample Popup Rules
INSERT INTO popup_rules (campaign_id, trigger_type, trigger_value, device_target, geo_target, frequency_days, show_once) VALUES
(4, 'exit_intent', 0, ARRAY['desktop', 'mobile'], ARRAY['KE', 'US', 'UK'], 14, true);

-- Sample Campaign Metrics (last 7 days)
INSERT INTO campaign_metrics (campaign_id, metric_date, impressions, clicks, add_to_cart, purchases, revenue) VALUES
(3, CURRENT_DATE - INTERVAL '7 days', 1250, 89, 23, 12, 35988.00),
(3, CURRENT_DATE - INTERVAL '6 days', 1180, 76, 19, 10, 29990.00),
(3, CURRENT_DATE - INTERVAL '5 days', 1320, 94, 28, 15, 44985.00),
(3, CURRENT_DATE - INTERVAL '4 days', 1100, 67, 16, 8, 23992.00),
(3, CURRENT_DATE - INTERVAL '3 days', 1400, 102, 31, 18, 53982.00),
(3, CURRENT_DATE - INTERVAL '2 days', 1280, 88, 25, 13, 38989.00),
(3, CURRENT_DATE - INTERVAL '1 day', 1350, 95, 27, 14, 41986.00),
(4, CURRENT_DATE - INTERVAL '7 days', 890, 45, 12, 6, 8994.00),
(4, CURRENT_DATE - INTERVAL '6 days', 920, 52, 15, 8, 11992.00),
(4, CURRENT_DATE - INTERVAL '5 days', 850, 38, 9, 4, 5996.00),
(4, CURRENT_DATE - INTERVAL '4 days', 980, 61, 18, 10, 14990.00),
(4, CURRENT_DATE - INTERVAL '3 days', 1050, 67, 20, 11, 16489.00),
(4, CURRENT_DATE - INTERVAL '2 days', 890, 44, 11, 5, 7495.00),
(4, CURRENT_DATE - INTERVAL '1 day', 1020, 58, 16, 9, 13491.00);

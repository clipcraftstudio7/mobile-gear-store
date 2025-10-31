-- Migration: Create Campaign System Tables
-- Description: Creates tables for Flash Sales, Banners, and Popups advertising system
-- Date: 2025-01-27

-- Campaigns (flash sale / promo campaigns)
CREATE TABLE campaigns (
    id SERIAL PRIMARY KEY,
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL CHECK (type IN ('flash','banner','popup','hero')),
    start_at TIMESTAMPTZ,
    end_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT FALSE, -- admin-controlled or auto via scheduler
    preview_payload JSONB, -- to help preview custom layout
    created_by INTEGER, -- admin user id
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Campaign products (products participating in a campaign)
CREATE TABLE campaign_products (
    id SERIAL PRIMARY KEY,
    campaign_id INTEGER REFERENCES campaigns(id) ON DELETE CASCADE,
    product_id BIGINT NOT NULL,
    original_price NUMERIC(12,2),
    sale_price NUMERIC(12,2) NOT NULL,
    reserved_stock INTEGER DEFAULT 0, -- stock allocated to this campaign
    max_per_customer INTEGER DEFAULT 1,
    display_order INTEGER DEFAULT 0,
    metadata JSONB
);

-- Banners / assets
CREATE TABLE campaign_assets (
    id SERIAL PRIMARY KEY,
    campaign_id INTEGER REFERENCES campaigns(id) ON DELETE CASCADE,
    asset_type TEXT CHECK (asset_type IN ('image','video','html')),
    url TEXT,
    alt TEXT,
    width INTEGER,
    height INTEGER,
    metadata JSONB
);

-- Popup rules
CREATE TABLE popup_rules (
    id SERIAL PRIMARY KEY,
    campaign_id INTEGER REFERENCES campaigns(id) ON DELETE CASCADE,
    trigger_type TEXT CHECK (trigger_type IN ('time_on_page','exit_intent','scroll','cart_value','manual')),
    trigger_value INTEGER, -- seconds or percent or cart value
    device_target TEXT[], -- e.g. ['mobile','desktop']
    geo_target TEXT[], -- country codes
    frequency_days INTEGER DEFAULT 7, -- show once per X days
    show_once BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Stock reservations for items added to cart under campaign
CREATE TABLE stock_reservations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_product_id INTEGER REFERENCES campaign_products(id) ON DELETE CASCADE,
    user_id INTEGER NULL, -- nullable for guests (use session id)
    session_id TEXT,
    quantity INTEGER NOT NULL,
    reserved_until TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    consumed BOOLEAN DEFAULT FALSE
);

-- Metrics
CREATE TABLE campaign_metrics (
    id BIGSERIAL PRIMARY KEY,
    campaign_id INTEGER REFERENCES campaigns(id) ON DELETE CASCADE,
    metric_date DATE NOT NULL,
    impressions INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    add_to_cart INTEGER DEFAULT 0,
    purchases INTEGER DEFAULT 0,
    revenue NUMERIC(12,2) DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX idx_campaigns_active ON campaigns(is_active, start_at, end_at);
CREATE INDEX idx_campaigns_slug ON campaigns(slug);
CREATE INDEX idx_campaign_products_campaign_id ON campaign_products(campaign_id);
CREATE INDEX idx_campaign_products_product_id ON campaign_products(product_id);
CREATE INDEX idx_campaign_assets_campaign_id ON campaign_assets(campaign_id);
CREATE INDEX idx_popup_rules_campaign_id ON popup_rules(campaign_id);
CREATE INDEX idx_stock_reservations_campaign_product_id ON stock_reservations(campaign_product_id);
CREATE INDEX idx_stock_reservations_reserved_until ON stock_reservations(reserved_until) WHERE consumed = FALSE;
CREATE INDEX idx_stock_reservations_session_id ON stock_reservations(session_id);
CREATE INDEX idx_campaign_metrics_campaign_date ON campaign_metrics(campaign_id, metric_date);

-- Create unique constraint for campaign metrics per day
CREATE UNIQUE INDEX idx_campaign_metrics_unique ON campaign_metrics(campaign_id, metric_date);

-- Add comments for documentation
COMMENT ON TABLE campaigns IS 'Stores campaign metadata for flash sales, banners, and popups';
COMMENT ON TABLE campaign_products IS 'Links products to campaigns with campaign-specific pricing and stock';
COMMENT ON TABLE campaign_assets IS 'Stores assets like images/videos for campaigns';
COMMENT ON TABLE popup_rules IS 'Defines rules for popup display and targeting';
COMMENT ON TABLE stock_reservations IS 'Manages TTL stock reservations for items added to cart';
COMMENT ON TABLE campaign_metrics IS 'Tracks campaign performance metrics daily';

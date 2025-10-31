-- Create function to consume reservations atomically
-- This function handles the checkout process by consuming reservations and updating stock

CREATE OR REPLACE FUNCTION consume_reservations(reservation_ids UUID[])
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    reservation_record RECORD;
    campaign_product_record RECORD;
BEGIN
    -- Loop through each reservation
    FOR reservation_record IN 
        SELECT 
            sr.id,
            sr.campaign_product_id,
            sr.quantity,
            sr.session_id,
            cp.reserved_stock,
            cp.product_id
        FROM stock_reservations sr
        JOIN campaign_products cp ON sr.campaign_product_id = cp.id
        WHERE sr.id = ANY(reservation_ids)
        AND sr.consumed = false
        AND sr.reserved_until > NOW()
    LOOP
        -- Mark reservation as consumed
        UPDATE stock_reservations 
        SET consumed = true 
        WHERE id = reservation_record.id;
        
        -- Update campaign product reserved stock
        UPDATE campaign_products 
        SET reserved_stock = reserved_stock - reservation_record.quantity
        WHERE id = reservation_record.campaign_product_id;
        
        -- Update main product stock (if you have a products table with stock)
        -- Uncomment the following lines if you have a products table with stock column
        -- UPDATE products 
        -- SET stock = stock - reservation_record.quantity
        -- WHERE id = reservation_record.product_id;
        
        -- Log the transaction (optional)
        INSERT INTO campaign_metrics (
            campaign_id,
            metric_date,
            purchases,
            revenue
        )
        SELECT 
            cp.campaign_id,
            CURRENT_DATE,
            1,
            cp.sale_price * reservation_record.quantity
        FROM campaign_products cp
        WHERE cp.id = reservation_record.campaign_product_id
        ON CONFLICT (campaign_id, metric_date)
        DO UPDATE SET
            purchases = campaign_metrics.purchases + 1,
            revenue = campaign_metrics.revenue + EXCLUDED.revenue,
            updated_at = NOW();
            
    END LOOP;
    
    -- If no reservations were processed, raise an error
    IF NOT FOUND THEN
        RAISE EXCEPTION 'No valid reservations found to consume';
    END IF;
END;
$$;

-- Create a function to clean expired reservations
CREATE OR REPLACE FUNCTION clean_expired_reservations()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Delete expired reservations
    DELETE FROM stock_reservations 
    WHERE reserved_until < NOW() 
    AND consumed = false;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count;
END;
$$;

-- Create a function to activate/deactivate campaigns based on time
CREATE OR REPLACE FUNCTION update_campaign_status()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Activate campaigns that should start
    UPDATE campaigns 
    SET is_active = true, updated_at = NOW()
    WHERE start_at <= NOW() 
    AND end_at > NOW() 
    AND is_active = false;
    
    -- Deactivate campaigns that should end
    UPDATE campaigns 
    SET is_active = false, updated_at = NOW()
    WHERE end_at <= NOW() 
    AND is_active = true;
END;
$$;

-- Create indexes for better performance on the functions
CREATE INDEX IF NOT EXISTS idx_stock_reservations_consumed_expired 
ON stock_reservations(consumed, reserved_until) 
WHERE consumed = false;

CREATE INDEX IF NOT EXISTS idx_campaigns_time_status 
ON campaigns(start_at, end_at, is_active);

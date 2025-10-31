const { createClient } = require('@supabase/supabase-js');
const cron = require('node-cron');

// Supabase configuration
const SUPABASE_URL = process.env.SUPABASE_URL || "https://kokntkhxkymllafuubun.supabase.co";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || "your-service-key-here";

// Initialize Supabase client with service key for admin operations
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

class CampaignWorker {
  constructor() {
    this.isRunning = false;
  }

  // Clean expired reservations
  async cleanExpiredReservations() {
    try {
      console.log('🧹 Cleaning expired reservations...');
      
      const { data, error } = await supabase.rpc('clean_expired_reservations');
      
      if (error) {
        console.error('❌ Error cleaning expired reservations:', error);
        return;
      }
      
      console.log(`✅ Cleaned ${data} expired reservations`);
    } catch (error) {
      console.error('❌ Error in cleanExpiredReservations:', error);
    }
  }

  // Update campaign status (activate/deactivate based on time)
  async updateCampaignStatus() {
    try {
      console.log('🔄 Updating campaign status...');
      
      const { error } = await supabase.rpc('update_campaign_status');
      
      if (error) {
        console.error('❌ Error updating campaign status:', error);
        return;
      }
      
      console.log('✅ Campaign status updated');
    } catch (error) {
      console.error('❌ Error in updateCampaignStatus:', error);
    }
  }

  // Update campaign metrics
  async updateCampaignMetrics() {
    try {
      console.log('📊 Updating campaign metrics...');
      
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      
      // Get active campaigns
      const { data: activeCampaigns, error: campaignsError } = await supabase
        .from('campaigns')
        .select('id, title')
        .eq('is_active', true)
        .lte('start_at', now.toISOString())
        .gte('end_at', now.toISOString());
      
      if (campaignsError) {
        console.error('❌ Error fetching active campaigns:', campaignsError);
        return;
      }
      
      // Update metrics for each active campaign
      for (const campaign of activeCampaigns) {
        // Get today's reservations for this campaign
        const { data: reservations, error: reservationsError } = await supabase
          .from('stock_reservations')
          .select(`
            quantity,
            consumed,
            campaign_product:campaign_products (
              sale_price,
              campaign_id
            )
          `)
          .eq('campaign_product.campaign_id', campaign.id)
          .gte('created_at', today + 'T00:00:00')
          .lte('created_at', today + 'T23:59:59');
        
        if (reservationsError) {
          console.error(`❌ Error fetching reservations for campaign ${campaign.id}:`, reservationsError);
          continue;
        }
        
        // Calculate metrics
        const addToCart = reservations.filter(r => !r.consumed).length;
        const purchases = reservations.filter(r => r.consumed).length;
        const revenue = reservations
          .filter(r => r.consumed)
          .reduce((sum, r) => sum + (r.campaign_product.sale_price * r.quantity), 0);
        
        // Upsert metrics
        const { error: metricsError } = await supabase
          .from('campaign_metrics')
          .upsert({
            campaign_id: campaign.id,
            metric_date: today,
            add_to_cart: addToCart,
            purchases: purchases,
            revenue: revenue,
            updated_at: now.toISOString()
          }, {
            onConflict: 'campaign_id,metric_date'
          });
        
        if (metricsError) {
          console.error(`❌ Error updating metrics for campaign ${campaign.id}:`, metricsError);
        } else {
          console.log(`✅ Updated metrics for campaign: ${campaign.title}`);
        }
      }
    } catch (error) {
      console.error('❌ Error in updateCampaignMetrics:', error);
    }
  }

  // Start all scheduled tasks
  start() {
    if (this.isRunning) {
      console.log('⚠️ Worker is already running');
      return;
    }

    console.log('🚀 Starting Campaign Worker...');
    this.isRunning = true;

    // Clean expired reservations every 5 minutes
    cron.schedule('*/5 * * * *', () => {
      this.cleanExpiredReservations();
    });

    // Update campaign status every minute
    cron.schedule('* * * * *', () => {
      this.updateCampaignStatus();
    });

    // Update campaign metrics every hour
    cron.schedule('0 * * * *', () => {
      this.updateCampaignMetrics();
    });

    console.log('✅ Campaign Worker started successfully');
    console.log('📅 Scheduled tasks:');
    console.log('   - Clean expired reservations: Every 5 minutes');
    console.log('   - Update campaign status: Every minute');
    console.log('   - Update campaign metrics: Every hour');
  }

  // Stop all scheduled tasks
  stop() {
    if (!this.isRunning) {
      console.log('⚠️ Worker is not running');
      return;
    }

    console.log('🛑 Stopping Campaign Worker...');
    this.isRunning = false;
    process.exit(0);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Received SIGINT, shutting down gracefully...');
  if (worker) {
    worker.stop();
  }
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
  if (worker) {
    worker.stop();
  }
});

// Start the worker
const worker = new CampaignWorker();
worker.start();

// Export for testing
module.exports = CampaignWorker;

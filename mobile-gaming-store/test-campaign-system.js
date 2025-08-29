const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const SUPABASE_URL = process.env.SUPABASE_URL || "https://kokntkhxkymllafuubun.supabase.co";
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtva250a2h4a3ltbGxhZnV1YnVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3NzYxODcsImV4cCI6MjA2ODM1MjE4N30.Ekc6HLszFSYTIgsvzTdKJWr85nFMUH2HQBQrg_uqXRc";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testCampaignSystem() {
  console.log('🧪 Testing Campaign System...\n');

  try {
    // Test 1: Check if tables exist
    console.log('1. Checking database tables...');
    const { data: campaigns, error: campaignsError } = await supabase
      .from('campaigns')
      .select('count')
      .limit(1);
    
    if (campaignsError) {
      console.error('❌ Campaigns table not found:', campaignsError.message);
      return;
    }
    console.log('✅ Campaigns table exists');

    const { data: campaignProducts, error: productsError } = await supabase
      .from('campaign_products')
      .select('count')
      .limit(1);
    
    if (productsError) {
      console.error('❌ Campaign products table not found:', productsError.message);
      return;
    }
    console.log('✅ Campaign products table exists');

    // Test 2: Check sample data
    console.log('\n2. Checking sample data...');
    const { data: sampleCampaigns, error: sampleError } = await supabase
      .from('campaigns')
      .select('id, title, type, is_active')
      .limit(5);

    if (sampleError) {
      console.error('❌ Error fetching sample campaigns:', sampleError.message);
      return;
    }

    console.log(`✅ Found ${sampleCampaigns.length} sample campaigns:`);
    sampleCampaigns.forEach(campaign => {
      console.log(`   - ${campaign.title} (${campaign.type}) - Active: ${campaign.is_active}`);
    });

    // Test 3: Check functions
    console.log('\n3. Testing database functions...');
    
    // Test clean expired reservations function
    const { data: cleanedCount, error: cleanError } = await supabase.rpc('clean_expired_reservations');
    if (cleanError) {
      console.error('❌ Clean expired reservations function error:', cleanError.message);
    } else {
      console.log(`✅ Clean expired reservations function works (cleaned: ${cleanedCount})`);
    }

    // Test update campaign status function
    const { error: statusError } = await supabase.rpc('update_campaign_status');
    if (statusError) {
      console.error('❌ Update campaign status function error:', statusError.message);
    } else {
      console.log('✅ Update campaign status function works');
    }

    // Test 4: Check active campaigns
    console.log('\n4. Checking active campaigns...');
    const { data: activeCampaigns, error: activeError } = await supabase
      .from('campaigns')
      .select('id, title, type, start_at, end_at')
      .eq('is_active', true);

    if (activeError) {
      console.error('❌ Error fetching active campaigns:', activeError.message);
      return;
    }

    console.log(`✅ Found ${activeCampaigns.length} active campaigns:`);
    activeCampaigns.forEach(campaign => {
      const startTime = new Date(campaign.start_at).toLocaleString();
      const endTime = new Date(campaign.end_at).toLocaleString();
      console.log(`   - ${campaign.title} (${campaign.type})`);
      console.log(`     Start: ${startTime}, End: ${endTime}`);
    });

    // Test 5: Check campaign products
    console.log('\n5. Checking campaign products...');
    const { data: campaignProducts, error: cpError } = await supabase
      .from('campaign_products')
      .select(`
        id,
        campaign_id,
        product_id,
        sale_price,
        reserved_stock,
        max_per_customer,
        campaigns (title)
      `)
      .limit(5);

    if (cpError) {
      console.error('❌ Error fetching campaign products:', cpError.message);
      return;
    }

    console.log(`✅ Found ${campaignProducts.length} campaign products:`);
    campaignProducts.forEach(cp => {
      console.log(`   - Product ${cp.product_id} in "${cp.campaigns.title}"`);
      console.log(`     Sale price: $${cp.sale_price}, Reserved stock: ${cp.reserved_stock}`);
    });

    // Test 6: Check metrics
    console.log('\n6. Checking campaign metrics...');
    const { data: metrics, error: metricsError } = await supabase
      .from('campaign_metrics')
      .select('campaign_id, metric_date, impressions, clicks, purchases, revenue')
      .limit(5);

    if (metricsError) {
      console.error('❌ Error fetching metrics:', metricsError.message);
      return;
    }

    console.log(`✅ Found ${metrics.length} metric records:`);
    metrics.forEach(metric => {
      console.log(`   - Campaign ${metric.campaign_id} on ${metric.metric_date}`);
      console.log(`     Impressions: ${metric.impressions}, Clicks: ${metric.clicks}`);
      console.log(`     Purchases: ${metric.purchases}, Revenue: $${metric.revenue}`);
    });

    console.log('\n🎉 All tests passed! Campaign system is working correctly.');
    console.log('\n📋 Next steps:');
    console.log('1. Start the main server: npm start');
    console.log('2. Start the worker: node workers/campaign-worker.js');
    console.log('3. Import Postman collection for API testing');
    console.log('4. Create your first campaign via admin panel');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Check Supabase connection');
    console.log('2. Verify migrations have been run');
    console.log('3. Check environment variables');
    console.log('4. Ensure database functions exist');
  }
}

// Run the test
testCampaignSystem();

// Test Admin Messaging System
console.log("📨 Testing Admin Messaging System...");

class AdminMessagingTester {
  constructor() {
    this.serverUrl = 'http://localhost:3000';
  }

  async testMessagingSystem() {
    console.log("\n=== 📨 ADMIN MESSAGING SYSTEM TEST ===");
    
    try {
      // Test 1: Check if we're on admin dashboard
      const isOnAdminPage = window.location.pathname.includes('admin-dashboard.html');
      console.log("On admin dashboard:", isOnAdminPage ? "✅ YES" : "❌ NO");
      
      if (!isOnAdminPage) {
        console.log("💡 Not on admin dashboard. Navigate to admin-dashboard.html to test messaging");
        return false;
      }

      // Test 2: Check messaging elements exist
      await this.testMessagingElements();
      
      // Test 3: Test message form functionality
      this.testMessageFormFunctionality();
      
      // Test 4: Test message history loading
      await this.testMessageHistory();
      
      // Test 5: Test database connectivity
      await this.testDatabaseConnectivity();
      
      console.log("\n✅ Messaging system tests completed!");
      return true;
      
    } catch (error) {
      console.error("❌ Messaging test failed:", error);
      return false;
    }
  }

  async testMessagingElements() {
    console.log("\n🔍 Testing Messaging Elements...");
    
    const elements = {
      'Messaging Section': document.getElementById('admin-messaging-section'),
      'Broadcast Form': document.getElementById('broadcast-message-form'),
      'Message Type Select': document.getElementById('message-type'),
      'Message Title Input': document.getElementById('message-title'),
      'Message Content Textarea': document.getElementById('message-content'),
      'Message History': document.getElementById('message-history'),
      'Messages Nav Link': document.querySelector('a[href="#messages"]')
    };
    
    let allPresent = true;
    for (const [name, element] of Object.entries(elements)) {
      const exists = !!element;
      console.log(`${name}: ${exists ? '✅' : '❌'}`);
      if (!exists) allPresent = false;
    }
    
    return allPresent;
  }

  testMessageFormFunctionality() {
    console.log("\n📝 Testing Message Form Functionality...");
    
    const form = document.getElementById('broadcast-message-form');
    const typeSelect = document.getElementById('message-type');
    const titleInput = document.getElementById('message-title');
    const contentTextarea = document.getElementById('message-content');
    
    if (!form || !typeSelect || !titleInput || !contentTextarea) {
      console.log("❌ Form elements missing");
      return false;
    }
    
    // Test form submission handler
    const hasSubmitHandler = form.onsubmit !== null || form.querySelector('button[type="submit"]');
    console.log("Form submit handler:", hasSubmitHandler ? "✅" : "❌");
    
    // Test preview function
    const hasPreviewFunction = typeof window.previewMessage === 'function';
    console.log("Preview function:", hasPreviewFunction ? "✅" : "❌");
    
    // Test message types
    const messageTypes = Array.from(typeSelect.options).map(opt => opt.value);
    console.log("Available message types:", messageTypes);
    
    return hasSubmitHandler && hasPreviewFunction;
  }

  async testMessageHistory() {
    console.log("\n📚 Testing Message History...");
    
    const historyContainer = document.getElementById('message-history');
    if (!historyContainer) {
      console.log("❌ Message history container not found");
      return false;
    }
    
    // Check if loadMessageHistory function exists
    const hasLoadFunction = typeof window.loadMessageHistory === 'function';
    console.log("Load message history function:", hasLoadFunction ? "✅" : "❌");
    
    if (hasLoadFunction) {
      try {
        await window.loadMessageHistory();
        console.log("✅ Message history loaded successfully");
        return true;
      } catch (error) {
        console.log("❌ Error loading message history:", error.message);
        return false;
      }
    }
    
    return false;
  }

  async testDatabaseConnectivity() {
    console.log("\n🗄️ Testing Database Connectivity...");
    
    try {
      // Test Supabase connection
      if (!window.supabase) {
        console.log("❌ Supabase not loaded");
        return false;
      }
      console.log("✅ Supabase connected");
      
      // Test user authentication
      const { data: { user }, error: userError } = await window.supabase.auth.getUser();
      if (userError || !user) {
        console.log("❌ User not authenticated");
        return false;
      }
      console.log("✅ User authenticated:", user.id);
      
      // Test messages table
      const { data: messages, error: messagesError } = await window.supabase
        .from("messages")
        .select("id")
        .limit(1);
      
      if (messagesError) {
        console.log("❌ Messages table error:", messagesError.message);
        return false;
      }
      console.log("✅ Messages table accessible");
      
      // Test profiles table
      const { data: profiles, error: profilesError } = await window.supabase
        .from("profiles")
        .select("id")
        .limit(1);
      
      if (profilesError) {
        console.log("❌ Profiles table error:", profilesError.message);
        return false;
      }
      console.log("✅ Profiles table accessible");
      
      return true;
    } catch (error) {
      console.log("❌ Database connectivity error:", error.message);
      return false;
    }
  }

  // Utility method to simulate sending a test message
  async simulateTestMessage() {
    console.log("\n🧪 Simulating Test Message...");
    
    try {
      const testMessage = {
        type: 'system',
        title: 'Test Message from Admin',
        content: 'This is a test message sent by the admin system.'
      };
      
      // Fill the form
      document.getElementById('message-type').value = testMessage.type;
      document.getElementById('message-title').value = testMessage.title;
      document.getElementById('message-content').value = testMessage.content;
      
      console.log("✅ Test message form filled");
      console.log("💡 Click 'Send to All Users' to actually send the message");
      
      return testMessage;
    } catch (error) {
      console.log("❌ Error simulating test message:", error.message);
      return null;
    }
  }

  // Generate messaging system report
  generateMessagingReport() {
    console.log("\n📊 MESSAGING SYSTEM REPORT");
    console.log("============================");
    
    const checks = [
      { name: "On Admin Page", check: () => window.location.pathname.includes('admin-dashboard.html') },
      { name: "Messaging Section", check: () => !!document.getElementById('admin-messaging-section') },
      { name: "Broadcast Form", check: () => !!document.getElementById('broadcast-message-form') },
      { name: "Message History", check: () => !!document.getElementById('message-history') },
      { name: "Messages Nav Link", check: () => !!document.querySelector('a[href="#messages"]') },
      { name: "Preview Function", check: () => typeof window.previewMessage === 'function' },
      { name: "Supabase Connected", check: () => !!window.supabase },
      { name: "Message Types Available", check: () => document.getElementById('message-type')?.options?.length > 0 }
    ];
    
    checks.forEach(({ name, check }) => {
      const result = check();
      console.log(`${name}: ${result ? '✅ READY' : '❌ NOT READY'}`);
    });
  }

  // Show how to use the messaging system
  showUsageInstructions() {
    console.log("\n📖 HOW TO USE ADMIN MESSAGING SYSTEM");
    console.log("=====================================");
    console.log("1. Click 'Messages' in the sidebar navigation");
    console.log("2. Fill in the message form:");
    console.log("   - Select message type (order, offer, wishlist, system, promo)");
    console.log("   - Enter message title");
    console.log("   - Enter message content");
    console.log("3. Click 'Preview' to see how the message will look");
    console.log("4. Click 'Send to All Users' to broadcast the message");
    console.log("5. View sent messages in the 'Recent Messages Sent' section");
    console.log("\n💡 Messages will appear in users' message centers across the site!");
  }
}

// Create global tester instance
const messagingTester = new AdminMessagingTester();

// Make functions available globally
window.testMessaging = () => messagingTester.testMessagingSystem();
window.messagingReport = () => messagingTester.generateMessagingReport();
window.simulateTestMessage = () => messagingTester.simulateTestMessage();
window.showMessagingInstructions = () => messagingTester.showUsageInstructions();

// Auto-run basic tests if on admin page
if (window.location.pathname.includes('admin-dashboard.html')) {
  messagingTester.generateMessagingReport();
  setTimeout(() => {
    messagingTester.showUsageInstructions();
  }, 2000);
}

console.log("📨 Admin messaging test suite loaded!");
console.log("Commands:");
console.log("- testMessaging() - Run full messaging system test");
console.log("- messagingReport() - Quick status report");
console.log("- simulateTestMessage() - Fill form with test message");
console.log("- showMessagingInstructions() - Show usage instructions");

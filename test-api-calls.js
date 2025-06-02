// Test script to monitor all API calls and identify which one is failing
// Run this in the browser console after the app loads

console.log('=== API Call Monitor Test ===');

// Store original fetch function
const originalFetch = window.fetch;

// Track all API calls
const apiCalls = [];

// Override fetch to monitor all API calls
window.fetch = async function(input, init) {
  const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
  const method = init?.method || 'GET';
  
  // Only monitor API calls to our backend
  if (url.includes('localhost:5203') || url.includes('/api/')) {
    const callInfo = {
      url,
      method,
      timestamp: new Date().toISOString(),
      headers: init?.headers || {}
    };
    
    console.log(`🔄 API Call: ${method} ${url}`);
    apiCalls.push(callInfo);
    
    try {
      const response = await originalFetch(input, init);
      
      if (response.ok) {
        console.log(`✅ API Success: ${method} ${url} (${response.status})`);
        callInfo.status = response.status;
        callInfo.success = true;
      } else {
        console.error(`❌ API Error: ${method} ${url} (${response.status})`);
        callInfo.status = response.status;
        callInfo.success = false;
        callInfo.error = `HTTP ${response.status} ${response.statusText}`;
        
        // Try to get error details
        try {
          const errorText = await response.clone().text();
          callInfo.errorDetails = errorText;
          console.error(`Error details: ${errorText}`);
        } catch (e) {
          console.error('Could not read error details');
        }
      }
      
      return response;
    } catch (error) {
      console.error(`💥 API Exception: ${method} ${url}`, error);
      callInfo.success = false;
      callInfo.error = error.message;
      throw error;
    }
  }
  
  // For non-API calls, use original fetch
  return originalFetch(input, init);
};

// Function to show API call summary
function showApiSummary() {
  console.log('=== API Call Summary ===');
  console.log(`Total API calls: ${apiCalls.length}`);
  
  const successful = apiCalls.filter(call => call.success);
  const failed = apiCalls.filter(call => !call.success);
  
  console.log(`✅ Successful: ${successful.length}`);
  console.log(`❌ Failed: ${failed.length}`);
  
  if (failed.length > 0) {
    console.log('\n🚨 Failed API calls:');
    failed.forEach(call => {
      console.log(`- ${call.method} ${call.url} (${call.status || 'No status'}) - ${call.error}`);
      if (call.errorDetails) {
        console.log(`  Details: ${call.errorDetails.substring(0, 200)}...`);
      }
    });
  }
  
  return { successful, failed, total: apiCalls.length };
}

// Function to test login and monitor API calls
async function testLoginFlow() {
  console.log('=== Testing Login Flow ===');
  
  // Clear previous API calls
  apiCalls.length = 0;
  
  // Check if already logged in
  const token = sessionStorage.getItem('auth_token');
  if (token) {
    console.log('✅ Already logged in, monitoring existing API calls...');
    
    // Wait a bit for any ongoing API calls to complete
    setTimeout(() => {
      showApiSummary();
    }, 3000);
    
    return;
  }
  
  console.log('❌ Not logged in. Please login manually and then run showApiSummary()');
}

// Function to test SignalR connection after login
async function testSignalRAfterLogin() {
  console.log('=== Testing SignalR Connection ===');
  
  const token = sessionStorage.getItem('auth_token');
  if (!token) {
    console.log('❌ Not logged in. Please login first.');
    return;
  }
  
  if (window.signalRService) {
    console.log('✅ SignalR service found');
    
    // Debug auth status
    window.signalRService.debugAuthStatus();
    
    // Test connection
    try {
      const connected = await window.signalRService.startConnection();
      if (connected) {
        console.log('✅ SignalR connection successful!');
        console.log('Connection state:', window.signalRService.getConnectionState());
      } else {
        console.log('❌ SignalR connection failed');
      }
    } catch (error) {
      console.error('💥 SignalR connection error:', error);
    }
  } else {
    console.log('❌ SignalR service not found');
  }
}

// Function to clear API monitoring
function clearApiMonitoring() {
  window.fetch = originalFetch;
  apiCalls.length = 0;
  console.log('API monitoring cleared');
}

// Export functions for manual use
window.showApiSummary = showApiSummary;
window.testLoginFlow = testLoginFlow;
window.testSignalRAfterLogin = testSignalRAfterLogin;
window.clearApiMonitoring = clearApiMonitoring;

console.log('API monitoring started. Available commands:');
console.log('- showApiSummary() - Show summary of all API calls');
console.log('- testLoginFlow() - Test login flow and monitor API calls');
console.log('- testSignalRAfterLogin() - Test SignalR connection after login');
console.log('- clearApiMonitoring() - Stop monitoring and restore original fetch');

// Auto-start monitoring
testLoginFlow();

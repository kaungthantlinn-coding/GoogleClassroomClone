// Test script to verify SignalR authentication fix
// Run this in the browser console after the app loads

console.log('=== SignalR Authentication Test ===');

// Test credentials (user already created via API)
const TEST_CREDENTIALS = {
  email: 'test.teacher@example.com',
  password: 'password123'
};

// Function to test user registration and SignalR connection
async function testSignalRAuth() {
  try {
    console.log('1. Testing user registration...');
    
    // Navigate to signup page
    window.location.href = '/signup';
    
    // Wait for page to load
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Fill out the form programmatically
    const nameInput = document.querySelector('input[name="name"]');
    const emailInput = document.querySelector('input[name="email"]');
    const passwordInput = document.querySelector('input[name="password"]');
    const confirmPasswordInput = document.querySelector('input[name="confirm-password"]');
    
    if (nameInput && emailInput && passwordInput && confirmPasswordInput) {
      nameInput.value = 'Test Teacher';
      emailInput.value = 'test.teacher@example.com';
      passwordInput.value = 'password123';
      confirmPasswordInput.value = 'password123';
      
      // Trigger change events
      nameInput.dispatchEvent(new Event('input', { bubbles: true }));
      emailInput.dispatchEvent(new Event('input', { bubbles: true }));
      passwordInput.dispatchEvent(new Event('input', { bubbles: true }));
      confirmPasswordInput.dispatchEvent(new Event('input', { bubbles: true }));
      
      console.log('Form filled out successfully');
      
      // Submit the form
      const form = document.querySelector('form');
      if (form) {
        form.dispatchEvent(new Event('submit', { bubbles: true }));
        console.log('Registration form submitted');
        
        // Wait for registration to complete
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Check if we're redirected to home page (successful registration)
        if (window.location.pathname === '/') {
          console.log('✅ Registration successful - redirected to home page');
          
          // Now test SignalR connection
          await testSignalRConnection();
        } else {
          console.log('❌ Registration may have failed - still on signup page');
        }
      }
    } else {
      console.log('❌ Could not find form inputs');
    }
  } catch (error) {
    console.error('Error during registration test:', error);
  }
}

// Function to test SignalR connection specifically
async function testSignalRConnection() {
  console.log('2. Testing SignalR connection...');
  
  try {
    // Check if SignalR service is available
    if (window.signalRService) {
      console.log('✅ SignalR service is available');
      
      // Debug authentication status
      window.signalRService.debugAuthStatus();
      
      // Test manual connection
      console.log('Attempting manual SignalR connection...');
      const connected = await window.signalRService.startConnection();
      
      if (connected) {
        console.log('✅ SignalR connection successful!');
        console.log('Connection state:', window.signalRService.getConnectionState());
      } else {
        console.log('❌ SignalR connection failed');
        window.signalRService.debugAuthStatus();
      }
    } else {
      console.log('❌ SignalR service not available on window object');
    }
  } catch (error) {
    console.error('Error during SignalR connection test:', error);
  }
}

// Function to test with existing user (if registration fails)
async function testWithExistingUser() {
  console.log('3. Testing with existing user login...');
  
  try {
    // Navigate to login page
    window.location.href = '/login';
    
    // Wait for page to load
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Try common test credentials
    const emailInput = document.querySelector('input[name="email"]');
    const passwordInput = document.querySelector('input[name="password"]');
    
    if (emailInput && passwordInput) {
      emailInput.value = 'test.teacher@example.com';
      passwordInput.value = 'password123';
      
      // Trigger change events
      emailInput.dispatchEvent(new Event('input', { bubbles: true }));
      passwordInput.dispatchEvent(new Event('input', { bubbles: true }));
      
      // Submit the form
      const form = document.querySelector('form');
      if (form) {
        form.dispatchEvent(new Event('submit', { bubbles: true }));
        console.log('Login form submitted');
        
        // Wait for login to complete
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Check if we're redirected to home page (successful login)
        if (window.location.pathname === '/') {
          console.log('✅ Login successful - redirected to home page');
          await testSignalRConnection();
        } else {
          console.log('❌ Login failed - still on login page');
        }
      }
    }
  } catch (error) {
    console.error('Error during login test:', error);
  }
}

// Function to check current authentication status
function checkAuthStatus() {
  console.log('=== Current Authentication Status ===');
  console.log('sessionStorage auth_token:', !!sessionStorage.getItem('auth_token'));
  console.log('localStorage auth_token:', !!localStorage.getItem('auth_token'));
  console.log('sessionStorage user_role:', sessionStorage.getItem('user_role'));
  console.log('Current URL:', window.location.href);
  
  // Check if user is already logged in
  const token = sessionStorage.getItem('auth_token');
  if (token) {
    console.log('✅ User appears to be logged in');
    console.log('Token preview:', token.substring(0, 20) + '...');
    testSignalRConnection();
  } else {
    console.log('❌ User not logged in');
  }
}

// Export functions for manual testing
window.testSignalRAuth = testSignalRAuth;
window.testSignalRConnection = testSignalRConnection;
window.testWithExistingUser = testWithExistingUser;
window.checkAuthStatus = checkAuthStatus;
window.testAuthenticatedEndpoint = testAuthenticatedEndpoint;

console.log('Test functions loaded. Available commands:');
console.log('- checkAuthStatus() - Check current auth status');
console.log('- testSignalRConnection() - Test SignalR connection only');
console.log('- testWithExistingUser() - Test login with existing user');
console.log('- testSignalRAuth() - Full registration and SignalR test');
console.log('- testAuthenticatedEndpoint() - Test authenticated SignalR endpoint');

// Simple test function that can be run immediately
async function quickTest() {
  console.log('=== Quick SignalR Authentication Test ===');

  // Check if we're already logged in
  const token = sessionStorage.getItem('auth_token');
  if (token) {
    console.log('✅ Already logged in, testing SignalR connection...');
    await testSignalRConnection();
    return;
  }

  console.log('❌ Not logged in. Please login manually with:');
  console.log('Email:', TEST_CREDENTIALS.email);
  console.log('Password:', TEST_CREDENTIALS.password);
  console.log('Then run: testSignalRConnection()');
}

// Test the new authenticated endpoint test
async function testAuthenticatedEndpoint() {
  console.log('=== Testing Authenticated SignalR Endpoint ===');

  if (window.signalRService) {
    const result = await window.signalRService.testEndpointWithAuth();
    console.log('Authenticated endpoint test result:', result);
    return result;
  } else {
    console.log('❌ SignalR service not available');
    return false;
  }
}

// Auto-run initial check
checkAuthStatus();

// Run quick test
quickTest();

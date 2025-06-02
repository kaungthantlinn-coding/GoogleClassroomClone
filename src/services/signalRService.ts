import * as signalR from '@microsoft/signalr';

// Token retrieval that matches the auth system (sessionStorage with 'auth_token' key)
const getToken = (): string | null => {
  try {
    // First try to get token from sessionStorage (primary location)
    const token = sessionStorage.getItem('auth_token');
    if (token) {
      console.log('SignalRService getToken: Found token in sessionStorage');
      return token;
    }

    // Fallback: try localStorage for 'auth_token' key
    const localToken = localStorage.getItem('auth_token');
    if (localToken) {
      console.log('SignalRService getToken: Found token in localStorage');
      return localToken;
    }

    console.error('SignalRService getToken: No authentication token found in sessionStorage or localStorage.');
    return null;
  } catch (error) {
    console.error('SignalRService getToken: Error accessing storage:', error);
    return null;
  }
};

class SignalRService {
  private hubConnection: signalR.HubConnection | null = null;
  private notificationCallbacks: ((notification: any) => void)[] = [];
  private connectionStarted: boolean = false;
  private failureCount: number = 0;
  private maxFailures: number = 3;
  private disabled: boolean = false;

  // Check if user is authenticated
  public isAuthenticated(): boolean {
    return getToken() !== null;
  }

  // Wait for authentication token to be available
  public async waitForAuthentication(maxWaitMs: number = 5000): Promise<boolean> {
    const startTime = Date.now();

    while (Date.now() - startTime < maxWaitMs) {
      const token = getToken();
      if (token && token.length > 0) {
        console.log('SignalRService: Authentication token is now available');
        return true;
      }

      // Wait 100ms before checking again
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.error('SignalRService: Timeout waiting for authentication token');
    return false;
  }

  // Get connection state
  public getConnectionState(): signalR.HubConnectionState | null {
    return this.hubConnection?.state || null;
  }

  // Initialize the connection to the SignalR hub
  public async startConnection(): Promise<boolean> {
    // Check if SignalR is disabled due to repeated failures
    if (this.disabled) {
      console.log('SignalR is disabled due to repeated failures');
      return false;
    }

    // Check if already connected
    if (this.connectionStarted && this.hubConnection?.state === signalR.HubConnectionState.Connected) {
      console.log('SignalR connection already established');
      return true;
    }

    // Prevent multiple simultaneous connection attempts
    if (this.hubConnection?.state === signalR.HubConnectionState.Connecting) {
      console.log('SignalR connection already in progress, skipping...');
      return false;
    }

    try {
      // Wait for authentication token to be available
      console.log('SignalRService: Waiting for authentication token...');
      const authAvailable = await this.waitForAuthentication(5000);

      if (!authAvailable) {
        console.error('SignalRService: Cannot start connection - authentication token not available after waiting');
        return false;
      }

      const token = getToken();
      if (!token) {
        console.error('SignalRService: Cannot start connection - no authentication token available');
        return false;
      }

      // Stop any existing connection first
      if (this.hubConnection) {
        console.log('Stopping existing SignalR connection...');
        await this.hubConnection.stop();
        this.connectionStarted = false;
        // Wait a bit after stopping
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      // Use the API URL from environment or fallback to a default
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5203';
      console.log('SignalRService: Creating new connection to:', apiUrl);

      // Create connection with simplified settings to avoid negotiation issues
      this.hubConnection = new signalR.HubConnectionBuilder()
        .withUrl(`${apiUrl}/hubs/notifications?access_token=${token}`)
        .withAutomaticReconnect()
        .configureLogging(signalR.LogLevel.Information)
        .build();

      // Set up event handlers
      this.hubConnection.on('ReceiveNotification', (notification) => {
        console.log('Received notification:', notification);
        this.notificationCallbacks.forEach(callback => callback(notification));
      });

      // Add connection state change handlers for debugging
      this.hubConnection.onclose((error) => {
        console.log('SignalR connection closed:', error);
        this.connectionStarted = false;
      });

      this.hubConnection.onreconnecting((error) => {
        console.log('SignalR reconnecting:', error);
      });

      this.hubConnection.onreconnected((connectionId) => {
        console.log('SignalR reconnected:', connectionId);
        this.connectionStarted = true;
      });

      console.log('Starting SignalR connection...');

      // Start the connection with timeout
      const connectionPromise = this.hubConnection.start();
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Connection timeout')), 10000)
      );

      await Promise.race([connectionPromise, timeoutPromise]);

      this.connectionStarted = true;
      this.failureCount = 0; // Reset failure count on success
      console.log('SignalR connection established successfully');
      return true;
    } catch (error) {
      console.error('Error establishing SignalR connection:', error);
      this.connectionStarted = false;
      this.failureCount++;

      // Disable SignalR if too many failures
      if (this.failureCount >= this.maxFailures) {
        this.disabled = true;
        console.warn(`SignalR disabled after ${this.failureCount} failures. Will not attempt to reconnect.`);
      }

      // Clean up failed connection
      if (this.hubConnection) {
        try {
          await this.hubConnection.stop();
        } catch (stopError) {
          console.error('Error stopping failed connection:', stopError);
        }
        this.hubConnection = null;
      }

      return false;
    }
  }

  // Stop the connection when no longer needed
  public async stopConnection(): Promise<void> {
    if (this.hubConnection) {
      await this.hubConnection.stop();
      this.connectionStarted = false;
      console.log('SignalR connection stopped');
    }
  }

  // Join a course-specific group to receive notifications for that course
  public async joinCourseGroup(courseId: string): Promise<void> {
    if (this.hubConnection && this.hubConnection.state === signalR.HubConnectionState.Connected) {
      await this.hubConnection.invoke('JoinCourseGroup', courseId);
      console.log(`Joined course group ${courseId}`);
    }
  }

  // Leave a course-specific group
  public async leaveCourseGroup(courseId: string): Promise<void> {
    if (this.hubConnection && this.hubConnection.state === signalR.HubConnectionState.Connected) {
      await this.hubConnection.invoke('LeaveCourseGroup', courseId);
      console.log(`Left course group ${courseId}`);
    }
  }

  // Register a callback to be called when a notification is received
  public onNotification(callback: (notification: any) => void): void {
    this.notificationCallbacks.push(callback);
  }

  // Remove a callback
  public offNotification(callback: (notification: any) => void): void {
    this.notificationCallbacks = this.notificationCallbacks.filter(cb => cb !== callback);
  }

  // Debug helper to check authentication status
  public debugAuthStatus(): void {
    const token = getToken();
    console.log('=== SignalR Authentication Debug ===');
    console.log('Token found:', !!token);
    console.log('Token length:', token?.length || 0);
    console.log('Token preview:', token ? `${token.substring(0, 20)}...` : 'null');
    console.log('Connection state:', this.getConnectionState());
    console.log('Connection started flag:', this.connectionStarted);
    console.log('sessionStorage auth_token:', !!sessionStorage.getItem('auth_token'));
    console.log('localStorage auth_token:', !!localStorage.getItem('auth_token'));
    console.log('===================================');
  }

  // Test if the SignalR endpoint is reachable (for debugging only)
  public async testEndpoint(): Promise<boolean> {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5203';
      const response = await fetch(`${apiUrl}/hubs/notifications/negotiate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('SignalR endpoint test response:', response.status, response.statusText);
      return response.status === 401 || response.status === 200; // 401 is expected without auth
    } catch (error) {
      console.error('SignalR endpoint test failed:', error);
      return false;
    }
  }

  // Test endpoint with authentication token
  public async testEndpointWithAuth(): Promise<boolean> {
    try {
      const token = getToken();
      if (!token) {
        console.log('No token available for authenticated endpoint test');
        return false;
      }

      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5203';
      const response = await fetch(`${apiUrl}/hubs/notifications/negotiate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
      });

      console.log('SignalR authenticated endpoint test response:', response.status, response.statusText);
      return response.status === 200; // Should be 200 with valid auth
    } catch (error) {
      console.error('SignalR authenticated endpoint test failed:', error);
      return false;
    }
  }

  // Reset SignalR service (useful for debugging)
  public reset(): void {
    this.disabled = false;
    this.failureCount = 0;
    this.connectionStarted = false;
    console.log('SignalR service reset');
  }

  // Manual test function for debugging
  public async manualTest(): Promise<void> {
    console.log('=== Manual SignalR Test ===');

    // Step 1: Check authentication
    this.debugAuthStatus();

    // Step 2: Test endpoint
    console.log('Step 2: Testing endpoint...');
    const endpointOk = await this.testEndpoint();
    console.log('Endpoint test result:', endpointOk);

    // Step 3: Try connection
    if (endpointOk) {
      console.log('Step 3: Attempting connection...');
      const connected = await this.startConnection();
      console.log('Connection result:', connected);
    }

    console.log('=== Test Complete ===');
  }
}

// Create a singleton instance
const signalRService = new SignalRService();

// Make it available globally for debugging
if (typeof window !== 'undefined') {
  (window as any).signalRService = signalRService;
}

export default signalRService;

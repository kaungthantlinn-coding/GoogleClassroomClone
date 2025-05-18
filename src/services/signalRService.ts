import * as signalR from '@microsoft/signalr';

// Simple token retrieval - update according to your auth implementation
const getToken = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  return user.token || '';
};

class SignalRService {
  private hubConnection: signalR.HubConnection | null = null;
  private notificationCallbacks: ((notification: any) => void)[] = [];

  // Initialize the connection to the SignalR hub
  public async startConnection(): Promise<void> {
    try {
      const token = getToken();
      
      // Use the API URL from environment or fallback to a default
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      
      this.hubConnection = new signalR.HubConnectionBuilder()
        .withUrl(`${apiUrl}/hubs/notifications?access_token=${token}`)
        .withAutomaticReconnect()
        .build();

      // Set up event handlers
      this.hubConnection.on('ReceiveNotification', (notification) => {
        console.log('Received notification:', notification);
        this.notificationCallbacks.forEach(callback => callback(notification));
      });

      // Start the connection
      await this.hubConnection.start();
      console.log('SignalR connection established');
    } catch (error) {
      console.error('Error establishing SignalR connection:', error);
    }
  }

  // Stop the connection when no longer needed
  public async stopConnection(): Promise<void> {
    if (this.hubConnection) {
      await this.hubConnection.stop();
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
}

// Create a singleton instance
const signalRService = new SignalRService();
export default signalRService;

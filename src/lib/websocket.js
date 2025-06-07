import SockJS from 'sockjs-client';
import Stomp from 'stompjs';

class WebSocketService {
  constructor() {
    this.stompClient = null;
    this.connected = false;
    this.subscriptions = new Map();
    this.messageHandlers = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
  }

  connect(username) {
    return new Promise((resolve, reject) => {
      try {
        // Try different possible WebSocket endpoints
        const possibleEndpoints = [
          'http://localhost:8080/ws',
          'http://localhost:8080/chat',
          'http://localhost:8080/websocket'
        ];
        
        // Start with the first endpoint
        this.tryConnect(possibleEndpoints, 0, username, resolve, reject);
      } catch (error) {
        console.error('Failed to create WebSocket connection:', error);
        reject(error);
      }
    });
  }

  tryConnect(endpoints, index, username, resolve, reject) {
    if (index >= endpoints.length) {
      reject(new Error('All WebSocket endpoints failed'));
      return;
    }

    const endpoint = endpoints[index];
    console.log(`Trying WebSocket endpoint: ${endpoint}`);
    
    try {
      const socket = new SockJS(endpoint);
      this.stompClient = Stomp.over(socket);
      
      // Enable debug logging to see what's happening
      this.stompClient.debug = (str) => {
        console.log('STOMP Debug:', str);
      };

      // Try with different header configurations
      const connectHeaders = {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'username': username
      };

      this.stompClient.connect(
        connectHeaders,
        (frame) => {
          console.log('Connected to WebSocket:', frame);
          this.connected = true;
          this.reconnectAttempts = 0;
          
          // Subscribe to private messages for this user
          this.subscribeToPrivateMessages(username);
          
          resolve(frame);
        },
        (error) => {
          console.error(`WebSocket connection error on ${endpoint}:`, error);
          this.connected = false;
          
          // Try next endpoint
          this.tryConnect(endpoints, index + 1, username, resolve, reject);
        }
      );
    } catch (error) {
      console.error(`Failed to create connection to ${endpoint}:`, error);
      // Try next endpoint
      this.tryConnect(endpoints, index + 1, username, resolve, reject);
    }
  }

  subscribeToPrivateMessages(username) {
    if (!this.stompClient || !this.connected) {
      console.warn('Cannot subscribe: WebSocket not connected');
      return;
    }

    // Try different subscription patterns
    const subscriptionPaths = [
      `/user/${username}/private`,
      `/user/${username}/queue/private`,
      `/topic/private/${username}`,
      `/queue/private/${username}`
    ];

    subscriptionPaths.forEach((path, index) => {
      try {
        console.log(`Attempting to subscribe to: ${path}`);
        const subscription = this.stompClient.subscribe(
          path,
          (message) => {
            try {
              const messageData = JSON.parse(message.body);
              console.log('Received private message:', messageData);
              
              // Notify all registered message handlers
              this.messageHandlers.forEach((handler) => {
                try {
                  handler(messageData);
                } catch (error) {
                  console.error('Error in message handler:', error);
                }
              });
            } catch (error) {
              console.error('Error parsing received message:', error);
            }
          }
        );

        this.subscriptions.set(`private-${index}`, subscription);
        console.log(`Successfully subscribed to: ${path}`);
      } catch (error) {
        console.error(`Failed to subscribe to ${path}:`, error);
      }
    });
  }

  sendPrivateMessage(sender, receiver, message) {
    if (!this.stompClient || !this.connected) {
      console.error('Cannot send message: WebSocket not connected');
      throw new Error('WebSocket not connected');
    }

    // Try different message destinations
    const destinations = [
      '/app/sendPrivateMessage',
      '/app/private',
      '/app/chat/private'
    ];

    const messageData = {
      sender: sender,
      receiver: receiver,
      message: message,
      timestamp: new Date().toISOString()
    };

    let messageSent = false;
    
    for (const destination of destinations) {
      try {
        console.log(`Trying to send message to: ${destination}`);
        this.stompClient.send(destination, {}, JSON.stringify(messageData));
        console.log('Message sent successfully:', messageData);
        messageSent = true;
        break;
      } catch (error) {
        console.error(`Failed to send to ${destination}:`, error);
      }
    }

    if (!messageSent) {
      throw new Error('Failed to send message to any destination');
    }

    return messageData;
  }

  addMessageHandler(id, handler) {
    this.messageHandlers.set(id, handler);
  }

  removeMessageHandler(id) {
    this.messageHandlers.delete(id);
  }

  handleReconnect(username) {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      setTimeout(() => {
        this.connect(username).catch((error) => {
          console.error('Reconnection failed:', error);
        });
      }, this.reconnectDelay * this.reconnectAttempts);
    } else {
      console.error('Max reconnection attempts reached');
    }
  }

  disconnect() {
    if (this.stompClient && this.connected) {
      // Unsubscribe from all subscriptions
      this.subscriptions.forEach((subscription) => {
        try {
          subscription.unsubscribe();
        } catch (error) {
          console.error('Error unsubscribing:', error);
        }
      });
      this.subscriptions.clear();
      
      // Clear message handlers
      this.messageHandlers.clear();
      
      // Disconnect
      try {
        this.stompClient.disconnect(() => {
          console.log('Disconnected from WebSocket');
        });
      } catch (error) {
        console.error('Error disconnecting:', error);
      }
      
      this.connected = false;
      this.stompClient = null;
    }
  }

  isConnected() {
    return this.connected && this.stompClient && this.stompClient.connected;
  }
}

// Create a singleton instance
const webSocketService = new WebSocketService();
export default webSocketService;
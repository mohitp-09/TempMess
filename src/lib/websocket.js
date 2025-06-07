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
        // Use the exact endpoint from your working HTML example
        const socket = new SockJS('http://localhost:8080/chat');
        this.stompClient = Stomp.over(socket);
        
        // Enable debug logging to see what's happening
        this.stompClient.debug = (str) => {
          console.log('STOMP Debug:', str);
        };

        // Connect without headers first (like in your HTML example)
        this.stompClient.connect(
          {}, // Empty headers object like in your working example
          (frame) => {
            console.log('Connected to WebSocket as ' + username + ':', frame);
            this.connected = true;
            this.reconnectAttempts = 0;
            
            // Subscribe to private messages for this user
            this.subscribeToPrivateMessages(username);
            
            resolve(frame);
          },
          (error) => {
            console.error('WebSocket connection error:', error);
            this.connected = false;
            this.handleReconnect(username);
            reject(error);
          }
        );
      } catch (error) {
        console.error('Failed to create WebSocket connection:', error);
        reject(error);
      }
    });
  }

  subscribeToPrivateMessages(username) {
    if (!this.stompClient || !this.connected) {
      console.warn('Cannot subscribe: WebSocket not connected');
      return;
    }

    try {
      // Use the exact subscription pattern from your working HTML example
      const subscriptionPath = `/user/${username}/private`;
      console.log(`Subscribing to: ${subscriptionPath}`);
      
      const subscription = this.stompClient.subscribe(
        subscriptionPath,
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

      this.subscriptions.set('private', subscription);
      console.log(`Successfully subscribed to private messages for user: ${username}`);
    } catch (error) {
      console.error('Failed to subscribe to private messages:', error);
    }
  }

  sendPrivateMessage(sender, receiver, message) {
    if (!this.stompClient || !this.connected) {
      console.error('Cannot send message: WebSocket not connected');
      throw new Error('WebSocket not connected');
    }

    // Use the exact message format and destination from your working HTML example
    const messageData = {
      sender: sender,
      receiver: receiver,
      message: message
    };

    try {
      // Use the exact destination from your working HTML example
      this.stompClient.send('/app/sendPrivateMessage', {}, JSON.stringify(messageData));
      console.log('Message sent successfully:', messageData);
      return messageData;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
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
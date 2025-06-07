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
        // Use the same endpoint as your working HTML example
        const socket = new SockJS('http://localhost:8080/chat');
        this.stompClient = Stomp.over(socket);
        
        // Disable debug logging in production
        this.stompClient.debug = null;

        this.stompClient.connect(
          {}, // Empty headers object like in your HTML example
          (frame) => {
            console.log('Connected to WebSocket:', frame);
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

    // Use the exact same subscription path as your HTML example
    const subscription = this.stompClient.subscribe(
      `/user/${username}/private`,
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
    console.log(`Subscribed to private messages for user: ${username}`);
  }

  sendPrivateMessage(sender, receiver, message) {
    if (!this.stompClient || !this.connected) {
      console.error('Cannot send message: WebSocket not connected');
      throw new Error('WebSocket not connected');
    }

    // Use the exact same payload structure as your HTML example
    const messageData = {
      sender: sender,
      receiver: receiver,
      message: message
    };

    try {
      // Use the exact same destination as your HTML example
      this.stompClient.send('/app/sendPrivateMessage', {}, JSON.stringify(messageData));
      console.log('Message sent:', messageData);
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
        subscription.unsubscribe();
      });
      this.subscriptions.clear();
      
      // Clear message handlers
      this.messageHandlers.clear();
      
      // Disconnect
      this.stompClient.disconnect(() => {
        console.log('Disconnected from WebSocket');
      });
      
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
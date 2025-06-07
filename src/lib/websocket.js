import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';

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
        // Create SockJS connection
        const socket = new SockJS('http://localhost:8080/ws');
        
        // Create STOMP client
        this.stompClient = new Client({
          webSocketFactory: () => socket,
          connectHeaders: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'username': username
          },
          debug: (str) => {
            console.log('STOMP Debug:', str);
          },
          reconnectDelay: 5000,
          heartbeatIncoming: 4000,
          heartbeatOutgoing: 4000,
        });

        // Set up connection handlers
        this.stompClient.onConnect = (frame) => {
          console.log('Connected to WebSocket:', frame);
          this.connected = true;
          this.reconnectAttempts = 0;
          
          // Subscribe to private messages for this user
          this.subscribeToPrivateMessages(username);
          
          resolve(frame);
        };

        this.stompClient.onStompError = (frame) => {
          console.error('STOMP error:', frame);
          this.connected = false;
          reject(new Error('STOMP connection error'));
        };

        this.stompClient.onWebSocketError = (error) => {
          console.error('WebSocket error:', error);
          this.connected = false;
          this.handleReconnect(username);
          reject(error);
        };

        this.stompClient.onDisconnect = () => {
          console.log('Disconnected from WebSocket');
          this.connected = false;
        };

        // Activate the client
        this.stompClient.activate();
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

    const messageData = {
      sender: sender,
      receiver: receiver,
      message: message,
      timestamp: new Date().toISOString()
    };

    try {
      this.stompClient.publish({
        destination: '/app/sendPrivateMessage',
        body: JSON.stringify(messageData)
      });
      
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
      
      // Deactivate the client
      this.stompClient.deactivate();
      
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
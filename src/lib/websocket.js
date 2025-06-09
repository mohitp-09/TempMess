import SockJS from 'sockjs-client';
import Stomp from 'stompjs';

class WebSocketService {
  constructor() {
    this.stompClient = null;
    this.connected = false;
    this.messageHandlers = new Map();
    this.readReceiptHandlers = new Map();
    this.currentUsername = null;
  }

  connect(username) {
    return new Promise((resolve, reject) => {
      try {
        console.log('🔌 Connecting WebSocket for user:', username);
        this.currentUsername = username;
        
        // Use exact same setup as your working HTML
        const socket = new SockJS('http://localhost:8080/chat');
        this.stompClient = Stomp.over(socket);
        
        // Disable debug to reduce noise
        this.stompClient.debug = null;

        // Connect with empty headers (exactly like your HTML)
        this.stompClient.connect({}, 
          (frame) => {
            console.log('✅ Connected as', username);
            this.connected = true;
            
            // Subscribe to private messages immediately
            this.subscribeToPrivateMessages(username);
            
            // Subscribe to read receipts
            this.subscribeToReadReceipts(username);
            
            resolve(frame);
          },
          (error) => {
            console.error('❌ Connection failed:', error);
            this.connected = false;
            reject(error);
          }
        );
      } catch (error) {
        console.error('❌ Failed to create connection:', error);
        reject(error);
      }
    });
  }

  subscribeToPrivateMessages(username) {
    if (!this.stompClient || !this.connected) {
      console.warn('⚠️ Cannot subscribe: not connected');
      return;
    }

    try {
      const destination = `/user/${username}/private`;
      console.log('📡 Subscribing to:', destination);
      
      this.stompClient.subscribe(destination, (message) => {
        try {
          const messageData = JSON.parse(message.body);
          console.log('📨 Received message:', messageData);
          
          // Notify all handlers
          this.messageHandlers.forEach((handler) => {
            handler(messageData);
          });
        } catch (error) {
          console.error('❌ Error parsing message:', error);
        }
      });
      
      console.log('✅ Subscribed to private messages');
    } catch (error) {
      console.error('❌ Subscription failed:', error);
    }
  }

  subscribeToReadReceipts(username) {
    if (!this.stompClient || !this.connected) {
      console.warn('⚠️ Cannot subscribe to read receipts: not connected');
      return;
    }

    try {
      const destination = `/user/${username}/private/read-receipts`;
      console.log('📡 Subscribing to read receipts:', destination);
      
      this.stompClient.subscribe(destination, (message) => {
        try {
          const readReceiptData = JSON.parse(message.body);
          console.log('📨 Received read receipt:', readReceiptData);
          
          // Notify all read receipt handlers
          this.readReceiptHandlers.forEach((handler) => {
            handler(readReceiptData);
          });
        } catch (error) {
          console.error('❌ Error parsing read receipt:', error);
        }
      });
      
      console.log('✅ Subscribed to read receipts');
    } catch (error) {
      console.error('❌ Read receipt subscription failed:', error);
    }
  }

  sendPrivateMessage(sender, receiver, message) {
    if (!this.stompClient || !this.connected) {
      throw new Error('Not connected to WebSocket');
    }

    const payload = {
      sender: sender,
      receiver: receiver,
      message: message
    };

    console.log('📤 Sending:', payload);
    this.stompClient.send('/app/sendPrivateMessage', {}, JSON.stringify(payload));
    console.log('✅ Message sent');
  }

  markAsRead(messageId) {
    if (!this.stompClient || !this.connected) {
      throw new Error('Not connected to WebSocket');
    }

    const payload = {
      messageId: messageId
    };

    console.log('📤 Marking as read:', payload);
    this.stompClient.send('/app/markAsRead', {}, JSON.stringify(payload));
    console.log('✅ Read receipt sent');
  }

  addMessageHandler(id, handler) {
    this.messageHandlers.set(id, handler);
  }

  removeMessageHandler(id) {
    this.messageHandlers.delete(id);
  }

  addReadReceiptHandler(id, handler) {
    this.readReceiptHandlers.set(id, handler);
  }

  removeReadReceiptHandler(id) {
    this.readReceiptHandlers.delete(id);
  }

  disconnect() {
    if (this.stompClient && this.connected) {
      this.stompClient.disconnect();
      this.connected = false;
      this.stompClient = null;
      console.log('🔌 Disconnected');
    }
  }

  isConnected() {
    return this.connected && this.stompClient && this.stompClient.connected;
  }
}

const webSocketService = new WebSocketService();
export default webSocketService;
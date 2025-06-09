import SockJS from 'sockjs-client';
import Stomp from 'stompjs';
import encryptionService from './encryption';

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

  async sendPrivateMessage(sender, receiver, message) {
    if (!this.stompClient || !this.connected) {
      throw new Error('Not connected to WebSocket');
    }

    try {
      console.log('🔐 Attempting to encrypt message before sending...');
      
      // Try to encrypt the message
      const encryptedMessage = await encryptionService.encryptMessage(message, receiver);
      
      let payload;
      
      if (encryptedMessage) {
        // Send encrypted message
        payload = {
          sender: sender,
          receiver: receiver,
          message: encryptedMessage, // This is the encrypted JSON string
          isEncrypted: true
        };
        console.log('📤 Sending encrypted message');
      } else {
        // Fallback: send unencrypted if encryption fails
        console.warn('⚠️ Encryption failed, sending unencrypted message');
        payload = {
          sender: sender,
          receiver: receiver,
          message: message,
          isEncrypted: false
        };
      }

      this.stompClient.send('/app/sendPrivateMessage', {}, JSON.stringify(payload));
      console.log('✅ Message sent to backend');
    } catch (error) {
      console.error('❌ Failed to send message:', error);
      throw error;
    }
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
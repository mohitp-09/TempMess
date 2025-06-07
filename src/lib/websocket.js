import SockJS from 'sockjs-client';
import Stomp from 'stompjs';

class WebSocketService {
  constructor() {
    this.stompClient = null;
    this.connected = false;
    this.messageHandlers = new Map();
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

  addMessageHandler(id, handler) {
    this.messageHandlers.set(id, handler);
  }

  removeMessageHandler(id) {
    this.messageHandlers.delete(id);
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
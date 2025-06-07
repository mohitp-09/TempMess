import { create } from "zustand";
import webSocketService from "../lib/websocket";
import { getCurrentUserFromToken } from "../lib/jwtUtils";

const useChatStore = create((set, get) => ({
  // State
  messages: {},
  selectedUser: null,
  isConnected: false,
  isLoading: false,
  currentUser: null,

  // Initialize WebSocket connection
  initializeWebSocket: async () => {
    console.log('🚀 Initializing WebSocket connection...');
    
    const currentUser = getCurrentUserFromToken();
    if (!currentUser || !currentUser.username) {
      console.error('❌ No current user found for WebSocket connection');
      console.log('Current user data:', currentUser);
      return false;
    }

    console.log('👤 Current user for WebSocket:', currentUser.username);

    try {
      set({ currentUser, isLoading: true });
      
      // Connect to WebSocket
      console.log('🔌 Connecting to WebSocket...');
      await webSocketService.connect(currentUser.username);
      
      // Add message handler for incoming messages
      webSocketService.addMessageHandler('chatStore', (messageData) => {
        console.log('📨 Chat store received message:', messageData);
        get().handleIncomingMessage(messageData);
      });
      
      set({ isConnected: true, isLoading: false });
      console.log('✅ WebSocket initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize WebSocket:', error);
      set({ isConnected: false, isLoading: false });
      return false;
    }
  },

  // Disconnect WebSocket
  disconnectWebSocket: () => {
    console.log('🔌 Disconnecting WebSocket...');
    webSocketService.removeMessageHandler('chatStore');
    webSocketService.disconnect();
    set({ isConnected: false });
  },

  // Select a user to chat with (no chat history loading)
  selectUser: async (user) => {
    console.log('👥 Selecting user for chat:', user.username);
    
    const { currentUser } = get();
    if (!currentUser) {
      console.error('❌ No current user available');
      return;
    }

    set({ selectedUser: user });
    
    // Initialize empty message array for this user if it doesn't exist
    set((state) => ({
      messages: {
        ...state.messages,
        [user.username]: state.messages[user.username] || []
      }
    }));
    
    console.log('✅ User selected for chat:', user.username);
  },

  // Send a message
  sendMessage: async (text, image = null) => {
    const { selectedUser, currentUser } = get();
    
    console.log('📤 Attempting to send message...');
    console.log('Selected user:', selectedUser?.username);
    console.log('Current user:', currentUser?.username);
    console.log('Message text:', text);
    
    if (!selectedUser || !currentUser) {
      console.error('❌ No user selected or current user not available');
      return false;
    }

    if (!webSocketService.isConnected()) {
      console.error('❌ WebSocket not connected');
      return false;
    }

    try {
      // Create message object
      const messageData = {
        _id: `temp-${Date.now()}`,
        senderId: currentUser.username,
        receiverId: selectedUser.username,
        text: text,
        image: image,
        createdAt: new Date().toISOString(),
        isTemp: true // Mark as temporary until confirmed
      };

      console.log('💾 Adding message to local state:', messageData);

      // Add message to local state immediately (optimistic update)
      set((state) => ({
        messages: {
          ...state.messages,
          [selectedUser.username]: [
            ...(state.messages[selectedUser.username] || []),
            messageData
          ]
        }
      }));

      console.log('📡 Sending via WebSocket...');
      // Send via WebSocket
      await webSocketService.sendPrivateMessage(
        currentUser.username,
        selectedUser.username,
        text
      );

      console.log('✅ Message sent successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to send message:', error);
      
      // Remove the temporary message on error
      set((state) => ({
        messages: {
          ...state.messages,
          [selectedUser.username]: (state.messages[selectedUser.username] || []).filter(
            msg => !msg.isTemp || msg._id !== `temp-${Date.now()}`
          )
        }
      }));
      
      return false;
    }
  },

  // Handle incoming messages from WebSocket
  handleIncomingMessage: (messageData) => {
    console.log('📨 Handling incoming message:', messageData);
    
    const { currentUser } = get();
    if (!currentUser) {
      console.error('❌ No current user to handle incoming message');
      return;
    }

    // Determine which user this message is from/to
    const otherUser = messageData.sender === currentUser.username 
      ? messageData.receiver 
      : messageData.sender;

    console.log('👤 Message is from/to user:', otherUser);

    // Transform message to match our format
    const formattedMessage = {
      _id: `ws-${Date.now()}-${Math.random()}`,
      senderId: messageData.sender,
      receiverId: messageData.receiver,
      text: messageData.message,
      createdAt: messageData.timestamp || new Date().toISOString()
    };

    console.log('🔄 Formatted message:', formattedMessage);

    // Add message to the appropriate conversation
    set((state) => {
      const existingMessages = state.messages[otherUser] || [];
      
      // Check if this message already exists (avoid duplicates)
      const messageExists = existingMessages.some(msg => 
        msg.text === formattedMessage.text && 
        msg.senderId === formattedMessage.senderId &&
        Math.abs(new Date(msg.createdAt).getTime() - new Date(formattedMessage.createdAt).getTime()) < 5000
      );

      if (messageExists) {
        console.log('⚠️ Duplicate message detected, skipping');
        return state; // Don't add duplicate
      }

      console.log('💾 Adding message to conversation with:', otherUser);
      return {
        messages: {
          ...state.messages,
          [otherUser]: [...existingMessages, formattedMessage]
        }
      };
    });
  },

  // Get messages for a specific user
  getMessagesForUser: (username) => {
    const { messages } = get();
    return messages[username] || [];
  },

  // Clear all messages
  clearMessages: () => {
    set({ messages: {} });
  },

  // Get last message for a user (for sidebar preview)
  getLastMessageForUser: (username) => {
    const messages = get().getMessagesForUser(username);
    return messages.length > 0 ? messages[messages.length - 1] : null;
  },

  // Get unread count for a user (placeholder for future implementation)
  getUnreadCountForUser: (username) => {
    // TODO: Implement unread message tracking
    return 0;
  }
}));

export { useChatStore };
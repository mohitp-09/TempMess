import { create } from "zustand";
import webSocketService from "../lib/websocket";
import { getCurrentUserFromToken } from "../lib/jwtUtils";
import { getOldChatMessages } from "../lib/api";

const useChatStore = create((set, get) => ({
  // State
  messages: {},
  messageStatuses: {}, // Track message statuses by message ID
  userStatuses: {}, // Track online/offline status of users
  selectedUser: null,
  isConnected: false,
  isLoading: false,
  currentUser: null,
  loadingOldMessages: {},

  // Initialize WebSocket
  initializeWebSocket: async () => {
    const currentUser = getCurrentUserFromToken();
    if (!currentUser?.username) {
      console.error('❌ No username found');
      return false;
    }

    try {
      set({ currentUser, isLoading: true });
      
      await webSocketService.connect(currentUser.username);
      
      webSocketService.addMessageHandler('chatStore', (messageData) => {
        get().handleIncomingMessage(messageData);
      });

      webSocketService.addReadReceiptHandler('chatStore', (readReceiptData) => {
        get().handleReadReceipt(readReceiptData);
      });

      webSocketService.addStatusHandler('chatStore', (statusData) => {
        get().handleStatusUpdate(statusData);
      });
      
      set({ isConnected: true, isLoading: false });
      console.log('✅ WebSocket ready');
      
      // Send online status
      webSocketService.updateUserStatus('online');
      
      return true;
    } catch (error) {
      console.error('❌ WebSocket failed:', error);
      set({ isConnected: false, isLoading: false });
      return false;
    }
  },

  // Disconnect
  disconnectWebSocket: () => {
    webSocketService.removeMessageHandler('chatStore');
    webSocketService.removeReadReceiptHandler('chatStore');
    webSocketService.removeStatusHandler('chatStore');
    webSocketService.disconnect();
    set({ isConnected: false });
  },

  // Handle status updates
  handleStatusUpdate: (statusData) => {
    console.log('📊 Processing status update:', statusData);
    
    set((state) => ({
      userStatuses: {
        ...state.userStatuses,
        [statusData.username]: {
          status: statusData.status,
          lastSeen: statusData.timestamp,
          isOnline: statusData.status === 'online'
        }
      }
    }));
  },

  // Get user online status
  getUserStatus: (username) => {
    const { userStatuses } = get();
    return userStatuses[username] || { isOnline: false, status: 'offline' };
  },

  // Update user status in friends list and selected user
  updateUserInLists: (username, statusUpdate) => {
    // This will be used by components to update their local state
    // when they receive status updates
  },

  // Load old messages for a user
  loadOldMessages: async (username) => {
    const { loadingOldMessages } = get();
    
    // Prevent multiple simultaneous loads for the same user
    if (loadingOldMessages[username]) {
      return;
    }

    set((state) => ({
      loadingOldMessages: {
        ...state.loadingOldMessages,
        [username]: true
      }
    }));

    try {
      console.log('🔄 Loading old messages for:', username);
      const oldMessages = await getOldChatMessages(username);
      
      console.log('📥 Loaded old messages:', oldMessages.length);
      
      // Sort messages by timestamp (oldest first)
      const sortedMessages = oldMessages.sort((a, b) => 
        new Date(a.createdAt) - new Date(b.createdAt)
      );

      set((state) => ({
        messages: {
          ...state.messages,
          [username]: sortedMessages
        },
        loadingOldMessages: {
          ...state.loadingOldMessages,
          [username]: false
        }
      }));

      return sortedMessages;
    } catch (error) {
      console.error('❌ Failed to load old messages:', error);
      
      set((state) => ({
        loadingOldMessages: {
          ...state.loadingOldMessages,
          [username]: false
        }
      }));
      
      return [];
    }
  },

  // Select user and load their old messages
  selectUser: async (user) => {
    set({ selectedUser: user });
    
    // Check if we already have messages for this user
    const { messages } = get();
    if (!messages[user.username] || messages[user.username].length === 0) {
      // Load old messages if we don't have any
      await get().loadOldMessages(user.username);
    }

    // Mark all messages from this user as read
    get().markConversationAsRead(user.username);
  },

  // Send message
  sendMessage: async (text, image = null) => {
    const { selectedUser, currentUser } = get();
    
    if (!selectedUser || !currentUser || !text.trim()) {
      return false;
    }

    if (!webSocketService.isConnected()) {
      console.error('❌ Not connected');
      return false;
    }

    try {
      // Generate a unique message ID
      const messageId = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Add to local state immediately with SENT status
      const tempMessage = {
        _id: messageId,
        senderId: currentUser.username,
        receiverId: selectedUser.username,
        text: text,
        createdAt: new Date().toISOString(),
        isTemp: true,
        status: 'SENT'
      };

      set((state) => ({
        messages: {
          ...state.messages,
          [selectedUser.username]: [
            ...(state.messages[selectedUser.username] || []),
            tempMessage
          ]
        },
        messageStatuses: {
          ...state.messageStatuses,
          [messageId]: 'SENT'
        }
      }));

      // Send via WebSocket
      webSocketService.sendPrivateMessage(
        currentUser.username,
        selectedUser.username,
        text
      );

      // Simulate delivery status after a short delay
      setTimeout(() => {
        set((state) => ({
          messageStatuses: {
            ...state.messageStatuses,
            [messageId]: 'DELIVERED'
          }
        }));
      }, 1000);

      return true;
    } catch (error) {
      console.error('❌ Send failed:', error);
      return false;
    }
  },

  // Handle incoming messages
  handleIncomingMessage: (messageData) => {
    const { currentUser } = get();
    if (!currentUser) return;

    const otherUser = messageData.sender === currentUser.username 
      ? messageData.receiver 
      : messageData.sender;

    const formattedMessage = {
      _id: messageData.messageId || `ws-${Date.now()}-${Math.random()}`,
      senderId: messageData.sender,
      receiverId: messageData.receiver,
      text: messageData.message,
      createdAt: messageData.timestamp || new Date().toISOString(),
      status: 'DELIVERED'
    };

    set((state) => {
      const existing = state.messages[otherUser] || [];
      
      // Remove any temp messages with same content
      const filtered = existing.filter(msg => 
        !(msg.isTemp && msg.text === formattedMessage.text && msg.senderId === formattedMessage.senderId)
      );

      return {
        messages: {
          ...state.messages,
          [otherUser]: [...filtered, formattedMessage]
        },
        messageStatuses: {
          ...state.messageStatuses,
          [formattedMessage._id]: 'DELIVERED'
        }
      };
    });

    // If this is a message from someone else and we're currently chatting with them, mark as read
    const { selectedUser } = get();
    if (messageData.sender !== currentUser.username && selectedUser?.username === messageData.sender) {
      setTimeout(() => {
        get().markMessageAsRead(formattedMessage._id);
      }, 500); // Small delay to simulate reading
    }
  },

  // Handle read receipts
  handleReadReceipt: (readReceiptData) => {
    console.log('📨 Processing read receipt:', readReceiptData);
    
    set((state) => ({
      messageStatuses: {
        ...state.messageStatuses,
        [readReceiptData.messageId]: 'READ'
      }
    }));

    // Update the message status in the messages array as well
    const { messages } = get();
    Object.keys(messages).forEach(username => {
      const userMessages = messages[username];
      const messageIndex = userMessages.findIndex(msg => msg._id === readReceiptData.messageId);
      
      if (messageIndex !== -1) {
        set((state) => ({
          messages: {
            ...state.messages,
            [username]: state.messages[username].map(msg => 
              msg._id === readReceiptData.messageId 
                ? { ...msg, status: 'READ' }
                : msg
            )
          }
        }));
      }
    });
  },

  // Mark a specific message as read
  markMessageAsRead: (messageId) => {
    if (!webSocketService.isConnected()) {
      console.error('❌ Cannot mark as read: not connected');
      return;
    }

    try {
      webSocketService.markAsRead(messageId);
      
      // Update local status immediately
      set((state) => ({
        messageStatuses: {
          ...state.messageStatuses,
          [messageId]: 'READ'
        }
      }));
    } catch (error) {
      console.error('❌ Failed to mark message as read:', error);
    }
  },

  // Mark entire conversation as read
  markConversationAsRead: (username) => {
    const { messages, currentUser } = get();
    const userMessages = messages[username] || [];
    
    // Find all unread messages from the other user
    const unreadMessages = userMessages.filter(msg => 
      msg.senderId !== currentUser?.username && 
      (!msg.status || msg.status !== 'read')
    );

    // Mark each unread message as read
    unreadMessages.forEach(msg => {
      if (msg._id && !msg.isTemp) {
        get().markMessageAsRead(msg._id);
      }
    });
  },

  // Get messages for user
  getMessagesForUser: (username) => {
    const { messages } = get();
    return messages[username] || [];
  },

  // Get last message
  getLastMessageForUser: (username) => {
    const messages = get().getMessagesForUser(username);
    return messages.length > 0 ? messages[messages.length - 1] : null;
  },

  // Get unread count
  getUnreadCountForUser: (username) => {
    const { messages, currentUser } = get();
    const userMessages = messages[username] || [];
    
    return userMessages.filter(msg => 
      msg.senderId !== currentUser?.username && 
      (!msg.status || msg.status !== 'read')
    ).length;
  },

  // Get message status
  getMessageStatus: (messageId) => {
    const { messageStatuses } = get();
    return messageStatuses[messageId] || 'SENT';
  },

  // Check if old messages are loading
  isLoadingOldMessages: (username) => {
    const { loadingOldMessages } = get();
    return loadingOldMessages[username] || false;
  }
}));

export { useChatStore };
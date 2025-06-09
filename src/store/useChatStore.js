import { create } from "zustand";
import webSocketService from "../lib/websocket";
import { getCurrentUserFromToken } from "../lib/jwtUtils";
import { getOldChatMessages, getUserPublicKey, storeUserPublicKey } from "../lib/api";
import encryptionService from "../lib/encryption";

const useChatStore = create((set, get) => ({
  // State
  messages: {},
  messageStatuses: {}, // Track message statuses by message ID
  selectedUser: null,
  isConnected: false,
  isLoading: false,
  currentUser: null,
  loadingOldMessages: {},

  // Initialize WebSocket and encryption
  initializeWebSocket: async () => {
    const currentUser = getCurrentUserFromToken();
    if (!currentUser?.username) {
      console.error('❌ No username found');
      return false;
    }

    try {
      set({ currentUser, isLoading: true });
      
      // Initialize encryption service
      console.log('🔐 Initializing encryption...');
      await encryptionService.initialize();
      
      // Store user's public key on server
      try {
        const publicKeyJwk = await encryptionService.getPublicKeyJwk();
        await storeUserPublicKey(publicKeyJwk);
        console.log('🔐 Public key stored on server');
      } catch (error) {
        console.warn('⚠️ Failed to store public key on server:', error);
      }
      
      await webSocketService.connect(currentUser.username);
      
      webSocketService.addMessageHandler('chatStore', (messageData) => {
        get().handleIncomingMessage(messageData);
      });

      webSocketService.addReadReceiptHandler('chatStore', (readReceiptData) => {
        get().handleReadReceipt(readReceiptData);
      });
      
      set({ isConnected: true, isLoading: false });
      console.log('✅ WebSocket and encryption ready');
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
    webSocketService.disconnect();
    set({ isConnected: false });
  },

  // Helper function to check if a message is encrypted
  isMessageEncrypted: (messageText) => {
    if (!messageText || typeof messageText !== 'string') return false;
    
    try {
      const parsed = JSON.parse(messageText);
      return parsed && 
             typeof parsed === 'object' && 
             parsed.encryptedMessage && 
             parsed.encryptedKey && 
             parsed.iv;
    } catch (error) {
      return false;
    }
  },

  // Load old messages for a user and decrypt them
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
      
      // Decrypt messages if they are encrypted
      const decryptedMessages = await Promise.all(
        oldMessages.map(async (msg) => {
          if (msg.text && get().isMessageEncrypted(msg.text)) {
            try {
              console.log('🔓 Attempting to decrypt message...');
              const encryptedData = JSON.parse(msg.text);
              const decryptedText = await encryptionService.decryptMessage(encryptedData);
              console.log('✅ Message decrypted successfully');
              return {
                ...msg,
                text: decryptedText,
                isEncrypted: false // Mark as decrypted
              };
            } catch (error) {
              console.warn('⚠️ Failed to decrypt message:', error);
              // Return original message if decryption fails
              return {
                ...msg,
                text: '[Message could not be decrypted]'
              };
            }
          }
          // Return message as-is if not encrypted
          return msg;
        })
      );

      // Sort messages by timestamp (oldest first)
      const sortedMessages = decryptedMessages.sort((a, b) => 
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
    
    // Try to get user's public key for encryption
    try {
      const publicKey = await getUserPublicKey(user.username);
      if (publicKey) {
        encryptionService.storeContactPublicKey(user.username, publicKey);
        console.log(`🔐 Stored public key for ${user.username}`);
      }
    } catch (error) {
      console.warn(`⚠️ Failed to get public key for ${user.username}:`, error);
    }
    
    // Check if we already have messages for this user
    const { messages } = get();
    if (!messages[user.username] || messages[user.username].length === 0) {
      // Load old messages if we don't have any
      await get().loadOldMessages(user.username);
    }

    // Mark all messages from this user as read
    get().markConversationAsRead(user.username);
  },

  // Send message (will be encrypted if possible)
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

      // Add to local state immediately with SENT status (unencrypted for display)
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

      // Send via WebSocket (will be encrypted in websocket service if possible)
      await webSocketService.sendPrivateMessage(
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

  // Handle incoming messages (decrypt them if needed)
  handleIncomingMessage: async (messageData) => {
    const { currentUser } = get();
    if (!currentUser) return;

    const otherUser = messageData.sender === currentUser.username 
      ? messageData.receiver 
      : messageData.sender;

    let decryptedText = messageData.message;

    // Check if message is encrypted and decrypt it
    if (messageData.message && get().isMessageEncrypted(messageData.message)) {
      try {
        console.log('🔓 Attempting to decrypt incoming message...');
        const encryptedData = JSON.parse(messageData.message);
        decryptedText = await encryptionService.decryptMessage(encryptedData);
        console.log('✅ Incoming message decrypted successfully');
      } catch (error) {
        console.error('❌ Failed to decrypt incoming message:', error);
        decryptedText = '[Message could not be decrypted]';
      }
    }

    const formattedMessage = {
      _id: messageData.messageId || `ws-${Date.now()}-${Math.random()}`,
      senderId: messageData.sender,
      receiverId: messageData.receiver,
      text: decryptedText,
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
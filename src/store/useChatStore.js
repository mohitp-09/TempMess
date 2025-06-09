import { create } from "zustand";
import webSocketService from "../lib/websocket";
import { getCurrentUserFromToken } from "../lib/jwtUtils";
import { getOldChatMessages } from "../lib/api";
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

  // Load old messages for a user and decrypt them - IMPROVED DECRYPTION LOGIC
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
      console.log('📥 Sample message structure:', oldMessages[0]);
      
      // Decrypt messages if they are encrypted - IMPROVED LOGIC FOR API RESPONSE
      const decryptedMessages = await Promise.all(
        oldMessages.map(async (msg, index) => {
          // Check if message text exists and is potentially encrypted
          if (!msg.text || typeof msg.text !== 'string') {
            console.warn(`⚠️ Message ${index} has no text or invalid text format`);
            return {
              ...msg,
              text: '[Empty message]'
            };
          }

          console.log(`🔍 Processing message ${index}:`, msg.text.substring(0, 100) + '...');

          // Check if it's an encrypted message (JSON format)
          if (encryptionService.isEncryptedMessage(msg.text)) {
            try {
              console.log(`🔓 Attempting to decrypt old message ${index}...`);
              const decryptedText = await encryptionService.decryptMessage(msg.text);
              
              // Check if decryption actually succeeded
              if (decryptedText && !decryptedText.startsWith('[') && !decryptedText.includes('could not be decrypted')) {
                console.log(`✅ Old message ${index} decrypted successfully:`, decryptedText.substring(0, 50) + '...');
                return {
                  ...msg,
                  text: decryptedText,
                  isEncrypted: true // Mark as originally encrypted
                };
              } else {
                console.warn(`⚠️ Decryption returned error message for ${index}:`, decryptedText);
                return {
                  ...msg,
                  text: decryptedText || '[Message could not be decrypted]',
                  isEncrypted: true,
                  decryptionFailed: true
                };
              }
            } catch (error) {
              console.warn(`⚠️ Failed to decrypt old message ${index}:`, error);
              // Return with error message if decryption fails
              return {
                ...msg,
                text: '[Message could not be decrypted]',
                isEncrypted: true,
                decryptionFailed: true
              };
            }
          }
          
          // Return message as-is if not encrypted
          console.log(`📝 Message ${index} is not encrypted, keeping as plain text`);
          return {
            ...msg,
            isEncrypted: false
          };
        })
      );

      // Sort messages by timestamp (oldest first)
      const sortedMessages = decryptedMessages.sort((a, b) => 
        new Date(a.createdAt) - new Date(b.createdAt)
      );

      console.log(`📋 Processed ${sortedMessages.length} messages for ${username}`);
      console.log('📋 Sample processed message:', sortedMessages[0]);

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

  // Select user and set up encryption
  selectUser: async (user) => {
    set({ selectedUser: user });
    
    // Ensure encryption is ready for this user
    console.log(`🔐 Setting up encryption for ${user.username}...`);
    
    // Check if we already have messages for this user
    const { messages } = get();
    if (!messages[user.username] || messages[user.username].length === 0) {
      // Load old messages if we don't have any
      await get().loadOldMessages(user.username);
    }

    // Mark all messages from this user as read
    get().markConversationAsRead(user.username);
  },

  // Send message (will be encrypted automatically)
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
        text: text, // Store unencrypted for local display
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

      // Send via WebSocket (will be encrypted automatically in websocket service)
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

  // Handle incoming messages (decrypt them if needed) - IMPROVED DECRYPTION
  handleIncomingMessage: async (messageData) => {
    const { currentUser } = get();
    if (!currentUser) return;

    const otherUser = messageData.sender === currentUser.username 
      ? messageData.receiver 
      : messageData.sender;

    let decryptedText = messageData.message;
    let isEncrypted = false;

    // Check if message is encrypted and decrypt it
    if (messageData.message && encryptionService.isEncryptedMessage(messageData.message)) {
      try {
        console.log('🔓 Attempting to decrypt incoming message...');
        decryptedText = await encryptionService.decryptMessage(messageData.message);
        
        // Check if decryption actually succeeded
        if (decryptedText && !decryptedText.startsWith('[') && !decryptedText.includes('could not be decrypted')) {
          isEncrypted = true;
          console.log('✅ Incoming message decrypted successfully');
        } else {
          console.error('❌ Decryption returned error:', decryptedText);
          decryptedText = '[Message could not be decrypted]';
          isEncrypted = true;
        }
      } catch (error) {
        console.error('❌ Failed to decrypt incoming message:', error);
        decryptedText = '[Message could not be decrypted]';
        isEncrypted = true;
      }
    }

    const formattedMessage = {
      _id: messageData.messageId || `ws-${Date.now()}-${Math.random()}`,
      senderId: messageData.sender,
      receiverId: messageData.receiver,
      text: decryptedText,
      createdAt: messageData.timestamp || new Date().toISOString(),
      status: 'DELIVERED',
      isEncrypted: isEncrypted
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
                ? { ...msg, status: 'read' }
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
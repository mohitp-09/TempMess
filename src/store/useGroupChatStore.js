import { create } from "zustand";
import groupWebSocketService from "../lib/groupWebSocket";
import { getCurrentUserFromToken } from "../lib/jwtUtils";
import { getUserGroups, getGroupMessages, getGroupMembers } from "../lib/groupApi";

const useGroupChatStore = create((set, get) => ({
  // State
  groupMessages: {},
  groups: [],
  groupMembers: {},
  selectedGroup: null,
  isConnected: false,
  isLoading: false,
  currentUser: null,
  loadingOldMessages: {},

  // Initialize Group WebSocket
  initializeGroupWebSocket: async () => {
    const currentUser = getCurrentUserFromToken();
    if (!currentUser?.username) {
      console.error('❌ No username found for group chat');
      return false;
    }

    try {
      set({ currentUser, isLoading: true });
      
      await groupWebSocketService.connect(currentUser.username);
      
      groupWebSocketService.addMessageHandler('groupChatStore', (messageData, groupId) => {
        get().handleIncomingGroupMessage(messageData, groupId);
      });
      
      set({ isConnected: true, isLoading: false });
      console.log('✅ Group WebSocket ready');
      
      // Load user's groups
      try {
        await get().loadUserGroups();
      } catch (error) {
        console.warn('⚠️ Failed to load groups:', error.message);
      }
      
      return true;
    } catch (error) {
      console.error('❌ Group WebSocket failed:', error);
      set({ isConnected: false, isLoading: false });
      return false;
    }
  },

  // Disconnect
  disconnectGroupWebSocket: () => {
    groupWebSocketService.removeMessageHandler('groupChatStore');
    groupWebSocketService.disconnect();
    set({ isConnected: false });
  },

  // Load user's groups - UPDATED TO USE CORRECT ENDPOINT
  loadUserGroups: async () => {
    try {
      console.log('🔄 Loading user groups...');
      const userGroups = await getUserGroups();
      console.log('📥 Loaded groups:', userGroups);
      
      // Ensure userGroups is an array
      const groupsArray = Array.isArray(userGroups) ? userGroups : [];
      
      set({ groups: groupsArray });
      
      // Subscribe to all groups
      groupsArray.forEach(group => {
        if (group.id) {
          groupWebSocketService.subscribeToGroup(group.id);
        }
      });
      
      return groupsArray;
    } catch (error) {
      console.error('❌ Failed to load user groups:', error);
      
      // Set empty array on error
      set({ groups: [] });
      return [];
    }
  },

  // Load group members - NEW FUNCTION
  loadGroupMembers: async (groupId) => {
    try {
      console.log('🔄 Loading group members for:', groupId);
      const members = await getGroupMembers(groupId);
      console.log('📥 Loaded group members:', members);
      
      set((state) => ({
        groupMembers: {
          ...state.groupMembers,
          [groupId]: members
        }
      }));
      
      return members;
    } catch (error) {
      console.error('❌ Failed to load group members:', error);
      return [];
    }
  },

  // Load old messages for a group
  loadOldGroupMessages: async (groupId) => {
    const { loadingOldMessages } = get();
    
    // Prevent multiple simultaneous loads for the same group
    if (loadingOldMessages[groupId]) {
      return;
    }

    set((state) => ({
      loadingOldMessages: {
        ...state.loadingOldMessages,
        [groupId]: true
      }
    }));

    try {
      console.log('🔄 Loading old group messages for:', groupId);
      const oldMessages = await getGroupMessages(groupId);
      
      console.log('📥 Loaded old group messages:', oldMessages.length);
      
      // Transform and sort messages by timestamp (oldest first)
      const transformedMessages = Array.isArray(oldMessages) ? oldMessages.map((msg, index) => ({
        _id: `group-old-${groupId}-${index}-${Date.now()}`,
        senderId: msg.sender || 'System',
        senderName: msg.senderName || msg.sender,
        text: msg.message,
        image: msg.mediaUrl || null,
        createdAt: msg.timestamp || new Date().toISOString(),
        isOld: true,
        groupId: groupId
      })) : [];

      const sortedMessages = transformedMessages.sort((a, b) => 
        new Date(a.createdAt) - new Date(b.createdAt)
      );

      set((state) => ({
        groupMessages: {
          ...state.groupMessages,
          [groupId]: sortedMessages
        },
        loadingOldMessages: {
          ...state.loadingOldMessages,
          [groupId]: false
        }
      }));

      return sortedMessages;
    } catch (error) {
      console.error('❌ Failed to load old group messages:', error);
      
      set((state) => ({
        loadingOldMessages: {
          ...state.loadingOldMessages,
          [groupId]: false
        }
      }));
      
      return [];
    }
  },

  // Select group and load their old messages and members
  selectGroup: async (group) => {
    set({ selectedGroup: group });
    
    // Subscribe to this group if not already subscribed
    if (group.id) {
      groupWebSocketService.subscribeToGroup(group.id);
    }
    
    // Load group members
    await get().loadGroupMembers(group.id);
    
    // Check if we already have messages for this group
    const { groupMessages } = get();
    if (!groupMessages[group.id] || groupMessages[group.id].length === 0) {
      // Load old messages if we don't have any
      await get().loadOldGroupMessages(group.id);
    }
  },

  // Send group message
  sendGroupMessage: async (groupId, text, image = null) => {
    const { currentUser } = get();
    
    if (!currentUser || !text.trim()) {
      return false;
    }

    if (!groupWebSocketService.isConnected()) {
      console.error('❌ Group WebSocket not connected');
      return false;
    }

    try {
      // Add to local state immediately
      const tempMessage = {
        _id: `temp-group-${Date.now()}`,
        senderId: currentUser.username,
        senderName: currentUser.name || currentUser.username,
        text: text,
        createdAt: new Date().toISOString(),
        isTemp: true,
        groupId: groupId
      };

      set((state) => ({
        groupMessages: {
          ...state.groupMessages,
          [groupId]: [
            ...(state.groupMessages[groupId] || []),
            tempMessage
          ]
        }
      }));

      // Send via WebSocket
      groupWebSocketService.sendGroupMessage(
        groupId,
        currentUser.username,
        text
      );

      return true;
    } catch (error) {
      console.error('❌ Group message send failed:', error);
      return false;
    }
  },

  // Handle incoming group messages
  handleIncomingGroupMessage: (messageData, groupId) => {
    const { currentUser } = get();
    if (!currentUser) return;

    const formattedMessage = {
      _id: `ws-group-${Date.now()}-${Math.random()}`,
      senderId: messageData.sender,
      senderName: messageData.senderName || messageData.sender,
      text: messageData.message,
      createdAt: new Date().toISOString(),
      groupId: groupId
    };

    set((state) => {
      const existing = state.groupMessages[groupId] || [];
      
      // Remove any temp messages with same content from same sender
      const filtered = existing.filter(msg => 
        !(msg.isTemp && msg.text === formattedMessage.text && msg.senderId === formattedMessage.senderId)
      );

      return {
        groupMessages: {
          ...state.groupMessages,
          [groupId]: [...filtered, formattedMessage]
        }
      };
    });
  },

  // Get messages for group
  getMessagesForGroup: (groupId) => {
    const { groupMessages } = get();
    return groupMessages[groupId] || [];
  },

  // Get last message for group
  getLastMessageForGroup: (groupId) => {
    const messages = get().getMessagesForGroup(groupId);
    return messages.length > 0 ? messages[messages.length - 1] : null;
  },

  // Get unread count for group (placeholder)
  getUnreadCountForGroup: (groupId) => {
    return 0;
  },

  // Get group members
  getGroupMembers: (groupId) => {
    const { groupMembers } = get();
    return groupMembers[groupId] || [];
  },

  // Check if old messages are loading
  isLoadingOldMessages: (groupId) => {
    const { loadingOldMessages } = get();
    return loadingOldMessages[groupId] || false;
  },

  // Refresh groups list
  refreshGroups: async () => {
    await get().loadUserGroups();
  }
}));

export { useGroupChatStore };
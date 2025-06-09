import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import ChatContainer from "../components/ChatContainer";
import GroupChatContainer from "../components/GroupChatContainer";
import NoChatSelected from "../components/NoChatSelected";
import { useChatStore } from "../store/useChatStore";
import { useGroupChatStore } from "../store/useGroupChatStore";
import { getCurrentUserFromToken } from "../lib/jwtUtils";
import toast from "react-hot-toast";

const HomePage = () => {
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [activeTab, setActiveTab] = useState("all");
  
  const { 
    initializeWebSocket, 
    disconnectWebSocket, 
    isConnected: chatConnected,
    isLoading: chatLoading 
  } = useChatStore();

  const {
    initializeGroupWebSocket,
    disconnectGroupWebSocket,
    isConnected: groupChatConnected,
    isLoading: groupChatLoading
  } = useGroupChatStore();

  // Initialize WebSocket connections when component mounts
  useEffect(() => {
    const initChat = async () => {
      // Initialize regular chat
      const chatSuccess = await initializeWebSocket();
      if (!chatSuccess) {
        toast.error('Failed to connect to chat service');
      }

      // Initialize group chat
      const groupChatSuccess = await initializeGroupWebSocket();
      if (!groupChatSuccess) {
        toast.error('Failed to connect to group chat service');
      }
    };

    initChat();

    // Cleanup on unmount
    return () => {
      disconnectWebSocket();
      disconnectGroupWebSocket();
    };
  }, [initializeWebSocket, disconnectWebSocket, initializeGroupWebSocket, disconnectGroupWebSocket]);

  const handleSelectUser = (user) => {
    setSelectedUser(user);
    setSelectedGroup(null); // Clear group selection
  };

  const handleSelectGroup = (group) => {
    setSelectedGroup(group);
    setSelectedUser(null); // Clear user selection
  };

  const handleCloseChat = () => {
    setSelectedUser(null);
    setSelectedGroup(null);
  };

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    // Clear selections when switching tabs
    if (tabId === "groups" && selectedUser) {
      setSelectedUser(null);
    } else if (tabId !== "groups" && selectedGroup) {
      setSelectedGroup(null);
    }
  };

  const isConnected = chatConnected && groupChatConnected;
  const isLoading = chatLoading || groupChatLoading;

  return (
    <div className="h-screen bg-base-200">
      <div className="flex items-center justify-center pt-20 px-4">
        <div className="bg-base-100 rounded-lg shadow-cl w-full max-w-6xl h-[calc(100vh-8rem)]">
          {/* Connection Status Indicator */}
          {!isConnected && !isLoading && (
            <div className="bg-warning text-warning-content px-4 py-2 text-sm text-center">
              Chat service disconnected. Trying to reconnect...
            </div>
          )}
          
          <div className="flex h-full rounded-lg overflow-hidden">
            <Sidebar 
              onSelectUser={handleSelectUser} 
              onSelectGroup={handleSelectGroup}
              selectedUserId={selectedUser?._id}
              selectedGroupId={selectedGroup?.id}
              activeTab={activeTab}
              onTabChange={handleTabChange}
            />

            {!selectedUser && !selectedGroup ? (
              <NoChatSelected />
            ) : selectedGroup ? (
              <GroupChatContainer
                selectedGroup={selectedGroup}
                onClose={handleCloseChat}
              />
            ) : (
              <ChatContainer
                selectedUser={selectedUser}
                onClose={handleCloseChat}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
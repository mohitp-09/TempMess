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
    <div className="min-h-screen bg-gradient-to-br from-base-200/50 via-base-100/30 to-base-200/50 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-float-gentle" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-secondary/5 rounded-full blur-3xl animate-float-gentle" style={{ animationDelay: '3s' }} />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-accent/5 rounded-full blur-3xl animate-float-gentle" style={{ animationDelay: '1.5s' }} />
      </div>

      <div className="relative z-10 flex items-center justify-center pt-20 px-4 min-h-screen">
        <div className="w-full max-w-7xl h-[calc(100vh-8rem)]">
          {/* Connection Status Indicator */}
          {!isConnected && !isLoading && (
            <div className="mb-4 glass-strong text-warning px-6 py-3 text-sm text-center rounded-2xl shadow-macos animate-slide-up">
              <div className="flex items-center justify-center gap-2">
                <div className="w-2 h-2 bg-warning rounded-full animate-pulse" />
                Chat service disconnected. Trying to reconnect...
              </div>
            </div>
          )}
          
          {/* Main Chat Container */}
          <div className="card-macos-strong h-full overflow-hidden animate-scale-in">
            <div className="flex h-full">
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
    </div>
  );
};

export default HomePage;
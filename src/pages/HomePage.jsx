import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import ChatContainer from "../components/ChatContainer";
import NoChatSelected from "../components/NoChatSelected";
import { useChatStore } from "../store/useChatStore";
import { getCurrentUserFromToken } from "../lib/jwtUtils";
import toast from "react-hot-toast";

const HomePage = () => {
  const [selectedUser, setSelectedUser] = useState(null);
  const { 
    initializeWebSocket, 
    disconnectWebSocket, 
    isConnected,
    isLoading 
  } = useChatStore();

  // Initialize WebSocket connection when component mounts
  useEffect(() => {
    const initChat = async () => {
      const success = await initializeWebSocket();
      if (!success) {
        toast.error('Failed to connect to chat service');
      }
    };

    initChat();

    // Cleanup on unmount
    return () => {
      disconnectWebSocket();
    };
  }, [initializeWebSocket, disconnectWebSocket]);

  const handleSelectUser = (user) => {
    setSelectedUser(user);
  };

  const handleCloseChat = () => {
    setSelectedUser(null);
  };

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
            <Sidebar onSelectUser={handleSelectUser} selectedUserId={selectedUser?._id} />

            {!selectedUser ? (
              <NoChatSelected />
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
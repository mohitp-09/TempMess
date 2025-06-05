import { useState } from "react";
import Sidebar from "../components/Sidebar";
import ChatContainer from "../components/ChatContainer";
import NoChatSelected from "../components/NoChatSelected";
import { authUser } from "../data/mockData";

const HomePage = () => {
  const [selectedUser, setSelectedUser] = useState(null);

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
          <div className="flex h-full rounded-lg overflow-hidden">
            <Sidebar onSelectUser={handleSelectUser} selectedUserId={selectedUser?._id} />

            {!selectedUser ? (
              <NoChatSelected />
            ) : (
              <ChatContainer
                selectedUser={selectedUser}
                authUser={authUser}
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

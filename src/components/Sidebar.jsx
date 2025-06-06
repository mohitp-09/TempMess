import { Plus, Search, Users, MessageCircle, Bell, UsersRound, X, AlignLeft } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { users, messagesByUser, chats } from "../data/mockData";
import AddUserModal from "./AddUserModal";

const Sidebar = ({ onSelectUser, selectedUserId }) => {
  const [showDrawer, setShowDrawer] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const drawerRef = useRef(null);
  const buttonRef = useRef(null);

  const tabs = [
    { id: "all", label: "All", icon: <MessageCircle className="size-4" /> },
    { id: "unread", label: "Unread", icon: <Bell className="size-4" /> },
    { id: "groups", label: "Groups", icon: <UsersRound className="size-4" /> },
  ];

  const drawerOptions = [
    { 
      id: "newGroup", 
      label: "New Group", 
      icon: <UsersRound className="size-5" />,
      onClick: () => {
        console.log("New Group clicked");
        setShowDrawer(false);
      }
    },
    { 
      id: "addUser", 
      label: "Add User", 
      icon: <Users className="size-5" />,
      onClick: () => {
        setShowAddUserModal(true);
        setShowDrawer(false);
      }
    },
  ];

  const filteredUsers = users.filter(user =>
    user.fullName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleDrawer = () => {
    setShowDrawer(!showDrawer);
  };

  const toggleSidebar = () => {
    setIsExpanded(!isExpanded);
  };

  const handleUserSelect = (user) => {
    onSelectUser(user);
    if (window.innerWidth < 1024) {
      setIsExpanded(false);
    }
  };

  const getLastMessage = (userId) => {
    const chat = chats.find(chat => chat.user._id === userId);
    return chat?.lastMessage || null;
  };

  const getUnreadCount = (userId) => {
    const chat = chats.find(chat => chat.user._id === userId);
    return chat?.unreadCount || 0;
  };

  const formatMessageTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days > 0) {
      return days === 1 ? 'Yesterday' : `${days}d ago`;
    }

    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        showDrawer &&
        drawerRef.current &&
        !drawerRef.current.contains(event.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target)
      ) {
        setShowDrawer(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showDrawer]);

  return (
    <>
      <aside
        className={`h-full border-r border-base-300 flex flex-col transition-all duration-300 relative ${
          isExpanded ? 'w-72' : 'w-[68px]'
        } lg:w-72`}
      >
        <div className="border-b border-base-300 w-full p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <button
              onClick={toggleSidebar}
              className="size-9 flex items-center justify-center rounded-full hover:bg-base-200 transition-colors lg:hidden"
              aria-label="Toggle sidebar"
            >
              <AlignLeft className="size-5" />
            </button>

            <div className={`relative flex-1 ${!isExpanded && 'hidden'} lg:block`}>
              <div className="relative flex items-center">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-base-content/40" />
                  <input
                    type="text"
                    placeholder="Search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 bg-base-200 rounded-full text-sm focus:outline-none"
                  />
                </div>
                <button
                  ref={buttonRef}
                  onClick={toggleDrawer}
                  className="ml-2 size-9 flex items-center justify-center rounded-full bg-base-200 hover:bg-base-300 transition-colors"
                  aria-label={showDrawer ? "Close menu" : "Open menu"}
                >
                  {showDrawer ? (
                    <X className="size-5 transition-transform duration-200" />
                  ) : (
                    <Plus className="size-5 transition-transform duration-200" />
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className={`flex overflow-x-auto py-1 gap-1 no-scrollbar ${!isExpanded && 'hidden'} lg:flex`}>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 rounded-full flex items-center gap-1.5 whitespace-nowrap text-sm transition-colors ${
                  activeTab === tab.id
                    ? "bg-base-300 font-medium"
                    : "hover:bg-base-200"
                }`}
              >
                <span className="hidden sm:block lg:hidden">{tab.icon}</span>
                <span className="block sm:hidden lg:block">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-y-auto w-full py-3">
          {filteredUsers.length > 0 ? (
            filteredUsers.map((user) => {
              const lastMessage = getLastMessage(user._id);
              const unreadCount = getUnreadCount(user._id);

              return (
                <button
                  key={user._id}
                  onClick={() => handleUserSelect(user)}
                  className={`w-full p-3 flex items-center gap-3 hover:bg-base-300 transition-colors ${
                    selectedUserId === user._id ? "bg-base-300" : ""
                  }`}
                >
                  <div className="relative mx-auto lg:mx-0">
                    <img
                      src={user.profilePic}
                      alt={user.fullName}
                      className="size-12 object-cover rounded-full"
                    />
                    {user.isOnline && (
                     <span className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 rounded-full ring-2 ring-white" />

                    )}
                  </div>

                  <div className={`${!isExpanded && 'hidden'} lg:block text-left min-w-0 flex-1`}>
                    <div className="flex items-center justify-between">
                      <span className="font-medium truncate">{user.fullName}</span>
                      {lastMessage && (
                        <span className="text-xs text-base-content/40">
                          {formatMessageTime(lastMessage.createdAt)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-0.5">
                      <span className="text-sm text-base-content/40 truncate max-w-[180px]">
                        {lastMessage ? lastMessage.text : 'No messages yet'}
                      </span>
                      {unreadCount > 0 && (
                        <span className="flex items-center justify-center min-w-5 h-5 text-xs font-medium bg-primary text-primary-content rounded-full px-1.5">
                          {unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          ) : (
            <div className="text-center text-base-content/40 py-4">No contacts found</div>
          )}
        </div>

        {showDrawer && (
          <div
            ref={drawerRef}
            className="absolute top-16 right-4 z-10 bg-base-100 border border-base-300 rounded-lg shadow-md p-1.5 min-w-36 animate-in fade-in zoom-in-95 duration-150"
          >
            {drawerOptions.map((option) => (
              <button
                key={option.id}
                onClick={option.onClick}
                className="w-full flex items-center gap-2.5 p-2.5 rounded-md hover:bg-base-200 transition-colors text-left text-sm"
              >
                {option.icon}
                <span>{option.label}</span>
              </button>
            ))}
          </div>
        )}
      </aside>

      {/* Add User Modal */}
      <AddUserModal 
        isOpen={showAddUserModal} 
        onClose={() => setShowAddUserModal(false)} 
      />
    </>
  );
};

export default Sidebar;
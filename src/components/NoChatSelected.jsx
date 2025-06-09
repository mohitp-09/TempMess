import { MessageSquare, Sparkles, Users, Zap } from "lucide-react";

const NoChatSelected = () => {
  return (
    <div className="w-full flex flex-1 flex-col items-center justify-center p-16 bg-gradient-to-br from-base-100 via-base-50 to-base-100">
      <div className="max-w-md text-center space-y-8">
        {/* Animated Icon Display */}
        <div className="flex justify-center gap-4 mb-8">
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center animate-bounce shadow-lg">
              <MessageSquare className="w-10 h-10 text-primary" />
            </div>
            <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-primary/60 animate-pulse" />
          </div>
        </div>

        {/* Welcome Text */}
        <div className="space-y-4">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
            Welcome to MessUp!
          </h2>
          <p className="text-base-content/60 leading-relaxed text-lg">
            Select a conversation from the sidebar to start chatting with your friends
          </p>
        </div>

        {/* Feature highlights */}
        <div className="grid grid-cols-1 gap-4 mt-8">
          <div className="flex items-center gap-3 p-4 bg-base-200/50 rounded-xl backdrop-blur-sm border border-base-300/50">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Zap className="w-5 h-5 text-blue-600" />
            </div>
            <div className="text-left">
              <h3 className="font-medium text-base-content">Real-time messaging</h3>
              <p className="text-sm text-base-content/60">Instant delivery and notifications</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-4 bg-base-200/50 rounded-xl backdrop-blur-sm border border-base-300/50">
            <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-green-600" />
            </div>
            <div className="text-left">
              <h3 className="font-medium text-base-content">Connect with friends</h3>
              <p className="text-sm text-base-content/60">Add friends and start conversations</p>
            </div>
          </div>
        </div>

        {/* Subtle call to action */}
        <div className="mt-8 p-4 bg-primary/5 rounded-xl border border-primary/20">
          <p className="text-sm text-primary/80 font-medium">
            💡 Tip: Use the + button in the sidebar to add new friends
          </p>
        </div>
      </div>
    </div>
  );
};

export default NoChatSelected;
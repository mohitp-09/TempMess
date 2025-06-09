import { MessageSquare, Sparkles, Users, Zap, Heart, Star } from "lucide-react";

const NoChatSelected = () => {
  return (
    <div className="w-full flex flex-1 flex-col items-center justify-center p-16 glass-subtle relative overflow-hidden">
      {/* Background Decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-primary/10 rounded-full blur-3xl animate-float-gentle" />
        <div className="absolute bottom-1/4 right-1/4 w-24 h-24 bg-secondary/10 rounded-full blur-3xl animate-float-gentle" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 right-1/4 w-20 h-20 bg-accent/10 rounded-full blur-3xl animate-float-gentle" style={{ animationDelay: '4s' }} />
      </div>

      <div className="relative z-10 max-w-lg text-center space-y-12">
        {/* Enhanced App Icon Display */}
        <div className="flex justify-center gap-6 mb-12">
          <div className="relative animate-float-gentle">
            <div className="w-28 h-28 rounded-3xl glass-strong flex items-center justify-center shadow-macos-lg hover-lift">
              <MessageSquare className="w-14 h-14 text-primary" />
            </div>
            <Sparkles className="absolute -top-3 -right-3 w-8 h-8 text-primary/60 animate-pulse-glow" />
            <Heart className="absolute -bottom-2 -left-2 w-6 h-6 text-pink-500/60 animate-pulse" />
            <Star className="absolute top-1/2 -right-4 w-5 h-5 text-yellow-500/60 animate-pulse" style={{ animationDelay: '1s' }} />
            
            <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2">
              <div className="glass-strong text-primary px-4 py-2 rounded-2xl shadow-macos font-bold text-sm">
                MessUp
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Welcome Text */}
        <div className="space-y-6">
          <h2 className="text-4xl font-bold gradient-text">
            Welcome to MessUp!
          </h2>
          <p className="text-base-content/60 leading-relaxed text-xl">
            Select a conversation from the sidebar to start chatting with your friends
          </p>
        </div>

        {/* Enhanced Feature Highlights */}
        <div className="grid grid-cols-1 gap-4 mt-12">
          <div className="card-macos p-6 hover-lift animate-slide-up">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-blue-500/20 to-blue-600/20 flex items-center justify-center shadow-macos">
                <Zap className="w-6 h-6 text-blue-600" />
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-base-content text-lg">Real-time messaging</h3>
                <p className="text-sm text-base-content/60 mt-1">Instant delivery and notifications with read receipts</p>
              </div>
            </div>
          </div>
          
          <div className="card-macos p-6 hover-lift animate-slide-up" style={{ animationDelay: '100ms' }}>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-green-500/20 to-emerald-500/20 flex items-center justify-center shadow-macos">
                <Users className="w-6 h-6 text-green-600" />
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-base-content text-lg">Connect with friends</h3>
                <p className="text-sm text-base-content/60 mt-1">Add friends and create groups for seamless conversations</p>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Call to Action */}
        <div className="card-macos p-6 bg-gradient-to-r from-primary/10 to-secondary/10 animate-slide-up" style={{ animationDelay: '200ms' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-primary/20 to-secondary/20 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <p className="text-sm text-primary/80 font-medium">
              💡 Tip: Use the + button in the sidebar to add new friends or create groups
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NoChatSelected;
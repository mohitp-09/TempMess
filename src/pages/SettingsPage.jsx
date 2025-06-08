import { THEMES } from "../constants";
import { useThemeStore } from "../store/useThemeStore";
import { Send, Palette, Sun, Moon, Check, Monitor } from "lucide-react";

const PREVIEW_MESSAGES = [
  { id: 1, content: "Hey! How's the new design looking?", isSent: false },
  { id: 2, content: "It looks amazing! Really professional.", isSent: true },
  { id: 3, content: "The themes work perfectly across all components.", isSent: false },
];

// Selected professional themes
const SELECTED_THEMES = {
  light: [
    { name: "pastel", label: "Pastel", description: "Soft and gentle colors" },
    { name: "nord", label: "Nord", description: "Clean Nordic design" },
    { name: "wireframe", label: "Wireframe", description: "Minimal and clean" }
  ],
  dark: [
    { name: "dim", label: "Dim", description: "Easy on the eyes" },
    { name: "sunset", label: "Sunset", description: "Warm evening tones" },
    { name: "coffee", label: "Coffee", description: "Rich and cozy" }
  ]
};

const SettingsPage = () => {
  const { theme, setTheme } = useThemeStore();

  const ThemeCard = ({ themeData, isSelected }) => (
    <button
      onClick={() => setTheme(themeData.name)}
      className={`
        group relative p-4 rounded-xl border-2 transition-all duration-300 text-left
        ${isSelected 
          ? "border-primary bg-primary/5 shadow-lg scale-105" 
          : "border-base-300 hover:border-primary/50 hover:shadow-md hover:scale-102"
        }
      `}
    >
      {/* Theme Preview */}
      <div className="relative h-16 w-full rounded-lg overflow-hidden mb-3" data-theme={themeData.name}>
        <div className="absolute inset-0 grid grid-cols-4 gap-1 p-2">
          <div className="rounded bg-primary"></div>
          <div className="rounded bg-secondary"></div>
          <div className="rounded bg-accent"></div>
          <div className="rounded bg-neutral"></div>
        </div>
        
        {/* Selected indicator */}
        {isSelected && (
          <div className="absolute top-2 right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
            <Check className="w-4 h-4 text-primary-content" />
          </div>
        )}
      </div>

      {/* Theme Info */}
      <div className="space-y-1">
        <h3 className="font-semibold text-base-content group-hover:text-primary transition-colors">
          {themeData.label}
        </h3>
        <p className="text-sm text-base-content/60">
          {themeData.description}
        </p>
      </div>
    </button>
  );

  return (
    <div className="min-h-screen bg-base-200/50 pt-20">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Palette className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-base-content">Settings</h1>
          </div>
          <p className="text-base-content/60 text-lg max-w-2xl mx-auto">
            Customize your MessUp experience with our carefully selected themes
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Theme Selection */}
          <div className="lg:col-span-2 space-y-8">
            {/* Light Themes */}
            <div className="bg-base-100 rounded-2xl p-6 shadow-sm border border-base-300/50">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
                  <Sun className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-base-content">Light Themes</h2>
                  <p className="text-sm text-base-content/60">Perfect for daytime use</p>
                </div>
              </div>
              
              <div className="grid md:grid-cols-3 gap-4">
                {SELECTED_THEMES.light.map((themeData) => (
                  <ThemeCard
                    key={themeData.name}
                    themeData={themeData}
                    isSelected={theme === themeData.name}
                  />
                ))}
              </div>
            </div>

            {/* Dark Themes */}
            <div className="bg-base-100 rounded-2xl p-6 shadow-sm border border-base-300/50">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                  <Moon className="w-5 h-5 text-slate-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-base-content">Dark Themes</h2>
                  <p className="text-sm text-base-content/60">Easy on the eyes for night use</p>
                </div>
              </div>
              
              <div className="grid md:grid-cols-3 gap-4">
                {SELECTED_THEMES.dark.map((themeData) => (
                  <ThemeCard
                    key={themeData.name}
                    themeData={themeData}
                    isSelected={theme === themeData.name}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Live Preview */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <div className="bg-base-100 rounded-2xl p-6 shadow-sm border border-base-300/50">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Monitor className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-base-content">Live Preview</h3>
                    <p className="text-sm text-base-content/60">See how it looks</p>
                  </div>
                </div>

                {/* Chat Preview */}
                <div className="rounded-xl border border-base-300/50 overflow-hidden bg-base-50">
                  {/* Chat Header */}
                  <div className="px-4 py-3 border-b border-base-300/50 bg-base-100">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-content font-medium text-sm">
                        J
                      </div>
                      <div>
                        <h4 className="font-medium text-sm text-base-content">John Doe</h4>
                        <p className="text-xs text-base-content/60">Online</p>
                      </div>
                    </div>
                  </div>

                  {/* Chat Messages */}
                  <div className="p-4 space-y-3 min-h-[200px] bg-base-50">
                    {PREVIEW_MESSAGES.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.isSent ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`
                            max-w-[85%] rounded-2xl px-3 py-2 shadow-sm
                            ${message.isSent 
                              ? "bg-primary text-primary-content rounded-br-md" 
                              : "bg-base-200 text-base-content rounded-bl-md"
                            }
                          `}
                        >
                          <p className="text-sm leading-relaxed">{message.content}</p>
                          <div className="flex items-center justify-end gap-1 mt-1">
                            <span className={`text-xs opacity-70`}>
                              12:0{message.id} PM
                            </span>
                            {message.isSent && (
                              <div className="text-xs opacity-70">
                                ✓✓
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Chat Input */}
                  <div className="p-4 border-t border-base-300/50 bg-base-100">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        className="flex-1 px-3 py-2 text-sm bg-base-200 rounded-lg border border-base-300/50 focus:outline-none focus:ring-2 focus:ring-primary/50"
                        placeholder="Type a message..."
                        value="This is a preview"
                        readOnly
                      />
                      <button className="w-10 h-10 bg-primary text-primary-content rounded-lg flex items-center justify-center hover:bg-primary/90 transition-colors">
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Current Theme Info */}
                <div className="mt-6 p-4 bg-primary/5 rounded-xl border border-primary/20">
                  <div className="text-center">
                    <p className="text-sm font-medium text-primary mb-1">Current Theme</p>
                    <p className="text-lg font-bold text-base-content capitalize">
                      {SELECTED_THEMES.light.find(t => t.name === theme)?.label || 
                       SELECTED_THEMES.dark.find(t => t.name === theme)?.label || 
                       theme}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
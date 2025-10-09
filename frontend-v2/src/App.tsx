import { useState, useEffect } from "react";
import { ChatKitPanel } from "./components/ChatKitPanel";
// import { KnowledgeBase } from "./components/KnowledgeBase";

function App() {
  const [theme, setTheme] = useState<"light" | "dark">("dark");

  // Always use dark theme
  useEffect(() => {
    setTheme("dark");
  }, []);

  return (
    <div className="w-full h-screen flex flex-col bg-[#161618] relative">
      {/* Header */}
      <header className="flex-shrink-0 bg-gradient-to-r from-[#1a1a1c] to-[#161618] border-b border-gray-800/50 px-4 sm:px-6 py-3 sm:py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-sm sm:text-base">JC</span>
            </div>
            <div>
              <h1 className="text-white font-semibold text-base sm:text-lg leading-tight">
                Jason's Coaching Hub
              </h1>
              <p className="text-gray-400 text-xs sm:text-sm leading-tight">
                AI-Powered Growth Assistant
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Chat Area */}
      <div className="flex-1 overflow-hidden">
        <ChatKitPanel theme={theme} />
      </div>
      {/* Knowledge Base temporarily disabled - file management API compatibility issue */}
      {/* <KnowledgeBase /> */}
    </div>
  );
}

export default App;

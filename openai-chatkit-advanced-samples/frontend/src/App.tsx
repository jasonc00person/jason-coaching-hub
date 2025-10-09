import { useState, useEffect } from "react";
import { ChatKitPanel } from "./components/ChatKitPanel";

function App() {
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    // Always use dark theme for ChatGPT-style interface
    setTheme("dark");
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="flex h-screen">
        {/* Sidebar */}
        <div className={`${sidebarOpen ? 'w-64' : 'w-16'} transition-all duration-300 bg-gray-900 border-r border-gray-700 flex flex-col`}>
          {/* Logo */}
          <div className="p-4 border-b border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">JC</span>
              </div>
              {sidebarOpen && (
                <span className="text-white font-semibold">Jason's Coach</span>
              )}
            </div>
          </div>

          {/* Navigation */}
          <div className="flex-1 p-2">
            <button className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-800 transition-colors mb-2">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              {sidebarOpen && <span className="text-gray-300">New chat</span>}
            </button>

            <div className="space-y-1">
              <button className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-800 transition-colors text-gray-300">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                {sidebarOpen && <span>Search chats</span>}
              </button>

              <button className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-800 transition-colors text-gray-300">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                {sidebarOpen && <span>Library</span>}
              </button>
            </div>

            {/* Recent Chats */}
            {sidebarOpen && (
              <div className="mt-6">
                <h3 className="text-sm font-semibold text-gray-400 mb-3 px-3">Recent</h3>
                <div className="space-y-1">
                  <button className="w-full text-left p-3 rounded-lg hover:bg-gray-800 transition-colors text-gray-300 truncate">
                    Hook Templates Discussion
                  </button>
                  <button className="w-full text-left p-3 rounded-lg hover:bg-gray-800 transition-colors text-gray-300 truncate">
                    ICP Framework Walkthrough
                  </button>
                  <button className="w-full text-left p-3 rounded-lg hover:bg-gray-800 transition-colors text-gray-300 truncate">
                    Content Strategy Planning
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* User Profile */}
          <div className="p-3 border-t border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold text-sm">J</span>
              </div>
              {sidebarOpen && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">Jason Cooperson</p>
                  <p className="text-xs text-gray-400 truncate">Personal account</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-700 bg-gray-900">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <h1 className="text-xl font-semibold text-white">Jason's Coaching Hub</h1>
            </div>
            
            <div className="flex items-center space-x-2">
              <button className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                </svg>
              </button>
              <button className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                </svg>
              </button>
            </div>
          </div>

          {/* Chat Area */}
          <div className="flex-1 flex flex-col">
            <ChatKitPanel theme={theme} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;

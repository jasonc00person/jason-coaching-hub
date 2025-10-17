import { useState, useCallback, useEffect } from "react";
import { ChatKitPanel } from "@/components/ChatKitPanel";
import { Sidebar } from "@/components/Sidebar";
import { THEME_STORAGE_KEY } from "@/lib/config";
import { useConversations } from "@/hooks/useConversations";

type ColorScheme = "light" | "dark";

function App() {
  // Initialize theme from localStorage or default to dark
  const [theme, setTheme] = useState<ColorScheme>(() => {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    return (stored as ColorScheme) || "dark";
  });

  // Sidebar open state (expanded by default)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // ChatKit control and conversation state
  const [chatkitControl, setChatkitControl] = useState<any>(null);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const { conversations, addConversation } = useConversations();

  // Save theme changes to localStorage
  useEffect(() => {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  const handleThemeChange = useCallback((newTheme: ColorScheme) => {
    setTheme(newTheme);
  }, []);

  const handleNewChat = useCallback(async () => {
    if (chatkitControl) {
      try {
        console.log("[App] Starting new chat");
        await chatkitControl.setThreadId(null);
        setActiveThreadId(null);
      } catch (error) {
        console.error("[App] Failed to start new chat:", error);
      }
    }
  }, [chatkitControl]);

  const handleSelectConversation = useCallback(async (threadId: string) => {
    if (chatkitControl) {
      try {
        console.log("[App] Switching to conversation:", threadId);
        await chatkitControl.setThreadId(threadId);
      } catch (error) {
        console.error("[App] Failed to switch conversation:", error);
      }
    }
  }, [chatkitControl]);

  const handleThreadChange = useCallback((data: { threadId: string | null }) => {
    console.log("[App] Thread changed:", data);
    setActiveThreadId(data.threadId);
    
    // Add conversation to list if it's new
    if (data.threadId && !conversations.find(c => c.id === data.threadId)) {
      addConversation(data.threadId, "New conversation");
    }
  }, [conversations, addConversation]);

  const handleControlReady = useCallback((control: any) => {
    console.log("[App] ChatKit control ready");
    setChatkitControl(control);
  }, []);

  // Dynamic background based on theme
  const appBg = theme === "dark" ? "bg-slate-950" : "bg-slate-100";

  return (
    <div className={`h-screen w-full flex ${appBg}`}>
      {/* Sidebar */}
      <Sidebar 
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        theme={theme}
        onThemeChange={handleThemeChange}
        conversations={conversations}
        activeThreadId={activeThreadId}
        onNewChat={handleNewChat}
        onSelectConversation={handleSelectConversation}
      />

      {/* ChatKit Panel */}
      <div className="flex-1 overflow-hidden">
        <ChatKitPanel 
          theme={theme}
          onControlReady={handleControlReady}
          onThreadChange={handleThreadChange}
        />
      </div>
    </div>
  );
}

export default App;

import { useState, useEffect } from "react";
import { ChatKitPanel } from "./components/ChatKitPanel";
import { KnowledgeBase } from "./components/KnowledgeBase";

function App() {
  const [theme, setTheme] = useState<"light" | "dark">("dark");

  // Always use dark theme
  useEffect(() => {
    setTheme("dark");
  }, []);

  return (
    <div className="w-screen h-screen bg-[#161618] relative">
      <ChatKitPanel theme={theme} />
      <KnowledgeBase />
    </div>
  );
}

export default App;

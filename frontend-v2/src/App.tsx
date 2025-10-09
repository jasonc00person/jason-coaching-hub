import { useState, useEffect } from "react";
import { ChatKitPanel } from "./components/ChatKitPanel";

function App() {
  const [theme, setTheme] = useState<"light" | "dark">("dark");

  // Always use dark theme
  useEffect(() => {
    setTheme("dark");
  }, []);

  return (
    <div className="w-full h-full bg-[#0f0f0f] flex flex-col">
      <ChatKitPanel theme={theme} />
    </div>
  );
}

export default App;

import { useState, useEffect } from "react";
import { ChatKitPanel } from "./components/ChatKitPanel";

console.log("=== APP.TSX LOADED ===");

function App() {
  const [theme, setTheme] = useState<"light" | "dark">("dark");

  console.log("=== App Component Rendering ===");

  // Always use dark theme
  useEffect(() => {
    console.log("App useEffect running - setting theme to dark");
    setTheme("dark");
  }, []);

  return (
    <div className="h-screen w-full bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 flex flex-col">
      <ChatKitPanel theme={theme} />
    </div>
  );
}

export default App;

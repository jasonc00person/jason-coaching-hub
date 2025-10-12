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
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 flex items-center justify-center p-4 md:p-8 relative overflow-hidden">
      {/* Subtle texture overlay */}
      <div className="fixed inset-0 opacity-20 pointer-events-none" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='grid' width='60' height='60' patternUnits='userSpaceOnUse'%3E%3Cpath d='M 60 0 L 0 0 0 60' fill='none' stroke='rgba(255, 255, 255, 0.02)' stroke-width='1'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='100%25' height='100%25' fill='url(%23grid)'/%3E%3C/svg%3E")`
      }} />

      {/* Floating gradient orbs for depth */}
      <div className="fixed top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none animate-pulse" style={{ animationDuration: '8s' }} />
      <div className="fixed bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none animate-pulse" style={{ animationDuration: '10s', animationDelay: '2s' }} />

      {/* Main chat container with glassmorphism */}
      <div className="relative w-full max-w-6xl h-[90vh] rounded-3xl overflow-hidden bg-white/5 backdrop-blur-2xl shadow-[0_45px_90px_-45px_rgba(15,23,42,0.8),0_0_0_1px_rgba(255,255,255,0.05)] ring-1 ring-white/10 transition-all duration-500 hover:shadow-[0_60px_120px_-45px_rgba(15,23,42,0.9)] hover:ring-white/15">
        {/* Inner glow effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none" />
        
        {/* ChatKit Panel */}
        <div className="relative h-full w-full">
          <ChatKitPanel theme={theme} />
        </div>
      </div>
    </div>
  );
}

export default App;

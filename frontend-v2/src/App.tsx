import { useState, useCallback, useEffect } from "react";
import { ChatKitPanel } from "@/components/ChatKitPanel";
import { Moon, Sun } from "lucide-react";
import { THEME_STORAGE_KEY } from "@/lib/config";

type ColorScheme = "light" | "dark";

function App() {
  // Initialize theme from localStorage or default to dark
  const [theme, setTheme] = useState<ColorScheme>(() => {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    return (stored as ColorScheme) || "dark";
  });

  // Save theme changes to localStorage
  useEffect(() => {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  const handleThemeChange = useCallback((newTheme: ColorScheme) => {
    setTheme(newTheme);
  }, []);

  return (
    <div className="h-screen w-full flex flex-col bg-slate-950">
      {/* Header with theme toggle */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
        <h1 className="text-xl font-semibold text-slate-100">Jason's CoachGPT</h1>
        
        {/* Theme Toggle */}
        <div className="inline-flex items-center gap-1 rounded-full border border-slate-700 bg-slate-900/60 p-1 shadow-sm backdrop-blur-sm">
          <button
            type="button"
            onClick={() => handleThemeChange("light")}
            className={`inline-flex h-9 w-9 items-center justify-center rounded-full transition-colors duration-200 ${
              theme === "light"
                ? "bg-slate-100 text-slate-900 shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
            aria-label="Use light theme"
            aria-pressed={theme === "light"}
          >
            <Sun className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => handleThemeChange("dark")}
            className={`inline-flex h-9 w-9 items-center justify-center rounded-full transition-colors duration-200 ${
              theme === "dark"
                ? "bg-slate-100 text-slate-900 shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
            aria-label="Use dark theme"
            aria-pressed={theme === "dark"}
          >
            <Moon className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* ChatKit Panel */}
      <div className="flex-1 overflow-hidden">
        <ChatKitPanel theme={theme} />
      </div>
    </div>
  );
}

export default App;

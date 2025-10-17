import { Sun, Moon } from "lucide-react";

type ThemeToggleProps = {
  isExpanded: boolean;
  theme: "light" | "dark";
  onChange: (theme: "light" | "dark") => void;
};

export function ThemeToggle({ isExpanded, theme, onChange }: ThemeToggleProps) {
  // Theme-aware colors
  const activeClass = theme === "dark" 
    ? "bg-slate-800 text-slate-100" 
    : "bg-slate-200 text-slate-900";
  
  const inactiveClass = theme === "dark"
    ? "text-slate-400 hover:bg-slate-800/50 hover:text-slate-300"
    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900";

  if (isExpanded) {
    // Full toggle with labels
    return (
      <div className="flex flex-col gap-2">
        <button
          onClick={() => onChange("light")}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
            theme === "light" ? activeClass : inactiveClass
          }`}
        >
          <Sun className="h-4 w-4" />
          <span className="text-sm">Light</span>
        </button>
        <button
          onClick={() => onChange("dark")}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
            theme === "dark" ? activeClass : inactiveClass
          }`}
        >
          <Moon className="h-4 w-4" />
          <span className="text-sm">Dark</span>
        </button>
      </div>
    );
  } else {
    // Icon only - toggle between themes
    const collapsedClass = theme === "dark"
      ? "text-slate-400 hover:bg-slate-800/50 hover:text-slate-300"
      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900";
    
    return (
      <button
        onClick={() => onChange(theme === "light" ? "dark" : "light")}
        className={`w-full flex justify-center p-2 rounded-lg transition-colors ${collapsedClass}`}
        aria-label={`Switch to ${theme === "light" ? "dark" : "light"} theme`}
      >
        {theme === "light" ? (
          <Sun className="h-5 w-5" />
        ) : (
          <Moon className="h-5 w-5" />
        )}
      </button>
    );
  }
}


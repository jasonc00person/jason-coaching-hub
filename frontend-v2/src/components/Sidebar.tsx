import { Menu, PenSquare } from "lucide-react";
import { ThemeToggle } from "./ui/ThemeToggle";
import type { Conversation } from "@/hooks/useConversations";

type SidebarProps = {
  isOpen: boolean;
  onToggle: () => void;
  theme: "light" | "dark";
  onThemeChange: (theme: "light" | "dark") => void;
  conversations: Conversation[];
  activeThreadId: string | null;
  onNewChat: () => void;
  onSelectConversation: (threadId: string) => void;
};

export function Sidebar({ 
  isOpen, 
  onToggle, 
  theme, 
  onThemeChange,
  conversations,
  activeThreadId,
  onNewChat,
  onSelectConversation 
}: SidebarProps) {
  // Theme-aware colors
  const bgColor = theme === "dark" ? "bg-[#1a1a1a]" : "bg-white";
  const textColor = theme === "dark" ? "text-slate-100" : "text-slate-900";
  const secondaryTextColor = theme === "dark" ? "text-slate-400" : "text-slate-600";
  const hoverBg = theme === "dark" ? "hover:bg-slate-800" : "hover:bg-slate-100";
  const activeBg = theme === "dark" ? "bg-slate-800" : "bg-slate-200";

  return (
    <div
      className={`
        h-full ${bgColor}
        transition-[width] duration-[400ms] flex flex-col overflow-hidden
        ${isOpen ? "w-64" : "w-16"}
      `}
      style={{ transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)' }}
    >
      {/* Top section: Logo/Icon and Toggle */}
      <div className="p-4">
        {isOpen ? (
          <div className="flex items-center justify-between animate-in fade-in duration-300">
            <div className="flex items-center gap-3">
              <img 
                src="/logo.png" 
                alt="JasonGPT Logo" 
                className="w-8 h-8 rounded-lg object-cover"
              />
              <span className={`${textColor} font-semibold text-sm transition-opacity duration-300`}>JasonGPT</span>
            </div>
            <button
              onClick={onToggle}
              className={`p-1.5 rounded-lg ${secondaryTextColor} ${hoverBg} transition-colors`}
              aria-label="Collapse sidebar"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {/* Logo with hover overlay for expand button */}
            <div className="relative group w-8">
              <img 
                src="/logo.png" 
                alt="JasonGPT Logo" 
                className="w-8 h-8 rounded-lg object-cover"
              />
              <button
                onClick={onToggle}
                className={`
                  absolute inset-0 flex items-center justify-center
                  rounded-lg ${hoverBg} ${secondaryTextColor}
                  opacity-0 group-hover:opacity-100
                  transition-opacity duration-200
                `}
                aria-label="Expand sidebar"
              >
                <Menu className="h-5 w-5" />
              </button>
            </div>
            
            {/* New Chat Icon Button */}
            <button
              onClick={onNewChat}
              className={`p-1.5 rounded-lg ${secondaryTextColor} ${hoverBg} transition-colors w-fit`}
              aria-label="New chat"
            >
              <PenSquare className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>

      {/* New Chat Button */}
      {isOpen && (
        <div className="p-4 animate-in fade-in duration-300">
          <button
            onClick={onNewChat}
            className={`flex items-center gap-2 w-full px-3 py-2.5 rounded-lg ${hoverBg} ${textColor} transition-colors`}
          >
            <PenSquare className="h-4 w-4" />
            <span className="text-sm font-medium">New chat</span>
          </button>
        </div>
      )}

      {/* Conversations section */}
      {isOpen && (
        <div className="flex-1 overflow-y-auto px-4 animate-in fade-in duration-300">
          <h2 className={`text-xs font-semibold uppercase tracking-wider mb-3 ${secondaryTextColor}`}>
            Chats
          </h2>
          <div className="space-y-1">
            {conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => onSelectConversation(conv.id)}
                className={`
                  w-full text-left px-3 py-2 rounded-lg text-sm
                  ${activeThreadId === conv.id ? activeBg + " " + textColor : hoverBg + " " + secondaryTextColor}
                  transition-colors truncate
                `}
              >
                {conv.title}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Spacer when collapsed to push theme toggle to bottom */}
      {!isOpen && <div className="flex-1" />}

      {/* Bottom section: Theme Toggle */}
      <div className="p-4">
        <ThemeToggle 
          isExpanded={isOpen}
          theme={theme} 
          onChange={onThemeChange} 
        />
      </div>
    </div>
  );
}


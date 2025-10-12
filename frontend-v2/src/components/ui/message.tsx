import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface MessageProps {
  from: "user" | "assistant";
  children: ReactNode;
  className?: string;
}

export function Message({ from, children, className }: MessageProps) {
  return (
    <div
      className={cn(
        "flex gap-3 mb-4",
        from === "user" ? "justify-end" : "justify-start",
        className
      )}
    >
      {children}
    </div>
  );
}

interface MessageContentProps {
  variant?: "contained" | "flat";
  children: ReactNode;
  className?: string;
}

export function MessageContent({ variant = "contained", children, className }: MessageContentProps) {
  return (
    <div
      className={cn(
        "rounded-2xl px-4 py-3 max-w-[80%]",
        variant === "contained" && [
          "bg-white/10 backdrop-blur-sm",
          "border border-white/10",
        ],
        variant === "flat" && "bg-transparent",
        className
      )}
    >
      {children}
    </div>
  );
}

interface MessageAvatarProps {
  name?: string;
  src?: string;
  className?: string;
}

export function MessageAvatar({ name, src, className }: MessageAvatarProps) {
  const initials = name?.slice(0, 2).toUpperCase() || "AI";
  
  return (
    <div
      className={cn(
        "w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold",
        "bg-white/10 backdrop-blur-sm border border-white/20",
        "shrink-0",
        className
      )}
    >
      {src ? (
        <img src={src} alt={name} className="w-full h-full rounded-full object-cover" />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  );
}


import { useState, useRef, useEffect } from "react";
import {
  Plus,
  ArrowUp,
  Menu,
  PenSquare,
  RefreshCcw,
  Copy,
  Check,
  ThumbsUp,
  ThumbsDown,
  Mic,
  AudioLines,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ShimmeringText } from "@/components/ui/shimmering-text";
import { Response } from "@/components/ui/response";
import { cn } from "@/lib/utils";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  thinkingTime?: number; // in seconds
  thumbsUp?: boolean;
  thumbsDown?: boolean;
}

function App() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const requestStartTimeRef = useRef<number | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const inputContainerRef = useRef<HTMLDivElement>(null);
  const mainContainerRef = useRef<HTMLDivElement>(null);
  const [hasTyped, setHasTyped] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [viewportHeight, setViewportHeight] = useState(0);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const selectionStateRef = useRef<{ start: number | null; end: number | null }>({ start: null, end: null });
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);

  // Check if device is mobile and get viewport height
  useEffect(() => {
    const checkMobileAndViewport = () => {
      const isMobileDevice = window.innerWidth < 768;
      setIsMobile(isMobileDevice);

      // Capture the viewport height
      const vh = window.innerHeight;
      setViewportHeight(vh);

      // Apply fixed height to main container on mobile
      if (isMobileDevice && mainContainerRef.current) {
        mainContainerRef.current.style.height = `${vh}px`;
      }
    };

    checkMobileAndViewport();

    // Set initial height
    if (mainContainerRef.current) {
      mainContainerRef.current.style.height = isMobile ? `${viewportHeight}px` : "100svh";
    }

    // Update on resize
    window.addEventListener("resize", checkMobileAndViewport);

    return () => {
      window.removeEventListener("resize", checkMobileAndViewport);
    };
  }, [isMobile, viewportHeight]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Focus the textarea on component mount (only on desktop)
  useEffect(() => {
    if (textareaRef.current && !isMobile) {
      textareaRef.current.focus();
    }
  }, [isMobile]);

  // Save the current selection state
  const saveSelectionState = () => {
    if (textareaRef.current) {
      selectionStateRef.current = {
        start: textareaRef.current.selectionStart,
        end: textareaRef.current.selectionEnd,
      };
    }
  };

  // Restore the saved selection state
  const restoreSelectionState = () => {
    const textarea = textareaRef.current;
    const { start, end } = selectionStateRef.current;

    if (textarea && start !== null && end !== null) {
      // Focus first, then set selection range
      textarea.focus();
      textarea.setSelectionRange(start, end);
    } else if (textarea) {
      // If no selection was saved, just focus
      textarea.focus();
    }
  };

  const focusTextarea = () => {
    if (textareaRef.current && !isMobile) {
      textareaRef.current.focus();
    }
  };

  const handleInputContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only focus if clicking directly on the container, not on buttons or other interactive elements
    if (
      e.target === e.currentTarget ||
      (e.currentTarget === inputContainerRef.current && !(e.target as HTMLElement).closest("button"))
    ) {
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: input,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setHasTyped(false);
    setIsLoading(true);

    // Capture request start time
    requestStartTimeRef.current = Date.now();

    // Create assistant message placeholder
    const assistantMessageId = (Date.now() + 1).toString();
    setMessages((prev) => [
      ...prev,
      { id: assistantMessageId, role: "assistant", content: "" },
    ]);

    // Single-line input: no textarea height management needed

    // Only focus the textarea on desktop, not on mobile
    if (!isMobile) {
      focusTextarea();
    } else {
      // On mobile, blur the textarea to dismiss the keyboard
      if (textareaRef.current) {
        textareaRef.current.blur();
      }
    }

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: messages
            .concat(userMessage)
            .map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      if (!response.ok || !response.body) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.trim()) continue;

          const colonIndex = line.indexOf(":");
          if (colonIndex === -1) continue;

          const type = line.substring(0, colonIndex);
          const data = line.substring(colonIndex + 1);

          if (type === "0") {
            // Text delta
            const textDelta = JSON.parse(data);
            fullText += textDelta;

            // Calculate thinking time on FIRST chunk only
            let thinkingTime: number | undefined = undefined;
            if (requestStartTimeRef.current !== null && fullText === textDelta) {
              // First chunk - calculate time from request to first response
              thinkingTime = Math.round((Date.now() - requestStartTimeRef.current) / 100) / 10;
              requestStartTimeRef.current = null; // Clear it
            }

            // Clear tool indicator once text starts streaming
            if (activeTool) {
              setActiveTool(null);
            }

            // Update the assistant message
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === assistantMessageId
                  ? {
                      ...msg,
                      content: fullText,
                      ...(thinkingTime !== undefined && { thinkingTime })
                    }
                  : msg
              )
            );
          } else if (type === "9") {
            // Tool event
            const toolData = JSON.parse(data);
            if (toolData.type === "tool_start") {
              setActiveTool(toolData.name);
            } else if (toolData.type === "tool_end") {
              setActiveTool(null);
            }
          }
        }
      }
    } catch (error) {
      console.error("Error:", error);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessageId
            ? { ...msg, content: "Sorry, there was an error. Please try again." }
            : msg
        )
      );
    } finally {
      setIsLoading(false);
      setActiveTool(null);
      requestStartTimeRef.current = null;
    }
  };

  const copyToClipboard = (text: string, messageId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMessageId(messageId);
    setTimeout(() => setCopiedMessageId(null), 1000); // Reset after 1 second
  };

  const toggleThumbsUp = (messageId: string) => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === messageId
          ? { ...msg, thumbsUp: !msg.thumbsUp, thumbsDown: false }
          : msg
      )
    );
  };

  const toggleThumbsDown = (messageId: string) => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === messageId
          ? { ...msg, thumbsDown: !msg.thumbsDown, thumbsUp: false }
          : msg
      )
    );
  };

  const getToolIcon = (toolName: string) => {
    switch (toolName) {
      case "file_search":
        return "🔍";
      case "web_search":
        return "🌐";
      case "transcribe_instagram_reel":
        return "📸";
      default:
        return "🔧";
    }
  };

  const getToolLabel = (toolName: string) => {
    switch (toolName) {
      case "file_search":
        return "Searching knowledge base";
      case "web_search":
        return "Searching the web";
      case "transcribe_instagram_reel":
        return "Transcribing Instagram reel";
      default:
        return `Using ${toolName}`;
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;

    // Only allow input changes when not streaming
    if (!isLoading) {
      setInput(newValue);

      if (newValue.trim() !== "" && !hasTyped) {
        setHasTyped(true);
      } else if (newValue.trim() === "" && hasTyped) {
        setHasTyped(false);
      }

      const textarea = textareaRef.current;
      if (textarea) {
        const MAX_HEIGHT = 384; // ~16 rows @24px per row
        textarea.style.height = "auto";
        const newHeight = Math.min(textarea.scrollHeight, MAX_HEIGHT);
        textarea.style.height = `${newHeight}px`;
        textarea.style.overflowY = textarea.scrollHeight > MAX_HEIGHT ? "auto" : "hidden";
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Submit on Enter (without Shift); allow Shift+Enter for newline
    if (!isLoading && e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const toggleButton = () => {
    if (!isLoading) {
      // Save the current selection state before toggling
      saveSelectionState();

      // Restore the selection state after toggling
      setTimeout(() => {
        restoreSelectionState();
      }, 0);
    }
  };

  return (
    <div
      ref={mainContainerRef}
      className="bg-[#0F0F0F] flex flex-col overflow-hidden"
      style={{ height: isMobile ? `${viewportHeight}px` : "100svh" }}
    >
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 h-12 flex items-center px-4 z-20">
        <div className="w-full flex items-center justify-between px-2">
          <Button variant="ghost" size="icon" className="rounded-full h-8 w-8">
            <Menu className="h-5 w-5 text-gray-400" />
            <span className="sr-only">Menu</span>
          </Button>

          <h1 className="text-base font-medium text-white">Jason's CoachGPT</h1>

          <Button variant="ghost" size="icon" className="rounded-full h-8 w-8">
            <PenSquare className="h-5 w-5 text-gray-400" />
            <span className="sr-only">New Chat</span>
          </Button>
        </div>
      </header>

      {/* Messages Container */}
      <div ref={chatContainerRef} className={cn(
        "flex-grow px-4 overflow-y-auto",
        messages.length === 0 ? "flex items-center justify-center" : "pb-32 pt-12"
      )}>
        <div className="max-w-3xl mx-auto space-y-4">
          {messages.length === 0 && (
            <div className="text-center">
              <h1 className="text-4xl font-bold mb-4 text-white">
                What can I help you create today?
              </h1>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8 max-w-2xl mx-auto">
                <button
                  onClick={() => setInput("✨ Give me proven hooks for my content")}
                  className="text-left p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors text-white"
                >
                  <div className="font-semibold mb-1">✨ Hook Templates</div>
                  <div className="text-sm text-white/60">Get proven hooks for your content</div>
                </button>
                <button
                  onClick={() => setInput("📋 Help me build my content calendar")}
                  className="text-left p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors text-white"
                >
                  <div className="font-semibold mb-1">📋 Content Strategy</div>
                  <div className="text-sm text-white/60">Build your content calendar</div>
                </button>
                <button
                  onClick={() => setInput("🎯 Help me define my ideal customer")}
                  className="text-left p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors text-white"
                >
                  <div className="font-semibold mb-1">🎯 ICP Framework</div>
                  <div className="text-sm text-white/60">Define your ideal customer</div>
                </button>
                <button
                  onClick={() => setInput("📝 Give me ready-to-use video scripts")}
                  className="text-left p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors text-white"
                >
                  <div className="font-semibold mb-1">📝 Script Templates</div>
                  <div className="text-sm text-white/60">Ready-to-use video scripts</div>
                </button>
              </div>
            </div>
          )}

          {messages.map((message) => (
            <div key={message.id} className={cn("flex flex-col", message.role === "user" ? "items-end" : "items-start")}>
              <div
                className={cn(
                  "max-w-[80%] px-4 py-3",
                  message.role === "user"
                    ? "rounded-[1.3rem] rounded-br-none bg-[#1C1C1C] text-white border border-white/10"
                    : "rounded-2xl text-white",
                )}
              >
                {message.role === "assistant" && message.thinkingTime != null && (
                  <div className="flex items-center gap-2 mb-3 text-sm text-gray-400">
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                      />
                    </svg>
                    <span className="leading-none">
                      Thought for{" "}
                      {message.thinkingTime >= 1
                        ? `${Math.round(message.thinkingTime)}s`
                        : `${message.thinkingTime.toFixed(1)}s`}
                    </span>
                  </div>
                )}

                {message.content ? (
                  message.role === "assistant" ? (
                    <div className="text-base leading-relaxed"><Response>{message.content}</Response></div>
                  ) : (
                    <span className="text-base leading-relaxed">{message.content}</span>
                  )
                ) : isLoading && message.role === "assistant" ? (
                  <div className="space-y-2">
                    {activeTool ? (
                      <div className="flex items-center gap-2">
                        <span className="flex-shrink-0">{getToolIcon(activeTool)}</span>
                        <ShimmeringText
                          text={getToolLabel(activeTool)}
                          duration={1.5}
                          className="text-base leading-relaxed"
                          color="rgb(156, 163, 175)"
                          shimmerColor="rgb(147, 197, 253)"
                          startOnView={false}
                        />
                      </div>
                    ) : (
                      <ShimmeringText
                        text="Thinking..."
                        duration={1.5}
                        className="text-base leading-relaxed"
                        color="rgb(156, 163, 175)"
                        shimmerColor="rgb(147, 197, 253)"
                        startOnView={false}
                      />
                    )}
                  </div>
                ) : null}
              </div>

              {/* Message actions */}
              {message.role === "assistant" && message.content && (
                <div className="flex items-center gap-2 mt-2 mb-2">
                  <button className="text-white/20 hover:text-gray-400 transition-colors p-1" title="Regenerate">
                    <RefreshCcw className="h-4 w-4" />
                  </button>
                  <button
                    className="text-white/20 hover:text-gray-400 transition-colors p-1"
                    onClick={() => copyToClipboard(message.content, message.id)}
                    title={copiedMessageId === message.id ? "Copied!" : "Copy"}
                  >
                    {copiedMessageId === message.id ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </button>
                  <button
                    className={cn(
                      "text-white/20 hover:text-gray-400 transition-colors p-1",
                      message.thumbsUp && "text-gray-400"
                    )}
                    onClick={() => toggleThumbsUp(message.id)}
                    title="Thumbs up"
                  >
                    <ThumbsUp className={cn("h-4 w-4", message.thumbsUp && "fill-current")} />
                  </button>
                  <button
                    className={cn(
                      "text-white/20 hover:text-gray-400 transition-colors p-1",
                      message.thumbsDown && "text-gray-400"
                    )}
                    onClick={() => toggleThumbsDown(message.id)}
                    title="Thumbs down"
                  >
                    <ThumbsDown className={cn("h-4 w-4", message.thumbsDown && "fill-current")} />
                  </button>
                </div>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Container */}
      <div className="fixed left-0 right-0 p-4 bottom-[1.5%]">
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
          <div
            ref={inputContainerRef}
            className={cn(
              "relative flex items-center w-full rounded-[1.7rem] border border-white/10 bg-[#1C1C1C] py-2.5 cursor-text min-h-[56px]",
              isLoading && "opacity-80",
            )}
            onClick={handleInputContainerClick}
          >
            {/* Plus button */}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute left-3 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full hover:bg-white/10 p-0"
              onClick={() => toggleButton()}
              disabled={isLoading}
              aria-label="Add"
            >
              <Plus className="h-5 w-5 text-gray-400" />
              <span className="sr-only">Add</span>
            </Button>

            {/* Input field (expandable textarea) */}
            <textarea
              ref={textareaRef}
              placeholder={isLoading ? "Waiting for response..." : "Ask anything"}
              rows={1}
              className="flex-1 bg-transparent text-white placeholder:text-gray-400 text-base border-0 outline-none focus:outline-none resize-none leading-relaxed max-h-96 overflow-hidden pr-20 pl-12 py-1.5"
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              onFocus={() => {
                if (textareaRef.current) {
                  textareaRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
                }
              }}
            />

            {/* Right controls anchored bottom-right */}
            <div className="absolute right-2 bottom-2 flex items-center gap-2">
              {/* Microphone button */}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 flex-shrink-0 rounded-full hover:bg-white/10 p-0"
                disabled={isLoading}
              >
                <Mic className="h-5 w-5 text-gray-400" />
                <span className="sr-only">Voice input</span>
              </Button>

              {/* Submit button */}
              <Button
                type="submit"
                variant="ghost"
                size="icon"
                className={cn(
                  "h-10 w-10 flex-shrink-0 rounded-full transition-all duration-200 shadow-lg",
                  hasTyped ? "bg-white hover:bg-white/90" : "bg-white/10 hover:bg-white/20",
                )}
                disabled={!input.trim() || isLoading}
              >
                {hasTyped ? (
                  <ArrowUp className="h-5 w-5 text-black" />
                ) : (
                  <AudioLines className="h-5 w-5 text-gray-400" />
                )}
                <span className="sr-only">Submit</span>
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default App;

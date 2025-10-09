import { ChatKit, useChatKit } from "@openai/chatkit-react";
import { useState, useEffect, useRef } from "react";
import {
  CHATKIT_API_DOMAIN_KEY,
  CHATKIT_API_URL,
  COMPOSER_PLACEHOLDER,
  GREETING,
  STARTER_PROMPTS,
} from "../lib/config";

type ChatKitPanelProps = {
  theme: "light" | "dark";
};

// Generate session ID outside component to ensure it's ready immediately
const getOrCreateSessionId = (): string => {
  let sid = sessionStorage.getItem('chatSessionId');
  if (!sid) {
    sid = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('chatSessionId', sid);
  }
  return sid;
};

export function ChatKitPanel({ theme }: ChatKitPanelProps) {
  const [integrationError, setIntegrationError] = useState<string | null>(null);
  const [toolActivity, setToolActivity] = useState<string[]>([]);
  const isMounted = useRef(true);
  // Get session ID immediately - don't wait for useEffect
  const sessionId = useRef(getOrCreateSessionId()).current;

  useEffect(() => {
    isMounted.current = true;
    
    if (import.meta.env.DEV) {
      console.log("[ChatKitPanel] Component mounted");
      console.log("[ChatKitPanel] Session ID:", sessionId);
      console.log("[ChatKitPanel] API URL:", `${CHATKIT_API_URL}?sid=${sessionId}`);
      console.log("[ChatKitPanel] Domain Key:", CHATKIT_API_DOMAIN_KEY);
      console.log("[ChatKitPanel] Session-based chat - history cleared on refresh");
    }
    
    return () => {
      isMounted.current = false;
    };
  }, [sessionId]);

  const chatkit = useChatKit({
    api: { 
      url: `${CHATKIT_API_URL}?sid=${sessionId}`, 
      domainKey: CHATKIT_API_DOMAIN_KEY
    },
    theme: {
      colorScheme: theme,
      color: {
        grayscale: {
          hue: 0,
          tint: 0,
          shade: -4,
        },
        accent: {
          primary: "#ffffff",
          level: 1,
        },
      },
      radius: "round",
    },
    startScreen: {
      greeting: GREETING,
      prompts: STARTER_PROMPTS,
    },
    composer: {
      placeholder: COMPOSER_PLACEHOLDER,
      attachments: {
        enabled: false, // Disable inline attachments, use Knowledge Base panel instead
      },
    },
    threadItemActions: {
      feedback: true, // Enable feedback on responses and tool calls
      retry: true,    // Allow retry of failed operations
    },
    onThreadChange: () => {
      if (import.meta.env.DEV) {
        console.debug("[ChatKitPanel] Thread changed");
      }
    },
    onResponseEnd: (response: any) => {
      if (import.meta.env.DEV) {
        console.debug("[ChatKitPanel] Response ended", response);
        console.log("[ChatKit] Tool calls made:", response.tool_calls);
        console.log("[ChatKit] Citations:", response.citations);
        
        // Log tool activity
        if (response.tool_calls && response.tool_calls.length > 0) {
          response.tool_calls.forEach((tool: any) => {
            setToolActivity(prev => [...prev, `✓ ${tool.type || 'Tool'}: ${tool.function?.name || 'unknown'}`]);
          });
          
          // Clear after 3 seconds
          setTimeout(() => {
            setToolActivity([]);
          }, 3000);
        }
      }
    },
    onError: ({ error }) => {
      // Always log errors to console with enhanced detail
      console.error("[ChatKitPanel] ChatKit error:", error);
      console.error("[ChatKitPanel] Error message:", error?.message);
      console.error("[ChatKitPanel] Error stack:", error?.stack);
      console.error("[ChatKitPanel] Full error object:", JSON.stringify(error, null, 2));
      
      if (isMounted.current) {
        // Show error message to user
        const errorMsg = error?.message || "Unknown error occurred";
        setIntegrationError(errorMsg);
      }
    },
  });

  return (
    <div className="flex-1 relative w-full overflow-hidden bg-[#0f0f0f]" style={{ minHeight: 0 }}>
      {/* Tool Activity Overlay - Shows real-time tool execution */}
      {import.meta.env.DEV && toolActivity.length > 0 && (
        <div className="absolute top-4 right-4 z-50 bg-gradient-to-br from-blue-900/90 to-purple-900/90 backdrop-blur-md border border-blue-500/30 rounded-xl p-4 shadow-2xl max-w-xs animate-in slide-in-from-top">
          <div className="flex items-center gap-2 mb-3">
            <div className="animate-pulse">⚡</div>
            <div className="font-semibold text-blue-100 text-sm">Agent Activity</div>
          </div>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {toolActivity.slice(-5).map((activity, i) => (
              <div key={i} className="text-xs text-blue-200 bg-black/20 rounded px-2 py-1 animate-in fade-in">
                {activity}
              </div>
            ))}
          </div>
        </div>
      )}
      
      {integrationError && (
        <div className="absolute top-4 left-4 right-4 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 z-20 sm:max-w-md safe-top">
          <div className="bg-red-900/95 backdrop-blur-sm border border-red-700/50 rounded-xl p-4 shadow-2xl">
            <div className="flex items-start gap-3">
              <svg
                className="h-5 w-5 text-red-300 flex-shrink-0 mt-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-red-100">Connection Error</h3>
                <p className="text-xs text-red-200 mt-1 break-words">{integrationError}</p>
                <p className="text-xs text-red-300/80 mt-2">Please check your connection</p>
              </div>
              <button
                onClick={() => setIntegrationError(null)}
                className="text-red-300 hover:text-red-100 transition-colors touch-manipulation p-1"
                aria-label="Dismiss error"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
      
      {chatkit.control ? (
        <div className="h-full w-full">
          <ChatKit control={chatkit.control} className="block h-full w-full" />
        </div>
      ) : (
        <div className="flex items-center justify-center h-full">
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-full border-2 border-gray-600 border-t-blue-500 animate-spin" />
            <div className="text-gray-400 text-sm">Loading ChatKit...</div>
          </div>
        </div>
      )}
    </div>
  );
}

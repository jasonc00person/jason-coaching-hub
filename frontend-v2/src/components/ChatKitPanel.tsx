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

export function ChatKitPanel({ theme }: ChatKitPanelProps) {
  const [integrationError, setIntegrationError] = useState<string | null>(null);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    if (import.meta.env.DEV) {
      console.log("[ChatKitPanel] Component mounted");
      console.log("[ChatKitPanel] API URL:", CHATKIT_API_URL);
      console.log("[ChatKitPanel] Domain Key:", CHATKIT_API_DOMAIN_KEY);
    }
    return () => {
      isMounted.current = false;
    };
  }, []);

  const chatkit = useChatKit({
    api: { 
      url: CHATKIT_API_URL, 
      domainKey: CHATKIT_API_DOMAIN_KEY 
    },
    theme: {
      colorScheme: theme,
      color: {
        grayscale: {
          hue: 220,
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
      feedback: false,
    },
    onThreadChange: () => {
      if (import.meta.env.DEV) {
        console.debug("[ChatKitPanel] Thread changed");
      }
    },
    onResponseEnd: (response) => {
      if (import.meta.env.DEV) {
        console.debug("[ChatKitPanel] Response ended", response);
        // Citations from File Search are automatically displayed by ChatKit
      }
    },
    onError: ({ error }) => {
      // Always log errors to console
      console.error("[ChatKitPanel] ChatKit error:", error);
      console.error("[ChatKitPanel] Error message:", error?.message);
      console.error("[ChatKitPanel] Error stack:", error?.stack);
      
      if (isMounted.current) {
        // Show error message to user
        const errorMsg = error?.message || "Unknown error occurred";
        setIntegrationError(errorMsg);
      }
    },
  });

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#161618]">
      {integrationError && (
        <div className="absolute top-4 left-4 right-4 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 z-20 sm:max-w-md">
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
        <ChatKit control={chatkit.control} className="block h-full w-full" />
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

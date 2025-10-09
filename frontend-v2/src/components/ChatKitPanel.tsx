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
      // ChatKit handles displaying the error to the user
      console.error("[ChatKitPanel] ChatKit error:", error);
      
      if (isMounted.current) {
        // Check if it's an integration error
        if (error.message?.includes("integration") || error.message?.includes("domain")) {
          setIntegrationError(
            "ChatKit integration error. Please check your domain key configuration."
          );
        }
      }
    },
  });

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#161618]">
      {integrationError && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-20 max-w-md">
          <div className="bg-red-900/90 border border-red-700 rounded-lg p-4 shadow-lg">
            <div className="flex items-start gap-3">
              <svg
                className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5"
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
              <div className="flex-1">
                <h3 className="text-sm font-medium text-red-200">Integration Error</h3>
                <p className="text-xs text-red-300 mt-1">{integrationError}</p>
              </div>
              <button
                onClick={() => setIntegrationError(null)}
                className="text-red-400 hover:text-red-300"
              >
                <svg
                  className="h-4 w-4"
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
      
      <ChatKit control={chatkit.control} className="block h-full w-full" />
    </div>
  );
}

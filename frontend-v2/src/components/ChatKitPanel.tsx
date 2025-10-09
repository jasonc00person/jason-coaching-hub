import { ChatKit, useChatKit } from "@openai/chatkit-react";
import { useState, useEffect, useRef } from "react";
import {
  CHATKIT_API_DOMAIN_KEY,
  CHATKIT_API_URL,
  COMPOSER_PLACEHOLDER,
  GREETING,
  STARTER_PROMPTS,
  FILE_UPLOAD_URL,
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
  const isMounted = useRef(true);
  // Get session ID immediately - don't wait for useEffect
  const sessionId = useRef(getOrCreateSessionId()).current;

  // ALWAYS log in production for debugging
  console.log("=== ChatKitPanel Initializing ===");
  console.log("Environment:", import.meta.env.MODE);
  console.log("Session ID:", sessionId);
  console.log("API URL:", `${CHATKIT_API_URL}?sid=${sessionId}`);
  console.log("Domain Key:", CHATKIT_API_DOMAIN_KEY);
  console.log("Theme:", theme);

  useEffect(() => {
    isMounted.current = true;
    console.log("[ChatKitPanel] Component mounted - useEffect running");
    
    return () => {
      isMounted.current = false;
      console.log("[ChatKitPanel] Component unmounting");
    };
  }, [sessionId]);

  console.log("[ChatKitPanel] Calling useChatKit hook...");
  
  const chatkit = useChatKit({
    api: { 
      url: `${CHATKIT_API_URL}?sid=${sessionId}`, 
      domainKey: CHATKIT_API_DOMAIN_KEY,
      // Don't specify uploadStrategy - let ChatKitServer handle it
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
        enabled: true,
        maxSize: 20 * 1024 * 1024, // 20MB per file
        maxCount: 5, // Up to 5 files per message
        accept: {
          // Images
          "image/*": [".png", ".jpg", ".jpeg", ".gif", ".webp"],
          // Documents
          "application/pdf": [".pdf"],
          "text/plain": [".txt"],
          "text/markdown": [".md"],
          // Other common formats
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
        },
      },
    },
    threadItemActions: {
      feedback: false,
    },
    // 🎨 Widgets: Handle interactive cards, forms, and lists
    widgets: {
      async onAction(action, widgetItem) {
        console.log("[ChatKit] Widget action triggered:", action, widgetItem);
        
        // Forward widget actions to backend
        try {
          await fetch(`${CHATKIT_API_URL.replace('/chatkit', '')}/api/widget-action`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              action, 
              widgetItemId: widgetItem.id,
              sessionId 
            }),
          });
        } catch (error) {
          console.error("[ChatKit] Failed to handle widget action:", error);
        }
      },
    },
    // 🏷️ Entity tagging: @mentions with autocomplete
    entities: {
      async onTagSearch(query) {
        console.log("[ChatKit] Entity search:", query);
        
        // Return sample entities - you can customize this to search your own data
        const allEntities = [
          { id: "content_strategy", title: "Content Strategy", group: "Topics", interactive: true },
          { id: "viral_hooks", title: "Viral Hooks", group: "Topics", interactive: true },
          { id: "monetization", title: "Monetization", group: "Topics", interactive: true },
          { id: "instagram", title: "Instagram Growth", group: "Platforms", interactive: true },
          { id: "tiktok", title: "TikTok Strategy", group: "Platforms", interactive: true },
          { id: "youtube", title: "YouTube Shorts", group: "Platforms", interactive: true },
        ];
        
        // Filter based on query
        if (!query) return allEntities;
        
        const lowerQuery = query.toLowerCase();
        return allEntities.filter(
          e => e.title.toLowerCase().includes(lowerQuery) || 
               e.group.toLowerCase().includes(lowerQuery)
        );
      },
      onClick(entity) {
        console.log("[ChatKit] Entity clicked:", entity);
        // You can trigger navigation, open modals, etc.
      },
      async onRequestPreview(entity) {
        console.log("[ChatKit] Entity preview requested:", entity);
        
        // Return a widget preview for hover tooltip (must be BasicRoot type)
        return {
          preview: {
            type: "Basic",
            direction: "col",
            gap: 8,
            padding: 12,
            children: [
              { 
                type: "Title", 
                value: entity.title, 
                size: "sm" 
              },
              { 
                type: "Caption", 
                value: `Category: ${entity.group}`,
                color: "secondary" 
              },
              {
                type: "Divider",
                spacing: 8
              },
              {
                type: "Text",
                value: "Click to learn more about this topic",
                size: "sm",
                color: "secondary"
              }
            ],
          },
        };
      },
    },
    // 🔧 Client tools: Agent triggers frontend-only actions
    async onClientTool(toolCall) {
      console.log("[ChatKit] Client tool called:", toolCall);
      
      // Handle client-side tool calls from the agent
      try {
        switch (toolCall.name) {
          case "open_link":
            // Example: Open a URL
            if (toolCall.params.url) {
              window.open(toolCall.params.url as string, '_blank');
              return { success: true, opened: toolCall.params.url };
            }
            break;
            
          case "copy_to_clipboard":
            // Example: Copy text to clipboard
            if (toolCall.params.text) {
              await navigator.clipboard.writeText(toolCall.params.text as string);
              return { success: true, copied: true };
            }
            break;
            
          case "show_notification":
            // Example: Show browser notification
            if (toolCall.params.message) {
              alert(toolCall.params.message); // You could use a toast library here
              return { success: true };
            }
            break;
            
          default:
            console.warn(`[ChatKit] Unknown client tool: ${toolCall.name}`);
            return { success: false, error: "Unknown tool" };
        }
      } catch (error) {
        console.error(`[ChatKit] Client tool error:`, error);
        return { success: false, error: String(error) };
      }
      
      return { success: false, error: "No action taken" };
    },
    onThreadChange: () => {
      console.log("[ChatKitPanel] Thread changed");
    },
    onResponseEnd: (response) => {
      console.log("[ChatKitPanel] Response ended", response);
    },
    onError: ({ error }) => {
      // Always log errors to console
      console.error("❌ [ChatKitPanel] ChatKit ERROR:", error);
      console.error("Error message:", error?.message);
      console.error("Error stack:", error?.stack);
      console.error("Full error object:", JSON.stringify(error, null, 2));
      
      if (isMounted.current) {
        // Show error message to user
        const errorMsg = error?.message || "Unknown error occurred";
        setIntegrationError(errorMsg);
      }
    },
  });

  console.log("[ChatKitPanel] useChatKit returned:", {
    hasControl: !!chatkit.control,
    control: chatkit.control,
    chatkitKeys: Object.keys(chatkit)
  });

  return (
    <div className="flex-1 relative w-full overflow-hidden bg-[#0f0f0f]" style={{ minHeight: 0 }}>
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

import { makeAssistantToolUI } from "@assistant-ui/react";

export const ToolFallback = makeAssistantToolUI({
  toolName: "*",
  render: function ToolFallback({ part }: any) {
    return (
      <p className="mb-4 mt-2 text-sm">
        Tool execution:{" "}
        <code className="inline-block rounded bg-muted px-1 py-0.5 font-mono text-xs">
          {part.toolName}
        </code>
      </p>
    );
  },
});


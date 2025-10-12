import { makeAssistantToolUI } from "@assistant-ui/react";
import { MarkdownTextPrimitive } from "@assistant-ui/react-markdown";
import remarkGfm from "remark-gfm";

export const MarkdownText = makeAssistantToolUI({
  toolName: "*",
  render: ({ part }: any) => {
    const MarkdownComponent = MarkdownTextPrimitive as any;
    return (
      <MarkdownComponent remarkPlugins={[remarkGfm]}>
        {part.text}
      </MarkdownComponent>
    );
  },
});


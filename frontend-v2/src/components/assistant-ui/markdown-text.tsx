import { makeAssistantToolUI } from "@assistant-ui/react";
import { MarkdownTextPrimitive } from "@assistant-ui/react-markdown";
import remarkGfm from "remark-gfm";

export const MarkdownText = makeAssistantToolUI({
  toolName: "*",
  render: ({ part }) => (
    <MarkdownTextPrimitive text={part.text} remarkPlugins={[remarkGfm]} />
  ),
});


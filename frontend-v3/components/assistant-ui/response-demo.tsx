"use client";

import { useState, useEffect, type FC } from "react";
import { Response } from "@/components/ui/response";
import { Button } from "@/components/ui/button";

const demoText = `# Streaming Response Demo

This is a **live demonstration** of the streaming markdown renderer with smooth character-by-character animations.

## Key Features

- Smooth streaming animations
- Full markdown support
- Optimized for AI responses
- Beautiful typography

### Code Example

Here's a simple JavaScript snippet:

\`\`\`javascript
const greeting = "Hello, world!"
console.log(greeting)
\`\`\`

### Lists Work Too

- First item with **bold** text
- Second item with *italic* text
- Third item with [links](https://example.com)

> This is a blockquote with streaming support!

---

The streaming effect makes the response feel more natural and engaging, just like a real conversation.`;

export const ResponseDemo: FC = () => {
  const [streamedText, setStreamedText] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const startStreaming = () => {
    setStreamedText("");
    setCurrentIndex(0);
    setIsStreaming(true);
  };

  const resetDemo = () => {
    setIsStreaming(false);
    setStreamedText("");
    setCurrentIndex(0);
  };

  useEffect(() => {
    if (!isStreaming || currentIndex >= demoText.length) {
      if (currentIndex >= demoText.length) {
        setIsStreaming(false);
      }
      return;
    }

    // Stream characters at a realistic rate (similar to AI streaming)
    const timeout = setTimeout(() => {
      setStreamedText(demoText.slice(0, currentIndex + 1));
      setCurrentIndex(currentIndex + 1);
    }, 20); // 20ms per character for smooth streaming

    return () => clearTimeout(timeout);
  }, [isStreaming, currentIndex]);

  return (
    <div className="flex h-full flex-col">
      <div className="border-b p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Response Component Demo</h2>
          <div className="flex gap-2">
            <Button
              onClick={startStreaming}
              disabled={isStreaming}
              variant="default"
              size="sm"
            >
              {isStreaming ? "Streaming..." : "Start Demo"}
            </Button>
            <Button
              onClick={resetDemo}
              disabled={!streamedText}
              variant="outline"
              size="sm"
            >
              Reset
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-2xl">
          {streamedText ? (
            <div className="rounded-lg border bg-card p-6 shadow-sm">
              <Response>{streamedText}</Response>
            </div>
          ) : (
            <div className="flex h-64 items-center justify-center rounded-lg border border-dashed">
              <p className="text-muted-foreground text-sm">
                Click "Start Demo" to see the streaming response in action
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};


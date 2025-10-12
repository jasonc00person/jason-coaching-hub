"use client";

import { memo } from "react";
import { Streamdown } from "streamdown";
import { cn } from "@/lib/utils";

interface ResponseProps extends React.ComponentProps<typeof Streamdown> {
  children?: React.ReactNode;
  className?: string;
}

/**
 * Response component for streaming markdown with smooth character-by-character animations.
 * Built on top of streamdown for smooth markdown streaming animations.
 */
const ResponseComponent = ({ children, className, ...props }: ResponseProps) => {
  return (
    <Streamdown
      className={cn(
        // Remove top margin from first child and bottom margin from last child
        "[&>*:first-child]:mt-0 [&>*:last-child]:mb-0",
        className
      )}
      {...props}
    >
      {children}
    </Streamdown>
  );
};

/**
 * Memoized Response component to prevent unnecessary re-renders.
 * Only updates when children change.
 */
export const Response = memo(ResponseComponent);


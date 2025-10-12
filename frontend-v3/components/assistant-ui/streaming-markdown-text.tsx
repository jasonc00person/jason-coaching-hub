"use client";

import { Response } from "@/components/ui/response";
import { memo, type FC } from "react";
import { cn } from "@/lib/utils";

interface StreamingMarkdownTextProps {
  children?: React.ReactNode;
  className?: string;
}

/**
 * StreamingMarkdownText component for smooth character-by-character streaming.
 * Uses the Response component with Streamdown for smooth animations.
 */
const StreamingMarkdownTextImpl: FC<StreamingMarkdownTextProps> = ({
  children,
  className,
}) => {
  return (
    <Response
      className={cn(
        // Base markdown styling
        "prose prose-sm dark:prose-invert max-w-none",
        // Headings
        "[&_h1]:mb-8 [&_h1]:scroll-m-20 [&_h1]:text-4xl [&_h1]:font-extrabold [&_h1]:tracking-tight [&_h1:last-child]:mb-0",
        "[&_h2]:mb-4 [&_h2]:mt-8 [&_h2]:scroll-m-20 [&_h2]:text-3xl [&_h2]:font-semibold [&_h2]:tracking-tight [&_h2:first-child]:mt-0 [&_h2:last-child]:mb-0",
        "[&_h3]:mb-4 [&_h3]:mt-6 [&_h3]:scroll-m-20 [&_h3]:text-2xl [&_h3]:font-semibold [&_h3]:tracking-tight [&_h3:first-child]:mt-0 [&_h3:last-child]:mb-0",
        "[&_h4]:mb-4 [&_h4]:mt-6 [&_h4]:scroll-m-20 [&_h4]:text-xl [&_h4]:font-semibold [&_h4]:tracking-tight [&_h4:first-child]:mt-0 [&_h4:last-child]:mb-0",
        "[&_h5]:my-4 [&_h5]:text-lg [&_h5]:font-semibold [&_h5:first-child]:mt-0 [&_h5:last-child]:mb-0",
        "[&_h6]:my-4 [&_h6]:font-semibold [&_h6:first-child]:mt-0 [&_h6:last-child]:mb-0",
        // Paragraphs
        "[&_p]:mb-5 [&_p]:mt-5 [&_p]:leading-7 [&_p:first-child]:mt-0 [&_p:last-child]:mb-0",
        // Links
        "[&_a]:text-primary [&_a]:font-medium [&_a]:underline [&_a]:underline-offset-4",
        // Lists
        "[&_ul]:my-5 [&_ul]:ml-6 [&_ul]:list-disc [&_ul_li]:mt-2",
        "[&_ol]:my-5 [&_ol]:ml-6 [&_ol]:list-decimal [&_ol_li]:mt-2",
        // Blockquotes
        "[&_blockquote]:border-l-2 [&_blockquote]:pl-6 [&_blockquote]:italic",
        // Horizontal rules
        "[&_hr]:my-5 [&_hr]:border-b",
        // Tables
        "[&_table]:my-5 [&_table]:w-full [&_table]:border-separate [&_table]:border-spacing-0",
        "[&_th]:bg-muted [&_th]:px-4 [&_th]:py-2 [&_th]:text-left [&_th]:font-bold [&_th:first-child]:rounded-tl-lg [&_th:last-child]:rounded-tr-lg",
        "[&_td]:border-b [&_td]:border-l [&_td]:px-4 [&_td]:py-2 [&_td]:text-left [&_td:last-child]:border-r",
        "[&_tr]:m-0 [&_tr]:border-b [&_tr]:p-0 [&_tr:first-child]:border-t",
        // Code blocks
        "[&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-black [&_pre]:p-4 [&_pre]:text-white",
        "[&_code]:bg-muted [&_code]:rounded [&_code]:border [&_code]:font-semibold",
        "[&_pre_code]:bg-transparent [&_pre_code]:border-0",
        // Superscript (for footnotes)
        "[&_sup]:text-xs [&_sup_a]:text-xs [&_sup_a]:no-underline",
        className
      )}
    >
      {children}
    </Response>
  );
};

export const StreamingMarkdownText = memo(StreamingMarkdownTextImpl);


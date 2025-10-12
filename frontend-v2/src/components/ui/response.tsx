import { memo } from "react";
import { Streamdown } from "streamdown";

import { cn } from "@/lib/utils";

interface ResponseProps {
  children?: string;
  className?: string;
}

export const Response = memo(
  ({ children, className, ...props }: ResponseProps) => {
    return (
      <Streamdown
        {...props}
        className={cn(
          // Reset margins
          "[&>*:first-child]:mt-0 [&>*:last-child]:mb-0",
          
          // Paragraphs
          "[&_p]:my-3 [&_p]:leading-relaxed",
          
          // Headings
          "[&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mt-6 [&_h1]:mb-3",
          "[&_h2]:text-xl [&_h2]:font-bold [&_h2]:mt-5 [&_h2]:mb-2",
          "[&_h3]:text-lg [&_h3]:font-semibold [&_h3]:mt-4 [&_h3]:mb-2",
          
          // Lists
          "[&_ul]:my-3 [&_ul]:ml-6 [&_ul]:list-disc [&_ul]:space-y-1",
          "[&_ol]:my-3 [&_ol]:ml-6 [&_ol]:list-decimal [&_ol]:space-y-1",
          "[&_li]:leading-relaxed",
          
          // Links
          "[&_a]:text-blue-400 [&_a]:underline [&_a]:hover:text-blue-300",
          
          // Inline code
          "[&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:bg-white/10 [&_code]:text-blue-300 [&_code]:text-sm [&_code]:font-mono",
          
          // Code blocks
          "[&_pre]:my-4 [&_pre]:p-4 [&_pre]:rounded-lg [&_pre]:bg-[#1e1e1e] [&_pre]:border [&_pre]:border-white/10 [&_pre]:overflow-x-auto",
          "[&_pre_code]:p-0 [&_pre_code]:bg-transparent [&_pre_code]:text-gray-200 [&_pre_code]:text-sm [&_pre_code]:leading-relaxed",
          
          // Blockquotes
          "[&_blockquote]:border-l-4 [&_blockquote]:border-white/20 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:my-3 [&_blockquote]:text-white/80",
          
          // Horizontal rules
          "[&_hr]:my-6 [&_hr]:border-t [&_hr]:border-white/10",
          
          // Tables
          "[&_table]:w-full [&_table]:my-4 [&_table]:border-collapse",
          "[&_th]:border [&_th]:border-white/10 [&_th]:px-3 [&_th]:py-2 [&_th]:bg-white/5 [&_th]:font-semibold [&_th]:text-left",
          "[&_td]:border [&_td]:border-white/10 [&_td]:px-3 [&_td]:py-2",
          
          className
        )}
      >
        {children}
      </Streamdown>
    );
  }
);

Response.displayName = "Response";


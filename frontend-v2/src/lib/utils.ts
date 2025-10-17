import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateConversationTitle(text: string): string {
  if (!text) return "New conversation";
  
  // Remove extra whitespace and newlines
  const cleaned = text.trim().replace(/\s+/g, ' ');
  
  // Limit to 50 characters
  const maxLength = 50;
  if (cleaned.length <= maxLength) {
    return cleaned;
  }
  
  // Truncate at word boundary
  const truncated = cleaned.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  
  // If we can break at a word boundary, do it
  if (lastSpace > maxLength * 0.6) {
    return truncated.substring(0, lastSpace) + '...';
  }
  
  return truncated + '...';
}


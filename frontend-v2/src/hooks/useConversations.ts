import { useState, useEffect } from "react";

export type Conversation = {
  id: string;
  title: string;
  timestamp: number;
};

export function useConversations() {
  const [conversations, setConversations] = useState<Conversation[]>(() => {
    try {
      const stored = localStorage.getItem("chatkit_conversations");
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error("Failed to load conversations from localStorage:", error);
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("chatkit_conversations", JSON.stringify(conversations));
    } catch (error) {
      console.error("Failed to save conversations to localStorage:", error);
    }
  }, [conversations]);

  const addConversation = (threadId: string, title: string = "New conversation") => {
    setConversations((prev) => {
      const exists = prev.find((c) => c.id === threadId);
      if (exists) return prev;
      return [{ id: threadId, title, timestamp: Date.now() }, ...prev];
    });
  };

  const updateTitle = (threadId: string, title: string) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === threadId ? { ...c, title } : c))
    );
  };

  const removeConversation = (threadId: string) => {
    setConversations((prev) => prev.filter((c) => c.id !== threadId));
  };

  return { conversations, addConversation, updateTitle, removeConversation };
}


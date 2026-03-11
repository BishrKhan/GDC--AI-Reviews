/**
 * Custom hook for LLM chat operations
 */

import { useState, useCallback } from "react";
import { getLLMResponse, Product, ComparisonResult } from "@/lib/mockApi";
import { useAppStore } from "@/lib/store";
import { getSessionUserId } from "@/lib/session";
import { requestJson } from "@/lib/api";

interface ChatApiResponse {
  assistant_message: string;
  thread: {
    id: string;
    title: string;
    messages: Array<{
      id: string;
      role: "user" | "assistant";
      content: string;
      timestamp: number;
    }>;
    createdAt: number;
    updatedAt: number;
  };
  products: Product[];
  comparison: ComparisonResult | null;
}

export function useChat() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(
    async (message: string, context?: { selectedProducts?: string[]; interests?: string[] }): Promise<string> => {
      try {
        setLoading(true);
        setError(null);
        const state = useAppStore.getState();

        try {
          const response = await requestJson<ChatApiResponse>(`/api/users/${getSessionUserId()}/chat`, {
            method: "POST",
            body: JSON.stringify({
              thread_id: state.currentThread?.id,
              title: state.currentThread?.title || "New Conversation",
              message,
              selected_product_ids: context?.selectedProducts || [],
              interests: context?.interests || [],
            }),
          });

          state.replaceThread(response.thread);
          state.setChatProducts(response.products || []);
          return response.assistant_message;
        } catch {
          const fallback = await getLLMResponse(message, context);
          return fallback;
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Failed to send message";
        setError(errorMsg);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return { sendMessage, loading, error };
}

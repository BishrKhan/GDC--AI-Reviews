/**
 * Custom hook for LLM chat operations
 */

import { useState, useCallback } from "react";
import { getLLMResponse } from "@/lib/mockApi";
import { ChatMessage } from "@/lib/store";

export function useChat() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(
    async (message: string, context?: { selectedProducts?: string[]; interests?: string[] }): Promise<string> => {
      try {
        setLoading(true);
        setError(null);
        const response = await getLLMResponse(message, context);
        return response;
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

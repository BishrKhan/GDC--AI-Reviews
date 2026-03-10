/**
 * BottomBar Component
 * Fixed bottom bar with LLM textarea and send button
 * DESIGN: White background, green send button, always visible
 */

import { useState, useRef, useEffect } from "react";
import { Send, Mic } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useChat } from "@/hooks/useChat";
import { useAppStore } from "@/lib/store";

interface BottomBarProps {
  onSendMessage?: (message: string, response: string) => void;
}

export default function BottomBar({ onSendMessage }: BottomBarProps) {
  const [message, setMessage] = useState("");
  const [rows, setRows] = useState(2);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { sendMessage, loading } = useChat();
  const { selectedProducts, user } = useAppStore();

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      const newHeight = Math.min(
        textareaRef.current.scrollHeight,
        200 // Max height before scrolling
      );
      textareaRef.current.style.height = `${newHeight}px`;
    }
  }, [message]);

  const handleSend = async () => {
    if (!message.trim() || loading) return;

    const userMessage = message;
    setMessage("");

    try {
      const response = await sendMessage(userMessage, {
        selectedProducts,
        interests: user.interests,
      });

      if (onSendMessage) {
        onSendMessage(userMessage, response);
      }
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="fixed bottom-0 left-0 md:left-64 right-0 bg-card border-t border-border shadow-lg z-30">
      <div className="max-w-6xl mx-auto px-4 py-4">
        <div className="flex gap-3 items-end">
          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Compare products, ask reviews, or anything..."
            className="flex-1 px-4 py-3 rounded-lg bg-secondary text-foreground
              placeholder:text-muted-foreground
              border border-border focus:border-primary focus:outline-none
              resize-none max-h-48 text-base leading-relaxed"
            rows={rows}
          />

          {/* Voice Button (Placeholder) */}
          <button
            className="p-3 rounded-lg bg-secondary text-muted-foreground
              hover:text-foreground transition-colors duration-200
              flex items-center justify-center"
            aria-label="Voice input (coming soon)"
            title="Voice input coming soon"
          >
            <Mic size={20} />
          </button>

          {/* Send Button */}
          <Button
            onClick={handleSend}
            disabled={!message.trim() || loading}
            className="px-6 py-3 bg-primary text-primary-foreground hover:bg-primary/90
              disabled:opacity-50 disabled:cursor-not-allowed
              flex items-center gap-2 font-semibold"
          >
            <Send size={18} />
            <span className="hidden sm:inline">Send</span>
          </Button>
        </div>

        {/* Character count (optional) */}
        <p className="text-xs text-muted-foreground mt-2">
          {message.length} characters
        </p>
      </div>
    </div>
  );
}

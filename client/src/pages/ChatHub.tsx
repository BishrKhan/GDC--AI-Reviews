/**
 * Chat Hub Page
 * Functional LLM chat with product cards and comparisons
 * DESIGN: User right, AI left, green accents, real-time responses
 */

import { useEffect, useRef } from "react";
import { useAppStore } from "@/lib/store";
import { useTrendingProducts } from "@/hooks/useProducts";
import AppLayout from "@/components/AppLayout";
import ProductGrid from "@/components/ProductGrid";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bot, User } from "lucide-react";

interface ChatHubProps {
  onNavigate?: (page: string) => void;
}

export default function ChatHub({ onNavigate }: ChatHubProps) {
  const { currentThread, createThread, addMessage, user, setCurrentPage, chatProducts } = useAppStore();
  const { products } = useTrendingProducts(8);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Create initial thread if none exists
  useEffect(() => {
    if (!currentThread) {
      createThread("New Conversation");
    }
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [currentThread?.messages]);

  const handleSendMessage = (userMessage: string, aiResponse: string) => {
    if (!currentThread) return;

    // Add user message
    addMessage({
      id: `msg-${Date.now()}`,
      role: "user",
      content: userMessage,
      timestamp: Date.now(),
    });

    // Add AI response
    setTimeout(() => {
      addMessage({
        id: `msg-${Date.now() + 1}`,
        role: "assistant",
        content: aiResponse,
        timestamp: Date.now(),
      });
    }, 300);
  };

  return (
    <AppLayout onNavigate={onNavigate} onSendMessage={handleSendMessage}>
      <div className="space-y-8">
        {/* Chat Area */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-foreground">Chat</h2>

          <ScrollArea className="h-96 border border-border rounded-lg p-4 bg-card">
            <div className="space-y-4">
              {currentThread?.messages && currentThread.messages.length > 0 ? (
                currentThread.messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex gap-3 ${
                      msg.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    {msg.role === "assistant" && (
                      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                        <Bot size={18} className="text-primary-foreground" />
                      </div>
                    )}

                    <div
                      className={`max-w-xs px-4 py-3 rounded-lg ${
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground rounded-br-none"
                          : "bg-secondary text-foreground rounded-bl-none"
                      }`}
                    >
                      <p className="text-sm leading-relaxed">{msg.content}</p>
                      <p
                        className={`text-xs mt-2 ${
                          msg.role === "user"
                            ? "text-primary-foreground/70"
                            : "text-muted-foreground"
                        }`}
                      >
                        {new Date(msg.timestamp).toLocaleTimeString()}
                      </p>
                    </div>

                    {msg.role === "user" && (
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                        <User size={18} className="text-foreground" />
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <p className="text-center">
                    Start a conversation by asking about products or comparisons!
                  </p>
                </div>
              )}
              <div ref={scrollRef} />
            </div>
          </ScrollArea>
        </div>

        {/* Search Results */}
        {chatProducts.length > 0 ? (
          <div className="space-y-3">
            <div>
              <h2 className="text-2xl font-bold text-foreground">Search Results</h2>
              <p className="text-sm text-muted-foreground">
                These product cards come from the latest shopping search.
              </p>
            </div>
            <ProductGrid
              products={chatProducts}
              title="Product Matches"
              onNavigateToComparison={() => {
                setCurrentPage("comparison");
                if (onNavigate) {
                  onNavigate("comparison");
                }
              }}
            />
          </div>
        ) : (
          <ProductGrid
            products={products}
            title="Featured Products"
            onNavigateToComparison={() => {
              setCurrentPage("comparison");
              if (onNavigate) {
                onNavigate("comparison");
              }
            }}
          />
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-6 bg-card rounded-lg border border-border">
            <h3 className="font-semibold text-foreground mb-2">
              Compare Products
            </h3>
            <p className="text-sm text-muted-foreground">
              Select 2-4 products above and ask me to compare them
            </p>
          </div>
          <div className="p-6 bg-card rounded-lg border border-border">
            <h3 className="font-semibold text-foreground mb-2">
              Get Recommendations
            </h3>
            <p className="text-sm text-muted-foreground">
              Tell me what you're looking for and I'll suggest the best options
            </p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

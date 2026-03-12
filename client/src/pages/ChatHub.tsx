import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Bot, Send, Sparkles, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useProductsByIds } from "@/hooks/useProducts";
import { useChat } from "@/hooks/useChat";
import { useAppStore } from "@/lib/store";

interface ChatHubProps {
  onNavigate?: (page: string) => void;
}

export default function ChatHub({ onNavigate }: ChatHubProps) {
  const [message, setMessage] = useState("");
  const { currentThread, user, selectedProducts, clearSelection, setCurrentPage } = useAppStore();
  const { products: shortlistedProducts } = useProductsByIds(selectedProducts);
  const { sendMessage, loading, error } = useChat();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [currentThread?.messages]);

  const handleSend = async () => {
    if (!message.trim() || loading) {
      return;
    }

    const outgoingMessage = message.trim();
    setMessage("");

    try {
      await sendMessage(outgoingMessage, {
        selectedProducts,
        interests: user.interests,
      });
    } catch {
      // Error state is surfaced in the panel below.
    }
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,_#f6f9fc_0%,_#ffffff_100%)] px-4 py-6 text-foreground sm:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-3rem)] max-w-7xl gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="rounded-[28px] border border-slate-200 bg-slate-950 p-5 text-white shadow-[0_18px_60px_rgba(15,23,42,0.18)] sm:p-6">
          <button
            type="button"
            onClick={() => {
              setCurrentPage("catalog");
              if (onNavigate) {
                onNavigate("catalog");
              }
            }}
            className="inline-flex items-center gap-2 text-sm text-slate-300 transition hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to catalog
          </button>

          <div className="mt-6 rounded-[24px] bg-white/5 p-5">
            <p className="text-xs uppercase tracking-[0.3em] text-sky-200/80">Context</p>
            <h1 className="mt-3 text-2xl font-semibold tracking-tight">Shopping chat</h1>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              Ask for a winner, tradeoffs, review summary, or a recommendation based on your shortlist.
            </p>
          </div>

          <div className="mt-6 space-y-3">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Selected products</p>
            {shortlistedProducts.length > 0 ? (
              shortlistedProducts.map((product) => (
                <div key={product.id} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  <p className="text-sm font-medium text-white">{product.name}</p>
                  <p className="mt-1 text-xs text-slate-400">{product.brand} · ${product.price}</p>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-white/15 px-4 py-6 text-sm text-slate-400">
                No products selected. You can still chat, but the answers will be less focused.
              </div>
            )}
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={clearSelection}
            className="mt-6 h-11 w-full rounded-full border-white/15 bg-transparent text-white hover:bg-white/5"
          >
            Clear shortlist
          </Button>
        </aside>

        <main className="flex min-h-0 flex-col rounded-[28px] border border-white/80 bg-white/90 shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur">
          <div className="border-b border-slate-200 px-5 py-5 sm:px-6">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-100 text-sky-700">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Ask about your shortlist</h2>
                <p className="mt-1 text-sm text-slate-500">Example: Which one is best under my budget? Summarize reviews. What are the tradeoffs?</p>
              </div>
            </div>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5 sm:px-6">
            {currentThread?.messages && currentThread.messages.length > 0 ? (
              currentThread.messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {msg.role === "assistant" ? (
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-sky-100 text-sky-700">
                      <Bot className="h-5 w-5" />
                    </div>
                  ) : null}

                  <div
                    className={`max-w-3xl rounded-[24px] px-4 py-3 text-sm leading-7 shadow-sm ${
                      msg.role === "user"
                        ? "bg-slate-950 text-white"
                        : "border border-slate-200 bg-slate-50 text-slate-800"
                    }`}
                  >
                    <p>{msg.content}</p>
                    <p className={`mt-2 text-xs ${msg.role === "user" ? "text-slate-300" : "text-slate-400"}`}>
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </p>
                  </div>

                  {msg.role === "user" ? (
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-200 text-slate-700">
                      <User className="h-5 w-5" />
                    </div>
                  ) : null}
                </div>
              ))
            ) : (
              <div className="flex h-full min-h-[320px] items-center justify-center rounded-[24px] border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
                <div className="max-w-xl">
                  <h3 className="text-xl font-semibold text-slate-900">Start the decision conversation</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-500">
                    The API is already wired for search and chat. This screen now starts where it should: after you have a shortlist and need help deciding.
                  </p>
                </div>
              </div>
            )}

            {error ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
            ) : null}
            <div ref={scrollRef} />
          </div>

          <div className="border-t border-slate-200 px-5 py-5 sm:px-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <textarea
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    void handleSend();
                  }
                }}
                placeholder="Ask about the selected products"
                className="min-h-28 flex-1 resize-none rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-900 outline-none transition focus:border-sky-400"
              />
              <Button
                type="button"
                onClick={() => void handleSend()}
                disabled={!message.trim() || loading}
                className="h-12 rounded-full bg-sky-600 px-6 text-white hover:bg-sky-700 disabled:bg-slate-300"
              >
                <Send className="mr-2 h-4 w-4" />
                {loading ? "Thinking..." : "Send"}
              </Button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

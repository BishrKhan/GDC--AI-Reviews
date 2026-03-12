import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Bot, ExternalLink, Send, Sparkles, User } from "lucide-react";
import { Streamdown } from "streamdown";
import ChatComparisonWidget from "@/components/ChatComparisonWidget";
import { Button } from "@/components/ui/button";
import { useProductsByIds } from "@/hooks/useProducts";
import { useChat } from "@/hooks/useChat";
import { useAppStore } from "@/lib/store";

interface ChatHubProps {
  onNavigate?: (page: string) => void;
}

function normalizeAssistantMarkdown(content: string) {
  return content.replace(/\n/g, "  \n");
}

export default function ChatHub({ onNavigate }: ChatHubProps) {
  const [message, setMessage] = useState("");
  const [activePanel, setActivePanel] = useState<"chat" | "comparison">("chat");
  const { currentThread, user, selectedProducts, clearSelection, setCurrentPage, chatProducts, chatComparison } = useAppStore();
  const { products: shortlistedProducts } = useProductsByIds(selectedProducts);
  const { sendMessage, loading, error } = useChat();
  const scrollRef = useRef<HTMLDivElement>(null);
  const previewProducts = chatProducts.length > 0 ? chatProducts : shortlistedProducts;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [currentThread?.messages]);

  useEffect(() => {
    if (chatComparison && (!currentThread?.messages || currentThread.messages.length === 0)) {
      setActivePanel("comparison");
    }
  }, [chatComparison, currentThread?.messages]);

  const handleSend = async () => {
    if (!message.trim() || loading) {
      return;
    }

    const outgoingMessage = message.trim();
    setMessage("");
    setActivePanel("chat");

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
    <div className="min-h-screen bg-[linear-gradient(180deg,_#f7fcf3_0%,_#ffffff_100%)] px-4 py-6 text-foreground sm:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-3rem)] max-w-7xl gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="rounded-[28px] border border-[#d7efcf] bg-[linear-gradient(180deg,_#f7fcf3_0%,_#eefbe7_100%)] p-5 text-slate-900 shadow-[0_18px_60px_rgba(44,219,4,0.10)] sm:p-6">
          <button
            type="button"
            onClick={() => {
              setCurrentPage("catalog");
              if (onNavigate) {
                onNavigate("catalog");
              }
            }}
            className="inline-flex items-center gap-2 text-sm text-slate-600 transition hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to catalog
          </button>

          <div className="mt-6 rounded-[24px] border border-[#d7efcf] bg-white/70 p-5">
            <p className="text-xs uppercase tracking-[0.3em] text-[#2cdb04]">Context</p>
            <h1 className="mt-3 text-2xl font-semibold tracking-tight">Shopping chat</h1>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Ask for a winner, tradeoffs, review summary, or a recommendation based on your shortlist.
            </p>
          </div>

          <div className="mt-6 space-y-3">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Selected products</p>
            {previewProducts.length > 0 ? (
              previewProducts.map((product) => {
                const isWinner = product.id === chatComparison?.winner;
                return (
                  <div
                    key={product.id}
                    className={`overflow-hidden rounded-2xl border bg-white/90 shadow-sm ${
                      isWinner ? "border-[#2cdb04] ring-2 ring-[#2cdb04]/20" : "border-[#d7efcf]"
                    }`}
                  >
                    <div className="grid grid-cols-[96px_minmax(0,1fr)]">
                      <div className="min-h-24 overflow-hidden bg-[#eefbe7]">
                        <img
                          src={product.image}
                          alt={product.name}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      </div>
                      <div className="min-w-0 space-y-2 px-4 py-3">
                        <div className="min-w-0">
                          {isWinner ? (
                            <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#1f7e05]">
                              Preferred choice
                            </p>
                          ) : null}
                          <div>
                            <p className="line-clamp-2 text-sm font-medium leading-5 text-slate-900">{product.name}</p>
                            <p className="mt-1 truncate text-xs text-slate-500">{product.brand} · ${product.price}</p>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                          <span>{product.rating.toFixed(1)}/5</span>
                          <span>·</span>
                          <span>{product.reviewCount ?? 0} reviews</span>
                        </div>
                        <a
                          href={product.amazonLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-xs font-medium text-[#1f7e05] hover:text-[#165a03]"
                        >
                          Open listing
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="rounded-2xl border border-dashed border-[#b9dfad] bg-white/55 px-4 py-6 text-sm text-slate-500">
                No products selected. You can still chat, but the answers will be less focused.
              </div>
            )}
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={clearSelection}
            className="mt-6 h-11 w-full rounded-full border-[#b9dfad] bg-white/75 text-slate-700 hover:bg-white"
          >
            Clear shortlist
          </Button>
        </aside>

        <main className="flex min-h-0 flex-col rounded-[28px] border border-white/80 bg-white/90 shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur">
          <div className="border-b border-slate-200 px-5 py-5 sm:px-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#2cdb04]/12 text-[#1f7e05]">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Ask about your shortlist</h2>
                  <p className="mt-1 text-sm text-slate-500">Example: Which one is best under my budget? Summarize reviews. What are the tradeoffs?</p>
                </div>
              </div>
              <div className="inline-flex w-full gap-2 rounded-full border border-slate-200 bg-slate-50 p-1 lg:w-auto">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setActivePanel("chat")}
                  className={`flex-1 rounded-full px-4 lg:flex-none ${
                    activePanel === "chat" ? "bg-white text-slate-900 shadow-sm hover:bg-white" : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  Chat
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setActivePanel("comparison")}
                  disabled={!chatComparison}
                  className={`flex-1 rounded-full px-4 lg:flex-none ${
                    activePanel === "comparison" ? "bg-white text-slate-900 shadow-sm hover:bg-white" : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  Comparison table
                </Button>
              </div>
            </div>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5 sm:px-6">
            {activePanel === "comparison" ? (
              chatComparison ? (
                <ChatComparisonWidget comparison={chatComparison} />
              ) : (
                <div className="flex h-full min-h-[320px] items-center justify-center rounded-[24px] border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
                  <div className="max-w-xl">
                    <h3 className="text-xl font-semibold text-slate-900">No comparison ready yet</h3>
                    <p className="mt-3 text-sm leading-7 text-slate-500">
                      Select at least two products to unlock the comparison table, then keep chatting for deeper questions.
                    </p>
                  </div>
                </div>
              )
            ) : currentThread?.messages && currentThread.messages.length > 0 ? (
              currentThread.messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {msg.role === "assistant" ? (
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#2cdb04]/12 text-[#1f7e05]">
                      <Bot className="h-5 w-5" />
                    </div>
                  ) : null}

                  <div
                    className={`max-w-3xl rounded-[24px] px-4 py-3 text-sm leading-7 shadow-sm ${
                      msg.role === "user"
                        ? "bg-[#2cdb04] text-white"
                        : "border border-slate-200 bg-slate-50 text-slate-800"
                    }`}
                  >
                    {msg.role === "assistant" ? (
                      <>
                        <div className="chat-markdown text-slate-800">
                          <Streamdown>{normalizeAssistantMarkdown(msg.content)}</Streamdown>
                        </div>
                      </>
                    ) : (
                      <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                    )}
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
                className="min-h-28 flex-1 resize-none rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-900 outline-none transition focus:border-[#2cdb04]"
              />
              <Button
                type="button"
                onClick={() => void handleSend()}
                disabled={!message.trim() || loading}
                className="h-12 rounded-full bg-[#2cdb04] px-6 text-white hover:bg-[#24b603] disabled:bg-slate-300"
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

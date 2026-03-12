import { FormEvent, useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Search } from "lucide-react";
import ProductGrid from "@/components/ProductGrid";
import SearchWordmark from "@/components/SearchWordmark";
import { Button } from "@/components/ui/button";
import { useCatalogProducts, useProductsByIds } from "@/hooks/useProducts";
import { requestJson } from "@/lib/api";
import { compareProducts, ComparisonResult, Product } from "@/lib/mockApi";
import { getSessionUserId } from "@/lib/session";
import { useAppStore } from "@/lib/store";

interface CatalogPageProps {
  onNavigate?: (page: string) => void;
}

export default function CatalogPage({ onNavigate }: CatalogPageProps) {
  const {
    activeSearchQuery,
    setActiveSearchQuery,
    selectedProducts,
    clearSelection,
    setCurrentPage,
    resetChat,
    setChatProducts,
    setChatComparison,
  } = useAppStore();
  const [draftQuery, setDraftQuery] = useState(activeSearchQuery);
  const { products, loading, error } = useCatalogProducts(activeSearchQuery, 10);
  const { products: selectedProductDetails } = useProductsByIds(selectedProducts);

  useEffect(() => {
    setDraftQuery(activeSearchQuery);
  }, [activeSearchQuery]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    clearSelection();
    setActiveSearchQuery(draftQuery.trim());
  };

  const openChat = async () => {
    resetChat();
    try {
      const response = await requestJson<{
        status: string;
        selected_count: number;
        products: Product[];
        comparison: ComparisonResult | null;
      }>(`/api/users/${getSessionUserId()}/chat/reset`, {
        method: "POST",
        body: JSON.stringify({
          selected_product_ids: selectedProducts,
        }),
      });
      setChatProducts(response.products || []);
      setChatComparison(response.comparison || null);
    } catch {
      setChatProducts(selectedProductDetails);
      if (selectedProducts.length >= 2) {
        try {
          const comparison = await compareProducts(selectedProducts);
          setChatComparison(comparison);
        } catch {
          setChatComparison(null);
        }
      }
    }

    setCurrentPage("chat");
    if (onNavigate) {
      onNavigate("chat");
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#effbe9_0%,_#f7fcf3_38%,_#ffffff_100%)] px-4 py-6 text-foreground sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <header className="flex flex-col gap-4 rounded-[28px] border border-white/80 bg-white/80 px-5 py-5 shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={() => {
                setCurrentPage("home");
                if (onNavigate) {
                  onNavigate("home");
                }
              }}
              className="inline-flex items-center gap-2 text-sm text-slate-600 transition hover:text-slate-900"
            >
              <ArrowLeft className="h-4 w-4" />
              New search
            </button>
            <SearchWordmark compact />
            <div className="text-sm text-slate-500">
              Pick up to 3 products, then open chat.
            </div>
          </div>

          <form onSubmit={handleSubmit} className="mx-auto flex w-full max-w-4xl items-center gap-3 rounded-full border border-slate-200 bg-white px-4 py-3 shadow-[0_10px_30px_rgba(15,23,42,0.08)]">
            <Search className="h-5 w-5 text-slate-400" />
            <input
              value={draftQuery}
              onChange={(event) => setDraftQuery(event.target.value)}
              placeholder="Search products, categories, or brands"
              className="h-10 flex-1 border-0 bg-transparent text-base text-slate-900 outline-none placeholder:text-slate-400"
            />
            <Button type="submit" className="rounded-full bg-[#2cdb04] px-5 text-white hover:bg-[#24b603]">
              Search
            </Button>
          </form>
        </header>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="rounded-[28px] border border-white/80 bg-white/90 p-5 shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur sm:p-6">
            <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.28em] text-slate-400">
                  {activeSearchQuery.trim() ? "Search results" : "Trending products"}
                </p>
                <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
                  {activeSearchQuery.trim() ? `Results for \"${activeSearchQuery}\"` : "Start with what people already compare"}
                </h1>
              </div>
              <div className="text-sm text-slate-500">
                Showing up to 10 products
              </div>
            </div>

            {error ? (
              <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                {error}
              </div>
            ) : null}

            <ProductGrid products={products} loading={loading} />
          </div>

          <aside className="rounded-[28px] border border-[#d7efcf] bg-[linear-gradient(180deg,_#f7fcf3_0%,_#eefbe7_100%)] p-5 text-slate-900 shadow-[0_18px_60px_rgba(44,219,4,0.10)] sm:p-6">
            <p className="text-xs uppercase tracking-[0.3em] text-[#2cdb04]">Shortlist</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight">{selectedProducts.length}/3 selected</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Select one to three products from the grid. Chat will use them as context for recommendations, comparisons, and review summaries.
            </p>

            <div className="mt-6 space-y-3">
              {selectedProducts.length > 0 ? (
                selectedProductDetails.map((product, index) => (
                  <div key={product.id} className="rounded-2xl border border-[#d7efcf] bg-white/80 px-4 py-3 text-sm text-slate-700 shadow-sm">
                    <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#2cdb04]/15 text-xs font-semibold text-[#1f7e05]">
                      {index + 1}
                    </span>
                    {product.name}
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-[#b9dfad] bg-white/55 px-4 py-6 text-sm text-slate-500">
                  Nothing selected yet.
                </div>
              )}
            </div>

            <div className="mt-8 space-y-3">
              <Button
                type="button"
                onClick={() => void openChat()}
                disabled={selectedProducts.length === 0}
                className="h-11 w-full rounded-full bg-[#2cdb04] text-white hover:bg-[#24b603] disabled:bg-slate-300"
              >
                Open chat
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={clearSelection}
                className="h-11 w-full rounded-full border-[#b9dfad] bg-white/75 text-slate-700 hover:bg-white"
              >
                Clear selection
              </Button>
            </div>
          </aside>
        </section>
      </div>
    </div>
  );
}

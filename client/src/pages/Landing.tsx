import { FormEvent, useState } from "react";
import { Search } from "lucide-react";
import SearchWordmark from "@/components/SearchWordmark";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/lib/store";

interface LandingProps {
  onNavigate?: (page: string) => void;
}

const QUICK_QUERIES = ["best office chair", "wireless earbuds", "budget phone", "travel drone"];

export default function Landing({ onNavigate }: LandingProps) {
  const { activeSearchQuery, setActiveSearchQuery, clearSelection, setCurrentPage } = useAppStore();
  const [query, setQuery] = useState(activeSearchQuery);

  const submitSearch = (event?: FormEvent<HTMLFormElement>, nextQuery?: string) => {
    event?.preventDefault();
    const normalized = (nextQuery ?? query).trim();
    clearSelection();
    setActiveSearchQuery(normalized);
    setCurrentPage("catalog");
    if (onNavigate) {
      onNavigate("catalog");
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_#effbe9_0%,_#f7fcf3_36%,_#ffffff_78%)] px-4 py-6 text-foreground sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_center,_rgba(44,219,4,0.15),_transparent_58%)]" />
      <div className="relative mx-auto flex min-h-[calc(100vh-3rem)] max-w-5xl flex-col items-center justify-center gap-10">
        <div className="space-y-6 text-center">
          <SearchWordmark />
          <div className="space-y-3">
            <h1 className="text-2xl font-medium tracking-tight text-slate-900 sm:text-3xl">
              Search products, shortlist a few, then talk through the decision.
            </h1>
            <p className="mx-auto max-w-2xl text-base leading-7 text-slate-500 sm:text-lg">
              Start with a plain-language query. The next screen shows 10 products. Pick one to three, then switch into chat mode to compare them.
            </p>
          </div>
        </div>

        <form
          onSubmit={submitSearch}
          className="w-full rounded-[32px] border border-slate-200 bg-white px-4 py-4 shadow-[0_18px_70px_rgba(15,23,42,0.12)] sm:px-6"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="flex flex-1 items-center gap-3 rounded-full border border-slate-200 bg-white px-5 py-3 shadow-[0_8px_30px_rgba(15,23,42,0.08)]">
              <Search className="h-5 w-5 text-slate-400" />
              <input
                autoFocus
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search for a product, brand, or use case"
                className="h-11 flex-1 border-0 bg-transparent text-lg text-slate-900 outline-none placeholder:text-slate-400"
              />
            </div>
            <Button type="submit" className="h-12 rounded-full bg-[#2cdb04] px-8 text-base text-white hover:bg-[#24b603]">
              Search
            </Button>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-3 text-sm text-slate-500">
            <span>Try:</span>
            {QUICK_QUERIES.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => submitSearch(undefined, item)}
                className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 transition hover:border-[#2cdb04]/40 hover:bg-[#2cdb04]/10 hover:text-[#1f7e05]"
              >
                {item}
              </button>
            ))}
          </div>
        </form>

        <div className="grid w-full gap-4 text-left sm:grid-cols-3">
          <div className="rounded-[24px] border border-white/70 bg-white/80 p-5 shadow-[0_12px_40px_rgba(15,23,42,0.08)] backdrop-blur">
            <p className="text-xs uppercase tracking-[0.3em] text-[#2cdb04]">01</p>
            <h2 className="mt-3 text-lg font-semibold text-slate-900">Search</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">Type what you want in plain English. The catalog pulls back matching products.</p>
          </div>
          <div className="rounded-[24px] border border-white/70 bg-white/80 p-5 shadow-[0_12px_40px_rgba(15,23,42,0.08)] backdrop-blur">
            <p className="text-xs uppercase tracking-[0.3em] text-emerald-500">02</p>
            <h2 className="mt-3 text-lg font-semibold text-slate-900">Shortlist</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">Pick up to three products. The app carries those into the next step as chat context.</p>
          </div>
          <div className="rounded-[24px] border border-white/70 bg-white/80 p-5 shadow-[0_12px_40px_rgba(15,23,42,0.08)] backdrop-blur">
            <p className="text-xs uppercase tracking-[0.3em] text-[#2cdb04]">03</p>
            <h2 className="mt-3 text-lg font-semibold text-slate-900">Ask</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">Use chat for comparisons, review summaries, tradeoffs, or a direct recommendation.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

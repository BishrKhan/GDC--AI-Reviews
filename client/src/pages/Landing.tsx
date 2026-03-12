import { FormEvent, useMemo, useState } from "react";
import { BarChart3, Search, Users } from "lucide-react";
import SearchWordmark from "@/components/SearchWordmark";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/lib/store";

interface LandingProps {
  onNavigate?: (page: string) => void;
}

const QUICK_QUERIES = ["Gucci handbags", "men's perfume", "gaming laptops", "luxury watches", "skincare sets", "designer sunglasses"];
const GENDER_FILTERS = ["all", "male", "female", "non-binary"] as const;
const AGE_FILTERS = ["all", "20s", "30s", "40s", "50s", "60s", "70+"] as const;

type LandingTab = "search" | "community";
type GenderFilter = (typeof GENDER_FILTERS)[number];
type AgeFilter = (typeof AGE_FILTERS)[number];

interface CommunityPoll {
  id: string;
  product: string;
  question: string;
  yesVotes: number;
  noVotes: number;
  genders: GenderFilter[];
  ages: AgeFilter[];
}

const COMMUNITY_POLLS: CommunityPoll[] = [
  {
    id: "iphone-15-pro-worth-it",
    product: "iPhone 15 Pro",
    question: "Is iPhone 15 Pro worth the price?",
    yesVotes: 1240,
    noVotes: 340,
    genders: ["all", "male", "female", "non-binary"],
    ages: ["all", "20s", "30s", "40s"],
  },
  {
    id: "sony-wh1000xm5-best-noise-canceling",
    product: "Sony WH-1000XM5",
    question: "Best noise-canceling headphones?",
    yesVotes: 2150,
    noVotes: 180,
    genders: ["all", "male", "female", "non-binary"],
    ages: ["all", "20s", "30s", "40s", "50s"],
  },
  {
    id: "galaxy-s24-vs-iphone-15",
    product: "Samsung Galaxy S24",
    question: "Samsung Galaxy S24 vs iPhone 15?",
    yesVotes: 1890,
    noVotes: 520,
    genders: ["all", "male", "female"],
    ages: ["all", "20s", "30s", "40s", "50s"],
  },
  {
    id: "dji-mini-3-beginners",
    product: "DJI Mini 3",
    question: "Is DJI Mini 3 good for beginners?",
    yesVotes: 1650,
    noVotes: 210,
    genders: ["all", "male", "female", "non-binary"],
    ages: ["all", "20s", "30s", "40s", "50s", "60s"],
  },
];

function filterLabel(value: GenderFilter | AgeFilter) {
  if (value === "all") {
    return "All";
  }
  return value;
}

export default function Landing({ onNavigate }: LandingProps) {
  const { activeSearchQuery, setActiveSearchQuery, clearSelection, setCurrentPage } = useAppStore();
  const [query, setQuery] = useState(activeSearchQuery);
  const [activeTab, setActiveTab] = useState<LandingTab>("search");
  const [selectedGender, setSelectedGender] = useState<GenderFilter>("all");
  const [selectedAge, setSelectedAge] = useState<AgeFilter>("all");

  const filteredPolls = useMemo(() => {
    return COMMUNITY_POLLS.filter((poll) => {
      const genderMatch = selectedGender === "all" || poll.genders.includes(selectedGender) || poll.genders.includes("all");
      const ageMatch = selectedAge === "all" || poll.ages.includes(selectedAge) || poll.ages.includes("all");
      return genderMatch && ageMatch;
    });
  }, [selectedAge, selectedGender]);

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

  const renderSearchTab = () => (
    <>
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
    </>
  );

  const renderCommunityTab = () => (
    <div className="w-full space-y-8">
      <div className="space-y-3 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-[#d7efcf] bg-white/90 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-[#2cdb04] shadow-sm">
          <Users className="h-4 w-4" />
          Community Q&A
        </div>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">Community polls and product questions</h1>
        <p className="mx-auto max-w-3xl text-base leading-7 text-slate-500 sm:text-lg">
          Demo social proof on the landing page. Filter by demographic slices, then open poll cards that feel like live community sentiment.
        </p>
      </div>

      <section className="rounded-[32px] border border-[#d7efcf] bg-white/90 p-5 shadow-[0_18px_70px_rgba(15,23,42,0.10)] sm:p-6">
        <div className="flex items-center gap-3 text-slate-900">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#2cdb04]/12 text-[#1f7e05]">
            <BarChart3 className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-[#2cdb04]">Q&A</p>
            <h2 className="mt-1 text-xl font-semibold">Filter by Demographics</h2>
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_1fr]">
          <div>
            <p className="text-sm font-medium text-slate-600">Gender</p>
            <div className="mt-3 flex flex-wrap gap-3">
              {GENDER_FILTERS.map((gender) => {
                const active = selectedGender === gender;
                return (
                  <button
                    key={gender}
                    type="button"
                    onClick={() => setSelectedGender(gender)}
                    className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                      active
                        ? "border-[#2cdb04] bg-[#2cdb04] text-white shadow-[0_10px_24px_rgba(44,219,4,0.18)]"
                        : "border-slate-200 bg-slate-50 text-slate-600 hover:border-[#2cdb04]/35 hover:bg-[#2cdb04]/10 hover:text-[#1f7e05]"
                    }`}
                  >
                    {filterLabel(gender)}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-slate-600">Age</p>
            <div className="mt-3 flex flex-wrap gap-3">
              {AGE_FILTERS.map((age) => {
                const active = selectedAge === age;
                return (
                  <button
                    key={age}
                    type="button"
                    onClick={() => setSelectedAge(age)}
                    className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                      active
                        ? "border-[#2cdb04] bg-[#2cdb04] text-white shadow-[0_10px_24px_rgba(44,219,4,0.18)]"
                        : "border-slate-200 bg-slate-50 text-slate-600 hover:border-[#2cdb04]/35 hover:bg-[#2cdb04]/10 hover:text-[#1f7e05]"
                    }`}
                  >
                    {age === "all" ? "All Ages" : age}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-[#2cdb04]">Community Polls</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">Live-looking demo polls</h2>
          </div>
          <div className="rounded-full border border-[#d7efcf] bg-white/80 px-4 py-2 text-sm text-slate-500 shadow-sm">
            Showing {filteredPolls.length} poll{filteredPolls.length === 1 ? "" : "s"}
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          {filteredPolls.map((poll) => {
            const totalVotes = poll.yesVotes + poll.noVotes;
            const yesPercentage = Math.round((poll.yesVotes / totalVotes) * 100);

            return (
              <article
                key={poll.id}
                className="rounded-[28px] border border-[#d7efcf] bg-[linear-gradient(180deg,_#ffffff_0%,_#f7fcf3_100%)] p-5 shadow-[0_18px_40px_rgba(15,23,42,0.08)]"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-[#1f7e05]">{poll.product}</p>
                    <h3 className="mt-2 text-xl font-semibold tracking-tight text-slate-900">{poll.question}</h3>
                  </div>
                  <div className="rounded-2xl bg-[#2cdb04]/10 px-3 py-2 text-center text-sm font-semibold text-[#1f7e05]">
                    <div>Yes</div>
                    <div className="text-xl leading-none">{yesPercentage}%</div>
                  </div>
                </div>

                <div className="mt-5 overflow-hidden rounded-full bg-slate-200">
                  <div className="h-3 rounded-full bg-[linear-gradient(90deg,_#2cdb04_0%,_#7ff05b_100%)]" style={{ width: `${yesPercentage}%` }} />
                </div>

                <div className="mt-3 flex items-center justify-between text-sm">
                  <span className="font-medium text-slate-700">{poll.yesVotes.toLocaleString()} yes</span>
                  <span className="text-slate-500">{poll.noVotes.toLocaleString()} no</span>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    className="rounded-full bg-[#2cdb04] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#24b603]"
                  >
                    Yes
                  </button>
                  <button
                    type="button"
                    className="rounded-full border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 transition hover:border-[#2cdb04]/35 hover:bg-[#2cdb04]/10 hover:text-[#1f7e05]"
                  >
                    No
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_#effbe9_0%,_#f7fcf3_36%,_#ffffff_78%)] px-4 py-6 text-foreground sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_center,_rgba(44,219,4,0.15),_transparent_58%)]" />
      <div className="relative mx-auto flex min-h-[calc(100vh-3rem)] max-w-6xl flex-col items-center justify-center gap-8">
        <div className="rounded-full border border-white/80 bg-white/80 p-1 shadow-[0_12px_40px_rgba(15,23,42,0.08)] backdrop-blur">
          <div className="flex flex-wrap items-center justify-center gap-1">
            <button
              type="button"
              onClick={() => setActiveTab("search")}
              className={`rounded-full px-5 py-2.5 text-sm font-medium transition ${
                activeTab === "search"
                  ? "bg-[#2cdb04] text-white shadow-[0_10px_22px_rgba(44,219,4,0.18)]"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              Search
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("community")}
              className={`rounded-full px-5 py-2.5 text-sm font-medium transition ${
                activeTab === "community"
                  ? "bg-[#2cdb04] text-white shadow-[0_10px_22px_rgba(44,219,4,0.18)]"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              Q&amp;A
            </button>
          </div>
        </div>

        {activeTab === "search" ? renderSearchTab() : renderCommunityTab()}
      </div>
    </div>
  );
}

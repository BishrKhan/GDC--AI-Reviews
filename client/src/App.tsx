import { useEffect } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { useAppStore } from "./lib/store";
import { requestJson } from "./lib/api";
import { getSessionUserId } from "./lib/session";
import Landing from "./pages/Landing";
import Onboarding from "./pages/Onboarding";
import InterestsPage from "./pages/InterestsPage";
import ChatHub from "./pages/ChatHub";
import ComparisonPage from "./pages/ComparisonPage";
import WishlistPage from "./pages/WishlistPage";
import QAPage from "./pages/QAPage";
import ProfilePage from "./pages/ProfilePage";

function Router() {
  const { currentPage, setCurrentPage } = useAppStore();

  const handleNavigate = (page: string) => {
    setCurrentPage(page);
  };

  return (
    <Switch>
      <Route path={"/"}>
        {currentPage === "onboarding" ? (
          <Onboarding onNavigate={handleNavigate} />
        ) : currentPage === "interests" ? (
          <InterestsPage onNavigate={handleNavigate} />
        ) : currentPage === "chat" ? (
          <ChatHub onNavigate={handleNavigate} />
        ) : currentPage === "comparison" ? (
          <ComparisonPage onNavigate={handleNavigate} />
        ) : currentPage === "wishlist" ? (
          <WishlistPage onNavigate={handleNavigate} />
        ) : currentPage === "qa" ? (
          <QAPage onNavigate={handleNavigate} />
        ) : currentPage === "profile" ? (
          <ProfilePage onNavigate={handleNavigate} />
        ) : (
          <Landing onNavigate={handleNavigate} />
        )}
      </Route>
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const { hydrateFromServer } = useAppStore();

  useEffect(() => {
    let mounted = true;

    const bootstrap = async () => {
      try {
        const state = await requestJson<{
          user: {
            id: string;
            email?: string;
            name?: string;
            dob?: string;
            gender?: "male" | "female" | "non-binary" | "prefer-not";
            interests: string[];
            isGuest: boolean;
          };
          wishlist: string[];
          threads: Array<{
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
          }>;
        }>(`/api/users/${getSessionUserId()}/state`);

        if (mounted) {
          hydrateFromServer(state);
        }
      } catch {
        // Keep the app usable offline or without the API process.
      }
    };

    bootstrap();

    return () => {
      mounted = false;
    };
  }, [hydrateFromServer]);

  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;

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
import ChatHub from "./pages/ChatHub";
import CatalogPage from "./pages/CatalogPage";

function Router() {
  const { currentPage, setCurrentPage } = useAppStore();

  const handleNavigate = (page: string) => {
    setCurrentPage(page);
  };

  return (
    <Switch>
      <Route path={"/"}>
        {currentPage === "catalog" ? (
          <CatalogPage onNavigate={handleNavigate} />
        ) : currentPage === "chat" ? (
          <ChatHub onNavigate={handleNavigate} />
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

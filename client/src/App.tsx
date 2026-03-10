import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { useAppStore } from "./lib/store";
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

/**
 * Sidebar Component
 * Fixed left sidebar with chat history, wishlist, profile, and Q&A
 * DESIGN: White background, green accents, 250px desktop, collapsible mobile
 */

import { Menu, X, MessageSquare, Heart, User, HelpCircle } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface SidebarProps {
  onNavigate?: (page: string) => void;
}

export default function Sidebar({ onNavigate }: SidebarProps) {
  const {
    sidebarOpen,
    toggleSidebar,
    setSidebarOpen,
    threads,
    currentThread,
    switchThread,
    currentPage,
    setCurrentPage,
    user,
  } = useAppStore();

  const handleNavigation = (page: string) => {
    setCurrentPage(page);
    if (onNavigate) {
      onNavigate(page);
    }
    // Close sidebar on mobile after navigation
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  };

  const navItems = [
    { id: "home", label: "Home", icon: MessageSquare },
    { id: "chat", label: "Chat Hub", icon: MessageSquare },
    { id: "wishlist", label: "Wishlist", icon: Heart },
    { id: "qa", label: "Q&A", icon: HelpCircle },
    { id: "profile", label: "Profile", icon: User },
  ];

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        onClick={toggleSidebar}
        className="fixed top-4 left-4 z-50 p-2 rounded-lg bg-primary text-primary-foreground md:hidden hover:bg-primary/90 transition-colors"
        aria-label="Toggle sidebar"
      >
        {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Overlay (Mobile) */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed left-0 top-0 h-screen w-64 bg-sidebar text-sidebar-foreground
          border-r border-sidebar-border shadow-lg
          transition-transform duration-300 z-40
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
          md:translate-x-0 md:w-64
          flex flex-col
        `}
      >
        {/* Header */}
        <div className="p-6 border-b border-sidebar-border">
          <h1 className="text-2xl font-bold text-sidebar-primary">PROD-BOT</h1>
          <p className="text-xs text-sidebar-muted-foreground mt-1">
            AI Comparisons
          </p>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-hidden flex flex-col">
          <div className="p-4 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavigation(item.id)}
                  className={`
                    w-full flex items-center gap-3 px-4 py-3 rounded-lg
                    transition-all duration-200 text-left font-medium
                    ${
                      isActive
                        ? "bg-sidebar-primary text-sidebar-primary-foreground"
                        : "text-sidebar-foreground hover:bg-sidebar-accent"
                    }
                  `}
                >
                  <Icon size={20} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Chat History */}
          {threads.length > 0 && (
            <div className="flex-1 overflow-hidden flex flex-col border-t border-sidebar-border">
              <div className="p-4">
                <h3 className="text-xs font-semibold uppercase text-sidebar-muted-foreground mb-3">
                  Chat History
                </h3>
                <ScrollArea className="h-full">
                  <div className="space-y-2 pr-4">
                    {threads.map((thread) => (
                      <button
                        key={thread.id}
                        onClick={() => {
                          switchThread(thread.id);
                          handleNavigation("chat");
                        }}
                        className={`
                          w-full text-left px-3 py-2 rounded-lg text-sm
                          transition-all duration-200 truncate
                          ${
                            currentThread?.id === thread.id
                              ? "bg-sidebar-primary text-sidebar-primary-foreground"
                              : "text-sidebar-foreground hover:bg-sidebar-accent"
                          }
                        `}
                        title={thread.title}
                      >
                        {thread.title}
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </div>
          )}
        </nav>

        {/* Footer - User Info */}
        <div className="p-4 border-t border-sidebar-border">
          {user.isGuest ? (
            <Button
              variant="default"
              size="sm"
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => handleNavigation("profile")}
            >
              Sign In
            </Button>
          ) : (
            <div className="text-sm">
              <p className="font-semibold text-sidebar-foreground">
                {user.name || user.email || "User"}
              </p>
              <p className="text-xs text-sidebar-muted-foreground mt-1">
                {user.interests.length} interests
              </p>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Offset (Desktop) */}
      <div className="hidden md:block w-64" />
    </>
  );
}

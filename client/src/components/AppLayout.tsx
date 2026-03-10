/**
 * AppLayout Component
 * Main layout with sidebar, content area, and bottom chat bar
 * DESIGN: Sidebar (250px desktop), main content, fixed bottom bar
 */

import { ReactNode } from "react";
import Sidebar from "./Sidebar";
import BottomBar from "./BottomBar";

interface AppLayoutProps {
  children: ReactNode;
  onNavigate?: (page: string) => void;
  onSendMessage?: (message: string, response: string) => void;
}

export default function AppLayout({
  children,
  onNavigate,
  onSendMessage,
}: AppLayoutProps) {
  return (
    <div className="flex h-screen bg-background text-foreground">
      {/* Sidebar */}
      <Sidebar onNavigate={onNavigate} />

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden md:ml-0">
        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto pt-16 md:pt-6 pb-32 md:pb-40">
          <div className="max-w-7xl mx-auto px-4 md:px-6 py-6">
            {children}
          </div>
        </div>
      </main>

      {/* Bottom Chat Bar */}
      <BottomBar onSendMessage={onSendMessage} />
    </div>
  );
}

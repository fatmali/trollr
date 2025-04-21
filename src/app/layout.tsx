import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import { LocalUserProvider } from "@/context/LocalUserProvider";
import { ProductivityDock } from "@/components/ui/ProductivityDock";
import { TrollMessageDisplay } from "@/components/troll/TrollMessageDisplay";
import { RewardsDisplay } from "@/components/ui/AchievementsDisplay";
import { DarkModeToggle } from "@/components/ui/DarkModeToggle";
import HeaderTaskSearch from "@/components/tasks/HeaderTaskSearch";
import Link from "next/link";
import { Suspense } from "react";

const poppins = Poppins({
  weight: ['300', '400', '700', '900'],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Trollr - Get Shit Done",
  description: "A sassy todo app with built-in AI trolling to motivate productivity",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={poppins.className}>
      <body
        className="antialiased bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 min-h-screen transition-colors duration-200"
      >
        <LocalUserProvider>
          <div className="trollr-pattern-bg min-h-screen flex flex-col">
            {/* Toast message - always visible even when scrolling */}
            <TrollMessageDisplay />
            
            {/* Rewards notifications system - displays variable rewards */}
            <RewardsDisplay />
            
            {/* Header - shared across all pages */}
            <header className="bg-background/80 backdrop-blur-sm z-30 sticky top-0">
              <Suspense fallback={<div className="h-16"></div>}>
                <SharedHeader />
              </Suspense>
            </header>

            {/* Main content */}
            <main className="flex-1 flex flex-col">
              {children}
            </main>

            {/* Footer - shared across all pages */}
            <footer className="mt-auto">
              <div className="container mx-auto py-6 px-6 text-center text-muted-foreground text-xs">
                <p>Trollr &copy; {new Date().getFullYear()} - <span className="trollr-text">Helping you get shit done since 2025</span></p>
                <p>Vibe Coded with ❤️ by <a href="https://fatmaali.dev" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Fatma</a> and Github Copilot</p>
              </div>
            </footer>
            
            <ProductivityDock />
          </div>
        </LocalUserProvider>
      </body>
    </html>
  );
}

// Shared header component
function SharedHeader() {
  return (
    <div className="container mx-auto px-4 py-3">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-xl text-primary font-medium">
            Trollr
          </Link>
        </div>
        
        <div className="flex items-center gap-4">
        <div className="flex-1 mx-4 hidden md:block">
          <HeaderTaskSearch />
        </div>
          {/* Analytics Link - Bar chart with rounded corners */}
          <Link
            href="/analytics"
            className="text-muted-foreground hover:text-foreground"
            title="Analytics"
            aria-label="Analytics"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="18" 
              height="18" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <rect x="3" y="12" width="4" height="8" rx="1"></rect>
              <rect x="10" y="8" width="4" height="12" rx="1"></rect>
              <rect x="17" y="4" width="4" height="16" rx="1"></rect>
            </svg>
          </Link>
          
          {/* Settings Link - Rounded cog icon */}
          <Link
            href="/settings"
            className="text-muted-foreground hover:text-foreground"
            title="Settings"
            aria-label="Settings"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="18" 
              height="18" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
              <circle cx="12" cy="12" r="3"></circle>
            </svg>
          </Link>
          
          <DarkModeToggle />
        </div>
      </div>
    </div>
  );
}

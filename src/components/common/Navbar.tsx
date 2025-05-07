"use client";
// src/components/common/Navbar.tsx
import { useAuth } from "../../hooks/useAuth";
import { Menu, User } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Navbar({ onOpenSidebar, onLoginClick }: { onOpenSidebar?: () => void; onLoginClick?: () => void }) {
  const { user, logout } = useAuth();
  return (
    <nav className="sticky top-0 z-30 w-full bg-white border-b shadow-sm flex items-center justify-between px-4 h-14 min-h-0">
      {/* Left: Hamburger and App Name (mobile only) */}
      <div className="flex items-center gap-2">
        {onOpenSidebar && (
          <button
            className="flex md:hidden p-2 focus:outline-none"
            onClick={onOpenSidebar}
            aria-label="Open sidebar"
          >
            <Menu className="w-7 h-7 text-indigo-700" />
          </button>
        )}
        <span className="font-bold text-lg text-indigo-800 md:hidden">Excellence Work Tracker</span>
      </div>
      {/* Center: App Name (desktop only) */}
      <span className="hidden md:block font-bold text-xl text-indigo-800">Excellence Work Tracker</span>
      {/* Right: User avatar or login/logout */}
      <div className="flex items-center gap-2">
        {!user && onLoginClick && (
          <Button onClick={onLoginClick} className="px-4 py-1 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm transition">Login</Button>
        )}
        {user && (
          <button
            onClick={logout}
            className="flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 font-semibold text-sm transition"
            title="Logout"
          >
            <User className="w-5 h-5" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        )}
      </div>
    </nav>
  );
}
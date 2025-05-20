"use client";
// src/components/common/Navbar.tsx
import { useAuth } from "../../hooks/useAuth";
import { Menu, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useRef, useEffect } from "react";

export function Navbar({ onOpenSidebar, onLoginClick, onProfileClick }: { onOpenSidebar?: () => void; onLoginClick?: () => void; onProfileClick?: () => void }) {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    if (!menuOpen) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpen]);

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
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 font-semibold text-sm transition focus:outline-none"
              title="User menu"
            >
              <User className="w-5 h-5" />
              <span className="hidden sm:inline">Account</span>
              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
            </button>
            {menuOpen && (
              <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded-xl shadow-lg z-50 py-2 animate-fade-in">
                <button
                  className="w-full text-left px-4 py-2 hover:bg-indigo-50 text-indigo-700 font-medium text-sm rounded-t-xl"
                  onClick={() => {
                    setMenuOpen(false);
                    if (onProfileClick) onProfileClick();
                  }}
                >
                  Profile
                </button>
                <button
                  className="w-full text-left px-4 py-2 hover:bg-indigo-50 text-rose-600 font-medium text-sm rounded-b-xl"
                  onClick={() => {
                    setMenuOpen(false);
                    logout();
                  }}
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
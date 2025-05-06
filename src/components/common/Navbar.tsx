"use client";
// src/components/common/Navbar.tsx
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useAuth } from "../../hooks/useAuth"; // custom hook for auth state

export function Navbar() {
  const { user,  openAuthModal } = useAuth();
  console.log("Navbar user:", user);
  return (
    <nav className="flex gap-4 p-4 border-b bg-card justify-center">
      <Button asChild><Link href="/">Home</Link></Button>
      {user && (
        <>
          <Button asChild><Link href="/daily">Daily</Link></Button>
          <Button asChild><Link href="/monthly">Monthly</Link></Button>
        </>
      )}
      {user ? (
        <>
          <Button asChild><Link href="/profile">Profile</Link></Button>
          
        </>
      ) : (
        <Button onClick={openAuthModal}>Login</Button>
      )}
    </nav>
  );
}
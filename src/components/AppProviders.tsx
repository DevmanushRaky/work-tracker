"use client";
import { ReactNode } from "react";
import { AuthProvider } from "@/hooks/useAuth";
import AuthModalWrapper from "@/components/ui/AuthModalWrapper";

export default function AppProviders({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <AuthModalWrapper />
      {children}
    </AuthProvider>
  );
} 
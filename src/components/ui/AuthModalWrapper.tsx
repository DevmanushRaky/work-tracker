"use client";
import { AuthModal } from "@/components/ui/AuthModal";
import { useAuth } from "@/hooks/useAuth";

export default function AuthModalWrapper() {
  const { authModalOpen, closeAuthModal } = useAuth();
  return <AuthModal open={authModalOpen} onOpenChange={closeAuthModal} />;
} 
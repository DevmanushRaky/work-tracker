// src/components/AuthModal.tsx
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth"; 

export function AuthModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { login, register } = useAuth();
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  // Forgot password modal state
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotStep, setForgotStep] = useState<"email" | "reset">("email");
  const [resetPassword, setResetPassword] = useState("");
  const [forgotMsg, setForgotMsg] = useState("");

  // Reset all states when main dialog is closed
  useEffect(() => {
    if (!open) {
      setLoading(false);
      setError("");
      setMode("login");
      setForm({ email: "", password: "" });
      setForgotOpen(false);
      setForgotEmail("");
      setForgotStep("email");
      setResetPassword("");
      setForgotMsg("");
    }
  }, [open]);

  // Reset forgot password states when forgot dialog is closed
  useEffect(() => {
    if (!forgotOpen) {
      setLoading(false);
      setForgotMsg("");
      setForgotStep("email");
      setForgotEmail("");
      setResetPassword("");
    }
  }, [forgotOpen]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const email = form.email.trim().toLowerCase();
      if (mode === "login") await login(email, form.password);
      else await register(email, form.password);
      onOpenChange(false);
    } catch (err) {
        setError(err instanceof Error ? err.message : "Error");
    } finally {
      setLoading(false);
    }
  };

  // Forgot password logic
  const handleForgotEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotMsg("");
    setLoading(true);
    try {
      const email = forgotEmail.trim().toLowerCase();
      const res = await fetch("/api/auth/check-mail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data.success) {
        setForgotStep("reset");
        setForgotMsg("");
      } else {
        setForgotMsg(data.message || "Email not found");
      }
    } catch {
      setForgotMsg("Server error. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotMsg("");
    if (resetPassword.trim().length < 6) {
      setForgotMsg("Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    try {
      const email = forgotEmail.trim().toLowerCase();
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: resetPassword }),
      });
      const data = await res.json();
      if (data.success) {
        setForgotMsg("Password reset successful! You can now log in.");
        setTimeout(() => {
          setForgotOpen(false);
          setForgotStep("email");
          setForgotEmail("");
          setResetPassword("");
          setForgotMsg("");
        }, 2000);
      } else {
        setForgotMsg(data.message || "Failed to reset password");
      }
    } catch {
      setForgotMsg("Server error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogTitle>{mode === "login" ? "Login" : "Register"}</DialogTitle>
          <div className="flex justify-center mb-4">
            <Button variant={mode === "login" ? "default" : "outline"} onClick={() => setMode("login")}>Login</Button>
            <Button variant={mode === "register" ? "default" : "outline"} onClick={() => setMode("register")}>Register</Button>
          </div>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input type="email" placeholder="Email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
            <Input type="password" placeholder="Password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required />
            {error && <div className="text-red-600">{error}</div>}
            <Button type="submit" disabled={loading}>{loading ? "Loading..." : mode === "login" ? "Login" : "Register"}</Button>
          </form>
          {/* Forgot Password Link */}
          {mode === "login" && (
            <div className="text-center mt-2">
              <button type="button" className="text-blue-600 hover:underline text-sm" onClick={() => setForgotOpen(true)}>
                Forgot Password?
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>
      {/* Forgot Password Modal */}
      <Dialog open={forgotOpen} onOpenChange={setForgotOpen}>
        <DialogContent>
          <DialogTitle>Reset Password</DialogTitle>
          <DialogDescription>
            Enter your email to receive a password reset link or set a new password.
          </DialogDescription>
          {forgotStep === "email" ? (
            <form onSubmit={handleForgotEmail} className="flex flex-col gap-4">
              <Input
                type="email"
                placeholder="Enter your email"
                value={forgotEmail}
                onChange={e => {
                  setForgotEmail(e.target.value);
                  setForgotMsg("");
                }}
                required
              />
              <Button type="submit" disabled={loading}>{loading ? "Checking..." : "Next"}</Button>
              {forgotMsg && <div className="text-red-600 text-sm">{forgotMsg}</div>}
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="flex flex-col gap-4">
              <Input
                type="password"
                placeholder="New password"
                value={resetPassword}
                onChange={e => setResetPassword(e.target.value)}
                required
                minLength={6}
              />
              <Button
                type="submit"
                disabled={loading || resetPassword.trim().length < 6}
              >
                {loading ? "Resetting..." : "Reset Password"}
              </Button>
              {forgotMsg && (
                <div className={forgotMsg.includes("successful") ? "text-green-600 text-sm" : "text-red-600 text-sm"}>
                  {forgotMsg}
                </div>
              )}
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
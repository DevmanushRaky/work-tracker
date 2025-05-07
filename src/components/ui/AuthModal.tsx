// src/components/AuthModal.tsx
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth"; 
import { Mail, Lock, UserPlus, LogIn } from "lucide-react";
import { toast } from "react-toastify";

// Utility to check email format
function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

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
  const [loadingMain, setLoadingMain] = useState(false);
  // Forgot password modal state
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotStep, setForgotStep] = useState<"email" | "reset">("email");
  const [resetPassword, setResetPassword] = useState("");
  const [forgotMsg, setForgotMsg] = useState("");
  const [loadingForgot, setLoadingForgot] = useState(false);

  // Reset all states when main dialog is closed
  useEffect(() => {
    if (!open) {
      setLoadingMain(false);
      setMode("login");
      setForm({ email: "", password: "" });
      setForgotOpen(false);
      setForgotEmail("");
      setForgotStep("email");
      setResetPassword("");
      setForgotMsg("");
      setLoadingForgot(false);
    }
  }, [open]);

  // Reset forgot password states when forgot dialog is closed
  useEffect(() => {
    if (!forgotOpen) {
      setLoadingForgot(false);
      setForgotMsg("");
      setForgotStep("email");
      setForgotEmail("");
      setResetPassword("");
    }
  }, [forgotOpen]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoadingMain(true);
    if (!form.email.trim() || !form.password.trim()) {
      toast.error("Please fill all details.", { className: "custom-toast custom-toast--error" });
      setLoadingMain(false);
      return;
    }
    if (!isValidEmail(form.email.trim())) {
      toast.error("Please enter a valid email address.", { className: "custom-toast custom-toast--error" });
      setLoadingMain(false);
      return;
    }
    try {
      const email = form.email.trim().toLowerCase();
      if (mode === "login") await login(email, form.password);
      else await register(email, form.password);
      onOpenChange(false);
      toast.success(mode === "login" ? "Login successful!" : "Registration successful!", { className: "custom-toast custom-toast--success" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error", { className: "custom-toast custom-toast--error" });
    } finally {
      setLoadingMain(false);
    }
  };

  // Forgot password logic
  const handleForgotEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotMsg("");
    setLoadingForgot(true);
    if (!forgotEmail.trim()) {
      toast.error("Please fill all details.", { className: "custom-toast custom-toast--error" });
      setLoadingForgot(false);
      return;
    }
    if (!isValidEmail(forgotEmail.trim())) {
      toast.error("Please enter a valid email address.", { className: "custom-toast custom-toast--error" });
      setLoadingForgot(false);
      return;
    }
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
        toast.success("Email found. You can now reset your password.", { className: "custom-toast custom-toast--success" });
      } else {
        setForgotMsg(data.message || "Email not found");
        toast.error(data.message || "Email not found", { className: "custom-toast custom-toast--error" });
      }
    } catch {
      setForgotMsg("Server error. Please try again.");
      toast.error("Server error. Please try again.", { className: "custom-toast custom-toast--error" });
    } finally {
      setLoadingForgot(false);
    }
  };
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotMsg("");
    if (!resetPassword.trim()) {
      toast.error("Please fill all details.", { className: "custom-toast custom-toast--error" });
      return;
    }
    if (resetPassword.trim().length < 6) {
      toast.error("Password must be at least 6 characters.", { className: "custom-toast custom-toast--error" });
      return;
    }
    setLoadingForgot(true);
    try {
      const email = forgotEmail.trim().toLowerCase();
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: resetPassword }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Password reset successful! You can now log in.", { className: "custom-toast custom-toast--success" });
        setTimeout(() => {
          setForgotOpen(false);
          setForgotStep("email");
          setForgotEmail("");
          setResetPassword("");
          setForgotMsg("");
        }, 2000);
      } else {
        toast.error(data.message || "Failed to reset password", { className: "custom-toast custom-toast--error" });
      }
    } catch {
      toast.error("Server error. Please try again.", { className: "custom-toast custom-toast--error" });
    } finally {
      setLoadingForgot(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md p-0 bg-white rounded-2xl shadow-2xl border-0">
          <DialogTitle className="sr-only">{mode === "login" ? "Login" : "Register"}</DialogTitle>
          <div className="flex flex-col items-center py-6 px-8">
            {/* App Branding */}
            <div className="mb-4 flex flex-col items-center">
              <span className="text-3xl font-bold text-indigo-700 tracking-tight mb-1">Excellence Dashboard</span>
              <span className="text-sm text-gray-400">Welcome! Please {mode === "login" ? "log in" : "register"} to continue.</span>
            </div>
            {/* Toggle Login/Register */}
            <div className="flex w-full mb-6 gap-2">
              <Button variant={mode === "login" ? "default" : "outline"} className="w-1/2 flex items-center gap-2" onClick={() => setMode("login")}> <LogIn className="w-4 h-4" /> Login</Button>
              <Button variant={mode === "register" ? "default" : "outline"} className="w-1/2 flex items-center gap-2" onClick={() => setMode("register")}> <UserPlus className="w-4 h-4" /> Register</Button>
            </div>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input type="text" placeholder="Email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}  className="pl-10" />
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input type="password" placeholder="Password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}  className="pl-10" />
              </div>
              <Button type="submit" disabled={loadingMain} className="w-full mt-2">{loadingMain ? <span className="animate-spin mr-2 inline-block w-4 h-4 border-2 border-t-2 border-indigo-500 rounded-full align-middle"></span> : null}{mode === "login" ? "Login" : "Register"}</Button>
            </form>
            {/* Forgot Password Link */}
            {mode === "login" && (
              <div className="text-center mt-4 w-full">
                <button type="button" className="text-indigo-600 hover:underline text-sm font-medium" onClick={() => setForgotOpen(true)}>
                  Forgot Password?
                </button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
      {/* Forgot Password Modal */}
      <Dialog open={forgotOpen} onOpenChange={setForgotOpen}>
        <DialogContent className="max-w-md p-0 bg-white rounded-2xl shadow-2xl border-0">
          <DialogTitle className="sr-only">Reset Password</DialogTitle>
          <div className="flex flex-col items-center py-6 px-8">
            <DialogDescription className="mb-4 text-gray-500 text-center">
              {forgotStep === "email" ? "Enter your email to password reset ." : "Set your new password below."}
            </DialogDescription>
            <div className="flex items-center gap-2 mb-4">
              <div className={`w-3 h-3 rounded-full ${forgotStep === "email" ? "bg-indigo-500" : "bg-gray-300"}`}></div>
              <div className={`w-3 h-3 rounded-full ${forgotStep === "reset" ? "bg-indigo-500" : "bg-gray-300"}`}></div>
            </div>
            {forgotStep === "email" ? (
              <form onSubmit={handleForgotEmail} className="flex flex-col gap-4 w-full">
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    type="text"
                    placeholder="Enter your email"
                    value={forgotEmail}
                    onChange={e => {
                      setForgotEmail(e.target.value);
                      setForgotMsg("");
                    }}
                    
                    className="pl-10"
                  />
                </div>
                <Button type="submit" disabled={loadingForgot} className="w-full">{loadingForgot ? <span className="animate-spin mr-2 inline-block w-4 h-4 border-2 border-t-2 border-indigo-500 rounded-full align-middle"></span> : null}Next</Button>
                {forgotMsg && <div className="bg-red-100 text-red-700 rounded px-3 py-2 text-sm">{forgotMsg}</div>}
              </form>
            ) : (
              <form onSubmit={handleResetPassword} className="flex flex-col gap-4 w-full">
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    type="password"
                    placeholder="New password"
                    value={resetPassword}
                    onChange={e => setResetPassword(e.target.value)}
                    minLength={6}
                    className="pl-10"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={loadingForgot || resetPassword.trim().length < 6}
                  className="w-full"
                >
                  {loadingForgot ? <span className="animate-spin mr-2 inline-block w-4 h-4 border-2 border-t-2 border-indigo-500 rounded-full align-middle"></span> : null}
                  Reset Password
                </Button>
                {forgotMsg && (
                  <div className={forgotMsg.includes("successful") ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700" + " rounded px-3 py-2 text-sm"}>
                    {forgotMsg}
                  </div>
                )}
              </form>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
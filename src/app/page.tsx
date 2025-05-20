"use client";
import { useState, useEffect } from "react";
import { Card, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Navbar } from "@/components/common/Navbar";
import { CalendarDays, BarChart2, ClipboardList, Briefcase, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { AuthModal } from "@/components/ui/AuthModal";

export default function Home() {
  const { user } = useAuth();
  const router = useRouter();
  const [authModalOpen, setAuthModalOpen] = useState(false);

  useEffect(() => {
    if (user) {
      router.replace("/dashboard");
    }
  }, [user, router]);

  if (user) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 via-white to-indigo-100">
        <Navbar />
        <main className="flex-1 flex flex-col items-center justify-center px-4">
          <div className="text-lg text-indigo-700 font-semibold mt-20">Redirecting to your dashboard...</div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 via-white to-indigo-100">
      <Navbar onLoginClick={() => setAuthModalOpen(true)} />
      <main className="flex-1 flex flex-col items-center justify-center px-4">
        {/* Hero Section */}
        <section className="w-full max-w-2xl text-center mt-12 mb-10">
          <h1 className="text-4xl md:text-5xl font-extrabold text-indigo-700 mb-4 drop-shadow-sm">Welcome to Excellence Tracker Work Tracer</h1>
          <p className="text-lg md:text-xl text-gray-700 mb-6">Excellence Tracker Work Tracer is your all-in-one platform for tracking attendance, performance, and work progress. Get insights, stay organized, and achieve excellence every month!</p>
          <Button
            size="lg"
            className="px-8 py-4 text-lg font-semibold shadow-md"
            onClick={() => {
              if (user) router.push("/dashboard");
              else setAuthModalOpen(true);
            }}
          >
            Get Started
          </Button>
        </section>
        {/* Report Cards Section */}
        <section className="w-full max-w-4xl mb-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <Card className="hover:shadow-xl transition-shadow cursor-pointer group border-2 border-transparent hover:border-indigo-400">
              <Link href="/" className="block p-6">
                <div className="flex items-center gap-4 mb-2">
                  <CalendarDays className="w-10 h-10 text-indigo-500 group-hover:scale-110 transition-transform" />
                  <span className="text-2xl font-bold text-indigo-700">Daily Report</span>
                </div>
                <CardDescription className="text-gray-600 text-base mt-2">
                  Log and review your daily attendance, working hours, and remarks. Stay on top of your day-to-day performance.
                </CardDescription>
              </Link>
            </Card>
            <Card className="hover:shadow-xl transition-shadow cursor-pointer group border-2 border-transparent hover:border-indigo-400">
              <Link href="/" className="block p-6">
                <div className="flex items-center gap-4 mb-2">
                  <BarChart2 className="w-10 h-10 text-indigo-500 group-hover:scale-110 transition-transform" />
                  <span className="text-2xl font-bold text-indigo-700">Monthly Report</span>
                </div>
                <CardDescription className="text-gray-600 text-base mt-2">
                  Analyze your monthly performance, attendance trends, and progress towards your goals with detailed summaries.
                </CardDescription>
              </Link>
            </Card>
            <Card className="hover:shadow-xl transition-shadow cursor-pointer group border-2 border-transparent hover:border-indigo-400">
              <Link href="/" className="block p-6">
                <div className="flex items-center gap-4 mb-2">
                  <ClipboardList className="w-10 h-10 text-indigo-500 group-hover:scale-110 transition-transform" />
                  <span className="text-2xl font-bold text-indigo-700">Leave Record</span>
                </div>
                <CardDescription className="text-gray-600 text-base mt-2">
                  Apply for leave and track your leave history with ease. Stay informed about your leave balance and approvals.
                </CardDescription>
              </Link>
            </Card>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="hover:shadow-xl transition-shadow cursor-pointer group border-2 border-transparent hover:border-indigo-400">
              <Link href="/" className="block p-6">
                <div className="flex items-center gap-4 mb-2">
                  <Briefcase className="w-10 h-10 text-indigo-500 group-hover:scale-110 transition-transform" />
                  <span className="text-2xl font-bold text-indigo-700">Work Record</span>
                </div>
                <CardDescription className="text-gray-600 text-base mt-2">
                  Maintain a comprehensive record of your work, achievements, and progress throughout your career.
                </CardDescription>
              </Link>
            </Card>
            <Card className="hover:shadow-xl transition-shadow cursor-pointer group border-2 border-transparent hover:border-indigo-400">
              <Link href="/" className="block p-6">
                <div className="flex items-center gap-4 mb-2">
                  <CheckCircle2 className="w-10 h-10 text-indigo-500 group-hover:scale-110 transition-transform" />
                  <span className="text-2xl font-bold text-indigo-700">Attendance</span>
                </div>
                <CardDescription className="text-gray-600 text-base mt-2">
                  Monitor your attendance, punctuality, and trends to ensure consistent performance and improvement.
                </CardDescription>
              </Link>
            </Card>
          </div>
        </section>
      </main>
      <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />
      <footer className="w-full text-center py-4 text-gray-400 text-sm border-t bg-white/60 mt-auto">
        &copy; {new Date().getFullYear()} Excellence Tracker Work Tracer. All rights reserved.
      </footer>
    </div>
  );
}

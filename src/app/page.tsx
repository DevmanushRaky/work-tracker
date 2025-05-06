import { Card, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Navbar } from "@/components/common/Navbar";
import { CalendarDays, BarChart2 } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 via-white to-indigo-100">
      <Navbar />
      <main className="flex-1 flex flex-col items-center justify-center px-4">
        {/* Hero Section */}
        <section className="w-full max-w-2xl text-center mt-12 mb-10">
          <h1 className="text-4xl md:text-5xl font-extrabold text-indigo-700 mb-4 drop-shadow-sm">Welcome to work Tracker</h1>
          <p className="text-lg md:text-xl text-gray-700 mb-6">Your all-in-one platform for tracking attendance, performance, and progress. Get insights, stay organized, and achieve excellence every month!</p>
          <Button asChild size="lg" className="px-8 py-4 text-lg font-semibold shadow-md">
            <Link href="/monthly">Get Started</Link>
          </Button>
        </section>
        {/* Report Cards Section */}
        <section className="w-full max-w-3xl grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          <Card className="hover:shadow-xl transition-shadow cursor-pointer group border-2 border-transparent hover:border-indigo-400">
            <Link href="/daily" className="block p-6">
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
            <Link href="/monthly" className="block p-6">
              <div className="flex items-center gap-4 mb-2">
                <BarChart2 className="w-10 h-10 text-indigo-500 group-hover:scale-110 transition-transform" />
                <span className="text-2xl font-bold text-indigo-700">Monthly Report</span>
              </div>
              <CardDescription className="text-gray-600 text-base mt-2">
                Analyze your monthly performance, attendance trends, and progress towards your goals with detailed summaries.
              </CardDescription>
            </Link>
          </Card>
        </section>
      </main>
      <footer className="w-full text-center py-4 text-gray-400 text-sm border-t bg-white/60 mt-auto">
        &copy; {new Date().getFullYear()} Excellence Dashboard. All rights reserved.
      </footer>
    </div>
  );
}

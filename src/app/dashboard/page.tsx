"use client";
import { useState, useEffect } from "react";
import { Navbar } from "@/components/common/Navbar";
import {  CalendarCheck, PlusCircle, List, CalendarDays, ChartBar, Banknote } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import AddDailyLogPanel from "./AddDailyLogPanel";
import ViewDailyLogPanel from "./ViewDailyLogPanel";
import MonthlyLogPanel from "./MonthlyLogPanel";
import LeaveLogPanel from "./LeaveLogPanel";
import AnalysisPanel from "./AnalysisPanel";
import ProfilePanel from "./ProfilePanel";
import SalaryPanel from "./SalaryPanel";
import { AuthGuard } from "@/components/AuthGuard";

const menu = [
  { key: "analysis", label: "Analysis", icon: <ChartBar className="w-5 h-5 mr-2" /> },
  { key: "addDaily", label: "Add Daily Log", icon: <PlusCircle className="w-5 h-5 mr-2" /> },
  { key: "viewDaily", label: "View Daily Log", icon: <List className="w-5 h-5 mr-2" /> },
  { key: "monthlyLog", label: "Monthly Log", icon: <CalendarDays className="w-5 h-5 mr-2" /> },
  { key: "leaves", label: "Leaves", icon: <CalendarCheck className="w-5 h-5 mr-2" /> },
  { key: "salary", label: "Salary", icon: <Banknote className="w-5 h-5 mr-2 text-green-600" /> },
];

export default function DashboardPage() {
  const [selected, setSelected] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("dashboardTab") || "analysis";
    }
    return "analysis";
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();
  const router = useRouter();

  const handleTabChange = (key: string) => {
    setSelected(key);
    if (typeof window !== "undefined") {
      localStorage.setItem("dashboardTab", key);
    }
  };

  useEffect(() => {
    if (user === null) {
      router.replace("/");
    }
  }, [user, router]);

  if (user === null) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-100">
        <div className="flex flex-col items-center gap-4">
          <span className="inline-block animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-indigo-500 border-solid"></span>
          <div className="text-lg text-indigo-700 font-semibold">Redirecting to login...</div>
        </div>
      </div>
    );
  }
  if (!user) return <div>Loading...</div>;

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-100">
        <div className="sticky top-0 z-30 bg-white shadow-sm">
          <Navbar 
            onOpenSidebar={() => setSidebarOpen(true)}
            onProfileClick={() => {
              setSelected('profile');
              if (typeof window !== 'undefined') {
                localStorage.setItem('dashboardTab', 'profile');
              }
            }}
          />
        </div>
        <div className="flex max-w-[95vw] mx-auto mt-6 rounded-2xl shadow-lg bg-white min-h-[60vh] h-[calc(100vh-5.5rem)]">
          {/* Sidebar */}
          {/* Desktop sidebar */}
          <aside className="hidden md:flex w-56 border-r bg-gray-50 rounded-l-2xl flex-col py-8 px-4 justify-between">
            <div>
              <h2 className="text-xl font-bold mb-8 text-indigo-700">Dashboard</h2>
              <nav className="flex flex-col gap-2">
                {menu.map(item => (
                  <button
                    key={item.key}
                    className={`flex items-center px-4 py-2 rounded-lg text-left font-medium transition-colors ${selected === item.key ? "bg-indigo-100 text-indigo-700" : "hover:bg-indigo-50 text-gray-700"}`}
                    onClick={() => handleTabChange(item.key)}
                  >
                    {item.icon}
                    {item.label}
                  </button>
                ))}
              </nav>
            </div>
          </aside>
          {/* Mobile sidebar overlay */}
          {sidebarOpen && (
            <div className="fixed inset-0 z-40 bg-black/30 md:hidden" onClick={() => setSidebarOpen(false)} />
          )}
          <aside
            className={`fixed top-0 left-0 z-50 h-full w-64 bg-gray-50 border-r rounded-r-2xl flex-col py-8 px-4 justify-between transition-transform duration-200 md:hidden ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
            style={{ boxShadow: sidebarOpen ? '0 0 0 9999px rgba(0,0,0,0.1)' : undefined }}
          >
            <div>
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-bold text-indigo-700">Dashboard</h2>
                <button className="p-1" onClick={() => setSidebarOpen(false)} aria-label="Close sidebar">✕</button>
              </div>
              <nav className="flex flex-col gap-2">
                {menu.map(item => (
                  <button
                    key={item.key}
                    className={`flex items-center px-4 py-2 rounded-lg text-left font-medium transition-colors ${selected === item.key ? "bg-indigo-100 text-indigo-700" : "hover:bg-indigo-50 text-gray-700"}`}
                    onClick={() => { handleTabChange(item.key); setSidebarOpen(false); }}
                  >
                    {item.icon}
                    {item.label}
                  </button>
                ))}
              </nav>
            </div>
          </aside>
          {/* Main Content */}
          <main className="flex-1 p-2 sm:p-4 md:p-8 overflow-y-auto">
            {selected === "analysis" && <AnalysisPanel />}
            {selected === "addDaily" && <AddDailyLogPanel />}
            {selected === "viewDaily" && <ViewDailyLogPanel/>}
            {selected === "monthlyLog" && <MonthlyLogPanel/>}
            {selected === "leaves" && <LeaveLogPanel/>}
            {selected === "salary" && <SalaryPanel />}
            {selected === "profile" && <ProfilePanel />}
          </main>
        </div>
      </div>
    </AuthGuard>
  );
} 
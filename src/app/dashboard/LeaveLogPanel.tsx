"use client";
import { useState, useEffect, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "react-toastify";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { AuthGuard } from "@/components/AuthGuard";

function addMonth(month: string, delta: number) {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function LeaveLogPanelContent() {
  const { user, token } = useAuth();
  const getCurrentMonth = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  };
  const [month, setMonth] = useState(getCurrentMonth());
  interface DailyLog {
    date: string;
    inTime?: string;
    outTime?: string;
    workingHour?: string;
    attendance: string;
    standup?: string;
    report?: string;
    remarks?: string;
  }
  const [dailyLogs, setDailyLogs] = useState<DailyLog[]>([]);

  // Fetch all daily logs for the user (for leave calculations)
  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await fetch(`/api/daily`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success && Array.isArray(data.records)) {
          setDailyLogs(data.records);
        } else {
          toast.error(data.message || "Failed to fetch logs", { className: "custom-toast custom-toast--error" });
        }
      } catch {
        toast.error("Failed to fetch logs", { className: "custom-toast custom-toast--error" });
      }
    };
    if (token && user) fetchLogs();
  }, [token, user]);

  // Filter leave logs for selected month and all time
  const leaveLogs = useMemo(() => dailyLogs.filter((log) => log.attendance === "Leave"), [dailyLogs]);
  const leaveLogsThisMonth = useMemo(() => leaveLogs.filter((log) => log.date.startsWith(month)), [leaveLogs, month]);
  const totalLeaveTaken = leaveLogs.filter((log) => log.date <= `${month}-31`).length;
  const leaveTakenThisMonth = leaveLogsThisMonth.length;

  // Earned leave and leave allowed per month from user profile
  const leaveAllowedPerMonth = typeof user?.leaveAllowedPerMonth === "number" ? user.leaveAllowedPerMonth : 0;
  // Earned leave is dynamic: sum up to selected month
  // For simplicity, assume earned leave is only increased by allowed per month if not used
  // We'll show the current value from user profile for now
  const earnedLeave = typeof user?.earnedLeave === "number" ? user.earnedLeave : 0;
  // Balance leave = earned + allowed for this month - total taken
  const balanceLeave = Math.max(0, (earnedLeave + leaveAllowedPerMonth) - totalLeaveTaken);

  if (user === null) {
    return (
      <div className="min-h-[40vh] flex flex-col items-center justify-center">
        <span className="inline-block animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-indigo-500 border-solid mb-4"></span>
        <div className="text-lg text-indigo-700 font-semibold">Redirecting to login...</div>
      </div>
    );
  }
  if (!user) return <div>Loading...</div>;

  return (
    <div className="w-full h-full p-0 sm:p-0 md:p-0 bg-white rounded-none shadow-none scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', overflowY: 'scroll' }}>
      {/* Month Selector */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between px-2 pt-2 pb-4 gap-2">
        <h2 className="text-3xl font-bold text-indigo-800">Leave Log</h2>
        <div className="flex justify-center items-center w-full max-w-xs md:w-auto mx-auto md:mx-0">
          <Button variant="outline" size="icon" className="rounded-full" aria-label="Previous month" onClick={() => setMonth(addMonth(month, -1))} type="button">
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <Input type="month" value={month} onChange={e => setMonth(e.target.value)} className="mx-2 w-full min-w-[100px] max-w-[180px] h-10 text-base px-4 py-2 border rounded-lg bg-gray-50 text-center" min="2020-01" max="2100-12" />
          <Button variant="outline" size="icon" className="rounded-full" aria-label="Next month" onClick={() => setMonth(addMonth(month, 1))} type="button">
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
      </div>
      {/* Summary Cards */}
      <div className="w-full grid grid-cols-2 sm:grid-cols-4 md:grid-cols-4 gap-4 mb-8 px-2">
        <Card className="flex flex-col items-center p-3 gap-1 text-xs">
          <span className="text-muted-foreground">Total Leave Taken</span>
          <span className="text-xl font-bold">{totalLeaveTaken}</span>
        </Card>
        <Card className="flex flex-col items-center p-3 gap-1 text-xs">
          <span className="text-muted-foreground">Leave Taken (This Month)</span>
          <span className="text-xl font-bold">{leaveTakenThisMonth}</span>
        </Card>
        <Card className="flex flex-col items-center p-3 gap-1 text-xs">
          <span className="text-muted-foreground">Earned Leave</span>
          <span className="text-xl font-bold">{earnedLeave}</span>
        </Card>
        <Card className="flex flex-col items-center p-3 gap-1 text-xs">
          <span className="text-muted-foreground">Balance Leave</span>
          <span className="text-xl font-bold">{balanceLeave}</span>
        </Card>
        <Card className="flex flex-col items-center p-3 gap-1 text-xs">
          <span className="text-muted-foreground">Leave Allowed/Month</span>
          <span className="text-xl font-bold">{leaveAllowedPerMonth}</span>
        </Card>
      </div>
      {/* Leave Days Table */}
      <div className="w-full overflow-x-auto px-2">
        <table className="min-w-[600px] w-full text-base border-separate border-spacing-0 bg-white rounded-xl shadow-sm">
          <thead className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b">
            <tr>
              <th className="border-b px-2 sm:px-6 py-3 text-left font-semibold text-gray-700 whitespace-nowrap">Date</th>
              <th className="border-b px-2 sm:px-6 py-3 text-left font-semibold text-gray-700 whitespace-nowrap">Attendance</th>
              <th className="border-b px-2 sm:px-6 py-3 text-left font-semibold text-gray-700 whitespace-nowrap">Remarks</th>
            </tr>
          </thead>
          <tbody>
            {leaveLogsThisMonth.length === 0 ? (
              <tr><td colSpan={3} className="text-center py-8 text-lg text-gray-400">No leave taken in this month.</td></tr>
            ) : (
              leaveLogsThisMonth.map((log, i) => (
                <tr key={i} className="even:bg-gray-50 hover:bg-primary/10 transition">
                  <td className="px-2 sm:px-4 py-2">{log.date}</td>
                  <td className="px-2 sm:px-4 py-2">{log.attendance}</td>
                  <td className="px-2 sm:px-4 py-2">{log.remarks || "-"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function LeaveLogPanel() {
  return (
    <AuthGuard>
      <LeaveLogPanelContent />
    </AuthGuard>
  );
} 
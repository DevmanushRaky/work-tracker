"use client";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { AuthGuard } from "@/components/AuthGuard";

interface DailyRecord {
  date: string;
  inTime: string;
  outTime: string;
  workingHour: string;
  attendance: string;
  remarks: string;
}

type Summary = {
  month: string;
  totalDays: number;
  leaves: number;
  holiday: number;
  weekend: number;
  workingDays: number;
  workingHour: number;
  targetHour: number;
  perDayWorking: string | number;
  absent?: number;
  present?: number;
  earnedLeave?: number;
  leaveAllowedPerMonth?: number;
  balanceLeave?: number;
};

function addMonth(month: string, delta: number) {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function MonthlyLogPanelContent() {
  const { user, token } = useAuth();
  const router = useRouter();
  const getCurrentMonth = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  };
  const [month, setMonth] = useState(getCurrentMonth());
  const [summary, setSummary] = useState<Summary | null>(null);
  const [dailyRecords, setDailyRecords] = useState<DailyRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user === null) {
      router.replace("/");
    }
  }, [user, router]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError("");
      try {
        const monthlyRes = await fetch(`/api/monthly?month=${month}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const monthlyData = await monthlyRes.json();
        if (!monthlyData.success) {
          toast.error(monthlyData.message || "Failed to fetch monthly data", { className: "custom-toast custom-toast--error" });
          setError(monthlyData.message || "Failed to fetch monthly data");
          setSummary(null);
          setDailyRecords([]);
        } else {
          setSummary(monthlyData.summary);
          setDailyRecords(monthlyData.records || []);
        }
      } catch {
        toast.error("Failed to fetch data", { className: "custom-toast custom-toast--error" });
        setError("Failed to fetch data");
        setSummary(null);
        setDailyRecords([]);
      } finally {
        setLoading(false);
      }
    };
    if (token && user) fetchData();
  }, [month, token, user]);

  // Recalculate correct values from dailyRecords
  const totalDays = new Date(Number(month.split('-')[0]), Number(month.split('-')[1]), 0).getDate();
  const weekends = dailyRecords.filter(r => r.attendance === "Weekend").length;
  const holidays = dailyRecords.filter(r => r.attendance === "Holiday").length;
  const present = dailyRecords.filter(r => r.attendance === "Present" || r.attendance === "Work from Home").length;
  const leaves = dailyRecords.filter(r => r.attendance === "Leave").length;
  const absents = dailyRecords.filter(r => r.attendance === "Absent").length;
  const workingDays = totalDays - weekends - holidays;
  const targetHour = workingDays * 9;

  const leaveAllowed = summary?.leaveAllowedPerMonth || 0;
  const leavesTaken = summary?.leaves || 0;
  const workingHour = summary?.workingHour || 0;
  const workingHourPercent = targetHour > 0 ? Math.min(100, (workingHour / targetHour) * 100) : 0;

  // Analysis
  let analysis = "";
  if (workingHourPercent >= 100 && leavesTaken <= leaveAllowed) {
    analysis = "Excellent! You met or exceeded your target.";
  } else if (workingHourPercent >= 90) {
    analysis = "Good! You're close to your target.";
  } else {
    analysis = `You need ${(targetHour - workingHour).toFixed(2)} more hours to meet your target.`;
  }
  if (leavesTaken > leaveAllowed) {
    analysis += ` You exceeded allowed leaves.`;
  }

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
      {/* Hide scrollbar for all browsers */}
      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
      {/* Heading and Month Selector Row */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between px-2 pt-2 pb-4 gap-2">
        <h2 className="text-3xl font-bold text-indigo-800">Monthly Log</h2>
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
      {/* Summary Grid */}
      {loading ? (
        <div className="flex justify-center items-center py-16">
          <span className="inline-block animate-spin rounded-full h-10 w-10 border-t-4 border-b-4 border-indigo-500 border-solid"></span>
        </div>
      ) : error ? (
        <div className="text-center py-12 text-base text-red-600">{error}</div>
      ) : summary ? (
        <>
          <div className="w-full grid grid-cols-2 sm:grid-cols-4 md:grid-cols-4 gap-4 mb-8 px-2">
            <Card className="flex flex-col items-center p-3 gap-1 text-xs">
              <span className="text-muted-foreground">Leaves Allowed</span>
              <span className="text-xl font-bold">{summary?.leaveAllowedPerMonth ?? 0}</span>
            </Card>
            <Card className="flex flex-col items-center p-3 gap-1 text-xs">
              <span className="text-muted-foreground">Leaves Taken</span>
              <span className="text-xl font-bold">{leaves}</span>
            </Card>
            <Card className="flex flex-col items-center p-3 gap-1 text-xs">
              <span className="text-muted-foreground">Working Days</span>
              <span className="text-xl font-bold">{workingDays}</span>
              <span className="text-[10px]">Target: {workingDays}</span>
            </Card>
            <Card className="flex flex-col items-center p-3 gap-1 text-xs">
              <span className="text-muted-foreground">Working Hours</span>
              <span className="text-xl font-bold">{summary?.workingHour?.toFixed(2) ?? 0}</span>
              <span className="text-[10px]">Target: {targetHour}</span>
              <Progress value={workingHourPercent} className="w-full h-1 mt-1" />
            </Card>
            <Card className="flex flex-col items-center p-3 gap-1 text-xs">
              <span className="text-muted-foreground">Absent Days</span>
              <span className="text-xl font-bold">{absents}</span>
            </Card>
            <Card className="flex flex-col items-center p-3 gap-1 text-xs">
              <span className="text-muted-foreground">Present Days</span>
              <span className="text-xl font-bold">{present}</span>
            </Card>
            <Card className="flex flex-col items-center p-3 gap-1 text-xs">
              <span className="text-muted-foreground">Holidays</span>
              <span className="text-xl font-bold">{holidays}</span>
            </Card>
            <Card className="flex flex-col items-center p-3 gap-1 text-xs">
              <span className="text-muted-foreground">Weekends</span>
              <span className="text-xl font-bold">{weekends}</span>
            </Card>
          </div>
          {/* Analysis */}
          <div className="w-full mb-8 px-2">
            <Card className="p-4 bg-muted/40 border-none shadow-none">
              <span className="font-semibold text-lg">Analysis:</span>
              <span className="ml-2 text-base">{analysis}</span>
            </Card>
          </div>
          {/* Daily Breakdown Table */}
          <div className="w-full overflow-x-auto px-2">
            <table className="min-w-[900px] w-full text-base border-separate border-spacing-0 bg-white rounded-xl shadow-sm">
              <thead className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b">
                <tr>
                  <th className="border-b px-2 sm:px-6 py-3 text-left font-semibold text-gray-700 whitespace-nowrap">Date</th>
                  <th className="border-b px-2 sm:px-6 py-3 text-left font-semibold text-gray-700 whitespace-nowrap">Day</th>
                  <th className="border-b px-2 sm:px-6 py-3 text-left font-semibold text-gray-700 whitespace-nowrap">In Time</th>
                  <th className="border-b px-2 sm:px-6 py-3 text-left font-semibold text-gray-700 whitespace-nowrap">Out Time</th>
                  <th className="border-b px-2 sm:px-6 py-3 text-left font-semibold text-gray-700 whitespace-nowrap">Working Hour</th>
                  <th className="border-b px-2 sm:px-6 py-3 text-left font-semibold text-gray-700 whitespace-nowrap">Attendance</th>
                  <th className="border-b px-2 sm:px-6 py-3 text-left font-semibold text-gray-700 whitespace-nowrap">Remarks</th>
                </tr>
              </thead>
              <tbody>
                {dailyRecords.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-8 text-lg text-gray-400">No daily records.</td></tr>
                ) : (
                  dailyRecords.map((r, i) => {
                    const dateObj = new Date(r.date);
                    const day = format(dateObj, "EEE");
                    let badgeVariant: "default" | "destructive" | "secondary" | "outline" = "outline";
                    switch (r.attendance) {
                      case "Present": badgeVariant = "default"; break;
                      case "Absent": badgeVariant = "destructive"; break;
                      case "Leave": badgeVariant = "secondary"; break;
                      case "Holiday": badgeVariant = "outline"; break;
                      case "Weekend": badgeVariant = "outline"; break;
                      case "Work from Home": badgeVariant = "default"; break;
                      case "Halfday": badgeVariant = "secondary"; break;
                      default: badgeVariant = "outline";
                    }
                    return (
                      <tr key={i} className="even:bg-gray-50 hover:bg-primary/10 transition">
                        <td className="px-2 sm:px-4 py-2">{r.date}</td>
                        <td className="px-2 sm:px-4 py-2">
                          <Badge className="bg-gray-100 text-gray-600 border border-gray-200 px-2 py-0.5 text-xs font-semibold rounded-md">{day}</Badge>
                        </td>
                        <td className="px-2 sm:px-4 py-2">{r.inTime}</td>
                        <td className="px-2 sm:px-4 py-2">{r.outTime}</td>
                        <td className="px-2 sm:px-4 py-2">{r.workingHour}</td>
                        <td className="px-2 sm:px-4 py-2">
                          <Badge variant={badgeVariant} className="capitalize px-2 py-1 text-xs font-semibold shadow-sm rounded-full">{r.attendance}</Badge>
                        </td>
                        <td className="px-2 sm:px-4 py-2 max-w-xs break-words">{r.remarks}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </>
      ) : null}
    </div>
  );
}

export default function MonthlyLogPanel() {
  return (
    <AuthGuard>
      <MonthlyLogPanelContent />
    </AuthGuard>
  );
} 
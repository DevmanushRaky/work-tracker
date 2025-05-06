"use client";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Navbar } from "@/components/common/Navbar";
import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableRow, TableCell, TableBody } from "@/components/ui/table";
import { format } from "date-fns";
import { useAuth, User } from "@/hooks/useAuth";
import { Progress } from "@/components/ui/progress";
import { useRouter } from "next/navigation";

// Add type for dailyRecords
interface DailyRecord {
  date: string;
  inTime: string;
  outTime: string;
  workingHour: string;
  attendance: string;
  remarks: string;
}

function addMonth(month: string, delta: number) {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default function MonthlyPage() {
  const { user, token } = useAuth();
  const router = useRouter();

  // All hooks must be called before any return!
  const getCurrentMonth = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  };
  const [month, setMonth] = useState(getCurrentMonth());
  const [profile, setProfile] = useState<Partial<User> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [dailyRecords, setDailyRecords] = useState<DailyRecord[]>([]);
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
  };
  const [summary, setSummary] = useState<Summary | null>(null);
  // Earned Leave Logic
  const [earnedLeave, setEarnedLeave] = useState(0);

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
        // Fetch user profile
        const profileRes = await fetch("/api/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const profileData: unknown = await profileRes.json();
        const typedProfileData = profileData as { success: boolean; user: Partial<User> };
        if (!typedProfileData.success) throw new Error((typedProfileData as { message?: string }).message || "Failed to fetch profile");
        setProfile(typedProfileData.user);

        // Fetch daily logs
        const dailyRes = await fetch(`/api/daily?month=${month}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const dailyData: unknown = await dailyRes.json();
        const typedDailyData = dailyData as { success: boolean; records: DailyRecord[]; message?: string };
        if (!typedDailyData.success) throw new Error(typedDailyData.message || "Failed to fetch daily logs");
        setDailyRecords(typedDailyData.records || []);

        // Calculate summary (reuse logic from /api/monthly if needed)
        const totalDays: number = typedDailyData.records ? new Set(typedDailyData.records.map((r: DailyRecord) => r.date)).size : 0;
        const leaves: number = typedDailyData.records ? typedDailyData.records.filter((r: DailyRecord) => r.attendance === "Leave").length : 0;
        const holiday: number = typedDailyData.records ? typedDailyData.records.filter((r: DailyRecord) => r.attendance === "Holiday").length : 0;
        const weekend: number = typedDailyData.records ? typedDailyData.records.filter((r: DailyRecord) => r.attendance === "Weekend").length : 0;
        const workingDays: number = typedDailyData.records ? typedDailyData.records.filter((r: DailyRecord) => r.attendance !== "Weekend" && r.attendance !== "Holiday").length : 0;
        const workingHour: number = typedDailyData.records ? typedDailyData.records.reduce((sum: number, r: DailyRecord) => sum + (parseFloat(r.workingHour) || 0), 0) : 0;
        const targetHour: number = workingDays * 9;
        const perDayWorking: number = workingDays > 0 ? workingHour / workingDays : 0;
        setSummary({
          month,
          totalDays,
          leaves,
          holiday,
          weekend,
          workingDays,
          workingHour,
          targetHour,
          perDayWorking,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch data");
      } finally {
        setLoading(false);
      }
    };
    if (token && user) fetchData();
  }, [month, token, user]);

  useEffect(() => {
    if (profile && typeof (profile as Partial<User>).leaveAllowedPerMonth === "number" && summary) {
      const allowed = (profile as Partial<User>).leaveAllowedPerMonth as number;
      // If no leaves taken, add allowed leaves to earned leave
      if (summary.leaves === 0) {
        setEarnedLeave((prev) => prev + allowed);
      } else {
        // If leaves taken, deduct from earned leave (if any), else from allowed
        const excess = summary.leaves - allowed;
        if (excess > 0) {
          setEarnedLeave((prev) => Math.max(0, prev - excess));
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [summary?.leaves, profile?.leaveAllowedPerMonth]);

  let leaveAllowed = 0;
  if (profile && typeof profile.leaveAllowedPerMonth === "number") {
    leaveAllowed = profile.leaveAllowedPerMonth;
  }
  const workingDays: number = summary && typeof summary.workingDays === 'number' ? summary.workingDays : 0;
  const targetHour: number = summary && typeof summary.targetHour === 'number' ? summary.targetHour : 0;
  const leavesTaken: number = summary && typeof summary.leaves === 'number' ? summary.leaves : 0;
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
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-100">
        <div className="flex flex-col items-center gap-4">
          <span className="inline-block animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-indigo-500 border-solid"></span>
          <div className="text-lg text-indigo-700 font-semibold">Redirecting to login...</div>
        </div>
      </div>
    );
  }

  if (!month) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary border-solid"></span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col p-0">
      <Navbar />
      <div className="w-full max-w-7xl mx-auto mt-8 mb-8 flex flex-col items-center justify-center px-2 sm:px-4 md:px-12">
        <Card className="w-full max-w-full p-4 sm:p-8 md:p-12 rounded-3xl border shadow-lg flex flex-col items-center">
          <CardHeader className="w-full flex flex-col items-center mb-4">
            <CardTitle className="text-3xl mb-2">Monthly Performance Report</CardTitle>
            <CardDescription className="mt-2 text-lg">Comprehensive summary and analysis for the selected month.</CardDescription>
          </CardHeader>
          <CardContent className="w-full flex flex-col items-center">
            {/* Month Selector */}
            <div className="flex flex-col md:flex-row gap-6 items-center mb-10 w-full justify-center">
              <label className="font-semibold text-lg">Select Month:</label>
              <div className="flex items-center gap-2">
                <button className="p-2 rounded-full hover:bg-muted transition" aria-label="Previous month" onClick={() => setMonth(addMonth(month, -1))} type="button">
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <Input type="month" value={month} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMonth(e.target.value)} className="w-[180px] h-12 text-lg px-4 py-2 border-2 border-muted rounded-lg shadow-sm" min="2020-01" max="2100-12" />
                <button className="p-2 rounded-full hover:bg-muted transition" aria-label="Next month" onClick={() => setMonth(addMonth(month, 1))} type="button">
                  <ChevronRight className="w-6 h-6" />
                </button>
              </div>
            </div>
            {/* Summary Grid */}
            {loading ? (
              <div className="text-muted-foreground text-xl py-12">Loading...</div>
            ) : error ? (
              <div className="text-red-600 text-xl py-12">{error}</div>
            ) : summary ? (
              <>
                <div className="w-full grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
                  <Card className="flex flex-col items-center p-6 gap-2">
                    <span className="text-sm text-muted-foreground">Working Days</span>
                    <span className="text-2xl font-bold">{workingDays}</span>
                    <span className="text-xs">Target: {workingDays}</span>
                  </Card>
                  <Card className="flex flex-col items-center p-6 gap-2">
                    <span className="text-sm text-muted-foreground">Working Hours</span>
                    <span className="text-2xl font-bold">{workingHour.toFixed(2)}</span>
                    <span className="text-xs">Target: {targetHour}</span>
                    <Progress value={workingHourPercent} className="w-full h-2 mt-2" />
                  </Card>
                  <Card className="flex flex-col items-center p-6 gap-2">
                    <span className="text-sm text-muted-foreground">Leaves Taken</span>
                    <span className="text-2xl font-bold">{leavesTaken}</span>
                    <span className="text-xs">Allowed: {leaveAllowed}</span>
                    <Badge variant={leavesTaken > leaveAllowed ? "destructive" : "default"}>{leavesTaken > leaveAllowed ? "Exceeded" : "OK"}</Badge>
                  </Card>
                  <Card className="flex flex-col items-center p-6 gap-2">
                    <span className="text-sm text-muted-foreground">Earned Leave</span>
                    <span className="text-2xl font-bold">{earnedLeave}</span>
                    <span className="text-xs">(Carried forward)</span>
                  </Card>
                </div>
                {/* Analysis */}
                <div className="w-full mb-8">
                  <Card className="p-4 bg-muted/40 border-none shadow-none">
                    <span className="font-semibold text-lg">Analysis:</span>
                    <span className="ml-2 text-base">{analysis}</span>
                  </Card>
                </div>
                {/* Daily Breakdown Table */}
                <div className="w-full overflow-x-auto">
                  <Table className="min-w-[900px] w-full text-sm border-separate border-spacing-0 bg-white rounded-xl shadow-sm">
                    <TableHeader>
                      <TableRow className="bg-muted text-muted-foreground">
                        <TableCell>Date</TableCell>
                        <TableCell>Day</TableCell>
                        <TableCell>In Time</TableCell>
                        <TableCell>Out Time</TableCell>
                        <TableCell>Working Hour</TableCell>
                        <TableCell>Attendance</TableCell>
                        <TableCell>Remarks</TableCell>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dailyRecords.length === 0 ? (
                        <TableRow><TableCell colSpan={7} className="text-center py-8 text-lg text-gray-400">No daily records.</TableCell></TableRow>
                      ) : (
                        dailyRecords.map((r, i) => {
                          const dateObj = new Date(r.date);
                          const day = format(dateObj, "EEE");
                          return (
                            <TableRow key={i} className="even:bg-gray-50">
                              <TableCell>{r.date}</TableCell>
                              <TableCell>{day}</TableCell>
                              <TableCell>{r.inTime}</TableCell>
                              <TableCell>{r.outTime}</TableCell>
                              <TableCell>{r.workingHour}</TableCell>
                              <TableCell><Badge variant={r.attendance === "Present" ? "default" : r.attendance === "Leave" ? "destructive" : "secondary"}>{r.attendance}</Badge></TableCell>
                              <TableCell>{r.remarks}</TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
              </>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 
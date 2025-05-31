import { useState, useEffect, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableCell } from "@/components/ui/table";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "react-toastify";
import { ChevronLeft, ChevronRight, Banknote, Info } from "lucide-react";
import { format, endOfMonth } from "date-fns";
import { AuthGuard } from "@/components/AuthGuard";

// Define the type for daily logs
interface DailyLog {
  date: string;
  inTime: string;
  outTime: string;
  workingHour: string;
  attendance: string;
  standup: string;
  report: string;
  remarks: string;
}

function addMonth(month: string, delta: number) {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function SalaryPanelContent() {
  const { user, token } = useAuth();
  const getCurrentMonth = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  };
  const [month, setMonth] = useState(getCurrentMonth());
  const [dailyLogs, setDailyLogs] = useState<DailyLog[]>([]);

  // Fetch all daily logs for the user (for salary calculations)
  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await fetch(`/api/daily?month=${month}`, {
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
  }, [token, user, month]);

  // Defensive: always treat salaryHistory as an array
  const salaryHistory = Array.isArray(user?.salaryHistory) ? user.salaryHistory : [];

  // --- Salary selection logic: use the latest salary whose 'from' is <= last day of the month ---
  const currentSalaryRecord = useMemo(() => {
    if (!salaryHistory.length) return null;
    const monthEnd = endOfMonth(new Date(month + "-01"));
    // Find the last record whose from date is <= last day of the selected month
    let last = null;
    for (const rec of salaryHistory) {
      if (new Date(rec.from) <= monthEnd) {
        if (!last || new Date(rec.from) > new Date(last.from)) {
          last = rec;
        }
      }
    }
    return last;
  }, [salaryHistory, month]);
  const currentSalary = currentSalaryRecord?.salary || 0;
  const currentPosition = currentSalaryRecord?.position || "-";
  const salaryCreditedDay = user?.salaryCreditedDay || 7;
  const salaryEffectiveFrom = currentSalaryRecord?.from ? format(new Date(currentSalaryRecord.from), "dd MMM yyyy") : "-";

  // Attendance calculations
  const presentDays = dailyLogs.filter(log => log.attendance === "Present").length;
  const wfhDays = dailyLogs.filter(log => log.attendance === "Work from Home").length;
  const leaveDays = dailyLogs.filter(log => log.attendance === "Leave").length;
  const totalWorkingDays = presentDays + wfhDays + leaveDays; // Only count days with logs
  const totalPresentOrWFH = presentDays + wfhDays;
  const perDaySalary = totalWorkingDays > 0 ? currentSalary / totalWorkingDays : 0;
  const deduction = perDaySalary * leaveDays;
  const netSalary = currentSalary - deduction;

  // Month/year for display
  const monthDisplay = format(new Date(month + "-01"), "MMMM yyyy");

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
        <h2 className="text-3xl font-bold text-indigo-800 flex items-center gap-2"><Banknote className="w-7 h-7 text-green-600" />Salary</h2>
        <div className="flex justify-center items-center w-full max-w-xs md:w-auto mx-auto md:mx-0">
          <button
            className="rounded-full border p-2 bg-white hover:bg-gray-100"
            aria-label="Previous month"
            onClick={() => setMonth(addMonth(month, -1))}
            type="button"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <Input
            type="month"
            value={month}
            onChange={e => setMonth(e.target.value)}
            className="mx-2 w-full min-w-[100px] max-w-[180px] h-10 text-base px-4 py-2 border rounded-lg bg-gray-50 text-center"
            min="2020-01"
            max="2100-12"
          />
          <button
            className="rounded-full border p-2 bg-white hover:bg-gray-100"
            aria-label="Next month"
            onClick={() => setMonth(addMonth(month, 1))}
            type="button"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
      {/* Salary Summary Cards */}
      <div className="w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 mb-8 px-2">
        <Card className="flex flex-col items-center p-4 gap-2 text-xs border-2 border-green-200 bg-green-50">
          <span className="text-muted-foreground flex items-center gap-1">Current Salary <Info className="w-4 h-4 text-gray-400" /></span>
          <span className="text-2xl font-bold text-green-700">₹{currentSalary.toLocaleString()}</span>
          <span className="text-xs text-gray-500">({currentPosition})</span>
          <span className="text-xs text-gray-400">Effective from: <b>{salaryEffectiveFrom}</b></span>
        </Card>
        <Card className="flex flex-col items-center p-4 gap-2 text-xs border-2 border-indigo-200 bg-indigo-50">
          <span className="text-muted-foreground">Month</span>
          <span className="text-2xl font-bold">{monthDisplay}</span>
        </Card>
        <Card className="flex flex-col items-center p-4 gap-2 text-xs border-2 border-blue-200 bg-blue-50">
          <span className="text-muted-foreground">Working Days (Present+WFH)</span>
          <span className="text-2xl font-bold">{totalPresentOrWFH}</span>
        </Card>
        <Card className="flex flex-col items-center p-4 gap-2 text-xs border-2 border-yellow-200 bg-yellow-50">
          <span className="text-muted-foreground">Leave Days</span>
          <span className="text-2xl font-bold">{leaveDays}</span>
        </Card>
        <Card className="flex flex-col items-center p-4 gap-2 text-xs border-2 border-gray-200 bg-gray-50">
          <span className="text-muted-foreground">Salary Credited On</span>
          <span className="text-2xl font-bold">{String(salaryCreditedDay ?? '')}<sup>th</sup></span>
        </Card>
      </div>
      {/* Salary Calculation Table */}
      <div className="w-full max-w-2xl mx-auto mb-8 px-2">
        <Card className="p-6 border-2 border-indigo-100 bg-white/90">
          <div className="flex items-center gap-2 text-lg font-semibold text-indigo-800 mb-2">
            Salary Calculation for {monthDisplay}
            <Info className="w-5 h-5 text-gray-400" />
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableCell className="font-bold">Description</TableCell>
                <TableCell className="font-bold">Value</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow className="bg-green-50">
                <TableCell className="font-bold">Base Salary</TableCell>
                <TableCell className="font-bold text-green-700">₹{currentSalary.toLocaleString()}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Working Days (Present + WFH + Leave)</TableCell>
                <TableCell>{totalWorkingDays}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Present + WFH Days</TableCell>
                <TableCell>{totalPresentOrWFH}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Leave Days</TableCell>
                <TableCell>{leaveDays}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Per Day Salary</TableCell>
                <TableCell>₹{perDaySalary.toFixed(2)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="text-red-700 font-semibold">Deduction for Leave</TableCell>
                <TableCell className="text-red-600 font-semibold">-₹{deduction.toFixed(2)}</TableCell>
              </TableRow>
              <TableRow className="bg-green-50">
                <TableCell className="font-bold">Net Salary (Credited)</TableCell>
                <TableCell className="font-bold text-green-700">₹{netSalary.toFixed(2)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
          <div className="text-xs text-gray-500 mt-2 flex items-center gap-1">
            <Info className="w-4 h-4 text-gray-400" />
            <span>
              <span className="font-semibold">Note:</span> Net salary is calculated as <span className="font-mono">Base Salary - (Per Day Salary × Leave Days)</span>. Only full-day leaves are deducted. Salary is credited on the <span>{String(salaryCreditedDay ?? '')}<sup>th</sup></span> of the month.
            </span>
          </div>
        </Card>
      </div>
      {/* Salary History Table */}
      <div className="w-full max-w-3xl mx-auto mb-8 px-2">
        <Card className="p-4 border-2 border-gray-100 bg-white/95">
          <div className="text-lg font-semibold text-indigo-800 mb-2">Salary History</div>
          {salaryHistory.length === 0 ? (
            <div className="text-gray-400 text-center py-8">No salary history available.</div>
          ) : salaryHistory.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableCell className="font-bold">From</TableCell>
                  <TableCell className="font-bold">Salary</TableCell>
                  <TableCell className="font-bold">Position</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {salaryHistory
                  .slice()
                  .sort((a, b) => new Date(b.from).getTime() - new Date(a.from).getTime())
                  .map((s, i) => (
                    <TableRow key={i} className={currentSalaryRecord && s.from === currentSalaryRecord.from ? "bg-green-50" : ""}>
                      <TableCell>{format(new Date(s.from), "yyyy-MM-dd")}</TableCell>
                      <TableCell>₹{s.salary.toLocaleString()}</TableCell>
                      <TableCell>{s.position || "-"}</TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          ) : null}
        </Card>
      </div>
    </div>
  );
}

export default function SalaryPanel() {
  return (
    <AuthGuard>
      <SalaryPanelContent />
    </AuthGuard>
  );
} 
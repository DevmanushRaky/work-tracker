import React, { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

type DailyReport = {
  date: string;
  inTime: string;
  outTime: string;
  workingHour: string;
  attendance: string;
  standup: string;
  report: string;
  remarks: string;
};

const CARD_CLASS =
  "flex flex-col items-center justify-center bg-white rounded-xl shadow px-3 py-2 min-w-[110px] min-h-[60px] border border-gray-100";

function getWeekday(dateStr: string) {
  return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][new Date(dateStr).getDay()];
}

function getMonth(dateStr: string) {
  return dateStr.slice(0, 7); // YYYY-MM
}

export default function AnalysisPanel() {
  const { token } = useAuth();
  const [logs, setLogs] = useState<DailyReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchLogs() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/daily", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success && Array.isArray(data.records)) {
          setLogs(data.records);
        } else {
          setError(data.message || "Failed to fetch logs");
        }
      } catch {
        setError("Failed to fetch logs");
      }
      setLoading(false);
    }
    if (token) fetchLogs();
  }, [token]);

  // --- Calculations ---
  const summary = useMemo(() => {
    let present = 0,
      leave = 0,
      workingHour = 0;
    logs.forEach((log) => {
      if (log.attendance === "Present" || log.attendance === "Work from Home") present++;
      if (log.attendance === "Leave") leave++;
      if (log.workingHour) workingHour += parseFloat(log.workingHour) || 0;
    });
    return { present, leave, workingHour: workingHour.toFixed(2) };
  }, [logs]);

  // --- Monthly Chart Data ---
  const monthlyData = useMemo(() => {
    const byMonth: Record<string, { working: number; required: number }> = {};
    logs.forEach((log) => {
      const month = getMonth(log.date);
      if (!byMonth[month]) byMonth[month] = { working: 0, required: 0 };
      byMonth[month].working += parseFloat(log.workingHour) || 0;
      // Assume 9 hours/day required for Present/WFH
      if (log.attendance === "Present" || log.attendance === "Work from Home") byMonth[month].required += 9;
    });
    const months = Object.keys(byMonth).sort();
    return {
      labels: months,
      datasets: [
        {
          label: "Working Hour",
          data: months.map((m) => byMonth[m].working),
          backgroundColor: "#6366f1",
        },
        {
          label: "Required Hour",
          data: months.map((m) => byMonth[m].required),
          backgroundColor: "#a5b4fc",
        },
      ],
    };
  }, [logs]);

  // --- Weekly Chart Data (last 6 weeks) ---
  const weeklyData = useMemo(() => {
    // Group logs by week (ISO week)
    const byWeek: Record<string, { working: number; required: number }> = {};
    logs.forEach((log) => {
      const d = new Date(log.date);
      // Get ISO week string: YYYY-Www
      const week = `${d.getFullYear()}-W${String(
        Math.ceil(((d.getTime() - new Date(d.getFullYear(), 0, 1).getTime()) / 86400000 + new Date(d.getFullYear(), 0, 1).getDay() + 1) / 7)
      ).padStart(2, "0")}`;
      if (!byWeek[week]) byWeek[week] = { working: 0, required: 0 };
      byWeek[week].working += parseFloat(log.workingHour) || 0;
      if (log.attendance === "Present" || log.attendance === "Work from Home") byWeek[week].required += 9;
    });
    const weeks = Object.keys(byWeek).sort().slice(-6); // last 6 weeks
    return {
      labels: weeks,
      datasets: [
        {
          label: "Working Hour",
          data: weeks.map((w) => byWeek[w].working),
          backgroundColor: "#34d399",
        },
        {
          label: "Required Hour",
          data: weeks.map((w) => byWeek[w].required),
          backgroundColor: "#bbf7d0",
        },
      ],
    };
  }, [logs]);

  // --- Most Active Day (week & month) ---
  const mostActive = useMemo(() => {
    // This week
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    const weekLogs = logs.filter((log) => {
      const d = new Date(log.date);
      return d >= startOfWeek && d <= endOfWeek;
    });
    // Find the single date with the highest working hour in the week
    let mostActiveWeekDate = '-';
    let mostActiveWeekHour = '0.00';
    if (weekLogs.length > 0) {
      const maxLog = weekLogs.reduce((max, log) => (parseFloat(log.workingHour) > parseFloat(max.workingHour) ? log : max), weekLogs[0]);
      mostActiveWeekDate = `${maxLog.date} (${getWeekday(maxLog.date)})`;
      mostActiveWeekHour = parseFloat(maxLog.workingHour).toFixed(2);
    }

    // This month
    const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const monthLogs = logs.filter((log) => log.date.startsWith(monthStr));
    let mostActiveMonthDate = '-';
    let mostActiveMonthHour = '0.00';
    if (monthLogs.length > 0) {
      const maxLog = monthLogs.reduce((max, log) => (parseFloat(log.workingHour) > parseFloat(max.workingHour) ? log : max), monthLogs[0]);
      mostActiveMonthDate = `${maxLog.date} (${getWeekday(maxLog.date)})`;
      mostActiveMonthHour = parseFloat(maxLog.workingHour).toFixed(2);
    }
    return { week: mostActiveWeekDate, weekHour: mostActiveWeekHour, month: mostActiveMonthDate, monthHour: mostActiveMonthHour };
  }, [logs]);

  return (
    <div className="w-full h-full flex flex-col gap-3 p-1 md:p-3">
      <h2 className="text-2xl md:text-3xl font-bold text-indigo-800 mb-2">Analysis & Insights</h2>
      {loading ? (
        <div className="flex justify-center items-center min-h-[120px]">Loading...</div>
      ) : error ? (
        <div className="text-red-600 text-center">{error}</div>
      ) : (
        <>
          {/* Top Cards */}
          <div className="flex flex-wrap gap-1 mb-2 justify-center md:justify-start">
            <div className={CARD_CLASS}>
              <span className="text-base md:text-lg font-bold text-indigo-700">{summary.present}</span>
              <span className="text-gray-500 text-[11px] md:text-xs mt-1">Total Present Days</span>
            </div>
            <div className={CARD_CLASS}>
              <span className="text-base md:text-lg font-bold text-green-600">{summary.workingHour}</span>
              <span className="text-gray-500 text-[11px] md:text-xs mt-1">Total Working Hours</span>
            </div>
            <div className={CARD_CLASS}>
              <span className="text-base md:text-lg font-bold text-rose-600">{summary.leave}</span>
              <span className="text-gray-500 text-[11px] md:text-xs mt-1">Total Leave Days</span>
            </div>
          </div>
          {/* Charts and Most Active */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {/* Monthly Chart */}
            <div className="bg-white rounded-xl shadow p-1 md:p-2 border border-gray-100">
              <h3 className="text-sm md:text-base font-semibold mb-1 text-indigo-700">Monthly Working Hour vs Required</h3>
              {monthlyData.labels.length === 0 ? (
                <div className="text-gray-400 text-center py-6">No data available</div>
              ) : (
                <Bar data={monthlyData} options={{ responsive: true, plugins: { legend: { position: "top" } } }} height={110} />
              )}
            </div>
            {/* Weekly Chart + Most Active */}
            <div className="bg-white rounded-xl shadow p-1 md:p-2 border border-gray-100 flex flex-col gap-1">
              <h3 className="text-sm md:text-base font-semibold mb-1 text-green-700">Weekly Working Hour vs Required</h3>
              {weeklyData.labels.length === 0 ? (
                <div className="text-gray-400 text-center py-6">No data available</div>
              ) : (
                <Bar data={weeklyData} options={{ responsive: true, plugins: { legend: { position: "top" } } }} height={90} />
              )}
              <div className="flex flex-col md:flex-row gap-1 mt-1">
                <div className="flex-1 bg-indigo-50 rounded-lg p-1 flex flex-col items-center">
                  <span className="text-[11px] text-gray-500">Most Active Day (This Week)</span>
                  {mostActive.week === '-' || mostActive.weekHour === '0.00' ? (
                    <span className="text-xs text-gray-400 mt-1">No data</span>
                  ) : (
                    <>
                      <span className="text-xs md:text-sm font-bold text-indigo-700 mt-1">{mostActive.week}</span>
                      <span className="text-xs text-gray-500">{mostActive.weekHour} hr</span>
                    </>
                  )}
                </div>
                <div className="flex-1 bg-green-50 rounded-lg p-1 flex flex-col items-center">
                  <span className="text-[11px] text-gray-500">Most Active Day (This Month)</span>
                  {mostActive.month === '-' || mostActive.monthHour === '0.00' ? (
                    <span className="text-xs text-gray-400 mt-1">No data</span>
                  ) : (
                    <>
                      <span className="text-xs md:text-sm font-bold text-green-700 mt-1">{mostActive.month}</span>
                      <span className="text-xs text-gray-500">{mostActive.monthHour} hr</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
} 
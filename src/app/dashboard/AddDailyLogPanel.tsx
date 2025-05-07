"use client";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";

function getCurrentDate() {
  return new Date().toISOString().slice(0, 10);
}
function getCurrentTime() {
  const now = new Date();
  return now.toTimeString().slice(0, 5);
}

export default function AddDailyLogPanel() {
  const { token, user } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({
    date: "",
    inTime: "",
    outTime: "",
    attendance: "Present",
    standup: "",
    report: "",
    remarks: "",
    workingHour: "",
  });
  const [loading, setLoading] = useState(false);
  const [existingDates, setExistingDates] = useState<string[]>([]);
  const [errors, setErrors] = useState<{ [key: string]: boolean }>({});
  const attendanceOptions = [
    "Present",
    "Absent",
    "Leave",
    "Holiday",
    "Weekend",
    "Work from Home",
    "Halfday",
  ];
  const formRef = useRef<HTMLFormElement>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (user === null) {
      router.replace("/");
    }
  }, [user, router]);

  // Fetch existing logs for duplicate prevention
  useEffect(() => {
    async function fetchExisting() {
      if (!token) return;
      try {
        const res = await fetch("/api/daily", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success && Array.isArray(data.records)) {
          setExistingDates(data.records.map((r: { date: string }) => r.date));
        }
      } catch {}
    }
    fetchExisting();
  }, [token]);

  // Set default date/time on mount
  useEffect(() => {
    setForm(f => ({
      ...f,
      date: getCurrentDate(),
      inTime: getCurrentTime(),
      outTime: getCurrentTime(),
    }));
  }, []);

  // Calculate working hour
  function calculateWorkingHour(inTime: string, outTime: string) {
    if (!inTime || !outTime) return "";
    const [inHour, inMin] = inTime.split(":").map(Number);
    const [outHour, outMin] = outTime.split(":").map(Number);
    let diff = (outHour * 60 + outMin) - (inHour * 60 + inMin);
    if (diff < 0) diff += 24 * 60;
    const hours = Math.floor(diff / 60);
    const mins = diff % 60;
    return `${hours}.${mins.toString().padStart(2, "0")}`;
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const updated = { ...form, [name]: value };
    if (name === "inTime" || name === "outTime") {
      updated.workingHour = calculateWorkingHour(
        name === "inTime" ? value : form.inTime,
        name === "outTime" ? value : form.outTime
      );
    }
    setForm(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    // Prevent duplicate date
    if (existingDates.includes(form.date)) {
      toast.error("A log for this date already exists.");
      setLoading(false);
      return;
    }

    // Validation
    const attendanceType = form.attendance;
    let missingField = "";
    if (["Leave", "Holiday", "Weekend", "Absent"].includes(attendanceType)) {
      for (const field of ["date", "attendance"]) {
        if (!form[field as keyof typeof form] || (typeof form[field as keyof typeof form] === 'string' && (form[field as keyof typeof form] as string).trim() === '')) {
          setErrors((prev) => ({ ...prev, [field]: true }));
          toast.error(`${field.charAt(0).toUpperCase() + field.slice(1)} is required`);
          missingField = field;
          break;
        }
      }
    } else {
      for (const field of ["date", "inTime", "outTime", "standup", "report", "attendance"]) {
        if (!form[field as keyof typeof form] || (typeof form[field as keyof typeof form] === 'string' && (form[field as keyof typeof form] as string).trim() === '')) {
          setErrors((prev) => ({ ...prev, [field]: true }));
          toast.error(`${field.charAt(0).toUpperCase() + field.slice(1)} is required`);
          missingField = field;
          break;
        }
      }
    }
    if (missingField) {
      setLoading(false);
      return;
    }

    // For Leave, Holiday, Weekend, Absent - set default values
    const submitData = { ...form };
    if (["Leave", "Holiday", "Weekend", "Absent"].includes(attendanceType)) {
      submitData.inTime = submitData.inTime || "00:00";
      submitData.outTime = submitData.outTime || "00:00";
      submitData.standup = submitData.standup || "N/A";
      submitData.report = submitData.report || "N/A";
      submitData.workingHour = "0.00";
    }

    try {
      const res = await fetch("/api/daily", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(submitData),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || "Failed to add daily log");
      toast.success("Daily log added successfully!", { className: "custom-toast custom-toast--success" });
      setForm({
        date: getCurrentDate(),
        inTime: getCurrentTime(),
        outTime: getCurrentTime(),
        attendance: "Present",
        standup: "",
        report: "",
        remarks: "",
        workingHour: "",
      });
      formRef.current?.reset();
      // Update existingDates
      setExistingDates(dates => [...dates, submitData.date]);
    } catch {
      toast.error("Something went wrong, try again later", { className: "custom-toast custom-toast--error" });
    } finally {
      setLoading(false);
    }
  };

  const errorClass = 'border-red-500 focus:border-red-500 focus:ring-red-500';

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
    <div className="w-full my-6 p-4 sm:p-6 md:p-8 bg-white rounded-2xl shadow-lg max-w-2xl mx-auto">
      <h2 className="text-3xl font-bold mb-6 text-indigo-800">Add Daily Log</h2>
      <form ref={formRef} className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5" onSubmit={handleSubmit} autoComplete="off">
        <div>
          <label className="block text-base font-semibold mb-1 text-gray-700" htmlFor="date">Date</label>
          <Input type="date" id="date" name="date" value={form.date} onChange={handleChange} required className={`w-full text-lg px-4 py-2 border rounded-lg bg-gray-50 ${errors.date ? errorClass : ''}`} />
        </div>
        <div>
          <label className="block text-base font-semibold mb-1 text-gray-700" htmlFor="attendance">Attendance</label>
          <select id="attendance" name="attendance" value={form.attendance} onChange={handleChange} className={`w-full text-lg px-4 py-2 border rounded-lg bg-gray-50 ${errors.attendance ? errorClass : ''}`}>
            {attendanceOptions.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-base font-semibold mb-1 text-gray-700" htmlFor="inTime">In Time</label>
          <Input type="time" id="inTime" name="inTime" value={form.inTime} onChange={handleChange} className={`w-full text-lg px-4 py-2 border rounded-lg bg-gray-50 ${errors.inTime ? errorClass : ''}`} />
        </div>
        <div>
          <label className="block text-base font-semibold mb-1 text-gray-700" htmlFor="outTime">Out Time</label>
          <Input type="time" id="outTime" name="outTime" value={form.outTime} onChange={handleChange} className={`w-full text-lg px-4 py-2 border rounded-lg bg-gray-50 ${errors.outTime ? errorClass : ''}`} />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-base font-semibold mb-1 text-gray-700" htmlFor="standup">Standup</label>
          <Input id="standup" name="standup" value={form.standup} onChange={handleChange} className={`w-full text-lg px-4 py-2 border rounded-lg bg-gray-50 ${errors.standup ? errorClass : ''}`} />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-base font-semibold mb-1 text-gray-700" htmlFor="report">Report</label>
          <textarea id="report" name="report" value={form.report} onChange={handleChange} className={`w-full text-lg px-4 py-2 border rounded-lg bg-gray-50 min-h-[60px] ${errors.report ? errorClass : ''}`} />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-base font-semibold mb-1 text-gray-700" htmlFor="remarks">Remarks</label>
          <Input id="remarks" name="remarks" value={form.remarks} onChange={handleChange} className="w-full text-lg px-4 py-2 border rounded-lg bg-gray-50" />
        </div>
        <div>
          <label className="block text-base font-semibold mb-1 text-gray-700" htmlFor="workingHour">Working Hour</label>
          <Input id="workingHour" name="workingHour" value={form.workingHour} className="w-full text-lg px-4 py-2 border rounded-lg bg-gray-100 cursor-not-allowed" placeholder="e.g. 8.00" readOnly disabled />
        </div>
        <div className="flex items-end">
          <Button type="submit" disabled={loading} className="w-full sm:w-auto h-12 text-lg font-semibold bg-indigo-600 text-white hover:bg-indigo-700">
            {loading ? "Adding..." : "Add Log"}
          </Button>
        </div>
      </form>
    </div>
  );
} 
"use client";
import { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Pencil, Trash, SlidersHorizontal } from "lucide-react";
import { format, parseISO } from "date-fns";

const attendanceBadgeVariant = (attendance: string) => {
  switch (attendance) {
    case "Present": return "default";
    case "Absent": return "destructive";
    case "Leave": return "secondary";
    case "Holiday": return "outline";
    case "Weekend": return "outline";
    case "Work from Home": return "default";
    case "Halfday": return "secondary";
    default: return "outline";
  }
};

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

export default function ViewDailyLogPanel() {
  const { user, token } = useAuth();
  const router = useRouter();
  const [records, setRecords] = useState<DailyReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterDate, setFilterDate] = useState("");
  const [filterAttendance, setFilterAttendance] = useState("");
  const [filterWorkingHourMin, setFilterWorkingHourMin] = useState("");
  const [filterWorkingHourMax, setFilterWorkingHourMax] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<DailyReport & { _id?: string } | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showMobileFilter, setShowMobileFilter] = useState(false);

  // Auth redirect
  useEffect(() => {
    if (user === null) {
      router.replace("/");
    }
  }, [user, router]);

  // Fetch records
  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/daily", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.records)) {
        setRecords(data.records);
      } else {
        toast.error(data.message || "Failed to fetch records", { className: "custom-toast custom-toast--error" });
      }
    } catch {
      toast.error("Failed to fetch records", { className: "custom-toast custom-toast--error" });
    }
    setLoading(false);
  }, [token]);

  useEffect(() => {
    if (user) fetchRecords();
  }, [user, fetchRecords]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filterDate, filterAttendance, filterWorkingHourMin, filterWorkingHourMax, records.length]);

  // Edit handler
  const handleEdit = (record: DailyReport & { _id?: string }) => {
    setEditRecord(record);
    setEditModalOpen(true);
  };

  // Update handler
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editRecord?._id) return;
    setEditLoading(true);
    setEditError(null);
    try {
      const { _id, ...fieldsToUpdate } = editRecord;
      const res = await fetch("/api/daily", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ ...fieldsToUpdate, id: _id }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Daily log updated!", { className: "custom-toast custom-toast--success" });
        setEditModalOpen(false);
        setEditRecord(null);
        fetchRecords();
      } else {
        setEditError(data.message || 'Update failed.');
        toast.error(data.message || 'Update failed.', { className: "custom-toast custom-toast--error" });
      }
    } catch (err: unknown) {
      let message = 'Failed to update report.';
      if (err instanceof Error && typeof err.message === 'string') {
        message = err.message;
      }
      setEditError(message);
      toast.error(message, { className: "custom-toast custom-toast--error" });
    } finally {
      setEditLoading(false);
    }
  };

  // Delete handler
  const handleDelete = async () => {
    if (!deleteId) return;
    setEditLoading(true);
    try {
      const res = await fetch("/api/daily", {
        method: "DELETE",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ id: deleteId }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Daily log deleted!", { className: "custom-toast custom-toast--success" });
        setDeleteDialogOpen(false);
        setDeleteId(null);
        fetchRecords();
      } else {
        toast.error(data.message || 'Delete failed.', { className: "custom-toast custom-toast--error" });
      }
    } catch (err: unknown) {
      let message = 'Failed to delete report.';
      if (err instanceof Error && typeof err.message === 'string') {
        message = err.message;
      }
      toast.error(message, { className: "custom-toast custom-toast--error" });
    } finally {
      setEditLoading(false);
    }
  };

  if (user === null) {
    return (
      <div className="min-h-[40vh] flex flex-col items-center justify-center">
        <span className="inline-block animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-indigo-500 border-solid mb-4"></span>
        <div className="text-lg text-indigo-700 font-semibold">Redirecting to login...</div>
      </div>
    );
  }
  if (!user) return <div>Loading...</div>;

  // Filtered records
  const filteredRecords = records.filter((r) => {
    let pass = true;
    if (filterDate && r.date !== filterDate) pass = false;
    if (filterAttendance && r.attendance !== filterAttendance) pass = false;
    if (filterWorkingHourMin && (!r.workingHour || parseFloat(r.workingHour) < parseFloat(filterWorkingHourMin))) pass = false;
    if (filterWorkingHourMax && (!r.workingHour || parseFloat(r.workingHour) > parseFloat(filterWorkingHourMax))) pass = false;
    return pass;
  });
  const totalPages = Math.ceil(filteredRecords.length / pageSize);
  const paginatedRecords = filteredRecords.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="w-full h-full p-0 sm:p-0 md:p-0 bg-white rounded-none shadow-none">
      <h2 className="text-3xl font-bold px-2 pt-2 pb-4 text-indigo-800">View Daily Logs</h2>
      {/* Mobile: Filter Icon and Dialog */}
      <div className="flex sm:hidden justify-end px-2 pt-2 pb-2">
        <button onClick={() => setShowMobileFilter(true)} className="p-2 rounded-full bg-indigo-50 hover:bg-indigo-100">
          <SlidersHorizontal className="w-6 h-6 text-indigo-700" />
        </button>
      </div>
      <Dialog open={showMobileFilter} onOpenChange={setShowMobileFilter}>
        <DialogContent className="block sm:hidden w-full max-w-xs mx-auto rounded-2xl p-4">
          <DialogHeader>
            <DialogTitle>Filter Logs</DialogTitle>
            <DialogDescription>
              Set filters below and tap Apply to filter your daily logs.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div>
              <label className="block text-base font-semibold mb-1 text-gray-700">Date</label>
              <Input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} className="w-full text-lg px-4 py-2 border rounded-lg bg-gray-50" />
            </div>
            <div>
              <label className="block text-base font-semibold mb-1 text-gray-700">Attendance</label>
              <select value={filterAttendance} onChange={e => setFilterAttendance(e.target.value)} className="w-full text-lg px-4 py-2 border rounded-lg bg-gray-50">
                <option value="">All</option>
                <option value="Present">Present</option>
                <option value="Absent">Absent</option>
                <option value="Leave">Leave</option>
                <option value="Holiday">Holiday</option>
                <option value="Weekend">Weekend</option>
                <option value="Work from Home">Work from Home</option>
                <option value="Halfday">Halfday</option>
              </select>
            </div>
            <div>
              <label className="block text-base font-semibold mb-1 text-gray-700">Working Hour Min</label>
              <Input type="number" value={filterWorkingHourMin} onChange={e => setFilterWorkingHourMin(e.target.value)} className="w-full text-lg px-4 py-2 border rounded-lg bg-gray-50" placeholder="Min" />
            </div>
            <div>
              <label className="block text-base font-semibold mb-1 text-gray-700">Working Hour Max</label>
              <Input type="number" value={filterWorkingHourMax} onChange={e => setFilterWorkingHourMax(e.target.value)} className="w-full text-lg px-4 py-2 border rounded-lg bg-gray-50" placeholder="Max" />
            </div>
            <div className="flex gap-2 mt-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => { setFilterDate(""); setFilterAttendance(""); setFilterWorkingHourMin(""); setFilterWorkingHourMax(""); }}>Clear</Button>
              <Button type="button" className="flex-1" onClick={() => setShowMobileFilter(false)}>Apply</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      {/* Desktop: Filter Bar */}
      <div className="hidden sm:flex flex-row flex-wrap gap-4 items-end px-2 pt-2 pb-4 border-b">
        <div className="w-full sm:w-auto">
          <label className="block text-base font-semibold mb-1 text-gray-700">Date</label>
          <Input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} className="w-full text-lg px-4 py-2 border rounded-lg bg-gray-50" />
        </div>
        <div className="w-full sm:w-auto">
          <label className="block text-base font-semibold mb-1 text-gray-700">Attendance</label>
          <select value={filterAttendance} onChange={e => setFilterAttendance(e.target.value)} className="w-full text-lg px-4 py-2 border rounded-lg bg-gray-50 sm:w-[150px]">
            <option value="">All</option>
            <option value="Present">Present</option>
            <option value="Absent">Absent</option>
            <option value="Leave">Leave</option>
            <option value="Holiday">Holiday</option>
            <option value="Weekend">Weekend</option>
            <option value="Work from Home">Work from Home</option>
            <option value="Halfday">Halfday</option>
          </select>
        </div>
        <div className="w-full sm:w-auto">
          <label className="block text-base font-semibold mb-1 text-gray-700">Working Hour Min</label>
          <Input type="number" value={filterWorkingHourMin} onChange={e => setFilterWorkingHourMin(e.target.value)} className="w-full text-lg px-4 py-2 border rounded-lg bg-gray-50" placeholder="Min" />
        </div>
        <div className="w-full sm:w-auto">
          <label className="block text-base font-semibold mb-1 text-gray-700">Working Hour Max</label>
          <Input type="number" value={filterWorkingHourMax} onChange={e => setFilterWorkingHourMax(e.target.value)} className="w-full text-lg px-4 py-2 border rounded-lg bg-gray-50" placeholder="Max" />
        </div>
        {(filterDate || filterAttendance || filterWorkingHourMin || filterWorkingHourMax) && (
          <Button type="button" variant="outline" className="h-10 px-4 text-base mt-2 sm:mt-5 w-full sm:w-auto" onClick={() => { setFilterDate(""); setFilterAttendance(""); setFilterWorkingHourMin(""); setFilterWorkingHourMax(""); }}>
            Clear
          </Button>
        )}
      </div>
      <div className="mb-4" />
      {/* Table */}
      <div className="border bg-white rounded-xl shadow-sm mx-2"
           style={{ maxHeight: '60vh', overflowY: 'auto' }}>
        {loading ? (
          <div className="flex justify-center items-center py-16">
            <span className="inline-block animate-spin rounded-full h-10 w-10 border-t-4 border-b-4 border-indigo-500 border-solid"></span>
          </div>
        ) : paginatedRecords.length === 0 ? (
          <div className="text-center py-12 text-base text-gray-400">No reports yet.</div>
        ) : (
          <table className="w-full text-base border-separate border-spacing-0 bg-white rounded-lg">
            <thead className="bg-white/95 backdrop-blur border-b sticky top-0 z-10">
              <tr>
                {["Date","In Time","Out Time","Working Hour","Attendance","Standup","Report","Remarks","Actions"].map((h) => (
                  <th key={h} className="border-b px-2 sm:px-6 py-3 text-left font-semibold text-gray-700 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginatedRecords.map((r, i) => (
                <tr key={i} className="even:bg-gray-50 hover:bg-primary/10 transition">
                  <td className="px-2 sm:px-4 py-2 flex items-center gap-2">
                    {r.date}
                    <span>
                      <Badge className="bg-gray-100 text-gray-600 border border-gray-200 px-2 py-0.5 text-xs font-semibold rounded-md">
                        {format(parseISO(r.date), "EEE")}
                      </Badge>
                    </span>
                  </td>
                  <td className="px-2 sm:px-4 py-2">{r.inTime}</td>
                  <td className="px-2 sm:px-4 py-2">{r.outTime}</td>
                  <td className="px-2 sm:px-4 py-2">{r.workingHour}</td>
                  <td className="px-2 sm:px-4 py-2">
                    <Badge variant={attendanceBadgeVariant(r.attendance)} className="capitalize px-2 py-1 text-xs font-semibold shadow-sm rounded-full">
                      {r.attendance}
                    </Badge>
                  </td>
                  <td className="px-2 sm:px-4 py-2 max-w-xs break-words">{r.standup}</td>
                  <td className="px-2 sm:px-4 py-2 max-w-xs break-words">{r.report}</td>
                  <td className="px-2 sm:px-4 py-2 max-w-xs break-words">{r.remarks}</td>
                  <td className="px-2 sm:px-4 py-2 flex gap-2 items-center">
                    <button
                      className="p-2 rounded-full hover:bg-primary/10 text-primary transition"
                      title="Edit"
                      onClick={() => handleEdit(r)}
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      className="p-2 rounded-full hover:bg-destructive/10 text-destructive transition"
                      title="Delete"
                      onClick={() => { setDeleteId((r as { _id?: string })._id ?? null); setDeleteDialogOpen(true); }}
                    >
                      <Trash className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 py-4">
          <Button variant="outline" size="sm" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}>Prev</Button>
          <span className="px-2 text-sm">Page {currentPage} of {totalPages}</span>
          <Button variant="outline" size="sm" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>Next</Button>
        </div>
      )}
      {/* Edit Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="w-full max-w-[95vw] md:max-w-lg rounded-2xl p-4 md:p-6">
          <DialogHeader>
            <DialogTitle>Edit Daily Log</DialogTitle>
            <DialogDescription>Update your daily log details below. All required fields must be filled.</DialogDescription>
          </DialogHeader>
          {editError && <div className="text-red-600 text-sm mb-2">{editError}</div>}
          {editRecord && (
            <form className="flex flex-col gap-4" onSubmit={handleUpdate} autoComplete="off">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label>Date</label>
                  <Input type="date" name="date" value={editRecord.date} onChange={e => setEditRecord({ ...editRecord, date: e.target.value })} className="border rounded px-2 py-2 text-base" disabled={editLoading} />
                </div>
                <div className="flex flex-col gap-2">
                  <label>Attendance</label>
                  <select name="attendance" value={editRecord.attendance} onChange={e => setEditRecord({ ...editRecord, attendance: e.target.value })} className="border rounded px-2 py-2 text-base" disabled={editLoading}>
                    <option value="Present">Present</option>
                    <option value="Absent">Absent</option>
                    <option value="Leave">Leave</option>
                    <option value="Holiday">Holiday</option>
                    <option value="Weekend">Weekend</option>
                    <option value="Work from Home">Work from Home</option>
                    <option value="Halfday">Halfday</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label>In Time</label>
                  <Input type="time" name="inTime" value={editRecord.inTime} onChange={e => {
                    const newInTime = e.target.value;
                    setEditRecord(prev => prev ? { ...prev, inTime: newInTime } : prev);
                  }} className="border rounded px-2 py-2 text-base" disabled={editLoading} />
                </div>
                <div className="flex flex-col gap-2">
                  <label>Out Time</label>
                  <Input type="time" name="outTime" value={editRecord.outTime} onChange={e => {
                    const newOutTime = e.target.value;
                    setEditRecord(prev => prev ? { ...prev, outTime: newOutTime } : prev);
                  }} className="border rounded px-2 py-2 text-base" disabled={editLoading} />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label>Standup</label>
                <Input name="standup" value={editRecord.standup} onChange={e => setEditRecord({ ...editRecord, standup: e.target.value })} className="border rounded px-2 py-2 text-base" disabled={editLoading} />
              </div>
              <div className="flex flex-col gap-2">
                <label>Report</label>
                <Input name="report" value={editRecord.report} onChange={e => setEditRecord({ ...editRecord, report: e.target.value })} className="border rounded px-2 py-2 text-base" disabled={editLoading} />
              </div>
              <div className="flex flex-col gap-2">
                <label>Remarks</label>
                <Input name="remarks" value={editRecord.remarks} onChange={e => setEditRecord({ ...editRecord, remarks: e.target.value })} className="border rounded px-2 py-2 text-base" disabled={editLoading} />
              </div>
              <DialogFooter className="flex justify-end gap-2 mt-4">
                <Button type="button" variant="outline" onClick={() => setEditModalOpen(false)} disabled={editLoading}>Cancel</Button>
                <Button type="submit" disabled={editLoading} className="min-w-[120px] flex items-center justify-center bg-indigo-600 text-white hover:bg-indigo-700">
                  {editLoading ? 'Updating...' : 'Update'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-sm w-full rounded-2xl">
          <DialogHeader>
            <DialogTitle>Delete Log</DialogTitle>
          </DialogHeader>
          <div className="py-4">Are you sure you want to delete this log? This action cannot be undone.</div>
          <DialogFooter className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={editLoading}>Cancel</Button>
            <Button type="button" variant="destructive" onClick={handleDelete} disabled={editLoading}>
              {editLoading ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 
"use client";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Pencil, Trash } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

interface LeaveLog {
  _id?: string;
  month: string;
  earnedLeave: number;
  leaveAllowed: number;
  leaveTaken: number;
  balanceLeave: number;
}

const getCurrentMonth = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
};

export default function LeaveLogPanel() {
  const { user, token } = useAuth();
  const router = useRouter();
  const [logs, setLogs] = useState<LeaveLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ month: "", earnedLeave: "", leaveAllowed: "" });
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editLog, setEditLog] = useState<LeaveLog | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Auth redirect
  useEffect(() => {
    if (user === null) router.replace("/");
  }, [user, router]);

  // Fetch logs
  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/leave-log", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.logs)) {
        setLogs(data.logs);
      } else {
        toast.error(data.message || "Failed to fetch leave logs", { className: "custom-toast custom-toast--error" });
      }
    } catch {
      toast.error("Failed to fetch leave logs", { className: "custom-toast custom-toast--error" });
    }
    setLoading(false);
  };

  useEffect(() => {
    if (user) fetchLogs();
  }, [user]);

  // Add log
  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.month || !form.earnedLeave || !form.leaveAllowed) {
      toast.error("All fields are required", { className: "custom-toast custom-toast--error" });
      return;
    }
    try {
      const res = await fetch("/api/leave-log", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          month: form.month,
          earnedLeave: Number(form.earnedLeave),
          leaveAllowed: Number(form.leaveAllowed),
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Leave log added!", { className: "custom-toast custom-toast--success" });
        setForm({ month: "", earnedLeave: "", leaveAllowed: "" });
        fetchLogs();
      } else {
        toast.error(data.message || "Failed to add leave log", { className: "custom-toast custom-toast--error" });
      }
    } catch {
      toast.error("Failed to add leave log", { className: "custom-toast custom-toast--error" });
    }
  };

  // Edit
  const handleEdit = (log: LeaveLog) => {
    setEditLog(log);
    setEditModalOpen(true);
  };

  // Update
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editLog?._id) return;
    setEditLoading(true);
    try {
      const res = await fetch("/api/leave-log", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          id: editLog._id,
          earnedLeave: editLog.earnedLeave,
          leaveAllowed: editLog.leaveAllowed,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Leave log updated!", { className: "custom-toast custom-toast--success" });
        setEditModalOpen(false);
        setEditLog(null);
        fetchLogs();
      } else {
        toast.error(data.message || "Failed to update leave log", { className: "custom-toast custom-toast--error" });
      }
    } catch {
      toast.error("Failed to update leave log", { className: "custom-toast custom-toast--error" });
    }
    setEditLoading(false);
  };

  // Delete
  const handleDelete = async () => {
    if (!deleteId) return;
    setEditLoading(true);
    try {
      const res = await fetch("/api/leave-log", {
        method: "DELETE",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id: deleteId }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Leave log deleted!", { className: "custom-toast custom-toast--success" });
        setDeleteDialogOpen(false);
        setDeleteId(null);
        fetchLogs();
      } else {
        toast.error(data.message || "Failed to delete leave log", { className: "custom-toast custom-toast--error" });
      }
    } catch {
      toast.error("Failed to delete leave log", { className: "custom-toast custom-toast--error" });
    }
    setEditLoading(false);
  };

  useEffect(() => {
    if (user) setForm(f => ({ ...f, month: getCurrentMonth() }));
  }, [user]);

  if (user === null) {
    return (
      <div className="min-h-[40vh] flex flex-col items-center justify-center">
        <span className="inline-block animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-indigo-500 border-solid mb-4"></span>
        <div className="text-lg text-indigo-700 font-semibold">Redirecting to login...</div>
      </div>
    );
  }
  if (!user) return <div>Loading...</div>;

  // Find if log for selected month exists
  const monthExists = !!form.month && logs.some(l => l.month === form.month);
  const selectedLog = logs.find(l => l.month === form.month);

  return (
    <div className="w-full h-full p-0 sm:p-0 md:p-0 bg-white rounded-none shadow-none flex flex-col items-center">
      <h2 className="text-3xl font-bold px-2 pt-8 pb-4 text-indigo-800 w-full text-center">Add / Manage Leave Log</h2>
      {/* Add/Edit Form */}
      <div className="w-full max-w-md bg-white rounded-2xl shadow-md p-6 mb-8 border mx-auto">
        <form className="flex flex-col gap-4" onSubmit={handleAdd} autoComplete="off">
          <div>
            <label className="block text-base font-semibold mb-1 text-gray-700">Month</label>
            <Input type="month" value={form.month} onChange={e => setForm(f => ({ ...f, month: e.target.value }))} className="w-full text-lg px-4 py-2 border rounded-lg bg-gray-50" required />
          </div>
          <div>
            <label className="block text-base font-semibold mb-1 text-gray-700">Earned Leave</label>
            <Input type="number" min={0} value={form.earnedLeave} onChange={e => setForm(f => ({ ...f, earnedLeave: e.target.value }))} className="w-full text-lg px-4 py-2 border rounded-lg bg-gray-50" required />
          </div>
          <div>
            <label className="block text-base font-semibold mb-1 text-gray-700">Allowed Leave</label>
            <Input type="number" min={0} value={form.leaveAllowed} onChange={e => setForm(f => ({ ...f, leaveAllowed: e.target.value }))} className="w-full text-lg px-4 py-2 border rounded-lg bg-gray-50" required />
          </div>
          <div>
            <label className="block text-base font-semibold mb-1 text-gray-700">Leave Taken</label>
            <Input type="number" value={selectedLog?.leaveTaken ?? 0} readOnly className="w-full text-lg px-4 py-2 border rounded-lg bg-gray-100 text-gray-500" />
          </div>
          <div>
            <label className="block text-base font-semibold mb-1 text-gray-700">Balance Leave</label>
            <Input type="number" value={selectedLog?.balanceLeave ?? (Number(form.earnedLeave || 0) + Number(form.leaveAllowed || 0))} readOnly className="w-full text-lg px-4 py-2 border rounded-lg bg-gray-100 text-gray-500" />
          </div>
          <Button type="submit" className="h-12 px-6 text-base bg-indigo-600 text-white hover:bg-indigo-700 w-full md:w-auto" disabled={monthExists}>Add</Button>
        </form>
      </div>
      {/* Table or Card List of Logs */}
      <div className="w-full max-w-2xl mb-8 px-2">
        {loading ? (
          <div className="flex justify-center items-center py-16">
            <span className="inline-block animate-spin rounded-full h-10 w-10 border-t-4 border-b-4 border-indigo-500 border-solid"></span>
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-12 text-base text-gray-400">No leave logs yet.</div>
        ) : (
          <>
            {/* Mobile: Card List */}
            <div className="block md:hidden space-y-4 w-full">
              {logs.map((l, i) => (
                <div key={i} className="bg-white rounded-xl shadow border p-4 flex flex-col gap-2 w-full">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold text-indigo-700">{l.month}</span>
                    <div className="flex gap-2">
                      <button
                        className="p-2 rounded-full hover:bg-primary/10 text-primary transition"
                        title="Edit"
                        onClick={() => handleEdit(l)}
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        className="p-2 rounded-full hover:bg-destructive/10 text-destructive transition"
                        title="Delete"
                        onClick={() => { setDeleteId(l._id ?? null); setDeleteDialogOpen(true); }}
                      >
                        <Trash className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 text-sm">
                    <div><span className="font-medium">Earned:</span> {l.earnedLeave}</div>
                    <div><span className="font-medium">Allowed:</span> {l.leaveAllowed}</div>
                    <div><span className="font-medium">Taken:</span> {l.leaveTaken}</div>
                    <div><span className="font-medium">Balance:</span> {l.balanceLeave}</div>
                  </div>
                </div>
              ))}
            </div>
            {/* Desktop: Table */}
            <div className="hidden md:block w-full">
              <table className="w-full text-base border-separate border-spacing-0 bg-white rounded-lg">
                <thead className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b">
                  <tr>
                    {["Month","Earned Leave","Allowed Leave","Leave Taken","Balance Leave","Actions"].map((h) => (
                      <th key={h} className="border-b px-2 sm:px-6 py-3 text-left font-semibold text-gray-700 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {logs.map((l, i) => (
                    <tr key={i} className="even:bg-gray-50 hover:bg-primary/10 transition">
                      <td className="px-2 sm:px-4 py-2">{l.month}</td>
                      <td className="px-2 sm:px-4 py-2">{l.earnedLeave}</td>
                      <td className="px-2 sm:px-4 py-2">{l.leaveAllowed}</td>
                      <td className="px-2 sm:px-4 py-2">{l.leaveTaken}</td>
                      <td className="px-2 sm:px-4 py-2">{l.balanceLeave}</td>
                      <td className="px-2 sm:px-4 py-2 flex gap-2 items-center">
                        <button
                          className="p-2 rounded-full hover:bg-primary/10 text-primary transition"
                          title="Edit"
                          onClick={() => handleEdit(l)}
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          className="p-2 rounded-full hover:bg-destructive/10 text-destructive transition"
                          title="Delete"
                          onClick={() => { setDeleteId(l._id ?? null); setDeleteDialogOpen(true); }}
                        >
                          <Trash className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
      {/* Edit Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="w-full max-w-[95vw] md:max-w-lg rounded-2xl p-4 md:p-6">
          <DialogHeader>
            <DialogTitle>Edit Leave Log</DialogTitle>
            <DialogDescription>Update earned and allowed leave for this month.</DialogDescription>
          </DialogHeader>
          {editLog && (
            <form className="flex flex-col gap-4" onSubmit={handleUpdate} autoComplete="off">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label>Earned Leave</label>
                  <Input type="number" min={0} value={editLog.earnedLeave} onChange={e => setEditLog(log => log ? { ...log, earnedLeave: Number(e.target.value) } : log)} className="border rounded px-2 py-2 text-base" disabled={editLoading} />
                </div>
                <div className="flex flex-col gap-2">
                  <label>Allowed Leave</label>
                  <Input type="number" min={0} value={editLog.leaveAllowed} onChange={e => setEditLog(log => log ? { ...log, leaveAllowed: Number(e.target.value) } : log)} className="border rounded px-2 py-2 text-base" disabled={editLoading} />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label>Leave Taken</label>
                  <Input type="number" value={editLog.leaveTaken} readOnly className="border rounded px-2 py-2 text-base bg-gray-100 text-gray-500" />
                </div>
                <div className="flex flex-col gap-2">
                  <label>Balance Leave</label>
                  <Input type="number" value={editLog.balanceLeave} readOnly className="border rounded px-2 py-2 text-base bg-gray-100 text-gray-500" />
                </div>
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
            <DialogTitle>Delete Leave Log</DialogTitle>
          </DialogHeader>
          <div className="py-4">Are you sure you want to delete this leave log? This action cannot be undone.</div>
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
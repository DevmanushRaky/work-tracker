import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Pencil, Trash } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import type { User } from "@/hooks/useAuth";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { toast } from "react-toastify";

function isSalaryHistoryArray(arr: unknown): arr is { from: string; salary: number; position?: string }[] {
  return Array.isArray(arr) && arr.every(
    s => typeof s === 'object' && s !== null && 'from' in s && 'salary' in s
  );
}

export default function ProfilePanel() {
  const { user, token, setUser } = useAuth();
  const router = useRouter();
  const [editField, setEditField] = useState("");
  const [form, setForm] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [editSalaryIndex, setEditSalaryIndex] = useState(-1);
  const [editSalary, setEditSalary] = useState({ from: '', salary: '', position: '' });
  const [salaryLoading, setSalaryLoading] = useState(false);
  const [salaryError, setSalaryError] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null);

  useEffect(() => {
    if (user) {
      // Convert user object to Record<string, string> for form state
      const stringFields: Record<string, string> = {};
      Object.entries(user).forEach(([key, value]) => {
        if (typeof value === 'string' || typeof value === 'number') {
          stringFields[key] = value !== undefined && value !== null ? String(value) : "";
        }
      });
      setForm(stringFields);
    }
  }, [user]);

  useEffect(() => {
    if (user === null) {
      router.replace("/");
    }
  }, [user, router]);

  useEffect(() => {
    // If user is logged in but missing fields, fetch full profile
    if (user && (!user.name || !user.phone || !user.department)) {
      const fetchProfile = async () => {
        const res = await fetch("/api/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success && data.user) {
          setUser(data.user); // This will update the user context with all fields
        }
      };
      fetchProfile();
    }
  }, [user, token, setUser]);

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

  // All fields from the User model (except password)
  const fields = [
    { name: "email", label: "Email", disabled: true, placeholder: "Enter your email" },
    { name: "name", label: "Name", placeholder: "Enter your name" },
    { name: "phone", label: "Phone", placeholder: "Enter your phone number" },
    { name: "department", label: "Department", placeholder: "Enter your department" },
    { name: "designation", label: "Designation", placeholder: "Enter your designation" },
    { name: "salaryCreditedDay", label: "Salary Credited Day", placeholder: "e.g. 7" },
    { name: "leaveAllowedPerMonth", label: "Leave Allowed Per Month", placeholder: "e.g. 0" },
    { name: "earnedLeave", label: "Earned Leave", placeholder: "e.g. 0" },
  ];

  // Save handler for a single field
  const handleSave = async (fieldName: string) => {
    setLoading(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ [fieldName]: form[fieldName] }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || "Update failed");
      setUser(data.user); // update context with latest user
      setEditField("");
      toast.success("Profile updated successfully!", { className: "custom-toast custom-toast--success" });
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Error updating profile", { className: "custom-toast custom-toast--error" });
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (index: number) => {
    if (!isSalaryHistoryArray(user.salaryHistory)) return;
    const s = user.salaryHistory[index];
    setEditSalaryIndex(index);
    setEditSalary({
      from: s.from ? format(new Date(s.from), "yyyy-MM-dd") : '',
      salary: s.salary ? String(s.salary) : '',
      position: s.position || '',
    });
  };

  const handleEditSave = async (index: number) => {
    setSalaryLoading(true);
    setSalaryError("");
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          salaryHistory: {
            action: "edit",
            index,
            record: {
              from: editSalary.from,
              salary: Number(editSalary.salary),
              position: editSalary.position,
            },
          },
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || "Failed to edit salary record");
      setUser(data.user);
      setEditSalaryIndex(-1);
      toast.success("Salary record updated!", { className: "custom-toast custom-toast--success" });
    } catch (err: unknown) {
      setSalaryError(err instanceof Error ? err.message : "Error editing salary record");
      toast.error(err instanceof Error ? err.message : "Error editing salary record", { className: "custom-toast custom-toast--error" });
    } finally {
      setSalaryLoading(false);
    }
  };

  const handleDelete = async (index: number) => {
    setSalaryLoading(true);
    setSalaryError("");
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          salaryHistory: {
            action: "delete",
            index,
          },
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || "Failed to delete salary record");
      setUser(data.user);
      toast.success("Salary record deleted!", { className: "custom-toast custom-toast--success" });
    } catch (err: unknown) {
      setSalaryError(err instanceof Error ? err.message : "Error deleting salary record");
      toast.error(err instanceof Error ? err.message : "Error deleting salary record", { className: "custom-toast custom-toast--error" });
    } finally {
      setSalaryLoading(false);
    }
  };

  // Defensive: always treat salaryHistory as an array
  const salaryHistory = Array.isArray(user.salaryHistory) ? user.salaryHistory : [];

  // Earned Leave: use value from user object if available
  const earnedLeave = typeof user.earnedLeave === 'number' ? user.earnedLeave : 0;

  return (
    <div className="w-full my-2 p-2 sm:p-3 md:p-4 bg-white rounded-2xl shadow-lg">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between mb-6 gap-2">
        <h2 className="text-3xl font-bold mb-1 sm:mb-0 text-indigo-800">Profile</h2>
        <div className="flex flex-wrap gap-2 sm:gap-4 md:gap-8">
          <div>
            <span className="block text-gray-500 text-xs md:text-sm">Created At</span>
            <span className="block text-base md:text-lg font-semibold">
              {user.createdAt && (typeof user.createdAt === "string" || typeof user.createdAt === "number" || user.createdAt instanceof Date)
                ? format(new Date(user.createdAt), "yyyy-MM-dd HH:mm")
                : "-"}
            </span>
          </div>
          <div>
            <span className="block text-gray-500 text-xs md:text-sm">Last Updated</span>
            <span className="block text-base md:text-lg font-semibold">
              {user.updatedAt && (typeof user.updatedAt === "string" || typeof user.updatedAt === "number" || user.updatedAt instanceof Date)
                ? format(new Date(user.updatedAt), "yyyy-MM-dd HH:mm")
                : "-"}
            </span>
          </div>
          <div>
            <span className="block text-gray-500 text-xs md:text-sm">Earned Leave</span>
            <span className="block text-base md:text-lg font-semibold text-green-700">{earnedLeave}</span>
          </div>
        </div>
      </div>
      {/* No inline error for profile update, use toast instead */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
        {fields.map(f => (
          <div key={f.name} className="mb-2">
            <label className="block text-base font-semibold mb-2 text-gray-700" htmlFor={f.name}>{f.label}</label>
            <div className="flex items-center gap-2">
              <Input
                id={f.name}
                value={form[f.name] !== undefined ? form[f.name] : ""}
                placeholder={f.placeholder}
                disabled={editField !== f.name && f.disabled !== false || loading}
                onChange={e => setForm(prev => ({ ...prev, [f.name]: e.target.value }))}
                className="flex-1 text-lg px-4 py-2 border rounded-lg bg-gray-50"
              />
              {f.name !== "email" && f.name !== "createdAt" && (
                <>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => setEditField(f.name)}
                    disabled={loading}
                  >
                    <Pencil className="w-5 h-5" />
                  </Button>
                  {editField === f.name && (
                    <Button
                      size="sm"
                      onClick={() => handleSave(f.name)}
                      disabled={loading}
                      className="bg-indigo-600 text-white hover:bg-indigo-700"
                    >
                      {loading ? "Saving..." : "Save"}
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        ))}
      </div>
      {/* Salary History (read-only + add) */}
      <div className="mt-3">
        <label className="block text-base font-semibold mb-2 text-gray-700">Salary History</label>
        <div className="bg-gray-50 rounded-lg p-1 sm:p-2">
          {/* Desktop Table */}
          <div className="hidden sm:block overflow-x-auto">
            {salaryHistory.length > 0 ? (
              <table className="w-full text-sm mb-4">
                <thead>
                  <tr>
                    <th className="text-left pr-4">From</th>
                    <th className="text-left">Salary</th>
                    <th className="text-left">Position</th>
                    <th className="text-left">Edit/Delete</th>
                  </tr>
                </thead>
                <tbody>
                  {salaryHistory.map((s, i) => (
                    <tr key={i}>
                      {editSalaryIndex === i ? (
                        <>
                          <td className="pr-4">
                            <Input
                              type="date"
                              value={editSalary.from}
                              onChange={e => setEditSalary(prev => ({ ...prev, from: e.target.value }))}
                              required
                              className="w-32"
                              disabled={salaryLoading}
                            />
                          </td>
                          <td>
                            <Input
                              type="number"
                              value={editSalary.salary}
                              onChange={e => setEditSalary(prev => ({ ...prev, salary: e.target.value }))}
                              required
                              className="w-24"
                              disabled={salaryLoading}
                            />
                          </td>
                          <td>
                            <Input
                              type="text"
                              value={editSalary.position}
                              onChange={e => setEditSalary(prev => ({ ...prev, position: e.target.value }))}
                              required
                              className="w-32"
                              disabled={salaryLoading}
                            />
                          </td>
                          <td>
                            <Button size="sm" onClick={() => handleEditSave(i)} disabled={salaryLoading} className="mr-2 bg-indigo-600 text-white hover:bg-indigo-700">
                              {salaryLoading ? <span className="flex items-center gap-1"><span className="loader mr-1" />Saving...</span> : "Save"}
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => setEditSalaryIndex(-1)} disabled={salaryLoading}>
                              Cancel
                            </Button>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="pr-4">{format(new Date(s.from), "yyyy-MM-dd")}</td>
                          <td>{s.salary}</td>
                          <td>{s.position || "-"}</td>
                          <td>
                            <Button size="icon" variant="ghost" onClick={() => handleEditClick(i)} disabled={salaryLoading}>
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <button
                              className="p-2 rounded-full hover:bg-destructive/10 text-destructive transition"
                              title="Delete"
                              onClick={() => { setDeleteIndex(i); setDeleteDialogOpen(true); }}
                              disabled={salaryLoading}
                            >
                              <Trash className="w-4 h-4" />
                            </button>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <span className="text-gray-500">No salary history available.</span>
            )}
          </div>
          {/* Mobile Cards */}
          <div className="sm:hidden flex flex-col gap-2">
            {salaryHistory.length > 0 ? (
              salaryHistory.map((s, i) => (
                <div key={i} className="bg-white rounded-lg shadow-sm p-3 flex flex-col gap-2 border">
                  {editSalaryIndex === i ? (
                    <>
                      <Input
                        type="date"
                        value={editSalary.from}
                        onChange={e => setEditSalary(prev => ({ ...prev, from: e.target.value }))}
                        required
                        className="mb-2"
                        disabled={salaryLoading}
                        placeholder="Date"
                      />
                      <Input
                        type="number"
                        value={editSalary.salary}
                        onChange={e => setEditSalary(prev => ({ ...prev, salary: e.target.value }))}
                        required
                        className="mb-2"
                        disabled={salaryLoading}
                        placeholder="Salary"
                      />
                      <Input
                        type="text"
                        value={editSalary.position}
                        onChange={e => setEditSalary(prev => ({ ...prev, position: e.target.value }))}
                        required
                        className="mb-2"
                        disabled={salaryLoading}
                        placeholder="Position"
                      />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => handleEditSave(i)} disabled={salaryLoading} className="mr-2 bg-indigo-600 text-white hover:bg-indigo-700">
                          {salaryLoading ? <span className="flex items-center gap-1"><span className="loader mr-1" />Saving...</span> : "Save"}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditSalaryIndex(-1)} disabled={salaryLoading}>
                          Cancel
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-semibold">From:</span>
                        <span>{format(new Date(s.from), "yyyy-MM-dd")}</span>
                      </div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-semibold">Salary:</span>
                        <span>{s.salary}</span>
                      </div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-semibold">Position:</span>
                        <span>{s.position || "-"}</span>
                      </div>
                      <div className="flex gap-2 mt-1">
                        <Button size="icon" variant="ghost" onClick={() => handleEditClick(i)} disabled={salaryLoading}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <button
                          className="p-2 rounded-full hover:bg-destructive/10 text-destructive transition"
                          title="Delete"
                          onClick={() => { setDeleteIndex(i); setDeleteDialogOpen(true); }}
                          disabled={salaryLoading}
                        >
                          <Trash className="w-4 h-4" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))
            ) : (
              <span className="text-gray-500">No salary history available.</span>
            )}
          </div>
          {/* Add Salary Record Form */}
          <div className="mt-2">
            {/* Responsive Add Salary Form */}
            <div className="bg-white rounded-lg shadow-sm p-3 border">
              <AddSalaryForm token={token ?? ""} setUser={setUser} />
            </div>
          </div>
        </div>
      </div>
      {salaryError && <div className="text-red-600 text-xs mt-1">{salaryError}</div>}
      {deleteDialogOpen && deleteIndex !== null && (
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Salary Record?</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this salary record? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setDeleteDialogOpen(false)} disabled={salaryLoading}>Cancel</Button>
              <Button variant="destructive" onClick={async () => { await handleDelete(deleteIndex); setDeleteDialogOpen(false); }} disabled={salaryLoading}>
                {salaryLoading ? "Deleting..." : "Delete"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function AddSalaryForm({ token, setUser }: { token: string; setUser: React.Dispatch<React.SetStateAction<User | null>> }) {
  const [from, setFrom] = useState("");
  const [salary, setSalary] = useState("");
  const [position, setPosition] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          salaryHistory: {
            action: "add",
            record: {
              from,
              salary: Number(salary),
              position,
            },
          },
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || "Failed to add salary record");
      setUser(data.user);
      setFrom("");
      setSalary("");
      setPosition("");
      toast.success("Salary record added!", { className: "custom-toast custom-toast--success" });
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Error adding salary record", { className: "custom-toast custom-toast--error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      className="flex flex-col gap-2 sm:flex-row sm:items-end sm:gap-3 mt-0"
      onSubmit={handleAdd}
    >
      <div className="flex-1">
        <label className="block text-xs text-gray-500 mb-1">Date</label>
        <Input type="date" value={from} onChange={e => setFrom(e.target.value)} required className="w-full" />
      </div>
      <div className="flex-1">
        <label className="block text-xs text-gray-500 mb-1">Salary</label>
        <Input type="number" value={salary} onChange={e => setSalary(e.target.value)} required className="w-full" />
      </div>
      <div className="flex-1">
        <label className="block text-xs text-gray-500 mb-1">Position</label>
        <Input type="text" value={position} onChange={e => setPosition(e.target.value)} required className="w-full" />
      </div>
      <Button type="submit" disabled={loading} className="h-10 w-full sm:w-auto mt-2 sm:mt-0 bg-indigo-600 text-white hover:bg-indigo-700">
        {loading ? "Adding..." : "Add"}
      </Button>
    </form>
  );
} 
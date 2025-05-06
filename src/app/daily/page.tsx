"use client";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import React, { useState, useEffect } from "react";
import { Eye, Pencil, Trash } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Navbar } from "@/components/common/Navbar";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";

const initialForm = {
    date: "",
    inTime: "",
    outTime: "",
    attendance: "Present",
    remarks: "",
    standup: "",
    report: "",
};
type DailyReport = typeof initialForm & { workingHour: string };

function calculateWorkingHour(inTime: string, outTime: string) {
    if (!inTime || !outTime) return "";
    const [inHour, inMin] = inTime.split(":").map(Number);
    const [outHour, outMin] = outTime.split(":").map(Number);
    let diff = (outHour * 60 + outMin) - (inHour * 60 + inMin);
    if (diff < 0) diff += 24 * 60; // handle overnight
    const hours = Math.floor(diff / 60);
    const mins = diff % 60;
    return `${hours}.${mins.toString().padStart(2, "0")}`;
}

// Helper for attendance badge color
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

export default function DailyPage() {
    const { user, token } = useAuth();
    const router = useRouter();

    // All hooks here, before any return!
    const [form, setForm] = useState<DailyReport>({ ...initialForm, workingHour: "" });
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | '' }>({ message: '', type: '' });
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<{ [key: string]: boolean }>({});
    const [records, setRecords] = useState<DailyReport[]>([]);
    const [filterDate, setFilterDate] = useState("");
    const [filterAttendance, setFilterAttendance] = useState("");
    const [filterWorkingHourMin, setFilterWorkingHourMin] = useState("");
    const [filterWorkingHourMax, setFilterWorkingHourMax] = useState("");
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editRecord, setEditRecord] = useState<DailyReport & { _id?: string } | null>(null);
    const [editLoading, setEditLoading] = useState(false);
    const [editError, setEditError] = useState<string | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 10; // Show 10 records per page
    const [initialLoading, setInitialLoading] = useState(true);

    const dateRef = React.useRef<HTMLInputElement>(null);
    const inTimeRef = React.useRef<HTMLInputElement>(null);
    const outTimeRef = React.useRef<HTMLInputElement>(null);
    const standupRef = React.useRef<HTMLTextAreaElement>(null);
    const reportRef = React.useRef<HTMLTextAreaElement>(null);
    const attendanceRef = React.useRef<HTMLSelectElement>(null);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fieldRefs: Record<string, React.RefObject<any>> = {
        date: dateRef,
        inTime: inTimeRef,
        outTime: outTimeRef,
        standup: standupRef,
        report: reportRef,
        attendance: attendanceRef,
    };

    useEffect(() => {
        if (user === null) {
            router.replace("/");
        }
    }, [user, router]);

    // Set the default date on the client only
    useEffect(() => {
        setForm((prev) => ({
            ...prev,
            date: new Date().toISOString().slice(0, 10),
        }));
    }, []);

    useEffect(() => {
        fetchRecords();
    }, []);

    useEffect(() => {
        setCurrentPage(1);
    }, [filterDate, filterAttendance, filterWorkingHourMin, filterWorkingHourMax, records.length]);

    if (user === null) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
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

    // Fetch all records
    const fetchRecords = async () => {
        setInitialLoading(true);
        try {
            console.log("Token in context:", token);
            const res = await fetch('/api/daily', { method: 'GET' });
            const data = await res.json();
            if (data.success && Array.isArray(data.records)) {
                setRecords(data.records);
            }
        } catch {}
        setInitialLoading(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setErrors({});
        // Conditional validation
        const attendanceType = form.attendance;
        let missingField = "";
        if (["Work from Home", "Halfday", "Present"].includes(attendanceType)) {
            for (const field of ["date", "inTime", "outTime", "standup", "report", "attendance"]) {
                if (!form[field as keyof DailyReport] || (typeof form[field as keyof DailyReport] === 'string' && (form[field as keyof DailyReport] as string).trim() === '')) {
                    setErrors((prev) => ({ ...prev, [field]: true }));
                    setToast({ message: `${field.charAt(0).toUpperCase() + field.slice(1)} is required`, type: 'error' });
                    missingField = field;
                    break;
                }
            }
        } else if (["Leave", "Absent", "Weekend"].includes(attendanceType)) {
            for (const field of ["date", "attendance", "remarks"]) {
                if (!form[field as keyof DailyReport] || (typeof form[field as keyof DailyReport] === 'string' && (form[field as keyof DailyReport] as string).trim() === '')) {
                    setErrors((prev) => ({ ...prev, [field]: true }));
                    setToast({ message: `${field.charAt(0).toUpperCase() + field.slice(1)} is required`, type: 'error' });
                    missingField = field;
                    break;
                }
            }
        }
        if (missingField) {
            setTimeout(() => {
                fieldRefs[missingField]?.current?.focus();
            }, 100);
            setLoading(false);
            setTimeout(() => setToast({ message: '', type: '' }), 3000);
            return;
        }
        try {
            const res = await fetch("/api/daily", {
                method: "POST",
                headers: { "Content-Type": "application/json", ...(user ? { Authorization: `Bearer ${user.token}` } : {}) },
                body: JSON.stringify(form),
            });
            const data = await res.json();
            if (data.success) {
                setToast({ message: data.message, type: 'success' });
                setForm({ ...initialForm, date: new Date().toISOString().slice(0, 10), workingHour: "" }); // clear form but keep today's date
                fetchRecords(); // refresh log
            } else {
                setToast({ message: data.message, type: 'error' });
            }
        } catch (err: unknown) {
            let message = 'Failed to save report.';
            if (err instanceof Error && typeof err.message === 'string') {
                message = err.message;
            }
            setToast({ message, type: 'error' });
        } finally {
            setLoading(false);
            setTimeout(() => setToast({ message: '', type: '' }), 3000);
        }
    };

    const errorClass = 'border-red-500 focus:border-red-500 focus:ring-red-500';

    // Filtered records
    const filteredRecords = records.filter((r) => {
        let pass = true;
        if (filterDate && r.date !== filterDate) pass = false;
        if (filterAttendance && r.attendance !== filterAttendance) pass = false;
        if (filterWorkingHourMin && (!r.workingHour || parseFloat(r.workingHour) < parseFloat(filterWorkingHourMin))) pass = false;
        if (filterWorkingHourMax && (!r.workingHour || parseFloat(r.workingHour) > parseFloat(filterWorkingHourMax))) pass = false;
        return pass;
    });

    // PAGINATED RECORDS
    const totalPages = Math.ceil(filteredRecords.length / pageSize);
    const paginatedRecords = filteredRecords.slice((currentPage - 1) * pageSize, currentPage * pageSize);

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
        setErrors({});
        try {
            const { _id, ...fieldsToUpdate } = editRecord;
            const res = await fetch("/api/daily", {
                method: "PATCH",
                headers: { "Content-Type": "application/json", ...(user ? { Authorization: `Bearer ${user.token}` } : {}) },
                body: JSON.stringify({ ...fieldsToUpdate, id: _id }),
            });
            const data = await res.json();
            if (data.success) {
                setToast({ message: data.message, type: 'success' });
                setEditModalOpen(false);
                setEditRecord(null);
                fetchRecords();
            } else {
                setEditError(data.message || 'Update failed.');
            }
        } catch (err: unknown) {
            let message = 'Failed to update report.';
            if (err instanceof Error && typeof err.message === 'string') {
                message = err.message;
            }
            setEditError(message);
        } finally {
            setEditLoading(false);
            setTimeout(() => setToast({ message: '', type: '' }), 3000);
        }
    };

    // Delete handler
    const handleDelete = async () => {
        if (!deleteId) return;
        setDeleteLoading(true);
        try {
            const res = await fetch("/api/daily", {
                method: "DELETE",
                headers: { "Content-Type": "application/json", ...(user ? { Authorization: `Bearer ${user.token}` } : {}) },
                body: JSON.stringify({ id: deleteId }),
            });
            const data = await res.json();
            if (data.success) {
                setToast({ message: data.message, type: 'success' });
                setDeleteDialogOpen(false);
                setDeleteId(null);
                fetchRecords();
            } else {
                setToast({ message: data.message, type: 'error' });
            }
        } catch (err: unknown) {
            let message = 'Failed to delete report.';
            if (err instanceof Error && typeof err.message === 'string') {
                message = err.message;
            }
            setToast({ message, type: 'error' });
        } finally {
            setDeleteLoading(false);
            setTimeout(() => setToast({ message: '', type: '' }), 3000);
        }
    };

    return (
        <TooltipProvider>
        <div className="min-h-screen bg-background flex flex-col p-0">
            {/* Navbar */}
            <Navbar />
            {/* Toast */}
            {toast.message && (
                <div className={`fixed right-8 top-[72px] z-50 px-4 py-2 rounded shadow-lg text-white ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>{toast.message}</div>
            )}
            <div className="w-full max-w-[1800px] mx-auto mt-4  grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
                {/* Form */}
                <div className="lg:col-span-1">
                    <Card className="w-full min-h-[600px] h-full p-8 rounded-2xl border shadow-md flex flex-col">
                        <CardHeader>
                            <CardTitle>Daily Report</CardTitle>
                            <CardDescription>Fill in your daily work details below.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {form.date && (
                                <form className="flex flex-col gap-6" onSubmit={handleSubmit} autoComplete="off">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="flex flex-col gap-2">
                                            <label>Date</label>
                                            <input ref={dateRef} type="date" name="date" value={form.date} onChange={handleChange} className={`border rounded px-2 py-2 cursor-pointer text-base ${errors.date ? errorClass : ''}`} disabled={loading} />
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <label>Attendance</label>
                                            <select ref={attendanceRef} name="attendance" value={form.attendance} onChange={handleChange} className={`border rounded px-2 py-2 cursor-pointer text-base ${errors.attendance ? errorClass : ''}`} disabled={loading}>
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
                                            <input ref={inTimeRef} type="time" name="inTime" value={form.inTime} onChange={handleChange} className={`border rounded px-2 py-2 cursor-pointer text-base ${errors.inTime ? errorClass : ''}`} disabled={loading} />
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <label>Out Time</label>
                                            <input ref={outTimeRef} type="time" name="outTime" value={form.outTime} onChange={handleChange} className={`border rounded px-2 py-2 cursor-pointer text-base ${errors.outTime ? errorClass : ''}`} disabled={loading} />
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label>Working Hour</label>
                                        <input type="text" name="workingHour" value={form.workingHour} readOnly className="border rounded px-2 py-2 bg-muted cursor-not-allowed text-base" disabled />
                                    </div>
                                    <div className="flex flex-col gap-4">
                                        <div className="flex flex-col gap-2">
                                            <label>Standup</label>
                                            <textarea ref={standupRef} name="standup" value={form.standup} onChange={handleChange} className={`border rounded px-2 py-2 min-h-[80px] resize-y text-base ${errors.standup ? errorClass : ''}`} disabled={loading} />
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <label>Report</label>
                                            <textarea ref={reportRef} name="report" value={form.report} onChange={handleChange} className={`border rounded px-2 py-2 min-h-[80px] resize-y text-base ${errors.report ? errorClass : ''}`} disabled={loading} />
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label>Remarks</label>
                                        <input type="text" name="remarks" value={form.remarks} onChange={handleChange} className="border rounded px-2 py-2 text-base" disabled={loading} />
                                    </div>
                                    <div className="flex justify-end">
                                        <Button type="submit" disabled={loading} className="min-w-[120px] flex items-center justify-center">
                                            {loading && (
                                                <span className="mr-2 inline-block align-middle">
                                                    <span className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white border-solid"></span>
                                                </span>
                                            )}
                                            {loading ? 'Submitting...' : 'Submit'}
                                        </Button>
                                    </div>
                                </form>
                            )}
                        </CardContent>
                    </Card>
                </div>
                {/* Log Table */}
                <div className="lg:col-span-3 flex flex-col h-full">
                    <Card className="w-full min-h-[600px] h-full flex flex-col flex-1 rounded-2xl border bg-white/80 shadow-lg">
                        <CardHeader className="flex flex-col lg:flex-row items-start lg:items-end justify-between gap-4">
                            <div>
                                <CardTitle className="text-xl font-bold">Daily Report Log</CardTitle>
                                <CardDescription>All submitted daily reports.</CardDescription>
                            </div>
                            {/* Filters */}
                            <div className="flex flex-wrap gap-4 items-end w-full lg:w-auto mt-4 lg:mt-0">
                                <div className="flex flex-col">
                                    <label className="text-xs mb-1">Date</label>
                                    <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} className="border rounded px-2 py-1 text-sm" />
                                </div>
                                <div className="flex flex-col">
                                    <label className="text-xs mb-1">Attendance</label>
                                    <select value={filterAttendance} onChange={e => setFilterAttendance(e.target.value)} className="border rounded px-2 py-1 text-sm">
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
                                <div className="flex flex-col">
                                    <label className="text-xs mb-1">Working Hour Min</label>
                                    <input type="number" value={filterWorkingHourMin} onChange={e => setFilterWorkingHourMin(e.target.value)} className="border rounded px-2 py-1 text-sm" placeholder="Min" />
                                </div>
                                <div className="flex flex-col">
                                    <label className="text-xs mb-1">Working Hour Max</label>
                                    <input type="number" value={filterWorkingHourMax} onChange={e => setFilterWorkingHourMax(e.target.value)} className="border rounded px-2 py-1 text-sm" placeholder="Max" />
                                </div>
                                {(filterDate || filterAttendance || filterWorkingHourMin || filterWorkingHourMax) && (
                                    <Button type="button" variant="outline" className="h-9 mt-5" onClick={() => { setFilterDate(""); setFilterAttendance(""); setFilterWorkingHourMin(""); setFilterWorkingHourMax(""); }}>Clear</Button>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent className="p-0 flex-1 flex flex-col">
                            <div className="overflow-x-auto flex-1">
                                <div>
                                    <table className="w-full text-base border-separate border-spacing-0 bg-white rounded-lg">
                                        <thead className="sticky top-0 z-10 bg-card/90 backdrop-blur">
                                            <tr>
                                                {[
                                                    "Date",
                                                    "In Time",
                                                    "Out Time",
                                                    "Working Hour",
                                                    "Attendance",
                                                    "Standup",
                                                    "Report",
                                                    "Remarks",
                                                    "Actions",
                                                ].map((h) => (
                                                    <th key={h} className="border-b px-6 py-3 text-left font-semibold text-gray-700">{h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {initialLoading ? (
                                                <tr>
                                                    <td colSpan={9} className="py-12 text-center">
                                                        <span className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary border-solid"></span>
                                                    </td>
                                                </tr>
                                            ) : paginatedRecords.length === 0 ? (
                                                <tr>
                                                    <td colSpan={9} className="text-center py-6 text-base text-gray-400">No reports yet.</td>
                                                </tr>
                                            ) : (
                                                <>
                                                    {paginatedRecords.map((r, i) => (
                                                        <tr key={i} className="even:bg-gray-50 hover:bg-primary/10 transition">
                                                            <td className="px-4 py-2">{r.date}</td>
                                                            <td className="px-4 py-2">{r.inTime}</td>
                                                            <td className="px-4 py-2">{r.outTime}</td>
                                                            <td className="px-4 py-2">{r.workingHour}</td>
                                                            <td className="px-4 py-2">
                                                                <Badge variant={attendanceBadgeVariant(r.attendance)} className="capitalize px-2 py-1 text-xs font-semibold shadow-sm rounded-full">
                                                                    {r.attendance}
                                                                </Badge>
                                                            </td>
                                                            <td className="px-4 py-2 max-w-xs break-words">
                                                                {r.standup && r.standup.length > 15 ? (
                                                                    <Tooltip>
                                                                        <TooltipTrigger asChild>
                                                                            <button className="bg-primary/10 hover:bg-primary/20 text-primary rounded-full p-2 shadow transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary/40">
                                                                                <Eye className="w-4 h-4" />
                                                                            </button>
                                                                        </TooltipTrigger>
                                                                        <TooltipContent className="max-w-xs whitespace-pre-line break-words rounded-xl shadow-lg bg-white text-gray-900 border border-gray-200 p-4">
                                                                            <div className="font-semibold mb-1 text-primary">Standup</div>
                                                                            <div>{r.standup}</div>
                                                                        </TooltipContent>
                                                                    </Tooltip>
                                                                ) : r.standup}
                                                            </td>
                                                            <td className="px-4 py-2 max-w-xs break-words">
                                                                {r.report && r.report.length > 15 ? (
                                                                    <Tooltip>
                                                                        <TooltipTrigger asChild>
                                                                            <button className="bg-primary/10 hover:bg-primary/20 text-primary rounded-full p-2 shadow transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary/40">
                                                                                <Eye className="w-4 h-4" />
                                                                            </button>
                                                                        </TooltipTrigger>
                                                                        <TooltipContent className="max-w-xs whitespace-pre-line break-words rounded-xl shadow-lg bg-white text-gray-900 border border-gray-200 p-4">
                                                                            <div className="font-semibold mb-1 text-primary">Report</div>
                                                                            <div>{r.report}</div>
                                                                        </TooltipContent>
                                                                    </Tooltip>
                                                                ) : r.report}
                                                            </td>
                                                            <td className="px-4 py-2 max-w-xs break-words">{r.remarks}</td>
                                                            <td className="px-4 py-2 flex gap-2 items-center">
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
                                                    {Array.from({ length: pageSize - paginatedRecords.length }).map((_, idx) => (
                                                        <tr key={`empty-${idx}`} className="even:bg-gray-50">
                                                            {Array.from({ length: 9 }).map((_, colIdx) => (
                                                                <td key={colIdx} className="px-4 py-2">&nbsp;</td>
                                                            ))}
                                                        </tr>
                                                    ))}
                                                </>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                            {totalPages > 1 && (
                                <div className="flex justify-center items-center gap-2 py-2">
                                    <Button variant="outline" size="sm" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}>Prev</Button>
                                    <span className="px-2 text-sm">Page {currentPage} of {totalPages}</span>
                                    <Button variant="outline" size="sm" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>Next</Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
            {/* Edit Modal */}
            <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
                <DialogContent className="w-full max-w-[95vw] md:max-w-lg rounded-2xl p-4 md:p-6">
                    <Card className="w-full border-none shadow-none p-0">
                        <DialogHeader>
                            <DialogTitle>Edit Daily Report</DialogTitle>
                            <DialogDescription>Update your daily report details below. All required fields must be filled.</DialogDescription>
                        </DialogHeader>
                        {editError && <div className="text-red-600 text-sm mb-2">{editError}</div>}
                        {editRecord && (
                            <form className="flex flex-col gap-4" onSubmit={handleUpdate} autoComplete="off">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="flex flex-col gap-2">
                                        <label>Date</label>
                                        <input type="date" name="date" value={editRecord.date} onChange={e => setEditRecord({ ...editRecord, date: e.target.value })} className="border rounded px-2 py-2 text-base" disabled={editLoading} />
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
                                        <input type="time" name="inTime" value={editRecord.inTime} onChange={e => {
                                            const newInTime = e.target.value;
                                            setEditRecord(prev => prev ? { ...prev, inTime: newInTime, workingHour: calculateWorkingHour(newInTime, prev.outTime) } : prev);
                                        }} className="border rounded px-2 py-2 text-base" disabled={editLoading} />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label>Out Time</label>
                                        <input type="time" name="outTime" value={editRecord.outTime} onChange={e => {
                                            const newOutTime = e.target.value;
                                            setEditRecord(prev => prev ? { ...prev, outTime: newOutTime, workingHour: calculateWorkingHour(prev.inTime, newOutTime) } : prev);
                                        }} className="border rounded px-2 py-2 text-base" disabled={editLoading} />
                                    </div>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label>Working Hour</label>
                                    <input type="text" name="workingHour" value={editRecord.workingHour} readOnly className="border rounded px-2 py-2 bg-muted cursor-not-allowed text-base" disabled />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="flex flex-col gap-2">
                                        <label>Standup</label>
                                        <textarea name="standup" value={editRecord.standup} onChange={e => setEditRecord({ ...editRecord, standup: e.target.value })} className="border rounded px-2 py-2 min-h-[80px] resize-y text-base" disabled={editLoading} />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label>Report</label>
                                        <textarea name="report" value={editRecord.report} onChange={e => setEditRecord({ ...editRecord, report: e.target.value })} className="border rounded px-2 py-2 min-h-[80px] resize-y text-base" disabled={editLoading} />
                                    </div>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label>Remarks</label>
                                    <input type="text" name="remarks" value={editRecord.remarks} onChange={e => setEditRecord({ ...editRecord, remarks: e.target.value })} className="border rounded px-2 py-2 text-base" disabled={editLoading} />
                                </div>
                                <DialogFooter className="flex justify-end gap-2 mt-4">
                                    <Button type="button" variant="outline" onClick={() => setEditModalOpen(false)} disabled={editLoading}>Cancel</Button>
                                    <Button type="submit" disabled={editLoading} className="min-w-[120px] flex items-center justify-center">
                                        {editLoading ? 'Updating...' : 'Update'}
                                    </Button>
                                </DialogFooter>
                            </form>
                        )}
                    </Card>
                </DialogContent>
            </Dialog>
            {/* Delete Dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent className="max-w-sm w-full rounded-2xl">
                    <DialogHeader>
                        <DialogTitle>Delete Report</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">Are you sure you want to delete this report? This action cannot be undone.</div>
                    <DialogFooter className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={deleteLoading}>Cancel</Button>
                        <Button type="button" variant="destructive" onClick={handleDelete} disabled={deleteLoading}>
                            {deleteLoading ? 'Deleting...' : 'Delete'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
        </TooltipProvider>
    );
}

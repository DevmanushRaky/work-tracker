"use client";
import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bold, Italic, List, ListOrdered } from 'lucide-react';
import BulletList from '@tiptap/extension-bullet-list';
import OrderedList from '@tiptap/extension-ordered-list';
import ListItem from '@tiptap/extension-list-item';

function getCurrentDate() {
  return new Date().toISOString().slice(0, 10);
}
function getCurrentTime() {
  const now = new Date();
  return now.toTimeString().slice(0, 5);
}

// Tiptap WYSIWYG Editor Component with Compact Toolbar
function TiptapEditor({ value, onChange, error, height = 200 }: { value: string, onChange: (v: string) => void, error?: boolean, height?: number }) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      BulletList,
      OrderedList,
      ListItem,
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  // Keep editor content in sync with value prop
  React.useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value || '<p></p>');
    }
    // eslint-disable-next-line
  }, [value]);

  const toolbarBtn = (isActive: boolean) =>
    `inline-flex items-center justify-center w-7 h-7 rounded-md border border-gray-200 transition-colors mx-0.5
    ${isActive ? 'bg-indigo-100 text-indigo-700 border-indigo-300' : 'bg-white text-gray-600 hover:bg-indigo-50 hover:text-indigo-700'} focus:outline-none focus:ring-1 focus:ring-indigo-400`;

  return (
    <div className={`border rounded-lg bg-white ${error ? 'border-red-500' : 'border-gray-200'} shadow-sm`}>  
      <style>{`
        .tiptap.ProseMirror {
          border: none !important;
          box-shadow: none !important;
          background: transparent !important;
          min-height: 120px;
          max-height: 300px;
          overflow-y: auto;
          padding: 0.5rem 0.75rem;
          border-radius: 0.5rem;
          font-size: 1rem;
          line-height: 1.5;
        }
        .tiptap.ProseMirror:focus {
          outline: none !important;
          box-shadow: none !important;
        }
        .tiptap.ProseMirror ul,
        .tiptap.ProseMirror ol {
          padding-left: 1.5em;
          margin: 0.25em 0 0.25em 0;
          list-style-position: outside;
        }
        .tiptap.ProseMirror ul {
          list-style-type: disc !important;
        }
        .tiptap.ProseMirror ol {
          list-style-type: decimal !important;
        }
        .tiptap.ProseMirror li {
          margin: 0.1em 0;
        }
      `}</style>
      {editor && (
        <div className="flex gap-1 border-b p-1 bg-gray-50 rounded-t-lg">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={toolbarBtn(editor.isActive('bold'))}
            title="Bold (Ctrl+B)"
            aria-label="Bold"
          >
            <Bold className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={toolbarBtn(editor.isActive('italic'))}
            title="Italic (Ctrl+I)"
            aria-label="Italic"
          >
            <Italic className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => {
              if (!editor.isActive('bulletList')) {
                editor.chain().focus().toggleBulletList().run();
              } else {
                editor.chain().focus().toggleBulletList().run();
              }
            }}
            className={toolbarBtn(editor.isActive('bulletList'))}
            title="Bullet List"
            aria-label="Bullet List"
          >
            <List className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => {
              if (!editor.isActive('orderedList')) {
                editor.chain().focus().toggleOrderedList().run();
              } else {
                editor.chain().focus().toggleOrderedList().run();
              }
            }}
            className={toolbarBtn(editor.isActive('orderedList'))}
            title="Numbered List"
            aria-label="Numbered List"
          >
            <ListOrdered className="w-4 h-4" />
          </button>
        </div>
      )}
      <div className="p-2 pt-1">
        <EditorContent
          editor={editor}
          className="tiptap"
          style={{
            minHeight: height,
            outline: 'none',
            border: 'none',
            boxShadow: 'none',
            background: 'transparent',
            resize: 'none'
          }}
        />
      </div>
    </div>
  );
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
  const formRef = useRef<HTMLFormElement>(null);
  const [logForDate, setLogForDate] = useState<Partial<typeof form> | null>(null);
  const [errors, setErrors] = useState<{ [key: string]: boolean }>({});
  const [activeTab, setActiveTab] = useState<'standup' | 'report'>('standup');

  const attendanceOptions = [
    "Present",
    "Absent",
    "Leave",
    "Holiday",
    "Weekend",
    "Work from Home",
    "Halfday",
  ];

  const specialAttendance = ["Leave", "Absent", "Holiday", "Weekend"];
  const isSpecialAttendance = specialAttendance.includes(form.attendance);

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
          // Removed unused existingDates
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

  // Fetch log for selected date
  useEffect(() => {
    async function fetchLogForDate() {
      if (!token || !form.date) return;
      try {
        const res = await fetch(`/api/daily?startDate=${form.date}&endDate=${form.date}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success && Array.isArray(data.records) && data.records.length > 0) {
          setLogForDate(data.records[0]);
        } else {
          setLogForDate(null);
        }
      } catch {
        setLogForDate(null);
      }
    }
    fetchLogForDate();
  }, [token, form.date]);

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

  const handleEditorChange = (field: 'standup' | 'report', value: string) => {
    setForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Unified submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    if (isSpecialAttendance) {
      // Only require date and attendance
      for (const field of ["date", "attendance"]) {
        if (!form[field as keyof typeof form] || (typeof form[field as keyof typeof form] === 'string' && (form[field as keyof typeof form] as string).trim() === '')) {
          setErrors((prev: { [key: string]: boolean }) => ({ ...prev, [field]: true }));
          toast.error(`${field.charAt(0).toUpperCase() + field.slice(1)} is required`);
          setLoading(false);
          return;
        }
      }
      // Prepare data
      const submitData: Partial<typeof form> = {
        date: form.date,
        attendance: form.attendance,
      };
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
        if (!data.success) throw new Error(data.message || "Failed to save log");
        toast.success("Log saved!", { className: "custom-toast custom-toast--success" });
        setLogForDate((prev: Partial<typeof form> | null) => ({ ...prev, ...submitData }));
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : "Something went wrong";
        toast.error(errorMsg, { className: "custom-toast custom-toast--error" });
      } finally {
        setLoading(false);
      }
    } else {
      // For regular attendance, require all fields except standup/report
      for (const field of ["date", "attendance", "inTime", "outTime"]) {
        if (!form[field as keyof typeof form] || (typeof form[field as keyof typeof form] === 'string' && (form[field as keyof typeof form] as string).trim() === '')) {
          setErrors((prev: { [key: string]: boolean }) => ({ ...prev, [field]: true }));
          toast.error(`${field.charAt(0).toUpperCase() + field.slice(1)} is required`);
          setLoading(false);
          return;
        }
      }
      // Only require at least one of standup or report
      if (!form.standup && !form.report) {
        setErrors(prev => ({ ...prev, standup: true, report: true }));
        toast.error("Either Standup or Report is required");
        setLoading(false);
        return;
      }
      // Prepare data
      const submitData: Partial<typeof form> = {
        date: form.date,
        attendance: form.attendance,
        inTime: form.inTime,
        outTime: form.outTime,
        standup: form.standup,
        report: form.report,
      };
      if (form.workingHour) submitData.workingHour = form.workingHour;
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
        if (!data.success) throw new Error(data.message || "Failed to save log");
        toast.success("Log saved!", { className: "custom-toast custom-toast--success" });
        setLogForDate((prev: Partial<typeof form> | null) => ({ ...prev, ...submitData }));
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : "Something went wrong";
        toast.error(errorMsg, { className: "custom-toast custom-toast--error" });
      } finally {
        setLoading(false);
      }
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
      <form ref={formRef} className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5" autoComplete="off" onSubmit={handleSubmit}>
        <div>
          <label className="block text-base font-semibold mb-1 text-gray-700" htmlFor="date">Date</label>
          <Input type="date" id="date" name="date" value={form.date} onChange={handleChange} required className={`w-full text-lg px-4 py-2 border rounded-lg bg-gray-50 ${errors.date ? errorClass : ''}`} />
        </div>
        <div>
          <label className="block text-base font-semibold mb-1 text-gray-700" htmlFor="attendance">Attendance</label>
          <select id="attendance" name="attendance" value={form.attendance} onChange={handleChange} className={`w-full text-lg px-4 py-2 border rounded-lg bg-gray-50 ${errors.attendance ? errorClass : ''}`}>
            {attendanceOptions.map((opt: string) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-base font-semibold mb-1 text-gray-700" htmlFor="inTime">In Time</label>
          <Input type="time" id="inTime" name="inTime" value={form.inTime} onChange={handleChange} className={`w-full text-lg px-4 py-2 border rounded-lg bg-gray-50 ${errors.inTime ? errorClass : ''}`} disabled={activeTab === 'report'} />
        </div>
        <div>
          <label className="block text-base font-semibold mb-1 text-gray-700" htmlFor="outTime">Out Time</label>
          <Input type="time" id="outTime" name="outTime" value={form.outTime} onChange={handleChange} className={`w-full text-lg px-4 py-2 border rounded-lg bg-gray-50 ${errors.outTime ? errorClass : ''}`} disabled={activeTab === 'standup'} />
        </div>
        {!isSpecialAttendance && (
          <div className="sm:col-span-2">
            <Tabs defaultValue="standup" className="w-full" onValueChange={v => setActiveTab(v as 'standup' | 'report')}>
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="standup" className={`${errors.standup ? 'border-red-500' : ''}`}>Standup</TabsTrigger>
                <TabsTrigger value="report" className={`${errors.report ? 'border-red-500' : ''}`}>Report</TabsTrigger>
              </TabsList>
              <TabsContent value="standup">
                <TiptapEditor
                  value={form.standup}
                  onChange={v => handleEditorChange('standup', v)}
                  error={!!errors.standup}
                  height={200}
                />
                {logForDate?.standup &&
                  logForDate.standup.replace(/<[^>]+>/g, '').trim() !== '' &&
                  !['<p></p>', '<ul><li></li></ul>', '<ol><li></li></ol>'].includes(logForDate.standup.trim()) && (
                    <div className="text-green-600 text-xs mt-1">Standup already filled for this date.</div>
                  )}
              </TabsContent>
              <TabsContent value="report">
                <TiptapEditor
                  value={form.report}
                  onChange={v => handleEditorChange('report', v)}
                  error={!!errors.report}
                  height={200}
                />
                {logForDate?.report && <div className="text-green-600 text-xs mt-1">Report already filled for this date.</div>}
              </TabsContent>
            </Tabs>
          </div>
        )}
        <div className="sm:col-span-2">
          <label className="block text-base font-semibold mb-1 text-gray-700" htmlFor="remarks">Remarks</label>
          <Input id="remarks" name="remarks" value={form.remarks} onChange={handleChange} className="w-full text-lg px-4 py-2 border rounded-lg bg-gray-50" />
        </div>
        <div>
          <label className="block text-base font-semibold mb-1 text-gray-700" htmlFor="workingHour">Working Hour</label>
          <Input id="workingHour" name="workingHour" value={form.workingHour} className="w-full text-lg px-4 py-2 border rounded-lg bg-gray-100 cursor-not-allowed" placeholder="e.g. 8.00" readOnly disabled />
        </div>
        <div className="flex items-end">
          <Button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto h-12 text-lg font-semibold bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl shadow-lg hover:from-indigo-600 hover:to-purple-700 transition-all duration-200 flex items-center justify-center gap-2 px-8 mt-2"
          >
            {loading ? (
              <span className="flex items-center gap-2"><span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></span> Saving...</span>
            ) : (
              <span>Save Log</span>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
} 
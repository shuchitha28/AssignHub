import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import API from "../../api/axios";
import { motion } from "framer-motion";
import { FileText, Calendar, Edit2, Trash2, X } from "lucide-react";
import { format } from "date-fns";

import { getPdfUrl, openPDF } from "../../utils/file";

export default function MySubjects() {
  const qc = useQueryClient();

  const [selectedSubject, setSelectedSubject] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);

  const [editingAssignment, setEditingAssignment] = useState<any>(null);

  const [form, setForm] = useState({
    title: "",
    dueDate: "",
    dueTime: "23:59",
    points: 100,
    description: "",
    pdfUrl: "",
  });

  /* ================= FETCH SUBJECTS ================= */
  const { data } = useQuery({
    queryKey: ["teacher-subjects"],
    queryFn: () => API.get(`/teacher/subjects`),
  });

  const subjects = data?.data || [];

  /* ================= CREATE ================= */
  const createAssignment = useMutation({
    mutationFn: (data: any) => API.post("/assignments", data),
    onSuccess: () => {
      toast.success("Assignment created");
      qc.invalidateQueries({ queryKey: ["teacher-subjects"] });
      resetModal();
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || "Failed to create assignment";
      toast.error(message);
    }
  });

  /* ================= UPDATE ================= */
  const updateAssignment = useMutation({
    mutationFn: (data: any) =>
      API.put(`/assignments/${data.id}`, data),
    onSuccess: () => {
      toast.success("Assignment updated");
      qc.invalidateQueries({ queryKey: ["teacher-subjects"] });
      resetModal();
    },
  });

  /* ================= DELETE ================= */
  const deleteAssignment = useMutation({
    mutationFn: (id: string) =>
      API.delete(`/assignments/${id}`),
    onSuccess: () => {
      toast.success("Assignment deleted");
      qc.invalidateQueries({ queryKey: ["teacher-subjects"] });
    },
  });

  const resetModal = () => {
    setShowModal(false);
    setEditingAssignment(null);
    setForm({
      title: "",
      dueDate: "",
      dueTime: "23:59",
      points: 100,
      description: "",
      pdfUrl: "",
    });
  };

  const handleSubmit = (publish = true) => {
    if (!form.title || !form.dueDate) {
      return toast.error("Title & due date required");
    }

    const combinedDeadline = new Date(`${form.dueDate}T${form.dueTime || "23:59"}:00`);

    if (editingAssignment) {
      updateAssignment.mutate({
        id: editingAssignment._id,
        title: form.title,
        description: form.description,
        deadline: combinedDeadline.toISOString(),
        totalMarks: form.points,
        publish,
        pdfUrl: form.pdfUrl,
      });
    } else {
      createAssignment.mutate({
        title: form.title,
        description: form.description,
        deadline: combinedDeadline.toISOString(),
        totalMarks: form.points,
        subjectId: selectedSubject._id,
        publish,
        pdfUrl: form.pdfUrl,
      });
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-8 bg-theme min-h-screen">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black bg-gradient-to-r from-[rgb(var(--primary))] to-[rgb(var(--secondary))] bg-clip-text text-transparent uppercase tracking-tight">
            My Subjects
          </h1>
          <p className="text-gray-500 dark:text-gray-400 font-medium">Manage your subject curricula and assignments.</p>
        </div>
      </div>

      {/* SUBJECT LIST */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {subjects.map((s: any) => (
          <div
            key={s._id}
            className="p-8 bg-white dark:bg-gray-800 shadow-sm rounded-[2rem] border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all"
          >
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-black text-gray-800 dark:text-white leading-tight mb-1">{s.name}</h2>
                <span className="px-3 py-1 bg-[rgb(var(--primary))]/10 text-[rgb(var(--primary))] text-[10px] font-black rounded-lg uppercase tracking-widest">
                  {s.course?.name || "N/A"}
                </span>
              </div>
              <button
                onClick={() => {
                  setSelectedSubject(s);
                  setShowModal(true);
                }}
                className="flex items-center gap-2 px-6 py-3 bg-[rgb(var(--primary))] text-white text-xs font-black rounded-2xl hover:opacity-90 transition-all shadow-lg shadow-[rgb(var(--primary))]/20 uppercase tracking-widest"
              >
                + New Assignment
              </button>
            </div>

            {/* ================= ASSIGNMENTS ================= */}
            <div className="mt-8 space-y-4">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Current Assignments</h3>
              {s.assignments?.length === 0 ? (
                <div className="py-12 text-center bg-gray-50/50 dark:bg-gray-900/30 rounded-3xl border border-dashed border-gray-200 dark:border-gray-800">
                  <p className="text-gray-400 font-bold italic">No assignments created yet</p>
                </div>
              ) : (
                s.assignments?.map((a: any) => (
                  <div
                    key={a._id}
                    className="p-5 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-transparent hover:border-[rgb(var(--primary))]/20 transition-all group"
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white dark:bg-gray-800 rounded-xl flex items-center justify-center border border-gray-100 dark:border-gray-700 shadow-sm text-[rgb(var(--primary))]">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-bold text-gray-800 dark:text-white group-hover:text-[rgb(var(--primary))] transition-colors">{a.title}</p>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="flex items-center gap-1 text-[10px] text-gray-400 font-bold uppercase tracking-wide">
                              <Calendar className="w-3 h-3" /> Due {format(new Date(a.deadline), "MMM dd, yyyy 'at' hh:mm a")}
                            </span>
                            <span className="w-1 h-1 bg-gray-300 rounded-full" />
                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wide">
                              {a.totalMarks} Points
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {/* VIEW PDF */}
                        {a.pdfUrl && (
                          <button
                            onClick={() => openPDF(a.pdfUrl)}
                            className="p-2 hover:bg-blue-500/10 text-blue-500 rounded-lg transition-colors"
                            title="View PDF"
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                        )}
                        {/* EDIT */}
                        <button
                          onClick={() => {
                            setSelectedSubject(s);
                            setEditingAssignment(a);
                            setForm({
                              title: a.title,
                              dueDate: a.deadline?.slice(0, 10),
                              dueTime: a.deadline ? format(new Date(a.deadline), "HH:mm") : "23:59",
                              points: a.totalMarks,
                              description: a.description,
                              pdfUrl: a.pdfUrl || "",
                            });
                            setShowModal(true);
                          }}
                          className="p-2 hover:bg-yellow-500/10 text-yellow-500 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        {/* DELETE */}
                        <button
                          onClick={() => {
                            if (confirm("Delete assignment?")) {
                              deleteAssignment.mutate(a._id);
                            }
                          }}
                          className="p-2 hover:bg-red-500/10 text-red-500 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ================= MODAL ================= */}
      {showModal && selectedSubject && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-md z-50 p-4">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-lg bg-white dark:bg-gray-900 rounded-[2.5rem] shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-800"
          >
            {/* HEADER */}
            <div className="px-6 py-4 bg-gradient-to-r from-[rgb(var(--primary))] to-[rgb(var(--secondary))] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                  <FileText className="w-4 h-4 text-white" />
                </div>
                <h2 className="text-lg font-black text-white uppercase tracking-tight">
                  {editingAssignment ? "Edit Assignment" : "New Assignment"}
                </h2>
              </div>
              <button 
                onClick={resetModal}
                className="w-8 h-8 flex items-center justify-center bg-white/20 hover:bg-white/30 text-white rounded-lg transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* BODY */}
            <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto custom-scrollbar">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Assignment Title</label>
                <input
                  placeholder="e.g. Midterm Essay: Modern History"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full p-3 bg-gray-50 dark:bg-gray-800/50 border border-transparent focus:border-[rgb(var(--primary))]/30 rounded-xl outline-none font-bold text-gray-800 dark:text-white transition-all text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Due Date</label>
                  <input
                    type="date"
                    value={form.dueDate}
                    onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                    className="w-full p-3 bg-gray-50 dark:bg-gray-800/50 border border-transparent focus:border-[rgb(var(--primary))]/30 rounded-xl outline-none font-bold text-gray-800 dark:text-white transition-all text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Due Time</label>
                  <input
                    type="time"
                    value={form.dueTime}
                    onChange={(e) => setForm({ ...form, dueTime: e.target.value })}
                    className="w-full p-3 bg-gray-50 dark:bg-gray-800/50 border border-transparent focus:border-[rgb(var(--primary))]/30 rounded-xl outline-none font-bold text-gray-800 dark:text-white transition-all text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Total Points</label>
                  <input
                    type="number"
                    value={form.points}
                    onChange={(e) => setForm({ ...form, points: Number(e.target.value) })}
                    className="w-full p-3 bg-gray-50 dark:bg-gray-800/50 border border-transparent focus:border-[rgb(var(--primary))]/30 rounded-xl outline-none font-bold text-gray-800 dark:text-white transition-all text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">PDF Attachment</label>
                  <div className="relative">
                    <input
                      type="file"
                      accept="application/pdf"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          if (file.size > 10 * 1024 * 1024) return toast.error("Max 10MB");
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setForm({ ...form, pdfUrl: reader.result as string });
                            toast.success(`"${file.name}" attached successfully!`);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="hidden"
                      id="assignment-pdf"
                    />
                    <label 
                      htmlFor="assignment-pdf"
                      className={`w-full p-3 flex items-center justify-center gap-2 border border-dashed rounded-xl cursor-pointer transition-all text-xs font-bold ${
                        form.pdfUrl 
                          ? "bg-green-500/10 border-green-500/50 text-green-600" 
                          : "bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 text-gray-400 hover:border-[rgb(var(--primary))]/30"
                      }`}
                    >
                      <FileText className="w-3.5 h-3.5" />
                      {form.pdfUrl ? "PDF Linked" : "Upload PDF"}
                    </label>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Instructions</label>
                <textarea
                  placeholder="Provide details about the assignment..."
                  value={form.description}
                  rows={3}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full p-3 bg-gray-50 dark:bg-gray-800/50 border border-transparent focus:border-[rgb(var(--primary))]/30 rounded-xl outline-none font-bold text-gray-800 dark:text-white transition-all resize-none text-sm"
                />
              </div>

              {/* ACTIONS */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  onClick={() => handleSubmit(false)}
                  disabled={createAssignment.isPending || updateAssignment.isPending}
                  className="py-3 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-black rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-all uppercase text-[10px] tracking-widest disabled:opacity-50"
                >
                  Save Draft
                </button>

                <button
                  onClick={() => handleSubmit(true)}
                  disabled={createAssignment.isPending || updateAssignment.isPending}
                  className="py-3 bg-gradient-to-r from-[rgb(var(--primary))] to-[rgb(var(--secondary))] text-white font-black rounded-xl hover:opacity-90 transition-all shadow-lg shadow-[rgb(var(--primary))]/20 uppercase text-[10px] tracking-widest disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {(createAssignment.isPending || updateAssignment.isPending) ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : null}
                  {(createAssignment.isPending || updateAssignment.isPending) ? "Uploading..." : (editingAssignment ? "Update" : "Publish Now")}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
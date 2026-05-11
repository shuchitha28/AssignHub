import { useState } from "react";
import { 
  FileText, 
  Edit, 
  Trash2, 
  Download, 
  Search,
  ChevronRight,
  Eye,
  X,
  MessageSquarePlus,
  CheckCircle2,
  Clock
} from "lucide-react";
import toast from "react-hot-toast";
import jsPDF from "jspdf";
import { format } from "date-fns";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { getMySubmissions, deleteMySubmission } from "../../api/assignment.api";
import API from "../../api/axios";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle } from "lucide-react";
import html2canvas from "html2canvas";
import { openPDF } from "../../utils/file";

interface Submission {
  _id: string;
  title: string;
  content: string;
  wordCount: number;
  wpm: number;
  typedPercentage: number;
  pastedPercentage: number;
  status: "draft" | "submitted" | "reviewed" | "revision_requested";
  createdAt: string;
  updatedAt: string;
  student: {
    _id: string;
    name: string;
    email: string;
  };
  marks?: number;
  feedback?: string;
  assignment?: {
    _id: string;
    title: string;
    totalMarks: number;
    pdfUrl?: string;
    deadline?: string;
    subject?: { name: string };
    course?: { name: string };
    teacher?: { name: string };
  };
}

export default function Assignments() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "draft" | "submitted" | "reviewed" | "revision_requested">("all");
  const [viewModal, setViewModal] = useState<Submission | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [showSubmitModal, setShowSubmitModal] = useState<any>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadingSub, setDownloadingSub] = useState<Submission | null>(null);
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const qc = useQueryClient();
  /* ─── Finalize submission (Submit a draft) ─── */
  const finalizeSubmission = useMutation({
    mutationFn: (sub: any) => {
      if (sub.assignment?.deadline && new Date(sub.assignment.deadline).getTime() < Date.now()) {
        throw new Error("Deadline has passed");
      }
      return API.put(`/assignments/submissions/${sub._id}`, { 
        status: "submitted",
      });
    },
    onSuccess: () => {
      toast.success("Assignment submitted successfully!");
      qc.invalidateQueries({ queryKey: ["my-submissions"] });
      setShowSubmitModal(null);
    },
    onError: () => toast.error("Failed to submit assignment"),
  });

  const getScoreColor = (marks: number, total: number) => {
    const percentage = (marks / total) * 100;
    if (percentage >= 80) return "from-green-500 to-emerald-600 shadow-emerald-500/20";
    if (percentage >= 50) return "from-amber-400 to-orange-500 shadow-orange-500/20";
    return "from-red-500 to-pink-600 shadow-pink-500/20";
  };

  /* ─── Fetch submissions from backend ─── */
  const { data, isLoading } = useQuery({
    queryKey: ["my-submissions"],
    queryFn: getMySubmissions,
  });

  const rawSubmissions: Submission[] = data?.data || [];
  
  // Filter out submissions for deleted or unpublished assignments
  const submissions = rawSubmissions.filter((s: any) => {
    // If it has an assignmentId but no populated assignment object, the assignment was deleted
    if (s.assignmentId && !s.assignment) return false;
    
    // If the assignment is not published, hide it from the list
    if (s.assignment && s.assignment.publish === false) return false;
    
    return true;
  });

  /* ─── Delete mutation ─── */
  const deleteMutation = useMutation({
    mutationFn: deleteMySubmission,
    onSuccess: () => {
      toast.success("Assignment deleted");
      qc.invalidateQueries({ queryKey: ["my-submissions"] });
    },
    onError: () => toast.error("Failed to delete"),
  });

  const handleEdit = (sub: Submission) => {
    navigate("/student/notepad", { state: { assignment: sub, assignmentData: sub.assignment } });
  };

  const handleDelete = (id: string) => {
    setDeleteConfirm(id);
  };

  const confirmDelete = () => {
    if (deleteConfirm) {
      deleteMutation.mutate(deleteConfirm, {
        onSuccess: () => setDeleteConfirm(null)
      });
    }
  };

  /* ─── PDF Download ─── */
  const downloadPDF = (sub: Submission) => {
    setDownloadingSub(sub);
    setTimeout(() => {
      generatePDF(sub);
    }, 500); // wait for DOM to render the hidden elements
  };

  const generatePDF = async (sub: Submission) => {
    setIsDownloading(true);

    try {
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      // Professional Margins
      const margin = 20;
      const footerSpace = 25; // Slightly more for footer
      const contentHeightPerPage = pdfHeight - (margin + footerSpace);

      const capturePage = async (elementId: string) => {
        const element = document.getElementById(elementId);
        if (!element) return null;

        element.style.display = "block";
        const canvas = await html2canvas(element, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: "#ffffff",
          windowWidth: 800
        });
        element.style.display = "none";
        return canvas;
      };

      const addBranding = (pageNumber: number) => {
        // Header
        pdf.setFontSize(8);
        pdf.setTextColor(148, 163, 184); // #94a3b8
        pdf.text("AssignHub Academic Report", margin, 12);
        pdf.text(`Student: ${user.name || "Student"}`, pdfWidth - margin, 12, { align: "right" });

        // Footer Line
        pdf.setDrawColor(241, 245, 249);
        pdf.setLineWidth(0.2);
        pdf.line(margin, pdfHeight - 15, pdfWidth - margin, pdfHeight - 15);

        pdf.text(`© ${new Date().getFullYear()} AssignHub Digital Education`, margin, pdfHeight - 10);
        pdf.text(`Page ${pageNumber}`, pdfWidth - margin, pdfHeight - 10, { align: "right" });
      };

      const addTickMark = () => {
        pdf.setDrawColor(34, 197, 94);
        pdf.setLineWidth(0.5);
        pdf.line(pdfWidth - 35, 25, pdfWidth - 30, 30);
        pdf.line(pdfWidth - 30, 30, pdfWidth - 20, 20);
        pdf.setFontSize(7);
        pdf.setTextColor(34, 197, 94);
        pdf.text("VERIFIED", pdfWidth - 35, 35);
      };

      // 1. Front Page
      const frontCanvas = await capturePage("pdf-front-page");
      if (frontCanvas) {
        pdf.addImage(frontCanvas.toDataURL("image/png"), "PNG", 0, 0, pdfWidth, pdfHeight);
      }

      // 2. Analytics Page
      const analyticsCanvas = await capturePage("pdf-analytics-page");
      if (analyticsCanvas) {
        pdf.addPage();
        pdf.addImage(analyticsCanvas.toDataURL("image/png"), "PNG", 0, 0, pdfWidth, pdfHeight);
      }

      // 3. Content - Handle Multi-page
      const contentElement = document.getElementById("pdf-content-page");
      if (contentElement) {
        contentElement.style.display = "block";
        const canvas = await html2canvas(contentElement, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: "#ffffff",
          windowWidth: 800
        });
        contentElement.style.display = "none";

        const imgData = canvas.toDataURL("image/png");
        const imgProps = pdf.getImageProperties(imgData);
        const totalImgHeight = (imgProps.height * pdfWidth) / imgProps.width;

        let heightLeft = totalImgHeight;
        let position = 0;
        let pageCount = 3; 

        while (heightLeft > 0) {
          pdf.addPage();
          pdf.addImage(imgData, "PNG", 0, margin - position, pdfWidth, totalImgHeight);
          pdf.setFillColor(255, 255, 255);
          pdf.rect(0, 0, pdfWidth, margin, "F"); // Top Margin
          pdf.rect(0, margin + contentHeightPerPage, pdfWidth, footerSpace + 10, "F"); // Bottom Margin
          addBranding(pageCount);
          if (sub.status === "reviewed") {
            addTickMark();
          }
          position += contentHeightPerPage;
          heightLeft -= contentHeightPerPage;
          pageCount++;
        }
      }

      const safeTitle = (sub.title || "Assignment").replace(/[^a-zA-Z0-9]/g, "_");
      const safeName = (user.name || "Student").replace(/[^a-zA-Z0-9]/g, "_");
      pdf.save(`Full_Report_${safeName}_${safeTitle}.pdf`);
      toast.success("Professional Report Generated!");
    } catch (error) {
      console.error("PDF Error:", error);
      toast.error("Failed to generate report");
    } finally {
      setIsDownloading(false);
      setDownloadingSub(null);
    }
  };

  const filteredSubmissions = submissions.filter((s) => {
    const matchesSearch = (s.title || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-[rgb(var(--primary))] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-gray-500">Loading assignments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-theme min-h-screen -m-6 p-8">
      {/* Header Banner */}
      <div className="p-8 text-white rounded-3xl bg-gradient-to-r from-primary to-secondary shadow-lg shadow-primary/20 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <FileText className="w-8 h-8" />
            My Assignments
          </h1>
          <p className="mt-2 opacity-90">
            Manage, track, and review your writing progress and integrity scores.
          </p>
        </div>
        
        <div className="flex flex-col md:flex-row items-center gap-4">
          {/* Status Tabs */}
          <div className="flex bg-white/10 backdrop-blur-md p-1 rounded-2xl border border-white/20">
            {["all", "draft", "submitted", "reviewed", "revision_requested"].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status as any)}
                className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  statusFilter === status 
                    ? "bg-white text-primary shadow-lg" 
                    : "text-white hover:bg-white/10"
                }`}
              >
                {status.replace("_", " ").toUpperCase()}
              </button>
            ))}
          </div>

          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Search assignments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2.5 bg-white text-gray-800 border-none rounded-2xl outline-none focus:ring-4 focus:ring-white/20 placeholder:text-gray-400 shadow-sm transition-all w-full md:w-64"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSubmissions.map((sub) => (
          <div 
            key={sub._id}
            className="group bg-white dark:bg-gray-900 rounded-[2rem] p-6 border border-gray-100 dark:border-gray-800 hover:shadow-xl hover:shadow-[rgb(var(--primary))]/5 transition-all duration-300 relative overflow-hidden"
          >
            {/* Status Badge */}
            <div className={`absolute top-6 right-6 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
              (sub.assignment?.deadline && new Date(sub.assignment.deadline).getTime() < Date.now() && sub.status !== "submitted" && sub.status !== "reviewed")
                ? "bg-gray-100 text-gray-500 border border-gray-200 font-black shadow-sm"
                : sub.status === "reviewed"
                ? "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                : sub.status === "submitted" 
                ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400" 
                : sub.status === "revision_requested"
                ? "bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400"
                : "bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400"
            }`}>
              {(sub.assignment?.deadline && new Date(sub.assignment.deadline).getTime() < Date.now() && sub.status !== "submitted" && sub.status !== "reviewed")
                ? "EXPIRED"
                : sub.status.replace("_", " ")}
            </div>

            <div className="mb-6">
              <div className="w-12 h-12 bg-primary/10 dark:bg-primary/20 rounded-2xl flex items-center justify-center mb-4 text-primary group-hover:scale-110 transition-transform">
                <FileText size={24} />
              </div>
              <h3 className="text-xl font-bold text-gray-800 dark:text-white line-clamp-1 mb-1">
                {sub.title || "Untitled"}
              </h3>
              
              <div className="flex flex-col gap-0.5 mb-3">
                <p className="text-[10px] font-bold text-primary uppercase tracking-wider">
                  {sub.assignment?.course?.name || "Draft"} &middot; {sub.assignment?.subject?.name || "Personal Project"}
                </p>
                <p className="text-[10px] text-gray-400 font-medium">
                  {sub.assignment?.teacher?.name ? `Instructor: ${sub.assignment.teacher.name}` : "Self-managed assignment"}
                </p>
              </div>

              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-400">
                  {new Date(sub.updatedAt || sub.createdAt).toLocaleDateString()}
                </p>
                {sub.status === "reviewed" && sub.marks !== undefined && (
                  <div className={`flex items-center gap-1.5 bg-gradient-to-br ${getScoreColor(sub.marks, sub.assignment?.totalMarks || 100)} text-white px-3 py-1.5 rounded-xl text-[10px] font-black shadow-lg border border-white/20`}>
                    <CheckCircle2 size={10} />
                    {sub.marks} / {sub.assignment?.totalMarks || 100}
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-2xl">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Words</p>
                <p className="text-lg font-bold text-gray-700 dark:text-gray-200">{sub.wordCount || 0}</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-2xl">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Typed</p>
                <p className="text-lg font-bold text-gray-700 dark:text-gray-200">{sub.typedPercentage || 0}%</p>
              </div>
            </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-50 dark:border-gray-800">
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => downloadPDF(sub)}
                  disabled={isDownloading && downloadingSub?._id === sub._id}
                  className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-all"
                  title="Download PDF"
                >
                  {isDownloading && downloadingSub?._id === sub._id ? (
                    <div className="w-[18px] h-[18px] border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Download size={18} />
                  )}
                </button>
                {(sub.status === "draft" || sub.status === "revision_requested" || sub.status === "submitted") && (
                  <>
                    <button 
                      onClick={() => {
                        if (sub.assignment?.deadline && new Date(sub.assignment.deadline).getTime() < Date.now()) {
                          return toast.error("Submission deadline has passed!");
                        }
                        setShowSubmitModal(sub);
                      }}
                      className={`p-2 text-gray-400 hover:text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-xl transition-all ${sub.status === "submitted" ? "hidden" : ""}`}
                      title={sub.assignment?.deadline && new Date(sub.assignment.deadline).getTime() < Date.now() ? "Deadline Passed" : "Submit Final"}
                    >
                      <CheckCircle2 size={18} className={sub.assignment?.deadline && new Date(sub.assignment.deadline).getTime() < Date.now() ? "opacity-30" : ""} />
                    </button>
                    <button 
                      onClick={() => {
                        if (sub.assignment?.deadline && new Date(sub.assignment.deadline).getTime() < Date.now()) {
                          return handleEdit(sub); // It will be read-only anyway, but maybe user wants to see it
                        }
                        handleEdit(sub);
                      }}
                      className={`p-2 text-gray-400 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-xl transition-all ${sub.status === "submitted" ? "hidden" : ""}`}
                      title="Edit"
                    >
                      <Edit size={18} />
                    </button>
                    <button 
                      onClick={() => handleDelete(sub._id)}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"
                      title="Delete"
                    >
                      <Trash2 size={18} />
                    </button>
                  </>
                )}
                <button 
                  onClick={() => setViewModal(sub)}
                  className="p-2 text-gray-400 hover:text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-xl transition-all"
                  title="View"
                >
                  <Eye size={18} />
                </button>
                {sub.assignment?.pdfUrl && (
                  <button
                    onClick={() => openPDF(sub.assignment!.pdfUrl!)}
                    className="p-2 text-gray-400 hover:text-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-xl transition-all"
                    title="View Assignment Questions PDF"
                  >
                    <FileText size={18} />
                  </button>
                )}
              </div>
              
              <button 
                onClick={() => setViewModal(sub)}
                className="flex items-center gap-1 text-sm font-bold text-[rgb(var(--primary))] hover:gap-2 transition-all"
              >
                View Details <ChevronRight size={16} />
              </button>
            </div>
          </div>
        ))}

        {filteredSubmissions.length === 0 && (
          <div className="col-span-full py-20 text-center bg-white dark:bg-gray-900 rounded-[2.5rem] border border-dashed border-gray-200 dark:border-gray-800">
            <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800/50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
              <FileText size={32} />
            </div>
            <h3 className="text-xl font-bold text-gray-400">No assignments found</h3>
            <p className="text-gray-300 mt-1">Start writing your first assignment in the Notepad</p>
          </div>
        )}
      </div>

      {/* ─── View Modal ─── */}
      {viewModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-6">
          <div className="bg-white dark:bg-gray-900 rounded-3xl max-w-3xl w-full max-h-[85vh] overflow-auto p-8 relative">
            <button
              onClick={() => setViewModal(null)}
              className="absolute top-6 right-6 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl text-gray-400"
            >
              <X size={20} />
            </button>

            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-1">
              {viewModal.title || "Untitled"}
            </h2>

            <div className="flex flex-col gap-1 mb-4">
              <p className="text-xs font-bold text-primary uppercase tracking-widest">
                {viewModal.assignment?.course?.name || "Draft"} &middot; {viewModal.assignment?.subject?.name || "Personal Project"}
              </p>
              <p className="text-xs text-gray-400 font-medium italic">
                {viewModal.assignment?.teacher?.name ? `Submitted to: ${viewModal.assignment.teacher.name}` : "Self-managed / Not yet assigned"}
              </p>
            </div>

            <div className="flex items-center justify-between mb-6">
              <div className="space-y-1">
                <p className="text-sm text-gray-400">
                  Submitted: {format(new Date(viewModal.createdAt), "MMM dd, yyyy")} &middot;{" "}
                  <span className={
                    viewModal.status === "reviewed" ? "text-green-500" : 
                    viewModal.status === "submitted" ? "text-blue-500" : 
                    (viewModal.assignment?.deadline && new Date(viewModal.assignment.deadline).getTime() < Date.now()) ? "text-red-500 font-black" :
                    "text-[rgb(var(--primary))]"
                  }>
                    {(viewModal.assignment?.deadline && new Date(viewModal.assignment.deadline).getTime() < Date.now() && viewModal.status !== "submitted" && viewModal.status !== "reviewed") 
                      ? "EXPIRED" 
                      : viewModal.status.toUpperCase()}
                  </span>
                </p>
                {viewModal.assignment?.deadline && (
                  <p className="text-xs font-bold text-gray-500 flex items-center gap-1">
                    <Clock size={12} className="text-gray-400" /> 
                    Deadline: {format(new Date(viewModal.assignment.deadline), "MMM dd, yyyy 'at' hh:mm a")}
                  </p>
                )}
              </div>
              {viewModal.status === "reviewed" && viewModal.marks !== undefined && (
                <div className={`bg-gradient-to-r ${getScoreColor(viewModal.marks, viewModal.assignment?.totalMarks || 100)} text-white px-5 py-2 rounded-2xl text-sm font-black shadow-xl flex items-center gap-2 border border-white/10`}>
                   <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                      <CheckCircle2 size={16} />
                   </div>
                   <div>
                      <p className="text-[8px] opacity-70 leading-none">FINAL GRADE</p>
                      <p className="text-lg leading-none mt-1">{viewModal.marks} / {viewModal.assignment?.totalMarks || 100}</p>
                   </div>
                </div>
              )}
            </div>

            {/* Analytics */}
            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="bg-[rgb(var(--primary))]/5 dark:bg-[rgb(var(--primary))]/10 p-4 rounded-2xl text-center">
                <p className="text-[10px] font-bold text-[rgb(var(--primary))] uppercase mb-1">Words</p>
                <p className="text-xl font-bold">{viewModal.wordCount || 0}</p>
              </div>
              <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-2xl text-center">
                <p className="text-[10px] font-bold text-purple-500 uppercase mb-1">WPM</p>
                <p className="text-xl font-bold">{viewModal.wpm || 0}</p>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-2xl text-center">
                <p className="text-[10px] font-bold text-green-500 uppercase mb-1">Typed</p>
                <p className="text-xl font-bold">{viewModal.typedPercentage || 0}%</p>
              </div>
              <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-2xl text-center">
                <p className="text-[10px] font-bold text-red-500 uppercase mb-1">Pasted</p>
                <p className="text-xl font-bold">{viewModal.pastedPercentage || 0}%</p>
              </div>
            </div>

            {/* Teacher Feedback */}
            {(viewModal.status === "reviewed" || viewModal.status === "revision_requested") && viewModal.feedback && (
              <div className="bg-amber-50 dark:bg-amber-900/10 p-6 rounded-2xl border border-amber-100 dark:border-amber-900/30 mb-6">
                <h3 className="text-sm font-bold text-amber-600 dark:text-amber-400 uppercase mb-2 flex items-center gap-2">
                  <MessageSquarePlus size={16} /> Teacher Feedback
                </h3>
                <p className="text-gray-700 dark:text-gray-300 italic">"{viewModal.feedback}"</p>
              </div>
            )}

            {/* Content */}
            <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-2xl">
              <h3 className="text-sm font-bold text-gray-500 uppercase mb-3">Content</h3>
              <div 
                className="text-gray-700 dark:text-gray-300 leading-relaxed overflow-auto max-h-[400px] prose dark:prose-invert notepad-editor"
                dangerouslySetInnerHTML={{ __html: viewModal.content || "No content" }}
              />
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => downloadPDF(viewModal)}
                disabled={isDownloading}
                className="flex items-center gap-2 px-5 py-2 bg-purple-100 text-purple-500 rounded-xl hover:bg-purple-500 hover:text-white transition-colors disabled:opacity-50"
              >
                {isDownloading ? (
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Download size={16} />
                )}
                {isDownloading ? "Generating..." : "Download My PDF"}
              </button>
              {viewModal.assignment?.pdfUrl && (
                <button
                  onClick={() => openPDF(viewModal.assignment!.pdfUrl!)}
                  className="flex items-center gap-2 px-5 py-2 bg-orange-50 text-orange-500 rounded-xl hover:bg-orange-500 hover:text-white dark:bg-gray-800 text-[rgb(var(--primary))] rounded-xl  dark:hover:bg-gray-700 transition-all "
                >
                  <FileText size={16} /> View Questions PDF
                </button>
              )}
              {(viewModal.status === "draft" || viewModal.status === "revision_requested" || viewModal.status === "submitted") && (
                <button
                  onClick={() => {
                    handleDelete(viewModal._id);
                    setViewModal(null);
                  }}
                  className="px-5 py-2 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all flex items-center gap-2 font-bold"
                >
                  <Trash2 size={16} /> Delete
                </button>
              )}
              <button
                onClick={() => setViewModal(null)}
                className="px-5 py-2 bg-gray-100 dark:bg-gray-800 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeleteConfirm(null)}
              className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-white dark:bg-gray-900 rounded-[2.5rem] p-8 max-w-md w-full shadow-2xl border border-gray-100 dark:border-gray-800"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-20 h-20 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-6">
                  <AlertCircle className="w-10 h-10 text-red-500" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Delete Assignment?</h3>
                <p className="text-gray-500 dark:text-gray-400 font-medium mb-8">
                  This action is permanent and cannot be undone. All your progress for this draft will be lost forever.
                </p>
                <div className="flex gap-4 w-full">
                  <button 
                    onClick={() => setDeleteConfirm(null)}
                    className="flex-1 py-4 bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-bold rounded-2xl border border-gray-100 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={confirmDelete}
                    disabled={deleteMutation.isPending}
                    className="flex-1 py-4 bg-red-500 text-white font-bold rounded-2xl shadow-lg shadow-red-500/20 hover:bg-red-600 transition-all flex items-center justify-center gap-2"
                  >
                    {deleteMutation.isPending ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      "Delete Now"
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── Submit Draft Modal (MyCourse Style) ─── */}
      <AnimatePresence>
        {showSubmitModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setShowSubmitModal(null)} 
              className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" 
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.9, opacity: 0 }} 
              className="relative bg-white dark:bg-gray-900 rounded-[2.5rem] p-8 max-w-lg w-full shadow-2xl border border-gray-100 dark:border-gray-800"
            >
              <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Finalize Submission</h3>
              <p className="text-gray-500 mb-8 text-sm font-medium">
                You are about to submit <span className="font-bold text-primary">{showSubmitModal.title || "this draft"}</span> for formal review. This action will lock the content.
              </p>
              
              <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-3xl mb-8 border border-gray-100 dark:border-gray-700">
                <div className="grid grid-cols-2 gap-4">
                   <div className="text-center">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Words</p>
                      <p className="text-lg font-bold text-gray-800 dark:text-white">{showSubmitModal.wordCount || 0}</p>
                   </div>
                   <div className="text-center">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Typed %</p>
                      <p className="text-lg font-bold text-green-500">{showSubmitModal.typedPercentage || 0}%</p>
                   </div>
                </div>
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={() => setShowSubmitModal(null)} 
                  className="flex-1 py-4 bg-gray-50 dark:bg-gray-800 text-gray-500 font-bold rounded-2xl hover:bg-gray-100 transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => finalizeSubmission.mutate(showSubmitModal)} 
                  disabled={finalizeSubmission.isPending}
                  className="flex-1 py-4 bg-primary text-white font-bold rounded-2xl hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
                >
                  {finalizeSubmission.isPending ? (
                     <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>Confirm & Submit <CheckCircle2 size={18} /></>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Hidden PDF Elements */}
      {downloadingSub && (
        <div id="pdf-export-container" style={{ position: "absolute", opacity: 0, pointerEvents: "none" }}>
          {/* ————— PAGE 1: FRONT PAGE ————— */}
          <div id="pdf-front-page" style={{ display: "none", position: "absolute", left: "-9999px", width: "800px", height: "1120px", background: "#fff", padding: "40px" }}>
            <div style={{ border: "2px solid #0f172a", height: "100%", padding: "80px 60px", display: "flex", flexDirection: "column", justifyContent: "space-between", position: "relative" }}>
              {/* Corner Accents */}
              <div style={{ position: "absolute", top: "-10px", left: "-10px", width: "40px", height: "40px", borderTop: "5px solid #e11d48", borderLeft: "5px solid #e11d48" }} />
              <div style={{ position: "absolute", bottom: "-10px", right: "-10px", width: "40px", height: "40px", borderBottom: "5px solid #e11d48", borderRight: "5px solid #e11d48" }} />

              <div style={{ textAlign: "center" }}>
                <h2 style={{ fontSize: "20px", color: "#e11d48", fontWeight: "900", textTransform: "uppercase", letterSpacing: "8px", marginBottom: "20px" }}>AssignHub</h2>
                <p style={{ fontSize: "12px", color: "#64748b", fontWeight: "700", textTransform: "uppercase", letterSpacing: "3px", marginBottom: "60px" }}>Excellence in Digital Learning</p>

                <div style={{ margin: "80px 0" }}>
                  <p style={{ fontSize: "14px", color: "#94a3b8", fontWeight: "800", textTransform: "uppercase", marginBottom: "15px" }}>Submission Report</p>
                  <h1 style={{ fontSize: "42px", fontWeight: "900", color: "#0f172a", lineHeight: "1.1", marginBottom: "20px" }}>{downloadingSub.title || downloadingSub.assignment?.title || "Untitled"}</h1>
                  <div style={{ width: "80px", height: "4px", background: "#e11d48", margin: "0 auto" }} />
                </div>
              </div>

              <div style={{ background: "#f8fafc", padding: "40px", borderRadius: "20px", border: "1px solid #f1f5f9" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "30px" }}>
                  <div>
                    <p style={{ fontSize: "10px", color: "#94a3b8", fontWeight: "900", textTransform: "uppercase", marginBottom: "5px" }}>Student Name</p>
                    <p style={{ fontSize: "16px", fontWeight: "800", color: "#1e293b" }}>{user.name || "Student"}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: "10px", color: "#94a3b8", fontWeight: "900", textTransform: "uppercase", marginBottom: "5px" }}>Course Name</p>
                    <p style={{ fontSize: "16px", fontWeight: "800", color: "#1e293b" }}>{downloadingSub.assignment?.course?.name || "N/A"}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: "10px", color: "#94a3b8", fontWeight: "900", textTransform: "uppercase", marginBottom: "5px" }}>Subject</p>
                    <p style={{ fontSize: "16px", fontWeight: "800", color: "#1e293b" }}>{downloadingSub.assignment?.subject?.name || "Uncategorized"}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: "10px", color: "#94a3b8", fontWeight: "900", textTransform: "uppercase", marginBottom: "5px" }}>Subject Teacher</p>
                    <p style={{ fontSize: "16px", fontWeight: "800", color: "#1e293b" }}>
                      {downloadingSub.assignment?.teacher?.name || "AssignHub Educator"}
                    </p>
                  </div>
                  <div>
                    <p style={{ fontSize: "10px", color: "#94a3b8", fontWeight: "900", textTransform: "uppercase", marginBottom: "5px" }}>Submitted Date</p>
                    <p style={{ fontSize: "16px", fontWeight: "800", color: "#1e293b" }}>{new Date(downloadingSub.updatedAt || downloadingSub.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: "10px", color: "#94a3b8", fontWeight: "900", textTransform: "uppercase", marginBottom: "5px" }}>Submission Time</p>
                    <p style={{ fontSize: "16px", fontWeight: "800", color: "#1e293b" }}>{new Date(downloadingSub.updatedAt || downloadingSub.createdAt).toLocaleTimeString()}</p>
                  </div>
                </div>
              </div>

              <div style={{ textAlign: "center", marginTop: "40px" }}>
                <p style={{ fontSize: "10px", color: "#94a3b8", fontWeight: "600" }}>© {new Date().getFullYear()} AssignHub Digital Education Platform. All Rights Reserved.</p>
              </div>
            </div>
          </div>

          {/* ————— PAGE 2: ANALYTICS & REPORT ————— */}
          <div id="pdf-analytics-page" style={{ display: "none", position: "absolute", left: "-9999px", width: "800px", height: "1120px", background: "#fff", padding: "80px 60px" }}>
            <h2 style={{ fontSize: "24px", fontWeight: "900", color: "#0f172a", borderBottom: "2px solid #f1f5f9", paddingBottom: "20px", marginBottom: "40px" }}>Submission Analytics</h2>

            <div style={{ display: "flex", gap: "60px", alignItems: "center", marginBottom: "60px" }}>
              <div style={{ flex: 1, textAlign: "center" }}>
                <div style={{ position: "relative", width: "200px", height: "200px", margin: "0 auto" }}>
                  <svg viewBox="0 0 100 100" style={{ width: "200px", height: "200px" }}>
                    <circle cx="50" cy="50" r="40" fill="none" stroke={(downloadingSub.typedPercentage || 0) === 100 ? "#22c55e" : "#ef4444"} strokeWidth="8" />
                    <circle
                      cx="50" cy="50" r="40"
                      fill="none"
                      stroke="#22c55e"
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray={`${((downloadingSub.typedPercentage || 0) / 100) * 251.32} 251.32`}
                      transform="rotate(-90 50 50)"
                    />
                  </svg>
                  <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", textAlign: "center" }}>
                    <p style={{ fontSize: "36px", fontWeight: "900", margin: "0", color: "#1e293b" }}>{downloadingSub.typedPercentage || 0}%</p>
                    <p style={{ fontSize: "10px", color: "#64748b", fontWeight: "800", textTransform: "uppercase", letterSpacing: "1px", marginTop: "2px" }}>Originality</p>
                  </div>
                </div>
                <div style={{ marginTop: "20px", display: "flex", justifyContent: "center", gap: "20px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                    <div style={{ width: "10px", height: "10px", background: "#22c55e", borderRadius: "2px" }} />
                    <span style={{ fontSize: "11px", fontWeight: "700" }}>Typed</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                    <div style={{ width: "10px", height: "10px", background: "#ef4444", borderRadius: "2px" }} />
                    <span style={{ fontSize: "11px", fontWeight: "700" }}>Pasted</span>
                  </div>
                </div>
              </div>

              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "20px" }}>
                <div style={{ background: "#f8fafc", padding: "20px", borderRadius: "20px", marginBottom: "20px" }}>
                  <p style={{ fontSize: "10px", color: "#64748b", fontWeight: "900", textTransform: "uppercase" }}>Word Count</p>
                  <p style={{ fontSize: "24px", fontWeight: "800", color: "#0f172a" }}>{downloadingSub.wordCount || 0}</p>
                </div>
                <div style={{ background: "#f8fafc", padding: "20px", borderRadius: "20px", marginBottom: "20px" }}>
                  <p style={{ fontSize: "10px", color: "#64748b", fontWeight: "900", textTransform: "uppercase" }}>Typing Speed</p>
                  <p style={{ fontSize: "24px", fontWeight: "800", color: "#0f172a" }}>{downloadingSub.wpm || 0} WPM</p>
                </div>
              </div>
            </div>

            {downloadingSub.status === "reviewed" ? (
              <div style={{ background: "#f0fdf4", padding: "40px", borderRadius: "30px", border: "1px solid #dcfce7", textAlign: "center" }}>
                <p style={{ fontSize: "14px", fontWeight: "900", color: "#166534", textTransform: "uppercase", letterSpacing: "2px", marginBottom: "10px" }}>Final Assessment</p>
                <h3 style={{ fontSize: "64px", fontWeight: "900", color: "#166534", margin: "0" }}>{downloadingSub.marks} <span style={{ fontSize: "24px", color: "#166534", opacity: "0.6" }}>/ {downloadingSub.assignment?.totalMarks || 100}</span></h3>
                <div style={{ marginTop: "20px", display: "inline-flex", alignItems: "center", gap: "10px", padding: "8px 20px", background: "#166534", color: "#fff", borderRadius: "full", fontSize: "12px", fontWeight: "900", textTransform: "uppercase" }}>
                  Verified Submission ✓
                </div>
              </div>
            ) : (
              <div style={{ background: "#f8fafc", padding: "40px", borderRadius: "30px", border: "1px solid #f1f5f9", textAlign: "center" }}>
                <p style={{ fontSize: "14px", fontWeight: "900", color: "#64748b", textTransform: "uppercase", letterSpacing: "2px", marginBottom: "10px" }}>Submission Status</p>
                <h3 style={{ fontSize: "42px", fontWeight: "900", color: "#334155", margin: "0" }}>Pending Review</h3>
              </div>
            )}
          </div>

          {/* ————— PAGE 3: CONTENT PAGE ————— */}
          <div id="pdf-content-page" style={{ display: "none", position: "absolute", left: "-9999px", width: "800px", minHeight: "1120px", background: "#fff", padding: "20px 60px 80px 60px" }}>
            <style>{`
                .rich-content ul, .rich-content ol { 
                  list-style: none !important; 
                  padding: 0 !important; 
                  margin: 0 0 1.5rem 1.5rem !important; 
                }
                .rich-content ul ul, .rich-content ol ol, .rich-content ul ol, .rich-content ol ul {
                  margin-top: 0.5rem !important;
                  margin-bottom: 0.5rem !important;
                }
                .rich-content li { 
                  padding-left: 1.2rem !important;
                  text-indent: -1.2rem !important;
                  margin-bottom: 0.5rem !important;
                  line-height: 1.6 !important;
                  display: block !important;
                }
                .rich-content li p {
                  margin: 0 !important;
                  display: inline !important;
                }
                .rich-content ul li::before {
                  content: "•";
                  color: #334155 !important;
                  font-weight: bold !important;
                  display: inline-block !important;
                  width: 1rem !important;
                  margin-right: 0.2rem !important;
                  text-align: right !important;
                }
                .rich-content ol { 
                  counter-reset: item !important; 
                }
                .rich-content ol li::before {
                  content: counter(item) ".";
                  counter-increment: item !important;
                  color: #334155 !important;
                  font-weight: bold !important;
                  display: inline-block !important;
                  width: 1rem !important;
                  margin-right: 0.2rem !important;
                  text-align: right !important;
                }
                .rich-content .pasted-content {
                  background-color: rgba(236, 72, 153, 0.08) !important;
                  border-bottom: 1.5px dashed #ec4899 !important;
                  padding: 2px 2px !important;
                  margin: 0 !important;
                  display: inline !important;
                  box-decoration-break: clone !important;
                  -webkit-box-decoration-break: clone !important;
                  border-radius: 2px !important;
                }
             `}</style>
            <h2 style={{ fontSize: "20px", fontWeight: "900", color: "#0f172a", marginBottom: "40px", borderBottom: "1px solid #f1f5f9", paddingBottom: "10px" }}>Assignment Content</h2>
            <div className="rich-content" style={{ fontSize: "14px", lineHeight: "1.8", color: "#334155" }} dangerouslySetInnerHTML={{ __html: downloadingSub.content || "" }} />

            <div style={{ marginTop: "100px", paddingTop: "40px", borderTop: "2px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
              <div>
                <p style={{ fontSize: "10px", fontWeight: "900", color: "#94a3b8", textTransform: "uppercase", marginBottom: "5px" }}>Instructor</p>
                <p style={{ fontSize: "18px", fontWeight: "800", color: "#1e293b" }}>{downloadingSub.assignment?.teacher?.name || "AssignHub Educator"}</p>
                <p style={{ fontSize: "11px", color: "#64748b" }}>Document ID: {downloadingSub._id.substring(0, 8).toUpperCase()}</p>
              </div>
              <div style={{ textAlign: "right" }}>
                {downloadingSub.status === "reviewed" ? (
                  <>
                    <p style={{ fontSize: "10px", fontWeight: "900", color: "#94a3b8", textTransform: "uppercase", marginBottom: "5px" }}>Final Grade</p>
                    <p style={{ fontSize: "32px", fontWeight: "900", color: "#166534" }}>{downloadingSub.marks} / {downloadingSub.assignment?.totalMarks || 100}</p>
                  </>
                ) : (
                  <>
                    <p style={{ fontSize: "10px", fontWeight: "900", color: "#94a3b8", textTransform: "uppercase", marginBottom: "5px" }}>Status</p>
                    <p style={{ fontSize: "20px", fontWeight: "900", color: "#334155" }}>Pending Review</p>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
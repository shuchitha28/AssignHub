import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "react-router-dom";
import { getTeacherSubmissions, reviewSubmission } from "../../api/assignment.api";
import {
  FileText,
  Search,
  CheckCircle2,
  Clock,
  GraduationCap,
  Eye,
  User,
  BarChart3,
  Calendar,
  ArrowLeft,
  UploadCloud,
  RefreshCcw,
  UserCircle,
  Download
} from "lucide-react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export default function Review() {
  const qc = useQueryClient();
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterSubject, setFilterSubject] = useState("all");
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null);
  const [subForPdf, setSubForPdf] = useState<any>(null);
  const [grade, setGrade] = useState("");
  const [feedback, setFeedback] = useState("");
  const [isDownloading, setIsDownloading] = useState(false);

  const getPercentages = (s: any) => {
    if (s.typedPercentage !== undefined && s.pastedPercentage !== undefined) {
      return { typed: s.typedPercentage, pasted: s.pastedPercentage };
    }
    const total = (s.typedChars || 0) + (s.pastedChars || 0);
    if (total === 0) return { typed: 100, pasted: 0 };
    const p = Math.round(((s.pastedChars || 0) / total) * 100);
    return { typed: 100 - p, pasted: p };
  };

  const generatePDF = async (sub: any) => {
    setIsDownloading(true);
    getPercentages(sub);

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
        pdf.text(`Student: ${sub.student?.name}`, pdfWidth - margin, 12, { align: "right" });

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
        // Moved left by 10mm more
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
        let pageCount = 3; // Starts from 3rd page usually

        while (heightLeft > 0) {
          pdf.addPage();

          // Draw the image with simple position offset
          pdf.addImage(imgData, "PNG", 0, margin - position, pdfWidth, totalImgHeight);

          // Mask top and bottom margins to prevent content overlap between pages
          pdf.setFillColor(255, 255, 255);
          pdf.rect(0, 0, pdfWidth, margin, "F"); // Top Margin
          pdf.rect(0, margin + contentHeightPerPage, pdfWidth, footerSpace + 10, "F"); // Bottom Margin - precisely after content

          addBranding(pageCount);
          addTickMark();

          position += contentHeightPerPage;
          heightLeft -= contentHeightPerPage;
          pageCount++;
        }
      }

      pdf.save(`Full_Report_${sub.student?.name}_${sub.assignment?.title}.pdf`);
      toast.success("Professional Report Generated!");
    } catch (error) {
      console.error("PDF Error:", error);
      toast.error("Failed to generate report");
    } finally {
      setIsDownloading(false);
      setSubForPdf(null);
    }
  };

  const handleListDownload = (sub: any) => {
    setSubForPdf(sub);
    // Wait for the hidden templates to render with the new data
    setTimeout(() => {
      generatePDF(sub);
    }, 500);
  };

  /* ================= FETCH DATA ================= */
  const { data, isLoading } = useQuery({
    queryKey: ["teacher-submissions"],
    queryFn: getTeacherSubmissions,
  });

  const submissions = data?.data || [];

  // Effect to handle direct navigation to a submission
  useEffect(() => {
    if (submissions.length > 0 && location.state?.submissionId) {
      const sub = submissions.find((s: any) => s._id === location.state.submissionId);
      if (sub) {
        setSelectedSubmission(sub);
        // Clear state so it doesn't reopen on every refresh
        window.history.replaceState({}, document.title);
      }
    }
  }, [submissions, location.state]);

  /* ================= MUTATIONS ================= */
  const submitReview = useMutation({
    mutationFn: (subId: string) => reviewSubmission(subId, {
      marks: Number(grade),
      feedback,
      status: "reviewed"
    }),
    onSuccess: () => {
      toast.success("Submission reviewed successfully!");
      qc.invalidateQueries({ queryKey: ["teacher-submissions"] });
      setSelectedSubmission(null);
      setGrade("");
      setFeedback("");
    },
    onError: () => toast.error("Failed to submit review"),
  });

  const requestRevision = useMutation({
    mutationFn: (subId: string) => reviewSubmission(subId, {
      feedback,
      status: "revision_requested"
    }),
    onSuccess: () => {
      toast.success("Revision requested!");
      qc.invalidateQueries({ queryKey: ["teacher-submissions"] });
      setSelectedSubmission(null);
      setGrade("");
      setFeedback("");
    },
    onError: () => toast.error("Failed to request revision"),
  });

  /* ================= FILTERING ================= */
  const filteredSubmissions = submissions.filter((s: any) => {
    const matchesSearch =
      s.student?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.assignment?.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.assignment?.subject?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.assignment?.course?.name?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = filterStatus === "all" || s.status === filterStatus;
    const matchesSubject = filterSubject === "all" || s.assignment?.subject?._id === filterSubject;

    return matchesSearch && matchesStatus && matchesSubject;
  });

  // Build unique subject entries keyed by subject ID (so same name in different courses stays separate)
  const subjectMap = new Map<string, { id: string; name: string; course: string }>();
  submissions.forEach((s: any) => {
    const subId = s.assignment?.subject?._id;
    const subName = s.assignment?.subject?.name;
    const courseName = s.assignment?.course?.name;
    if (subId && subName && !subjectMap.has(subId)) {
      subjectMap.set(subId, { id: subId, name: subName, course: courseName || "" });
    }
  });
  const subjects = Array.from(subjectMap.values());

  const stats = {
    total: submissions.length,
    reviewed: submissions.filter((s: any) => s.status === "reviewed").length,
    pending: submissions.filter((s: any) => s.status === "submitted").length,
    revision: submissions.filter((s: any) => s.status === "revision_requested").length,
  };

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const subToRender = subForPdf || selectedSubmission;

  const PdfTemplates = () => {
    if (!subToRender) return null;
    const { typed: typedPercent } = getPercentages(subToRender);

    return (
      <div className="fixed left-[-9999px] top-0 pointer-events-none opacity-0">
        {/* ————— PAGE 1: FRONT PAGE ————— */}
        <div id="pdf-front-page" style={{ width: "800px", height: "1120px", background: "#fff", padding: "40px" }}>
          <div style={{ border: "2px solid #0f172a", height: "100%", padding: "80px 60px", display: "flex", flexDirection: "column", justifyContent: "space-between", position: "relative" }}>
            {/* Corner Accents */}
            <div style={{ position: "absolute", top: "-10px", left: "-10px", width: "40px", height: "40px", borderTop: "5px solid #e11d48", borderLeft: "5px solid #e11d48" }} />
            <div style={{ position: "absolute", bottom: "-10px", right: "-10px", width: "40px", height: "40px", borderBottom: "5px solid #e11d48", borderRight: "5px solid #e11d48" }} />

            <div style={{ textAlign: "center" }}>
              <h2 style={{ fontSize: "20px", color: "#e11d48", fontWeight: "900", textTransform: "uppercase", letterSpacing: "8px", marginBottom: "20px" }}>AssignHub</h2>
              <p style={{ fontSize: "12px", color: "#64748b", fontWeight: "700", textTransform: "uppercase", letterSpacing: "3px", marginBottom: "60px" }}>Excellence in Digital Learning</p>

              <div style={{ margin: "80px 0" }}>
                <p style={{ fontSize: "14px", color: "#94a3b8", fontWeight: "800", textTransform: "uppercase", marginBottom: "15px" }}>Submission Report</p>
                <h1 style={{ fontSize: "42px", fontWeight: "900", color: "#0f172a", lineHeight: "1.1", marginBottom: "20px" }}>{subToRender.assignment?.title}</h1>
                <div style={{ width: "80px", height: "4px", background: "#e11d48", margin: "0 auto" }} />
              </div>
            </div>

            <div style={{ background: "#f8fafc", padding: "40px", borderRadius: "20px", border: "1px solid #f1f5f9" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "30px" }}>
                <div>
                  <p style={{ fontSize: "10px", color: "#94a3b8", fontWeight: "900", textTransform: "uppercase", marginBottom: "5px" }}>Student Name</p>
                  <p style={{ fontSize: "16px", fontWeight: "800", color: "#1e293b" }}>{subToRender.student?.name}</p>
                </div>
                <div>
                  <p style={{ fontSize: "10px", color: "#94a3b8", fontWeight: "900", textTransform: "uppercase", marginBottom: "5px" }}>Course Name</p>
                  <p style={{ fontSize: "16px", fontWeight: "800", color: "#1e293b" }}>{subToRender.assignment?.course?.name || "N/A"}</p>
                </div>
                <div>
                  <p style={{ fontSize: "10px", color: "#94a3b8", fontWeight: "900", textTransform: "uppercase", marginBottom: "5px" }}>Subject</p>
                  <p style={{ fontSize: "16px", fontWeight: "800", color: "#1e293b" }}>{subToRender.assignment?.subject?.name}</p>
                </div>
                <div>
                  <p style={{ fontSize: "10px", color: "#94a3b8", fontWeight: "900", textTransform: "uppercase", marginBottom: "5px" }}>Subject Teacher</p>
                  <p style={{ fontSize: "16px", fontWeight: "800", color: "#1e293b" }}>
                    {subToRender.assignment?.subject?.teachers?.length > 0 
                      ? subToRender.assignment.subject.teachers.map((t: any) => t.name).join(", ") 
                      : subToRender.assignment?.teacher?.name || "AssignHub Educator"}
                  </p>
                </div>
                <div>
                  <p style={{ fontSize: "10px", color: "#94a3b8", fontWeight: "900", textTransform: "uppercase", marginBottom: "5px" }}>Submitted Date</p>
                  <p style={{ fontSize: "16px", fontWeight: "800", color: "#1e293b" }}>{new Date(subToRender.updatedAt).toLocaleDateString()}</p>
                </div>
                <div>
                  <p style={{ fontSize: "10px", color: "#94a3b8", fontWeight: "900", textTransform: "uppercase", marginBottom: "5px" }}>Submission Time</p>
                  <p style={{ fontSize: "16px", fontWeight: "800", color: "#1e293b" }}>{new Date(subToRender.updatedAt).toLocaleTimeString()}</p>
                </div>
              </div>
            </div>

            <div style={{ textAlign: "center", marginTop: "40px" }}>
              <p style={{ fontSize: "10px", color: "#94a3b8", fontWeight: "600" }}>© {new Date().getFullYear()} AssignHub Digital Education Platform. All Rights Reserved.</p>
            </div>
          </div>
        </div>

        {/* ————— PAGE 2: ANALYTICS & REPORT ————— */}
        <div id="pdf-analytics-page" style={{ width: "800px", height: "1120px", background: "#fff", padding: "80px 60px" }}>
          <h2 style={{ fontSize: "24px", fontWeight: "900", color: "#0f172a", borderBottom: "2px solid #f1f5f9", paddingBottom: "20px", marginBottom: "40px" }}>Submission Analytics</h2>

          <div style={{ display: "flex", gap: "60px", alignItems: "center", marginBottom: "60px" }}>
            <div style={{ flex: 1, textAlign: "center" }}>
              <div style={{ position: "relative", width: "200px", height: "200px", margin: "0 auto" }}>
                <svg viewBox="0 0 100 100" style={{ width: "200px", height: "200px" }}>
                  {/* Background circle */}
                  <circle cx="50" cy="50" r="40" fill="none" stroke={typedPercent === 100 ? "#22c55e" : "#ef4444"} strokeWidth="8" />

                  {/* Foreground progress */}
                  <circle
                    cx="50" cy="50" r="40"
                    fill="none"
                    stroke="#22c55e"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={`${(typedPercent / 100) * 251.32} 251.32`}
                    transform="rotate(-90 50 50)"
                  />
                </svg>
                <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", textAlign: "center" }}>
                  <p style={{ fontSize: "36px", fontWeight: "900", margin: "0", color: "#1e293b" }}>{typedPercent}%</p>
                  <p style={{ fontSize: "10px", color: "#64748b", fontWeight: "800", textTransform: "uppercase", letterSpacing: "1px", marginTop: "2px" }}>Originality</p>
                </div>
              </div>
            </div>

            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "20px" }}>
              <div style={{ background: "#f8fafc", padding: "20px", borderRadius: "20px", marginBottom: "20px" }}>
                <p style={{ fontSize: "10px", color: "#64748b", fontWeight: "900", textTransform: "uppercase" }}>Word Count</p>
                <p style={{ fontSize: "24px", fontWeight: "800", color: "#0f172a" }}>{subToRender.wordCount || 0}</p>
              </div>
              <div style={{ background: "#f8fafc", padding: "20px", borderRadius: "20px", marginBottom: "20px" }}>
                <p style={{ fontSize: "10px", color: "#64748b", fontWeight: "900", textTransform: "uppercase" }}>Typing Speed</p>
                <p style={{ fontSize: "24px", fontWeight: "800", color: "#0f172a" }}>{subToRender.wpm || 0} WPM</p>
              </div>
            </div>
          </div>

          <div style={{ background: "#f0fdf4", padding: "40px", borderRadius: "30px", border: "1px solid #dcfce7", textAlign: "center" }}>
            <p style={{ fontSize: "14px", fontWeight: "900", color: "#166534", textTransform: "uppercase", letterSpacing: "2px", marginBottom: "10px" }}>Final Assessment</p>
            <h3 style={{ fontSize: "64px", fontWeight: "900", color: "#166534", margin: "0" }}>{subToRender.marks} <span style={{ fontSize: "24px", color: "#166534", opacity: "0.6" }}>/ {subToRender.assignment?.totalMarks || 100}</span></h3>
            <div style={{ marginTop: "20px", display: "inline-flex", alignItems: "center", gap: "10px", padding: "8px 20px", background: "#166534", color: "#fff", borderRadius: "full", fontSize: "12px", fontWeight: "900", textTransform: "uppercase" }}>
              Verified Submission ✓
            </div>
          </div>
        </div>

        {/* ————— PAGE 3: CONTENT PAGE ————— */}
        <div id="pdf-content-page" style={{ width: "800px", minHeight: "1120px", background: "#fff", padding: "20px 60px 80px 60px" }}>
          <style>{`
              .rich-content ul, .rich-content ol { list-style: none !important; padding: 0 !important; margin: 0 0 1.5rem 1.5rem !important; }
              .rich-content li { padding-left: 1.2rem !important; text-indent: -1.2rem !important; margin-bottom: 0.5rem !important; line-height: 1.6 !important; display: block !important; }
              .rich-content li p { margin: 0 !important; display: inline !important; }
              .rich-content ul li::before { content: "•"; color: #334155 !important; font-weight: bold !important; display: inline-block !important; width: 1rem !important; margin-right: 0.2rem !important; text-align: right !important; }
              .rich-content ol { counter-reset: item !important; }
              .rich-content ol li::before { content: counter(item) "."; counter-increment: item !important; color: #334155 !important; font-weight: bold !important; display: inline-block !important; width: 1rem !important; margin-right: 0.2rem !important; text-align: right !important; }
              .rich-content .pasted-content { background-color: rgba(236, 72, 153, 0.08) !important; border-bottom: 1.5px dashed #ec4899 !important; padding: 2px 2px !important; margin: 0 !important; display: inline !important; box-decoration-break: clone !important; border-radius: 2px !important; }
           `}</style>
          <h2 style={{ fontSize: "20px", fontWeight: "900", color: "#0f172a", marginBottom: "40px", borderBottom: "1px solid #f1f5f9", paddingBottom: "10px" }}>Assignment Content</h2>
          <div className="rich-content" style={{ fontSize: "14px", lineHeight: "1.8", color: "#334155" }} dangerouslySetInnerHTML={{ __html: subToRender.content }} />

          <div style={{ marginTop: "100px", paddingTop: "40px", borderTop: "2px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
            <div>
              <p style={{ fontSize: "10px", fontWeight: "900", color: "#94a3b8", textTransform: "uppercase", marginBottom: "5px" }}>Graded By</p>
              <p style={{ fontSize: "18px", fontWeight: "800", color: "#1e293b" }}>{subToRender.reviewedBy?.name || subToRender.assignment?.teacher?.name || "AssignHub Educator"}</p>
              <p style={{ fontSize: "11px", color: "#64748b" }}>Academic Certification ID: {subToRender._id.substring(0, 8).toUpperCase()}</p>
            </div>
            <div style={{ textAlign: "right" }}>
              <p style={{ fontSize: "10px", fontWeight: "900", color: "#94a3b8", textTransform: "uppercase", marginBottom: "5px" }}>Final Grade</p>
              <p style={{ fontSize: "32px", fontWeight: "900", color: "#166534" }}>{subToRender.marks} / {subToRender.assignment?.totalMarks || 100}</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (selectedSubmission) {
    const sub = selectedSubmission;

    const { typed: typedPercent, pasted: pastedPercent } = getPercentages(sub);
    const radius = 24;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (typedPercent / 100) * circumference;

    return (
      <div className="max-w-7xl mx-auto -m-6 p-6 h-full flex flex-col xl:flex-row gap-6 bg-gray-50/30 dark:bg-gray-900/10 min-h-screen">
        {/* LEFT MAIN CONTENT */}
        <div className="flex-1 space-y-6">
          {/* Header Bar */}
          <div className="bg-white dark:bg-gray-900 p-4 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSelectedSubmission(null)}
                className="p-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-all text-gray-500"
              >
                <ArrowLeft size={20} />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold overflow-hidden">
                  <UserCircle size={32} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-800 dark:text-white leading-tight">{sub.student?.name}</h2>
                  <p className="text-xs text-gray-500 flex items-center gap-1 font-medium">
                    <Calendar size={12} /> Submitted {new Date(sub.updatedAt).toLocaleDateString()} &middot; {new Date(sub.updatedAt).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            </div>
            <span className="px-4 py-1.5 bg-blue-500/10 text-blue-500 rounded-full text-xs font-bold mr-2">
              {sub.status === 'reviewed' ? 'Reviewed' : 'In Review'}
            </span>
          </div>

          {/* Editor Area */}
          <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm p-8 min-h-[600px] relative">
            <div className="mt-8 max-w-3xl mx-auto">
              <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-6">{sub.assignment?.title}</h1>
              <div
                className="rich-content prose dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 leading-relaxed font-sans"
                dangerouslySetInnerHTML={{ __html: sub.content }}
              />
            </div>
          </div>
        </div>

        {/* RIGHT SIDEBAR */}
        <div className="w-full xl:w-80 space-y-6">
          {/* Analytics */}
          <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm">
            <h3 className="text-sm font-bold text-primary flex items-center gap-2 mb-6 uppercase tracking-widest">
              <BarChart3 size={16} /> Writing Analytics
            </h3>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-2xl text-center">
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Word Count</p>
                <p className="text-2xl font-bold text-primary">{sub.wordCount || 0}</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-2xl text-center">
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Typing Speed</p>
                <p className="text-2xl font-bold text-blue-500 flex items-baseline justify-center gap-1">
                  {sub.wpm || 0} <span className="text-xs text-blue-400">WPM</span>
                </p>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl flex items-center justify-between border border-gray-100 dark:border-gray-700">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Originality Score</p>
                <div className="flex items-center gap-2">
                  <p className="text-xl font-black text-gray-800 dark:text-white leading-none">{typedPercent}%</p>
                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mt-1">Originality</p>
                </div>
              </div>

              <div className="relative w-14 h-14 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 60 60">
                  <circle cx="30" cy="30" r={radius} stroke={typedPercent === 100 ? "#22c55e" : "#ef4444"} strokeWidth="6" fill="none" />
                  <circle
                    cx="30" cy="30" r={radius}
                    className="stroke-green-500"
                    strokeWidth="6" fill="none" strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                  />
                </svg>
                <span className="absolute text-[10px] font-bold text-gray-700 dark:text-gray-300">{typedPercent}%</span>
              </div>
            </div>
          </div>

          {/* Grading & Feedback */}
          <div className="bg-gray-100/50 dark:bg-gray-800/30 rounded-3xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
            <h3 className="text-sm font-bold text-pink-500 flex items-center gap-2 mb-6 uppercase tracking-widest">
              <CheckCircle2 size={16} /> Grading & Feedback
            </h3>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-2">Marks</label>
                <div className="relative">
                  <input
                    type="number"
                    value={grade}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      const max = sub.assignment?.totalMarks || 100;
                      if (val > max) {
                        setGrade(max.toString());
                        toast.error(`Maximum marks allowed: ${max}`);
                      } else {
                        setGrade(e.target.value);
                      }
                    }}
                    max={sub.assignment?.totalMarks || 100}
                    min="0"
                    placeholder="0"
                    className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl py-3 pl-4 pr-20 text-xl font-bold text-primary outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 transition-all"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">/ {sub.assignment?.totalMarks || 100}</span>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-2">Teacher Comments</label>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Type your encouraging feedback here..."
                  rows={4}
                  className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-4 text-sm font-medium outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 transition-all resize-none"
                />
              </div>

              <div className="pt-2 space-y-3">
                <button
                  onClick={() => submitReview.mutate(sub._id)}
                  disabled={submitReview.isPending || !grade}
                  className="w-full py-3.5 bg-[rgb(var(--primary))] text-white font-bold rounded-2xl shadow-lg shadow-[rgb(var(--primary))]/30 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <UploadCloud size={18} /> Publish Grade
                </button>
                <button
                  onClick={() => requestRevision.mutate(sub._id)}
                  disabled={requestRevision.isPending || !feedback}
                  className="w-full py-3.5 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold rounded-2xl shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-100 dark:border-gray-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <RefreshCcw size={18} /> Request Revision
                </button>
              </div>
            </div>
          </div>

          {/* Pro Tip */}
          {sub.status === "reviewed" && (
            <button
              onClick={() => generatePDF(sub)}
              disabled={isDownloading}
              className="w-full py-4 bg-emerald-600 text-white font-bold rounded-2xl shadow-lg shadow-emerald-600/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 mb-6"
            >
              {isDownloading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <><Download size={18} /> Download Graded PDF</>
              )}
            </button>
          )}

          <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
            <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-white/10 rounded-full blur-2xl" />
            <h4 className="text-[10px] font-bold uppercase tracking-widest mb-2 text-indigo-200">Pro Tip</h4>
            <p className="text-sm font-medium leading-relaxed">
              Encourage {sub.student?.name.split(' ')[0] || 'the student'} to explore advanced topics related to this assignment for their next module!
            </p>
          </div>
        </div>

        <PdfTemplates />
      </div>
    );
  }



  // --- LIST VIEW ---
  return (
    <div className="space-y-8 max-w-7xl mx-auto p-6">
      {/* Header & Stats */}
      <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center bg-white dark:bg-gray-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm">
        <div className="space-y-1">
          <h1 className="text-3xl font-extrabold text-gray-800 dark:text-white flex items-center gap-3">
            <CheckCircle2 className="text-green-500" size={32} />
            Submissions Review
          </h1>
          <p className="text-gray-500 font-medium">Evaluate and provide feedback on student work</p>
        </div>

        <div className="flex gap-4">
          <StatCard label="Total" value={stats.total} color="text-primary" bg="bg-primary/5" icon={<BarChart3 size={18} />} />
          <StatCard label="Pending" value={stats.pending} color="text-blue-500" bg="bg-blue-500/5" icon={<Clock size={18} />} />
          <StatCard label="Revision" value={stats.revision} color="text-amber-500" bg="bg-amber-500/5" icon={<RefreshCcw size={18} />} />
          <StatCard label="Reviewed" value={stats.reviewed} color="text-green-500" bg="bg-green-500/5" icon={<CheckCircle2 size={18} />} />
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={20} />
          <input
            type="text"
            placeholder="Search by student, assignment or subject..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-6 py-4 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm outline-none font-medium"
          />
        </div>
        <div className="flex gap-4">
          <select
            value={filterSubject}
            onChange={(e) => setFilterSubject(e.target.value)}
            className="px-6 py-4 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm font-bold text-gray-600 hover:bg-gray-50 transition-all outline-none min-w-[180px]"
          >
            <option value="all">All Subjects</option>
            {subjects.map((sub: any) => (
              <option key={sub.id} value={sub.id}>{sub.name}{sub.course ? ` (${sub.course})` : ""}</option>
            ))}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-6 py-4 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm font-bold text-gray-600 hover:bg-gray-50 transition-all outline-none min-w-[180px]"
          >
            <option value="all">All Status</option>
            <option value="submitted">Pending Review</option>
            <option value="reviewed">Reviewed</option>
            <option value="revision_requested">Revision Requested</option>
          </select>
        </div>
      </div>

      {/* Submissions List */}
      <div className="space-y-4">
        {filteredSubmissions.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-gray-900 rounded-[3rem] border border-dashed border-gray-200 dark:border-gray-800">
            <div className="w-20 h-20 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
              <FileText size={40} />
            </div>
            <h3 className="text-xl font-bold text-gray-700 dark:text-gray-300">No submissions found</h3>
            <p className="text-gray-400">Try adjusting your search or check back later</p>
          </div>
        ) : (
          filteredSubmissions.map((s: any) => (
            <motion.div
              layout
              key={s._id}
              onClick={() => setSelectedSubmission(s)}
              className="group cursor-pointer bg-white dark:bg-gray-900 p-6 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-xl hover:shadow-primary/5 hover:scale-[1.01] transition-all flex flex-col md:flex-row md:items-center gap-6"
            >
              <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all shrink-0">
                <FileText size={28} />
              </div>

              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-gray-800 dark:text-white truncate">{s.assignment?.title}</h3>
                  <span className={`px-2 py-0.5 rounded-lg text-[9px] font-extrabold uppercase tracking-widest ${s.status === 'reviewed' ? 'bg-green-500/10 text-green-500' :
                    s.status === 'revision_requested' ? 'bg-amber-500/10 text-amber-500' :
                      'bg-blue-500/10 text-blue-500'
                    }`}>
                    {s.status.replace("_", " ")}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-y-2 gap-x-4">
                  <div className="flex items-center gap-1.5 text-sm text-gray-500 font-medium">
                    <User size={14} className="text-primary" />
                    {s.student?.name}
                  </div>
                  <div className="flex items-center gap-1.5 text-sm text-gray-500 font-medium">
                    <GraduationCap size={14} className="text-secondary" />
                    {s.assignment?.subject?.name}{s.assignment?.course?.name ? ` · ${s.assignment.course.name}` : ""}
                  </div>
                  <div className="flex items-center gap-1.5 text-sm text-gray-500 font-medium">
                    <Calendar size={14} />
                    {new Date(s.updatedAt).toLocaleDateString()}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                {s.status === 'reviewed' && (
                  <div className="text-right mr-4">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Score</p>
                    <p className="text-xl font-black text-primary">{s.marks} <span className="text-sm text-gray-400 font-bold">/ {s.assignment?.totalMarks || 100}</span></p>
                  </div>
                )}
                
                {s.status === 'reviewed' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleListDownload(s);
                    }}
                    disabled={isDownloading && subForPdf?._id === s._id}
                    className="p-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-xl hover:bg-emerald-100 transition-all"
                    title="Download Report"
                  >
                    {isDownloading && subForPdf?._id === s._id ? (
                      <div className="w-5 h-5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Download size={20} />
                    )}
                  </button>
                )}

                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl group-hover:bg-primary group-hover:text-white transition-all">
                  <Eye size={20} />
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
      <PdfTemplates />
    </div>
  );
}

function StatCard({ label, value, color, bg, icon }: any) {
  return (
    <div className={`px-6 py-3 ${bg} rounded-2xl flex items-center gap-3 border border-white/10 shadow-sm`}>
      <div className={`${color}`}>{icon}</div>
      <div>
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{label}</p>
        <p className={`text-lg font-black ${color}`}>{value}</p>
      </div>
    </div>
  );
}
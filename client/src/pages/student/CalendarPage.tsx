import { useState } from "react";
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  isSameMonth, 
  isSameDay, 
  addDays, 
  parseISO 
} from "date-fns";
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Clock, 
  BookOpen,
  CheckCircle2,
  FileText,
  Plus
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getUpcomingAssignments } from "../../api/assignment.api";
import { useNavigate } from "react-router-dom";
import API from "../../api/axios";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { openPDF } from "../../utils/file";

interface Assignment {
  _id: string;
  title: string;
  deadline: string;
  pdfUrl?: string;
  subject: {
    name: string;
    code: string;
  };
}

export default function CalendarPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showSubmitModal, setShowSubmitModal] = useState<any>(null);

  const { data: assignments = [], isLoading } = useQuery({
    queryKey: ["upcoming-assignments"],
    queryFn: async () => {
      const res = await getUpcomingAssignments();
      return res.data as Assignment[];
    }
  });

  const { data: submissionsData } = useQuery({
    queryKey: ["my-submissions"],
    queryFn: () => API.get("/assignments/my-submissions"),
  });

  const mySubmissions = submissionsData?.data || [];

  const finalizeSubmission = useMutation({
    mutationFn: (subId: string) => {
      if (showSubmitModal?.deadline && new Date(showSubmitModal.deadline).getTime() < Date.now()) {
        throw new Error("Deadline has passed");
      }
      return API.put(`/assignments/submissions/${subId}`, { 
        status: "submitted",
        assignment: showSubmitModal?._id 
      });
    },
    onSuccess: () => {
      toast.success("Assignment submitted successfully!");
      qc.invalidateQueries({ queryKey: ["my-submissions"] });
      setShowSubmitModal(null);
    },
    onError: () => toast.error("Failed to submit assignment"),
  });

  const getDraftsForAssignment = (assignmentId: string) => {
    return mySubmissions.filter((s: any) => s.status === "draft");
  };

  const getSubmissionStatus = (assignmentId: string) => {
    const sub = mySubmissions.find((s: any) => s.assignment?._id === assignmentId || s.assignment === assignmentId);
    return sub?.status;
  };

  const renderHeader = () => {
    return (
      <div className="p-8 text-white rounded-3xl bg-gradient-to-r from-primary to-secondary shadow-lg shadow-primary/20 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl">
            <CalendarIcon className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Academic Calendar</h1>
            <p className="mt-1 opacity-90 font-medium">
              Track your deadlines and upcoming academic milestones
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4 bg-white/20 backdrop-blur-md p-2 rounded-2xl border border-white/30 self-end md:self-auto">
          <button 
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="p-2 hover:bg-white/20 rounded-xl transition-all"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <span className="text-lg font-bold min-w-[150px] text-center uppercase tracking-widest">
            {format(currentMonth, "MMMM yyyy")}
          </span>
          <button 
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="p-2 hover:bg-white/20 rounded-xl transition-all"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      </div>
    );
  };

  const renderDays = () => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    return (
      <div className="grid grid-cols-7 mb-4">
        {days.map((day, index) => (
          <div key={index} className="text-center font-bold text-gray-400 text-xs uppercase tracking-widest py-2">
            {day}
          </div>
        ))}
      </div>
    );
  };

  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const rows = [];
    let days = [];
    let day = startDate;
    let formattedDate = "";

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        formattedDate = format(day, "d");
        const cloneDay = day;
        
        const dayAssignments = assignments.filter(asg => 
          isSameDay(parseISO(asg.deadline), cloneDay)
        );

        days.push(
          <div
            key={day.toString()}
            className={`min-h-[140px] p-3 border border-gray-50 dark:border-gray-800 transition-all relative group
              ${!isSameMonth(day, monthStart) ? "bg-gray-50/30 dark:bg-gray-900/10 opacity-30" : "bg-white dark:bg-gray-900 hover:bg-gray-50/50 dark:hover:bg-gray-800/50"}
              ${isSameDay(day, selectedDate) ? "ring-2 ring-primary ring-inset shadow-lg z-10" : ""}
            `}
            onClick={() => setSelectedDate(cloneDay)}
          >
            <span className={`text-sm font-bold ${isSameDay(day, new Date()) ? "bg-primary text-white w-8 h-8 flex items-center justify-center rounded-full" : "text-gray-400 group-hover:text-primary transition-colors"}`}>
              {formattedDate}
            </span>
            
            <div className="mt-2 space-y-1.5 overflow-y-auto max-h-[90px] scrollbar-hide">
              {dayAssignments.map((asg) => {
                const status = getSubmissionStatus(asg._id);
                return (
                  <div 
                    key={asg._id}
                    className={`p-2 rounded-xl text-[10px] font-bold border flex flex-col gap-0.5 shadow-sm hover:scale-[1.02] transition-transform
                      ${(asg.deadline && new Date(asg.deadline).getTime() < Date.now() && status !== "submitted" && status !== "reviewed") ? 'bg-gray-100 border-gray-200 text-gray-500 opacity-60' :
                        status === 'reviewed' ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 
                        status === 'submitted' ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 
                        status === 'revision_requested' ? 'bg-cyan-50 border-cyan-200 text-cyan-600' :
                        status === 'draft' ? 'bg-amber-50 border-amber-200 text-amber-600' :
                        'bg-rose-50 border-rose-200 text-rose-600'}
                    `}
                  >
                    <div className="flex items-center gap-1 opacity-70 uppercase tracking-tighter">
                      <BookOpen size={10} />
                      {asg.subject.code}
                    </div>
                    <div className="line-clamp-1 leading-tight">{asg.title}</div>
                  </div>
                );
              })}
            </div>

            {dayAssignments.length > 0 && (
              <div className="absolute top-3 right-3 w-2 h-2 bg-primary rounded-full animate-pulse shadow-[0_0_8px_rgb(var(--primary))]" />
            )}
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div className="grid grid-cols-7" key={day.toString()}>
          {days}
        </div>
      );
      days = [];
    }
    return <div className="rounded-3xl overflow-hidden shadow-xl border border-gray-100 dark:border-gray-800">{rows}</div>;
  };

  const renderSelectedDayDetails = () => {
    const dayAssignments = assignments.filter(asg => 
      isSameDay(parseISO(asg.deadline), selectedDate)
    );

    return (
      <div className="mt-8 bg-white dark:bg-gray-900 rounded-[2.5rem] p-8 shadow-xl border border-gray-100 dark:border-gray-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
              {format(selectedDate, "EEEE, MMMM do")}
            </h2>
            <p className="text-gray-500 font-medium">Schedule for this date</p>
          </div>
          <div className="px-6 py-2 bg-gray-50 dark:bg-gray-800 rounded-full border border-gray-100 dark:border-gray-700 font-bold text-primary flex items-center gap-2 self-start md:self-auto">
            <Clock size={18} />
            {dayAssignments.length} {dayAssignments.length === 1 ? "Assignment" : "Assignments"}
          </div>
        </div>

        {dayAssignments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {dayAssignments.map((asg) => {
              const status = getSubmissionStatus(asg._id);
              const statusColors = {
                reviewed: { bg: "bg-indigo-50", border: "border-indigo-100", text: "text-indigo-600", stripe: "bg-indigo-500" },
                submitted: { bg: "bg-emerald-50", border: "border-emerald-100", text: "text-emerald-600", stripe: "bg-emerald-500" },
                revision_requested: { bg: "bg-cyan-50", border: "border-cyan-100", text: "text-cyan-600", stripe: "bg-cyan-500" },
                draft: { bg: "bg-amber-50", border: "border-amber-100", text: "text-amber-600", stripe: "bg-amber-500" },
                pending: { bg: "bg-rose-50", border: "border-rose-100", text: "text-rose-600", stripe: "bg-rose-500" }
              };
              const s = statusColors[status as keyof typeof statusColors] || statusColors.pending;

              return (
                <div 
                  key={asg._id}
                  className="group relative p-6 bg-white dark:bg-gray-900 rounded-[2rem] border border-gray-100 dark:border-gray-800 hover:shadow-2xl hover:shadow-[rgb(var(--primary))]/10 transition-all overflow-hidden"
                >
                  {/* Status Stripe */}
                  <div className={`absolute top-0 left-0 bottom-0 w-1.5 ${s.stripe} opacity-80`} />
                  
                  <div className="flex justify-between items-start mb-6">
                    <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-2xl group-hover:bg-[rgb(var(--primary))]/10 transition-colors">
                      <BookOpen className="w-5 h-5 text-gray-400 group-hover:text-[rgb(var(--primary))] transition-colors" />
                    </div>
                    <div className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border shadow-sm ${
                      (asg.deadline && new Date(asg.deadline).getTime() < Date.now() && status !== "submitted" && status !== "reviewed")
                        ? "bg-gray-100 text-gray-500 border-gray-200"
                        : `${s.bg} ${s.border} ${s.text}`
                    }`}>
                      {(asg.deadline && new Date(asg.deadline).getTime() < Date.now() && status !== "submitted" && status !== "reviewed") 
                        ? "Expired" 
                        : status === 'reviewed' ? 'Reviewed' : status === 'submitted' ? 'Submitted' : status === 'revision_requested' ? 'Revision Req' : status === 'draft' ? 'Draft' : 'Not Started'}
                    </div>
                  </div>

                  <div className="mb-6">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-1 group-hover:text-[rgb(var(--primary))] transition-colors leading-tight">
                      {asg.title}
                    </h3>
                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">
                      {asg.subject.name}{(asg.subject as any).course?.name ? ` (${(asg.subject as any).course.name})` : ""}
                    </p>
                  </div>

                  <div className="flex items-center justify-between p-3.5 bg-gray-50 dark:bg-gray-800/50 rounded-2xl mb-6 border border-gray-100/50 dark:border-gray-700/50">
                    <div className="flex items-center gap-2">
                       <div className="w-6 h-6 bg-white dark:bg-gray-900 rounded-lg flex items-center justify-center shadow-sm">
                        <Clock size={12} className="text-[rgb(var(--primary))]" />
                       </div>
                       <div className="flex flex-col">
                        <span className="text-[8px] font-black text-gray-400 uppercase leading-none mb-0.5">Deadline</span>
                        <span className="text-[11px] font-bold text-gray-700 dark:text-gray-300 leading-none">{format(parseISO(asg.deadline), "h:mm a")}</span>
                       </div>
                    </div>
                    <span className="px-2 py-1 bg-white dark:bg-gray-900 rounded-lg text-[9px] font-black text-gray-400 uppercase tracking-widest border border-gray-100 dark:border-gray-800 shadow-sm">
                      {asg.subject.code}
                    </span>
                  </div>

                  <div className="flex flex-col gap-2.5">
                      <button 
                        onClick={() => {
                          if (asg.deadline && new Date(asg.deadline).getTime() < Date.now()) {
                            return toast.error("Deadline has passed!");
                          }
                          setShowSubmitModal(asg);
                        }}
                        disabled={status === "submitted" || status === "reviewed" || (asg.deadline && new Date(asg.deadline).getTime() < Date.now())}
                        className={`w-full py-3.5 text-white font-black rounded-2xl transition-all shadow-lg uppercase text-[10px] tracking-widest disabled:opacity-40 disabled:grayscale disabled:shadow-none ${
                          (asg.deadline && new Date(asg.deadline).getTime() < Date.now() && status !== "submitted" && status !== "reviewed")
                            ? "bg-gray-400 shadow-gray-400/20"
                            : "bg-[rgb(var(--primary))] shadow-[rgb(var(--primary))]/20 hover:opacity-90"
                        }`}
                      >
                        {(asg.deadline && new Date(asg.deadline).getTime() < Date.now() && status !== "submitted" && status !== "reviewed") 
                          ? "Deadline Passed" 
                          : status === "reviewed" ? "Review Complete" : status === "submitted" ? "Already Submitted" : status === "revision_requested" ? "Resubmit Work" : "Submit"}
                      </button>
                      {status !== "submitted" && status !== "reviewed" && (
                        <button 
                          onClick={() => {
                            const sub = mySubmissions.find((s: any) => s.assignment?._id === asg._id || s.assignment === asg._id);
                            navigate("/student/notepad", { state: { assignment: sub || asg, assignmentData: asg } });
                          }}
                          className="w-full py-3.5 bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 font-black rounded-2xl border border-gray-100 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all text-[10px] uppercase tracking-widest"
                        >
                          {status === "draft" ? "Continue Drafting" : status === "revision_requested" ? "Edit Revision" : "Start Writing"}
                        </button>
                      )}
                      {asg.pdfUrl && (
                        <button 
                          onClick={() => openPDF(asg.pdfUrl!)}
                          className="w-full py-3.5 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 font-black rounded-2xl border border-orange-100 dark:border-orange-800 hover:bg-orange-100 dark:hover:bg-orange-900/40 transition-all text-[10px] uppercase tracking-widest flex items-center justify-center gap-2"
                        >
                          <FileText size={16} /> View Assignment PDF
                        </button>
                      )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/30 rounded-3xl border border-dashed border-gray-200 dark:border-gray-700">
            <div className="p-4 bg-white dark:bg-gray-900 rounded-2xl w-fit mx-auto mb-4 shadow-sm">
              <CalendarIcon className="w-8 h-8 text-gray-300" />
            </div>
            <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">No assignments due on this day</p>
          </div>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 font-bold animate-pulse">Loading Schedule...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-theme min-h-screen -m-6 p-8 relative">
      {renderHeader()}
      {renderDays()}
      {renderCells()}
      {renderSelectedDayDetails()}

      {/* SUBMIT DRAFT MODAL (Reusing MyCourse Logic) */}
      <AnimatePresence>
        {showSubmitModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowSubmitModal(null)} className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative bg-white dark:bg-gray-900 rounded-[2.5rem] p-8 max-w-lg w-full shadow-2xl border border-gray-100 dark:border-gray-800">
              <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Submit Assignment</h3>
              <p className="text-gray-500 mb-8 text-sm font-medium">Select which draft you would like to submit for <span className="font-bold text-primary">{showSubmitModal.title}</span>.</p>
              
              <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2 scrollbar-hide">
                {getDraftsForAssignment(showSubmitModal._id).length === 0 ? (
                  <div className="text-center py-10 bg-gray-50 dark:bg-gray-800/50 rounded-3xl border border-dashed border-gray-200 dark:border-gray-700">
                    <p className="text-gray-400 font-medium">No drafts found. Open the editor to create one!</p>
                  </div>
                ) : (
                  getDraftsForAssignment(showSubmitModal._id).map((sub: any) => (
                    <div key={sub._id} className="group bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-all relative">
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                          <FileText size={20} />
                        </div>
                        <span className="px-3 py-1 bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400 rounded-full text-[9px] font-black uppercase tracking-widest">
                          Draft
                        </span>
                      </div>
                      
                      <p className="font-bold text-gray-800 dark:text-white mb-1 truncate">{sub.title || "Untitled Draft"}</p>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-6 flex items-center gap-1">
                        <Clock size={10} /> Saved {new Date(sub.updatedAt).toLocaleTimeString()}
                      </p>
                      
                      <button 
                        onClick={() => finalizeSubmission.mutate(sub._id)}
                        disabled={finalizeSubmission.isPending}
                        className="w-full py-3 bg-primary text-white font-bold rounded-2xl text-xs hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
                      >
                        {finalizeSubmission.isPending && finalizeSubmission.variables === sub._id ? (
                           <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <>Submit This Draft <CheckCircle2 size={16} /></>
                        )}
                      </button>
                    </div>
                  ))
                )}
              </div>
              
              <div className="mt-8 flex gap-4">
                <button onClick={() => setShowSubmitModal(null)} className="flex-1 py-4 bg-gray-50 dark:bg-gray-800 text-gray-500 font-bold rounded-2xl hover:bg-gray-100 transition-all">Cancel</button>
                <button onClick={() => { navigate("/student/notepad", { state: { assignment: showSubmitModal, assignmentData: showSubmitModal } }); setShowSubmitModal(null); }} className="flex-1 py-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold rounded-2xl hover:opacity-90 transition-all flex items-center justify-center gap-2">
                  New Draft <Plus size={18} />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
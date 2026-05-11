import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import API from "../../api/axios";
import { BookOpen, GraduationCap, ArrowRight, UserPlus, FileText, Clock, CheckCircle2, Plus, MessageSquareWarning } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

import { format } from "date-fns";
import { openPDF } from "../../utils/file";


export default function MyCourse() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const [showSuccess, setShowSuccess] = useState<any>(null);
  const [viewOnlyAvailable, setViewOnlyAvailable] = useState(false);
  const [requestedIds, setRequestedIds] = useState<string[]>([]);



  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [selectedSubject, setSelectedSubject] = useState<any>(null);
  const [showSubmitModal, setShowSubmitModal] = useState<any>(null);


  /* ================= FETCH DATA ================= */
  const { data: coursesData } = useQuery({
    queryKey: ["courses"],
    queryFn: () => API.get("/courses"),
  });

  const { data: submissionsData } = useQuery({
    queryKey: ["my-submissions"],
    queryFn: () => API.get("/assignments/my-submissions"),
  });

  const { data: settingsData } = useQuery({
    queryKey: ["settings"],
    queryFn: () => API.get("/settings"),
  });

  const isAutoAccept = settingsData?.data?.data?.autoAcceptEnrollment ?? false;


  const courses = coursesData?.data || [];
  const mySubmissions = submissionsData?.data || [];

  /* ================= ENROLL ================= */
  const enrollMutation = useMutation({
    mutationFn: (courseId: string) => API.patch(`/courses/${courseId}/enroll`),
    onMutate: (courseId: string) => {
      if (!isAutoAccept) {
        setRequestedIds(prev => [...prev, courseId]);
      }
    },
    onSuccess: (res: any) => {

      setShowSuccess({
        message: res.data.message,
        autoAccepted: isAutoAccept
      });
      qc.invalidateQueries({ queryKey: ["courses"] });
      // Don't auto-close if it's a pending request, let them read it
      if (isAutoAccept) {
        setTimeout(() => setShowSuccess(null), 3000);
      }
    },
    onError: () => toast.error("Enrollment failed. Please try again."),
  });


  /* ================= SUBMIT ================= */
  const finalizeSubmission = useMutation({
    mutationFn: (subId: string) => {
      if (showSubmitModal?.deadline && new Date(showSubmitModal.deadline).getTime() < Date.now()) {
        throw new Error("Deadline has passed");
      }
      return API.put(`/assignments/submissions/${subId}`, {
        status: "submitted",
        assignment: showSubmitModal?._id // Ensure it gets linked!
      });
    },
    onSuccess: () => {
      toast.success("Assignment submitted successfully!");
      qc.invalidateQueries({ queryKey: ["my-submissions"] });
      setShowSubmitModal(null);
    },
    onError: () => toast.error("Failed to submit assignment"),
  });

  /* ================= FILTERING ================= */
  const enrolledCourses = courses.filter((c: any) =>
    c.students?.some((s: any) => s._id === user._id)
  );

  const availableCourses = courses.filter(
    (c: any) => 
      !c.students?.some((s: any) => s._id === user._id) &&
      !c.pendingStudents?.some((s: any) => s._id === user._id) &&
      !requestedIds.includes(c._id)
  );



  const pendingCourses = courses.filter(
    (c: any) => c.pendingStudents?.some((s: any) => s._id === user._id)
  );

  /* ================= HELPERS ================= */
  const getSubmission = (assignmentId: string) => {
    const subs = mySubmissions.filter((s: any) => s.assignment?._id === assignmentId || s.assignment === assignmentId);
    if (subs.length === 0) return null;
    const reviewed = subs.find((s: any) => s.status === "reviewed");
    if (reviewed) return reviewed;
    const submitted = subs.find((s: any) => s.status === "submitted");
    if (submitted) return submitted;
    return subs[0];
  };

  const getDraftsForAssignment = (_assignmentId: string) => {
    // Return all drafts so the student can select any draft they've written
    return mySubmissions.filter((s: any) => s.status === "draft");
  };

  /* ================= UI ================= */
  return (
    <div className="bg-theme min-h-screen -m-6 p-8">
      {/* Header Banner */}
      <div className="p-8 text-white rounded-3xl bg-gradient-to-r from-primary to-secondary shadow-lg shadow-primary/20 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl cursor-pointer" onClick={() => { setSelectedCourse(null); setSelectedSubject(null); }}>
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">
              {selectedSubject ? selectedSubject.name : selectedCourse ? selectedCourse.name : "My Academic Journey"}
            </h1>
            <p className="mt-1 opacity-90 font-medium">
              {selectedSubject ? "Assignment Management" : selectedCourse ? "Explore Subjects" : "Manage your enrollments and track your subjects"}
            </p>
          </div>
        </div>

        {!selectedCourse && (
          <div className="flex items-center gap-3 bg-white/20 backdrop-blur-md px-6 py-2 rounded-2xl border border-white/30">
            <span className="text-lg font-bold">{enrolledCourses.length}</span>
            <span className="text-sm opacity-80 uppercase tracking-widest font-bold">Enrolled Courses</span>
          </div>
        )}

        {(selectedCourse || selectedSubject) && (
          <button
            onClick={() => selectedSubject ? setSelectedSubject(null) : setSelectedCourse(null)}
            className="px-6 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-2xl border border-white/30 font-bold transition-all flex items-center gap-2"
          >
            <ArrowRight size={18} className="rotate-180" /> Back
          </button>
        )}
      </div>

      <div className="space-y-12">
        {/* ================= VIEW: ASSIGNMENTS (IF SUBJECT SELECTED) ================= */}
        <AnimatePresence mode="wait">
          {selectedSubject ? (
            <motion.div
              key="assignments"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {selectedSubject.assignments?.filter((a: any) => a.publish).length === 0 ? (
                  <div className="col-span-full p-12 bg-white dark:bg-gray-900 rounded-[2.5rem] text-center border border-dashed border-gray-200">
                    <p className="text-gray-400 font-medium">No active assignments for this subject yet.</p>
                  </div>
                ) : (
                  selectedSubject.assignments?.filter((a: any) => a.publish).map((a: any) => {
                    const submission = getSubmission(a._id);
                    const status = submission ? submission.status : null;

                    return (
                      <div key={a._id} className="bg-white dark:bg-gray-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm relative overflow-hidden group flex flex-col">
                        <div className="flex items-start justify-between mb-6">
                          <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                            <FileText size={24} />
                          </div>
                          {new Date(a.deadline).getTime() < Date.now() && status !== "submitted" && status !== "reviewed" ? (
                            <span className="px-4 py-1 bg-gray-100 text-gray-500 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1 border border-gray-200">
                              <Clock size={12} /> Expired
                            </span>
                          ) : status === "reviewed" ? (
                            <span className="px-4 py-1 bg-blue-500/10 text-blue-500 rounded-full text-[10px] font-extrabold uppercase tracking-widest flex items-center gap-1">
                              <CheckCircle2 size={12} /> Reviewed
                            </span>
                          ) : status === "submitted" ? (
                            <span className="px-4 py-1 bg-green-500/10 text-green-500 rounded-full text-[10px] font-extrabold uppercase tracking-widest flex items-center gap-1">
                              <CheckCircle2 size={12} /> Submitted
                            </span>
                          ) : status === "revision_requested" ? (
                            <span className="px-4 py-1 bg-violet-500/10 text-violet-500 rounded-full text-[10px] font-extrabold uppercase tracking-widest flex items-center gap-1">
                              <MessageSquareWarning size={12} /> Revision Requested
                            </span>
                          ) : status === "draft" ? (
                            <span className="px-4 py-1 bg-pink-500/10 text-pink-500 rounded-full text-[10px] font-extrabold uppercase tracking-widest flex items-center gap-1">
                              <FileText size={12} /> Draft Available
                            </span>
                          ) : (
                            <span className="px-4 py-1 bg-amber-500/10 text-amber-500 rounded-full text-[10px] font-extrabold uppercase tracking-widest flex items-center gap-1">
                              <Clock size={12} /> Pending
                            </span>
                          )}
                        </div>

                        <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">{a.title}</h3>
                        <p className="text-sm text-gray-500 mb-6 line-clamp-2">{a.description}</p>

                        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl mb-8 mt-auto">
                          <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Deadline</p>
                            <p className="text-sm font-bold text-gray-700 dark:text-gray-200">{format(new Date(a.deadline), "MMM dd, yyyy 'at' hh:mm a")}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Marks</p>
                            <p className="text-sm font-bold text-primary">{a.totalMarks} pts</p>
                          </div>
                        </div>

                        {status === "reviewed" && submission && (
                          <div className="mb-8 p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-2xl">
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">Your Score</span>
                              <span className="text-lg font-black text-blue-600 dark:text-blue-400">{submission.marks} <span className="text-sm font-bold opacity-70">/ {a.totalMarks}</span></span>
                            </div>
                            <div className="w-full h-1.5 bg-blue-100 dark:bg-blue-900/50 rounded-full overflow-hidden mb-4">
                              <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(submission.marks / a.totalMarks) * 100}%` }} />
                            </div>
                            {submission.feedback && (
                              <div className="bg-white/60 dark:bg-gray-900/50 p-3 rounded-xl border border-blue-50 dark:border-blue-900/20">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Teacher Comments</p>
                                <p className="text-sm text-gray-700 dark:text-gray-300 font-medium italic">"{submission.feedback}"</p>
                              </div>
                            )}
                          </div>
                        )}

                        <div className="flex gap-4">
                          {a.pdfUrl && (
                            <button
                              onClick={() => openPDF(a.pdfUrl)}
                              className="flex-[0.5] py-4 bg-gray-100 dark:bg-gray-800 text-[rgb(var(--primary))] font-bold rounded-2xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-all flex items-center justify-center gap-2"
                              title="View Assignment PDF"
                            >
                              <FileText size={18} /> PDF
                            </button>
                          )}
                          <div className="flex flex-col gap-2.5 mt-auto">
                            <button
                              onClick={() => {
                                if (a.deadline && new Date(a.deadline).getTime() < Date.now()) {
                                  return toast.error("Deadline has passed!");
                                }
                                setShowSubmitModal(a);
                              }}
                              disabled={status === "submitted" || status === "reviewed" || (a.deadline && new Date(a.deadline).getTime() < Date.now())}
                              className={`w-full py-3.5 text-white font-black rounded-2xl transition-all shadow-lg uppercase text-[10px] tracking-widest disabled:opacity-40 disabled:grayscale disabled:shadow-none ${(a.deadline && new Date(a.deadline).getTime() < Date.now() && status !== "submitted" && status !== "reviewed")
                                  ? "bg-gray-400 shadow-gray-400/20"
                                  : "bg-[rgb(var(--primary))] shadow-[rgb(var(--primary))]/20 hover:opacity-90"
                                }`}
                            >
                              {(a.deadline && new Date(a.deadline).getTime() < Date.now() && status !== "submitted" && status !== "reviewed")
                                ? "Deadline Passed"
                                : status === "reviewed" ? "Review Complete" : status === "submitted" ? "Already Submitted" : status === "revision_requested" ? "Resubmit Work" : "Submit"}
                            </button>
                            {status !== "submitted" && status !== "reviewed" && (
                              <button
                                onClick={() => {
                                  const sub = mySubmissions.find((s: any) => s.assignment?._id === a._id || s.assignment === a._id);
                                  navigate("/student/notepad", { state: { assignment: sub || a, assignmentData: a } });
                                }}
                                className="p-12 w-full py-3.5 bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 font-black rounded-2xl border border-gray-100 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all text-[10px] uppercase tracking-widest flex items-center justify-center gap-2"
                              >
                                <BookOpen size={14} />
                                {status === "draft" ? "Continue Drafting" : status === "revision_requested" ? "Edit Revision" : "Start Writing"}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </motion.div>
          ) : selectedCourse ? (
            /* ================= VIEW: SUBJECTS (IF COURSE SELECTED) ================= */
            <motion.div
              key="subjects"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {selectedCourse.subjects?.length === 0 ? (
                  <div className="col-span-full p-12 bg-white dark:bg-gray-900 rounded-[2.5rem] text-center border border-dashed border-gray-200">
                    <p className="text-gray-400 font-medium">No subjects found in this course.</p>
                  </div>
                ) : (
                  selectedCourse.subjects?.map((s: any) => (
                    <div
                      key={s._id}
                      onClick={() => setSelectedSubject(s)}
                      className="group cursor-pointer bg-white dark:bg-gray-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-xl hover:shadow-primary/5 transition-all relative overflow-hidden"
                    >
                      <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-6 group-hover:bg-primary group-hover:text-white transition-all">
                        <BookOpen size={28} />
                      </div>
                      <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">{s.name}</h3>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6">{s.code || "SUB-001"}</p>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-bold">
                            {s.teachers?.[0]?.name?.substring(0, 1) || "T"}
                          </div>
                          <span className="text-xs text-gray-500 font-medium">
                            {s.teachers && s.teachers.length > 0
                              ? s.teachers.map((t: any) => t.name).join(", ")
                              : "No Instructor"}
                          </span>
                        </div>
                        <ArrowRight size={20} className="text-primary opacity-0 group-hover:opacity-100 -translate-x-4 group-hover:translate-x-0 transition-all" />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          ) : (
            /* ================= VIEW: COURSES (DEFAULT) ================= */
            <motion.div
              key="courses"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-12"
            >
              {/* Enrolled Grid */}
              {!viewOnlyAvailable && (
                <div className="space-y-6">
                  <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                    <BookOpen className="text-primary" size={24} /> My Active Courses
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {enrolledCourses.length === 0 ? (
                      <div className="col-span-full p-12 bg-white dark:bg-gray-900 rounded-[2.5rem] text-center border border-dashed border-gray-200">
                        <p className="text-gray-400 font-medium">You haven\'t enrolled in any courses yet.</p>
                      </div>
                    ) : (
                      enrolledCourses.map((course: any) => (
                        <div key={course._id} className="bg-white dark:bg-gray-900 rounded-[2.5rem] p-8 border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-lg transition-all flex flex-col h-full">
                          <div className="flex-1 mb-8">
                            <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">{course.name}</h3>
                            <p className="text-gray-500 font-medium line-clamp-2">{course.description}</p>
                          </div>
                          <button
                            onClick={() => setSelectedCourse(course)}
                            className="w-full py-4 bg-primary text-white font-bold rounded-2xl shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
                          >
                            View Subjects <ArrowRight size={18} />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Available Row */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                    <UserPlus className="text-secondary" size={24} /> {viewOnlyAvailable ? "All Available Courses" : "Discover New Subjects"}
                  </h2>
                  {viewOnlyAvailable && (
                    <button
                      onClick={() => setViewOnlyAvailable(false)}
                      className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-primary transition-all px-6 py-3 bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 hover:scale-[1.02]"
                    >
                      <ArrowRight size={18} className="rotate-180" /> Back to My Journey
                    </button>
                  )}
                </div>
                <div className={viewOnlyAvailable ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "flex overflow-x-auto pb-6 gap-6 snap-x scrollbar-hide"}>
                  {/* ... (Pending and Available Cards stay same logic but maybe updated visuals) */}
                  {!viewOnlyAvailable && pendingCourses.map((c: any) => (
                    <div key={c._id} className="min-w-[320px] snap-start p-8 bg-amber-50/50 dark:bg-amber-900/10 rounded-[2.5rem] border border-amber-100 dark:border-amber-900/30 relative">
                      <div className="w-12 h-12 bg-white dark:bg-gray-900 rounded-2xl flex items-center justify-center text-amber-500 mb-6">
                        <Clock size={24} className="animate-pulse" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">{c.name}</h3>
                      <button disabled className="w-full py-4 bg-amber-100 dark:bg-amber-900/30 text-amber-600 font-bold rounded-2xl text-[10px] uppercase tracking-widest">Requested</button>

                    </div>
                  ))}

                  {(viewOnlyAvailable ? availableCourses : availableCourses.slice(0, 2)).map((c: any) => (
                    <div key={c._id} className={`${viewOnlyAvailable ? "" : "min-w-[320px] snap-start"} p-8 bg-white dark:bg-gray-900 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm transition-all group`}>
                      <div className="w-12 h-12 bg-secondary/10 rounded-2xl flex items-center justify-center text-secondary mb-6"><GraduationCap size={24} /></div>
                      <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">{c.name}</h3>
                      <button 
                        onClick={() => enrollMutation.mutate(c._id)} 
                        disabled={enrollMutation.isPending && enrollMutation.variables === c._id}
                        className="w-full py-4 bg-gradient-to-r from-secondary to-pink-500 text-white font-bold rounded-2xl shadow-lg hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                      >
                        {enrollMutation.isPending && enrollMutation.variables === c._id ? "Processing..." : "Enroll Now"}
                      </button>
                    </div>
                  ))}

                  {!viewOnlyAvailable && availableCourses.length > 2 && (
                    <button
                      onClick={() => setViewOnlyAvailable(true)}
                      className="min-w-[280px] snap-start p-10 bg-gradient-to-br from-primary via-primary/90 to-secondary rounded-[2.5rem] flex flex-col items-center justify-center gap-6 group relative overflow-hidden shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                    >
                      {/* Decorative background elements */}
                      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl group-hover:scale-150 transition-all duration-700" />
                      <div className="absolute bottom-0 left-0 w-24 h-24 bg-secondary/20 rounded-full -ml-12 -mb-12 blur-xl group-hover:scale-150 transition-all duration-700" />

                      <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-[2rem] flex items-center justify-center text-white border border-white/30 shadow-inner group-hover:rotate-12 transition-all duration-500">
                        <ArrowRight size={32} className="group-hover:translate-x-1 transition-transform" />
                      </div>

                      <div className="text-center">
                        <span className="block font-black text-white text-xl tracking-tight mb-1">Discover More</span>
                        <span className="block text-white/70 text-xs font-bold uppercase tracking-[0.2em]">Explore Catalog</span>
                      </div>
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* SUBMIT DRAFT MODAL */}
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
                <button onClick={() => { navigate("/student/notepad", { state: { assignment: showSubmitModal } }); setShowSubmitModal(null); }} className="flex-1 py-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold rounded-2xl hover:opacity-90 transition-all flex items-center justify-center gap-2">
                  New Draft <Plus size={18} />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Success Modal (Enrolled) */}
      <AnimatePresence>
        {showSuccess && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative bg-white dark:bg-gray-900 rounded-[2.5rem] p-10 max-w-sm w-full shadow-2xl text-center">
              <div className={`w-20 h-20 ${showSuccess.autoAccepted ? "bg-green-50 dark:bg-green-900/20" : "bg-amber-50 dark:bg-amber-900/20"} rounded-full flex items-center justify-center mx-auto mb-6`}>
                {showSuccess.autoAccepted ? (
                  <CheckCircle2 className="w-10 h-10 text-green-500" />
                ) : (
                  <Clock className="w-10 h-10 text-amber-500" />
                )}
              </div>
              <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
                {showSuccess.autoAccepted ? "Enrolled Successfully!" : "Request Received"}
              </h3>
              <p className="text-gray-500 font-medium">
                {showSuccess.message || (showSuccess.autoAccepted
                  ? "You have been automatically enrolled. You can now access all subjects."
                  : "Your request has been sent to the administration for review.")}
              </p>
              <button onClick={() => setShowSuccess(null)} className="mt-8 w-full py-4 bg-gray-900 dark:bg-white dark:text-gray-900 text-white font-bold rounded-2xl transition-transform active:scale-95">
                {showSuccess.autoAccepted ? "Start Learning" : "Got it!"}
              </button>
            </motion.div>

          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import API from "../../api/axios";
import { UserCheck, X, Check, Clock, BookOpen, ShieldCheck, Inbox, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

import { getFileUrl } from "../../utils/file";

export default function Enrollments() {
  const qc = useQueryClient();


  const { data: requestData, isLoading } = useQuery({
    queryKey: ["pending-enrollments"],
    queryFn: () => API.get("/courses/enrollment-requests/pending"),
  });

  // Fetch Settings
  const { data: settingsData } = useQuery({
    queryKey: ["settings"],
    queryFn: () => API.get("/settings"),
  });

  const isAutoAccept = settingsData?.data?.data?.autoAcceptEnrollment ?? false;


  const requests = requestData?.data || [];

  const handleAction = useMutation({
    mutationFn: ({ courseId, studentId, action }: any) =>
      API.patch(`/courses/${courseId}/enrollment/${studentId}`, { action }),
    onSuccess: (res: any) => {
      toast.success(res.data.message);
      qc.invalidateQueries({ queryKey: ["pending-enrollments"] });
      qc.invalidateQueries({ queryKey: ["courses"] });
    },
    onError: () => toast.error("Action failed"),
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Loading Requests...</p>
      </div>
    );
  }

  const totalPending = requests.reduce((acc: number, curr: any) => acc + curr.pendingStudents.length, 0);

  return (
    <div className="space-y-8 pb-20">
      {/* Header Banner */}
      <div className="relative p-8 md:p-10 text-white rounded-[2.5rem] bg-gradient-to-br from-[rgb(var(--primary))] to-[rgb(var(--secondary))] shadow-xl shadow-[rgb(var(--primary))]/20 overflow-hidden">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-white/10 rounded-full -mr-24 -mt-24 blur-[100px]" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-white/5 rounded-full -ml-24 -mb-24 blur-[80px]" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-xl rounded-[1.5rem] flex items-center justify-center border border-white/30 shadow-2xl">
              <UserCheck className="w-8 h-8 text-white" />
            </div>
            <div>
              <div className="inline-flex items-center px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[9px] font-black uppercase tracking-widest mb-3 border border-white/30">
                <ShieldCheck size={10} className="mr-2" /> Admin Gatekeeper
              </div>
              <h1 className="text-4xl font-black tracking-tight mb-1">Enrollment Requests</h1>
              <p className="opacity-90 font-medium max-w-md leading-relaxed text-sm">
                Manage student access to academic programs. {isAutoAccept ? "Automated approvals are currently active." : "Manual approval is required for all new enrollments."}
              </p>

            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="bg-white/20 backdrop-blur-xl px-8 py-5 rounded-[2rem] border border-white/30 text-center min-w-[140px]">
              <p className="text-[9px] font-black uppercase tracking-[0.2em] opacity-80 mb-1">Requests</p>
              <p className="text-3xl font-black tracking-tighter">{totalPending === 0 ? "CLEAR" : totalPending}</p>
            </div>
          </div>
        </div>
      </div>

      {totalPending === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white dark:bg-gray-900 rounded-[2.5rem] p-16 text-center border border-dashed border-gray-100 dark:border-gray-800 shadow-sm flex flex-col items-center"
        >
          <div className="relative mb-8">
            <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full scale-125 animate-pulse" />
            <div className="relative w-24 h-24 bg-gray-50 dark:bg-gray-800 rounded-2xl flex items-center justify-center text-gray-300 border border-gray-100 dark:border-gray-700 shadow-lg">
              <Inbox size={40} />
            </div>
            <div className="absolute -bottom-1 -right-1 w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center text-white shadow-md border-4 border-white dark:border-gray-900">
              <Check size={20} />
            </div>
          </div>
          <h3 className="text-2xl font-black text-gray-800 dark:text-white mb-2">All Caught Up!</h3>
          <p className="text-sm text-gray-500 font-medium max-w-xs leading-relaxed">
            There are no pending enrollment requests. {isAutoAccept ? "Auto-approve is handling new requests efficiently." : "New requests will appear here for your review."}
          </p>

        </motion.div>
      ) : (
        <div className="space-y-12">
          {requests.map((course: any, idx: number) => (
            <motion.div
              key={course._id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1, duration: 0.5 }}
              className="bg-white dark:bg-gray-900 rounded-[2.5rem] p-8 md:p-10 border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-xl hover:shadow-primary/5 transition-all group"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 border-b border-gray-50 dark:border-gray-800 pb-8">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                    <BookOpen size={28} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-gray-800 dark:text-white tracking-tight mb-1">{course.name}</h2>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Program Enrollment Queue</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="px-4 py-2 bg-primary/5 rounded-xl border border-primary/10 text-primary text-xs font-black uppercase tracking-widest">
                    {course.pendingStudents.length} Applications
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence mode="popLayout">
                  {course.pendingStudents.map((student: any) => (
                    <motion.div
                      layout
                      initial={{ opacity: 0, scale: 0.8, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.8, x: -20 }}
                      key={student._id}
                      className="p-6 bg-gray-50 dark:bg-gray-800/50 rounded-3xl border border-transparent hover:border-primary/20 hover:bg-white dark:hover:bg-gray-900 transition-all duration-300 flex flex-col group/student shadow-sm hover:shadow-lg"
                    >
                      <div className="flex items-center gap-4 mb-6">
                        <div className="relative">
                          <img
                            src={getFileUrl(student.profilePicture) || `https://ui-avatars.com/api/?name=${encodeURIComponent(student.name)}&background=random&size=120`}
                            className="w-14 h-14 rounded-2xl object-cover shadow-md border-2 border-white dark:border-gray-800"
                          />
                          <div className="absolute -top-1 -left-1 w-5 h-5 bg-amber-500 rounded-lg flex items-center justify-center text-white shadow-md border-2 border-white dark:border-gray-800">
                            <Clock size={10} />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-black text-base text-gray-800 dark:text-white truncate leading-none mb-1">{student.name}</h4>
                          <p className="text-[10px] text-gray-400 font-medium truncate">{student.email}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 mt-auto">
                        <button
                          onClick={() => handleAction.mutate({ courseId: course._id, studentId: student._id, action: "approve" })}
                          className="py-3 bg-white dark:bg-gray-900 text-green-600 border border-green-100 dark:border-green-900/30 font-black rounded-xl hover:bg-green-600 hover:text-white transition-all flex items-center justify-center gap-2 text-[10px] uppercase tracking-widest"
                        >
                          <Check size={14} /> Approve
                        </button>
                        <button
                          onClick={() => handleAction.mutate({ courseId: course._id, studentId: student._id, action: "reject" })}
                          className="py-3 bg-white dark:bg-gray-900 text-red-500 border border-red-100 dark:border-red-900/30 font-black rounded-xl hover:bg-red-500 hover:text-white transition-all flex items-center justify-center gap-2 text-[10px] uppercase tracking-widest"
                        >
                          <X size={14} /> Deny
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Security Footer Info */}
      <div className="bg-amber-500/5 dark:bg-amber-500/10 p-8 rounded-[2.5rem] border border-amber-500/20 flex items-start gap-4">
        <AlertCircle className="text-amber-500 shrink-0 mt-1" size={24} />
        <div>
          <h4 className="font-bold text-amber-600 dark:text-amber-400 mb-1">Administrative Note</h4>
          <p className="text-sm text-amber-600/70 dark:text-amber-400/60 font-medium leading-relaxed">
            {isAutoAccept
              ? "Requests appearing here require special attention. By default, auto-approve is active to streamline the enrollment process."
              : "Manual review is active. Every student enrollment request must be explicitly approved or denied by an administrator."}
          </p>

        </div>
      </div>
    </div>
  );
}

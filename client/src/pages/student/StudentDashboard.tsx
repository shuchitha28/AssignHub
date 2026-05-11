import { useQuery } from "@tanstack/react-query";
import { getStudentDashboard } from "../../api/dashboard.api";
import { getMySubmissions } from "../../api/assignment.api";
import { Card } from "../../components/Card";
import { UpcomingCard } from "../../components/UpcomingCard";
import { Award, FileText, Calendar, CheckCircle2 } from "lucide-react";

export default function StudentDashboard() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const { data: dashboardData, isLoading: isLoadingDashboard } = useQuery({
    queryKey: ["student-dashboard"],
    queryFn: getStudentDashboard,
  });

  const { data: submissionsData, isLoading: isLoadingSubmissions } = useQuery({
    queryKey: ["my-submissions"],
    queryFn: getMySubmissions,
  });

  if (isLoadingDashboard || isLoadingSubmissions) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const stats = dashboardData?.data;
  const rawSubmissions = submissionsData?.data || [];
  
  // Filter out submissions for deleted assignments
  const submissions = rawSubmissions.filter((s: any) => {
    // If it has an assignmentId but no assignment object, it was deleted
    if (s.assignmentId && !s.assignment) return false;
    return true;
  });

  const reviewedSubmissions = submissions.filter((s: any) => 
    s.status === "reviewed" && 
    s.assignment && 
    s.assignment.publish !== false // Only show published assignments in the report card
  );

  // Calculate total marks based strictly on reviewed work for active, published assignments
  const totalEarnedMarks = reviewedSubmissions.reduce((sum: number, sub: any) => sum + (sub.marks || 0), 0);
  const totalPossibleMarks = reviewedSubmissions.reduce((sum: number, sub: any) => sum + (sub.assignment?.totalMarks || 0), 0);
  const hasMarks = reviewedSubmissions.length > 0;

  return (
    <div className="space-y-8">

      {/* HERO */}
      <div className="p-8 text-white rounded-3xl bg-gradient-to-r from-primary to-secondary shadow-lg shadow-primary/20 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            Welcome Back, {user?.name?.split(" ")[0]}
          </h1>
          <p className="mt-2 opacity-90 font-medium">
            You’ve completed {stats.completed} out of {stats.total} total assignments.
          </p>
        </div>
        {hasMarks && (
          <div className="bg-white/20 backdrop-blur-md px-8 py-4 rounded-2xl border border-white/30 text-center flex-shrink-0">
            <p className="text-xs font-bold uppercase tracking-widest opacity-80 mb-1">Total Marks</p>
            <p className="text-4xl font-black">{totalEarnedMarks} <span className="text-xl opacity-80 font-bold">/ {totalPossibleMarks}</span></p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* STATS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card title="Total Assigned" value={stats.total} icon={<FileText size={20} className="text-blue-500" />} />
            <Card title="Pending" value={stats.pending} icon={<Calendar size={20} className="text-amber-500" />} />
            <Card title="Completed" value={stats.completed} icon={<CheckCircle2 size={20} className="text-green-500" />} />
          </div>

          {/* REPORT CARD */}
          <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] p-8 border border-gray-100 dark:border-gray-800 shadow-sm">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2 mb-6">
              <Award className="text-primary" size={24} /> Report Card
            </h2>

            {reviewedSubmissions.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-3xl bg-gray-50 dark:bg-gray-800/30">
                <div className="w-16 h-16 bg-white dark:bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                  <Award size={32} />
                </div>
                <p className="text-gray-400 font-medium">No grades available yet. Keep up the good work!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {reviewedSubmissions.map((sub: any) => (
                  <div key={sub._id} className="p-6 bg-gray-50/80 dark:bg-gray-800/50 rounded-3xl border border-gray-100 dark:border-gray-800 flex flex-col md:flex-row gap-6 md:items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800 transition-all">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-gray-800 dark:text-white text-lg truncate max-w-sm">{sub.assignment?.title || "Untitled Assignment"}</h3>
                        <span className="px-3 py-1 bg-green-500/10 text-green-500 text-[10px] font-extrabold uppercase tracking-widest rounded-full">Reviewed</span>
                      </div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                        {sub.assignment?.subject?.name || "Subject"}{sub.assignment?.course?.name ? ` (${sub.assignment.course.name})` : ""}
                      </p>
                      {sub.feedback && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium italic border-l-2 border-primary/20 pl-3">"{sub.feedback}"</p>
                      )}
                    </div>
                    
                    <div className="text-right shrink-0">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Score</p>
                      <div className="text-3xl font-black text-primary">
                        {sub.marks} <span className="text-sm text-gray-400 font-bold">/ {sub.assignment?.totalMarks || 100}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* UPCOMING SIDEBAR */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] p-8 border border-gray-100 dark:border-gray-800 shadow-sm">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
              <Calendar className="text-secondary" size={24} /> Upcoming
            </h2>

            {stats.upcoming.length === 0 ? (
              <p className="text-gray-400 font-medium text-center py-6">No upcoming assignments.</p>
            ) : (
              <div className="space-y-4">
                {stats.upcoming.map((item: any) => (
                  <UpcomingCard
                    key={item._id}
                    title={item.title}
                    subject={`${item.subject?.name || "Subject"}${item.subject?.course?.name ? ` (${item.subject.course.name})` : ""}`}
                    dueDate={item.dueDate}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
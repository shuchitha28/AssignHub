import { useQuery } from "@tanstack/react-query";
import { getAssignmentAnalytics } from "../../api/assignment.api";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useMemo } from "react";
import { 
  ChevronRight, 
  ArrowLeft, 
  BookOpen, 
  Users, 
  CheckCircle2, 
  Calendar, 
  Trophy,
  Layout,
  PieChart,
  Search
} from "lucide-react";
import { Card } from "../../components/Card";

export default function AssignmentPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["assignment-analytics"],
    queryFn: getAssignmentAnalytics,
  });

  const [selectedCourse, setSelectedCourse] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const courses = useMemo(() => data?.data || [], [data]);

  // Calculate overall stats
  const stats = useMemo(() => {
    if (!courses.length) return { totalCourses: 0, totalStudents: 0, totalAssignments: 0, avgSubmissionRate: 0 };
    
    let totalAssignments = 0;
    let totalSubmitted = 0;
    let totalRequired = 0;
    let totalStudents = 0;

    courses.forEach((c: any) => {
      totalStudents += c.totalStudents || 0;
      c.subjects.forEach((s: any) => {
        totalAssignments += s.assignments.length;
        s.assignments.forEach((a: any) => {
          totalSubmitted += a.submitted;
          totalRequired += (a.submitted + a.notSubmitted);
        });
      });
    });

    return {
      totalCourses: courses.length,
      totalStudents,
      totalAssignments,
      avgSubmissionRate: totalRequired > 0 ? Math.round((totalSubmitted / totalRequired) * 100) : 0
    };
  }, [courses]);

  const filteredCourses = useMemo(() => {
    return courses.filter((c: any) => 
      c.courseName.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [courses, searchQuery]);

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-8 pb-12">
      {/* HERO SECTION */}
      <div className="p-8 md:p-8 text-white rounded-[2.5rem] bg-gradient-to-br from-[rgb(var(--primary))] to-[rgb(var(--secondary))] shadow-xl shadow-[rgb(var(--primary))]/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full -ml-16 -mb-16 blur-2xl" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-bold uppercase tracking-wider mb-2">
              <PieChart size={12} className="mr-2" /> Global Statistics
            </div>
            <h1 className="text-4xl font-black tracking-tight">Assignment Analytics</h1>
            <p className="opacity-80 font-medium max-w-lg">
              Track submission rates, student performance, and engagement across all courses and subjects.
            </p>
          </div>
          
          <div className="flex gap-4">
            {selectedCourse && (
              <button
                onClick={() => setSelectedCourse(null)}
                className="px-6 py-3 bg-white/10 backdrop-blur-md hover:bg-white/20 border border-white/20 rounded-2xl font-bold flex items-center gap-2 transition-all"
              >
                <ArrowLeft size={18} /> Back to Overview
              </button>
            )}
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {!selectedCourse ? (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
            {/* STATS SUMMARY */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card 
                title="Active Courses" 
                value={stats.totalCourses} 
                icon={<BookOpen size={24} className="text-blue-500" />} 
              />
              <Card 
                title="Total Students" 
                value={stats.totalStudents} 
                icon={<Users size={24} className="text-purple-500" />} 
              />
              <Card 
                title="Total Assignments" 
                value={stats.totalAssignments} 
                icon={<Calendar size={24} className="text-indigo-500" />} 
              />
              <Card 
                title="Avg. Submission Rate" 
                value={`${stats.avgSubmissionRate}%`} 
                icon={<CheckCircle2 size={24} className="text-green-500" />} 
              />
            </div>

            {/* SEARCH & FILTERS */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white dark:bg-gray-900 p-4 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm">
              <div className="relative w-full md:w-96">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input 
                  type="text"
                  placeholder="Search courses..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                />
              </div>
              <div className="flex gap-2">
                <span className="px-4 py-2 bg-primary/5 text-primary rounded-xl text-xs font-bold uppercase tracking-widest border border-primary/10">
                  Total Results: {filteredCourses.length}
                </span>
              </div>
            </div>

            {/* COURSE GRID */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredCourses.map((course: any, idx: number) => (
                <motion.div
                  key={course._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  onClick={() => setSelectedCourse(course)}
                  className="group relative p-8 bg-white dark:bg-gray-900 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-xl hover:shadow-primary/5 hover:border-primary/20 transition-all cursor-pointer overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-100 transition-all transform translate-x-4 group-hover:translate-x-0">
                    <div className="w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center shadow-lg shadow-primary/30">
                      <ChevronRight size={20} />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center text-blue-500 mb-2">
                      <Layout size={24} />
                    </div>
                    
                    <div>
                      <h2 className="text-xl font-bold text-gray-800 dark:text-white line-clamp-1">
                        {course.courseName}
                      </h2>
                      <p className="mt-1 text-sm text-gray-500 font-medium line-clamp-2">
                        {course.description || "Manage course curriculum and assignment data."}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-2">
                      <span className="px-3 py-1.5 bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-[10px] font-bold uppercase tracking-widest rounded-lg flex items-center gap-1.5">
                        <BookOpen size={12} /> {course.subjects.length} Subjects
                      </span>
                      <span className="px-3 py-1.5 bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-[10px] font-bold uppercase tracking-widest rounded-lg flex items-center gap-1.5">
                        <Users size={12} /> {course.totalStudents || 0} Students
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="detail"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
          >
            {/* COURSE SUMMARY HEADER */}
            <div className="p-8 bg-white dark:bg-gray-900 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col md:flex-row gap-6 justify-between items-start">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl flex items-center justify-center text-indigo-500">
                    <BookOpen size={20} />
                  </div>
                  <h2 className="text-2xl font-black text-gray-800 dark:text-white uppercase tracking-tight">
                    {selectedCourse.courseName}
                  </h2>
                </div>
                <p className="text-gray-500 font-medium ml-13">
                  {selectedCourse.description}
                </p>
              </div>
              <div className="flex gap-4">
                <div className="text-center px-6 py-3 bg-gray-50 dark:bg-gray-800 rounded-2xl">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Subjects</p>
                  <p className="text-xl font-bold text-gray-800 dark:text-white">{selectedCourse.subjects.length}</p>
                </div>
                <div className="text-center px-6 py-3 bg-gray-50 dark:bg-gray-800 rounded-2xl">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Students</p>
                  <p className="text-xl font-bold text-gray-800 dark:text-white">{selectedCourse.totalStudents || 0}</p>
                </div>
              </div>
            </div>

            {/* SUBJECT CARDS */}
            {selectedCourse.subjects.map((sub: any) => (
              <div
                key={sub._id}
                className="bg-white dark:bg-gray-900 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden"
              >
                <div className="p-8 border-b border-gray-50 dark:border-gray-800 bg-gray-50/30 dark:bg-gray-800/20">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <h3 className="text-xl font-black text-primary uppercase tracking-tight mb-1">
                        {sub.subjectName} <span className="opacity-50 text-base font-bold ml-2">({sub.subjectCode})</span>
                      </h3>
                      <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500 font-medium">
                        <Users size={14} className="text-gray-400" />
                        <span>Teachers: {sub.teachers?.length > 0 ? sub.teachers.map((t: any) => t.name).join(", ") : "Unassigned"}</span>
                      </div>
                    </div>
                    <div className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl text-[10px] font-bold uppercase tracking-widest">
                      {sub.assignments.length} Total Assignments
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left bg-gray-50/50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
                        <th className="px-8 py-5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Assignment Title</th>
                        <th className="px-6 py-5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Created</th>
                        <th className="px-6 py-5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Due Date</th>
                        <th className="px-6 py-5 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">Submitted</th>
                        <th className="px-6 py-5 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">Not Submitted</th>
                        <th className="px-8 py-5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Completion</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                      {sub.assignments.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-8 py-12 text-center text-gray-400 font-medium italic">
                            No assignments found for this subject.
                          </td>
                        </tr>
                      ) : (
                        sub.assignments.map((a: any) => (
                          <tr key={a._id} className="hover:bg-gray-50/80 dark:hover:bg-gray-800/30 transition-all">
                            <td className="px-8 py-6">
                              <p className="font-bold text-gray-800 dark:text-white">{a.title}</p>
                              <div className="flex items-center gap-1.5 mt-1">
                                <Trophy size={12} className="text-amber-500" />
                                <span className="text-xs text-gray-400 font-bold">{a.totalMarks} Points</span>
                              </div>
                            </td>
                            <td className="px-6 py-6 text-sm text-gray-500 font-medium">
                              {new Date(a.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                            </td>
                            <td className="px-6 py-6 text-sm text-gray-600 dark:text-gray-300 font-bold">
                              {new Date(a.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                            </td>
                            <td className="px-6 py-6 text-center">
                              <span className="inline-flex items-center px-3 py-1 bg-green-500/10 text-green-500 text-sm font-black rounded-full">
                                {a.submitted}
                              </span>
                            </td>
                            <td className="px-6 py-6 text-center">
                              <span className={`inline-flex items-center px-3 py-1 ${a.notSubmitted > 0 ? 'bg-red-500/10 text-red-500' : 'bg-gray-100 dark:bg-gray-800 text-gray-400'} text-sm font-black rounded-full`}>
                                {a.notSubmitted}
                              </span>
                            </td>
                            <td className="px-8 py-6">
                              <div className="flex flex-col gap-1.5 min-w-[120px]">
                                <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-gray-400">
                                  <span>Rate</span>
                                  <span className={a.percentage >= 80 ? "text-green-500" : a.percentage >= 50 ? "text-amber-500" : "text-red-500"}>
                                    {a.percentage}%
                                  </span>
                                </div>
                                <div className="w-full h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                  <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${a.percentage}%` }}
                                    className={`h-full rounded-full ${
                                      a.percentage >= 80 ? "bg-green-500" : a.percentage >= 50 ? "bg-amber-500" : "bg-red-500"
                                    }`}
                                  />
                                </div>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

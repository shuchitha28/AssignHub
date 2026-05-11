import { useQuery } from "@tanstack/react-query";
import { getCourses } from "../api/course.api";
import CourseCard from "../components/CourseCard";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { useState, useEffect, useMemo } from "react";
import CreateCourseModal from "../components/CreateCourseModal";
import { 
  BookOpen, 
  Plus, 
  Search, 
  GraduationCap, 
  Layers, 
  TrendingUp, 
  Library,
  Sparkles,
  Filter
} from "lucide-react";
import { Card } from "../components/Card";
import { useTheme } from "../hooks/useTheme";

export default function CoursesPage() {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const { colorTheme } = useTheme();

  const { data, isLoading, error } = useQuery({
    queryKey: ["courses"],
    queryFn: getCourses,
  });

  useEffect(() => {
    if (error) toast.error("Failed to load courses");
  }, [error]);

  const courses = useMemo(() => data?.data || [], [data]);

  const filtered = useMemo(() => {
    return courses.filter((c: any) =>
      (c.name || "").toLowerCase().includes(search.toLowerCase())
    );
  }, [courses, search]);

  const stats = useMemo(() => ({
    totalCourses: courses.length,
    totalStudents: courses.reduce((acc: number, curr: any) => acc + (curr.students?.length || 0), 0),
    avgSubjects: courses.length > 0 ? Math.round(courses.reduce((acc: number, curr: any) => acc + (curr.subjects?.length || 0), 0) / courses.length) : 0,
    topCourse: courses.reduce((prev: any, current: any) => (prev.students?.length > current.students?.length) ? prev : current, {name: "None", students: []})
  }), [courses]);

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-12 h-12 border-4 border-[rgb(var(--primary))] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-8 pb-12">
      {/* HERO SECTION */}
      <div className="p-8 text-white rounded-[2.5rem] bg-gradient-to-br from-[rgb(var(--primary))] to-[rgb(var(--secondary))] shadow-xl shadow-[rgb(var(--primary))]/20 relative overflow-hidden transition-all duration-500">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full -ml-10 -mb-10 blur-2xl" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-bold uppercase tracking-wider mb-2">
              <Library size={12} className="mr-2" /> Academic Programs
            </div>
            <h1 className="text-4xl font-black tracking-tight">Course Management</h1>
            <p className="opacity-80 font-medium max-w-lg">
              Create, organize, and manage academic courses and student enrollments.
            </p>
          </div>
          
          <button
            onClick={() => setOpen(true)}
            className="px-8 py-4 bg-white text-[rgb(var(--primary))] hover:bg-gray-50 rounded-2xl font-bold flex items-center gap-2 shadow-xl transition-all transform hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus size={20} /> Create New Course
          </button>
        </div>
      </div>

      {/* STATS SUMMARY */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card 
          title="Total Courses" 
          value={stats.totalCourses} 
          icon={<BookOpen size={24} className="text-[rgb(var(--primary))]" />} 
        />
        <Card 
          title="Total Enrollments" 
          value={stats.totalStudents} 
          icon={<GraduationCap size={24} className="text-[rgb(var(--primary))]" />} 
        />
        <Card 
          title="Avg. Subjects" 
          value={stats.avgSubjects} 
          icon={<Layers size={24} className="text-[rgb(var(--primary))]" />} 
        />
        <Card 
          title="Most Popular" 
          value={stats.topCourse.name.length > 15 ? stats.topCourse.name.substring(0, 15) + '...' : stats.topCourse.name} 
          icon={<TrendingUp size={24} className="text-[rgb(var(--primary))]" />} 
        />
      </div>

      {/* SEARCH & FILTERS */}
      <div className="flex flex-col lg:flex-row gap-4 items-center justify-between bg-white dark:bg-gray-900 p-4 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm">
        <div className="relative w-full lg:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text"
            placeholder="Search by course name or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-[rgb(var(--primary))]/20 outline-none transition-all"
          />
        </div>
        
        <div className="flex items-center gap-3 w-full lg:w-auto">
          <div className="px-4 py-3 bg-[rgb(var(--primary))]/5 text-[rgb(var(--primary))] rounded-2xl text-xs font-bold uppercase tracking-widest border border-[rgb(var(--primary))]/10 flex items-center gap-2">
            <Sparkles size={14} /> Showing {filtered.length} Courses
          </div>
          <button className="p-3 bg-gray-50 dark:bg-gray-800 text-gray-500 rounded-2xl border border-gray-100 dark:border-gray-700 hover:bg-gray-100 transition-all">
            <Filter size={18} />
          </button>
        </div>
      </div>

      {/* COURSE GRID */}
      <AnimatePresence mode="wait">
        {filtered.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col items-center justify-center py-20 text-center"
          >
            <div className="w-24 h-24 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center text-gray-300 mb-6 border border-dashed border-gray-200 dark:border-gray-700">
              <Library size={40} />
            </div>
            <h3 className="text-xl font-bold text-gray-800 dark:text-white">No courses found</h3>
            <p className="text-gray-500 max-w-xs mx-auto mt-2">
              Try adjusting your search or create a new course to get started.
            </p>
          </motion.div>
        ) : (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {filtered.map((course: any, index: number) => (
              <motion.div
                key={course._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <CourseCard course={course} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <CreateCourseModal open={open} onClose={() => setOpen(false)} />
    </div>
  );
}
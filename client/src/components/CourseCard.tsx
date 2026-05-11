import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Users, BookCopy, ChevronRight, UserPlus, Layout } from "lucide-react";

export default function CourseCard({ course }: any) {
  const navigate = useNavigate();

  return (
    <motion.div
      whileHover={{ y: -8 }}
      className="group bg-white dark:bg-gray-900 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-500 overflow-hidden"
    >
      <div className="p-8">
        {/* HEADER */}
        <div className="flex items-center justify-between mb-6">
          <div className="w-14 h-14 bg-[rgb(var(--primary))]/10 text-[rgb(var(--primary))] rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
            <Layout size={28} />
          </div>
          <span className="px-4 py-1.5 bg-green-500/10 text-green-500 text-[10px] font-black uppercase tracking-widest rounded-full">
            Active
          </span>
        </div>

        {/* CONTENT */}
        <div className="space-y-3 mb-8">
          <h2 className="text-2xl font-black text-gray-800 dark:text-white tracking-tight group-hover:text-[rgb(var(--primary))] transition-colors">
            {course.name}
          </h2>
          <p className="text-sm text-gray-400 font-medium line-clamp-2 leading-relaxed">
            {course.description || "Comprehensive academic program designed for advanced learning and skill development."}
          </p>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50/50 dark:bg-gray-800/50 rounded-2xl mb-8 border border-gray-50 dark:border-gray-800">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-gray-400">
              <Users size={14} />
              <span className="text-[10px] font-bold uppercase tracking-wider">Students</span>
            </div>
            <p className="text-lg font-black text-gray-800 dark:text-white">
              {course.students?.length || 0}
            </p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-gray-400">
              <BookCopy size={14} />
              <span className="text-[10px] font-bold uppercase tracking-wider">Subjects</span>
            </div>
            <p className="text-lg font-black text-gray-800 dark:text-white">
              {course.subjectsCount || course.subjects?.length || 0}
            </p>
          </div>
        </div>

        {/* ACTIONS */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => navigate(`/admin/courses/${course._id}`)}
            className="flex items-center justify-center gap-2 py-3.5 bg-[rgb(var(--primary))] hover:opacity-90 text-white rounded-2xl font-bold text-sm shadow-lg shadow-[rgb(var(--primary))]/20 dark:shadow-none transition-all active:scale-95"
          >
            Manage <ChevronRight size={16} />
          </button>
          
          <button
            onClick={() => navigate(`/admin/courses/${course._id}?tab=students`)}
            className="flex items-center justify-center gap-2 py-3.5 bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-2xl font-bold text-sm transition-all border border-gray-100 dark:border-gray-700 active:scale-95"
          >
            <UserPlus size={16} /> Enroll
          </button>
        </div>
      </div>
    </motion.div>
  );
}
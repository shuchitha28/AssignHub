import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createCourse } from "../api/course.api";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { X, BookOpen, AlignLeft } from "lucide-react";

export default function CreateCourseModal({ open, onClose }: any) {
  const qc = useQueryClient();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const { mutate, isPending } = useMutation({
    mutationFn: createCourse,
    onSuccess: () => {
      toast.success("Course created successfully");
      qc.invalidateQueries({ queryKey: ["courses"] });
      handleClose();
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to create course");
    },
  });

  useEffect(() => {
    if (!open) {
      setName("");
      setDescription("");
    }
  }, [open]);

  const handleClose = () => {
    setName("");
    setDescription("");
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative bg-white dark:bg-gray-900 p-10 rounded-[3rem] shadow-2xl w-full max-w-md border border-white/10"
          >
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-black text-gray-800 dark:text-white tracking-tight">Create Course</h2>
              <button onClick={handleClose} className="p-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-2xl transition-all">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-6">
              <div className="relative group">
                <BookOpen className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[rgb(var(--primary))] transition-colors" size={18} />
                <input
                  placeholder="Course Title"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-2xl border-none focus:ring-2 focus:ring-[rgb(var(--primary))]/20 font-bold outline-none transition-all"
                />
              </div>

              <div className="relative group">
                <AlignLeft className="absolute left-4 top-6 text-gray-400 group-focus-within:text-[rgb(var(--primary))] transition-colors" size={18} />
                <textarea
                  rows={4}
                  placeholder="Course Description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-2xl border-none focus:ring-2 focus:ring-[rgb(var(--primary))]/20 font-bold outline-none transition-all resize-none"
                />
              </div>

              <div className="flex gap-4 mt-8">
                <button 
                  onClick={handleClose}
                  disabled={isPending}
                  className="flex-1 py-4 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-black rounded-2xl transition-all hover:bg-gray-200 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  disabled={isPending || !name.trim() || !description.trim()}
                  onClick={() => mutate({ name, description })}
                  className="flex-1 py-4 bg-[rgb(var(--primary))] text-white font-black rounded-2xl shadow-xl shadow-[rgb(var(--primary))]/20 transition-all hover:opacity-90 active:scale-95 disabled:opacity-50"
                >
                  {isPending ? "Creating..." : "Launch Course"}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
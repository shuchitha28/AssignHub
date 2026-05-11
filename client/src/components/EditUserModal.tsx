import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateUser } from "../api/user.api";
import toast from "react-hot-toast";
import { X, User, Shield } from "lucide-react";
import { Select } from "./Select";

export default function EditUserModal({ open, onClose, user }: any) {
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    name: "",
    role: "student",
  });

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name,
        role: user.role,
      });
    }
  }, [user]);

  const mutation = useMutation({
    mutationFn: (data: any) => updateUser(user._id, data),
    onSuccess: () => {
      toast.success("User updated successfully");
      queryClient.invalidateQueries({ queryKey: ["users"] });
      onClose();
    },
    onError: () => toast.error("Failed to update user"),
  });

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative bg-white dark:bg-gray-900 p-10 rounded-[3rem] shadow-2xl w-full max-w-md border border-white/10"
          >
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-black text-gray-800 dark:text-white tracking-tight">Edit User</h2>
              <button onClick={onClose} className="p-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-2xl transition-all">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Full Name"
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-2xl border-none focus:ring-2 focus:ring-[rgb(var(--primary))]/20 font-bold"
                />
              </div>

              <Select
                icon={<Shield size={18} />}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                value={form.role}
              >
                <option value="student">Student</option>
                <option value="teacher">Teacher</option>
                <option value="admin">Admin</option>
              </Select>

              <div className="flex gap-4 mt-8">
                <button 
                  onClick={onClose}
                  className="flex-1 py-4 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-black rounded-2xl transition-all hover:bg-gray-200 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={() => mutation.mutate(form)}
                  disabled={mutation.isPending}
                  className="flex-1 py-4 bg-[rgb(var(--primary))] text-white font-black rounded-2xl shadow-xl shadow-[rgb(var(--primary))]/20 transition-all hover:opacity-90 active:scale-95 disabled:opacity-50"
                >
                  {mutation.isPending ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
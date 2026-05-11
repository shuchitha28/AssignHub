import { Pencil, Trash2, ShieldCheck, GraduationCap, UserCheck, Clock, Ban, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import EditUserModal from "./EditUserModal";
import ConfirmModal from "./ConfirmModal";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteUser, toggleUserStatus } from "../api/user.api";
import toast from "react-hot-toast";
import { getFileUrl } from "../utils/file";


export default function UserRow({ user }: any) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: () => deleteUser(user._id),
    onSuccess: () => {
      toast.success("User deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setDeleteOpen(false);
    },
    onError: () => toast.error("Failed to delete user"),
  });

  const statusMutation = useMutation({
    mutationFn: () => toggleUserStatus(user._id),
    onSuccess: () => {
      const msg = user.status === "active" ? "User has been blocked" : "User has been unblocked";
      toast.success(msg);
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: () => toast.error("Failed to update status"),
  });

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "admin": return <ShieldCheck size={14} className="text-purple-500" />;
      case "teacher": return <UserCheck size={14} className="text-green-500" />;
      default: return <GraduationCap size={14} className="text-blue-500" />;
    }
  };

  return (
    <>
      <tr className="hover:bg-gray-50/80 dark:hover:bg-gray-800/30 transition-all group">
        <td className="px-8 py-5">
          <div className="flex items-center gap-4">
            <div className="relative">
              <img
                src={getFileUrl(user.profilePicture) || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random&size=100`}
                className="w-12 h-12 rounded-2xl object-cover border-2 border-white dark:border-gray-800 shadow-sm bg-gray-100"
              />
              <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white dark:border-gray-800 ${user.status === 'active' ? 'bg-green-500' : 'bg-red-500'}`} ></div>
            </div>
            <div>
              <p className="font-bold text-gray-800 dark:text-white">{user.name}</p>
              <p className="text-xs text-gray-400 font-medium">{user.email}</p>
            </div>
          </div>
        </td>

        <td className="px-6 py-5">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl">
            {getRoleIcon(user.role)}
            <span className="text-xs font-bold text-gray-600 dark:text-gray-300 capitalize">
              {user.role}
            </span>
          </div>
        </td>

        <td className="px-6 py-5 text-center">
          <div className="flex flex-col items-center gap-1">
            <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
              user.status === "active"
                ? "bg-green-500/10 text-green-500"
                : "bg-red-500/10 text-red-500"
            }`}>
              {user.status === 'active' ? 'Active' : 'Blocked'}
            </span>
          </div>
        </td>

        <td className="px-6 py-5">
          <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
            <Clock size={14} className="text-gray-400" />
            {new Date(user.updatedAt || Date.now()).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
          </div>
        </td>

        <td className="px-8 py-5">
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={() => statusMutation.mutate()}
              className={`p-2 rounded-xl transition-all ${
                user.status === "active" 
                  ? "bg-red-50 dark:bg-red-900/20 text-red-400 hover:text-red-600" 
                  : "bg-green-50 dark:bg-green-900/20 text-green-400 hover:text-green-600"
              }`}
              title={user.status === "active" ? "Block User" : "Unblock User"}
            >
              {user.status === "active" ? <Ban size={18} /> : <CheckCircle2 size={18} />}
            </button>
            <button
              onClick={() => setEditOpen(true)}
              className="p-2 bg-gray-50 dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-gray-400 hover:text-blue-500 rounded-xl transition-all"
              title="Edit User"
            >
              <Pencil size={18} />
            </button>
            <button
              onClick={() => setDeleteOpen(true)}
              className="p-2 bg-gray-50 dark:bg-gray-800 hover:bg-red-50 dark:hover:bg-red-900/30 text-gray-400 hover:text-red-500 rounded-xl transition-all"
              title="Delete User"
            >
              <Trash2 size={18} />
            </button>
          </div>
        </td>
      </tr>

      <EditUserModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        user={user}
      />

      <ConfirmModal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={() => deleteMutation.mutate()}
        title="Delete User"
        message={`Are you sure you want to delete ${user.name}? This action cannot be undone.`}
      />
    </>
  );
}
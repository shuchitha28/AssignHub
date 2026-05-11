import { useState } from "react";
import { Bell, CheckCircle2, MessageSquare, Info, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import API from "../api/axios";
import toast from "react-hot-toast";
import { formatDistanceToNow } from "date-fns";

export default function Notifications() {
  const [isOpen, setIsOpen] = useState(false);
  const qc = useQueryClient();

  const { data: notifications } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => API.get("/notifications"),
    refetchInterval: 30000, // Refetch every 30s
  });

  const list = notifications?.data || [];
  const unreadCount = list.filter((n: any) => !n.read).length;

  const markRead = useMutation({
    mutationFn: (id: string) => API.put(`/notifications/${id}/read`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const clearAll = useMutation({
    mutationFn: () => API.delete("/notifications/clear"),
    onSuccess: () => {
      toast.success("Notifications cleared");
      qc.invalidateQueries({ queryKey: ["notifications"] });
      setIsOpen(false);
    },
  });

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-3 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 rounded-2xl transition-all relative"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute top-2 right-2 w-4 h-4 bg-red-500 text-white text-[9px] font-black flex items-center justify-center rounded-full border-2 border-white dark:border-gray-900 shadow-sm animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-50" onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-0 mt-4 w-96 bg-white dark:bg-gray-900 rounded-[2rem] shadow-2xl border border-gray-100 dark:border-gray-800 z-[60] overflow-hidden"
            >
              <div className="p-6 bg-gradient-to-r from-primary to-secondary text-white flex items-center justify-between">
                <div>
                  <h3 className="font-bold">Notifications</h3>
                  <p className="inline-block px-2 py-0.5 bg-white/20 rounded text-[10px] font-black uppercase tracking-widest mt-1">Recent Activity</p>
                </div>
                {list.length > 0 && (
                  <button onClick={() => clearAll.mutate()} className="p-2 bg-white/20 hover:bg-white/30 text-white rounded-xl transition-all">
                    <Trash2 size={16} />
                  </button>
                )}
              </div>

              <div className="max-h-[400px] overflow-auto">
                {list.length === 0 ? (
                  <div className="p-12 text-center">
                    <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                      <Bell size={32} />
                    </div>
                    <p className="text-sm font-bold text-gray-400">All caught up!</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-50 dark:divide-gray-800">
                    {list.map((n: any) => (
                      <div
                        key={n._id}
                        onClick={() => !n.read && markRead.mutate(n._id)}
                        className={`p-5 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all cursor-pointer relative ${!n.read ? 'bg-primary/5' : ''}`}
                      >
                        <div className="flex gap-4">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${n.type === 'support_reply' ? 'bg-blue-500/10 text-blue-500' :
                            n.type === 'assignment_graded' ? 'bg-green-500/10 text-green-500' :
                              'bg-gray-500/10 text-gray-500'
                            }`}>
                            {n.type === 'support_reply' ? <MessageSquare size={18} /> :
                              n.type === 'assignment_graded' ? <CheckCircle2 size={18} /> :
                                <Info size={18} />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-sm text-gray-800 dark:text-white mb-0.5">{n.title}</p>
                            <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">{n.message}</p>
                            <p className="text-[9px] font-bold text-gray-400 mt-2 uppercase tracking-widest">
                              {formatDistanceToNow(new Date(n.createdAt))} ago
                            </p>
                          </div>
                          {!n.read && (
                            <div className="w-2 h-2 bg-primary rounded-full absolute top-6 right-6" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="p-4 bg-gray-50 dark:bg-gray-800/50 text-center">
                <button onClick={() => setIsOpen(false)} className="text-xs font-black text-primary uppercase tracking-widest hover:underline">
                  Close Notification
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

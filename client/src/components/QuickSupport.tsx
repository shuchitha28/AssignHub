import { useState } from "react";
import { MessageSquare, Send, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import API from "../api/axios";
import toast from "react-hot-toast";

export default function QuickSupport() {
  const [isOpen, setIsOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const qc = useQueryClient();

  const { data: tickets } = useQuery({
    queryKey: ["my-tickets"],
    queryFn: () => API.get("/support/me"),
    enabled: isOpen,
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => API.post("/support", data),
    onSuccess: () => {
      toast.success("Support ticket sent!");
      setSubject("");
      setMessage("");
      qc.invalidateQueries({ queryKey: ["my-tickets"] });
    },
    onError: () => toast.error("Failed to send message"),
  });

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-8 right-8 w-14 h-14 bg-gradient-to-br from-primary to-secondary text-white rounded-2xl shadow-xl shadow-primary/30 flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-50 group"
      >
        <MessageSquare size={24} />
        <span className="absolute right-full mr-4 px-4 py-2 bg-gray-900 text-white text-xs font-bold rounded-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
          Quick Support
        </span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[60] flex items-end justify-end p-8">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, y: 100, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 100, scale: 0.9 }}
              className="w-full max-w-md bg-white dark:bg-gray-900 rounded-[2.5rem] shadow-2xl border border-gray-100 dark:border-gray-800 relative z-10 flex flex-col max-h-[80vh] overflow-hidden"
            >
              {/* Header */}
              <div className="p-6 bg-gradient-to-r from-primary to-secondary text-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-xl">
                    <MessageSquare size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold">AssignHub Support</h3>
                    <p className="inline-block px-2 py-0.5 bg-white/20 rounded text-[10px] uppercase tracking-widest font-black mt-1">We're here to help</p>
                  </div>
                </div>
                <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/10 rounded-xl transition-all">
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-auto p-6 space-y-6">
                {/* Tickets History */}
                {tickets?.data && tickets.data.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Recent Conversations</p>
                    {tickets.data.map((t: any) => (
                      <div key={t._id} className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-800">
                        <div className="flex justify-between items-start mb-2">
                          <p className="font-bold text-sm dark:text-white">{t.subject}</p>
                          <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-lg ${t.status === 'open' ? 'bg-amber-500/10 text-amber-500' : 'bg-green-500/10 text-green-500'}`}>
                            {t.status}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 line-clamp-2 mb-2">{t.message}</p>
                        {t.reply && (
                          <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                            <p className="text-[9px] font-black text-primary uppercase mb-1">Admin Response</p>
                            <p className="text-xs font-bold text-gray-700 dark:text-gray-300 italic">"{t.reply}"</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* New Ticket Form */}
                <div className="space-y-4">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">New Message</p>
                  <input
                    type="text"
                    placeholder="Subject..."
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-5 py-3 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-2xl border-none focus:ring-2 focus:ring-primary/20 font-bold text-sm outline-none transition-all"
                  />
                  <textarea
                    placeholder="Describe your issue..."
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full px-5 py-4 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-2xl border-none focus:ring-2 focus:ring-primary/20 font-medium text-sm outline-none transition-all resize-none"
                  />
                  <button
                    onClick={() => createMutation.mutate({ subject, message })}
                    disabled={createMutation.isPending || !subject || !message}
                    className="w-full py-4 bg-gray-900 dark:bg-white dark:text-gray-900 text-white font-bold rounded-2xl shadow-xl flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                  >
                    <Send size={18} />
                    {createMutation.isPending ? "Sending..." : "Send Message"}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

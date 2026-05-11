import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import API from "../../api/axios";
import {
  Send,
  Search,
  User,
  Inbox,
  Trash2,
  LifeBuoy,
  MessageSquare
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { format } from "date-fns";
import ConfirmModal from "../../components/ConfirmModal";

export default function SupportManagement() {
  const qc = useQueryClient();
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [reply, setReply] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all");
  const [showConfirm, setShowConfirm] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const { data: tickets, isLoading, isError } = useQuery({
    queryKey: ["admin-tickets"],
    queryFn: () => API.get("/support/all"),
    refetchInterval: 10000,
  });

  const ticketList = Array.isArray(tickets?.data) ? tickets.data : [];

  const replyMutation = useMutation({
    mutationFn: ({ id, reply }: any) => API.put(`/support/${id}/reply`, { reply }),
    onSuccess: () => {
      toast.success("Reply sent successfully!");
      setReply("");
      setSelectedTicket(null);
      qc.invalidateQueries({ queryKey: ["admin-tickets"] });
    },
    onError: () => toast.error("Failed to send reply"),
  });

  const clearMutation = useMutation({
    mutationFn: () => API.delete("/support/clear-closed"),
    onSuccess: (res: any) => {
      toast.success(res.data.message || "Closed tickets cleared!");
      qc.invalidateQueries({ queryKey: ["admin-tickets"] });
    },
    onError: () => toast.error("Failed to clear tickets"),
  });

  const filteredTickets = ticketList.filter((t: any) => {
    const userName = t.user?.name || "Unknown User";
    const matchesSearch =
      userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.subject.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === "all" || t.status === filter;
    return matchesSearch && matchesFilter;
  });

  if (isLoading) return <div className="flex flex-col items-center justify-center p-20 space-y-4">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Loading Support Queue...</p>
  </div>;

  if (isError) return (
    <div className="p-20 text-center space-y-4">
      <p className="text-red-500 font-bold text-xl">Failed to load support tickets</p>
      <button onClick={() => qc.invalidateQueries({ queryKey: ["admin-tickets"] })} className="px-6 py-2 bg-primary text-white rounded-xl font-bold">Retry</button>
    </div>
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Premium Header Banner */}
      <div className="relative p-8 md:p-10 text-white rounded-[2.5rem] bg-gradient-to-br from-[rgb(var(--primary))] to-[rgb(var(--secondary))] shadow-xl shadow-[rgb(var(--primary))]/20 overflow-hidden">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-white/10 rounded-full -mr-24 -mt-24 blur-[100px]" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-white/5 rounded-full -ml-24 -mb-24 blur-[80px]" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-xl rounded-[1.5rem] flex items-center justify-center border border-white/30 shadow-2xl">
              <LifeBuoy className="w-8 h-8 text-white" />
            </div>
            <div>
              <div className="inline-flex items-center px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[9px] font-black uppercase tracking-widest mb-3 border border-white/30">
                <MessageSquare size={10} className="mr-2" /> Help Desk
              </div>
              <h1 className="text-4xl font-black tracking-tight mb-1">Support Center</h1>
              <p className="opacity-90 font-medium max-w-md leading-relaxed text-sm">
                Real-time user assistance and issue resolution portal.
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="bg-white/20 backdrop-blur-xl px-6 py-4 rounded-2xl border border-white/30 text-center min-w-[100px]">
              <p className="text-[9px] font-black uppercase tracking-[0.2em] opacity-80 mb-1">Open</p>
              <p className="text-2xl font-black">{ticketList.filter((t: any) => t.status === 'open').length}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-xl px-6 py-4 rounded-2xl border border-white/20 text-center min-w-[100px]">
              <p className="text-[9px] font-black uppercase tracking-[0.2em] opacity-80 mb-1">Resolved</p>
              <p className="text-2xl font-black">{ticketList.filter((t: any) => t.status === 'closed').length}</p>
            </div>
            <button
              onClick={() => setShowConfirm(true)}
              disabled={clearMutation.isPending || ticketList.filter((t: any) => t.status === 'closed').length === 0}
              className="bg-white text-red-500 p-4 rounded-2xl shadow-xl hover:scale-[1.05] active:scale-95 transition-all disabled:opacity-50"
              title="Clear Resolved Tickets"
            >
              <Trash2 size={24} />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Ticket List */}
        <div className="lg:col-span-1 space-y-4">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={18} />
            <input
              type="text"
              placeholder="Search by subject or user..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 rounded-[1.5rem] border border-gray-100 dark:border-gray-800 outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium text-sm"
            />
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden flex flex-col">
            <div className="flex p-1.5 gap-1 bg-gray-50 dark:bg-gray-800/50 m-4 rounded-xl">
              {['all', 'open', 'closed'].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`flex-1 py-2 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all ${filter === f ? 'bg-white dark:bg-gray-700 shadow-sm text-primary' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  {f}
                </button>
              ))}
            </div>

            <div className="max-h-[500px] overflow-auto divide-y divide-gray-50 dark:divide-gray-800 custom-scrollbar">
              {filteredTickets?.length === 0 ? (
                <div className="p-12 text-center text-gray-400 font-bold text-sm flex flex-col items-center gap-2">
                  <Inbox size={32} className="opacity-30" />
                  No tickets found
                </div>
              ) : (
                filteredTickets?.map((t: any) => (
                  <div
                    key={t._id}
                    onClick={() => setSelectedTicket(t)}
                    className={`p-5 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-all border-l-4 ${selectedTicket?._id === t._id ? 'bg-primary/5 border-primary' : 'border-transparent'}`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-md ${t.status === 'open' ? 'bg-amber-500/10 text-amber-500' : 'bg-green-500/10 text-green-500'}`}>
                        {t.status}
                      </span>
                      <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{format(new Date(t.createdAt), 'MMM dd')}</p>
                    </div>
                    <p className="font-black text-gray-800 dark:text-white mb-1 truncate text-sm">{t.subject}</p>
                    <div className="flex items-center gap-2 text-[11px] text-gray-500 font-medium">
                      <User size={10} className="text-primary" /> {t.user?.name}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right: Ticket Detail & Reply */}
        <div className="lg:col-span-2">
          <AnimatePresence mode="wait">
            {selectedTicket ? (
              <motion.div
                key={selectedTicket._id}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="bg-white dark:bg-gray-900 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-sm p-8 h-full flex flex-col"
              >
                <div className="flex items-center justify-between mb-8 pb-6 border-b border-gray-50 dark:border-gray-800">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-primary/20">
                      {selectedTicket.user?.name.charAt(0)}
                    </div>
                    <div>
                      <h2 className="font-black text-xl text-gray-800 dark:text-white leading-tight">{selectedTicket.subject}</h2>
                      <p className="text-xs text-gray-400 font-medium">{selectedTicket.user?.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-1">Status</p>
                    <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${selectedTicket.status === 'open' ? 'bg-amber-500/10 text-amber-500' : 'bg-green-500/10 text-green-500'}`}>
                      {selectedTicket.status}
                    </span>
                  </div>
                </div>

                <div className="flex-1 space-y-6 overflow-auto pr-2 custom-scrollbar">
                  <div className="bg-gray-50 dark:bg-gray-800/40 p-6 rounded-[1.5rem] border border-gray-100/50 dark:border-gray-700/30">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-1.5 h-4 bg-primary rounded-full" />
                      <p className="text-[10px] font-black text-primary uppercase tracking-widest">Query Description</p>
                    </div>
                    <p className="text-gray-700 dark:text-gray-300 font-medium leading-relaxed">
                      {selectedTicket.message}
                    </p>
                  </div>

                  {selectedTicket.reply && (
                    <div className="bg-green-500/5 p-6 rounded-[1.5rem] border border-green-500/10 ml-8 relative">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-1.5 h-4 bg-green-500 rounded-full" />
                        <p className="text-[10px] font-black text-green-500 uppercase tracking-widest">Admin Resolution</p>
                      </div>
                      <p className="text-gray-700 dark:text-gray-300 font-bold italic leading-relaxed">
                        "{selectedTicket.reply}"
                      </p>
                    </div>
                  )}
                </div>

                {selectedTicket.status === 'open' && (
                  <div className="mt-8 pt-8 border-t border-gray-50 dark:border-gray-800 space-y-4">
                    <textarea
                      placeholder="Enter your resolution or reply..."
                      rows={3}
                      value={reply}
                      onChange={(e) => setReply(e.target.value)}
                      className="w-full p-6 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-[1.5rem] border border-gray-100 dark:border-gray-700 outline-none focus:ring-2 focus:ring-primary/20 font-medium transition-all resize-none text-sm"
                    />
                    <button
                      onClick={() => replyMutation.mutate({ id: selectedTicket._id, reply })}
                      disabled={replyMutation.isPending || !reply}
                      className="w-full py-4 bg-gray-900 dark:bg-white dark:text-gray-900 text-white font-black rounded-xl shadow-xl flex items-center justify-center gap-3 hover:scale-[1.01] active:scale-0.98 transition-all disabled:opacity-50 uppercase text-xs tracking-widest"
                    >
                      <Send size={18} />
                      {replyMutation.isPending ? "Processing..." : "Resolve & Notify User"}
                    </button>
                  </div>
                )}
              </motion.div>
            ) : (
              <div className="bg-white dark:bg-gray-900 rounded-[2rem] border border-dashed border-gray-200 dark:border-gray-800 h-full flex flex-col items-center justify-center p-12 text-center">
                <div className="relative mb-6">
                  <div className="absolute inset-0 bg-primary/10 blur-2xl rounded-full scale-150 animate-pulse" />
                  <div className="relative w-20 h-20 bg-gray-50 dark:bg-gray-800 rounded-2xl flex items-center justify-center text-gray-300 border border-gray-100 dark:border-gray-700 shadow-xl">
                    <Inbox size={40} />
                  </div>
                </div>
                <h3 className="text-lg font-black text-gray-800 dark:text-white mb-2">Select a Ticket</h3>
                <p className="text-gray-400 font-medium text-sm max-w-[240px]">Choose a support request from the list to view its contents and provide a resolution.</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <ConfirmModal
        open={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={() => clearMutation.mutate()}
        title="Clear Resolved Tickets"
        message="Are you sure you want to permanently delete all closed support tickets? This action cannot be undone."
        confirmText="Clear All"
        confirmColor="bg-red-500"
      />
    </div>
  );
}

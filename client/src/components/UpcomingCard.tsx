import { Calendar, BookOpen } from "lucide-react";

export function UpcomingCard({ title, subject, dueDate }: any) {
  const isClose = new Date(dueDate).getTime() - new Date().getTime() < 3 * 24 * 60 * 60 * 1000;

  return (
    <div className="group p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-800 hover:shadow-lg hover:bg-white dark:hover:bg-gray-800 transition-all cursor-pointer">
      <div className="flex items-center gap-2 mb-3">
        <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest rounded-full flex items-center gap-1">
          <BookOpen size={10} /> {subject}
        </span>
      </div>
      <h3 className="font-bold text-gray-800 dark:text-white line-clamp-1 mb-3 group-hover:text-primary transition-colors">{title}</h3>
      <div className={`flex items-center gap-2 text-xs font-bold uppercase tracking-widest ${isClose ? "text-amber-500" : "text-gray-400"}`}>
        <Calendar size={14} /> Due {new Date(dueDate).toLocaleDateString()}
      </div>
    </div>
  );
}
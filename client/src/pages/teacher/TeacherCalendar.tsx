import { useState } from "react";
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  isSameMonth, 
  isSameDay, 
  addDays, 
  parseISO 
} from "date-fns";
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Clock, 
  BookOpen,
  Trash2
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getTeacherUpcomingAssignments } from "../../api/assignment.api";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import API from "../../api/axios";
import { openPDF } from "../../utils/file";
import { FileText } from "lucide-react";

interface Assignment {
  _id: string;
  title: string;
  deadline: string;
  pdfUrl?: string;
  subject: {
    name: string;
    code: string;
  };
}

export default function TeacherCalendar() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  const { data: assignments = [], isLoading } = useQuery({
    queryKey: ["teacher-upcoming-assignments"],
    queryFn: async () => {
      const res = await getTeacherUpcomingAssignments();
      return res.data as Assignment[];
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => API.delete(`/assignments/${id}`),
    onSuccess: () => {
      toast.success("Assignment deleted");
      qc.invalidateQueries({ queryKey: ["teacher-upcoming-assignments"] });
    },
    onError: () => toast.error("Failed to delete assignment")
  });

  const renderHeader = () => {
    return (
      <div className="p-8 text-white rounded-3xl bg-gradient-to-r from-[rgb(var(--primary))] to-[rgb(var(--secondary))] shadow-lg shadow-primary/20 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl">
            <CalendarIcon className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Teaching Schedule</h1>
            <p className="mt-1 opacity-90 font-medium">
              Manage your assignment deadlines and subject timelines
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4 bg-white/20 backdrop-blur-md p-2 rounded-2xl border border-white/30 self-end md:self-auto">
          <button 
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="p-2 hover:bg-white/20 rounded-xl transition-all"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <span className="text-lg font-bold min-w-[150px] text-center uppercase tracking-widest">
            {format(currentMonth, "MMMM yyyy")}
          </span>
          <button 
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="p-2 hover:bg-white/20 rounded-xl transition-all"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
          <div className="w-px h-8 bg-white/20 mx-2" />
          <button 
            onClick={() => navigate("/teacher/subjects")}
            className="px-6 py-2 bg-white text-[rgb(var(--primary))] font-bold rounded-xl shadow-lg hover:scale-105 transition-all text-[10px] uppercase tracking-widest whitespace-nowrap"
          >
            + Create New
          </button>
        </div>
      </div>
    );
  };

  const renderDays = () => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    return (
      <div className="grid grid-cols-7 mb-4">
        {days.map((day, index) => (
          <div key={index} className="text-center font-bold text-gray-400 text-xs uppercase tracking-widest py-2">
            {day}
          </div>
        ))}
      </div>
    );
  };

  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const rows = [];
    let days = [];
    let day = startDate;
    let formattedDate = "";

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        formattedDate = format(day, "d");
        const cloneDay = day;
        
        const dayAssignments = assignments.filter(asg => 
          isSameDay(parseISO(asg.deadline), cloneDay)
        );

        days.push(
          <div
            key={day.toString()}
            className={`min-h-[140px] p-3 border border-gray-50 dark:border-gray-800 transition-all relative group
              ${!isSameMonth(day, monthStart) ? "bg-gray-50/30 dark:bg-gray-900/10 opacity-30" : "bg-white dark:bg-gray-900 hover:bg-gray-50/50 dark:hover:bg-gray-800/50"}
              ${isSameDay(day, selectedDate) ? "ring-2 ring-[rgb(var(--primary))] ring-inset shadow-lg z-10" : ""}
            `}
            onClick={() => setSelectedDate(cloneDay)}
          >
            <span className={`text-sm font-bold ${isSameDay(day, new Date()) ? "bg-[rgb(var(--primary))] text-white w-8 h-8 flex items-center justify-center rounded-full" : "text-gray-400 group-hover:text-[rgb(var(--primary))] transition-colors"}`}>
              {formattedDate}
            </span>
            
            <div className="mt-2 space-y-1.5 overflow-y-auto max-h-[90px] scrollbar-hide">
              {dayAssignments.map((asg) => (
                <div 
                  key={asg._id}
                  className="p-2 rounded-xl text-[10px] font-bold bg-gradient-to-r from-[rgb(var(--primary))]/10 to-[rgb(var(--secondary))]/10 border border-[rgb(var(--primary))]/20 text-[rgb(var(--primary))] flex flex-col gap-0.5 shadow-sm hover:scale-[1.02] transition-transform"
                >
                  <div className="flex items-center gap-1 opacity-70 uppercase tracking-tighter">
                    <BookOpen size={10} />
                    {asg.subject.code}
                  </div>
                  <div className="line-clamp-1 leading-tight">{asg.title}</div>
                </div>
              ))}
            </div>

            {dayAssignments.length > 0 && (
              <div className="absolute top-3 right-3 w-2 h-2 bg-[rgb(var(--primary))] rounded-full animate-pulse shadow-[0_0_8px_rgb(var(--primary))]" />
            )}
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div className="grid grid-cols-7" key={day.toString()}>
          {days}
        </div>
      );
      days = [];
    }
    return <div className="rounded-3xl overflow-hidden shadow-xl border border-gray-100 dark:border-gray-800">{rows}</div>;
  };

  const renderSelectedDayDetails = () => {
    const dayAssignments = assignments.filter(asg => 
      isSameDay(parseISO(asg.deadline), selectedDate)
    );

    return (
      <div className="mt-8 bg-white dark:bg-gray-900 rounded-[2.5rem] p-8 shadow-xl border border-gray-100 dark:border-gray-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
              {format(selectedDate, "EEEE, MMMM do")}
            </h2>
            <p className="text-gray-500 font-medium">Assignment Timeline</p>
          </div>
          <div className="px-6 py-2 bg-gray-50 dark:bg-gray-800 rounded-full border border-gray-100 dark:border-gray-700 font-bold text-[rgb(var(--primary))] flex items-center gap-2 self-start md:self-auto">
            <Clock size={18} />
            {dayAssignments.length} {dayAssignments.length === 1 ? "Deadline" : "Deadlines"}
          </div>
        </div>

        {dayAssignments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {dayAssignments.map((asg) => (
              <div 
                key={asg._id}
                className="group relative p-6 bg-gray-50 dark:bg-gray-800/50 rounded-3xl border border-gray-100 dark:border-gray-700 hover:border-[rgb(var(--primary))]/50 transition-all hover:shadow-lg hover:shadow-primary/5"
              >
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <BookOpen size={48} className="text-[rgb(var(--primary))]" />
                </div>
                
                <div className="flex items-center gap-2 mb-4">
                  <span className="px-3 py-1 bg-[rgb(var(--primary))]/10 text-[rgb(var(--primary))] rounded-full text-[10px] font-extrabold uppercase tracking-widest border border-primary/10">
                    {asg.subject.code}
                  </span>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    Due at {format(parseISO(asg.deadline), "h:mm a")}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-2 line-clamp-2">
                  {asg.title}
                </h3>
                <p className="text-sm text-gray-500 font-medium">
                  {asg.subject.name}
                </p>

                <div className="mt-6 flex items-center gap-3">
                   <button 
                     onClick={() => navigate("/teacher/subjects")}
                     className="flex-1 py-3 bg-[rgb(var(--primary))] text-white font-bold rounded-2xl shadow-md shadow-primary/20 hover:opacity-90 transition-all text-xs uppercase tracking-widest"
                   >
                     Manage
                   </button>
                   <button 
                     onClick={() => {
                        if(confirm("Delete this assignment?")) {
                          deleteMutation.mutate(asg._id);
                        }
                     }}
                     className="p-3 bg-white dark:bg-gray-900 text-red-500 font-bold rounded-2xl border border-gray-100 dark:border-gray-800 hover:bg-red-50 transition-all shadow-sm"
                   >
                     <Trash2 size={18} />
                   </button>
                   {asg.pdfUrl && (
                     <button
                       onClick={() => openPDF(asg.pdfUrl!)}
                       className="p-3 bg-orange-50 dark:bg-gray-900 text-orange-500 font-bold rounded-2xl border border-orange-100 dark:border-gray-800 hover:bg-orange-100 transition-all shadow-sm"
                       title="View PDF"
                     >
                       <FileText size={18} />
                     </button>
                   )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/30 rounded-3xl border border-dashed border-gray-200 dark:border-gray-700">
            <div className="p-4 bg-white dark:bg-gray-900 rounded-2xl w-fit mx-auto mb-4 shadow-sm">
              <CalendarIcon className="w-8 h-8 text-gray-300" />
            </div>
            <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">No deadlines on this day</p>
          </div>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[rgb(var(--primary))] border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 font-bold animate-pulse">Loading Schedule...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-theme min-h-screen -m-6 p-8">
      {renderHeader()}
      {renderDays()}
      {renderCells()}
      {renderSelectedDayDetails()}
    </div>
  );
}

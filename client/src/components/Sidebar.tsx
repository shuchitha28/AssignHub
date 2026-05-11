import {
  LayoutDashboard,
  BookOpen,
  FileText,
  Users,
  Settings,
  LogOut,
  NotebookPen,
  CalendarDays,
  ClipboardCheck,
  BarChart3,
  UserCheck,
  MessageSquare,
} from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import API from "../api/axios";
import { getFileUrl } from "../utils/file";

export default function Sidebar({ role = "admin" }: any) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: settingsData } = useQuery({
    queryKey: ["settings"],
    queryFn: () => API.get("/settings"),
  });

  const branding = settingsData?.data?.data || {};

  const linkClass = ({ isActive }: any) =>
    `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
      isActive
        ? "bg-gradient-to-r from-primary to-secondary text-white shadow-lg shadow-primary/20"
        : "text-gray-600 dark:text-gray-300 hover:bg-primary/10 hover:text-primary"
    }`;

  const handleLogout = () => {
    localStorage.clear();
    queryClient.clear();
    toast.success("Logged out successfully");
    navigate("/", { replace: true });
  };

  return (
    <div className="flex flex-col justify-between w-64 p-5 bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 transition h-screen sticky top-0">
      
      {/* TOP SECTION */}
      <div>
        {/* LOGO AREA WITH THEME BACKGROUND */}
        <div className="bg-primary/5 p-4 rounded-[2.5rem] mb-8 border border-primary/10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center text-white shadow-xl shadow-primary/20 overflow-hidden">
              {branding.logo ? (
                <img src={getFileUrl(branding.logo)} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <BookOpen size={24} strokeWidth={2.5} />
              )}
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-black tracking-tighter text-gray-800 dark:text-white leading-none">
                {branding.siteName ? (
                   branding.siteName
                ) : (
                  <>Assign<span className="text-primary">Hub</span></>
                )}
              </span>
              <span className="text-[9px] font-bold text-primary uppercase tracking-[0.3em] mt-1">
                Elite Edition
              </span>
            </div>
          </div>
        </div>

        <nav className="space-y-2">
          {/* ================= ADMIN ================= */}
          {role === "admin" && (
            <>
              <NavLink to="/admin/dashboard" className={linkClass}>
                <LayoutDashboard size={18}/> Dashboard
              </NavLink>
              <NavLink to="/admin/courses" className={linkClass}>
                <BookOpen size={18}/> Courses
              </NavLink>
              <NavLink to="/admin/users" className={linkClass}>
                <Users size={18}/> Users
              </NavLink>
              <NavLink to="/admin/assignments" className={linkClass}>
                <FileText size={18}/> Assignments
              </NavLink>
              <NavLink to="/admin/enrollments" className={linkClass}>
                <UserCheck size={18}/> Enrollments
              </NavLink>
              <NavLink to="/admin/support" className={linkClass}>
                <MessageSquare size={18}/> Support Center
              </NavLink>
            </>
          )}

          {/* ================= STUDENT ================= */}
          {role === "student" && (
            <>
              <NavLink to="/student/dashboard" className={linkClass}>
                <LayoutDashboard size={18}/> Dashboard
              </NavLink>
              <NavLink to="/student/courses" className={linkClass}>
                <BookOpen size={18}/> My Courses
              </NavLink>
              <NavLink to="/student/assignments" className={linkClass}>
                <FileText size={18}/> Assignments
              </NavLink>
              <NavLink to="/student/notepad" className={linkClass}>
                <NotebookPen size={18}/> Notepad
              </NavLink>
              <NavLink to="/student/calendar" className={linkClass}>
                <CalendarDays size={18}/> Calendar
              </NavLink>
            </>
          )}

          {/* ================= TEACHER ================= */}
          {role === "teacher" && (
            <>
              <NavLink to="/teacher/dashboard" className={linkClass}>
                <LayoutDashboard size={18}/> Dashboard
              </NavLink>
              <NavLink to="/teacher/subjects" className={linkClass}>
                <BookOpen size={18}/> My Subjects
              </NavLink>
              <NavLink to="/teacher/review" className={linkClass}>
                <ClipboardCheck size={18}/> Review
              </NavLink>
              <NavLink to="/teacher/report" className={linkClass}>
                <BarChart3 size={18}/> Report Card
              </NavLink>
            </>
          )}
        </nav>
      </div>

      {/* BOTTOM SECTION */}
      <div className="space-y-2">
        <NavLink
          to={
            role === "admin"
              ? "/admin/settings"
              : role === "teacher"
              ? "/teacher/settings"
              : "/student/settings"
          }
          className={linkClass}
        >
          <Settings size={18}/> Settings
        </NavLink>

        <button
          onClick={handleLogout}
          className="flex items-center w-full gap-3 px-4 py-3 text-red-500 transition rounded-xl hover:bg-red-100 dark:hover:bg-red-900/20"
        >
          <LogOut size={18} /> Logout
        </button>
      </div>

    </div>
  );
}
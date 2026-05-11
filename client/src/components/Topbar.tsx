import { Sun, Moon } from "lucide-react";
import { useTheme } from "../hooks/useTheme";
import { useQuery } from "@tanstack/react-query";
import API from "../api/axios";
import Notifications from "./Notifications";
import { getFileUrl } from "../utils/file";


export default function Topbar() {
  const { theme, toggleTheme } = useTheme();

  // Fetch real-time profile data
  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: () => API.get("/profile/me"),
  });

  const user = profile?.data || JSON.parse(localStorage.getItem("user") || "{}");
  const name = user?.name || "User";
  const role = user?.role || "student";

  const roleColor =
    role === "admin"
      ? "text-red-500 bg-red-500/10"
      : role === "teacher"
      ? "text-blue-500 bg-blue-500/10"
      : "text-green-500 bg-green-500/10";

  return (
    <div className="p-2 flex items-center justify-between h-20 px-8 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800 sticky top-0 z-40 transition-all">
      
      <div />

      {/* Right Actions */}
      <div className="flex items-center gap-6">
        <Notifications />
        
        {/* Quick Actions */}
        <div className="flex items-center gap-3 pr-6 border-r border-gray-100 dark:border-gray-800">
          <button
            onClick={() => toggleTheme(true)}
            className="p-3 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 rounded-2xl transition-all"
          >
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>

        {/* Profile Section */}
        <div className="flex items-center gap-4 cursor-pointer group">
          <div className="flex flex-col items-end leading-tight">
            <span className="text-sm font-black text-gray-800 dark:text-white group-hover:text-[rgb(var(--primary))] transition-colors">
              {name}
            </span>
            <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg mt-0.5 ${roleColor}`}>
              {role}
            </span>
          </div>

          <div className="relative">
            <div className="w-11 h-11 rounded-2xl overflow-hidden border-2 border-white dark:border-gray-800 shadow-sm group-hover:shadow-md group-hover:scale-105 transition-all">
              <img
                src={getFileUrl(user?.profilePicture) || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&size=100`}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-gray-900" />
          </div>
        </div>

      </div>
    </div>
  );
}
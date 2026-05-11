import { useQuery } from "@tanstack/react-query";
import { getUsers } from "../../api/user.api";
import UserTable from "../../components/UserTable";
import { motion } from "framer-motion";
import { useState, useMemo } from "react";
import CreateUserModal from "../../components/CreateUserModal";
import { 
  Users, 
  UserCheck, 
  UserPlus, 
  Search, 
  Filter, 
  GraduationCap, 
  ShieldCheck, 
  UserCog,
  LayoutGrid
} from "lucide-react";
import { Card } from "../../components/Card";
import { Select } from "../../components/Select";

export default function UsersPage() {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [openCreate, setOpenCreate] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ["users"],
    queryFn: getUsers,
  });

  const users = useMemo(() => data?.data || [], [data]);

  const filtered = useMemo(() => {
    return users.filter((u: any) => {
      const matchSearch = (u.name || "").toLowerCase().includes(search.toLowerCase()) || 
                          (u.email || "").toLowerCase().includes(search.toLowerCase());
      const matchRole = roleFilter === "all" || u.role === roleFilter;
      return matchSearch && matchRole;
    });
  }, [users, search, roleFilter]);

  const stats = useMemo(() => ({
    total: users.length,
    students: users.filter((u: any) => u.role === "student").length,
    teachers: users.filter((u: any) => u.role === "teacher").length,
    admins: users.filter((u: any) => u.role === "admin").length
  }), [users]);

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (error) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
      <div className="w-20 h-20 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center text-red-500">
        <ShieldCheck size={40} />
      </div>
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Failed to Load Users</h2>
      <p className="text-gray-500 max-w-xs mx-auto">There was an error connecting to the server. Please try again later.</p>
    </div>
  );

  return (
    <div className="space-y-8 pb-12">
      {/* HERO SECTION */}
      <div className="p-8 md:p-8 text-white rounded-[2.5rem] bg-gradient-to-br from-[rgb(var(--primary))] to-[rgb(var(--secondary))] shadow-xl shadow-[rgb(var(--primary))]/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full -ml-16 -mb-16 blur-2xl" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-bold uppercase tracking-wider mb-2">
              <UserCog size={12} className="mr-2" /> Administration
            </div>
            <h1 className="text-4xl font-black tracking-tight">User Management</h1>
            <p className="opacity-80 font-medium max-w-lg">
              Manage student, teacher, and administrator accounts across the AssignHub platform.
            </p>
          </div>
          
          <button
            onClick={() => setOpenCreate(true)}
            className="px-8 py-4 bg-white text-primary hover:bg-gray-50 rounded-2xl font-bold flex items-center gap-2 shadow-xl transition-all transform hover:scale-[1.02] active:scale-[0.98]"
          >
            <UserPlus size={20} /> Add New User
          </button>
        </div>
      </div>

      {/* STATS SUMMARY */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card 
          title="Total Users" 
          value={stats.total} 
          icon={<Users size={24} className="text-blue-500" />} 
        />
        <Card 
          title="Students" 
          value={stats.students} 
          icon={<GraduationCap size={24} className="text-indigo-500" />} 
        />
        <Card 
          title="Teachers" 
          value={stats.teachers} 
          icon={<UserCheck size={24} className="text-green-500" />} 
        />
        <Card 
          title="Admins" 
          value={stats.admins} 
          icon={<ShieldCheck size={24} className="text-purple-500" />} 
        />
      </div>

      {/* SEARCH & FILTERS */}
      <div className="flex flex-col lg:flex-row gap-4 items-center justify-between bg-white dark:bg-gray-900 p-4 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm">
        <div className="relative w-full lg:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none transition-all"
          />
        </div>
        
        <div className="flex flex-wrap gap-3 items-center w-full lg:w-auto">
          <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 px-4 py-3 rounded-2xl border-none">
            <Filter size={16} className="text-gray-400" />
          <Select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            containerClassName="w-full md:w-48"
            className="!py-3 !rounded-2xl"
          >
            <option value="all">All Roles</option>
            <option value="student">Students</option>
            <option value="teacher">Teachers</option>
            <option value="admin">Admins</option>
          </Select>
          </div>
          
          <div className="px-4 py-3 bg-primary/5 text-primary rounded-2xl text-xs font-bold uppercase tracking-widest border border-primary/10 flex items-center gap-2">
            <LayoutGrid size={14} /> Found {filtered.length} Users
          </div>
        </div>
      </div>

      {/* TABLE SECTION */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-900 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden"
      >
        <UserTable users={filtered} />
      </motion.div>

      <CreateUserModal
        open={openCreate}
        onClose={() => setOpenCreate(false)}
      />
    </div>
  );
}
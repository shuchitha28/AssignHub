import { useState, useEffect } from "react";
import { Users, BookOpen, Layers, User, TrendingUp, ArrowUpRight, Activity, Calendar, LayoutDashboard } from "lucide-react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { getDashboard } from "../../api/dashboard.api";
import { useTheme } from "../../hooks/useTheme";

import {
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  AreaChart,
  Area,
} from "recharts";

export default function Dashboard() {
  const { colorTheme } = useTheme();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const { data, isLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: getDashboard,
  });

  const stats = data?.data;

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-12 h-12 border-4 border-[rgb(var(--primary))] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-8 pb-12">
      {/* HERO / WELCOME SECTION */}
      <div className="p-8 md:p-8 text-white rounded-[2.5rem] bg-gradient-to-br from-[rgb(var(--primary))] to-[rgb(var(--secondary))] shadow-xl shadow-[rgb(var(--primary))]/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full -ml-16 -mb-16 blur-2xl" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="space-y-4">
            <div className="inline-flex items-center px-4 py-1.5 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-2">
              <LayoutDashboard size={14} className="mr-2" /> Admin Portal
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight">System Insights</h1>
            <p className="opacity-90 font-medium max-w-xl text-lg leading-relaxed">
              Real-time analytics and platform overview for AssignHub. Monitor academic growth and user engagement.
            </p>
          </div>

          <div className="hidden lg:block relative">
            <div className="absolute inset-0 bg-white/10 blur-3xl rounded-full scale-150" />
            <div className="relative w-32 h-32 bg-white/10 backdrop-blur-xl rounded-[2.5rem] border border-white/20 flex items-center justify-center shadow-2xl">
              <TrendingUp size={64} className="text-white opacity-80" />
            </div>
          </div>
        </div>
      </div>

      {/* CORE STATS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <EnhancedStatCard
          label="Total Students"
          value={stats?.students || 0}
          icon={<Users className="text-blue-500" />}
          trend="+12% vs last month"
          color="blue"
        />
        <EnhancedStatCard
          label="Faculty Members"
          value={stats?.teachers || 0}
          icon={<User className="text-indigo-500" />}
          trend="+3% vs last month"
          color="indigo"
        />
        <EnhancedStatCard
          label="Active Courses"
          value={stats?.courses || 0}
          icon={<BookOpen className="text-purple-500" />}
          trend="Steady growth"
          color="purple"
        />
        <EnhancedStatCard
          label="Subjects"
          value={stats?.subjects || 0}
          icon={<Layers className="text-pink-500" />}
          trend="+8 added this week"
          color="pink"
        />
      </div>

      {/* ANALYTICS & ACTIVITY SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* ENROLLMENT TREND CHART */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div className="space-y-1">
              <h2 className="text-2xl font-black text-gray-800 dark:text-white tracking-tight">Registration Velocity</h2>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-widest flex items-center gap-2">
                <TrendingUp size={14} className="text-green-500" /> Student Onboarding (Last 6 Months)
              </p>
            </div>
            <select className="bg-gray-50 dark:bg-gray-800 px-4 py-2 rounded-xl text-xs font-bold border-none outline-none">
              <option>Last 6 Months</option>
              <option>Last Year</option>
            </select>
          </div>

          <div className="w-full relative min-h-[300px]">
            {isMounted && (
              <ResponsiveContainer width="100%" aspect={3}>
                <AreaChart data={stats?.trends || []}>
                  <defs>
                    <linearGradient id="colorStudents" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="rgb(var(--primary))" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="rgb(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fontWeight: 700, fill: '#9ca3af' }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fontWeight: 700, fill: '#9ca3af' }}
                  />
                  <Tooltip
                    contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', padding: '16px' }}
                    itemStyle={{ fontWeight: 800, fontSize: '14px', color: 'rgb(var(--primary))' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="students"
                    stroke="rgb(var(--primary))"
                    strokeWidth={4}
                    fillOpacity={1}
                    fill="url(#colorStudents)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* RECENT ACTIVITY FEED */}
        <div className="bg-white dark:bg-gray-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <div className="space-y-1">
              <h2 className="text-2xl font-black text-gray-800 dark:text-white tracking-tight">Activity</h2>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest flex items-center gap-1.5">
                <Activity size={12} className="text-[rgb(var(--primary))]" /> Real-time Feed
              </p>
            </div>
          </div>

          <div className="space-y-6 flex-1 overflow-y-auto max-h-[350px] pr-2 custom-scrollbar">
            {stats?.activity?.length > 0 ? (
              stats.activity.map((act: any, idx: number) => (
                <div key={idx} className="flex gap-4 group">
                  <div className={`w-10 h-10 rounded-2xl flex-shrink-0 flex items-center justify-center ${act.type === 'user' ? 'bg-blue-50 text-blue-500' : 'bg-purple-50 text-purple-500'
                    }`}>
                    {act.type === 'user' ? <User size={18} /> : <BookOpen size={18} />}
                  </div>
                  <div className="space-y-1 overflow-hidden">
                    <p className="text-sm font-bold text-gray-700 dark:text-gray-200 truncate group-hover:text-[rgb(var(--primary))] transition-colors">
                      {act.text}
                    </p>
                    <p className="text-[10px] text-gray-400 font-medium flex items-center gap-1">
                      <Calendar size={10} /> {new Date(act.time).toLocaleDateString()} at {new Date(act.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-20 text-gray-400 font-bold">
                No recent activity.
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}

/* HELPER COMPONENTS */

function EnhancedStatCard({ label, value, icon, trend, color }: any) {
  return (
    <motion.div
      whileHover={{ y: -5 }}
      className="bg-white dark:bg-gray-900 p-6 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm relative overflow-hidden group"
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-2xl bg-opacity-10 group-hover:scale-110 transition-transform ${color === 'blue' ? 'bg-blue-500' :
            color === 'indigo' ? 'bg-indigo-500' :
              color === 'purple' ? 'bg-purple-500' : 'bg-pink-500'
          }`}>
          {icon}
        </div>
      </div>

      <div className="space-y-1">
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</p>
        <h3 className="text-3xl font-black text-gray-800 dark:text-white tracking-tight">{value}</h3>
      </div>
    </motion.div>
  );
}
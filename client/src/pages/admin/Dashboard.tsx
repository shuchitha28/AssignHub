import { useState, useEffect } from "react";
import { Users, BookOpen, Layers, User, TrendingUp, Activity, Calendar, LayoutDashboard } from "lucide-react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { getDashboard } from "../../api/dashboard.api";


import {
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  AreaChart,
  Area,  
  PieChart,
  Pie,
  Cell,
  Legend,
  BarChart,
  Bar,
  LineChart,
  Line
} from "recharts";

  const COLORS = [
  "#8b5cf6",
  "#06b6d4",
  "#ec4899",
  "#10b981",
  "#f59e0b",
];

export default function Dashboard() {
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
          color="blue"
        />
        <EnhancedStatCard
          label="Faculty Members"
          value={stats?.teachers || 0}
          icon={<User className="text-indigo-500" />}
          color="indigo"
        />
        <EnhancedStatCard
          label="Active Courses"
          value={stats?.courses || 0}
          icon={<BookOpen className="text-purple-500" />}
          color="purple"
        />
        <EnhancedStatCard
          label="Subjects"
          value={stats?.subjects || 0}
          icon={<Layers className="text-pink-500" />}
          color="pink"
        />
      </div>

      {/* ANALYTICS & ACTIVITY SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* ENROLLMENT TREND CHART */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div className="space-y-1">
              <h2 className="text-2xl font-black text-gray-800 dark:text-white tracking-tight">Registration Analytics</h2>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-widest flex items-center gap-2">
                <TrendingUp size={14} className="text-green-500" /> Student Onboarding (Last 1 Months)
              </p>
            </div>
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
                    <linearGradient id="colorTeachers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                    </linearGradient>
                    
                    <linearGradient id="colorCourses" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    
                    <linearGradient id="colorSubjects" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    dy={10}
                    tick={{
                      fontSize: 10,
                      fontWeight: 700,
                      fill: "#9ca3af"
                    }}
                    tickFormatter={(value) =>
                      new Date(value).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short"
                      })
                    }minTickGap={20}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fontWeight: 700, fill: '#9ca3af' }}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "24px",
                      border: "none",
                      boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)",
                      padding: "16px",
                      background: "#fff"
                    }}
                    labelStyle={{
                      fontWeight: 900,
                      marginBottom: "10px",
                      color: "#111827"
                    }}
                    formatter={(value: any, name: any) => [
                      value,
                      name.charAt(0).toUpperCase() + name.slice(1)
                    ]}
                    labelFormatter={(label) =>
                      new Date(label).toLocaleDateString("en-IN", {
                        weekday: "short",
                        day: "2-digit",
                        month: "long",
                        year: "numeric"
                      })
                    }
                  />
                  <Area
                    type="monotone"
                    dataKey="students"
                    stroke="#8b5cf6"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorStudents)"
                  />
                  
                  <Area
                    type="monotone"
                    dataKey="teachers"
                    stroke="#06b6d4"
                    strokeWidth={3}
                    fill="url(#colorTeachers)"
                  />
                  
                  <Area
                    type="monotone"
                    dataKey="courses"
                    stroke="#10b981"
                    strokeWidth={3}
                    fill="url(#colorCourses)"
                  />
                  
                  <Area
                    type="monotone"
                    dataKey="subjects"
                    stroke="#f59e0b"
                    strokeWidth={3}
                    fill="url(#colorSubjects)"
                  />
                  
                  <Legend />
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
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
  
      {/* USER DISTRIBUTION */}
<div className="bg-white dark:bg-gray-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm">
  <div className="mb-6">
    <h2 className="text-2xl font-black">User Distribution</h2>
  </div>

  <ResponsiveContainer width="100%" height={320}>
    <PieChart>
      <Pie
        data={stats?.userDistribution || []}
        dataKey="value"
        nameKey="_id"
        outerRadius={120}
        label
      >
        {(stats?.userDistribution || []).map((_: any, index: number) => (
          <Cell
            key={index}
            fill={COLORS[index % COLORS.length]}
          />
        ))}
      </Pie>

      <Tooltip />
      <Legend />
    </PieChart>
  </ResponsiveContainer>
</div>
{/* COURSE DISTRIBUTION */}
<div className="bg-white dark:bg-gray-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm">
  <div className="mb-6">
    <h2 className="text-2xl font-black">Course Distribution</h2>

    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">
      Subjects per Course
    </p>
  </div>

  <ResponsiveContainer width="100%" height={320}>
    <PieChart>
      <Pie
        data={stats?.courseDistribution || []}
        dataKey="value"
        nameKey="_id"
        outerRadius={120}
        label
      >
        {(stats?.courseDistribution || []).map((_: any, index: number) => (
          <Cell
            key={index}
            fill={COLORS[index % COLORS.length]}
          />
        ))}
      </Pie>

      <Tooltip />
      <Legend />
    </PieChart>
  </ResponsiveContainer>
</div>

  {/* ASSIGNMENT CREATION */}
<div className="bg-white dark:bg-gray-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm">
  <div className="mb-6">
    <h2 className="text-2xl font-black">Assignments by Teachers</h2>
  </div>

  <ResponsiveContainer width="100%" height={300}>
    <BarChart data={stats?.assignmentPerTeacher || []}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis
        dataKey="_id"
        angle={-15}
        textAnchor="end"
        interval={0}
        height={60}
        tick={{ fontSize: 11 }}
      />
      <YAxis />
      <Tooltip />

      <Bar
        dataKey="assignments"
        fill="rgb(var(--primary))"
        radius={[10, 10, 0, 0]}
      />
    </BarChart>
  </ResponsiveContainer>
</div>  
     {/* PASTE ANALYTICS */}
<div className="bg-white dark:bg-gray-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm">
  <div className="mb-6">
    <h2 className="text-2xl font-black">Paste Usage Analytics</h2>
    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">
      Student count (&gt;30% pasted content) across different teachers.
    </p>
  </div>

  <ResponsiveContainer width="100%" height={300}>
    <LineChart data={stats?.pasteAnalytics || []}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis
  dataKey="_id"
  angle={-15}
  textAnchor="end"
  interval={0}
  height={60}
  tick={{ fontSize: 11 }}
/>
      <YAxis />
      <Tooltip />
      <Line
        type="monotone"
        dataKey="count"
        stroke="rgb(var(--primary))"
        strokeWidth={4}
      />
    </LineChart>
  </ResponsiveContainer>
</div>
             
{/* SUBJECT & COURSE SUBMISSION ANALYTICS */}

<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.4 }}
  className="lg:col-span-2 bg-white dark:bg-gray-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm relative overflow-hidden"
>
  <div className="absolute top-0 right-0 w-40 h-40 bg-[rgb(var(--primary))]/5 blur-3xl rounded-full" />

  <div className="relative z-10">
    <div className="mb-8">
      <h2 className="text-2xl font-black text-gray-800 dark:text-white tracking-tight">
        Submission Status by Subject
      </h2>

      <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">
        Stacked Submission Analytics
      </p>
    </div>

    {stats?.submissionStatusBySubject?.length > 0 ? (
      <ResponsiveContainer width="100%" height={450}>
        <BarChart
          data={stats.submissionStatusBySubject}
          margin={{
            top: 20,
            right: 30,
            left: 10,
            bottom: 70
          }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke="#f0f0f0"
          />

          <XAxis
            dataKey="subject"
            angle={-15}
            textAnchor="end"
            interval={0}
            height={80}
            tick={{
              fontSize: 11,
              fontWeight: 700,
              fill: "#9ca3af"
            }}
              tickFormatter={(value, index) => {
    const item = stats?.submissionStatusBySubject?.[index];
    return `${value} (${item?.course || ""})`;
  }}
          />

          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{
              fontSize: 11,
              fontWeight: 700,
              fill: "#9ca3af"
            }}
          />

          <Tooltip
              formatter={(value: any, name: any) => [value, name]}
  labelFormatter={(label: any, payload: any) => {
    if (payload?.length) {
      return `${payload[0].payload.subject} (${payload[0].payload.course})`;
    }
    return label;
  }}
            contentStyle={{
              borderRadius: "20px",
              border: "none",
              boxShadow: "0 10px 30px rgba(0,0,0,0.1)"
            }}
          />

          <Legend />

          {/* STACKED BARS */}

          <Bar
            dataKey="submitted"
            stackId="a"
            fill="#8b5cf6"
            radius={[0, 0, 0, 0]}
          />

          <Bar
            dataKey="reviewed"
            stackId="a"
            fill="#10b981"
            radius={[0, 0, 0, 0]}
          />

          <Bar
            dataKey="draft"
            stackId="a"
            fill="#f59e0b"
            radius={[0, 0, 0, 0]}
          />

          <Bar
            dataKey="revision_requested"
            stackId="a"
            fill="#ef4444"
            radius={[8, 8, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    ) : (
      <div className="h-[350px] flex items-center justify-center text-gray-400 font-bold">
        No submission analytics available
      </div>
    )}
  </div>
</motion.div>

</div>
    </div>
  );
}

/* HELPER COMPONENTS */

function EnhancedStatCard({ label, value, icon, color }: any) {
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

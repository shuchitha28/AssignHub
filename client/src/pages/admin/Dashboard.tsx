import { useEffect, useState } from "react";
import {
  Users,
  BookOpen,
  Layers,
  User,
  TrendingUp,
  Activity,
  Calendar,
  LayoutDashboard,
} from "lucide-react";

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
  BarChart,
  Bar,
  LineChart,
  Line,
  Legend,
} from "recharts";

const COLORS = [
  "#8b5cf6",
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
];

export default function Dashboard() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { data, isLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: getDashboard,
  });

const stats = data || {};

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="w-12 h-12 border-4 border-[rgb(var(--primary))] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20">

      {/* HERO */}
      <div className="p-10 rounded-[2.5rem] bg-gradient-to-br from-[rgb(var(--primary))] to-[rgb(var(--secondary))] text-white relative overflow-hidden">

        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32" />

        <div className="relative z-10 flex justify-between items-center">
          <div>
            <div className="inline-flex items-center px-4 py-2 bg-white/20 rounded-full text-xs font-black uppercase tracking-[0.2em] mb-4">
              <LayoutDashboard size={14} className="mr-2" />
              Admin Portal
            </div>

            <h1 className="text-5xl font-black">
              System Insights
            </h1>

            <p className="mt-4 opacity-90 max-w-2xl">
              Advanced AMS analytics dashboard with real-time assignment,
              submission insights.
            </p>
          </div>

          <div className="hidden lg:flex w-32 h-32 rounded-[2rem] bg-white/10 items-center justify-center">
            <TrendingUp size={60} />
          </div>
        </div>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">

        <StatCard
          label="Students"
          value={stats.students || 0}
          icon={<Users className="text-blue-500" />}
        />

        <StatCard
          label="Teachers"
          value={stats.teachers || 0}
          icon={<User className="text-indigo-500" />}
        />

        <StatCard
          label="Courses"
          value={stats.courses || 0}
          icon={<BookOpen className="text-purple-500" />}
        />

        <StatCard
          label="Subjects"
          value={stats.subjects || 0}
          icon={<Layers className="text-pink-500" />}
        />
      </div>

      {/* REGISTRATION + ACTIVITY */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">

        {/* AREA CHART */}
        <ChartCard title="Registration Velocity" className="xl:col-span-2">

          <div className="h-[350px]">

            {mounted && (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.trends || []}>

                  <defs>
                    <linearGradient id="studentGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="5%"
                        stopColor="rgb(var(--primary))"
                        stopOpacity={0.3}
                      />

                      <stop
                        offset="95%"
                        stopColor="rgb(var(--primary))"
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>

                  <CartesianGrid strokeDasharray="3 3" />

                  <XAxis dataKey="month" />

                  <YAxis />

                  <Tooltip />

                  <Area
                    type="monotone"
                    dataKey="students"
                    stroke="rgb(var(--primary))"
                    fill="url(#studentGradient)"
                    strokeWidth={4}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </ChartCard>

        {/* ACTIVITY */}
        <ChartCard title="Recent Activity">

          <div className="space-y-5 max-h-[350px] overflow-y-auto">

            {(stats.activity || []).map((act: any, idx: number) => (
              <div key={idx} className="flex gap-4">

                <div className="w-10 h-10 rounded-2xl bg-purple-100 flex items-center justify-center">
                  <Activity size={18} className="text-purple-500" />
                </div>

                <div>
                  <p className="font-bold text-sm dark:text-white">
                    {act.text}
                  </p>

                  <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                    <Calendar size={10} />
                    {new Date(act.time).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </ChartCard>
      </div>

      {/* PIE CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        <ChartCard title="User Distribution">

          <div className="h-[350px]">

            {mounted && (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>

                  <Pie
                    data={stats.userDistribution || []}
                    dataKey="value"
                    nameKey="name"
                    outerRadius={120}
                    label
                  >
                    {(stats.userDistribution || []).map(
                      (_: any, index: number) => (
                        <Cell
                          key={index}
                          fill={COLORS[index % COLORS.length]}
                        />
                      )
                    )}
                  </Pie>

                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </ChartCard>

        <ChartCard title="Submission Status">

          <div className="h-[350px]">

            {mounted && (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>

                  <Pie
                    data={stats.submissionStats || []}
                    dataKey="value"
                    outerRadius={120}
                    label
                  >
                    {(stats.submissionStats || []).map(
                      (_: any, index: number) => (
                        <Cell
                          key={index}
                          fill={COLORS[index % COLORS.length]}
                        />
                      )
                    )}
                  </Pie>

                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </ChartCard>
      </div>

      {/* BAR CHART */}
      <ChartCard title="Subject Assignments">

        <div className="h-[400px]">

          {mounted && (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.subjectAssignments || []}>

                <CartesianGrid strokeDasharray="3 3" />

                <XAxis dataKey="subject" />

                <YAxis />

                <Tooltip />

                <Legend />

                <Bar
                  dataKey="assignments"
                  fill="rgb(var(--primary))"
                  radius={[10, 10, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </ChartCard>

      {/* LINE CHART */}
      <ChartCard title="Teacher Paste Analytics">

        <div className="h-[400px]">

          {mounted && (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.teacherPasteUsage || []}>

                <CartesianGrid strokeDasharray="3 3" />

                <XAxis dataKey="teacher" />

                <YAxis />

                <Tooltip />

                <Legend />

                <Line
                  type="monotone"
                  dataKey="avgPaste"
                  stroke="#ef4444"
                  strokeWidth={4}
                />

                <Line
                  type="monotone"
                  dataKey="avgTyped"
                  stroke="#10b981"
                  strokeWidth={4}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </ChartCard>

      {/* SUBMISSION OVERVIEW */}
      <ChartCard title="Student Submission Overview">

        <div className="h-[350px]">

          {mounted && (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>

                <Pie
                  data={stats.submissionOverview || []}
                  dataKey="value"
                  outerRadius={120}
                  label
                >
                  <Cell fill="#10b981" />
                  <Cell fill="#ef4444" />
                </Pie>

                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </ChartCard>
    </div>
  );
}

/* CARD */

function ChartCard({
  title,
  children,
  className = "",
}: any) {
  return (
    <div
      className={`bg-white dark:bg-gray-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm ${className}`}
    >
      <h2 className="text-2xl font-black mb-8 text-gray-800 dark:text-white">
        {title}
      </h2>

      {children}
    </div>
  );
}

/* STAT CARD */

function StatCard({
  label,
  value,
  icon,
}: any) {
  return (
    <motion.div
      whileHover={{ y: -5 }}
      className="bg-white dark:bg-gray-900 p-6 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm"
    >
      <div className="flex justify-between items-center mb-5">

        <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
          {icon}
        </div>
      </div>

      <p className="text-xs uppercase tracking-widest text-gray-400 font-black">
        {label}
      </p>

      <h3 className="text-4xl font-black mt-2 text-gray-800 dark:text-white">
        {value}
      </h3>
    </motion.div>
  );
}

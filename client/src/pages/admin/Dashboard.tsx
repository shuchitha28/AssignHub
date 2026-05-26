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

  const stats = data?.data;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-[rgb(var(--primary))] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20">

      {/* HERO */}
      <div className="p-8 text-white rounded-[2.5rem] bg-gradient-to-br from-[rgb(var(--primary))] to-[rgb(var(--secondary))] relative overflow-hidden shadow-xl">

        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 blur-3xl rounded-full -mr-32 -mt-32" />

        <div className="relative z-10 flex items-center justify-between">

          <div>
            <div className="inline-flex items-center px-4 py-2 bg-white/20 rounded-full text-xs font-black uppercase tracking-widest mb-4">
              <LayoutDashboard size={14} className="mr-2" />
              Admin Portal
            </div>

            <h1 className="text-5xl font-black tracking-tight">
              System Insights
            </h1>

            <p className="mt-4 max-w-2xl text-lg opacity-90">
              Advanced LMS analytics dashboard with real-time student activity,
              assignment intelligence and performance tracking.
            </p>
          </div>

          <div className="hidden lg:flex w-32 h-32 bg-white/10 rounded-[2rem] items-center justify-center backdrop-blur-xl">
            <TrendingUp size={60} />
          </div>
        </div>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <EnhancedStatCard
          label="Students"
          value={stats?.students || 0}
          icon={<Users className="text-blue-500" />}
        />

        <EnhancedStatCard
          label="Teachers"
          value={stats?.teachers || 0}
          icon={<User className="text-indigo-500" />}
        />

        <EnhancedStatCard
          label="Courses"
          value={stats?.courses || 0}
          icon={<BookOpen className="text-purple-500" />}
        />

        <EnhancedStatCard
          label="Subjects"
          value={stats?.subjects || 0}
          icon={<Layers className="text-pink-500" />}
        />
      </div>

      {/* TREND + ACTIVITY */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* AREA CHART */}
        <div className="xl:col-span-2 bg-white dark:bg-gray-900 p-8 rounded-[2.5rem] shadow-sm">

          <div className="mb-6">
            <h2 className="text-2xl font-black">
              Registration Velocity
            </h2>

            <p className="text-gray-400 text-sm mt-1">
              Student onboarding trends
            </p>
          </div>

          <div className="w-full h-[350px]">

            {mounted && (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats?.trends || []}>
                  <defs>
                    <linearGradient
                      id="studentsGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
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
                    fill="url(#studentsGradient)"
                    strokeWidth={4}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* ACTIVITY */}
        <div className="bg-white dark:bg-gray-900 p-8 rounded-[2.5rem] shadow-sm">

          <div className="mb-6">
            <h2 className="text-2xl font-black">
              Activity Feed
            </h2>
          </div>

          <div className="space-y-5 max-h-[350px] overflow-y-auto">

            {stats?.activity?.map((act: any, idx: number) => (
              <div key={idx} className="flex gap-4">

                <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center">
                  <Activity size={18} />
                </div>

                <div>
                  <p className="font-bold text-sm">
                    {act.text}
                  </p>

                  <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                    <Calendar size={12} />
                    {new Date(act.time).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* PIE CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* USER DISTRIBUTION */}
        <ChartCard title="User Distribution">

          <div className="h-[350px]">

            <ResponsiveContainer width="100%" height="100%">
              <PieChart>

                <Pie
                  data={stats?.userDistribution || []}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={120}
                  label
                >
                  {(stats?.userDistribution || []).map(
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
          </div>
        </ChartCard>

        {/* SUBMISSION STATUS */}
        <ChartCard title="Submission Status">

          <div className="h-[350px]">

            <ResponsiveContainer width="100%" height="100%">
              <PieChart>

                <Pie
                  data={stats?.submissionStats || []}
                  dataKey="value"
                  outerRadius={120}
                  label
                >
                  {(stats?.submissionStats || []).map(
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
          </div>
        </ChartCard>
      </div>

      {/* BAR CHART */}
      <ChartCard title="Subject Wise Assignments">

        <div className="h-[400px]">

          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats?.subjectAssignments || []}>

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
        </div>
      </ChartCard>

      {/* LINE CHART */}
      <ChartCard title="Teacher Paste Analytics">

        <div className="h-[400px]">

          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={stats?.teacherPasteUsage || []}>

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
                name="Paste %"
              />

              <Line
                type="monotone"
                dataKey="avgTyped"
                stroke="#10b981"
                strokeWidth={4}
                name="Typed %"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>

      {/* SUBMISSION OVERVIEW */}
      <ChartCard title="Student Submission Overview">

        <div className="h-[350px]">

          <ResponsiveContainer width="100%" height="100%">
            <PieChart>

              <Pie
                data={stats?.submissionOverview || []}
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
        </div>
      </ChartCard>
    </div>
  );
}

/* CARD */

function ChartCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white dark:bg-gray-900 p-8 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-800">
      <h2 className="text-2xl font-black mb-6 text-gray-800 dark:text-white">
        {title}
      </h2>

      {children}
    </div>
  );
}

/* STAT CARD */

function EnhancedStatCard({
  label,
  value,
  icon,
}: any) {
  return (
    <motion.div
      whileHover={{ y: -5 }}
      className="bg-white dark:bg-gray-900 p-6 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-800"
    >
      <div className="flex items-center justify-between mb-5">

        <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
          {icon}
        </div>
      </div>

      <div>
        <p className="text-xs uppercase tracking-widest text-gray-400 font-black">
          {label}
        </p>

        <h3 className="text-4xl font-black mt-2 text-gray-800 dark:text-white">
          {value}
        </h3>
      </div>
    </motion.div>
  );
}

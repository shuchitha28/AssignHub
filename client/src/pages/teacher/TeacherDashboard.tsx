import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Users, 
  BookOpen, 
  FileText, 
  Clock, 
  ChevronRight, 
  Plus, 
  TrendingUp
} from "lucide-react";
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from "recharts";
import { getTeacherDashboard } from "../../api/dashboard.api";
import { format } from "date-fns";
import { Link, useNavigate } from "react-router-dom";
import { useTheme } from "../../hooks/useTheme";
import { getFileUrl } from "../../utils/file";


export default function TeacherDashboard() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await getTeacherDashboard();
        setData(res.data);
      } catch (err) {
        console.error("Failed to fetch teacher dashboard", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-theme transition">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-[rgb(var(--primary))/0.2] border-t-[rgb(var(--primary))] rounded-full animate-spin"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white dark:bg-gray-950 rounded-full"></div>
        </div>
      </div>
    );
  }

  const stats = [
    { 
      title: "Active Subjects", 
      value: data?.stats?.totalSubjects || 0, 
      icon: <BookOpen className="w-6 h-6" />, 
      color: "text-blue-500",
      lightColor: "bg-blue-500/10",
    },
    { 
      title: "Total Students", 
      value: data?.stats?.totalStudents || 0, 
      icon: <Users className="w-6 h-6" />, 
      color: "text-purple-500",
      lightColor: "bg-purple-500/10",
    },
    { 
      title: "Assignments", 
      value: data?.stats?.totalAssignments || 0, 
      icon: <FileText className="w-6 h-6" />, 
      color: "text-[rgb(var(--primary))]",
      lightColor: "bg-[rgb(var(--primary))]/10",
    },
    { 
      title: "Pending Reviews", 
      value: data?.stats?.pendingReviews || 0, 
      icon: <Clock className="w-6 h-6" />, 
      color: "text-orange-500",
      lightColor: "bg-orange-500/10",
    },
  ];

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 }
  };

  return (
    <div className="p-4 md:p-8 min-h-screen bg-theme transition space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[rgb(var(--primary))] to-[rgb(var(--secondary))] bg-clip-text text-transparent">
            Welcome back, Teacher!
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Here's what's happening with your classes today.
          </p>
        </div>
        <div className="flex gap-3">
          <Link 
            to="/teacher/subjects" 
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm"
          >
            <BookOpen className="w-4 h-4" />
            My Subjects
          </Link>
          <button 
            onClick={() => navigate("/teacher/subjects")}
            className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-[rgb(var(--primary))] to-[rgb(var(--secondary))] text-white rounded-xl text-sm font-bold hover:opacity-90 transition-all shadow-lg shadow-[rgb(var(--primary))]/20"
          >
            <Plus className="w-4 h-4" />
            New Assignment
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        {stats.map((stat, i) => (
          <motion.div
            key={i}
            variants={item}
            whileHover={{ y: -5 }}
            className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-5"
          >
            <div className={`${stat.lightColor} p-4 rounded-2xl ${stat.color}`}>
              {stat.icon}
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                {stat.title}
              </p>
              <h3 className="text-2xl font-black text-gray-800 dark:text-white mt-1">
                {stat.value}
              </h3>
            </div>
          </motion.div>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Charts Section */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-2 bg-white dark:bg-gray-800 p-8 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-700"
        >
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[rgb(var(--primary))]/10 text-[rgb(var(--primary))] rounded-lg">
                <TrendingUp className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Submission Trends</h2>
            </div>
            <select className="bg-gray-50 dark:bg-gray-700 border-none rounded-lg text-sm font-medium focus:ring-0">
              <option>Last 7 Days</option>
              <option>Last 30 Days</option>
            </select>
          </div>
          
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.trends || []}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="rgb(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="rgb(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#9ca3af', fontSize: 12 }}
                  tickFormatter={(str) => format(new Date(str), "MMM dd")}
                />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: theme === 'dark' ? '#111827' : '#fff', 
                    borderRadius: '12px', 
                    border: 'none', 
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                    color: theme === 'dark' ? '#fff' : '#000'
                  }} 
                  itemStyle={{ color: theme === 'dark' ? '#fff' : '#000' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="count" 
                  stroke="rgb(var(--primary))" 
                  strokeWidth={4}
                  fillOpacity={1} 
                  fill="url(#colorCount)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white dark:bg-gray-800 p-8 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-700"
        >
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Recent Submissions</h2>
            <Link to="/teacher/review" className="text-sm font-bold text-[rgb(var(--primary))] hover:opacity-80 flex items-center gap-1 transition-all">
              View All <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="space-y-6">
            {data?.recentSubmissions?.length > 0 ? (
              data.recentSubmissions.map((sub: any, i: number) => (
                <div 
                  key={i} 
                  onClick={() => navigate("/teacher/review", { state: { submissionId: sub._id } })}
                  className="flex items-start gap-4 group cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 p-3 rounded-2xl transition-all"
                >
                  <div className="relative">
                    {sub.studentPicture ? (
                      <img src={getFileUrl(sub.studentPicture)} alt="" className="w-10 h-10 rounded-full object-cover border-2 border-white dark:border-gray-800 shadow-sm" />
                    ) : (

                      <div className="w-10 h-10 rounded-full bg-[rgb(var(--primary))]/10 flex items-center justify-center text-[rgb(var(--primary))] font-black">
                        {sub.studentName.charAt(0)}
                      </div>
                    )}
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full"></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-800 dark:text-white truncate">
                      {sub.studentName}
                    </p>
                    <p className="text-[10px] text-gray-400 font-bold uppercase truncate">
                      {sub.assignmentTitle}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-1">
                      {format(new Date(sub.submittedAt), "MMM dd, hh:mm a")}
                    </p>
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 p-2 bg-gray-100 dark:bg-gray-700 rounded-lg transition-all">
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 bg-gray-50 dark:bg-gray-900/50 rounded-full flex items-center justify-center mb-4 text-gray-300">
                  <FileText className="w-8 h-8" />
                </div>
                <p className="text-gray-500 dark:text-gray-400 text-sm font-bold">No recent submissions</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Bottom Grid: Quick Insights */}
      <div className="grid grid-cols-1 gap-8">
          <div className="bg-white dark:bg-gray-800 p-8 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-700">
             <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Upcoming Deadlines</h2>
                <button 
                  onClick={() => navigate("/teacher/subjects")}
                  className="text-sm font-bold text-gray-400 hover:text-[rgb(var(--primary))] transition-colors uppercase tracking-widest"
                >
                  View Subjects
                </button>
             </div>
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {data?.upcomingAssignments?.length > 0 ? (
                  data.upcomingAssignments.map((a: any, i: number) => (
                    <div key={i} className="flex items-center gap-4 p-5 bg-gray-50 dark:bg-gray-900/50 rounded-3xl border border-transparent hover:border-[rgb(var(--primary))]/30 transition-all group">
                        <div className="w-14 h-14 bg-white dark:bg-gray-800 rounded-2xl flex flex-col items-center justify-center border border-gray-100 dark:border-gray-700 shadow-sm group-hover:shadow-md transition-all">
                            <span className="text-[10px] font-bold text-gray-400 uppercase leading-none mb-1">
                              {format(new Date(a.deadline), "MMM")}
                            </span>
                            <span className="text-xl font-black text-gray-800 dark:text-white leading-none">
                              {format(new Date(a.deadline), "dd")}
                            </span>
                        </div>
                        <div>
                            <p className="text-sm font-bold text-gray-800 dark:text-white">{a.title}</p>
                            <p className="text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase">
                              {a.subjectName}{a.courseName ? ` (${a.courseName})` : ""} &middot; {format(new Date(a.deadline), "hh:mm a")}
                            </p>
                        </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-2 py-12 text-center bg-gray-50/50 dark:bg-gray-900/30 rounded-3xl border border-dashed border-gray-200 dark:border-gray-800">
                    <p className="text-gray-400 font-bold">No upcoming deadlines</p>
                  </div>
                )}
             </div>
          </div>
      </div>
    </div>
  );
}
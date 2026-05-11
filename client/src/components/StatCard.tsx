import { motion } from "framer-motion";

export default function StatCard({ title, value, icon }: any) {
  return (
    <motion.div
      whileHover={{ y: -5 }}
      className="bg-white dark:bg-gray-900 p-6 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-sm flex items-center gap-6 transition-all"
    >
      <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary shadow-inner">
        {icon}
      </div>
      <div>
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{title}</p>
        <h2 className="text-2xl font-black text-gray-800 dark:text-white leading-none">{value}</h2>
      </div>
    </motion.div>
  );
}
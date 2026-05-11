import type { ReactNode } from "react";

interface CardProps {
  title: string;
  value: string | number;
  icon?: ReactNode;
}

export function Card({ title, value, icon }: CardProps) {
  return (
    <div className="p-8 bg-white dark:bg-gray-900 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-all flex items-center gap-6">
      {icon && (
        <div className="w-14 h-14 bg-gray-50 dark:bg-gray-800 rounded-2xl flex items-center justify-center shrink-0">
          {icon}
        </div>
      )}
      <div>
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{title}</p>
        <h2 className="text-3xl font-black text-gray-800 dark:text-white tracking-tight">{value}</h2>
      </div>
    </div>
  );
}
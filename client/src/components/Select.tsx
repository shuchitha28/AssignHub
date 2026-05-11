import React from 'react';
import { ChevronDown } from 'lucide-react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  icon?: React.ReactNode;
  containerClassName?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, icon, className, containerClassName, children, ...props }, ref) => {
    return (
      <div className={`space-y-2 ${containerClassName}`}>
        {label && (
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
            {label}
          </label>
        )}
        <div className="relative group">
          {icon && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[rgb(var(--primary))] transition-colors">
              {icon}
            </div>
          )}
          <select
            ref={ref}
            className={`
              w-full appearance-none bg-gray-50 dark:bg-gray-800 
              border-2 border-transparent focus:border-[rgb(var(--primary))]/20
              rounded-2xl py-4 pr-12 outline-none
              text-sm font-bold text-gray-700 dark:text-gray-200
              transition-all cursor-pointer
              focus:ring-4 focus:ring-[rgb(var(--primary))]/5
              ${icon ? 'pl-12' : 'pl-6'}
              ${className}
            `}
            {...props}
          >
            {children}
          </select>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors">
            <ChevronDown size={18} strokeWidth={3} />
          </div>
        </div>
      </div>
    );
  }
);

Select.displayName = 'Select';

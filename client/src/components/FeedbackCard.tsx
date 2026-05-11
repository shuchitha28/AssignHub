export function FeedbackCard({ grade, subject }: any) {
  return (
    <div className="p-6 bg-white dark:bg-gray-900 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col items-center">
      <div className="text-4xl font-black text-primary mb-2">{grade}</div>
      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{subject}</p>
    </div>
  );
}
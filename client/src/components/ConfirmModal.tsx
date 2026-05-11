import { motion, AnimatePresence } from "framer-motion";

export default function ConfirmModal({ 
  open, 
  onClose, 
  onConfirm, 
  title = "Are you sure?", 
  message = "This action cannot be undone.", 
  confirmText = "Delete",
  confirmColor = "bg-red-500"
}: any) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="p-8 bg-white dark:bg-gray-900 rounded-[2.5rem] w-full max-w-md border border-gray-100 dark:border-gray-800 shadow-2xl mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="mb-4 text-2xl font-black text-gray-800 dark:text-white leading-tight">
              {title}
            </h2>

            <p className="mb-8 text-gray-500 dark:text-gray-400 font-medium">
              {message}
            </p>

            <div className="flex justify-end gap-4">
              <button 
                onClick={onClose} 
                className="px-6 py-3 border border-gray-100 dark:border-gray-800 rounded-2xl font-black text-xs uppercase tracking-widest text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
              >
                Cancel
              </button>

              <button
                onClick={() => {
                  onConfirm();
                  onClose();
                }}
                className={`px-8 py-3 text-white ${confirmColor} font-black rounded-2xl text-xs uppercase tracking-widest transition-all shadow-xl hover:scale-105 active:scale-95`}
              >
                {confirmText}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
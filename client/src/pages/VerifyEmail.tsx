import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import API from "../api/axios";
import { motion } from "framer-motion";
import { CheckCircle, XCircle, Loader2, ArrowRight } from "lucide-react";
import toast from "react-hot-toast";

export default function VerifyEmail() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const verify = async () => {
      if (!token) {
        setStatus("error");
        setMessage("No verification token provided.");
        return;
      }
      
      try {
        const query = new URLSearchParams(window.location.search);
        const email = query.get("email");
        const res = await API.get(`/auth/verify-email/${token}${email ? `?email=${encodeURIComponent(email)}` : ""}`);
        setStatus("success");
        setMessage(res.data.message);
        toast.success("Email verified successfully!");
      } catch (err: any) {
        setStatus("error");
        setMessage(err.response?.data?.message || "Verification failed");
      }
    };
    verify();
  }, [token]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white dark:bg-gray-900 rounded-[3rem] p-12 text-center shadow-2xl border border-gray-100 dark:border-gray-800"
      >
        {status === "loading" && (
          <div className="space-y-6">
            <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center text-primary mx-auto animate-pulse">
              <Loader2 size={40} className="animate-spin" />
            </div>
            <h2 className="text-3xl font-black dark:text-white tracking-tight">Verifying Email</h2>
            <p className="text-gray-500 dark:text-gray-400 font-medium">Please wait while we verify your account...</p>
          </div>
        )}

        {status === "success" && (
          <div className="space-y-6">
            <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-3xl flex items-center justify-center text-green-600 dark:text-green-400 mx-auto">
              <CheckCircle size={40} />
            </div>
            <h2 className="text-3xl font-black dark:text-white tracking-tight">Success!</h2>
            <p className="text-gray-500 dark:text-gray-400 font-medium">{message}</p>
            <button
              onClick={() => navigate("/")}
              className="w-full py-4 bg-primary text-white font-black uppercase tracking-widest text-xs rounded-2xl flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-primary/20"
            >
              Go to Login <ArrowRight size={16} />
            </button>
          </div>
        )}

        {status === "error" && (
          <div className="space-y-6">
            <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-3xl flex items-center justify-center text-red-600 dark:text-red-400 mx-auto">
              <XCircle size={40} />
            </div>
            <h2 className="text-3xl font-black dark:text-white tracking-tight">Oops!</h2>
            <p className="text-gray-500 dark:text-gray-400 font-medium">{message}</p>
            <Link
              to="/"
              className="block w-full py-4 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 font-black uppercase tracking-widest text-xs rounded-2xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
            >
              Back to Home
            </Link>
          </div>
        )}
      </motion.div>
    </div>
  );
}

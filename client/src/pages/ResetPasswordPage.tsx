import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { resetPassword } from "../api/auth.api";

export default function ResetPasswordPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!password || !confirmPassword) {
      return toast.error("Please fill in all fields");
    }

    if (password !== confirmPassword) {
      return toast.error("Passwords do not match");
    }

    if (password.length < 6) {
      return toast.error("Password must be at least 6 characters");
    }

    if (!token) {
      return toast.error("Invalid reset token");
    }

    try {
      setLoading(true);
      await resetPassword(token, { password });
      toast.success("Password reset successful! You can now log in.");
      navigate("/");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-900 transition p-6">
      <div className="w-full max-w-md p-8 space-y-6 bg-white shadow-xl dark:bg-gray-800 rounded-2xl">
        <div>
          <h2 className="text-2xl font-bold">Set New Password</h2>
          <p className="text-sm text-gray-500 mt-1">
            Please enter your new password below.
          </p>
        </div>

        <div className="space-y-4">
          <input
            type="password"
            placeholder="New Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-xl dark:bg-gray-800 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-medium"
          />
          <input
            type="password"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-xl dark:bg-gray-800 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-medium"
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full py-3.5 text-lg font-bold text-white bg-gradient-to-r from-primary to-secondary rounded-xl disabled:opacity-50 transition-all hover:scale-[1.02] shadow-lg shadow-primary/20"
        >
          {loading ? "Updating..." : "Update Password"}
        </button>

        <div className="text-center">
          <button
            onClick={() => navigate("/")}
            className="text-sm text-primary hover:underline font-medium"
          >
            Back to Login
          </button>
        </div>
      </div>
    </div>
  );
}

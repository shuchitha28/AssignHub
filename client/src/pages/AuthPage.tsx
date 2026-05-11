import { useState, useEffect } from "react";
import { loginUser, registerUser, forgotPassword, googleLogin } from "../api/auth.api";
import { getSettings } from "../api/setting.api";
import { useQuery } from "@tanstack/react-query";
import { GoogleLogin } from "@react-oauth/google";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../hooks/useTheme";
import { Sun, Moon, Sparkles, ChevronRight, User, Mail, Lock, Eye, EyeOff, Dot } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

export default function AuthPage() {
  const { theme, toggleTheme, setTheme, setColorTheme } = useTheme();
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [role, setRole] = useState("student");
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [showAuth, setShowAuth] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showRegistrationBlock, setShowRegistrationBlock] = useState(false);
  const navigate = useNavigate();

  const { data: settingsData } = useQuery({
    queryKey: ["settings"],
    queryFn: getSettings,
  });

  const isGoogleAuthEnabled = 
    settingsData?.data?.security?.googleAuth !== false && 
    !!import.meta.env.VITE_GOOGLE_CLIENT_ID;

  const isPublicRegistrationEnabled = settingsData?.data?.security?.publicRegistration !== false;

  // ✅ FIXED: check token also
  useEffect(() => {
    const token = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user") || "null");

    if (token && user) {
      if (user.role === "admin") navigate("/admin/dashboard");
      else if (user.role === "teacher") navigate("/teacher/dashboard");
      else navigate("/student/dashboard");
    }
  }, [navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    if (!form.email || !form.password) {
      return toast.error("Email and password required");
    }

    // Email Format Validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      return toast.error("Please enter a valid email address");
    }

    if (!isLogin && role === "teacher") {
      if (!form.email.toLowerCase().endsWith(".ac.in")) {
        return toast.error("Teacher email must be in the format: name@college.ac.in", { duration: 4000 });
      }
    }

    if (!isLogin && !form.name) {
      return toast.error("Name is required");
    }

    try {
      setLoading(true);

      if (isLogin) {
        const res = await loginUser({
          email: form.email,
          password: form.password,
        });

        const { token, user } = res.data;

        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(user));

        // ✅ Apply user's saved theme
        if (user.theme) setTheme(user.theme);
        if (user.colorTheme) setColorTheme(user.colorTheme);

        toast.success("Login successful");

        // ✅ Role-based redirect
        if (user.role === "admin") {
          navigate("/admin/dashboard");
        } else if (user.role === "teacher") {
          navigate("/teacher/dashboard");
        } else {
          navigate("/student/dashboard");
        }

      } else {
        // Password Validation
        const passwordRegex = /^(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{8,})/;
        if (!passwordRegex.test(form.password)) {
          return toast.error("Password must be at least 8 characters long and include at least one number and one special character (!@#$%^&*)", { duration: 4000 });
        }

        await registerUser({ ...form, role });

        const msg = settingsData?.data?.security?.emailVerification !== false
          ? "Account created! Please check your email to verify your account."
          : "Account created, please login";

        toast.success(msg, { duration: 6000 });

        setForm({
          name: "",
          email: "",
          password: "",
        });

        setIsLogin(true);
      }

    } catch (err: any) {
      toast.error(err.response?.data?.message || "Error");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!form.email) {
      return toast.error("Please enter your email address");
    }

    try {
      setLoading(true);
      const res = await forgotPassword({ email: form.email });
      toast.success(res.data.message || "Password reset link sent!", { duration: 5000 });
      setIsForgotPassword(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    try {
      setLoading(true);
      const res = await googleLogin(credentialResponse.credential);
      const { token, user } = res.data;

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      if (user.theme) setTheme(user.theme);
      if (user.colorTheme) setColorTheme(user.colorTheme);

      toast.success("Google Login successful");

      if (user.role === "admin") navigate("/admin/dashboard");
      else if (user.role === "teacher") navigate("/teacher/dashboard");
      else navigate("/student/dashboard");

    } catch (err: any) {
      toast.error(err.response?.data?.message || "Google Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen transition dark:bg-gray-900 overflow-hidden relative">

      {/* LEFT (HERO SECTION) */}
      <motion.div 
        animate={{ 
          width: showAuth ? "50%" : "100%",
          borderRadius: showAuth ? "0 40px 40px 0" : "0px"
        }}
        transition={{ type: "spring", damping: 20, stiffness: 80 }}
        className="hidden md:flex bg-gradient-to-br from-primary via-secondary to-blue-500 text-white p-12 flex-col justify-between z-20 relative"
      >
        {/* Back button for Left Side */}
        <AnimatePresence>
          {showAuth && (
            <motion.button
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              onClick={() => setShowAuth(false)}
              className="absolute top-8 right-8 flex items-center justify-center w-12 h-12 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl text-white hover:bg-white/20 transition-all z-30 shadow-lg"
              title="Back to Overview"
            >
              <ChevronRight size={24} />
            </motion.button>
          )}
        </AnimatePresence>

        <div className="flex items-center gap-3">
          <motion.div
            animate={{
              rotate: [0, 10, -10, 0],
              scale: [1, 1.1, 1]
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/30 shadow-lg"
          >
            <Sparkles size={20} className="text-white" />
          </motion.div>
          <h1 className="text-3xl font-black tracking-tighter">
            Assign<span className="text-white/80">Hub</span>
          </h1>
        </div>

        <div className="flex flex-col items-center gap-12">
          <motion.div
            animate={{ y: showAuth ? 0 : 20 }}
            className="text-center"
          >
            <motion.h2 
              animate={{ 
                maxWidth: showAuth ? "450px" : "1000px",
                fontSize: showAuth ? "2.5rem" : "3.5rem"
              }}
              className="font-black leading-tight tracking-tighter mx-auto"
            >
              Elevate Your <span className="text-white/70">Academic Potential.</span>
            </motion.h2>
          </motion.div>

          <motion.div
            animate={{
              y: [0, -20, 0],
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="flex justify-center"
          >
            <img
              src="https://cdn-icons-png.flaticon.com/512/3135/3135755.png"
              className="w-80 drop-shadow-[0_35px_35px_rgba(0,0,0,0.4)]"
              alt="student"
            />
          </motion.div>

          <div className="flex flex-col items-center gap-8">
            <AnimatePresence>
              {!showAuth && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8, y: 20 }}
                  onClick={() => setShowAuth(true)}
                  className="px-12 py-5 bg-white text-primary rounded-[2rem] font-black uppercase tracking-[0.25em] text-sm hover:bg-opacity-90 transition-all shadow-2xl hover:scale-105 active:scale-95"
                >
                  Get Started
                </motion.button>
              )}
            </AnimatePresence>
            
            <motion.p 
              animate={{ opacity: showAuth ? 0.7 : 0.9, scale: showAuth ? 0.9 : 1 }}
              className="text-lg leading-relaxed font-medium text-center max-w-xl"
            >
              Experience a unified platform designed to manage your assignments,
              streamline course workflows, and foster collaboration between students and educators.
            </motion.p>
          </div>
        </div>

        <div className="flex justify-between items-center opacity-40">
          <p className="text-xs font-bold uppercase tracking-[0.3em]">Elite Edition</p>
          <div className="flex gap-4">
            <div className="w-2 h-2 rounded-full bg-white" />
            <div className="w-2 h-2 rounded-full bg-white/50" />
            <div className="w-2 h-2 rounded-full bg-white/50" />
          </div>
        </div>
      </motion.div>

      {/* RIGHT (AUTH FORMS) */}
      <motion.div 
        animate={{ 
          width: showAuth ? "50%" : "0%",
          opacity: showAuth ? 1 : 0,
          x: showAuth ? 0 : 50,
        }}
        transition={{ type: "spring", damping: 25, stiffness: 100 }}
        className="flex items-center justify-center bg-gray-50 dark:bg-gray-950 overflow-hidden"
      >
        <div className="w-full max-w-md p-8 pt-6 space-y-6 bg-white dark:bg-gray-900 shadow-2xl rounded-[3rem] border border-gray-100 dark:border-gray-800 relative m-6">
          
          {/* Theme */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                <Sparkles size={16} />
              </div>
              <span className="font-black text-lg tracking-tighter dark:text-white">Assign<span className="text-primary">Hub</span></span>
            </div>
            <button
              onClick={() => toggleTheme()}
              className="p-3 bg-gray-100 dark:bg-gray-800 rounded-2xl hover:bg-pink-200 dark:hover:bg-pink-700 transition-colors"
            >
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>

          {isForgotPassword ? (
            <div className="space-y-6">
              <div>
                <h2 className="text-3xl font-black dark:text-white">Reset Password</h2>
                <p className="text-sm text-gray-500 mt-2 font-medium">
                  Enter your email address to reset your password.
                </p>
              </div>
              <input
                name="email"
                placeholder="Email Address"
                value={form.email}
                onChange={handleChange}
                className="w-full p-4 bg-gray-50 dark:bg-gray-800 border-none rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
              />
              <button
                onClick={handleForgotPassword}
                disabled={loading}
                className="w-full py-4 text-white bg-gradient-to-r from-primary to-secondary rounded-2xl disabled:opacity-50 transition-all hover:scale-[1.02] active:scale-95 shadow-xl shadow-primary/20 font-black uppercase tracking-widest text-xs"
              >
                {loading ? "Sending..." : "Reset Password"}
              </button>
              <div className="text-center">
                <button
                  onClick={() => setIsForgotPassword(false)}
                  className="text-xs text-primary hover:underline font-black uppercase tracking-widest"
                >
                  Back to Login
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <h2 className="text-4xl font-black dark:text-white tracking-tight">
                  {isLogin ? "Welcome Back!" : "Join Us Today"}
                </h2>
                <p className="text-sm text-gray-500 mt-2 font-medium">
                  {isLogin 
                    ? "Log in to your account to continue." 
                    : "Create an account to start your journey."}
                </p>
              </div>

              {/* Toggle */}
              <div className="flex p-1 bg-gray-100 dark:bg-gray-800 rounded-2xl">
                <button
                  onClick={() => setIsLogin(true)}
                  className={`flex-1 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all ${isLogin ? "bg-white dark:bg-gray-700 text-primary shadow-sm" : "text-gray-400 hover:text-gray-600"
                    }`}
                >
                  Login
                </button>
                <button
                  onClick={() => {
                    if (isPublicRegistrationEnabled) {
                      setIsLogin(false);
                    } else {
                      setShowRegistrationBlock(true);
                    }
                  }}
                  className={`flex-1 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all ${!isLogin ? "bg-white dark:bg-gray-700 text-primary shadow-sm" : "text-gray-400 hover:text-gray-600"
                    }`}
                >
                  Register
                </button>
              </div>

              {/* ROLE */}
              {!isLogin && (
                <div className="space-y-3">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">I am a...</p>
                  <div className="flex gap-3">
                    {["student", "teacher"].map((r) => (
                      <button
                        key={r}
                        onClick={() => setRole(r)}
                        className={`flex-1 py-3 rounded-xl border-2 font-black uppercase tracking-widest text-[10px] transition-all ${role === r
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-gray-100 dark:border-gray-800 text-gray-400 hover:border-gray-200"
                          }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Inputs */}
              <div className="space-y-4">
                {!isLogin && (
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors">
                      <User size={18} />
                    </div>
                    <input
                      name="name"
                      placeholder="Full Name"
                      value={form.name}
                      onChange={handleChange}
                      className="w-full p-4 pl-12 bg-gray-50 dark:bg-gray-800/50 dark:text-white dark:placeholder-gray-500 border border-transparent dark:border-gray-700/50 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all font-medium"
                    />
                  </div>
                )}

                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors">
                    <Mail size={18} />
                  </div>
                  <input
                    name="email"
                    type="email"
                    placeholder="Email Address"
                    value={form.email}
                    onChange={handleChange}
                    className={`w-full p-4 pl-12 bg-gray-50 dark:bg-gray-800/50 dark:text-white dark:placeholder-gray-500 border border-transparent dark:border-gray-700/50 rounded-2xl outline-none focus:ring-2 focus:border-primary/30 transition-all font-medium ${
                      form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email) 
                        ? "focus:ring-red-500/20 ring-1 ring-red-500/50" 
                        : "focus:ring-primary/20"
                    }`}
                  />
                  {form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email) && (
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-red-500 uppercase tracking-widest">
                      Invalid
                    </span>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors">
                      <Lock size={18} />
                    </div>
                    <input
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Password"
                      value={form.password}
                      onChange={handleChange}
                      className="w-full p-4 pl-12 pr-12 bg-gray-50 dark:bg-gray-800/50 dark:text-white dark:placeholder-gray-500 border border-transparent dark:border-gray-700/50 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary transition-colors focus:outline-none"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {!isLogin && form.password.length > 0 && (
                    <div className="px-1 flex flex-wrap gap-4 mt-2 justify-between">
                      <div className="flex items-center gap-1.5">
                        {form.password.length >= 8 ? <Dot size={22} className="text-green-500" /> : <div className="w-1 h-1 rounded-full bg-gray-300" />}
                        <span className={`text-[10px] font-black uppercase tracking-widest ${form.password.length >= 8 ? "text-green-600 dark:text-green-400" : "text-gray-400"}`}>8+ Chars</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {/[0-9]/.test(form.password) ? <Dot size={22} className="text-green-500" /> : <div className="w-1 h-1 rounded-full bg-gray-300" />}
                        <span className={`text-[10px] font-black uppercase tracking-widest ${/[0-9]/.test(form.password) ? "text-green-600 dark:text-green-400" : "text-gray-400"}`}>1 Number</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {/[!@#$%^&*]/.test(form.password) ? <Dot size={22} className="text-green-500" /> : <div className="w-1 h-1 rounded-full bg-gray-300" />}
                        <span className={`text-[10px] font-black uppercase tracking-widest ${/[!@#$%^&*]/.test(form.password) ? "text-green-600 dark:text-green-400" : "text-gray-400"}`}>1 Symbol</span>
                      </div>
                    </div>
                  )}
                  {isLogin && (
                    <div className="flex justify-end">
                      <button
                        onClick={() => setIsForgotPassword(true)}
                        className="text-[10px] font-black text-primary hover:underline uppercase tracking-widest"
                      >
                        Forgot Password?
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Submit */}
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full py-5 text-white bg-gradient-to-r from-primary to-secondary rounded-[2rem] disabled:opacity-50 transition-all hover:scale-[1.02] active:scale-95 shadow-2xl shadow-primary/20 font-black uppercase tracking-widest text-xs"
              >
                {loading
                  ? "Processing..."
                  : isLogin
                    ? "Sign In Now"
                    : "Create Account"}
              </button>

              {isGoogleAuthEnabled && isLogin && (
                <>
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-100 dark:border-gray-800"></div>
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-white dark:bg-gray-900 px-2 text-gray-400 font-bold tracking-widest">Or continue with</span>
                    </div>
                  </div>

                  <div className="flex justify-center w-full">
                    <GoogleLogin
                      onSuccess={handleGoogleSuccess}
                      onError={() => toast.error("Google Login Failed")}
                      theme={theme === "dark" ? "filled_black" : "outline"}
                      shape="pill"
                      width="150"
                    />
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </motion.div>

      {/* REGISTRATION BLOCKED OVERLAY */}
      <AnimatePresence>
        {showRegistrationBlock && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="w-full max-w-sm bg-white dark:bg-gray-900 rounded-[3rem] p-10 text-center shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full -mr-16 -mt-16" />
              
              <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center text-primary mx-auto mb-6">
                <Lock size={32} />
              </div>

              <h3 className="text-2xl font-black text-gray-800 dark:text-white mb-2 tracking-tight">Access Restricted</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm font-medium leading-relaxed mb-8">
                Public registration is currently disabled by the platform administrator. 
                Please contact support for an invitation.
              </p>

              <button
                onClick={() => setShowRegistrationBlock(false)}
                className="w-full py-4 bg-primary text-white font-black uppercase tracking-widest text-[10px] rounded-2xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
              >
                Understood
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

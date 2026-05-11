import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { GoogleLogin } from "@react-oauth/google";
import { getSettings, updateSettings } from "../../api/setting.api";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../../hooks/useTheme";
import toast from "react-hot-toast";
import {
  User,
  Settings,
  Palette,
  Shield,
  Save,
  RefreshCcw,
  Camera,
  Mail,
  Globe,
  Clock,
  ChevronRight,
  Moon,
  Sun,
  Layout
} from "lucide-react";
import API from "../../api/axios";
import { getFileUrl } from "../../utils/file";


export default function SettingsPage() {
  const { theme, toggleTheme, colorTheme, changeColorTheme } = useTheme();
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState("profile");

  // Fetch System Settings
  const { data: settingsData } = useQuery({
    queryKey: ["settings"],
    queryFn: getSettings,
  });

  // Fetch Admin Profile
  const { data: profileData } = useQuery({
    queryKey: ["profile"],
    queryFn: () => API.get("/profile/me"),
  });

  const [form, setForm] = useState<any>({});
  const [profileForm, setProfileForm] = useState<any>({});

  useEffect(() => {
    if (settingsData?.data) setForm(settingsData.data);
  }, [settingsData]);

  useEffect(() => {
    if (profileData?.data) {
      setProfileForm({
        name: profileData.data.name,
        email: profileData.data.email,
        bio: profileData.data.bio || "",
        profilePicture: profileData.data.profilePicture || "",
      });
    }
  }, [profileData]);

  // Mutations
  const updateSystem = useMutation({
    mutationFn: updateSettings,
    onSuccess: () => {
      toast.success("System configuration updated");
      qc.invalidateQueries({ queryKey: ["settings"] });
    },
    onError: () => toast.error("Failed to update system settings"),
  });

  const updateProfile = useMutation({
    mutationFn: (data: any) => API.put("/profile/update", data),
    onSuccess: () => {
      toast.success("Profile updated successfully");
      qc.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: () => toast.error("Failed to update profile"),
  });

  const linkGoogle = useMutation({
    mutationFn: (tokenId: string) => API.post("/auth/link-google", { tokenId, linkOnly: true }),
    onSuccess: () => {
      toast.success("Google account linked successfully");
      qc.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed to link Google account"),
  });

  const unlinkGoogle = useMutation({
    mutationFn: () => API.post("/profile/unlink-google"),
    onSuccess: () => {
      toast.success("Google account unlinked");
      qc.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: () => toast.error("Failed to unlink Google account"),
  });

  const handleSave = () => {
    if (activeTab === "profile") {
      updateProfile.mutate(profileForm);
    } else {
      updateSystem.mutate(form);
    }
  };

  const tabs = [
    { id: "profile", label: "Admin Profile", icon: <User size={18} /> },
    { id: "system", label: "System Config", icon: <Settings size={18} /> },
    { id: "theme", label: "Theme & Branding", icon: <Palette size={18} /> },
    { id: "security", label: "Security", icon: <Shield size={18} /> },
  ];

  return (
    <div className="space-y-8 pb-12">
      {/* HERO HEADER */}
      <div className="p-8 md:p-12 text-white rounded-[2.5rem] bg-gradient-to-br from-[rgb(var(--primary))] to-[rgb(var(--secondary))] shadow-xl shadow-[rgb(var(--primary))]/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full -ml-16 -mb-16 blur-2xl" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="space-y-4">
            <div className="inline-flex items-center px-4 py-1.5 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-2">
              <Settings size={14} className="mr-2" /> Global Configuration
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight">Settings</h1>
            <p className="opacity-90 font-medium max-w-xl text-lg leading-relaxed">
              Customize the platform experience, manage your administrative profile, and configure system-wide security policies.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => {
                setForm(settingsData?.data || {});
                setProfileForm(profileData?.data || {});
              }}
              className="p-4 bg-white/10 backdrop-blur-md border border-white/20 text-white font-bold rounded-2xl flex items-center gap-2 hover:bg-white/20 transition-all"
            >
              <RefreshCcw size={18} />
            </button>
            <button
              onClick={handleSave}
              disabled={updateSystem.isPending || updateProfile.isPending}
              className="px-8 py-4 bg-white text-[rgb(var(--primary))] font-black rounded-2xl shadow-xl flex items-center gap-2 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
            >
              <Save size={20} />
              {updateSystem.isPending || updateProfile.isPending ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* SIDEBAR TABS */}
        <div className="space-y-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center justify-between p-4 rounded-2xl font-bold transition-all ${activeTab === tab.id
                ? "bg-white dark:bg-gray-900 text-[rgb(var(--primary))] shadow-sm border border-gray-100 dark:border-gray-800"
                : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                }`}
            >
              <div className="flex items-center gap-3">
                {tab.icon} {tab.label}
              </div>
              <ChevronRight size={16} className={activeTab === tab.id ? "opacity-100" : "opacity-0"} />
            </button>
          ))}
        </div>

        {/* MAIN CONTENT AREA */}
        <div className="lg:col-span-3">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white dark:bg-gray-900 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm p-8 md:p-12"
            >
              {activeTab === "profile" && (
                <div className="space-y-12">
                  <div className="flex flex-col md:flex-row items-start gap-8">
                    <div className="relative group">
                      <input
                        type="file"
                        id="profile-upload"
                        hidden
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setProfileForm({ ...profileForm, profilePicture: reader.result as string });
                              toast.success(`Profile picture selected! Click "Save Changes" to apply.`);
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                      <label
                        htmlFor="profile-upload"
                        className="w-32 h-32 rounded-[2.5rem] overflow-hidden bg-gray-100 dark:bg-gray-800 border-4 border-white dark:border-gray-800 shadow-lg relative block cursor-pointer group"
                      >
                        <img
                          src={getFileUrl(profileForm.profilePicture) || `https://ui-avatars.com/api/?name=${encodeURIComponent(profileForm.name)}&background=random&size=200`}
                          alt="Profile"
                          className="w-full h-full object-cover transition-transform group-hover:scale-110"
                        />

                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Camera className="text-white" size={24} />
                        </div>
                      </label>
                      <div className="absolute -bottom-2 -right-2 p-2.5 bg-[rgb(var(--primary))] text-white rounded-xl shadow-lg border-2 border-white dark:border-gray-900 pointer-events-none">
                        <Camera size={14} />
                      </div>
                    </div>

                    <div className="flex-1 space-y-6">
                      <div className="space-y-1">
                        <h2 className="text-2xl font-black text-gray-800 dark:text-white tracking-tight">Personal Details</h2>
                        <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Update your admin profile information</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <SettingsInput
                          label="Full Name"
                          icon={<User size={18} />}
                          value={profileForm.name}
                          onChange={(v: any) => setProfileForm({ ...profileForm, name: v })}
                        />
                        <SettingsInput
                          label="Email Address"
                          icon={<Mail size={18} />}
                          value={profileForm.email}
                          disabled
                        />
                        <div className="md:col-span-2">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-2 block">Bio / Professional Intro</label>
                          <textarea
                            rows={4}
                            value={profileForm.bio}
                            onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                            className="w-full px-6 py-4 bg-gray-50 dark:bg-gray-800 rounded-2xl border-none focus:ring-2 focus:ring-[rgb(var(--primary))]/20 font-bold text-gray-700 dark:text-gray-200 outline-none resize-none"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "system" && (
                <div className="space-y-10">
                  <div className="space-y-1">
                    <h2 className="text-2xl font-black text-gray-800 dark:text-white tracking-tight">System Configuration</h2>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Global platform settings and preferences</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <SettingsInput
                      label="Platform Name"
                      icon={<Layout size={18} />}
                      value={form.platformName}
                      onChange={(v: any) => setForm({ ...form, platformName: v })}
                    />
                    <SettingsInput
                      label="Support Email"
                      icon={<Mail size={18} />}
                      value={form.supportEmail}
                      onChange={(v: any) => setForm({ ...form, supportEmail: v })}
                    />
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-2 block">System Timezone</label>
                      <div className="relative group">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[rgb(var(--primary))] transition-colors z-10">
                          <Clock size={18} />
                        </div>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[rgb(var(--primary))] pointer-events-none">
                          <ChevronRight size={18} className="rotate-90" />
                        </div>
                        <select
                          value={form.timezone}
                          onChange={(e) => setForm({ ...form, timezone: e.target.value })}
                          className="w-full pl-12 pr-12 py-4 bg-gray-50 dark:bg-gray-800 rounded-2xl border-none focus:ring-2 focus:ring-[rgb(var(--primary))]/20 font-bold text-gray-700 dark:text-gray-200 outline-none appearance-none cursor-pointer text-sm"
                        >
                          <option value="UTC">UTC (Universal Time)</option>
                          <option value="America/New_York">EST (New York)</option>
                          <option value="America/Chicago">CST (Chicago)</option>
                          <option value="America/Denver">MST (Denver)</option>
                          <option value="America/Los_Angeles">PST (Los Angeles)</option>
                          <option value="Europe/London">GMT (London)</option>
                          <option value="Europe/Paris">CET (Paris)</option>
                          <option value="Asia/Dubai">GST (Dubai)</option>
                          <option value="Asia/Kolkata">IST (India)</option>
                          <option value="Asia/Singapore">SGT (Singapore)</option>
                          <option value="Asia/Tokyo">JST (Tokyo)</option>
                          <option value="Australia/Sydney">AEST (Sydney)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "theme" && (
                <div className="space-y-10">
                  <div className="space-y-1">
                    <h2 className="text-2xl font-black text-gray-800 dark:text-white tracking-tight">Branding & Aesthetics</h2>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Personalize the visual identity of AssignHub</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[
                      { id: "pink", bg: "bg-pink-500", name: "Premium Pink", desc: "Bold & Vibrant" },
                      { id: "blue", bg: "bg-blue-500", name: "Ocean Blue", desc: "Professional" },
                      { id: "green", bg: "bg-emerald-500", name: "Eco Green", desc: "Organic" },
                      { id: "orange", bg: "bg-orange-500", name: "Sunset Orange", desc: "Energetic" },
                      { id: "purple", bg: "bg-purple-600", name: "Royal Purple", desc: "Elegant" },
                      { id: "red", bg: "bg-red-600", name: "Midnight Red", desc: "Powerful" },
                      { id: "indigo", bg: "bg-indigo-600", name: "Deep Indigo", desc: "Sophisticated" },
                      { id: "yellow", bg: "bg-yellow-500", name: "Electric Yellow", desc: "Bright" },
                    ].map((t) => (
                      <button
                        key={t.id}
                        onClick={() => changeColorTheme(t.id, true)}
                        className={`group p-4 rounded-3xl border-2 transition-all flex items-center gap-4 ${colorTheme === t.id
                          ? "border-[rgb(var(--primary))] bg-[rgb(var(--primary))]/5"
                          : "border-transparent bg-gray-50 dark:bg-gray-800 hover:scale-[1.02]"
                          }`}
                      >
                        <div className={`w-12 h-12 rounded-2xl ${t.bg} shadow-lg shadow-black/10`} />
                        <div className="text-left">
                          <p className="font-black text-gray-800 dark:text-white text-sm">{t.name}</p>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t.desc}</p>
                        </div>
                      </button>
                    ))}
                  </div>

                  <div className="pt-8 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gray-50 dark:bg-gray-800 rounded-2xl flex items-center justify-center text-gray-400">
                        {theme === "dark" ? <Moon size={22} /> : <Sun size={22} />}
                      </div>
                      <div>
                        <p className="font-black text-gray-800 dark:text-white">Dark Mode</p>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Adjust interface brightness</p>
                      </div>
                    </div>

                    <button
                      onClick={() => toggleTheme(true)}
                      className={`w-16 h-8 flex items-center rounded-full p-1.5 transition-all duration-500 ${theme === "dark" ? "bg-[rgb(var(--primary))]" : "bg-gray-200 dark:bg-gray-700"
                        }`}
                    >
                      <motion.div
                        animate={{ x: theme === "dark" ? 32 : 0 }}
                        className="bg-white w-5 h-5 rounded-full shadow-md"
                      />
                    </button>
                  </div>
                </div>
              )}

              {activeTab === "security" && (
                <div className="space-y-10">
                  <div className="space-y-1">
                    <h2 className="text-2xl font-black text-gray-800 dark:text-white tracking-tight">Security & Access</h2>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Manage authentication and system protection</p>
                  </div>

                  <div className="space-y-4">
                    <SecurityToggle
                      label="Google OAuth Integration"
                      desc="Allow users to sign in with their Google accounts"
                      icon={<Globe size={18} />}
                      active={form.security?.googleAuth}
                      onToggle={() => {
                        const currentVal = form.security?.googleAuth ?? false;
                        setForm({
                          ...form,
                          security: {
                            ...(form.security || {}),
                            googleAuth: !currentVal
                          }
                        });
                      }}
                    />
                    <SecurityToggle
                      label="Auto-Accept Enrollments"
                      desc="Automatically approve all student requests to join courses"
                      icon={<User size={18} />}
                      active={form.data?.autoAcceptEnrollment}
                      onToggle={() => {
                        const currentVal = form.data?.autoAcceptEnrollment ?? false;
                        setForm({
                          ...form,
                          data: {
                            ...(form.data || {}),
                            autoAcceptEnrollment: !currentVal
                          }
                        });
                      }}
                    />
                    <SecurityToggle
                      label="Public Registration"
                      desc="Allow new users to register without invitations"
                      icon={<User size={18} />}
                      active={form.security?.publicRegistration}
                      onToggle={() => {
                        const currentVal = form.security?.publicRegistration ?? false;
                        setForm({
                          ...form,
                          security: {
                            ...(form.security || {}),
                            publicRegistration: !currentVal
                          }
                        });
                      }}
                    />
                    <SecurityToggle
                      label="Email Verification"
                      desc="Require users to verify their emails before access"
                      icon={<Mail size={18} />}
                      active={form.security?.emailVerification}
                      onToggle={() => {
                        const currentVal = form.security?.emailVerification ?? false;
                        setForm({
                          ...form,
                          security: {
                            ...(form.security || {}),
                            emailVerification: !currentVal
                          }
                        });
                      }}
                    />

                    <div className="pt-8 border-t border-gray-100 dark:border-gray-800">
                      <div className="flex items-center justify-between p-6 bg-[rgb(var(--primary))]/5 rounded-3xl border border-[rgb(var(--primary))]/10">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-white dark:bg-gray-900 rounded-2xl flex items-center justify-center text-[rgb(var(--primary))] shadow-sm">
                            <Globe size={18} />
                          </div>
                          <div>
                            <p className="font-black text-gray-800 dark:text-white text-sm">Connected Google Account</p>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                              {profileData?.data?.googleId ? "Linked to Google" : "Not connected"}
                            </p>
                          </div>
                        </div>

                        {profileData?.data?.googleId ? (
                          <button
                            onClick={() => unlinkGoogle.mutate()}
                            disabled={unlinkGoogle.isPending}
                            className="px-6 py-2.5 bg-red-50 dark:bg-red-900/20 text-red-600 font-bold rounded-xl text-xs hover:bg-red-100 transition-all disabled:opacity-50"
                          >
                            {unlinkGoogle.isPending ? "Unlinking..." : "Disconnect"}
                          </button>
                        ) : import.meta.env.VITE_GOOGLE_CLIENT_ID ? (
                          <GoogleLogin
                            onSuccess={(res) => linkGoogle.mutate(res.credential!)}
                            onError={() => toast.error("Linking failed")}
                            useOneTap={false}
                            theme="outline"
                            shape="pill"
                            text="continue_with"
                          />
                        ) : (
                          <span className="text-xs text-gray-400 italic">Google OAuth not configured</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

/* HELPER COMPONENTS */

function SettingsInput({ label, icon, value, onChange, disabled, placeholder, type = "text" }: any) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{label}</label>
      <div className="relative group">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[rgb(var(--primary))] transition-colors">
          {icon}
        </div>
        <input
          type={type}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          disabled={disabled}
          placeholder={placeholder}
          className={`w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-gray-800 rounded-2xl border-none focus:ring-2 focus:ring-[rgb(var(--primary))]/20 font-bold text-gray-700 dark:text-gray-200 outline-none transition-all ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        />
      </div>
    </div>
  );
}

function SecurityToggle({ label, desc, icon, active, onToggle }: any) {
  return (
    <div className="flex items-center justify-between p-6 bg-gray-50 dark:bg-gray-800/50 rounded-3xl border border-transparent hover:border-gray-100 dark:hover:border-gray-800 transition-all">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-white dark:bg-gray-900 rounded-2xl flex items-center justify-center text-gray-400 shadow-sm">
          {icon}
        </div>
        <div>
          <p className="font-black text-gray-800 dark:text-white text-sm">{label}</p>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{desc}</p>
        </div>
      </div>

      <button
        onClick={onToggle}
        className={`w-14 h-7 flex items-center rounded-full p-1.5 transition-all duration-300 ${active ? "bg-[rgb(var(--primary))]" : "bg-gray-300 dark:bg-gray-600"
          }`}
      >
        <motion.div
          animate={{ x: active ? 28 : 0 }}
          className="bg-white w-4 h-4 rounded-full shadow-sm"
        />
      </button>
    </div>
  );
}
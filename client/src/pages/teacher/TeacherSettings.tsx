import { useState, useEffect, useRef } from "react";
import { 
  User, 
  Shield, 
  Camera, 
  Lock,
  Eye,
  EyeOff,
  Save,
  Mail,
  Settings,
  X,
  Send,
  Palette
} from "lucide-react";
import toast from "react-hot-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useTheme } from "../../hooks/useTheme";
import API from "../../api/axios";
import { getFileUrl } from "../../utils/file";


export default function TeacherSettings() {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { theme, toggleTheme, colorTheme, changeColorTheme, setTheme, setColorTheme } = useTheme();
  
  // Profile state
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [email, setEmail] = useState("");
  const [profilePicture, setProfilePicture] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [gender, setGender] = useState("");
  const [dob, setDob] = useState("");
  const [city, setCity] = useState("");
  const [stateName, setStateName] = useState("");
  const [country, setCountry] = useState("");

  // Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);

  // Support state
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [supportForm, setSupportForm] = useState({ subject: "", message: "" });
  const [sendingSupport, setSendingSupport] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await API.get(`/profile/me`);
      setUser(res.data);
      setName(res.data.name || "");
      setEmail(res.data.email || "");
      setBio(res.data.bio || "");
      setProfilePicture(res.data.profilePicture || "");
      setPhoneNumber(res.data.phoneNumber || "");
      setGender(res.data.gender || "");
      setDob(res.data.dob || "");
      setCity(res.data.city || "");
      setStateName(res.data.state || "");
      setCountry(res.data.country || "");
      if (res.data.theme) setTheme(res.data.theme);
      if (res.data.colorTheme) setColorTheme(res.data.colorTheme);
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    try {
      const res = await API.put(`/profile/update`, {
        name,
        bio,
        profilePicture,
        phoneNumber,
        gender,
        dob,
        city,
        state: stateName,
        country
      });
      toast.success("Profile updated successfully");
      
      const localUser = JSON.parse(localStorage.getItem("user") || "{}");
      const updatedUser = { ...localUser, ...res.data.user };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      fetchProfile();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Update failed");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1000000) { // 1MB limit for Base64 demo
        return toast.error("File is too large. Please select an image under 1MB.");
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePicture(reader.result as string);
        toast.success("Image selected. Click 'Save Profile' to apply changes.");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      return toast.error("Passwords do not match");
    }
    try {
      await API.put(`/profile/change-password`, {
        currentPassword,
        newPassword
      });
      toast.success("Password changed successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Password change failed");
    }
  };

  const handleForgotPassword = async () => {
    if (!email) return toast.error("Please enter your email");
    try {
      const res = await API.post(`/auth/forgot-password`, { email });
      toast.success(res.data.message || "Password reset link sent to your email", { duration: 5000 });
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to send reset link");
    }
  };

  const handleSupportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supportForm.subject || !supportForm.message) {
      return toast.error("Please fill in all fields");
    }
    setSendingSupport(true);
    try {
      await API.post(`/support`, supportForm);
      toast.success("Support ticket created! We'll get back to you soon.");
      setShowSupportModal(false);
      setSupportForm({ subject: "", message: "" });
    } catch (error: any) {
      toast.error("Failed to send support request");
    } finally {
      setSendingSupport(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center p-12">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="p-8 text-white rounded-3xl bg-gradient-to-r from-primary to-secondary shadow-lg shadow-primary/20">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Settings className="w-8 h-8" />
          Account Settings
        </h1>
        <p className="mt-2 opacity-90">
          Manage your profile information, security preferences, and account settings.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Profile Sidebar Info */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col items-center text-center">
            <div className="relative mb-4">
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-primary/20 ring-4 ring-white dark:ring-gray-800 shadow-xl">
                <img 
                  src={getFileUrl(profilePicture) || "https://ui-avatars.com/api/?name=" + name + "&background=random&color=fff"} 
                  alt="Profile" 
                  className="w-full h-full object-cover"
                />

              </div>
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-1 right-1 p-2 bg-primary text-white rounded-full shadow-lg hover:scale-110 transition-transform"
              >
                <Camera size={16} />
              </button>
            </div>
            <h2 className="text-xl font-bold text-gray-800 dark:text-white">{name}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{email}</p>
            <div className="flex gap-2">
              <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full uppercase">Teacher</span>
              <span className="px-3 py-1 bg-secondary/10 text-secondary text-xs font-bold rounded-full uppercase">Active</span>
            </div>
          </div>

          {/* Theme Preferences Sidebar */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
            <h3 className="font-bold mb-4 flex items-center gap-2 dark:text-gray-200">
              <Palette className="w-4 h-4 text-primary" />
              Theme Settings
            </h3>
            <div className="space-y-3">
              {[
                { id: "pink", bg: "bg-pink-500", name: "Premium Pink", desc: "Our signature vibrant look" },
                { id: "blue", bg: "bg-blue-500", name: "Ocean Blue", desc: "Professional and calm" },
                { id: "green", bg: "bg-emerald-500", name: "Eco Green", desc: "Fresh and organic feel" },
                { id: "orange", bg: "bg-orange-500", name: "Sunset Orange", desc: "Energetic and warm" },
                { id: "purple", bg: "bg-purple-600", name: "Royal Purple", desc: "Elegant and creative" },
                { id: "red", bg: "bg-red-600", name: "Midnight Red", desc: "Bold and powerful" },
                { id: "indigo", bg: "bg-indigo-600", name: "Deep Indigo", desc: "Sophisticated and deep" },
                { id: "yellow", bg: "bg-yellow-500", name: "Electric Yellow", desc: "Bright and cheerful" },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => changeColorTheme(t.id, true)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                    colorTheme === t.id 
                      ? "border-primary bg-primary/5 shadow-sm" 
                      : "border-transparent hover:bg-gray-50 dark:hover:bg-gray-800"
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg ${t.bg} shrink-0`} />
                  <div className="text-left">
                    <p className="text-sm font-bold leading-none text-gray-800 dark:text-gray-200">{t.name}</p>
                    <p className="text-[10px] text-gray-400 mt-1">{t.desc}</p>
                  </div>
                </button>
              ))}
            </div>
            
            <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">Dark Mode</span>
              <button
                onClick={() => toggleTheme(true)}
                className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors duration-300 ${
                  theme === "dark" ? "bg-primary" : "bg-gray-300 dark:bg-gray-700"
                }`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transition-transform duration-300 ${
                    theme === "dark" ? "translate-x-6" : ""
                  }`}
                />
              </button>
            </div>
          </div>

          <div className="bg-gradient-to-br from-primary to-secondary p-6 rounded-2xl shadow-lg shadow-primary/20 text-white">
            <h3 className="font-bold flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Quick Support
            </h3>
            <p className="text-xs opacity-80 mb-4">Need help with your account? Our support team is here to help.</p>
            <button 
              onClick={() => setShowSupportModal(true)}
              className="w-full py-2 bg-white/20 hover:bg-white/30 text-white text-sm font-bold rounded-xl transition-all"
            >
              Contact Support
            </button>
          </div>

        </div>

        {/* Main Content Areas */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Edit Profile Card */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 shadow-sm border border-gray-100 dark:border-gray-800">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <User className="text-primary" />
              <span className="text-gray-800 dark:text-white">Personal Information</span>
            </h2>
            
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-600 dark:text-gray-400">Full Name</label>
                  <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full p-3 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all"
                    placeholder="Enter your name"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-600 dark:text-gray-400">Email Address</label>
                  <input 
                    type="email" 
                    value={email}
                    disabled
                    className="w-full p-3 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-xl opacity-60 cursor-not-allowed"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-600 dark:text-gray-400">Phone Number</label>
                  <input 
                    type="text" 
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full p-3 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all"
                    placeholder="+91 123-456-7890"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-600 dark:text-gray-400">Gender</label>
                  <select 
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full p-3 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all"
                  >
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-600 dark:text-gray-400">Date of Birth</label>
                  <input 
                    type="date" 
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="w-full p-3 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-600 dark:text-gray-400">City</label>
                  <input 
                    type="text" 
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full p-3 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all"
                    placeholder="City"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-600 dark:text-gray-400">State</label>
                  <input 
                    type="text" 
                    value={stateName}
                    onChange={(e) => setStateName(e.target.value)}
                    className="w-full p-3 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all"
                    placeholder="State"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-600 dark:text-gray-400">Country</label>
                  <input 
                    type="text" 
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full p-3 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all"
                    placeholder="Country"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-600 dark:text-gray-400">Bio</label>
                <textarea 
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={4}
                  className="w-full p-3 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all resize-none"
                  placeholder="Tell us a bit about yourself..."
                />
              </div>

              <div className="flex justify-end pt-2">
                <button 
                  onClick={handleUpdateProfile}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary to-secondary text-white font-bold rounded-xl shadow-lg shadow-primary/30 hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  <Save size={18} />
                  Save Profile
                </button>
              </div>
            </div>
          </div>

          {/* Security Card */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 shadow-sm border border-gray-100 dark:border-gray-800">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Shield className="text-secondary" />
              <span className="text-gray-800 dark:text-white">Security & Password</span>
            </h2>

            <form onSubmit={handleChangePassword} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-600 dark:text-gray-400">Current Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                      type={showPasswords ? "text" : "password"} 
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full pl-10 pr-3 py-3 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-secondary outline-none transition-all"
                      placeholder="••••••••"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-600 dark:text-gray-400">New Password</label>
                    <input 
                      type={showPasswords ? "text" : "password"} 
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full p-3 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-secondary outline-none transition-all"
                      placeholder="••••••••"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-600 dark:text-gray-400">Confirm New Password</label>
                    <input 
                      type={showPasswords ? "text" : "password"} 
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full p-3 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-secondary outline-none transition-all"
                      placeholder="••••••••"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <button 
                  type="button"
                  onClick={() => setShowPasswords(!showPasswords)}
                  className="text-sm font-medium text-gray-500 hover:text-primary flex items-center gap-2"
                >
                  {showPasswords ? <EyeOff size={18} /> : <Eye size={18} />}
                  {showPasswords ? "Hide passwords" : "Show passwords"}
                </button>
                <button 
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-sm font-bold text-primary hover:underline"
                >
                  Forgot password?
                </button>
              </div>

              <div className="flex justify-end">
                <button 
                  type="submit"
                  className="px-8 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>

      </div>

      {/* Support Modal */}
      {showSupportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-6 bg-gradient-to-r from-primary to-secondary text-white flex items-center justify-between">
              <h2 className="text-xl font-bold">Contact Support</h2>
              <button 
                onClick={() => setShowSupportModal(false)}
                className="p-1 hover:bg-white/20 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSupportSubmit} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-semibold dark:text-gray-200">Subject</label>
                <input 
                  type="text" 
                  value={supportForm.subject}
                  onChange={(e) => setSupportForm({...supportForm, subject: e.target.value})}
                  className="w-full p-3 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-primary"
                  placeholder="What do you need help with?"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold dark:text-gray-200">Message</label>
                <textarea 
                  value={supportForm.message}
                  onChange={(e) => setSupportForm({...supportForm, message: e.target.value})}
                  rows={5}
                  className="w-full p-3 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-primary resize-none"
                  placeholder="Describe your issue or question..."
                />
              </div>
              
              <button 
                type="submit"
                disabled={sendingSupport}
                className="w-full py-3 bg-primary text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 transition-all"
              >
                {sendingSupport ? "Sending..." : (
                  <>
                    <Send size={18} />
                    Send Message
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
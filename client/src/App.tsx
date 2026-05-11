import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import AuthPage from "./pages/AuthPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import VerifyEmail from "./pages/VerifyEmail";
import CoursesPage from "./pages/CoursesPage";
import AdminLayout from "./layouts/AdminLayout";
import Dashboard from "./pages/admin/Dashboard";
import UsersPage from "./pages/admin/UsersPage";
import SettingsPage from "./pages/admin/SettingsPage";
import CourseDetails from "./pages/admin/CourseDetails";
import AssignmentPage from "./pages/admin/AssignmentPage";
import Enrollments from "./pages/admin/Enrollments";
import SupportManagement from "./pages/admin/SupportManagement";

import StudentDashboard from "./pages/student/StudentDashboard";
import StudentLayout from "./layouts/StudentLayout";
import Notepad from "./pages/student/Notepad";
import CalendarPage from "./pages/student/CalendarPage";
import StudentSettings from "./pages/student/StudentSettings";
import MyCourse from "./pages/student/MyCourse";
import Assignments from "./pages/student/Assignments";

import TeacherLayout from "./layouts/TeacherLayout";
import TeacherDashboard from "./pages/teacher/TeacherDashboard";
import MySubjects from "./pages/teacher/MySubjects";
import Review from "./pages/teacher/Review";
import ReportCard from "./pages/teacher/ReportCard";
import TeacherSettings from "./pages/teacher/TeacherSettings";

import ProtectedRoute from "./components/ProtectedRoute";
import QuickSupport from "./components/QuickSupport";

import { useEffect } from "react";
import { getMyProfile } from "./api/profile.api";
import { useTheme } from "./hooks/useTheme";

function AppContent() {
  const { pathname } = useLocation();
  const { setTheme, setColorTheme } = useTheme();

  useEffect(() => {
    const initTheme = async () => {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          const res = await getMyProfile();
          const { theme, colorTheme } = res.data;
          if (theme) setTheme(theme);
          if (colorTheme) setColorTheme(colorTheme);
        } catch (err) {
          console.error("Failed to fetch profile for theme init", err);
        }
      }
    };
    initTheme();
  }, [setTheme, setColorTheme]);

  const showSupport = !["/", "/reset-password", "/verify-email"].some(p => pathname === p || pathname.startsWith("/reset-password") || pathname.startsWith("/verify-email"));

  return (
    <>
      <Routes>

        {/* PUBLIC */}
        <Route path="/" element={<AuthPage />} />
        <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
        <Route path="/verify-email/:token" element={<VerifyEmail />} />

        {/* ADMIN */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminLayout><Dashboard /></AdminLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/courses"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminLayout><CoursesPage /></AdminLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/courses/:id"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminLayout><CourseDetails /></AdminLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/users"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminLayout><UsersPage /></AdminLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/assignments"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminLayout><AssignmentPage /></AdminLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/settings"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminLayout><SettingsPage /></AdminLayout>
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/admin/enrollments"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminLayout><Enrollments /></AdminLayout>
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/admin/support"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminLayout><SupportManagement /></AdminLayout>
            </ProtectedRoute>
          }
        />

        {/* STUDENT */}
        <Route
          path="/student/dashboard"
          element={
            <ProtectedRoute allowedRoles={["student"]}>
              <StudentLayout><StudentDashboard /></StudentLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/student/notepad"
          element={
            <ProtectedRoute allowedRoles={["student"]}>
              <StudentLayout><Notepad /></StudentLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/student/calendar"
          element={
            <ProtectedRoute allowedRoles={["student"]}>
              <StudentLayout><CalendarPage /></StudentLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/student/settings"
          element={
            <ProtectedRoute allowedRoles={["student"]}>
              <StudentLayout><StudentSettings /></StudentLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/student/courses"
          element={
            <ProtectedRoute allowedRoles={["student"]}>
              <StudentLayout><MyCourse /></StudentLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/student/assignments"
          element={
            <ProtectedRoute allowedRoles={["student"]}>
              <StudentLayout><Assignments /></StudentLayout>
            </ProtectedRoute>
          }
        />

        {/* TEACHER */}
        <Route
          path="/teacher/dashboard"
          element={
            <ProtectedRoute allowedRoles={["teacher"]}>
              <TeacherLayout><TeacherDashboard /></TeacherLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/teacher/subjects"
          element={
            <ProtectedRoute allowedRoles={["teacher"]}>
              <TeacherLayout><MySubjects /></TeacherLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/teacher/review"
          element={
            <ProtectedRoute allowedRoles={["teacher"]}>
              <TeacherLayout><Review /></TeacherLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/teacher/report"
          element={
            <ProtectedRoute allowedRoles={["teacher"]}>
              <TeacherLayout><ReportCard /></TeacherLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/teacher/settings"
          element={
            <ProtectedRoute allowedRoles={["teacher"]}>
              <TeacherLayout><TeacherSettings /></TeacherLayout>
            </ProtectedRoute>
          }
        />

      </Routes>
      {showSupport && <QuickSupport />}
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;

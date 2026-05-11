import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";

export default function TeacherLayout({ children }: any) {
  return (
    <div className="flex h-screen bg-theme transition">
      <Sidebar role="teacher" />

      <div className="flex flex-col flex-1">
        <Topbar />

        <div className="flex-1 p-6 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
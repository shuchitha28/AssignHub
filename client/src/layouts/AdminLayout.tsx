import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";

export default function AdminLayout({ children }: any) {
  return (
    <div className="flex h-screen bg-theme transition">

      <Sidebar />

      <div className="flex-1 flex flex-col">
        <Topbar />

        <div className="p-6 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
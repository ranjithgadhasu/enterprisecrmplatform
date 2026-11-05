import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import { toggleCommand } from "../features/ui/uiSlice";
import { useWorkspace } from "../hooks/useWorkspace";
import Sidebar from "../components/layout/Sidebar";
import Topbar from "../components/layout/Topbar";
import CommandPalette from "../components/common/CommandPalette";

export default function AppLayout() {
  const { dispatch } = useWorkspace();

  useEffect(() => {
    const onKey = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        dispatch(toggleCommand());
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [dispatch]);

  return (
    <div className="desk-bg min-h-screen overflow-x-clip text-ink">
      <Sidebar />
      <div className="min-w-0 lg:pl-[260px]">
        <Topbar />
        <main className="min-w-0 px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
          <Outlet />
        </main>
      </div>
      <CommandPalette />
    </div>
  );
}

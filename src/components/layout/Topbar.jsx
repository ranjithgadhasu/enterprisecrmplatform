import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { Bell, Menu, Moon, RefreshCw, Search, Sun } from "lucide-react";
import toast from "react-hot-toast";
import { markActivityRead, markAllRead } from "../../features/activities/activitiesSlice";
import { updateAppearance } from "../../features/settings/settingsSlice";
import { setLastSynced, setNotificationsOpen, setSidebarOpen, setSyncing, toggleCommand } from "../../features/ui/uiSlice";
import { syncWorkspace } from "../../services/api";
import { useWorkspace } from "../../hooks/useWorkspace";
import { ago } from "../../utils/format";
import { IconButton } from "../ui/ui";

function pathFor(type) {
  return { lead: "/leads", deal: "/pipeline", customer: "/customers", task: "/tasks", note: "/activities" }[type] || "/activities";
}

export default function Topbar() {
  const navigate = useNavigate();
  const { dispatch, settings } = useWorkspace();
  const activities = useSelector((state) => state.activities.items);
  const notificationsOpen = useSelector((state) => state.ui.notificationsOpen);
  const syncing = useSelector((state) => state.ui.syncing);
  const lastSynced = useSelector((state) => state.ui.lastSynced);
  const leads = useSelector((state) => state.leads.items);
  const deals = useSelector((state) => state.pipeline.items);
  const customers = useSelector((state) => state.customers.items);
  const tasks = useSelector((state) => state.tasks.items);
  const panelRef = useRef(null);
  const unread = activities.filter((item) => item.unread);
  const recent = [...activities].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 6);
  const dark = settings.appearance.theme === "dark";

  useEffect(() => {
    if (!notificationsOpen) return undefined;
    const onPointer = (event) => {
      if (!panelRef.current?.contains(event.target)) dispatch(setNotificationsOpen(false));
    };
    window.addEventListener("pointerdown", onPointer);
    return () => window.removeEventListener("pointerdown", onPointer);
  }, [notificationsOpen, dispatch]);

  async function sync() {
    dispatch(setSyncing(true));
    try {
      const response = await syncWorkspace({
        leads: leads.length,
        deals: deals.length,
        customers: customers.length,
        tasks: tasks.length,
      });
      dispatch(setLastSynced(response.at));
      toast.success("Desk synced");
    } catch {
      dispatch(setSyncing(false));
      toast.error("Could not sync the desk");
    }
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-2 border-b border-line bg-paper/85 px-3 backdrop-blur-md sm:gap-3 sm:px-6 lg:px-8">
      <IconButton label="Open menu" className="lg:hidden" onClick={() => dispatch(setSidebarOpen(true))}>
        <Menu size={18} />
      </IconButton>
      <button
        type="button"
        onClick={() => dispatch(toggleCommand())}
        className="flex h-10 min-w-0 flex-1 items-center gap-3 rounded-2xl border border-line bg-card px-3 text-left text-sm text-muted sm:max-w-md"
      >
        <Search size={15} />
        <span className="truncate">Search the desk</span>
        <kbd className="ml-auto hidden rounded-lg border border-line px-1.5 py-0.5 text-[10px] sm:inline">⌘K</kbd>
      </button>
      <div className="ml-auto flex items-center gap-1">
        <button type="button" onClick={sync} className="hidden items-center gap-2 rounded-xl px-2 py-1 text-xs text-muted hover:text-ink sm:flex" disabled={syncing}>
          <RefreshCw size={14} className={syncing ? "animate-spin" : ""} />
          {lastSynced ? `Synced ${ago(lastSynced)}` : "Sync"}
        </button>
        <IconButton label="Toggle theme" onClick={() => dispatch(updateAppearance({ theme: dark ? "light" : "dark" }))}>
          {dark ? <Sun size={16} /> : <Moon size={16} />}
        </IconButton>
        <div className="relative" ref={panelRef}>
          <IconButton label="Notifications" onClick={() => dispatch(setNotificationsOpen(!notificationsOpen))}>
            <Bell size={16} />
          </IconButton>
          {unread.length > 0 && <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-copper" />}
          {notificationsOpen && (
            <div className="absolute right-0 z-40 mt-2 w-[calc(100vw-2rem)] max-w-[340px] overflow-hidden rounded-3xl border border-line bg-card card-shadow">
              <div className="flex items-center justify-between border-b border-line px-4 py-3">
                <p className="font-display text-xl">Signals</p>
                <button type="button" className="text-xs text-copper" onClick={() => dispatch(markAllRead())}>
                  Mark read
                </button>
              </div>
              <div className="max-h-96 overflow-y-auto">
                {recent.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className="block w-full border-b border-line px-4 py-3 text-left last:border-0 hover:bg-paper"
                    onClick={() => {
                      dispatch(markActivityRead(item.id));
                      dispatch(setNotificationsOpen(false));
                      navigate(pathFor(item.relatedType), { state: item.relatedId ? { focusId: item.relatedId } : null });
                    }}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm text-ink">{item.title}</p>
                      {item.unread && <span className="h-1.5 w-1.5 rounded-full bg-copper" />}
                    </div>
                    <p className="mt-1 line-clamp-2 text-xs text-muted">{item.description}</p>
                    <p className="mt-1 text-[11px] uppercase tracking-wider text-muted">{ago(item.createdAt)}</p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

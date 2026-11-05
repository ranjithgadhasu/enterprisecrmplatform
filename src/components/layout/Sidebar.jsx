import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { Activity, Building2, Kanban, LayoutDashboard, ListChecks, PieChart, Plus, Settings, UserPlus, X } from "lucide-react";
import { OPEN_STAGES } from "../../data/constants";
import { useDeskState, useWorkspace } from "../../hooks/useWorkspace";
import { buildMetrics } from "../../features/dashboard/metrics";
import { setSidebarOpen } from "../../features/ui/uiSlice";
import { Avatar } from "../ui/ui";
import { cn } from "../../utils/cn";

const NAV = [
  { to: "/", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/leads", label: "Leads", icon: UserPlus },
  { to: "/pipeline", label: "Pipeline", icon: Kanban },
  { to: "/customers", label: "Customers", icon: Building2 },
  { to: "/tasks", label: "Tasks", icon: ListChecks },
  { to: "/activities", label: "Activities", icon: Activity },
  { to: "/reports", label: "Reports", icon: PieChart },
  { to: "/settings", label: "Settings", icon: Settings },
];

function Mark() {
  return (
    <svg viewBox="0 0 32 32" className="h-9 w-9" aria-hidden>
      <rect width="32" height="32" rx="9" fill="#C6532A" />
      <path d="M16 6.5v19M8 16h16" stroke="#FFF8F1" strokeWidth="1.5" fill="none" />
      <circle cx="16" cy="16" r="5.4" fill="none" stroke="#FFF8F1" strokeWidth="1.5" />
      <circle cx="16" cy="16" r="1.5" fill="#FFF8F1" />
    </svg>
  );
}

export default function Sidebar() {
  const navigate = useNavigate();
  const { dispatch, profile, formatMoney, team } = useWorkspace();
  const desk = useDeskState();
  const open = useSelector((state) => state.ui.sidebarOpen);
  const metrics = buildMetrics(desk, { team });
  const [createOpen, setCreateOpen] = useState(false);
  const newLeads = desk.leads.items.filter((lead) => lead.status === "new").length;
  const openDeals = desk.pipeline.items.filter((deal) => OPEN_STAGES.includes(deal.stage)).length;
  const taskAlerts = metrics.overdueTasks.length + metrics.dueToday.length;
  const counts = { "/leads": newLeads, "/pipeline": openDeals, "/tasks": taskAlerts };
  const pace = metrics.targetThisMonth ? Math.round((metrics.wonThisMonth / metrics.targetThisMonth) * 100) : 0;

  const close = () => dispatch(setSidebarOpen(false));

  return (
    <>
      {open && <button type="button" className="fixed inset-0 z-30 bg-black/40 lg:hidden" aria-label="Close menu" onClick={close} />}
      <aside className={cn("sidebar-bg fixed inset-y-0 left-0 z-40 flex w-[260px] flex-col text-cream transition-transform lg:translate-x-0", open ? "translate-x-0" : "-translate-x-full")}>
        <div className="flex items-center justify-between px-5 pb-4 pt-5">
          <div className="flex items-center gap-3">
            <Mark />
            <div>
              <p className="font-display text-xl leading-none">{desk.settings.company.name}</p>
              <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-cream/50">Enterprise CRM.</p>
            </div>
          </div>
          <button type="button" className="grid h-8 w-8 place-items-center rounded-lg text-cream/70 lg:hidden" onClick={close} aria-label="Close menu">
            <X size={16} />
          </button>
        </div>

        <div className="px-4">
          <button
            type="button"
            onClick={() => setCreateOpen((value) => !value)}
            className="flex h-10 w-full items-center justify-center gap-2 rounded-2xl bg-copper text-sm font-medium text-white"
          >
            <Plus size={16} />
            New record
          </button>
          {createOpen && (
            <div className="mt-2 grid grid-cols-2 gap-1 rounded-2xl bg-white/5 p-2 text-sm">
              {[
                ["/leads", "Lead"],
                ["/pipeline", "Deal"],
                ["/customers", "Customer"],
                ["/tasks", "Task"],
              ].map(([to, label]) => (
                <button
                  key={label}
                  type="button"
                  className="rounded-xl px-2 py-2 text-left text-cream/80 hover:bg-white/8 hover:text-cream"
                  onClick={() => {
                    setCreateOpen(false);
                    close();
                    navigate(to, { state: { create: true } });
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>

        <nav className="mt-5 flex-1 space-y-1 overflow-y-auto px-3">
          {NAV.map((item) => {
            const Icon = item.icon;
            const count = counts[item.to];
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={close}
                className={({ isActive }) => cn("flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm transition", isActive ? "nav-active" : "nav-idle")}
              >
                <Icon size={16} strokeWidth={1.75} />
                <span className="flex-1">{item.label}</span>
                {count > 0 && <span className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] text-cream">{count}</span>}
              </NavLink>
            );
          })}
        </nav>

        <div className="space-y-3 p-4">
          <div className="rounded-2xl bg-white/6 p-3">
            <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.16em] text-cream/50">
              <span>Month pace</span>
              <span>{pace}%</span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-copper" style={{ width: `${Math.min(pace, 100)}%` }} />
            </div>
            <p className="mt-2 text-xs text-cream/70">{formatMoney(metrics.wonThisMonth)} booked of {formatMoney(metrics.targetThisMonth)}</p>
          </div>
          <div className="flex items-center gap-3 rounded-2xl px-1 py-1">
            <Avatar src={profile.photo} name={profile.name} />
            <div className="min-w-0">
              <p className="truncate text-sm text-cream">{profile.name}</p>
              <p className="truncate text-xs text-cream/50">{profile.role}</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

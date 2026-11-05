import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { Search } from "lucide-react";
import { setCommandOpen } from "../../features/ui/uiSlice";
import { useWorkspace } from "../../hooks/useWorkspace";
import { cn } from "../../utils/cn";

export default function CommandPalette() {
  const open = useSelector((state) => state.ui.commandOpen);
  const leads = useSelector((state) => state.leads.items);
  const deals = useSelector((state) => state.pipeline.items);
  const customers = useSelector((state) => state.customers.items);
  const tasks = useSelector((state) => state.tasks.items);
  const { dispatch } = useWorkspace();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const match = (...values) => !q || values.some((value) => String(value || "").toLowerCase().includes(q));
    const groups = [
      {
        label: "Leads",
        items: leads
          .filter((item) => match(item.name, item.company, item.email, item.status))
          .slice(0, 5)
          .map((item) => ({ id: item.id, type: "Lead", title: item.name, subtitle: item.company, path: "/leads" })),
      },
      {
        label: "Deals",
        items: deals
          .filter((item) => match(item.title, item.company, item.contact, item.stage))
          .slice(0, 5)
          .map((item) => ({ id: item.id, type: "Deal", title: item.title, subtitle: item.company, path: "/pipeline" })),
      },
      {
        label: "Customers",
        items: customers
          .filter((item) => match(item.company, item.name, item.email, item.industry))
          .slice(0, 5)
          .map((item) => ({ id: item.id, type: "Customer", title: item.company, subtitle: item.name, path: "/customers" })),
      },
      {
        label: "Tasks",
        items: tasks
          .filter((item) => match(item.title, item.relatedLabel, item.status))
          .slice(0, 4)
          .map((item) => ({ id: item.id, type: "Task", title: item.title, subtitle: item.relatedLabel || item.type, path: "/tasks" })),
      },
    ];
    return groups.filter((group) => group.items.length);
  }, [query, leads, deals, customers, tasks]);

  const flat = results.flatMap((group) => group.items);

  useEffect(() => setActive(0), [query, open]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => {
      if (event.key === "Escape") dispatch(setCommandOpen(false));
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setActive((index) => Math.min(index + 1, Math.max(flat.length - 1, 0)));
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        setActive((index) => Math.max(index - 1, 0));
      }
      if (event.key === "Enter" && flat[active]) {
        event.preventDefault();
        go(flat[active]);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, flat, active, dispatch]);

  function go(item) {
    dispatch(setCommandOpen(false));
    setQuery("");
    navigate(item.path, { state: { focusId: item.id } });
  }

  if (!open) return null;

  let cursor = -1;
  return (
    <div className="fixed inset-0 z-[90] bg-[#1c1712]/45 p-3 pt-[7vh] sm:p-4 sm:pt-[12vh]">
      <div className="mx-auto w-full max-w-2xl overflow-hidden rounded-[28px] border border-line bg-card card-shadow">
        <div className="flex items-center gap-3 border-b border-line px-4">
          <Search size={16} className="text-muted" />
          <input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search leads, deals, customers, tasks"
            className="h-14 w-full bg-transparent text-sm text-ink outline-none"
          />
        </div>
        <div className="max-h-[60dvh] overflow-y-auto p-2 sm:max-h-[420px]">
          {flat.length === 0 && <p className="px-3 py-8 text-center text-sm text-muted">Nothing on the desk matches that.</p>}
          {results.map((group) => (
            <div key={group.label} className="mb-2">
              <p className="px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-muted">{group.label}</p>
              {group.items.map((item) => {
                cursor += 1;
                const index = cursor;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onMouseEnter={() => setActive(index)}
                    onClick={() => go(item)}
                    className={cn("flex w-full items-center justify-between rounded-2xl px-3 py-2.5 text-left", index === active ? "bg-paper" : "")}
                  >
                    <span>
                      <span className="block text-sm text-ink">{item.title}</span>
                      <span className="block text-xs text-muted">{item.subtitle}</span>
                    </span>
                    <span className="text-[11px] uppercase tracking-wider text-muted">{item.type}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
        <div className="hidden justify-between border-t border-line px-4 py-2 text-[11px] uppercase tracking-wider text-muted sm:flex">
          <span>↑↓ navigate</span>
          <span>Enter open · Esc close</span>
        </div>
      </div>
    </div>
  );
}

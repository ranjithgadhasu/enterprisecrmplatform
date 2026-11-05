import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { isBefore, startOfDay, format } from "date-fns";
import { Plus, Search } from "lucide-react";
import toast from "react-hot-toast";
import { PRIORITIES, TASK_TYPES } from "../../data/constants";
import { createTask, deleteTask, setTaskStatus, updateTask } from "./tasksSlice";
import { request } from "../../services/api";
import { addActivity } from "../activities/activitiesSlice";
import { uid } from "../../utils/id";
import { useWorkspace } from "../../hooks/useWorkspace";
import { prettyDate, safeDate } from "../../utils/format";
import { FilterSelect, PageHeader } from "../../components/common/common";
import { TaskForm } from "../../components/forms/Forms";
import { Avatar, Badge, Button, ConfirmDialog, Drawer, EmptyState, Modal } from "../../components/ui/ui";
import { cn } from "../../utils/cn";

function bucket(task) {
  if (task.status === "done") return "done";
  const due = safeDate(task.dueDate);
  if (!due) return "upcoming";
  const today = startOfDay(new Date());
  if (isBefore(startOfDay(due), today)) return "overdue";
  if (format(due, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd")) return "today";
  return "upcoming";
}

const GROUPS = [
  { id: "overdue", label: "Overdue", tone: "wine" },
  { id: "today", label: "Today", tone: "copper" },
  { id: "upcoming", label: "Upcoming", tone: "gold" },
  { id: "done", label: "Done", tone: "forest" },
];

export default function TasksPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const items = useSelector((state) => state.tasks.items);
  const saving = useSelector((state) => state.tasks.status);
  const { dispatch, team, owner, profile, settings } = useWorkspace();
  const [query, setQuery] = useState("");
  const [ownerId, setOwnerId] = useState("all");
  const [priority, setPriority] = useState("all");
  const [type, setType] = useState("all");
  const [group, setGroup] = useState("all");
  const [activeId, setActiveId] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirm, setConfirm] = useState(null);

  useEffect(() => {
    if (!location.state?.focusId && !location.state?.create) return;
    if (location.state.focusId) setActiveId(location.state.focusId);
    if (location.state.create) {
      setEditing(null);
      setFormOpen(true);
    }
    navigate(location.pathname, { replace: true, state: null });
  }, [location.state, location.pathname, navigate]);

  const filtered = useMemo(() => items.filter((task) => {
    const q = query.trim().toLowerCase();
    if (q && !`${task.title} ${task.relatedLabel} ${task.description}`.toLowerCase().includes(q)) return false;
    if (ownerId !== "all" && task.ownerId !== ownerId) return false;
    if (priority !== "all" && task.priority !== priority) return false;
    if (type !== "all" && task.type !== type) return false;
    if (group !== "all" && bucket(task) !== group) return false;
    return true;
  }), [items, query, ownerId, priority, type, group]);

  const active = items.find((task) => task.id === activeId);

  async function toggle(task) {
    const next = task.status === "done" ? "open" : "done";
    dispatch(setTaskStatus({ id: task.id, status: next }));
    await request("patch", `/tasks/${task.id}`, { status: next });
    if (settings.notifications.taskDue && next === "done") toast.success("Task cleared");
  }

  async function save(values) {
    try {
      if (editing) {
        await dispatch(updateTask({ ...editing, ...values })).unwrap();
        toast.success("Task updated");
      } else {
        const created = await dispatch(createTask(values)).unwrap();
        dispatch(addActivity({
          id: uid("act"),
          type: "task",
          title: `Task opened: ${created.title}`,
          description: created.description || `Due ${prettyDate(created.dueDate, "MMM d")}.`,
          createdAt: new Date().toISOString(),
          userId: profile.id,
          relatedLabel: created.relatedLabel,
          relatedType: "task",
          relatedId: created.id,
          unread: false,
        }));
        toast.success("Task added");
      }
      setFormOpen(false);
      setEditing(null);
    } catch (error) {
      toast.error(error.message || "Could not save task");
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="The week"
        title="Tasks"
        description="What the desk owes people. Checking a box writes through the mock service and stays in this browser."
        actions={<Button onClick={() => { setEditing(null); setFormOpen(true); }}><Plus size={15} /> Add task</Button>}
      />

      <div className="pill-row">
        <button type="button" onClick={() => setGroup("all")} className={cn("rounded-full px-3 py-1.5 text-xs", group === "all" ? "bg-ink text-cream" : "border border-line bg-card text-muted")}>All {items.length}</button>
        {GROUPS.map((item) => (
          <button key={item.id} type="button" onClick={() => setGroup(item.id)} className={cn("rounded-full px-3 py-1.5 text-xs", group === item.id ? "bg-ink text-cream" : "border border-line bg-card text-muted")}>
            {item.label} {items.filter((task) => bucket(task) === item.id).length}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 rounded-[22px] border border-line bg-card p-3.5 sm:rounded-[24px] sm:p-4 md:grid-cols-4">
        <label className="col-span-2 md:col-span-1">
          <span className="mb-1 block text-[11px] uppercase tracking-[0.14em] text-muted">Search</span>
          <span className="flex items-center gap-2 rounded-2xl border border-line bg-paper px-3">
            <Search size={14} className="text-muted" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Title or account" className="h-10 w-full bg-transparent text-sm outline-none" />
          </span>
        </label>
        <FilterSelect label="Owner" value={ownerId} onChange={setOwnerId} options={[{ value: "all", label: "All owners" }, ...team.map((member) => ({ value: member.id, label: member.name }))]} />
        <FilterSelect label="Priority" value={priority} onChange={setPriority} options={[{ value: "all", label: "All priorities" }, ...PRIORITIES.map((item) => ({ value: item, label: item }))]} />
        <FilterSelect label="Type" value={type} onChange={setType} options={[{ value: "all", label: "All types" }, ...TASK_TYPES.map((item) => ({ value: item, label: item }))]} />
      </div>

      {filtered.length === 0 && <div className="rounded-[28px] border border-line bg-card"><EmptyState title="The lane is clear" body="No tasks match. Add one before it becomes a surprise." action={<Button onClick={() => setFormOpen(true)}>Add task</Button>} /></div>}

      <div className="space-y-6">
        {GROUPS.filter((item) => group === "all" || group === item.id).map((section) => {
          const rows = filtered.filter((task) => bucket(task) === section.id);
          if (!rows.length) return null;
          return (
            <section key={section.id}>
              <div className="mb-2 flex items-center gap-2">
                <Badge tone={section.tone}>{section.label}</Badge>
                <span className="text-xs text-muted">{rows.length}</span>
              </div>
              <div className="overflow-hidden rounded-[28px] border border-line bg-card">
                {rows.map((task) => (
                  <div key={task.id} className="flex items-start gap-3 border-b border-line px-4 py-3.5 last:border-0">
                    <button
                      type="button"
                      aria-label={task.status === "done" ? "Reopen task" : "Complete task"}
                      onClick={() => toggle(task)}
                      className={cn("mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md border", task.status === "done" ? "border-forest bg-forest text-white" : "border-line")}
                    >
                      {task.status === "done" ? "✓" : ""}
                    </button>
                    <button type="button" onClick={() => setActiveId(task.id)} className="min-w-0 flex-1 text-left">
                      <p className={cn("text-sm", task.status === "done" && "text-muted line-through")}>{task.title}</p>
                      <p className="mt-1 text-xs text-muted">{task.relatedLabel || task.type} · {prettyDate(task.dueDate, "MMM d")} · {task.type}<span className="sm:hidden"> · {owner(task.ownerId)?.name.split(" ")[0]}</span></p>
                    </button>
                    <Badge tone={task.priority === "urgent" || task.priority === "high" ? "wine" : task.priority === "medium" ? "gold" : "moss"}>{task.priority}</Badge>
                    <Avatar className="hidden sm:inline-grid" src={owner(task.ownerId)?.photo} name={owner(task.ownerId)?.name} size="sm" />
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </div>

      <Drawer open={Boolean(active)} title={active?.title || ""} eyebrow={active?.type} onClose={() => setActiveId(null)}>
        {active && (
          <div className="space-y-4">
            <div className="flex gap-2">
              <Badge tone={bucket(active) === "overdue" ? "wine" : "gold"}>{bucket(active)}</Badge>
              <Badge>{active.status}</Badge>
            </div>
            <p className="text-sm leading-relaxed text-muted">{active.description || "No description."}</p>
            <div className="grid gap-2 text-sm">
              <p><span className="text-muted">Due · </span>{prettyDate(active.dueDate, "MMMM d, yyyy")}</p>
              <p><span className="text-muted">Related · </span>{active.relatedLabel || "—"}</p>
              <p><span className="text-muted">Owner · </span>{owner(active.ownerId)?.name}</p>
              <p><span className="text-muted">Priority · </span>{active.priority}</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => toggle(active)}>{active.status === "done" ? "Reopen" : "Mark done"}</Button>
              <Button variant="secondary" onClick={() => { setEditing(active); setFormOpen(true); }}>Edit</Button>
              <Button variant="danger" onClick={() => setConfirm(active)}>Delete</Button>
            </div>
          </div>
        )}
      </Drawer>

      <Modal open={formOpen} title={editing ? "Edit task" : "New task"} eyebrow="Work" onClose={() => setFormOpen(false)}>
        <TaskForm initial={editing} team={team} busy={saving === "loading"} onCancel={() => setFormOpen(false)} onSubmit={save} />
      </Modal>
      <ConfirmDialog
        open={Boolean(confirm)}
        title="Delete this task?"
        body="It will leave the week. The related account stays."
        onClose={() => setConfirm(null)}
        onConfirm={async () => {
          await dispatch(deleteTask(confirm.id));
          toast.success("Task deleted");
          setConfirm(null);
          setActiveId(null);
        }}
      />
    </div>
  );
}

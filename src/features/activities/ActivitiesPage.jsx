import { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { Mail, NotebookPen, Phone, Plus, StickyNote, Video, Handshake } from "lucide-react";
import toast from "react-hot-toast";
import { ACTIVITY_TYPES } from "../../data/constants";
import { createActivity } from "./activitiesSlice";
import { useWorkspace } from "../../hooks/useWorkspace";
import { ago, prettyDate } from "../../utils/format";
import { PageHeader } from "../../components/common/common";
import { ActivityForm } from "../../components/forms/Forms";
import { Avatar, Badge, Button, EmptyState, Modal } from "../../components/ui/ui";
import { cn } from "../../utils/cn";

const ICONS = { call: Phone, email: Mail, meeting: Video, note: StickyNote, deal: Handshake, task: NotebookPen };

export default function ActivitiesPage() {
  const items = useSelector((state) => state.activities.items);
  const status = useSelector((state) => state.activities.status);
  const { dispatch, team, owner } = useWorkspace();
  const [type, setType] = useState("all");
  const [userId, setUserId] = useState("all");
  const [formOpen, setFormOpen] = useState(false);

  const filtered = useMemo(() => [...items]
    .filter((item) => (type === "all" || item.type === type) && (userId === "all" || item.userId === userId))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)), [items, type, userId]);

  async function save(values) {
    try {
      await dispatch(createActivity(values)).unwrap();
      toast.success("Activity logged");
      setFormOpen(false);
    } catch (error) {
      toast.error(error.message || "Could not log activity");
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="The record"
        title="Activities"
        description="Calls, notes, and the small movements that explain why a number changed."
        actions={<Button onClick={() => setFormOpen(true)}><Plus size={15} /> Log activity</Button>}
      />

      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="pill-row sm:flex-1">
          <button type="button" onClick={() => setType("all")} className={cn("rounded-full px-3 py-1.5 text-xs capitalize", type === "all" ? "bg-ink text-cream" : "border border-line bg-card text-muted")}>All</button>
          {ACTIVITY_TYPES.map((item) => (
            <button key={item} type="button" onClick={() => setType(item)} className={cn("rounded-full px-3 py-1.5 text-xs capitalize", type === item ? "bg-ink text-cream" : "border border-line bg-card text-muted")}>
              {item}
            </button>
          ))}
        </div>
        <select className="field h-10 w-full md:h-10 py-0 sm:h-9 sm:w-auto" value={userId} onChange={(event) => setUserId(event.target.value)} aria-label="Filter by person">
          <option value="all">Everyone</option>
          {team.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}
        </select>
      </div>

      {filtered.length === 0 && <div className="rounded-[28px] border border-line bg-card"><EmptyState title="The timeline is quiet" body="Log the call you just finished so the next person does not have to guess." action={<Button onClick={() => setFormOpen(true)}>Log activity</Button>} /></div>}

      <ol className="relative ml-3 space-y-4 border-l border-line pl-5 sm:ml-0 sm:pl-6">
        {filtered.map((item) => {
          const Icon = ICONS[item.type] || StickyNote;
          const person = owner(item.userId);
          return (
            <li key={item.id} className="relative">
              <span className="absolute -left-[34px] grid h-7 w-7 place-items-center rounded-full border border-line bg-card text-copper sm:-left-[38px]">
                <Icon size={13} />
              </span>
              <article className="min-w-0 rounded-[22px] border border-line bg-card p-4 card-shadow sm:rounded-[24px]">
                <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
                  <div className="flex min-w-0 items-center gap-2">
                    <Badge tone={item.unread ? "copper" : "muted"}>{item.type}</Badge>
                    {item.relatedLabel && <span className="text-xs text-muted">{item.relatedLabel}</span>}
                  </div>
                  <span className="text-xs text-muted">{ago(item.createdAt)} · {prettyDate(item.createdAt, "MMM d, h:mm a")}</span>
                </div>
                <h3 className="mt-2 break-words font-display text-xl leading-tight sm:text-2xl">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{item.description}</p>
                <div className="mt-3 flex items-center gap-2 text-xs text-muted">
                  <Avatar src={person?.photo} name={person?.name} size="sm" />
                  {person?.name}
                </div>
              </article>
            </li>
          );
        })}
      </ol>

      <Modal open={formOpen} title="Log activity" eyebrow="Record" onClose={() => setFormOpen(false)}>
        <ActivityForm team={team} busy={status === "loading"} onCancel={() => setFormOpen(false)} onSubmit={save} />
      </Modal>
    </div>
  );
}

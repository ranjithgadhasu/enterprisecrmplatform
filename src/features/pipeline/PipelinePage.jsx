import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { Download, Plus, Search } from "lucide-react";
import toast from "react-hot-toast";
import { OPEN_STAGES, STAGES, labelOf, stageOf } from "../../data/constants";
import { createDeal, deleteDeal, moveDeal, updateDeal } from "./pipelineSlice";
import { addActivity } from "../activities/activitiesSlice";
import { uid } from "../../utils/id";
import { useDeskState, useWorkspace } from "../../hooks/useWorkspace";
import { prettyDate } from "../../utils/format";
import { exportCsv } from "../../services/exporters";
import { buildMetrics, isOpenDeal } from "../dashboard/metrics";
import { FilterSelect, PageHeader } from "../../components/common/common";
import { DealForm } from "../../components/forms/Forms";
import { Avatar, Badge, Button, ConfirmDialog, Drawer, EmptyState, Modal } from "../../components/ui/ui";
import { cn } from "../../utils/cn";

export default function PipelinePage() {
  const location = useLocation();
  const navigate = useNavigate();
  const items = useSelector((state) => state.pipeline.items);
  const status = useSelector((state) => state.pipeline.status);
  const state = useDeskState();
  const { dispatch, team, formatMoney, owner, profile, settings } = useWorkspace();
  const metrics = buildMetrics(state, { team });
  const [query, setQuery] = useState("");
  const [ownerId, setOwnerId] = useState("all");
  const [view, setView] = useState("board");
  const [dragOver, setDragOver] = useState(null);
  const [activeId, setActiveId] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const dragging = useRef(false);

  useEffect(() => {
    if (!location.state?.focusId && !location.state?.create) return;
    if (location.state.focusId) {
      const deal = items.find((item) => item.id === location.state.focusId);
      setActiveId(location.state.focusId);
      if (deal?.stage === "closed-won") setView("won");
      if (deal?.stage === "closed-lost") setView("lost");
    }
    if (location.state.create) {
      setEditing(null);
      setFormOpen(true);
    }
    navigate(location.pathname, { replace: true, state: null });
  }, [location.state, location.pathname, navigate, items]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((deal) => {
      const text = `${deal.title} ${deal.company} ${deal.contact}`.toLowerCase();
      if (q && !text.includes(q)) return false;
      if (ownerId !== "all" && deal.ownerId !== ownerId) return false;
      if (view === "board" && !isOpenDeal(deal)) return false;
      if (view === "won" && deal.stage !== "closed-won") return false;
      if (view === "lost" && deal.stage !== "closed-lost") return false;
      return true;
    });
  }, [items, query, ownerId, view]);

  const active = items.find((deal) => deal.id === activeId);

  async function saveDeal(values) {
    try {
      if (editing) {
        await dispatch(updateDeal({ ...editing, ...values })).unwrap();
        toast.success("Deal updated");
      } else {
        const created = await dispatch(createDeal(values)).unwrap();
        dispatch(addActivity({
          id: uid("act"),
          type: "deal",
          title: `Deal opened: ${created.company}`,
          description: `${created.title} entered ${stageOf(created.stage).label.toLowerCase()}.`,
          createdAt: new Date().toISOString(),
          userId: profile.id,
          relatedLabel: created.company,
          relatedType: "deal",
          relatedId: created.id,
          unread: true,
        }));
        toast.success("Deal placed on the board");
      }
      setFormOpen(false);
      setEditing(null);
    } catch (error) {
      toast.error(error.message || "Could not save deal");
    }
  }

  async function move(id, stage) {
    const deal = items.find((item) => item.id === id);
    if (!deal || deal.stage === stage) return;
    try {
      await dispatch(moveDeal({ id, stage })).unwrap();
    } catch (error) {
      toast.error(error.message || "Could not move deal");
      return;
    }
    dispatch(addActivity({
      id: uid("act"),
      type: "deal",
      title: `${deal.company} moved to ${stageOf(stage).label}`,
      description: `${profile.name} moved ${deal.title}.`,
      createdAt: new Date().toISOString(),
      userId: profile.id,
      relatedLabel: deal.company,
      relatedType: "deal",
      relatedId: deal.id,
      unread: false,
    }));
    if (settings.notifications.dealMoved) toast.success(`${deal.company} → ${stageOf(stage).label}`);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="The board"
        title="Pipeline"
        description={`${formatMoney(metrics.pipelineValue)} open · ${formatMoney(metrics.weighted)} weighted. Drag a card, or change the stage from the record.`}
        actions={
          <>
            <Button variant="secondary" onClick={() => exportCsv("northline-deals.csv", filtered.map((deal) => ({ company: deal.company, title: deal.title, stage: deal.stage, value: deal.value, probability: deal.probability, close: prettyDate(deal.closeDate, "yyyy-MM-dd"), owner: owner(deal.ownerId)?.name })))}>
              <Download size={14} /> Export
            </Button>
            <Button onClick={() => { setEditing(null); setFormOpen(true); }}><Plus size={15} /> Add deal</Button>
          </>
        }
      />

      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex w-full rounded-2xl border border-line bg-card p-1 lg:w-auto">
          {[
            ["board", "Open board"],
            ["won", "Won"],
            ["lost", "Lost"],
          ].map(([id, label]) => (
            <button key={id} type="button" onClick={() => setView(id)} className={cn("flex-1 rounded-xl px-4 py-2 text-sm lg:flex-none", view === id ? "bg-ink text-cream" : "text-muted")}>
              {label}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-1 flex-1 gap-3 sm:grid-cols-2 lg:max-w-xl">
          <label>
            <span className="mb-1 block text-[11px] uppercase tracking-[0.14em] text-muted">Search</span>
            <span className="flex items-center gap-2 rounded-2xl border border-line bg-card px-3">
              <Search size={14} className="text-muted" />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Company or deal" className="h-10 w-full bg-transparent text-sm outline-none" />
            </span>
          </label>
          <FilterSelect label="Owner" value={ownerId} onChange={setOwnerId} options={[{ value: "all", label: "All owners" }, ...team.map((member) => ({ value: member.id, label: member.name }))]} />
        </div>
      </div>

      {view === "board" ? (
        <>
        <p className="-mt-2 text-xs text-muted sm:hidden">Swipe across the stages. Use the picker on a card to move it.</p>
        <div className="board-scroll">
          {STAGES.filter((stage) => OPEN_STAGES.includes(stage.id)).map((stage) => {
            const cards = filtered.filter((deal) => deal.stage === stage.id);
            const total = cards.reduce((sum, deal) => sum + Number(deal.value || 0), 0);
            return (
              <section
                key={stage.id}
                onDragOver={(event) => {
                  event.preventDefault();
                  setDragOver(stage.id);
                }}
                onDragLeave={() => setDragOver(null)}
                onDrop={(event) => {
                  event.preventDefault();
                  const id = event.dataTransfer.getData("text/plain");
                  setDragOver(null);
                  if (id) move(id, stage.id);
                }}
                className={cn("w-[84vw] max-w-[320px] shrink-0 rounded-[24px] border bg-paper-deep/60 p-3 sm:w-[290px] sm:rounded-[28px]", dragOver === stage.id ? "border-copper" : "border-line")}
              >
                <div className="mb-3 flex items-start justify-between px-1">
                  <div>
                    <p className="text-sm font-medium text-ink">{stage.label}</p>
                    <p className="text-xs text-muted">{cards.length} · {formatMoney(total)}</p>
                  </div>
                  <span className="mt-1 h-2.5 w-2.5 rounded-full" style={{ background: stage.color }} />
                </div>
                <div className="space-y-3">
                  {cards.map((deal) => (
                    <article
                      key={deal.id}
                      draggable
                      onDragStart={(event) => {
                        dragging.current = true;
                        event.dataTransfer.setData("text/plain", deal.id);
                        event.dataTransfer.effectAllowed = "move";
                      }}
                      onDragEnd={() => setTimeout(() => { dragging.current = false; }, 40)}
                      onClick={() => { if (!dragging.current) setActiveId(deal.id); }}
                      className="cursor-grab rounded-[22px] border border-line bg-card p-3.5 card-shadow active:cursor-grabbing"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-[11px] uppercase tracking-[0.14em] text-muted">{deal.company}</p>
                        <Badge tone={deal.priority === "urgent" || deal.priority === "high" ? "wine" : "gold"}>{deal.priority}</Badge>
                      </div>
                      <h3 className="mt-1 font-display text-xl leading-tight">{deal.title}</h3>
                      <p className="mt-3 font-display text-2xl">{formatMoney(deal.value)}</p>
                      <div className="mt-3 h-1.5 rounded-full bg-paper-deep">
                        <div className="h-full rounded-full bg-copper" style={{ width: `${deal.probability}%` }} />
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                        <Avatar src={owner(deal.ownerId)?.photo} name={owner(deal.ownerId)?.name} size="sm" />
                        <span className="text-xs text-muted">{prettyDate(deal.closeDate, "MMM d")}</span>
                      </div>
                      <label className="mt-3 block sm:hidden" onClick={(event) => event.stopPropagation()}>
                        <span className="sr-only">Move {deal.company} to another stage</span>
                        <select
                          className="field h-10 py-0 text-xs"
                          value={deal.stage}
                          onChange={(event) => move(deal.id, event.target.value)}
                        >
                          {STAGES.map((stageOption) => (
                            <option key={stageOption.id} value={stageOption.id}>
                              Move to · {stageOption.label}
                            </option>
                          ))}
                        </select>
                      </label>
                    </article>
                  ))}
                  {cards.length === 0 && <p className="rounded-2xl border border-dashed border-line px-3 py-8 text-center text-xs text-muted">Drop a deal here</p>}
                </div>
              </section>
            );
          })}
        </div>
        </>
      ) : (
        <div className="overflow-hidden rounded-[24px] border border-line bg-card sm:rounded-[28px]">
          {filtered.length === 0 ? <EmptyState title="Nothing closed in this view" body="Wins and losses appear here once a deal leaves the open board." /> : (
            <div className="divide-y divide-line">
              {filtered.map((deal) => (
                <button key={deal.id} type="button" onClick={() => setActiveId(deal.id)} className="flex w-full min-w-0 items-center gap-3 px-4 py-4 text-left hover:bg-paper sm:gap-4 sm:px-5">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-ink">{deal.company}</p>
                    <p className="truncate text-xs text-muted">{deal.title}</p>
                    <p className="mt-1 text-xs text-muted sm:hidden">{prettyDate(deal.closeDate, "MMM d, yyyy")}</p>
                  </div>
                  <span className="hidden text-xs text-muted sm:inline">{prettyDate(deal.closeDate, "MMM d, yyyy")}</span>
                  <span className="shrink-0 font-display text-xl sm:text-2xl">{formatMoney(deal.value)}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <Drawer open={Boolean(active)} title={active?.title || ""} eyebrow={active?.company} onClose={() => setActiveId(null)}>
        {active && (
          <div className="space-y-5">
            <div className="flex flex-wrap gap-2">
              <Badge tone={active.stage === "closed-won" ? "forest" : active.stage === "closed-lost" ? "wine" : "copper"}>{labelOf(STAGES, active.stage)}</Badge>
              <Badge>{active.probability}%</Badge>
            </div>
            <p className="font-display text-4xl sm:text-5xl">{formatMoney(active.value)}</p>
            <label className="block text-sm">
              <span className="mb-1.5 block text-xs text-muted">Move stage</span>
              <select className="field" value={active.stage} onChange={(event) => move(active.id, event.target.value)}>
                {STAGES.map((stage) => <option key={stage.id} value={stage.id}>{stage.label}</option>)}
              </select>
            </label>
            <div className="grid gap-2 text-sm">
              <p><span className="text-muted">Contact · </span>{active.contact}</p>
              <p><span className="text-muted">Email · </span><a className="text-copper" href={`mailto:${active.contactEmail}`}>{active.contactEmail}</a></p>
              <p><span className="text-muted">Close · </span>{prettyDate(active.closeDate, "MMMM d, yyyy")}</p>
              <p><span className="text-muted">Owner · </span>{owner(active.ownerId)?.name}</p>
              <p><span className="text-muted">Priority · </span>{active.priority}</p>
            </div>
            <p className="rounded-2xl bg-paper p-4 text-sm leading-relaxed text-muted">{active.notes}</p>
            <div className="flex gap-2">
              <Button onClick={() => { setEditing(active); setFormOpen(true); }}>Edit</Button>
              <Button variant="danger" onClick={() => setConfirm(active)}>Delete</Button>
            </div>
          </div>
        )}
      </Drawer>

      <Modal open={formOpen} title={editing ? "Edit deal" : "New deal"} eyebrow="Pipeline" onClose={() => setFormOpen(false)} size="lg">
        <DealForm initial={editing} team={team} busy={status === "loading"} onCancel={() => setFormOpen(false)} onSubmit={saveDeal} />
      </Modal>
      <ConfirmDialog
        open={Boolean(confirm)}
        title="Remove this deal?"
        body={`${confirm?.company} will leave the board. Historical charts will update.`}
        onClose={() => setConfirm(null)}
        onConfirm={async () => {
          await dispatch(deleteDeal(confirm.id));
          toast.success("Deal removed");
          setConfirm(null);
          setActiveId(null);
        }}
      />
    </div>
  );
}

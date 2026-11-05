import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { Download, Plus, Search } from "lucide-react";
import toast from "react-hot-toast";
import { INDUSTRIES, LEAD_STATUSES, SOURCES, labelOf } from "../../data/constants";
import { convertLead, createLead, deleteLead, updateLead } from "./leadsSlice";
import { addActivity } from "../activities/activitiesSlice";
import { uid } from "../../utils/id";
import { useDebounce } from "../../hooks/useDebounce";
import { useWorkspace } from "../../hooks/useWorkspace";
import { ago, prettyDate, sortRows } from "../../utils/format";
import { exportCsv } from "../../services/exporters";
import { DataTable, FilterSelect, PageHeader } from "../../components/common/common";
import { ConvertForm, LeadForm } from "../../components/forms/Forms";
import { Avatar, Badge, Button, ConfirmDialog, Drawer, EmptyState, Modal, Pager } from "../../components/ui/ui";

const PAGE_SIZE = 8;

export default function LeadsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const items = useSelector((state) => state.leads.items);
  const status = useSelector((state) => state.leads.status);
  const { dispatch, team, formatMoney, owner, profile, settings } = useWorkspace();
  const [query, setQuery] = useState("");
  const debounced = useDebounce(query);
  const [statusFilter, setStatusFilter] = useState("all");
  const [source, setSource] = useState("all");
  const [ownerId, setOwnerId] = useState("all");
  const [industry, setIndustry] = useState("all");
  const [sort, setSort] = useState({ key: "createdAt", dir: "desc" });
  const [page, setPage] = useState(1);
  const [activeId, setActiveId] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [converting, setConverting] = useState(null);
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

  useEffect(() => setPage(1), [debounced, statusFilter, source, ownerId, industry]);

  const filtered = useMemo(() => {
    const q = debounced.trim().toLowerCase();
    const rows = items.filter((lead) => {
      const text = `${lead.name} ${lead.company} ${lead.email} ${lead.location}`.toLowerCase();
      if (q && !text.includes(q)) return false;
      if (statusFilter !== "all" && lead.status !== statusFilter) return false;
      if (source !== "all" && lead.source !== source) return false;
      if (ownerId !== "all" && lead.ownerId !== ownerId) return false;
      if (industry !== "all" && lead.industry !== industry) return false;
      return true;
    });
    const getters = {
      name: (lead) => lead.name,
      company: (lead) => lead.company,
      value: (lead) => lead.value,
      score: (lead) => lead.score,
      createdAt: (lead) => new Date(lead.createdAt).getTime(),
    };
    return sortRows(rows, getters[sort.key], sort.dir);
  }, [items, debounced, statusFilter, source, ownerId, industry, sort]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const visible = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const active = items.find((lead) => lead.id === activeId);

  function toggleSort(key) {
    setSort((current) => ({ key, dir: current.key === key && current.dir === "desc" ? "asc" : "desc" }));
  }

  async function saveLead(values) {
    try {
      if (editing) {
        await dispatch(updateLead({ ...editing, ...values })).unwrap();
        toast.success("Lead updated");
      } else {
        const created = await dispatch(createLead(values)).unwrap();
        dispatch(addActivity({
          id: uid("act"),
          type: "note",
          title: `Lead added: ${created.name}`,
          description: `${created.company} entered the desk from ${created.source}.`,
          createdAt: new Date().toISOString(),
          userId: profile.id,
          relatedLabel: created.company,
          relatedType: "lead",
          relatedId: created.id,
          unread: false,
        }));
        if (settings.notifications.leadAssigned) toast.success(`${created.name} is on the desk`);
      }
      setFormOpen(false);
      setEditing(null);
    } catch (error) {
      toast.error(error.message || "Could not save lead");
    }
  }

  async function convert(values) {
    try {
      const result = await dispatch(convertLead({ lead: converting, ...values })).unwrap();
      toast.success("Account opened and deal created");
      setConverting(null);
      setActiveId(converting.id);
      navigate("/pipeline", { state: { focusId: result.dealId } });
    } catch (error) {
      toast.error(error.message || "Could not convert lead");
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Pipeline intake"
        title="Leads"
        description="Every name that has not yet become a customer. Filter the lane, then convert the ones that are ready."
        actions={
          <>
            <Button variant="secondary" onClick={() => exportCsv("northline-leads.csv", filtered.map((lead) => ({ name: lead.name, company: lead.company, email: lead.email, status: lead.status, source: lead.source, value: lead.value, score: lead.score, owner: owner(lead.ownerId)?.name })))}>
              <Download size={14} /> Export
            </Button>
            <Button onClick={() => { setEditing(null); setFormOpen(true); }}>
              <Plus size={15} /> Add lead
            </Button>
          </>
        }
      />

      <div className="pill-row">
        <button type="button" onClick={() => setStatusFilter("all")} className={`rounded-full px-3 py-1.5 text-xs ${statusFilter === "all" ? "bg-ink text-cream" : "bg-card text-muted border border-line"}`}>
          All {items.length}
        </button>
        {LEAD_STATUSES.map((item) => (
          <button key={item.id} type="button" onClick={() => setStatusFilter(item.id)} className={`rounded-full px-3 py-1.5 text-xs ${statusFilter === item.id ? "bg-ink text-cream" : "bg-card text-muted border border-line"}`}>
            {item.label} {items.filter((lead) => lead.status === item.id).length}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 rounded-[22px] border border-line bg-card p-3.5 sm:rounded-[24px] sm:p-4 md:grid-cols-5">
        <label className="col-span-2">
          <span className="mb-1 block text-[11px] uppercase tracking-[0.14em] text-muted">Search</span>
          <span className="flex items-center gap-2 rounded-2xl border border-line bg-paper px-3">
            <Search size={14} className="text-muted" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Name, company, email" className="h-10 w-full bg-transparent text-sm outline-none" />
          </span>
        </label>
        <FilterSelect label="Source" value={source} onChange={setSource} options={[{ value: "all", label: "All sources" }, ...SOURCES.map((item) => ({ value: item, label: item }))]} />
        <FilterSelect label="Owner" value={ownerId} onChange={setOwnerId} options={[{ value: "all", label: "All owners" }, ...team.map((member) => ({ value: member.id, label: member.name }))]} />
        <FilterSelect label="Industry" value={industry} onChange={setIndustry} options={[{ value: "all", label: "All industries" }, ...INDUSTRIES.map((item) => ({ value: item, label: item }))]} />
        <div className="md:hidden">
          <FilterSelect
            label="Sort by"
            value={`${sort.key}:${sort.dir}`}
            onChange={(next) => {
              const [key, dir] = next.split(":");
              setSort({ key, dir });
            }}
            options={[
              { value: "createdAt:desc", label: "Newest first" },
              { value: "createdAt:asc", label: "Oldest first" },
              { value: "value:desc", label: "Highest value" },
              { value: "score:desc", label: "Highest score" },
              { value: "name:asc", label: "Name A–Z" },
              { value: "company:asc", label: "Company A–Z" },
            ]}
          />
        </div>
      </div>

      <DataTable
        rowKey={(lead) => lead.id}
        onRow={(lead) => setActiveId(lead.id)}
        rows={visible}
        empty={<EmptyState title="No leads in this lane" body="Widen the filters, or add the next name that came in overnight." action={<Button onClick={() => setFormOpen(true)}>Add lead</Button>} />}
        columns={[
          {
            key: "name",
            header: <button type="button" className="sort-btn" onClick={() => toggleSort("name")}>Lead</button>,
            cell: (lead) => (
              <div>
                <p className="font-medium">{lead.name}</p>
                <p className="text-xs text-muted">{lead.title} · {lead.company}</p>
              </div>
            ),
          },
          { key: "status", header: "Status", mobileTop: true, cell: (lead) => <Badge tone={LEAD_STATUSES.find((item) => item.id === lead.status)?.tone}>{labelOf(LEAD_STATUSES, lead.status)}</Badge> },
          { key: "source", header: "Source", cell: (lead) => <span className="text-muted">{lead.source}</span> },
          { key: "score", label: "Score", header: <button type="button" className="sort-btn" onClick={() => toggleSort("score")}>Score</button>, cell: (lead) => (
            <div className="w-24">
              <div className="mb-1 flex justify-between text-[11px] text-muted"><span>{lead.score}</span></div>
              <div className="h-1.5 rounded-full bg-paper-deep"><div className="h-full rounded-full bg-copper" style={{ width: `${lead.score}%` }} /></div>
            </div>
          ) },
          { key: "value", label: "Value", header: <button type="button" className="sort-btn" onClick={() => toggleSort("value")}>Value</button>, align: "right", cell: (lead) => <span className="font-display text-lg">{formatMoney(lead.value)}</span> },
          { key: "owner", header: "Owner", cell: (lead) => <span className="inline-flex items-center gap-2"><Avatar src={owner(lead.ownerId)?.photo} name={owner(lead.ownerId)?.name} size="sm" />{owner(lead.ownerId)?.name.split(" ")[0]}</span> },
          { key: "created", label: "Added", header: <button type="button" className="sort-btn" onClick={() => toggleSort("createdAt")}>Added</button>, cell: (lead) => <span className="text-muted">{ago(lead.createdAt)}</span> },
        ]}
      />
      <Pager page={page} pages={pages} total={filtered.length} shown={visible.length} onPage={setPage} />

      <Drawer open={Boolean(active)} title={active?.name || ""} eyebrow={active?.company} onClose={() => setActiveId(null)}>
        {active && (
          <div className="space-y-5">
            <div className="flex flex-wrap gap-2">
              <Badge tone={LEAD_STATUSES.find((item) => item.id === active.status)?.tone}>{labelOf(LEAD_STATUSES, active.status)}</Badge>
              <Badge>{active.source}</Badge>
              <Badge tone="gold">{active.score} score</Badge>
            </div>
            <p className="font-display text-4xl">{formatMoney(active.value)}</p>
            <div className="grid gap-3 text-sm">
              <p><span className="text-muted">Title · </span>{active.title}</p>
              <p><span className="text-muted">Email · </span><a className="text-copper" href={`mailto:${active.email}`}>{active.email}</a></p>
              <p><span className="text-muted">Phone · </span>{active.phone || "—"}</p>
              <p><span className="text-muted">Location · </span>{active.location || "—"}</p>
              <p><span className="text-muted">Industry · </span>{active.industry}</p>
              <p><span className="text-muted">Owner · </span>{owner(active.ownerId)?.name}</p>
              <p><span className="text-muted">Added · </span>{prettyDate(active.createdAt, "MMMM d, yyyy")}</p>
            </div>
            <p className="rounded-2xl bg-paper p-4 text-sm leading-relaxed text-muted">{active.notes || "No notes yet."}</p>
            <div className="flex flex-wrap gap-2">
              {(active.tags || []).map((tag) => <Badge key={tag}>{tag}</Badge>)}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => { setEditing(active); setFormOpen(true); }}>Edit</Button>
              {active.status !== "converted" && <Button variant="forest" onClick={() => setConverting(active)}>Convert</Button>}
              <Button variant="danger" onClick={() => setConfirm(active)}>Delete</Button>
            </div>
          </div>
        )}
      </Drawer>

      <Modal open={formOpen} title={editing ? "Edit lead" : "New lead"} eyebrow="Intake" onClose={() => setFormOpen(false)} size="lg">
        <LeadForm initial={editing} team={team} busy={status === "loading"} onCancel={() => setFormOpen(false)} onSubmit={saveLead} />
      </Modal>
      <Modal open={Boolean(converting)} title="Convert lead" eyebrow={converting?.company} onClose={() => setConverting(null)}>
        {converting && <ConvertForm lead={converting} busy={status === "loading"} onCancel={() => setConverting(null)} onSubmit={convert} />}
      </Modal>
      <ConfirmDialog
        open={Boolean(confirm)}
        title="Remove this lead?"
        body={`${confirm?.name} will leave the desk. This does not touch customers or deals already opened.`}
        onClose={() => setConfirm(null)}
        onConfirm={async () => {
          await dispatch(deleteLead(confirm.id));
          toast.success("Lead removed");
          setConfirm(null);
          setActiveId(null);
        }}
      />
    </div>
  );
}

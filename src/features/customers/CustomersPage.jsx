import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { Download, LayoutGrid, Plus, Rows3, Search } from "lucide-react";
import toast from "react-hot-toast";
import { HEALTH, INDUSTRIES, PLANS } from "../../data/constants";
import { createCustomer, deleteCustomer, updateCustomer } from "./customersSlice";
import { addActivity } from "../activities/activitiesSlice";
import { uid } from "../../utils/id";
import { useDebounce } from "../../hooks/useDebounce";
import { useWorkspace } from "../../hooks/useWorkspace";
import { prettyDate } from "../../utils/format";
import { exportCsv } from "../../services/exporters";
import { DataTable, FilterSelect, PageHeader } from "../../components/common/common";
import { CustomerForm } from "../../components/forms/Forms";
import { Avatar, Badge, Button, ConfirmDialog, Drawer, EmptyState, Modal, Pager } from "../../components/ui/ui";

const HEALTH_TONE = { thriving: "forest", steady: "gold", watch: "copper", "at-risk": "wine" };
const PAGE_SIZE = 9;

export default function CustomersPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const items = useSelector((state) => state.customers.items);
  const activities = useSelector((state) => state.activities.items);
  const status = useSelector((state) => state.customers.status);
  const { dispatch, team, formatMoney, owner, profile } = useWorkspace();
  const [query, setQuery] = useState("");
  const debounced = useDebounce(query);
  const [health, setHealth] = useState("all");
  const [plan, setPlan] = useState("all");
  const [industry, setIndustry] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [view, setView] = useState("grid");
  const [page, setPage] = useState(1);
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

  useEffect(() => setPage(1), [debounced, health, plan, industry, statusFilter]);

  const filtered = useMemo(() => {
    const q = debounced.trim().toLowerCase();
    return items.filter((customer) => {
      const text = `${customer.company} ${customer.name} ${customer.email} ${customer.location}`.toLowerCase();
      if (q && !text.includes(q)) return false;
      if (health !== "all" && customer.health !== health) return false;
      if (plan !== "all" && customer.plan !== plan) return false;
      if (industry !== "all" && customer.industry !== industry) return false;
      if (statusFilter !== "all" && customer.status !== statusFilter) return false;
      return true;
    });
  }, [items, debounced, health, plan, industry, statusFilter]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const visible = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const active = items.find((customer) => customer.id === activeId);
  const related = activities.filter((item) => item.relatedId === active?.id || item.relatedLabel === active?.company).slice(0, 5);
  const liveArr = items.filter((customer) => customer.status !== "churned").reduce((sum, customer) => sum + Number(customer.arr || 0), 0);

  async function save(values) {
    try {
      if (editing) {
        await dispatch(updateCustomer({ ...editing, ...values })).unwrap();
        toast.success("Customer updated");
      } else {
        const created = await dispatch(createCustomer(values)).unwrap();
        dispatch(addActivity({
          id: uid("act"),
          type: "note",
          title: `Customer added: ${created.company}`,
          description: `${created.name} is now on the book at ${created.plan}.`,
          createdAt: new Date().toISOString(),
          userId: profile.id,
          relatedLabel: created.company,
          relatedType: "customer",
          relatedId: created.id,
          unread: false,
        }));
        toast.success("Customer added to the book");
      }
      setFormOpen(false);
      setEditing(null);
    } catch (error) {
      toast.error(error.message || "Could not save customer");
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="The book"
        title="Customers"
        description={`${formatMoney(liveArr)} in live ARR. Health is a human judgment, not a score from a black box.`}
        actions={
          <>
            <Button variant="secondary" onClick={() => setView(view === "grid" ? "table" : "grid")}>
              {view === "grid" ? <Rows3 size={14} /> : <LayoutGrid size={14} />}
              {view === "grid" ? "Table" : "Cards"}
            </Button>
            <Button variant="secondary" onClick={() => exportCsv("northline-customers.csv", filtered.map((customer) => ({ company: customer.company, contact: customer.name, plan: customer.plan, arr: customer.arr, health: customer.health, status: customer.status, owner: owner(customer.ownerId)?.name })))}>
              <Download size={14} /> Export
            </Button>
            <Button onClick={() => { setEditing(null); setFormOpen(true); }}><Plus size={15} /> Add customer</Button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 rounded-[22px] border border-line bg-card p-3.5 sm:rounded-[24px] sm:p-4 md:grid-cols-3 xl:grid-cols-6">
        <label className="col-span-2 md:col-span-3 xl:col-span-2">
          <span className="mb-1 block text-[11px] uppercase tracking-[0.14em] text-muted">Search</span>
          <span className="flex items-center gap-2 rounded-2xl border border-line bg-paper px-3">
            <Search size={14} className="text-muted" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Company, contact, city" className="h-10 w-full bg-transparent text-sm outline-none" />
          </span>
        </label>
        <FilterSelect label="Health" value={health} onChange={setHealth} options={[{ value: "all", label: "All health" }, ...HEALTH.map((item) => ({ value: item, label: item }))]} />
        <FilterSelect label="Plan" value={plan} onChange={setPlan} options={[{ value: "all", label: "All plans" }, ...PLANS.map((item) => ({ value: item, label: item }))]} />
        <FilterSelect label="Status" value={statusFilter} onChange={setStatusFilter} options={[{ value: "all", label: "All statuses" }, { value: "active", label: "Active" }, { value: "onboarding", label: "Onboarding" }, { value: "churned", label: "Churned" }]} />
        <FilterSelect label="Industry" value={industry} onChange={setIndustry} options={[{ value: "all", label: "All industries" }, ...INDUSTRIES.map((item) => ({ value: item, label: item }))]} />
      </div>

      {filtered.length === 0 && <div className="rounded-[28px] border border-line bg-card"><EmptyState title="No accounts in this cut" body="Change the health or plan filter, or add the account that just signed." action={<Button onClick={() => setFormOpen(true)}>Add customer</Button>} /></div>}

      {view === "grid" && filtered.length > 0 && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visible.map((customer) => (
            <button key={customer.id} type="button" onClick={() => setActiveId(customer.id)} className="overflow-hidden rounded-[28px] border border-line bg-card text-left card-shadow transition hover:-translate-y-0.5">
              <div className="h-1.5" style={{ background: customer.health === "thriving" ? "#1d6848" : customer.health === "at-risk" ? "#8f3148" : customer.health === "watch" ? "#c6532a" : "#a8843d" }} />
              <div className="p-5">
                <div className="flex items-start justify-between">
                  <div className="grid h-12 w-12 place-items-center rounded-2xl bg-paper font-display text-xl">{customer.company.slice(0, 1)}</div>
                  <Badge tone={HEALTH_TONE[customer.health]}>{customer.health}</Badge>
                </div>
                <h3 className="mt-4 break-words font-display text-[1.7rem] leading-none sm:text-3xl">{customer.company}</h3>
                <p className="mt-2 text-sm text-muted">{customer.industry} · {customer.location}</p>
                <p className="mt-5 font-display text-4xl">{formatMoney(customer.arr)}</p>
                <p className="text-[11px] uppercase tracking-[0.16em] text-muted">Annual revenue</p>
                <div className="mt-4 flex items-center justify-between text-sm">
                  <span className="inline-flex items-center gap-2 text-muted"><Avatar src={owner(customer.ownerId)?.photo} name={owner(customer.ownerId)?.name} size="sm" />{owner(customer.ownerId)?.name.split(" ")[0]}</span>
                  <Badge>{customer.plan}</Badge>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {view === "table" && filtered.length > 0 && (
        <DataTable
          rows={visible}
          rowKey={(customer) => customer.id}
          onRow={(customer) => setActiveId(customer.id)}
          columns={[
            { key: "company", header: "Company", cell: (customer) => <div><p className="font-medium">{customer.company}</p><p className="text-xs text-muted">{customer.name}</p></div> },
            { key: "health", header: "Health", mobileTop: true, cell: (customer) => <Badge tone={HEALTH_TONE[customer.health]}>{customer.health}</Badge> },
            { key: "plan", header: "Plan", cell: (customer) => customer.plan },
            { key: "arr", header: "ARR", align: "right", cell: (customer) => <span className="font-display text-xl">{formatMoney(customer.arr)}</span> },
            { key: "status", header: "Status", cell: (customer) => <span className="capitalize text-muted">{customer.status}</span> },
            { key: "owner", header: "Owner", cell: (customer) => owner(customer.ownerId)?.name },
          ]}
        />
      )}
      <Pager page={page} pages={pages} total={filtered.length} shown={visible.length} onPage={setPage} />

      <Drawer open={Boolean(active)} title={active?.company || ""} eyebrow={active?.plan} onClose={() => setActiveId(null)}>
        {active && (
          <div className="space-y-5">
            <div className="flex gap-2">
              <Badge tone={HEALTH_TONE[active.health]}>{active.health}</Badge>
              <Badge>{active.status}</Badge>
            </div>
            <p className="font-display text-4xl sm:text-5xl">{formatMoney(active.arr)}</p>
            <div className="grid gap-2 text-sm">
              <p><span className="text-muted">Contact · </span>{active.name}</p>
              <p><span className="text-muted">Email · </span><a className="text-copper" href={`mailto:${active.email}`}>{active.email}</a></p>
              <p><span className="text-muted">Phone · </span>{active.phone || "—"}</p>
              <p><span className="text-muted">Since · </span>{prettyDate(active.since, "MMMM yyyy")}</p>
              <p><span className="text-muted">Owner · </span>{owner(active.ownerId)?.name}</p>
              <p><span className="text-muted">Industry · </span>{active.industry}</p>
            </div>
            <p className="rounded-2xl bg-paper p-4 text-sm leading-relaxed text-muted">{active.notes}</p>
            <div>
              <p className="mb-2 text-[11px] uppercase tracking-[0.16em] text-muted">Recent signals</p>
              <div className="space-y-2">
                {related.length === 0 && <p className="text-sm text-muted">No activity tied to this account yet.</p>}
                {related.map((item) => (
                  <div key={item.id} className="rounded-2xl border border-line px-3 py-2 text-sm">
                    <p>{item.title}</p>
                    <p className="text-xs text-muted">{prettyDate(item.createdAt, "MMM d")}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => { setEditing(active); setFormOpen(true); }}>Edit</Button>
              <Button variant="danger" onClick={() => setConfirm(active)}>Delete</Button>
            </div>
          </div>
        )}
      </Drawer>

      <Modal open={formOpen} title={editing ? "Edit customer" : "New customer"} eyebrow="Book" onClose={() => setFormOpen(false)} size="lg">
        <CustomerForm initial={editing} team={team} busy={status === "loading"} onCancel={() => setFormOpen(false)} onSubmit={save} />
      </Modal>
      <ConfirmDialog
        open={Boolean(confirm)}
        title="Remove this customer?"
        body={`${confirm?.company} will leave the book. ARR totals will update.`}
        onClose={() => setConfirm(null)}
        onConfirm={async () => {
          await dispatch(deleteCustomer(confirm.id));
          toast.success("Customer removed");
          setConfirm(null);
          setActiveId(null);
        }}
      />
    </div>
  );
}

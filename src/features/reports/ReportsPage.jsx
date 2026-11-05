import { useMemo, useState } from "react";
import { Download } from "lucide-react";
import { buildMetrics } from "../dashboard/metrics";
import { useDeskState, useWorkspace } from "../../hooks/useWorkspace";
import { exportCsv } from "../../services/exporters";
import { MixBarChart, OwnerBarChart, RevenueChart, SourceDonut } from "../../components/charts/Charts";
import { FilterSelect, PageHeader, SectionCard } from "../../components/common/common";
import { Button } from "../../components/ui/ui";
import { cn } from "../../utils/cn";

const PERIODS = [
  { id: 30, label: "This month" },
  { id: 90, label: "Quarter" },
  { id: 180, label: "Half year" },
  { id: 365, label: "Year" },
];

export default function ReportsPage() {
  const state = useDeskState();
  const { team, formatMoney } = useWorkspace();
  const [days, setDays] = useState(365);
  const [ownerId, setOwnerId] = useState("all");
  const metrics = useMemo(() => buildMetrics(state, { days, ownerId, team }), [state, days, ownerId, team]);

  function exportReport() {
    exportCsv("northline-scorecard.csv", metrics.scorecard.map((row) => ({
      name: row.name,
      role: row.role,
      pipeline: row.pipeline,
      openDeals: row.openDeals,
      won: row.won,
      wins: row.wins,
      leads: row.leads,
      arr: row.arr,
      openTasks: row.tasks,
    })));
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="The numbers"
        title="Reports"
        description="Every figure here is computed from the desk, not pasted in. Change the period or the owner and the charts move."
        actions={<Button variant="secondary" onClick={exportReport}><Download size={14} /> Export scorecard</Button>}
      />

      <div className="flex min-w-0 flex-col gap-3 rounded-[22px] border border-line bg-card p-3.5 sm:flex-row sm:items-end sm:justify-between sm:rounded-[24px] sm:p-4">
        <div className="pill-row">
          {PERIODS.map((period) => (
            <button key={period.id} type="button" onClick={() => setDays(period.id)} className={cn("rounded-full px-3 py-1.5 text-xs", days === period.id ? "bg-ink text-cream" : "border border-line text-muted")}>
              {period.label}
            </button>
          ))}
        </div>
        <div className="w-full sm:w-56">
          <FilterSelect label="Owner" value={ownerId} onChange={setOwnerId} options={[{ value: "all", label: "Whole desk" }, ...team.map((member) => ({ value: member.id, label: member.name }))]} />
        </div>
      </div>

      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {[
          ["Booked in view", formatMoney(metrics.filteredSeries.reduce((sum, row) => sum + row.revenue, 0))],
          ["Win rate", `${metrics.winRate}%`],
          ["Won / lost", `${metrics.wonCount} / ${metrics.lostCount}`],
          ["Avg cycle", metrics.avgCycle ? `${metrics.avgCycle} days` : "—"],
        ].map(([label, value]) => (
          <article key={label} className="min-w-0 rounded-[22px] border border-line bg-card p-4 card-shadow sm:rounded-[24px] sm:p-5">
            <p className="text-[11px] uppercase tracking-[0.16em] text-muted">{label}</p>
            <p className="mt-3 font-display text-[1.5rem] leading-none tracking-tight sm:text-4xl">{value}</p>
          </article>
        ))}
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-5">
        <SectionCard title="Revenue in period" className="xl:col-span-3">
          <div className="p-4"><RevenueChart data={metrics.filteredSeries} /></div>
        </SectionCard>
        <SectionCard title="Lead sources" className="xl:col-span-2">
          <div className="p-4">{metrics.sourceMix.length ? <SourceDonut data={metrics.sourceMix} /> : <p className="py-16 text-center text-sm text-muted">No leads for this owner.</p>}</div>
        </SectionCard>
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SectionCard title="Rep performance">
          <div className="p-4"><OwnerBarChart data={metrics.scorecard.map((row) => ({ ...row, name: row.name.split(" ")[0] }))} /></div>
        </SectionCard>
        <SectionCard title="Lead mix">
          <div className="p-4"><MixBarChart data={metrics.leadMix} color="#c6532a" /></div>
        </SectionCard>
      </section>

      <SectionCard title="Activity mix">
        <div className="p-4"><MixBarChart data={metrics.activityMix} color="#1d6848" /></div>
      </SectionCard>

      <SectionCard title="Scorecard">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead>
              <tr className="border-b border-line text-[11px] uppercase tracking-[0.14em] text-muted">
                {["Rep", "Open pipeline", "Won", "Leads", "ARR cared for", "Open tasks"].map((header) => <th key={header} className="px-4 py-3 font-medium">{header}</th>)}
              </tr>
            </thead>
            <tbody>
              {metrics.scorecard.map((row) => (
                <tr key={row.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-3"><p className="font-medium">{row.name}</p><p className="text-xs text-muted">{row.role}</p></td>
                  <td className="px-4 py-3">{formatMoney(row.pipeline)}</td>
                  <td className="px-4 py-3">{formatMoney(row.won)}</td>
                  <td className="px-4 py-3">{row.leads}</td>
                  <td className="px-4 py-3">{formatMoney(row.arr)}</td>
                  <td className="px-4 py-3">{row.tasks}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  );
}

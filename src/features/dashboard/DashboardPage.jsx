import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, ArrowUpRight, CalendarClock, Target, Wallet } from "lucide-react";
import { PHOTOS } from "../../data/constants";
import { buildMetrics } from "./metrics";
import { useDeskState, useWorkspace } from "../../hooks/useWorkspace";
import { greeting, prettyDate } from "../../utils/format";
import { ActivityBarChart, RevenueChart, SourceDonut, StageBarChart } from "../../components/charts/Charts";
import { SectionCard, StatCard } from "../../components/common/common";
import { Avatar, Badge, Button } from "../../components/ui/ui";
import { labelOf, LEAD_STATUSES, STAGES } from "../../data/constants";

function insightFor(metrics, formatMoney) {
  if (metrics.overdueTasks.length) {
    return `${metrics.overdueTasks.length} task${metrics.overdueTasks.length === 1 ? " is" : "s are"} past due. Clear those before the afternoon forecast.`;
  }
  if (metrics.verbal.length) {
    return `${metrics.verbal.length} verbal commit${metrics.verbal.length === 1 ? "" : "s"} worth ${formatMoney(metrics.verbalValue)} are waiting on a signature.`;
  }
  if (metrics.atRiskArr) {
    return `${formatMoney(metrics.atRiskArr)} of live customer revenue is marked at risk.`;
  }
  return `Open pipeline is ${formatMoney(metrics.pipelineValue)} across ${metrics.openDeals} deals.`;
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const state = useDeskState();
  const { team, formatMoney, profile, owner } = useWorkspace();
  const metrics = buildMetrics(state, { team });
  const firstName = profile.name.split(" ")[0];
  const coverage = metrics.pipelineValue ? Math.round((metrics.weighted / metrics.pipelineValue) * 100) : 0;
  const pace = metrics.targetThisMonth ? Math.round((metrics.wonThisMonth / metrics.targetThisMonth) * 100) : 0;

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="rise flex min-w-0 flex-col justify-between rounded-[24px] border border-line bg-card p-5 card-shadow sm:rounded-[28px] sm:p-8 lg:col-span-7">
          <div>
            <div className="flex items-center gap-3 text-[11px] uppercase tracking-[0.22em] text-copper">
              <span className="h-px w-8 bg-copper" />
              {format(new Date(), "EEEE, MMMM d")}
            </div>
            <h1 className="mt-4 font-display text-[2.6rem] leading-[0.95] text-ink sm:text-6xl">
              {greeting()},
              <br />
              <span className="italic text-copper">{firstName}.</span>
            </h1>
            <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-muted">{insightFor(metrics, formatMoney)}</p>
          </div>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button onClick={() => navigate("/pipeline")}>Open the board</Button>
            <Button variant="secondary" onClick={() => navigate("/reports")}>Read the report</Button>
            <span className="text-xs text-muted">{metrics.openDeals} live deals · {formatMoney(metrics.weighted)} weighted</span>
          </div>
        </div>
        <div className="rise relative min-h-[260px] min-w-0 overflow-hidden rounded-[24px] bg-[#241c17] text-cream sm:rounded-[28px] lg:col-span-5" style={{ animationDelay: "80ms" }}>
          <img
            src={PHOTOS.office}
            alt=""
            className="absolute inset-0 h-full w-full object-cover opacity-70"
            onError={(event) => {
              event.currentTarget.style.display = "none";
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#14110e] via-[#14110e]/70 to-[#14110e]/15" />
          <div className="relative flex h-full min-h-[260px] flex-col justify-between p-5 sm:p-6">
            <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.18em]">
              <span className="rounded-full border border-white/20 px-3 py-1">Cedar room</span>
              <span className="text-white/70">4:00p</span>
            </div>
            <div>
              <p className="font-display text-4xl leading-none">Forecast circle</p>
              <p className="mt-3 max-w-xs text-sm leading-relaxed text-white/75">
                {metrics.verbal.length
                  ? `${metrics.verbal.slice(0, 2).map((deal) => deal.company).join(" and ")}${metrics.verbal.length > 2 ? " and others" : ""} sit in verbal.`
                  : "No verbal commits yet. The board still has room to move."}
              </p>
              <div className="mt-5 flex gap-8">
                <div>
                  <p className="font-display text-3xl">{formatMoney(metrics.verbalValue)}</p>
                  <p className="mt-1 text-[11px] uppercase tracking-[0.16em] text-white/55">Verbal</p>
                </div>
                <div>
                  <p className="font-display text-3xl">{formatMoney(metrics.wonThisMonth)}</p>
                  <p className="mt-1 text-[11px] uppercase tracking-[0.16em] text-white/55">Booked</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatCard label="Open pipeline" value={formatMoney(metrics.pipelineValue)} hint={`${metrics.openDeals} deals still in motion`} icon={<Wallet size={16} />} />
        <StatCard label="Weighted forecast" value={formatMoney(metrics.weighted)} hint={`${coverage}% of open pipeline, probability-adjusted`} icon={<Target size={16} />} delay={60} />
        <StatCard label="Booked this month" value={formatMoney(metrics.wonThisMonth)} hint={`${pace}% of the ${formatMoney(metrics.targetThisMonth)} target`} icon={<CalendarClock size={16} />} delay={120} />
        <StatCard label="At-risk revenue" value={formatMoney(metrics.atRiskArr)} hint={`${metrics.atRisk.length} account${metrics.atRisk.length === 1 ? "" : "s"} need a human`} icon={<AlertTriangle size={16} />} delay={180} />
      </section>

      <section className="grid grid-cols-2 gap-x-4 gap-y-5 rounded-[22px] border border-line bg-card px-5 py-4 text-sm text-muted card-shadow sm:grid-cols-4 sm:rounded-[24px]">
        <p><span className="font-display text-2xl text-ink">{metrics.winRate}%</span><span className="mt-1 block text-xs uppercase tracking-wider">Win rate, year</span></p>
        <p><span className="font-display text-2xl text-ink">{metrics.avgCycle || "—"}</span><span className="mt-1 block text-xs uppercase tracking-wider">Day cycle</span></p>
        <p><span className="font-display text-2xl text-ink">{metrics.newLeads.length}</span><span className="mt-1 block text-xs uppercase tracking-wider">New leads, 30 days</span></p>
        <p><span className="font-display text-2xl text-ink">{formatMoney(metrics.arr)}</span><span className="mt-1 block text-xs uppercase tracking-wider">Live ARR</span></p>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-5">
        <SectionCard title="Booked against target" className="xl:col-span-3" action={<span className="text-xs text-muted">Last eight months</span>}>
          <div className="p-4">
            <RevenueChart data={metrics.series.slice(-8)} />
          </div>
        </SectionCard>
        <SectionCard title="Open by stage" className="xl:col-span-2">
          <div className="p-4">
            <StageBarChart data={metrics.stageMix} />
          </div>
        </SectionCard>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-5">
        <SectionCard
          className="xl:col-span-3"
          title="Needs a date"
          action={<button type="button" className="text-xs text-copper" onClick={() => navigate("/pipeline")}>Board</button>}
        >
          <div className="divide-y divide-line">
            {metrics.attention.map((deal) => (
              <button
                key={deal.id}
                type="button"
                onClick={() => navigate("/pipeline", { state: { focusId: deal.id } })}
                className="flex w-full min-w-0 items-start gap-3 px-4 py-3.5 text-left hover:bg-paper sm:items-center sm:px-5"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-ink">{deal.company}</p>
                  <p className="truncate text-xs text-muted">{deal.title}</p>
                  <div className="mt-2 flex items-center gap-2 sm:hidden">
                    <Badge tone={deal.stage === "verbal" ? "forest" : deal.stage === "negotiation" ? "copper" : "gold"}>{labelOf(STAGES, deal.stage)}</Badge>
                    <span className="text-xs text-muted">{prettyDate(deal.closeDate, "MMM d")}</span>
                  </div>
                </div>
                <Badge className="hidden sm:inline-flex" tone={deal.stage === "verbal" ? "forest" : deal.stage === "negotiation" ? "copper" : "gold"}>{labelOf(STAGES, deal.stage)}</Badge>
                <span className="hidden w-24 text-right text-xs text-muted sm:block">{prettyDate(deal.closeDate, "MMM d")}</span>
                <span className="shrink-0 text-right font-display text-lg sm:w-24">{formatMoney(deal.value)}</span>
                <Avatar className="hidden sm:inline-grid" src={owner(deal.ownerId)?.photo} name={owner(deal.ownerId)?.name} size="sm" />
              </button>
            ))}
          </div>
        </SectionCard>
        <SectionCard title="Due now" className="xl:col-span-2" action={<button type="button" className="text-xs text-copper" onClick={() => navigate("/tasks")}>Tasks</button>}>
          <div className="space-y-2 p-4">
            {[...metrics.overdueTasks, ...metrics.dueToday].slice(0, 5).map((task) => (
              <button key={task.id} type="button" onClick={() => navigate("/tasks", { state: { focusId: task.id } })} className="flex w-full min-w-0 items-start justify-between gap-3 rounded-2xl bg-paper px-3 py-3 text-left">
                <span>
                  <span className="block text-sm text-ink">{task.title}</span>
                  <span className="mt-1 block text-xs text-muted">{task.relatedLabel} · {prettyDate(task.dueDate, "MMM d")}</span>
                </span>
                <Badge tone={metrics.overdueTasks.some((item) => item.id === task.id) ? "wine" : "gold"}>{task.priority}</Badge>
              </button>
            ))}
            {metrics.overdueTasks.length + metrics.dueToday.length === 0 && <p className="px-2 py-6 text-sm text-muted">Nothing is late. The afternoon is yours.</p>}
          </div>
        </SectionCard>
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SectionCard title="Where leads arrive" action={<button type="button" className="inline-flex items-center gap-1 text-xs text-copper" onClick={() => navigate("/leads")}>Leads <ArrowUpRight size={12} /></button>}>
          <div className="grid grid-cols-1 gap-2 p-4 md:grid-cols-[minmax(0,1fr)_160px] md:items-center">
            <SourceDonut data={metrics.sourceMix} />
            <div className="space-y-2">
              {metrics.leadMix.slice(0, 4).map((item) => (
                <div key={item.id} className="flex items-center justify-between text-sm">
                  <span className="text-muted">{labelOf(LEAD_STATUSES, item.id)}</span>
                  <span className="font-display text-xl">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </SectionCard>
        <SectionCard title="The week on the desk" action={<button type="button" className="text-xs text-copper" onClick={() => navigate("/activities")}>Activity</button>}>
          <div className="p-4">
            <ActivityBarChart data={metrics.week} />
            <div className="mt-2 space-y-2">
              {metrics.recentActivities.slice(0, 3).map((item) => (
                <div key={item.id} className="flex items-start justify-between gap-3 text-sm">
                  <p className="text-ink">{item.title}</p>
                  <p className="shrink-0 text-xs text-muted">{prettyDate(item.createdAt, "MMM d")}</p>
                </div>
              ))}
            </div>
          </div>
        </SectionCard>
      </section>
    </div>
  );
}

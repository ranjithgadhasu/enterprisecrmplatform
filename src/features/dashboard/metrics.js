import { differenceInDays, endOfMonth, format, isBefore, startOfDay, startOfMonth, subDays } from "date-fns";
import { HEALTH, LEAD_STATUSES, MONTH_TARGETS, OPEN_STAGES, SOURCES, STAGES, TEAM } from "../../data/constants";
import { safeDate } from "../../utils/format";

export function isOpenDeal(deal) {
  return OPEN_STAGES.includes(deal.stage);
}

function sumValues(rows, key = "value") {
  return rows.reduce((total, row) => total + (Number(row[key]) || 0), 0);
}

export function withinDays(iso, days, now = new Date()) {
  const date = safeDate(iso);
  if (!date) return false;
  return date >= subDays(now, days);
}

export function monthSeries(deals, months = 12) {
  const now = new Date();
  const rows = [];
  for (let i = months - 1; i >= 0; i -= 1) {
    const start = startOfMonth(new Date(now.getFullYear(), now.getMonth() - i, 1));
    const end = endOfMonth(start);
    const won = deals.filter((deal) => {
      const close = safeDate(deal.closeDate);
      return deal.stage === "closed-won" && close && close >= start && close <= end;
    });
    const lost = deals.filter((deal) => {
      const close = safeDate(deal.closeDate);
      return deal.stage === "closed-lost" && close && close >= start && close <= end;
    });
    const indexFromOldest = months - 1 - i;
    const targetIndex = MONTH_TARGETS.length - months + indexFromOldest;
    rows.push({
      key: format(start, "yyyy-MM"),
      label: format(start, "MMM"),
      full: format(start, "MMMM yyyy"),
      revenue: sumValues(won),
      losses: sumValues(lost),
      target: MONTH_TARGETS[targetIndex] ?? MONTH_TARGETS.at(-1),
      wins: won.length,
      lostCount: lost.length,
    });
  }
  return rows;
}

export function buildMetrics(state, { days = 365, ownerId = "all", team = TEAM } = {}) {
  const match = (id) => ownerId === "all" || id === ownerId;
  const deals = state.pipeline.items.filter((deal) => match(deal.ownerId));
  const leads = state.leads.items.filter((lead) => match(lead.ownerId));
  const tasks = state.tasks.items.filter((task) => match(task.ownerId));
  const customers = state.customers.items.filter((customer) => match(customer.ownerId));
  const activities = state.activities.items.filter((activity) => match(activity.userId));
  const now = new Date();
  const open = deals.filter(isOpenDeal);
  const pipelineValue = sumValues(open);
  const weighted = open.reduce((total, deal) => total + (Number(deal.value) || 0) * ((Number(deal.probability) || 0) / 100), 0);
  const series = monthSeries(state.pipeline.items.filter((deal) => match(deal.ownerId)), 12);
  const current = series.at(-1) || { revenue: 0, target: 0 };
  const recentWon = deals.filter((deal) => deal.stage === "closed-won" && withinDays(deal.closeDate, days, now));
  const recentLost = deals.filter((deal) => deal.stage === "closed-lost" && withinDays(deal.closeDate, days, now));
  const decided = recentWon.length + recentLost.length;
  const cycles = recentWon
    .map((deal) => {
      const start = safeDate(deal.createdAt);
      const end = safeDate(deal.closeDate);
      if (!start || !end) return null;
      return Math.max(1, differenceInDays(end, start));
    })
    .filter((value) => value != null);
  const verbal = open.filter((deal) => deal.stage === "verbal");
  const activeCustomers = customers.filter((customer) => customer.status !== "churned");
  const atRisk = activeCustomers.filter((customer) => customer.health === "at-risk");
  const todayKey = format(now, "yyyy-MM-dd");

  const stageMix = STAGES.filter((stage) => OPEN_STAGES.includes(stage.id)).map((stage) => {
    const rows = open.filter((deal) => deal.stage === stage.id);
    return { ...stage, name: stage.label, count: rows.length, value: sumValues(rows) };
  });

  const sourceMix = SOURCES.map((source) => ({
    name: source,
    value: leads.filter((lead) => lead.source === source).length,
  })).filter((source) => source.value > 0);

  const healthMix = HEALTH.map((health) => {
    const rows = activeCustomers.filter((customer) => customer.health === health);
    return { health, name: health, arr: sumValues(rows, "arr"), count: rows.length };
  });

  const leadMix = LEAD_STATUSES.map((status) => ({
    ...status,
    name: status.label,
    value: leads.filter((lead) => lead.status === status.id).length,
  }));

  const activityMix = ["call", "email", "meeting", "note", "deal", "task"].map((type) => ({
    name: type,
    value: activities.filter((activity) => activity.type === type && withinDays(activity.createdAt, days, now)).length,
  }));

  const week = Array.from({ length: 7 }, (_, index) => {
    const date = subDays(now, 6 - index);
    const key = format(date, "yyyy-MM-dd");
    return {
      label: format(date, "EEE"),
      count: activities.filter((activity) => {
        const created = safeDate(activity.createdAt);
        return created && format(created, "yyyy-MM-dd") === key;
      }).length,
    };
  });

  const scorecard = team.map((member) => {
    const ownedDeals = state.pipeline.items.filter((deal) => deal.ownerId === member.id);
    const ownedOpen = ownedDeals.filter(isOpenDeal);
    const ownedWon = ownedDeals.filter((deal) => deal.stage === "closed-won" && withinDays(deal.closeDate, days, now));
    const ownedLeads = state.leads.items.filter((lead) => lead.ownerId === member.id && lead.status !== "converted" && lead.status !== "unqualified");
    const ownedCustomers = state.customers.items.filter((customer) => customer.ownerId === member.id && customer.status !== "churned");
    const openTasks = state.tasks.items.filter((task) => task.ownerId === member.id && task.status !== "done");
    return {
      ...member,
      pipeline: sumValues(ownedOpen),
      openDeals: ownedOpen.length,
      won: sumValues(ownedWon),
      wins: ownedWon.length,
      leads: ownedLeads.length,
      arr: sumValues(ownedCustomers, "arr"),
      tasks: openTasks.length,
    };
  }).filter((member) => ownerId === "all" || member.id === ownerId);

  const filteredSeries = series.filter((row) => {
    const start = new Date(`${row.key}-01T12:00:00`);
    return endOfMonth(start) >= subDays(now, days);
  });

  return {
    pipelineValue,
    weighted,
    openDeals: open.length,
    wonThisMonth: current.revenue,
    targetThisMonth: current.target,
    winRate: decided ? Math.round((recentWon.length / decided) * 100) : 0,
    wonCount: recentWon.length,
    lostCount: recentLost.length,
    avgCycle: cycles.length ? Math.round(cycles.reduce((total, value) => total + value, 0) / cycles.length) : 0,
    overdueTasks: tasks.filter((task) => task.status !== "done" && safeDate(task.dueDate) && isBefore(startOfDay(safeDate(task.dueDate)), startOfDay(now))),
    dueToday: tasks.filter((task) => task.status !== "done" && safeDate(task.dueDate) && format(safeDate(task.dueDate), "yyyy-MM-dd") === todayKey),
    openTasks: tasks.filter((task) => task.status !== "done"),
    verbal,
    verbalValue: sumValues(verbal),
    arr: sumValues(activeCustomers, "arr"),
    atRisk,
    atRiskArr: sumValues(atRisk, "arr"),
    newLeads: leads.filter((lead) => withinDays(lead.createdAt, 30, now) && lead.status === "new"),
    activeCustomers: activeCustomers.length,
    stageMix,
    sourceMix,
    healthMix,
    leadMix,
    activityMix,
    week,
    series,
    filteredSeries,
    scorecard,
    attention: [...open].sort((a, b) => (safeDate(a.closeDate)?.getTime() || Infinity) - (safeDate(b.closeDate)?.getTime() || Infinity)).slice(0, 6),
    recentActivities: [...activities].sort((a, b) => (safeDate(b.createdAt)?.getTime() || 0) - (safeDate(a.createdAt)?.getTime() || 0)).slice(0, 6),
  };
}

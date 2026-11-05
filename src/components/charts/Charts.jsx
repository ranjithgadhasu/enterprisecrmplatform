import { useSelector } from "react-redux";
import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { SOURCE_COLORS } from "../../data/constants";
import { useIsMobile } from "../../hooks/useMediaQuery";
import { compactMoney } from "../../utils/format";

function useChartTheme() {
  const theme = useSelector((state) => state.settings.appearance.theme);
  const currency = useSelector((state) => state.settings.company.currency);
  const mobile = useIsMobile();
  return {
    tick: theme === "dark" ? "#b3a89c" : "#7c7368",
    grid: theme === "dark" ? "#322c26" : "#e4dcd0",
    currency,
    mobile,
    font: mobile ? 11 : 12,
    axisWidth: mobile ? 46 : 64,
  };
}

function Tip({ active, payload, label, currency }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-2xl border border-line bg-card px-3 py-2 text-xs shadow-xl">
      <p className="mb-1 font-medium text-ink">{label}</p>
      {payload.map((entry) => (
        <p key={entry.dataKey || entry.name} className="text-muted">
          <span style={{ color: entry.color }}>{entry.name}: </span>
          {typeof entry.value === "number" && ["revenue", "target", "value", "arr", "losses", "pipeline", "won"].includes(entry.dataKey)
            ? compactMoney(entry.value, currency)
            : entry.value}
        </p>
      ))}
    </div>
  );
}

export function RevenueChart({ data }) {
  const { tick, grid, currency, mobile, font, axisWidth } = useChartTheme();
  return (
    <div className="h-[240px] w-full min-w-0 sm:h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 10, right: mobile ? 4 : 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="bookedFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#c6532a" stopOpacity={0.32} />
              <stop offset="100%" stopColor="#c6532a" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke={grid} vertical={false} />
          <XAxis dataKey="label" tick={{ fill: tick, fontSize: font }} axisLine={false} tickLine={false} interval={mobile && data.length > 8 ? 1 : 0} />
          <YAxis tickFormatter={(value) => compactMoney(value, currency)} tick={{ fill: tick, fontSize: font }} axisLine={false} tickLine={false} width={axisWidth} />
          <Tooltip content={<Tip currency={currency} />} />
          <Legend wrapperStyle={{ fontSize: font }} />
          <Area type="monotone" dataKey="revenue" name="Booked" stroke="#c6532a" fill="url(#bookedFill)" strokeWidth={2.4} />
          <Area type="monotone" dataKey="target" name="Target" stroke="#a8843d" fill="transparent" strokeDasharray="5 5" strokeWidth={1.6} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

export function StageBarChart({ data }) {
  const { tick, grid, currency, mobile, font, axisWidth } = useChartTheme();

  if (mobile) {
    return (
      <div className="h-[230px] w-full min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 4, right: 12, left: 0, bottom: 0 }}>
            <CartesianGrid stroke={grid} horizontal={false} />
            <XAxis type="number" tickFormatter={(value) => compactMoney(value, currency)} tick={{ fill: tick, fontSize: font }} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey="name" tick={{ fill: tick, fontSize: font }} axisLine={false} tickLine={false} width={82} />
            <Tooltip content={<Tip currency={currency} />} />
            <Bar dataKey="value" name="Value" radius={[0, 8, 8, 0]}>
              {data.map((entry) => (
                <Cell key={entry.name} fill={entry.color || "#c6532a"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }

  return (
    <div className="h-[300px] w-full min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke={grid} vertical={false} />
          <XAxis dataKey="name" tick={{ fill: tick, fontSize: font }} axisLine={false} tickLine={false} />
          <YAxis tickFormatter={(value) => compactMoney(value, currency)} tick={{ fill: tick, fontSize: font }} axisLine={false} tickLine={false} width={axisWidth} />
          <Tooltip content={<Tip currency={currency} />} />
          <Bar dataKey="value" name="Value" radius={[8, 8, 0, 0]}>
            {data.map((entry) => (
              <Cell key={entry.name} fill={entry.color || "#c6532a"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function SourceDonut({ data }) {
  const { currency, mobile, font } = useChartTheme();
  return (
    <div className="h-[260px] w-full min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius={mobile ? 50 : 62} outerRadius={mobile ? 74 : 88} paddingAngle={3} stroke="none">
            {data.map((entry) => (
              <Cell key={entry.name} fill={SOURCE_COLORS[entry.name] || "#a8843d"} />
            ))}
          </Pie>
          <Tooltip content={<Tip currency={currency} />} />
          <Legend wrapperStyle={{ fontSize: font }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export function OwnerBarChart({ data }) {
  const { tick, grid, currency, mobile, font, axisWidth } = useChartTheme();
  return (
    <div className="h-[260px] w-full min-w-0 sm:h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: mobile ? 4 : 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke={grid} vertical={false} />
          <XAxis dataKey="name" tick={{ fill: tick, fontSize: mobile ? 10 : 11 }} axisLine={false} tickLine={false} interval={0} />
          <YAxis tickFormatter={(value) => compactMoney(value, currency)} tick={{ fill: tick, fontSize: font }} axisLine={false} tickLine={false} width={axisWidth} />
          <Tooltip content={<Tip currency={currency} />} />
          <Legend wrapperStyle={{ fontSize: font }} />
          <Bar dataKey="pipeline" name="Open pipeline" fill="#c6532a" radius={[7, 7, 0, 0]} />
          <Bar dataKey="won" name="Won in period" fill="#1d6848" radius={[7, 7, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ActivityBarChart({ data }) {
  const { tick, grid, font } = useChartTheme();
  return (
    <div className="h-[200px] w-full min-w-0 sm:h-[220px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid stroke={grid} vertical={false} />
          <XAxis dataKey="label" tick={{ fill: tick, fontSize: font }} axisLine={false} tickLine={false} interval={0} />
          <YAxis allowDecimals={false} tick={{ fill: tick, fontSize: font }} axisLine={false} tickLine={false} width={28} />
          <Tooltip content={<Tip />} />
          <Bar dataKey="count" name="Activities" fill="#1d6848" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function MixBarChart({ data, color = "#a8843d" }) {
  const { tick, grid, mobile, font } = useChartTheme();
  return (
    <div className="h-[260px] w-full min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: mobile ? 0 : 16, right: 12 }}>
          <CartesianGrid stroke={grid} horizontal={false} />
          <XAxis type="number" allowDecimals={false} tick={{ fill: tick, fontSize: font }} axisLine={false} tickLine={false} />
          <YAxis type="category" dataKey="name" tick={{ fill: tick, fontSize: font }} axisLine={false} tickLine={false} width={mobile ? 74 : 92} />
          <Tooltip content={<Tip />} />
          <Bar dataKey="value" name="Count" fill={color} radius={[0, 8, 8, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

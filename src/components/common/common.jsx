import { cn } from "../../utils/cn";

export function PageHeader({ eyebrow, title, description, actions }) {
  return (
    <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow && <p className="text-[11px] uppercase tracking-[0.2em] text-copper">{eyebrow}</p>}
        <h1 className="mt-1 font-display text-[2.4rem] leading-none text-ink sm:text-5xl">{title}</h1>
        {description && <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function StatCard({ label, value, hint, icon, delay = 0 }) {
  return (
    <article className="rise min-w-0 rounded-[22px] border border-line bg-card p-4 card-shadow sm:rounded-[24px] sm:p-5" style={{ animationDelay: `${delay}ms` }}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-[10px] uppercase tracking-[0.14em] text-muted sm:text-[11px] sm:tracking-[0.16em]">{label}</p>
        <span className="hidden h-9 w-9 shrink-0 place-items-center rounded-2xl bg-paper text-copper sm:grid">{icon}</span>
      </div>
      <p className="mt-3 font-display text-[1.5rem] leading-none tracking-tight text-ink sm:mt-4 sm:text-[2rem]">{value}</p>
      <p className="mt-2 text-[11px] leading-snug text-muted sm:mt-3 sm:text-xs sm:leading-relaxed">{hint}</p>
    </article>
  );
}

export function Sparkline({ data = [], color = "#c6532a" }) {
  if (data.length < 2) return null;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const width = 92;
  const height = 32;
  const points = data
    .map((value, index) => {
      const x = (index / (data.length - 1)) * width;
      const y = height - ((value - min) / (max - min || 1)) * (height - 4) - 2;
      return `${x},${y}`;
    })
    .join(" ");
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden>
      <polyline fill="none" stroke={color} strokeWidth="1.8" points={points} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

export function SectionCard({ title, action, children, className }) {
  return (
    <section className={cn("min-w-0 rounded-[24px] border border-line bg-card card-shadow sm:rounded-[28px]", className)}>
      {(title || action) && (
        <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-4 sm:px-5">
          <h2 className="min-w-0 font-display text-xl text-ink sm:text-2xl">{title}</h2>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      {children}
    </section>
  );
}

function columnLabel(column) {
  if (column.label) return column.label;
  if (typeof column.header === "string") return column.header;
  return column.key;
}

{/*
  Desktop: a classic table (scrolls sideways if the viewport is narrow).
  Phones: each row becomes a card. The first column is the card title,
  columns flagged `mobileTop` sit beside it, the rest become label/value pairs.
 */}
export function DataTable({ columns, rows, rowKey, onRow, empty }) {
  const [first, ...others] = columns;
  const top = others.filter((column) => column.mobileTop);
  const rest = others.filter((column) => !column.mobileTop && !column.mobileHide);

  return (
    <div className="overflow-hidden rounded-[24px] border border-line bg-card card-shadow sm:rounded-[28px]">
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[760px] border-collapse text-left">
          <thead>
            <tr className="border-b border-line text-[11px] uppercase tracking-[0.14em] text-muted">
              {columns.map((column) => (
                <th key={column.key} className={cn("px-4 py-3 font-medium", column.align === "right" && "text-right", column.className)}>
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length}>{empty}</td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr
                  key={rowKey(row)}
                  onClick={() => onRow?.(row)}
                  className={cn("border-b border-line last:border-0", onRow && "cursor-pointer hover:bg-paper")}
                >
                  {columns.map((column) => (
                    <td key={column.key} className={cn("table-cell px-4 py-3.5 align-middle text-sm text-ink", column.align === "right" && "text-right")}>
                      {column.cell(row)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="md:hidden">
        {rows.length === 0 ? (
          empty
        ) : (
          <ul className="divide-y divide-line">
            {rows.map((row) => (
              <li key={rowKey(row)}>
                <div
                  role={onRow ? "button" : undefined}
                  tabIndex={onRow ? 0 : undefined}
                  onClick={() => onRow?.(row)}
                  onKeyDown={(event) => {
                    if (onRow && (event.key === "Enter" || event.key === " ")) {
                      event.preventDefault();
                      onRow(row);
                    }
                  }}
                  className={cn("px-4 py-4", onRow && "cursor-pointer active:bg-paper")}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1 text-sm">{first.cell(row)}</div>
                    {top.map((column) => (
                      <div key={column.key} className="shrink-0">
                        {column.cell(row)}
                      </div>
                    ))}
                  </div>
                  {rest.length > 0 && (
                    <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3">
                      {rest.map((column) => (
                        <div key={column.key} className="min-w-0">
                          <dt className="text-[10px] uppercase tracking-[0.14em] text-muted">{columnLabel(column)}</dt>
                          <dd className="mt-1 text-sm text-ink">{column.cell(row)}</dd>
                        </div>
                      ))}
                    </dl>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export function FilterSelect({ label, value, onChange, options }) {
  return (
    <label className="block min-w-0 sm:min-w-[140px]">
      <span className="mb-1 block text-[11px] uppercase tracking-[0.14em] text-muted">{label}</span>
      <select className="field h-10 py-0" value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

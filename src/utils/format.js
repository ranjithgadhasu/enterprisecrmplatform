import { format, formatDistanceToNow, isValid, parseISO } from "date-fns";

export function safeDate(value) {
  if (!value) return null;
  const date = typeof value === "string" ? parseISO(value) : new Date(value);
  return isValid(date) ? date : null;
}

export function money(value, currency = "USD") {
  const amount = Number(value) || 0;
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `$${Math.round(amount).toLocaleString("en-US")}`;
  }
}

export function compactMoney(value, currency = "USD") {
  const amount = Number(value) || 0;
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(amount);
  } catch {
    return money(amount, currency);
  }
}

export function prettyDate(value, pattern = "MMM d") {
  const date = safeDate(value);
  if (!date) return "—";
  return format(date, pattern);
}

export function ago(value) {
  const date = safeDate(value);
  if (!date) return "—";
  return formatDistanceToNow(date, { addSuffix: true });
}

export function toDateInput(value) {
  const date = safeDate(value);
  if (!date) return "";
  return format(date, "yyyy-MM-dd");
}

export function fromDateInput(value) {
  if (!value) return "";
  const date = new Date(`${value}T12:00:00`);
  return isValid(date) ? date.toISOString() : "";
}

export function initials(name = "") {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function colorFromName(name = "") {
  const palette = ["#c6532a", "#1d6848", "#a8843d", "#3d5a80", "#8f3148", "#5f7d64"];
  let hash = 0;
  for (const char of name) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return palette[hash % palette.length];
}

export function greeting(date = new Date()) {
  const hour = date.getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export function sortRows(rows, getter, dir = "asc") {
  return [...rows].sort((a, b) => {
    const av = getter(a);
    const bv = getter(b);
    if (av == null && bv == null) return 0;
    if (av == null) return 1;
    if (bv == null) return -1;
    if (typeof av === "number" && typeof bv === "number") {
      return dir === "asc" ? av - bv : bv - av;
    }
    return dir === "asc"
      ? String(av).localeCompare(String(bv))
      : String(bv).localeCompare(String(av));
  });
}

export function downloadFile(filename, content, type = "text/plain") {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function toCsv(rows) {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  const escape = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;
  return [headers.join(","), ...rows.map((row) => headers.map((key) => escape(row[key])).join(","))].join("\n");
}

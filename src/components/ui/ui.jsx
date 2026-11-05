import { forwardRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Sparkles, X } from "lucide-react";
import { cn } from "../../utils/cn";
import { colorFromName, initials } from "../../utils/format";

const TONES = {
  copper: "tone-copper",
  gold: "tone-gold",
  forest: "tone-forest",
  moss: "tone-moss",
  wine: "tone-wine",
  muted: "tone-muted",
  ink: "tone-ink",
};

export function Button({ variant = "primary", size = "md", className, children, type = "button", ...props }) {
  const variants = {
    primary: "bg-copper text-white hover:bg-copper-deep",
    secondary: "border border-line bg-card text-ink hover:bg-paper-deep",
    ghost: "text-muted hover:bg-paper-deep hover:text-ink",
    danger: "bg-wine text-white hover:opacity-90",
    forest: "bg-forest text-white hover:opacity-90",
  };
  const sizes = {
    sm: "h-8 px-3 text-xs rounded-xl",
    md: "h-10 px-4 text-sm rounded-2xl",
    lg: "h-12 px-5 text-sm rounded-2xl",
  };
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center gap-2 font-medium transition disabled:cursor-not-allowed disabled:opacity-50",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function IconButton({ label, className, children, type = "button", ...props }) {
  return (
    <button
      type={type}
      aria-label={label}
      className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-xl text-muted transition hover:bg-paper-deep hover:text-ink sm:h-9 sm:w-9", className)}
      {...props}
    >
      {children}
    </button>
  );
}

export function Badge({ tone = "muted", children, className }) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium capitalize tracking-wide", TONES[tone] || TONES.muted, className)}>
      {children}
    </span>
  );
}

export function Avatar({ src, name = "", size = "md", className }) {
  const sizes = { sm: "h-7 w-7 text-[10px]", md: "h-9 w-9 text-xs", lg: "h-12 w-12 text-sm" };
  return (
    <span
      className={cn("relative inline-grid shrink-0 place-items-center overflow-hidden rounded-full font-medium text-white", sizes[size], className)}
      style={{ background: colorFromName(name) }}
      title={name}
    >
      {initials(name) || "?"}
      {src && (
        <img
          src={src}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          onError={(event) => {
            event.currentTarget.style.display = "none";
          }}
        />
      )}
    </span>
  );
}

export function EmptyState({ title, body, action }) {
  return (
    <div className="px-6 py-14 text-center">
      <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-paper-deep text-copper">
        <Sparkles size={18} />
      </div>
      <p className="font-display text-2xl text-ink">{title}</p>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted">{body}</p>
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  );
}

function useLock(open, onClose) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => {
      if (event.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open, onClose]);
}

export function Modal({ open, title, eyebrow, onClose, children, size = "md" }) {
  useLock(open, onClose);
  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-end justify-center p-0 sm:items-center sm:p-6">
      <button type="button" className="absolute inset-0 bg-[#1c1712]/45" aria-label="Close dialog" onClick={onClose} />
      <div className={cn("relative max-h-[92dvh] w-full overflow-y-auto rounded-t-[28px] border border-line bg-card card-shadow sm:max-h-[92vh] sm:rounded-[28px]", size === "lg" ? "max-w-3xl" : "max-w-xl")}>
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-line bg-card px-5 py-4 sm:px-6 sm:py-5">
          <div className="min-w-0">
            {eyebrow && <p className="text-[11px] uppercase tracking-[0.18em] text-copper">{eyebrow}</p>}
            <h2 className="mt-1 font-display text-[1.5rem] leading-none text-ink sm:text-[1.7rem]">{title}</h2>
          </div>
          <IconButton label="Close" onClick={onClose}>
            <X size={16} />
          </IconButton>
        </div>
        <div className="sheet-safe px-5 pt-5 sm:px-6">{children}</div>
      </div>
    </div>,
    document.body,
  );
}

export function Drawer({ open, title, eyebrow, onClose, children }) {
  useLock(open, onClose);
  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-[70]">
      <button type="button" className="absolute inset-0 bg-[#1c1712]/40" aria-label="Close panel" onClick={onClose} />
      <aside className="absolute inset-y-0 right-0 flex w-full max-w-[460px] flex-col border-l border-line bg-card shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4 sm:py-5">
          <div className="min-w-0">
            {eyebrow && <p className="truncate text-[11px] uppercase tracking-[0.18em] text-copper">{eyebrow}</p>}
            <h2 className="mt-1 break-words font-display text-[1.75rem] leading-[1.05] text-ink sm:text-3xl sm:leading-none">{title}</h2>
          </div>
          <IconButton label="Close panel" onClick={onClose}>
            <X size={16} />
          </IconButton>
        </div>
        <div className="sheet-safe flex-1 overflow-y-auto px-5 pt-5">{children}</div>
      </aside>
    </div>,
    document.body,
  );
}

export function ConfirmDialog({ open, title, body, confirmLabel = "Delete", onConfirm, onClose, busy }) {
  return (
    <Modal open={open} title={title || "Confirm"} eyebrow="Please confirm" onClose={onClose}>
      <p className="text-sm leading-relaxed text-muted">{body}</p>
      <div className="mt-6 flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="danger" disabled={busy} onClick={onConfirm}>
          {busy ? "Working…" : confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}

function FieldWrap({ label, error, hint, children }) {
  return (
    <label className="block">
      {label && <span className="mb-1.5 block text-xs font-medium text-muted">{label}</span>}
      {children}
      {error ? <span className="mt-1 block text-xs text-wine">{error}</span> : hint ? <span className="mt-1 block text-xs text-muted">{hint}</span> : null}
    </label>
  );
}

export const TextInput = forwardRef(function TextInput({ label, error, hint, className, ...props }, ref) {
  return (
    <FieldWrap label={label} error={error} hint={hint}>
      <input ref={ref} className={cn("field", error && "field-error", className)} {...props} />
    </FieldWrap>
  );
});

export const TextArea = forwardRef(function TextArea({ label, error, hint, className, rows = 4, ...props }, ref) {
  return (
    <FieldWrap label={label} error={error} hint={hint}>
      <textarea ref={ref} rows={rows} className={cn("field resize-y", error && "field-error", className)} {...props} />
    </FieldWrap>
  );
});

export const SelectInput = forwardRef(function SelectInput({ label, error, hint, options = [], placeholder, className, ...props }, ref) {
  return (
    <FieldWrap label={label} error={error} hint={hint}>
      <select ref={ref} className={cn("field", error && "field-error", className)} {...props}>
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </FieldWrap>
  );
});

export function Pager({ page, pages, onPage, total, shown }) {
  if (!total) return null;
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-1 pt-3 text-sm text-muted">
      <span>
        Showing {shown} of {total}
      </span>
      <div className="flex items-center gap-2">
        <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => onPage(page - 1)}>
          Prev
        </Button>
        <span className="min-w-16 text-center text-xs">
          {page} / {pages}
        </span>
        <Button variant="secondary" size="sm" disabled={page >= pages} onClick={() => onPage(page + 1)}>
          Next
        </Button>
      </div>
    </div>
  );
}

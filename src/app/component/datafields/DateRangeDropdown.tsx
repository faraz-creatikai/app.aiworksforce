import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";

/* ------------------------------------------------------------------ */
/* Date helpers – everything is a plain "YYYY-MM-DD" string so there   */
/* are no timezone surprises (string comparison == date comparison).   */
/* ------------------------------------------------------------------ */

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const MONTHS_SHORT = MONTHS.map((m) => m.slice(0, 3));
const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

const pad = (n: number) => String(n).padStart(2, "0");
const toISO = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`;

const parseISO = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return { y, m: m - 1, d };
};

const isValidISO = (iso?: string | null): iso is string => !!iso && /^\d{4}-\d{2}-\d{2}$/.test(iso);

const dayCount = (a: string, b: string) => {
  const A = parseISO(a);
  const B = parseISO(b);
  return Math.round((Date.UTC(B.y, B.m, B.d) - Date.UTC(A.y, A.m, A.d)) / 86400000) + 1;
};

const formatShort = (iso: string, currentYear: number) => {
  const { y, m, d } = parseISO(iso);
  return `${d} ${MONTHS_SHORT[m]}${y !== currentYear ? ` ${y}` : ""}`;
};

const POPOVER_WIDTH = 320;

/* ------------------------------------------------------------------ */

export type DateRangeDropdownProps = {
  /** true when the "custom" preset is the one currently selected */
  active: boolean;
  start: string;
  end: string;
  /** latest selectable day (today in IST) – e.g. istDate(0) */
  maxDate: string;
  onApply: (start: string, end: string) => void;
  disabled?: boolean;
};

export default function DateRangeDropdown({
  active,
  start,
  end,
  maxDate,
  onApply,
  disabled,
}: DateRangeDropdownProps) {
  const [open, setOpen] = useState(false);
  const [alignRight, setAlignRight] = useState(false);

  // Draft selection lives inside the dropdown until "Apply" is pressed
  const [draftStart, setDraftStart] = useState<string | null>(null);
  const [draftEnd, setDraftEnd] = useState<string | null>(null);
  const [hover, setHover] = useState<string | null>(null);

  const max = parseISO(maxDate);
  const [view, setView] = useState({ y: max.y, m: max.m });

  const triggerRef = useRef<HTMLButtonElement>(null);

  /* ---------- open / close ---------- */

  const openPicker = () => {
    const s = isValidISO(start) ? start : null;
    const e = isValidISO(end) ? end : null;
    setDraftStart(s);
    setDraftEnd(s && e ? e : null);
    setHover(null);
    const anchor = parseISO(s ?? maxDate);
    setView({ y: anchor.y, m: anchor.m });
    setOpen(true);
  };

  const close = () => setOpen(false);

  // Flip the popover to the right edge if it would overflow the viewport (desktop)
  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setAlignRight(rect.left + POPOVER_WIDTH > window.innerWidth - 12);
  }, [open]);

  // Escape to close
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Lock page scroll while the bottom sheet is up on small screens
  useEffect(() => {
    if (!open || window.innerWidth >= 640) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  /* ---------- selection logic ---------- */

  const pick = (iso: string) => {
    if (iso > maxDate) return;
    // Start a new range
    if (!draftStart || draftEnd) {
      setDraftStart(iso);
      setDraftEnd(null);
      return;
    }
    // Finish the range (order-independent)
    if (iso < draftStart) {
      setDraftEnd(draftStart);
      setDraftStart(iso);
    } else {
      setDraftEnd(iso);
    }
    setHover(null);
  };

  const apply = () => {
    if (!draftStart || !draftEnd) return;
    onApply(draftStart, draftEnd);
    close();
  };

  // The range we paint (includes hover preview while picking the end date)
  let lo: string | null = null;
  let hi: string | null = null;
  if (draftStart && draftEnd) {
    lo = draftStart;
    hi = draftEnd;
  } else if (draftStart && hover) {
    [lo, hi] = hover < draftStart ? [hover, draftStart] : [draftStart, hover];
  } else if (draftStart) {
    lo = hi = draftStart;
  }

  /* ---------- calendar grid ---------- */

  const firstWeekday = new Date(Date.UTC(view.y, view.m, 1)).getUTCDay();
  const daysInMonth = new Date(Date.UTC(view.y, view.m + 1, 0)).getUTCDate();
  const cells: (number | null)[] = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const shiftMonth = (delta: number) => {
    const idx = view.y * 12 + view.m + delta;
    setView({ y: Math.floor(idx / 12), m: idx % 12 });
  };
  const atMaxMonth = view.y * 12 + view.m >= max.y * 12 + max.m;

  /* ---------- trigger label ---------- */

  const hasRange = active && isValidISO(start) && isValidISO(end);
  const triggerLabel = hasRange
    ? start === end
      ? formatShort(start, max.y)
      : `${formatShort(start, max.y)} – ${formatShort(end, max.y)}`
    : "Custom";

  const summaryStart = draftStart ? formatShort(draftStart, max.y) : "Select";
  const summaryEnd = draftEnd ? formatShort(draftEnd, max.y) : draftStart ? "Select" : "–";
  const pickingEnd = !!draftStart && !draftEnd;
  const pickingStart = !draftStart;

  /* ------------------------------------------------------------------ */

  return (
    <div className="relative shrink-0">
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={() => (open ? close() : openPicker())}
        aria-haspopup="dialog"
        aria-expanded={open}
        className={`flex items-center gap-1.5 text-xs font-bold pl-3 pr-2.5 py-2 sm:py-1.5 rounded-full border whitespace-nowrap transition-colors cursor-pointer disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-1 ${
          hasRange || open
            ? "bg-[var(--color-primary)] text-white border-[var(--color-primary)]"
            : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"
        }`}
      >
        <CalendarDays size={14} />
        <span>{triggerLabel}</span>
        <ChevronDown size={14} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <>
          <style>{`
            @keyframes drp-up { from { transform: translateY(100%) } to { transform: none } }
            @keyframes drp-pop { from { opacity: 0; transform: translateY(-4px) scale(.98) } to { opacity: 1; transform: none } }
            @keyframes drp-fade { from { opacity: 0 } to { opacity: 1 } }
            .drp-sheet { animation: drp-up .22s cubic-bezier(.2,.8,.2,1) }
            .drp-backdrop { animation: drp-fade .18s ease-out }
            @media (min-width: 640px) { .drp-sheet { animation: drp-pop .14s ease-out } }
            @media (prefers-reduced-motion: reduce) { .drp-sheet, .drp-backdrop { animation: none } }
          `}</style>

          {/* Backdrop: dims on mobile, invisible click-catcher on desktop */}
          <div
            className="drp-backdrop fixed inset-0 z-40 bg-black/40 sm:bg-transparent"
            onClick={close}
            aria-hidden
          />

          <div
            role="dialog"
            aria-modal="true"
            aria-label="Select a custom date range"
            className={`drp-sheet fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-3xl shadow-2xl pb-[max(1rem,env(safe-area-inset-bottom))]
              sm:absolute sm:inset-x-auto sm:bottom-auto sm:top-full sm:mt-2 sm:pb-0 sm:rounded-2xl sm:border sm:border-gray-200 sm:shadow-xl
              ${alignRight ? "sm:right-0" : "sm:left-0"}`}
          >
            <div className="sm:w-[320px]">
              {/* Grab handle (mobile only) */}
              <div className="flex justify-center pt-2.5 sm:hidden">
                <span className="h-1 w-10 rounded-full bg-gray-200" />
              </div>

              {/* From / To summary */}
              <div className="grid grid-cols-2 gap-2 px-4 pt-3 sm:pt-4">
                {[
                  { label: "From", value: summaryStart, on: pickingStart },
                  { label: "To", value: summaryEnd, on: pickingEnd },
                ].map((f) => (
                  <div
                    key={f.label}
                    className={`rounded-xl border px-3 py-2 transition-colors ${
                      f.on
                        ? "border-[var(--color-primary)] ring-1 ring-[var(--color-primary)]"
                        : "border-gray-200"
                    }`}
                  >
                    <p className="text-[11px] font-medium text-gray-400">{f.label}</p>
                    <p className="text-sm font-bold text-gray-800 tabular-nums">{f.value}</p>
                  </div>
                ))}
              </div>

              {/* Month navigation */}
              <div className="flex items-center justify-between px-3 pt-3">
                <button
                  type="button"
                  onClick={() => shiftMonth(-1)}
                  aria-label="Previous month"
                  className="h-9 w-9 flex items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
                >
                  <ChevronLeft size={18} />
                </button>
                <p className="text-sm font-bold text-gray-800">
                  {MONTHS[view.m]} {view.y}
                </p>
                <button
                  type="button"
                  onClick={() => shiftMonth(1)}
                  disabled={atMaxMonth}
                  aria-label="Next month"
                  className="h-9 w-9 flex items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
                >
                  <ChevronRight size={18} />
                </button>
              </div>

              {/* Calendar */}
              <div className="px-3 pt-1 pb-2" onMouseLeave={() => setHover(null)}>
                <div className="grid grid-cols-7">
                  {WEEKDAYS.map((w) => (
                    <div key={w} className="h-8 flex items-center justify-center text-[11px] font-medium text-gray-400">
                      {w}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-7">
                  {cells.map((d, i) => {
                    if (d === null) return <div key={`b${i}`} />;

                    const iso = toISO(view.y, view.m, d);
                    const disabledDay = iso > maxDate;
                    const isStart = lo === iso;
                    const isEnd = hi === iso;
                    const selected = isStart || isEnd;
                    const hasBand = !!lo && !!hi && lo !== hi;
                    const inside = hasBand && iso > lo! && iso < hi!;
                    const isToday = iso === maxDate;

                    return (
                      <div key={iso} className="relative h-10 sm:h-9 flex items-center justify-center">
                        {/* Range band behind the day */}
                        {hasBand && (inside || isStart || isEnd) && (
                          <span
                            aria-hidden
                            className={`absolute inset-y-[2px] bg-[color-mix(in_srgb,var(--color-primary)_12%,white)] ${
                              isStart ? "left-1/2 right-0" : isEnd ? "left-0 right-1/2" : "inset-x-0"
                            }`}
                          />
                        )}
                        <button
                          type="button"
                          disabled={disabledDay}
                          onClick={() => pick(iso)}
                          onMouseEnter={() => !disabledDay && setHover(iso)}
                          aria-label={`${d} ${MONTHS[view.m]} ${view.y}`}
                          aria-pressed={selected}
                          className={`relative z-10 h-9 w-9 sm:h-8 sm:w-8 rounded-full text-xs tabular-nums transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] ${
                            selected
                              ? "bg-[var(--color-primary)] text-white font-bold cursor-pointer"
                              : disabledDay
                                ? "text-gray-300 cursor-not-allowed"
                                : `cursor-pointer font-medium text-gray-700 hover:bg-gray-100 ${
                                    isToday ? "ring-1 ring-gray-300" : ""
                                  }`
                          }`}
                        >
                          {d}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between gap-3 border-t border-gray-100 px-4 py-3">
                <p className="text-xs font-medium text-gray-500">
                  {draftStart && draftEnd
                    ? `${dayCount(draftStart, draftEnd)} ${dayCount(draftStart, draftEnd) === 1 ? "day" : "days"} selected`
                    : draftStart
                      ? "Now pick the end date"
                      : "Pick a start date"}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={close}
                    className="text-xs font-bold text-gray-500 hover:text-gray-800 px-3 py-2 rounded-lg cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={apply}
                    disabled={!draftStart || !draftEnd}
                    className="text-xs font-bold text-white bg-[var(--color-primary)] rounded-lg px-4 py-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-1"
                  >
                    Apply
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
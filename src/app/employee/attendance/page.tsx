"use client";

import { useEffect, useMemo, useState } from "react";
import { getFilteredEmployeeReport, employeeManualUpdate } from "@/store/attendance/attendance";
import {
  Clock,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  X,
  FileText,
  AlertCircle,
  Home,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import toast from "react-hot-toast";

// ---------- Date utilities ----------
const getLocalDateString = (date: Date) =>
  new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().split("T")[0];

const getStartOfWeek = (date: Date) => {
  const d = new Date(date);
  return new Date(d.setDate(d.getDate() - d.getDay()));
};

const getDaysOfWeek = (startDate: Date) =>
  Array.from({ length: 7 }, (_, i) => new Date(new Date(startDate).setDate(startDate.getDate() + i)));

// 6 full weeks (42 days) covering the given month, for the mini calendar picker.
const getMonthGrid = (viewDate: Date) => {
  const firstOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
  const gridStart = getStartOfWeek(firstOfMonth);
  return Array.from({ length: 42 }, (_, i) => new Date(new Date(gridStart).setDate(gridStart.getDate() + i)));
};

const formatTime = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—";

// ---------- Status config ----------
const STATUS_META: Record<string, { label: string; dot: string }> = {
  present: { label: "Present", dot: "bg-emerald-500" },
  half_day: { label: "Half day", dot: "bg-amber-500" },
  workfromhome: { label: "Work from home", dot: "bg-sky-500" },
  leave: { label: "Leave", dot: "bg-violet-500" },
  absent: { label: "Absent", dot: "bg-rose-500" },
};

const REQUEST_TYPES = [
  { value: "leave", label: "Leave", icon: CalendarIcon },
  { value: "workfromhome", label: "WFH", icon: Home },
] as const;

const WEEKDAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function getDayState(record: any, canRequestSlot: boolean) {
  if (!record) return { canRequest: canRequestSlot, isPhysical: false, isPending: false, isApproved: false, isDenied: false };
  const isPhysical = !!(record.clockIn || record.clockOut);
  const isManualType = record.status === "leave" || record.status === "workfromhome";
  const isPending = !isPhysical && !record.markedByAdminId && isManualType;
  const isApproved = !isPhysical && !!record.markedByAdminId && isManualType;
  const isDenied = !!record.markedByAdminId && record.status === "absent" && !!record.notes?.includes("[REJECTED]");
  return { canRequest: false, isPhysical, isPending, isApproved, isDenied };
}

// Small status/time badge shown under (grid) or beside (list) the day's main label.
// Never hidden behind hover — touch devices can't reliably trigger hover states.
function renderSecondary(record: any, state: ReturnType<typeof getDayState>) {
  if (state.isPhysical) {
    return (
      <span className="font-mono text-xs tabular-nums text-gray-500">
        {formatTime(record.clockIn)} – {formatTime(record.clockOut)}
      </span>
    );
  }
  if (state.isPending) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600">
        <Clock size={12} /> Pending review
      </span>
    );
  }
  if (state.isApproved) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600">
        <CheckCircle2 size={12} /> Approved
      </span>
    );
  }
  if (state.isDenied) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-rose-600">
        <XCircle size={12} /> Declined
      </span>
    );
  }
  if (record) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-400">
        <AlertCircle size={12} /> Marked by admin
      </span>
    );
  }
  return null;
}

const navBtnClass =
  "flex h-9 w-9 flex-none cursor-pointer items-center justify-center rounded-full border border-gray-200 text-gray-500 transition-colors hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]";

const requestBtnClass =
  "cursor-pointer rounded-full border border-dashed border-gray-300 px-3 py-1 text-xs font-medium text-gray-500 transition-colors hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]";

const pickerNavBtnClass = "cursor-pointer rounded-full p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700";

export default function EmployeeAttendanceLog() {
  const [weeklyData, setWeeklyData] = useState<Record<string, any>>({});
  const [stats, setStats] = useState({ present: 0, half_day: 0, workfromhome: 0, leave: 0, absent: 0, totalHours: "0.0" });
  const [isFetching, setIsFetching] = useState(true);

  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(getStartOfWeek(new Date()));
  const [direction, setDirection] = useState<"next" | "prev">("next");

  // Calendar picker (jump to any year / month / week)
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [viewDate, setViewDate] = useState<Date>(currentWeekStart);

  const [manualModalDate, setManualModalDate] = useState<Date | null>(null);
  const [manualStatus, setManualStatus] = useState("leave");
  const [manualNotes, setManualNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const weekDays = useMemo(() => getDaysOfWeek(currentWeekStart), [currentWeekStart]);
  const weekKey = getLocalDateString(weekDays[0]);
  const weekEndKey = getLocalDateString(weekDays[6]);
  const isCurrentWeek = weekKey === getLocalDateString(getStartOfWeek(new Date()));

  const fetchReport = async () => {
    setIsFetching(true);
    const startDate = getLocalDateString(weekDays[0]);
    const endDate = getLocalDateString(weekDays[6]);
    const res = await getFilteredEmployeeReport(`startDate=${startDate}&endDate=${endDate}`);
    if (res?.success) {
      setWeeklyData(res.weeklyData);
      setStats(res.stats);
    }
    setIsFetching(false);
  };

  useEffect(() => {
    fetchReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentWeekStart]);

  const handlePrevWeek = () => {
    setIsPickerOpen(false);
    setDirection("prev");
    setCurrentWeekStart((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() - 7);
      return d;
    });
  };

  const handleNextWeek = () => {
    setIsPickerOpen(false);
    setDirection("next");
    setCurrentWeekStart((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() + 7);
      return d;
    });
  };

  const goToToday = () => {
    setIsPickerOpen(false);
    setDirection(currentWeekStart < getStartOfWeek(new Date()) ? "next" : "prev");
    setCurrentWeekStart(getStartOfWeek(new Date()));
  };

  const openPicker = () => {
    if (isPickerOpen) {
      setIsPickerOpen(false);
      return;
    }
    setViewDate(currentWeekStart);
    setIsPickerOpen(true);
  };

  const selectDate = (d: Date) => {
    setDirection(d < currentWeekStart ? "prev" : "next");
    setCurrentWeekStart(getStartOfWeek(d));
    setIsPickerOpen(false);
  };

  const openRequest = (day: Date) => {
    setManualModalDate(day);
    setManualStatus("leave");
    setManualNotes("");
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualModalDate || !manualNotes.trim()) return toast.error("Please provide a reason.");

    setIsSubmitting(true);
    const dateString = getLocalDateString(manualModalDate);
    const res = await employeeManualUpdate({ dateString, status: manualStatus, notes: manualNotes });
    if (res?.success) {
      setManualModalDate(null);
      setManualNotes("");
      toast.success(res.message || "Requested successfully");
      await fetchReport();
    }
    setIsSubmitting(false);
  };

  const rangeLabel = `${weekDays[0].toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${weekDays[6].toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;

  const statItems = [
    { label: "Present", value: stats.present },
    { label: "Half day", value: stats.half_day },
    { label: "WFH", value: stats.workfromhome || 0 },
    { label: "Leave", value: stats.leave },
    { label: "Absent", value: stats.absent || 0 },
    { label: "Total hours", value: `${stats.totalHours}h`, accent: true },
  ];

  const now = new Date();
  const todayStr = getLocalDateString(now);

  // Compute everything about each day once, then render it two ways (grid for desktop, list for mobile).
  const enrichedDays = weekDays.map((day) => {
    const dateStr = getLocalDateString(day);
    const record = weeklyData[dateStr];
    const isToday = dateStr === todayStr;
    const isFuture = day > now;
    const isWeekend = !record && day.getDay() === 0;
    const canRequestSlot = !record && !isFuture && !isWeekend;
    const state = getDayState(record, canRequestSlot);
    const meta = record ? STATUS_META[record.status] : null;
    const label = meta?.label ?? record?.status;
    const dotClass = state.isDenied
      ? "border-2 border-rose-500 bg-white"
      : state.isPending
      ? "bg-amber-400"
      : meta?.dot ?? "bg-gray-400";

    return { day, dateStr, record, isToday, isFuture, isWeekend, state, label, dotClass };
  });

  return (
    <div className="space-y-6 bg-white p-4 font-sans sm:p-6">
      {/* HEADER */}
      <div>
        <h3 className="flex items-center gap-2 text-xl font-semibold text-gray-900">
          <Clock className="text-[var(--color-primary)]" size={22} />
          My attendance
        </h3>
        <p className="mt-1 text-sm text-gray-500">Review your weekly logs and request leave or WFH.</p>
      </div>

      {/* STATS RIBBON */}
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-gray-200 bg-gray-200 sm:grid-cols-3 lg:grid-cols-6">
        {statItems.map((item) => (
          <div key={item.label} className={`p-4 sm:p-5 ${item.accent ? "bg-[var(--color-primary-lighter)]/40" : "bg-white"}`}>
            <p className="text-xs text-gray-500">{item.label}</p>
            <p className={`mt-1 text-2xl font-semibold tabular-nums ${item.accent ? "text-[var(--color-primary)]" : "text-gray-900"}`}>
              {item.value}
            </p>
          </div>
        ))}
      </div>

      {/* WEEK NAVIGATION */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button aria-label="Previous week" onClick={handlePrevWeek} className={navBtnClass}>
            <ChevronLeft size={18} />
          </button>

          <div className="relative">
            <button
              onClick={openPicker}
              className="flex cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-lg px-2 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              <CalendarIcon size={14} className="text-gray-400" />
              {rangeLabel}
            </button>

            {isPickerOpen && (
              <>
                {/* Click-away layer */}
                <div className="fixed inset-0 z-40 cursor-default" onClick={() => setIsPickerOpen(false)} />

                <div className="absolute left-0 top-full z-50 mt-2 w-72 rounded-2xl border border-gray-200 bg-white p-4 shadow-xl duration-150 animate-in fade-in zoom-in-95">
                  {/* Year row */}
                  <div className="mb-1 flex items-center justify-between">
                    <button
                      aria-label="Previous year"
                      onClick={() => setViewDate((v) => new Date(v.getFullYear() - 1, v.getMonth(), 1))}
                      className={pickerNavBtnClass}
                    >
                      <ChevronsLeft size={16} />
                    </button>
                    <span className="text-sm font-semibold text-gray-900">{viewDate.getFullYear()}</span>
                    <button
                      aria-label="Next year"
                      onClick={() => setViewDate((v) => new Date(v.getFullYear() + 1, v.getMonth(), 1))}
                      className={pickerNavBtnClass}
                    >
                      <ChevronsRight size={16} />
                    </button>
                  </div>

                  {/* Month row */}
                  <div className="mb-3 flex items-center justify-between">
                    <button
                      aria-label="Previous month"
                      onClick={() => setViewDate((v) => new Date(v.getFullYear(), v.getMonth() - 1, 1))}
                      className={pickerNavBtnClass}
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <span className="text-sm font-medium text-gray-600">
                      {viewDate.toLocaleDateString("en-US", { month: "long" })}
                    </span>
                    <button
                      aria-label="Next month"
                      onClick={() => setViewDate((v) => new Date(v.getFullYear(), v.getMonth() + 1, 1))}
                      className={pickerNavBtnClass}
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>

                  {/* Weekday header */}
                  <div className="grid grid-cols-7 text-center text-[10px] font-medium text-gray-400">
                    {WEEKDAY_LABELS.map((d) => (
                      <span key={d} className="py-1">
                        {d}
                      </span>
                    ))}
                  </div>

                  {/* Day grid — click any date to jump to its week */}
                  <div className="grid grid-cols-7 gap-y-0.5">
                    {getMonthGrid(viewDate).map((d) => {
                      const inMonth = d.getMonth() === viewDate.getMonth();
                      const dStr = getLocalDateString(d);
                      const inSelectedWeek = dStr >= weekKey && dStr <= weekEndKey;
                      const isToday = dStr === todayStr;
                      return (
                        <button
                          key={dStr}
                          onClick={() => selectDate(d)}
                          className={`cursor-pointer rounded-lg py-1.5 text-xs font-medium transition-colors ${
                            inMonth ? "text-gray-700" : "text-gray-300"
                          } ${inSelectedWeek ? "bg-[var(--color-primary-lighter)]/40" : "hover:bg-gray-100"} ${
                            isToday ? "ring-1 ring-inset ring-[var(--color-primary)]" : ""
                          }`}
                        >
                          {d.getDate()}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={goToToday}
                    className="mt-3 w-full cursor-pointer rounded-lg border border-gray-200 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50"
                  >
                    Jump to today
                  </button>
                </div>
              </>
            )}
          </div>

          <button aria-label="Next week" onClick={handleNextWeek} className={navBtnClass}>
            <ChevronRight size={18} />
          </button>
        </div>

        {!isCurrentWeek && (
          <button onClick={goToToday} className="cursor-pointer text-xs font-semibold text-[var(--color-primary)] hover:underline">
            Jump to today
          </button>
        )}
      </div>

      {/* DESKTOP: CALENDAR GRID (md and up) */}
      <div className="hidden overflow-hidden rounded-2xl border border-gray-200 md:block">
        <div className="grid grid-cols-7 divide-x divide-gray-100 border-b border-gray-100 bg-gray-50/60">
          {enrichedDays.map(({ day, dateStr, isToday }) => (
            <div key={`${dateStr}-h`} className="p-3 text-center">
              <p className="text-[11px] font-medium text-gray-400">{day.toLocaleDateString("en-US", { weekday: "short" })}</p>
              <p
                className={`mx-auto mt-1 flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold ${
                  isToday ? "bg-[var(--color-primary)] text-white" : "text-gray-800"
                }`}
              >
                {day.getDate()}
              </p>
            </div>
          ))}
        </div>

        <div
          key={weekKey}
          className={`grid grid-cols-7 divide-x divide-gray-100 duration-300 animate-in fade-in ${
            direction === "next" ? "slide-in-from-right-4" : "slide-in-from-left-4"
          }`}
        >
          {isFetching
            ? Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="flex min-h-[128px] flex-col items-center justify-center gap-2 p-3">
                  <div className="h-6 w-6 animate-pulse rounded-full bg-gray-100" />
                  <div className="h-3 w-14 animate-pulse rounded bg-gray-100" />
                </div>
              ))
            : enrichedDays.map(({ day, dateStr, record, isToday, isWeekend, state, label, dotClass }) => (
                <div
                  key={dateStr}
                  className={`flex min-h-[128px] flex-col items-center justify-center gap-2 p-3 text-center ${
                    isToday ? "bg-[var(--color-primary-lighter)]/10" : ""
                  }`}
                >
                  {record ? (
                    <>
                      <span className="flex items-center gap-1.5 text-sm font-medium text-gray-800">
                        <span className={`h-2 w-2 flex-none rounded-full ${dotClass}`} />
                        {label}
                      </span>
                      {renderSecondary(record, state)}
                    </>
                  ) : isWeekend ? (
                    <span className="text-xs font-medium text-gray-400">Weekend</span>
                  ) : state.canRequest ? (
                    <button onClick={() => openRequest(day)} className={requestBtnClass}>
                      + Request
                    </button>
                  ) : (
                    <span className="text-lg font-semibold text-gray-200">—</span>
                  )}
                </div>
              ))}
        </div>
      </div>

      {/* MOBILE: DAY LIST (below md) */}
      <div
        key={`${weekKey}-list`}
        className={`divide-y divide-gray-100 overflow-hidden rounded-2xl border border-gray-200 duration-300 animate-in fade-in md:hidden ${
          direction === "next" ? "slide-in-from-right-4" : "slide-in-from-left-4"
        }`}
      >
        {isFetching
          ? Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-3 py-3 sm:gap-4 sm:px-4">
                <div className="h-7 w-7 flex-none animate-pulse rounded-full bg-gray-100" />
                <div className="h-3 flex-1 animate-pulse rounded bg-gray-100" />
              </div>
            ))
          : enrichedDays.map(({ day, dateStr, record, isToday, isWeekend, state, label, dotClass }) => (
              <div
                key={dateStr}
                className={`flex items-center gap-3 px-3 py-3 sm:gap-4 sm:px-4 ${
                  isToday ? "bg-[var(--color-primary-lighter)]/10" : ""
                }`}
              >
                {/* Date block */}
                <div className="flex w-10 flex-none flex-col items-center">
                  <span className="text-[11px] font-medium text-gray-400">
                    {day.toLocaleDateString("en-US", { weekday: "short" })}
                  </span>
                  <span
                    className={`mt-0.5 flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold ${
                      isToday ? "bg-[var(--color-primary)] text-white" : "text-gray-800"
                    }`}
                  >
                    {day.getDate()}
                  </span>
                </div>

                {/* Status / action */}
                <div className="flex min-w-0 flex-1 flex-wrap items-center justify-between gap-x-4 gap-y-1.5">
                  {record ? (
                    <>
                      <span className="flex items-center gap-2 text-sm font-medium text-gray-800">
                        <span className={`h-2 w-2 flex-none rounded-full ${dotClass}`} />
                        {label}
                      </span>
                      {renderSecondary(record, state)}
                    </>
                  ) : isWeekend ? (
                    <span className="text-xs font-medium text-gray-400">Weekend</span>
                  ) : state.canRequest ? (
                    <button onClick={() => openRequest(day)} className={`ml-auto ${requestBtnClass}`}>
                      + Request
                    </button>
                  ) : (
                    <span className="text-xs text-gray-300">—</span>
                  )}
                </div>
              </div>
            ))}
      </div>

      {/* LEGEND */}
      <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-gray-400">
        {Object.values(STATUS_META).map((m) => (
          <span key={m.label} className="flex items-center gap-1.5">
            <span className={`h-2 w-2 rounded-full ${m.dot}`} />
            {m.label}
          </span>
        ))}
      </div>

      {/* MANUAL REQUEST MODAL */}
      {manualModalDate && (
        <div
          className="fixed inset-0 z-[100] flex cursor-pointer items-center justify-center bg-gray-900/50 p-4 backdrop-blur-sm"
          onClick={() => setManualModalDate(null)}
        >
          <div
            className="w-full max-w-md cursor-default overflow-hidden rounded-2xl bg-white shadow-xl duration-200 animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gray-100 p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-primary-lighter)]/40 text-[var(--color-primary)]">
                  <FileText size={18} />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-gray-900">Request a status</h3>
                  <p className="text-xs text-gray-500">
                    {manualModalDate.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
                  </p>
                </div>
              </div>
              <button
                aria-label="Close"
                onClick={() => setManualModalDate(null)}
                className="cursor-pointer rounded-full p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleManualSubmit} className="space-y-5 p-5">
              <div className="grid grid-cols-2 gap-2 rounded-xl bg-gray-100 p-1">
                {REQUEST_TYPES.map(({ value, label, icon: Icon }) => (
                  <button
                    type="button"
                    key={value}
                    onClick={() => setManualStatus(value)}
                    className={`flex cursor-pointer items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-medium transition-all ${
                      manualStatus === value ? "bg-white text-[var(--color-primary)] shadow-sm" : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    <Icon size={15} /> {label}
                  </button>
                ))}
              </div>

              <div className="flex items-start gap-2.5 rounded-xl bg-blue-50 p-3 text-xs leading-relaxed text-blue-700">
                <AlertCircle size={15} className="mt-0.5 flex-none" />
                <span>Your manager will review this request before it's added to your attendance.</span>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Reason</label>
                <textarea
                  value={manualNotes}
                  onChange={(e) => setManualNotes(e.target.value)}
                  required
                  rows={3}
                  placeholder="Add a short note for your manager…"
                  className="w-full resize-none rounded-xl border border-gray-200 p-3 text-sm outline-none transition-colors focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-light)]"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex w-full cursor-pointer items-center justify-center rounded-xl bg-[var(--color-primary)] py-3 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-primary-dark)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  "Submit request"
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
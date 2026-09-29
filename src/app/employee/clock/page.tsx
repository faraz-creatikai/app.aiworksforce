"use client";

import { useEffect, useState } from "react";
import { clockIn, clockOut, getFilteredEmployeeReport } from "@/store/attendance/attendance";
import { employeeManualUpdate } from "@/store/attendance/attendance";
import {
  LogOut,
  LogIn,
  Calendar as CalendarIcon,
  AlertCircle,
  Clock,
  FileText,
  XCircle,
  CheckCircle2,
  ChevronRight,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import { useEmployeeAuth } from "@/context/EmployeeAuthContext";

// --- CONFIGURATION VARIABLES ---
// Change these variables to easily adjust the allowed clock-in window.
// Use 24-hour format "HH:MM".
const ALLOWED_CLOCK_IN_START = "10:00";
const ALLOWED_CLOCK_IN_END = "18:30";
// -------------------------------

const getLocalDateString = (date: Date) => {
  const d = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return d.toISOString().split("T")[0];
};

// Helpers for time restrictions
const timeToMinutes = (timeStr: string) => {
  const [hours, minutes] = timeStr.split(":").map(Number);
  return hours * 60 + minutes;
};

const formatConfigTime = (timeStr: string) => {
  const [h, m] = timeStr.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hours = h % 12 || 12;
  return `${hours}:${m.toString().padStart(2, "0")} ${ampm}`;
};

// ---------------------------------------------------------------
// ANALOG CLOCK GEOMETRY (SVG viewBox is 260 x 260, angle 0 = 12 o'clock, clockwise)
// ---------------------------------------------------------------
const C = 130; // centre
const RING_R = 112; // radius of the arc track
const RING_W = 22; // thickness of the arc track
const NUMBER_R = 78; // radius the 1-12 numerals sit on
const HOUR_MS = 3600000;

const polar = (deg: number, r: number) => {
  const rad = (deg * Math.PI) / 180;
  return { x: C + r * Math.sin(rad), y: C - r * Math.cos(rad) };
};

// Clockwise arc from `startDeg`, `sweepDeg` degrees long
const arcPath = (startDeg: number, sweepDeg: number, r: number) => {
  const sweep = Math.min(Math.max(sweepDeg, 0.01), 359.99);
  const s = polar(startDeg, r);
  const e = polar(startDeg + sweep, r);
  return `M ${s.x} ${s.y} A ${r} ${r} 0 ${sweep > 180 ? 1 : 0} 1 ${e.x} ${e.y}`;
};

// Position of a time on a 12-hour dial
const timeToDeg = (d: Date) => (((d.getHours() % 12) * 60 + d.getMinutes()) / 720) * 360;

const formatHM = (ms: number) => {
  const totalMinutes = Math.max(0, Math.floor(ms / 60000));
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return h ? `${h} hr ${m} min` : `${m} min`;
};

const labelCls = "text-[11px] font-semibold uppercase tracking-wider text-[var(--color-gray)]";

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="min-w-0">
    <p className={labelCls}>{label}</p>
    <p className="mt-1 text-sm sm:text-[15px] font-semibold text-gray-900 tabular-nums truncate">{children}</p>
  </div>
);

export default function EmployeeClock() {
  const { employee } = useEmployeeAuth();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [todayRecord, setTodayRecord] = useState<any>(null);
  const [loadingAction, setLoadingAction] = useState(false);
  const [confirmModal, setConfirmModal] = useState<"in" | "out" | null>(null);

  // Manual Update Modal State
  const [manualModalOpen, setManualModalOpen] = useState(false);
  const [manualStatus, setManualStatus] = useState("leave");
  const [manualNotes, setManualNotes] = useState("");

  // Supplementary week-at-a-glance data (Dynamic from backend)
  const [weekRecords, setWeekRecords] = useState<Record<string, any>>({});

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchTodayStatus = async () => {
    const today = getLocalDateString(new Date());
    const res = await getFilteredEmployeeReport(`startDate=${today}&endDate=${today}`);
    if (res?.success && res.weeklyData[today]) {
      setTodayRecord(res.weeklyData[today]);
    } else {
      setTodayRecord(null);
    }
  };

  useEffect(() => {
    fetchTodayStatus();
  }, []);

  const fetchWeekStatus = async () => {
    try {
      const end = new Date();
      const start = new Date();
      start.setDate(end.getDate() - 6);
      const res = await getFilteredEmployeeReport(`startDate=${getLocalDateString(start)}&endDate=${getLocalDateString(end)}`);
      if (res?.success && res.weeklyData) {
        setWeekRecords(res.weeklyData);
      }
    } catch {
      // Graceful fail
    }
  };

  useEffect(() => {
    fetchWeekStatus();
  }, [todayRecord]);

  const handleClockAction = async () => {
    if (!confirmModal) return;
    setLoadingAction(true);
    if (confirmModal === "in") {
      const res = await clockIn();
      if (res?.success) await fetchTodayStatus();
    } else {
      const res = await clockOut();
      if (res?.success) await fetchTodayStatus();
    }
    setLoadingAction(false);
    setConfirmModal(null);
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualNotes.trim()) return toast.error("Please provide a reason.");

    setLoadingAction(true);
    const today = getLocalDateString(new Date());
    const res = await employeeManualUpdate({ dateString: today, status: manualStatus, notes: manualNotes });

    if (res?.success) {
      setManualModalOpen(false);
      setManualNotes("");
      toast.success(res.message ?? "Status requested successfully");
      await fetchTodayStatus();
    }
    setLoadingAction(false);
  };

  const hasClockedInToday = !!todayRecord?.clockIn;
  const hasClockedOutToday = !!todayRecord?.clockOut;

  // --- STRICT & BULLETPROOF RECORD STATES ---
  const isManualState = todayRecord && !todayRecord.clockIn;

  const isPending = isManualState && !todayRecord.markedByAdminId;
  const isApproved = isManualState && !!todayRecord.markedByAdminId && ["leave", "workfromhome"].includes(todayRecord.status);
  const isDenied = isManualState && !!todayRecord.markedByAdminId && todayRecord.status === "absent" && todayRecord.notes && todayRecord.notes.includes("[REJECTED]");
  const isAdminForced = isManualState && !isApproved && !isDenied && !!todayRecord.markedByAdminId;

  // --- Check Allowed Clock-In Window ---
  const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
  const startMinutes = timeToMinutes(ALLOWED_CLOCK_IN_START);
  const endMinutes = timeToMinutes(ALLOWED_CLOCK_IN_END);
  const isClockInAllowed = currentMinutes >= startMinutes && currentMinutes <= endMinutes;

  // --- Presentation helpers ---
  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const formatTime = (value: string | Date) => new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const formatDuration = (ms: number) => {
    const totalSeconds = Math.max(0, Math.floor(ms / 1000));
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours}h ${minutes}m ${seconds}s`;
  };

  const clockInDate = todayRecord?.clockIn ? new Date(todayRecord.clockIn) : null;
  const clockOutDate = todayRecord?.clockOut ? new Date(todayRecord.clockOut) : null;
  const elapsedMs = clockInDate ? (clockOutDate ?? currentTime).getTime() - clockInDate.getTime() : 0;
  const elapsedLabel = clockInDate ? formatDuration(elapsedMs) : null;

  const manualStatusInfo = isPending
    ? {
        icon: Clock,
        iconBg: "bg-amber-50",
        iconColor: "text-amber-600",
        title: "Pending review",
        description: `You requested ${todayRecord?.status === "workfromhome" ? "work from home" : "leave"} for today — waiting on admin approval.`,
      }
    : isApproved
      ? {
          icon: CheckCircle2,
          iconBg: "bg-green-50",
          iconColor: "text-green-600",
          title: "Approved",
          description: `Your ${todayRecord?.status === "workfromhome" ? "work from home" : "leave"} request for today was approved.`,
        }
      : isDenied
        ? {
            icon: XCircle,
            iconBg: "bg-red-50",
            iconColor: "text-red-600",
            title: "Request denied",
            description: "Your admin rejected your request and marked today as absent.",
          }
        : isAdminForced
          ? {
              icon: AlertCircle,
              iconBg: "bg-gray-100",
              iconColor: "text-gray-600",
              title: "Set by admin",
              description: `Your admin recorded today as ${todayRecord?.status === "workfromhome" ? "WFH" : String(todayRecord?.status).replace("_", " ")}.`,
            }
          : null;

  // Last 7 days dynamic calculation
  const todayStr = getLocalDateString(currentTime);
  const chartDays = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dateStr = getLocalDateString(d);
    const rec = weekRecords[dateStr];
    let hours = 0;
    if (rec?.clockIn) {
      const start = new Date(rec.clockIn).getTime();
      const end = rec.clockOut ? new Date(rec.clockOut).getTime() : dateStr === todayStr ? currentTime.getTime() : start;
      hours = Math.max(0, (end - start) / HOUR_MS);
    }
    return {
      dateStr,
      isToday: dateStr === todayStr,
      label: d.toLocaleDateString(undefined, { weekday: "short" }),
      hours,
    };
  });
  const maxWeekHours = Math.max(8, ...chartDays.map((d) => d.hours));
  const weekTotalMs = chartDays.reduce((sum, d) => sum + d.hours, 0) * HOUR_MS;

  // --- Analog clock values ---
  const hourDeg = ((currentTime.getHours() % 12) + currentTime.getMinutes() / 60) * 30;
  const minuteDeg = (currentTime.getMinutes() + currentTime.getSeconds() / 60) * 6;
  const secondDeg = currentTime.getSeconds() * 6;

  // The coloured arc only exists once the user has clocked in: it runs from the
  // clock-in time to "now" (or to clock-out). The faint arc is the 8h shift target.
  // Before clocking in (and on leave / WFH / admin-set days) only the bare track shows.
  const showArc = !!clockInDate;
  const arcStartDeg = clockInDate ? timeToDeg(clockInDate) : 0;
  const arcSweepDeg = clockInDate ? (elapsedMs / (12 * HOUR_MS)) * 360 : 0;
  const targetSweepDeg = (8 / 12) * 360;
  const handle = polar(arcStartDeg, RING_R);

  let subtitle: string;
  if (hasClockedOutToday) subtitle = `Shift complete · ${formatHM(elapsedMs)} worked`;
  else if (hasClockedInToday) subtitle = `On the clock · ${formatHM(elapsedMs)} so far`;
  else if (manualStatusInfo) subtitle = manualStatusInfo.title;
  else if (currentMinutes < startMinutes) subtitle = `Clock-in opens in ${formatHM((startMinutes - currentMinutes) * 60000)}`;
  else if (isClockInAllowed) subtitle = `Clock-in open until ${formatConfigTime(ALLOWED_CLOCK_IN_END)}`;
  else subtitle = "Clock-in window has closed for today";

  // The main action pill (bottom of the page on phones, bottom of the right column on desktop)
  const renderPrimaryAction = () => {
    if (manualStatusInfo) return null;

    if (hasClockedOutToday) {
      return (
        <button
          disabled
          className="w-full flex items-center justify-center gap-2 rounded-full bg-gray-100 border border-gray-200 py-4 text-sm font-bold uppercase tracking-wider text-gray-400 cursor-not-allowed"
        >
          <CheckCircle2 size={18} /> Shift complete
        </button>
      );
    }

    if (hasClockedInToday) {
      return (
        <button
          onClick={() => setConfirmModal("out")}
          className="w-full flex items-center justify-center gap-2 rounded-full bg-[var(--color-destructive)] hover:bg-red-600 py-4 text-sm font-bold uppercase tracking-wider text-white shadow-lg hover:shadow-xl transition-all cursor-pointer"
        >
          <LogOut size={18} /> Clock out
        </button>
      );
    }

    return (
      <button
        onClick={() => isClockInAllowed && setConfirmModal("in")}
        disabled={!isClockInAllowed}
        className={`w-full flex items-center justify-center gap-2 rounded-full py-4 text-sm font-bold transition-all ${
          isClockInAllowed
            ? "bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white uppercase tracking-wider shadow-lg hover:shadow-xl cursor-pointer"
            : "bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed"
        }`}
      >
        {isClockInAllowed ? (
          <>
            <LogIn size={18} /> Clock in now
          </>
        ) : (
          <>
            <AlertCircle size={18} /> Available {formatConfigTime(ALLOWED_CLOCK_IN_START)} - {formatConfigTime(ALLOWED_CLOCK_IN_END)}
          </>
        )}
      </button>
    );
  };

  return (
    <div className="w-full max-w-md sm:max-w-xl lg:max-w-5xl mx-auto   lg:grid lg:grid-cols-2 lg:gap-x-8 lg:gap-y-5 lg:items-start animate-in fade-in duration-300">
      {/* ------------------------------------------------------------
          HEADER: greeting, date, status
      ------------------------------------------------------------ */}
      <div className="flex items-start justify-between gap-3 px-1 lg:col-span-2">
        <div className="min-w-0">
          <p className="text-base sm:text-lg font-bold text-gray-900 truncate">
            {getGreeting()}
            {employee?.name && <span className="text-[var(--color-primary)]"> {employee.name}</span>}
          </p>
          <p className="text-sm text-[var(--color-gray)] flex items-center gap-1.5 mt-0.5">
            <CalendarIcon size={14} className="text-[var(--color-primary)]" />
            {currentTime.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
          </p>
        </div>
        {hasClockedInToday ? (
          <span
            className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full shrink-0 ${
              hasClockedOutToday ? "bg-gray-100 text-gray-600 border border-gray-200" : "bg-green-50 text-green-700 border border-green-200"
            }`}
          >
            {!hasClockedOutToday && <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />}
            {hasClockedOutToday ? "Shift complete" : "On duty"}
          </span>
        ) : (
          !manualStatusInfo && (
            <span className="inline-flex items-center text-xs font-semibold px-3 py-1.5 rounded-full shrink-0 bg-gray-100 text-gray-600">
              Not started
            </span>
          )
        )}
      </div>

      {/* ------------------------------------------------------------
          ANALOG CLOCK CARD
      ------------------------------------------------------------ */}
      <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-5 sm:p-8">
        <div className="relative mx-auto w-full max-w-[280px] sm:max-w-[340px] lg:max-w-[380px] aspect-square">
          <svg
            viewBox="0 0 260 260"
            className="h-full w-full"
            role="img"
            aria-label={`Analog clock showing ${currentTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`}
          >
            <defs>
              <linearGradient id="shiftArcGradient" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="260" y2="260">
                <stop offset="0%" stopColor="var(--color-primary-light)" />
                <stop offset="100%" stopColor="var(--color-primary)" />
              </linearGradient>
            </defs>

            {/* Track */}
            <circle cx={C} cy={C} r={RING_R} fill="none" stroke="#eceef2" strokeWidth={RING_W} />

            {/* 8h shift target (only while on the clock) */}
            {showArc && !hasClockedOutToday && (
              <path d={arcPath(arcStartDeg, targetSweepDeg, RING_R)} fill="none" stroke="var(--color-primary-lighter)" strokeWidth={RING_W} strokeLinecap="round" />
            )}

            {/* Shift progress (only after clocking in) */}
            {showArc && (
              <path
                d={arcPath(arcStartDeg, arcSweepDeg, RING_R)}
                fill="none"
                stroke="url(#shiftArcGradient)"
                strokeWidth={RING_W}
                strokeLinecap="round"
              />
            )}

            {/* Start handle (at the clock-in time) */}
            {showArc && (
              <g transform={`translate(${handle.x} ${handle.y})`} style={{ filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.25))" }}>
                <circle r="13" fill="#fff" />
                <polyline points="-4.5,-1 0,-5.5 4.5,-1" fill="none" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <polyline points="-4.5,4.5 0,0 4.5,4.5" fill="none" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </g>
            )}

            {/* Numerals: 12 / 3 / 6 / 9 in the accent colour */}
            {Array.from({ length: 12 }).map((_, i) => {
              const n = i === 0 ? 12 : i;
              const p = polar(n * 30, NUMBER_R);
              const cardinal = n % 3 === 0;
              return (
                <text
                  key={n}
                  x={p.x}
                  y={p.y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize="16"
                  fontWeight={cardinal ? 700 : 500}
                  fill={cardinal ? "var(--color-primary)" : "var(--color-gray)"}
                >
                  {n}
                </text>
              );
            })}

            {/* Hands */}
            <line x1={C} y1={C} x2={C} y2={C - 44} stroke="var(--color-primary)" strokeWidth="3.5" strokeLinecap="round" transform={`rotate(${hourDeg} ${C} ${C})`} />
            <line x1={C} y1={C} x2={C} y2={C - 66} stroke="var(--color-primary)" strokeWidth="3" strokeLinecap="round" transform={`rotate(${minuteDeg} ${C} ${C})`} />
            <line x1={C} y1={C + 14} x2={C} y2={C - 74} stroke="var(--color-primary-light)" strokeWidth="1.5" strokeLinecap="round" transform={`rotate(${secondDeg} ${C} ${C})`} />
            <circle cx={C} cy={C} r="6" fill="var(--color-primary)" />
          </svg>
        </div>

        <div className="text-center mt-5 sm:mt-6">
          <p className="text-3xl sm:text-4xl lg:text-5xl font-semibold text-gray-900 tracking-wide tabular-nums">
            {currentTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </p>
          <p className="text-xs sm:text-sm text-[var(--color-gray)] mt-1.5">{subtitle}</p>
        </div>
      </div>

      {/* ------------------------------------------------------------
          "TODAY" LIST + ACTION
      ------------------------------------------------------------ */}
      <div className="space-y-3 lg:space-y-4">
        <h2 className="text-sm sm:text-base font-bold text-gray-900 px-1 pt-1">Today</h2>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 px-4 sm:px-5 divide-y divide-gray-100">
          {/* Week strip: weekday + a small bar for hours worked */}
          <div className="py-4">
            <div className="grid grid-cols-7 gap-1">
              {chartDays.map((d) => (
                <div key={d.dateStr} className="flex flex-col items-center gap-2">
                  <div className="h-9 w-full flex items-end justify-center">
                    <div
                      className={`w-2 rounded-full transition-all duration-500 ${
                        d.hours > 0 ? (d.isToday ? "bg-[var(--color-primary)]" : "bg-[var(--color-primary-light)]") : "bg-gray-200"
                      }`}
                      style={{ height: Math.max(4, (d.hours / maxWeekHours) * 36) }}
                    />
                  </div>
                  <span
                    className={`text-[11px] font-semibold uppercase tracking-wide ${
                      d.isToday ? "text-[var(--color-primary)]" : d.hours > 0 ? "text-gray-700" : "text-[var(--color-gray)]"
                    }`}
                  >
                    {d.label}
                  </span>
                  <span className={`h-1 w-1 rounded-full -mt-1 ${d.isToday ? "bg-[var(--color-primary)]" : "bg-transparent"}`} />
                </div>
              ))}
            </div>
          </div>

          {/* Manual / admin status */}
          {manualStatusInfo && (
            <div className="py-4 flex items-start gap-3 animate-in fade-in">
              <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${manualStatusInfo.iconBg}`}>
                <manualStatusInfo.icon size={18} className={manualStatusInfo.iconColor} />
              </span>
              <div className="min-w-0">
                <p className={labelCls}>Status</p>
                <p className="text-sm font-semibold text-gray-900 mt-0.5">{manualStatusInfo.title}</p>
                <p className="text-xs sm:text-sm text-[var(--color-gray)] mt-0.5 leading-relaxed">{manualStatusInfo.description}</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 py-4">
            <Field label="Clocked in">{clockInDate ? formatTime(clockInDate) : "—"}</Field>
            <Field label="Clocked out">{clockOutDate ? formatTime(clockOutDate) : "—"}</Field>
          </div>

          <div className="grid grid-cols-2 gap-4 py-4">
            <Field label="Hours today">{elapsedLabel ?? "0h 0m 0s"}</Field>
            <Field label="This week">{formatHM(weekTotalMs)}</Field>
          </div>

          {/* Leave / WFH request */}
          {!hasClockedInToday && !manualStatusInfo && (
            <button onClick={() => setManualModalOpen(true)} className="w-full flex items-center justify-between gap-3 py-4 text-left cursor-pointer">
              <div className="min-w-0">
                <p className={labelCls}>Not coming in today?</p>
                <p className="text-sm font-semibold text-gray-900 mt-1">Request leave or work from home</p>
              </div>
              <ChevronRight size={18} className="shrink-0 text-[var(--color-primary)]" />
            </button>
          )}
        </div>

        {/* Main action: sticks to the bottom of the screen on phones so it is always reachable */}
        <div className="sticky bottom-4 z-10 pt-1 lg:static lg:pt-2">{renderPrimaryAction()}</div>
      </div>

      {/* CLOCK IN/OUT CONFIRMATION MODAL */}
      {confirmModal && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white w-full sm:max-w-sm rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-8 sm:zoom-in-95 duration-200">
            <div className="sm:hidden flex justify-center pt-3 pb-1">
              <div className="w-9 h-1 rounded-full bg-gray-300" />
            </div>
            <div className="p-6 sm:p-7">
              <div className="flex items-center gap-3 mb-4">
                <span
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                    confirmModal === "in" ? "bg-[var(--color-primary-lighter)] text-[var(--color-primary-darker)]" : "bg-red-50 text-[var(--color-destructive)]"
                  }`}
                >
                  {confirmModal === "in" ? <LogIn size={18} /> : <LogOut size={18} />}
                </span>
                <h3 className="text-lg font-bold text-gray-900">Confirm {confirmModal === "in" ? "clock in" : "clock out"}</h3>
              </div>
              <p className="text-sm text-[var(--color-gray)] mb-6 leading-relaxed">
                You&apos;re about to {confirmModal === "in" ? "clock in" : "clock out"} at{" "}
                <span className="inline-block font-mono font-semibold text-gray-900 bg-gray-100 rounded-md px-1.5 py-0.5">
                  {currentTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
                .
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmModal(null)}
                  className="flex-1 px-4 py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleClockAction}
                  disabled={loadingAction}
                  className={`flex-1 px-4 py-3.5 font-semibold text-white rounded-xl shadow-md transition-colors cursor-pointer flex items-center justify-center ${
                    confirmModal === "in" ? "bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)]" : "bg-[var(--color-destructive)] hover:bg-red-600"
                  }`}
                >
                  {loadingAction ? <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span> : "Confirm"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MANUAL REQUEST MODAL (LEAVE / WFH) */}
      {manualModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-8 sm:zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
            <div className="sm:hidden flex justify-center pt-3 pb-1 shrink-0">
              <div className="w-9 h-1 rounded-full bg-gray-300" />
            </div>

            <div className="px-6 pt-4 sm:pt-6 pb-5 flex items-start justify-between gap-3 shrink-0 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                  <FileText size={16} />
                </span>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Update today&apos;s status</h3>
                  <p className="text-xs text-[var(--color-gray)] mt-0.5">
                    {currentTime.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })} · needs admin approval
                  </p>
                </div>
              </div>
              <button
                onClick={() => setManualModalOpen(false)}
                className="text-gray-400 hover:text-red-500 cursor-pointer bg-gray-50 hover:bg-red-50 p-2 rounded-full transition-colors shrink-0"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleManualSubmit} className="p-6 space-y-5 overflow-y-auto">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">What&apos;s the plan?</label>
                <div className="grid grid-cols-2 gap-1 p-1 bg-gray-100 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setManualStatus("leave")}
                    className={`py-2.5 rounded-lg text-sm font-semibold transition-colors cursor-pointer ${
                      manualStatus === "leave" ? "bg-white text-[var(--color-primary-darker)] shadow-sm" : "text-[var(--color-gray)]"
                    }`}
                  >
                    On leave
                  </button>
                  <button
                    type="button"
                    onClick={() => setManualStatus("workfromhome")}
                    className={`py-2.5 rounded-lg text-sm font-semibold transition-colors cursor-pointer ${
                      manualStatus === "workfromhome" ? "bg-white text-[var(--color-primary-darker)] shadow-sm" : "text-[var(--color-gray)]"
                    }`}
                  >
                    Work from home
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">
                  Reason <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={manualNotes}
                  onChange={(e) => setManualNotes(e.target.value)}
                  required
                  rows={3}
                  placeholder="Let your admin know what's going on..."
                  className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:bg-white focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-light)] transition-all resize-none text-sm"
                />
              </div>

              <button
                type="submit"
                disabled={loadingAction}
                className="w-full py-3.5 bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all flex justify-center items-center cursor-pointer"
              >
                {loadingAction ? <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span> : "Send request"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
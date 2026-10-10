"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
    BarChart3,
    PhoneCall,
    PhoneOutgoing,
    PhoneMissed,
    Clock,
    Timer,
    Coins,
    MessageSquare,
    RefreshCcw,
    ChevronLeft,
    ChevronRight,
    Loader2,
    PlayCircle,
    Volume2,
    Users,
    FileText,
    Phone,
    Activity,
    ArrowUpDown,
    AlertTriangle,
    Info,
    Sun,
    AlignLeft,
    X,
    Copy,
} from "lucide-react";
import { toast } from "react-toastify";

// --- API IMPORTS ---
import { getSarvamCallReport, fetchSarvamAudio } from "@/store/sarvam/sarvam";
import type {
    SarvamCallReportResponse,
    SarvamReportCall,
    SarvamReportCount,
    SarvamReportDay,
    SarvamReportHour,
    SarvamReportStatus,
} from "@/store/sarvam/sarvam.interface";
import CallingAgentPicker from "@/app/component/datafields/CallingAgentPicker";
import DateRangeDropdown from "@/app/component/datafields/DateRangeDropdown";

// --- CONFIG ---
// Extra space (px) to leave under the page. Raise it if something is fixed to the bottom of
// the screen (for example a mobile bottom navigation bar).
const BOTTOM_GAP = 0;

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

const IST_OFFSET_MS = 330 * 60 * 1000;

// Today (or N days away) as a YYYY-MM-DD India date. The backend reads dates as India days.
const istDate = (offsetDays = 0) =>
    new Date(Date.now() + IST_OFFSET_MS + offsetDays * 86400000).toISOString().slice(0, 10);

const PRESETS = [
    { id: "today", label: "Today", days: 1 },
    { id: "7d", label: "Last 7 days", days: 7 },
    { id: "30d", label: "Last 30 days", days: 30 },
    { id: "90d", label: "Last 90 days", days: 90 },
    { id: "custom", label: "Custom", days: 0 },
] as const;

const STATUS_OPTIONS: { id: SarvamReportStatus; label: string }[] = [
    { id: "all", label: "All" },
    { id: "answered", label: "Answered" },
    { id: "not_answered", label: "Not answered" },
];

type ChartMetric = "calls" | "minutes" | "credits";
const CHART_METRICS: { id: ChartMetric; label: string }[] = [
    { id: "calls", label: "Calls" },
    { id: "minutes", label: "Billable min" },
    { id: "credits", label: "Credits" },
];

// --- HELPERS ---
const fmtNum = (n?: number | null) => (n ?? 0).toLocaleString("en-IN");

const formatDurationSeconds = (seconds: number) => {
    if (!seconds || seconds <= 0) return "00m 00s";
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = Math.floor(seconds % 60).toString().padStart(2, "0");
    return `${m}m ${s}s`;
};

const formatTalkTime = (seconds: number) => {
    if (!seconds || seconds <= 0) return "0s";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
};

const fmtDateTime = (iso?: string | null) => {
    if (!iso) return "N/A";
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "N/A";
    return d.toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
    });
};

// Same as above but with the year, used inside the call dialog
const fmtDateTimeLong = (iso?: string | null) => {
    if (!iso) return "N/A";
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "N/A";
    return d.toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
};

// "2026-10-05" -> "5 Oct"
const fmtDay = (ymd: string) =>
    new Date(`${ymd}T00:00:00Z`).toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "UTC" });

const prettify = (s?: string | null) =>
    (s || "").replace(/_/g, " ").toLowerCase().replace(/^./, (c) => c.toUpperCase());

// The backend sends placeholders like "NO_FAILURE_REASON" for calls that did not fail.
// Returns a readable reason only when there is a real one.
const NO_FAILURE_VALUES = new Set(["", "no_failure_reason", "no_failure", "none", "null", "n/a", "na"]);
const realFailureReason = (reason?: string | null) => {
    const v = (reason || "").trim();
    return NO_FAILURE_VALUES.has(v.toLowerCase()) ? null : prettify(v);
};

// Stable id for a row in the current page of calls
const callRowId = (c: SarvamReportCall, i: number) => c.attemptId || String(i);

const copyText = async (text: string) => {
    try {
        await navigator.clipboard.writeText(text);
        toast.success("Copied");
    } catch {
        toast.error("Couldn't copy");
    }
};

// Keeps already-loaded recordings so opening a call twice doesn't re-download them.
const audioUrlCache = new Map<string, string>();

// --- SMALL BUILDING BLOCKS ---
const Avatar = ({ name, className = "w-9 h-9 text-xs" }: { name: string; className?: string }) => {
    const initials = (name || "?").split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
    const colors = [
        ["#e0f2fe", "var(--color-primary)"],
        ["#fce7f3", "#db2777"],
        ["#d1fae5", "#059669"],
        ["#ede9fe", "#7c3aed"],
        ["#fef3c7", "#d97706"],
    ];
    const idx = (name?.charCodeAt(0) ?? 0) % colors.length;
    const [bg, fg] = colors[idx];
    return (
        <div
            className={`${className} rounded-xl flex items-center justify-center font-bold flex-shrink-0 shadow-sm`}
            style={{ background: bg, color: fg }}
        >
            {initials}
        </div>
    );
};

const Card = ({
    title,
    icon: Icon,
    right,
    children,
    className = "",
}: {
    title: string;
    icon?: React.ElementType;
    right?: React.ReactNode;
    children: React.ReactNode;
    className?: string;
}) => (
    <div className={`bg-white rounded-xl p-4 border border-gray-200 min-w-0 ${className}`}>
        <div className="flex items-center justify-between gap-3 mb-3">
            <h4 className="text-xs font-bold text-gray-500 flex items-center gap-1.5">
                {Icon && <Icon size={14} />} {title}
            </h4>
            {right}
        </div>
        {children}
    </div>
);

const DetailRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div className="flex items-center justify-between gap-3 py-2.5">
        <dt className="text-xs font-medium text-gray-500 shrink-0">{label}</dt>
        <dd className="text-sm font-bold text-gray-800 text-right break-all min-w-0">{value}</dd>
    </div>
);

const TONES = {
    primary: "bg-[var(--color-primary-lighter)] text-[var(--color-primary)]",
    green: "bg-emerald-50 text-emerald-600",
    red: "bg-red-50 text-red-600",
    purple: "bg-purple-50 text-purple-600",
    amber: "bg-amber-50 text-amber-600",
    blue: "bg-blue-50 text-blue-600",
} as const;

const Kpi = ({
    label,
    value,
    sub,
    icon: Icon,
    tone = "primary",
}: {
    label: string;
    value: React.ReactNode;
    sub?: React.ReactNode;
    icon: React.ElementType;
    tone?: keyof typeof TONES;
}) => (
    <div className="bg-white rounded-xl border border-gray-200 px-3 py-3 sm:px-4 flex items-start gap-3 min-w-0">
        <span className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${TONES[tone]}`}>
            <Icon size={18} />
        </span>
        <div className="min-w-0">
            <p className="text-xs font-medium text-gray-500">{label}</p>
            <p className="text-xl font-extrabold text-gray-900 leading-tight mt-0.5 truncate">{value}</p>
            {sub && <p className="text-[11px] font-medium text-gray-400 mt-0.5 truncate">{sub}</p>}
        </div>
    </div>
);

// Smaller stat tile used inside the call dialog
const Stat = ({
    label,
    value,
    icon: Icon,
    tone = "primary",
}: {
    label: string;
    value: React.ReactNode;
    icon: React.ElementType;
    tone?: keyof typeof TONES;
}) => (
    <div className="bg-white rounded-xl border border-gray-200 px-3 py-2.5 flex items-center gap-2.5 min-w-0">
        <span className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${TONES[tone]}`}>
            <Icon size={15} />
        </span>
        <div className="min-w-0">
            <p className="text-[11px] font-medium text-gray-500">{label}</p>
            <p className="text-sm font-extrabold text-gray-900 truncate">{value}</p>
        </div>
    </div>
);

const BarList = ({ items, empty }: { items: SarvamReportCount[]; empty: string }) => {
    if (!items.length) return <p className="text-sm text-gray-500">{empty}</p>;
    const total = items.reduce((s, i) => s + i.count, 0) || 1;
    const max = Math.max(1, ...items.map((i) => i.count));
    return (
        <ul className="space-y-2.5">
            {items.map((i) => (
                <li key={i.name}>
                    <div className="flex items-baseline justify-between gap-3 text-xs mb-1">
                        <span className="font-medium text-gray-700 truncate" title={i.name}>{prettify(i.name)}</span>
                        <span className="font-bold text-gray-800 shrink-0">
                            {fmtNum(i.count)} <span className="font-medium text-gray-400">({Math.round((i.count / total) * 100)}%)</span>
                        </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                        <div className="h-full rounded-full bg-[var(--color-primary)]" style={{ width: `${(i.count / max) * 100}%` }} />
                    </div>
                </li>
            ))}
        </ul>
    );
};

// --- DAILY CHART ---
const DailyChart = ({ days, metric }: { days: SarvamReportDay[]; metric: ChartMetric }) => {
    const [hover, setHover] = useState<number | null>(null);

    const valueOf = (d: SarvamReportDay) =>
        metric === "calls" ? d.attempts : metric === "minutes" ? d.billableMinutes : d.credits ?? 0;
    const max = Math.max(1, ...days.map(valueOf));
    const h = hover !== null ? days[hover] : null;

    if (metric === "credits" && days.every((d) => d.credits === null)) {
        return <p className="text-sm text-gray-500 py-10 text-center">Credit rate is not set on the server, so credits can't be charted.</p>;
    }

    return (
        <div>
            <p className="h-5 text-xs font-medium text-gray-500 truncate">
                {h ? (
                    <>
                        <span className="font-bold text-gray-800">{fmtDay(h.date)}</span>
                        {" · "}
                        {metric === "calls" && <>{fmtNum(h.answered)} answered, {fmtNum(h.notAnswered)} not answered</>}
                        {metric === "minutes" && <>{fmtNum(h.billableMinutes)} billable min</>}
                        {metric === "credits" && <>{fmtNum(h.credits)} credits</>}
                    </>
                ) : (
                    "Tap or hover a bar for details"
                )}
            </p>

            <div className="flex items-end gap-[2px] h-44 mt-1" onMouseLeave={() => setHover(null)}>
                {days.map((d, i) => {
                    const v = valueOf(d);
                    return (
                        <div
                            key={d.date}
                            className={`flex-1 min-w-[3px] h-full flex flex-col justify-end cursor-pointer rounded-sm ${hover === i ? "bg-gray-100" : ""}`}
                            onMouseEnter={() => setHover(i)}
                            onClick={() => setHover(i)}
                        >
                            {metric === "calls" ? (
                                <>
                                    <div className="bg-gray-300 rounded-t-sm" style={{ height: `${(d.notAnswered / max) * 100}%`, minHeight: d.notAnswered > 0 ? 2 : 0 }} />
                                    <div className={`bg-[var(--color-primary)] ${d.notAnswered === 0 ? "rounded-t-sm" : ""}`} style={{ height: `${(d.answered / max) * 100}%`, minHeight: d.answered > 0 ? 2 : 0 }} />
                                </>
                            ) : (
                                <div className="bg-[var(--color-primary)] rounded-t-sm" style={{ height: `${(v / max) * 100}%`, minHeight: v > 0 ? 2 : 0 }} />
                            )}
                        </div>
                    );
                })}
            </div>

            <div className="flex justify-between text-[10px] font-medium text-gray-400 mt-1.5">
                <span>{days.length ? fmtDay(days[0].date) : ""}</span>
                <span>{days.length > 2 ? fmtDay(days[Math.floor(days.length / 2)].date) : ""}</span>
                <span>{days.length ? fmtDay(days[days.length - 1].date) : ""}</span>
            </div>

            {metric === "calls" && (
                <div className="flex items-center gap-4 mt-2 text-[11px] font-medium text-gray-500">
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-[var(--color-primary)]" /> Answered</span>
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-gray-300" /> Not answered</span>
                </div>
            )}
        </div>
    );
};

// --- HOURLY CHART ---
const HourlyChart = ({ hours }: { hours: SarvamReportHour[] }) => {
    const [hover, setHover] = useState<number | null>(null);
    const h = hover !== null ? hours[hover] : null;

    return (
        <div>
            <p className="h-5 text-xs font-medium text-gray-500 truncate">
                {h ? (
                    <>
                        <span className="font-bold text-gray-800">{h.label}</span>
                        {" · "}
                        {h.pickupRate}% picked up ({fmtNum(h.answered)} of {fmtNum(h.attempts)} calls)
                    </>
                ) : (
                    "Pickup rate by hour of day (IST)"
                )}
            </p>
            <div className="flex items-end gap-[3px] h-32 mt-1" onMouseLeave={() => setHover(null)}>
                {hours.map((x, i) => (
                    <div
                        key={x.hour}
                        className="flex-1 h-full flex flex-col justify-end cursor-pointer"
                        onMouseEnter={() => setHover(i)}
                        onClick={() => setHover(i)}
                    >
                        <div
                            className={`rounded-t-sm ${x.attempts === 0 ? "bg-gray-200" : "bg-[var(--color-primary)]"} ${hover === i ? "opacity-100" : "opacity-80"}`}
                            style={{ height: `${x.attempts === 0 ? 2 : Math.max(x.pickupRate, 2)}%` }}
                        />
                    </div>
                ))}
            </div>
            <div className="flex justify-between text-[10px] font-medium text-gray-400 mt-1.5">
                {[0, 6, 12, 18, 23].map((hr) => (
                    <span key={hr}>{String(hr).padStart(2, "0")}:00</span>
                ))}
            </div>
        </div>
    );
};

// --- CALL RECORDING PLAYER ---
const CallRecordingPlayer = ({ recordingUrl }: { recordingUrl: string }) => {
    const [blobUrl, setBlobUrl] = useState<string | null>(() => audioUrlCache.get(recordingUrl) ?? null);
    const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
    const [errorMsg, setErrorMsg] = useState("");
    const audioRef = useRef<HTMLAudioElement>(null);
    const autoPlayRef = useRef(false);

    useEffect(() => {
        if (blobUrl && autoPlayRef.current) {
            autoPlayRef.current = false;
            audioRef.current?.play().catch(() => { });
        }
    }, [blobUrl]);

    const loadAudio = async () => {
        setStatus("loading");
        setErrorMsg("");
        try {
            const blob = await fetchSarvamAudio(recordingUrl);
            const url = URL.createObjectURL(blob);
            audioUrlCache.set(recordingUrl, url);
            autoPlayRef.current = true;
            setBlobUrl(url);
            setStatus("idle");
        } catch (e: any) {
            console.error("Recording load failed:", e);
            setErrorMsg(e?.message || "Failed to load recording");
            setStatus("error");
            toast.error("Could not load recording");
        }
    };

    if (blobUrl) {
        return (
            <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-2 px-3 border border-gray-100 w-full">
                <PlayCircle className="text-[var(--color-primary)] shrink-0" size={20} />
                <audio
                    ref={audioRef}
                    controls
                    src={blobUrl}
                    className="h-8 w-full outline-none"
                    onError={() => {
                        URL.revokeObjectURL(blobUrl);
                        audioUrlCache.delete(recordingUrl);
                        setBlobUrl(null);
                        setErrorMsg("The file was downloaded but could not be played.");
                        setStatus("error");
                    }}
                />
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-2">
            <button
                onClick={loadAudio}
                disabled={status === "loading"}
                className="flex items-center gap-2 w-fit px-4 py-2.5 sm:py-2 text-xs font-bold text-white bg-[var(--color-primary)] rounded-xl hover:opacity-90 disabled:opacity-60 transition-all cursor-pointer"
            >
                {status === "loading" ? (
                    <><Loader2 size={14} className="animate-spin" /> Loading recording...</>
                ) : (
                    <><PlayCircle size={14} /> {status === "error" ? "Retry" : "Load & play recording"}</>
                )}
            </button>
            {status === "error" && (
                <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg p-2 break-words">{errorMsg}</p>
            )}
        </div>
    );
};

// --- CHAT TRANSCRIPT RENDERER ---
const CallTranscript = ({
    transcript,
    className = "max-h-[350px] overflow-y-auto pr-2 custom-scrollbar",
}: {
    transcript?: any[];
    className?: string;
}) => {
    if (!transcript || transcript.length === 0) {
        return (
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100 text-sm text-gray-500">
                <AlignLeft size={16} className="text-gray-400" />
                No transcript available for this call yet.
            </div>
        );
    }

    return (
        <div className={`flex flex-col gap-3 ${className}`}>
            {transcript.map((msg, i) => {
                const role = (msg.role || msg.speaker || "").toLowerCase();
                const isUser = role === "user";
                const content = msg.content || msg.text || msg.message || (typeof msg === "string" ? msg : JSON.stringify(msg));

                return (
                    <div key={i} className={`flex flex-col max-w-[88%] sm:max-w-[75%] ${isUser ? "self-end items-end" : "self-start items-start"}`}>
                        <span className="text-[10px] font-bold text-gray-400 uppercase mb-0.5 px-1">
                            {isUser ? "User" : "Agent"}
                        </span>
                        <div
                            className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed break-words ${isUser
                                ? "bg-[var(--color-primary)] text-white rounded-br-sm"
                                : "bg-gray-100 text-gray-800 rounded-bl-sm"
                                }`}
                        >
                            {content}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

const StatusBadge = ({ call }: { call: SarvamReportCall }) => (
    <span
        className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md border whitespace-nowrap ${call.answered
            ? "bg-emerald-50 text-emerald-700 border-emerald-100"
            : "bg-red-50 text-red-600 border-red-100"
            }`}
    >
        {call.answered ? <PhoneOutgoing size={10} /> : <PhoneMissed size={10} />}
        {call.answered ? "Answered" : prettify(call.status) || "Not answered"}
    </span>
);

// --- CALL DETAILS DIALOG ---
// Wide dialog on desktop, full-screen (100dvh) on mobile. Rendered in a portal so no parent
// overflow / transform can clip it.
const CallDetailsDialog = ({
    calls,
    index,
    onClose,
    onNavigate,
}: {
    calls: SarvamReportCall[];
    index: number;
    onClose: () => void;
    onNavigate: (nextIndex: number) => void;
}) => {
    const call = calls[index];
    const panelRef = useRef<HTMLDivElement>(null);

    const hasPrev = index > 0;
    const hasNext = index < calls.length - 1;

    // Focus the dialog, lock page scroll, and put focus back where it was on close
    useEffect(() => {
        const prevFocus = document.activeElement as HTMLElement | null;
        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        panelRef.current?.focus();
        return () => {
            document.body.style.overflow = prevOverflow;
            prevFocus?.focus?.();
        };
    }, []);

    // Esc closes, ← / → move between calls (ignored while using the audio player or a field)
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                onClose();
                return;
            }
            const t = e.target as HTMLElement | null;
            if (t && ["AUDIO", "INPUT", "SELECT", "TEXTAREA"].includes(t.tagName)) return;
            if (e.key === "ArrowLeft" && hasPrev) onNavigate(index - 1);
            if (e.key === "ArrowRight" && hasNext) onNavigate(index + 1);
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [index, hasPrev, hasNext, onClose, onNavigate]);

    if (!call) return null;

    const name = call.customer?.name || "Unknown customer";
    const transcript = (call as any).transcript as any[] | undefined;
    const failureReason = realFailureReason(call.failureReason);
    const latency = (v: number | null | undefined) => (v === null || v === undefined ? "N/A" : `${v}s`);

    const navBtn =
        "h-9 w-9 flex items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]";

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-stretch justify-center sm:items-center">
            <style>{`
                @keyframes cd-up { from { opacity: 0; transform: translateY(24px) } to { opacity: 1; transform: none } }
                @keyframes cd-pop { from { opacity: 0; transform: scale(.97) } to { opacity: 1; transform: none } }
                @keyframes cd-fade { from { opacity: 0 } to { opacity: 1 } }
                .cd-panel { animation: cd-up .22s cubic-bezier(.2,.8,.2,1) }
                .cd-backdrop { animation: cd-fade .18s ease-out }
                @media (min-width: 640px) { .cd-panel { animation: cd-pop .16s ease-out } }
                @media (prefers-reduced-motion: reduce) { .cd-panel, .cd-backdrop { animation: none } }
            `}</style>

            {/* Backdrop (only visible around the dialog on desktop) */}
            <div className="cd-backdrop absolute inset-0 bg-gray-900/50 sm:backdrop-blur-sm" onClick={onClose} aria-hidden />

            <div
                ref={panelRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby="call-dialog-title"
                tabIndex={-1}
                className="cd-panel relative flex flex-col w-full h-[100dvh] bg-gray-50 outline-none overflow-hidden sm:h-[min(92dvh,900px)] sm:w-[min(96vw,1200px)] sm:rounded-2xl sm:shadow-2xl"
            >
                {/* ---------- Header ---------- */}
                <header className="shrink-0 bg-white border-b border-gray-100 px-4 sm:px-6 pt-[max(0.75rem,env(safe-area-inset-top))] sm:pt-4 pb-3 sm:pb-4 flex items-start gap-3">
                    <Avatar name={name} className="w-11 h-11 text-sm" />

                    <div className="min-w-0 flex-1">
                        <h2 id="call-dialog-title" className="text-base sm:text-lg font-extrabold text-gray-900 leading-tight break-words">
                            {name}
                        </h2>
                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium text-gray-500">
                            {call.phone ? (
                                <a href={`tel:${call.phone}`} className="inline-flex items-center gap-1 hover:text-[var(--color-primary)]">
                                    <Phone size={12} /> {call.phone}
                                </a>
                            ) : (
                                <span>No number</span>
                            )}
                            <span className="inline-flex items-center gap-1">
                                <Clock size={12} /> {fmtDateTimeLong(call.startedAt)}
                            </span>
                        </div>
                        <div className="mt-2">
                            <StatusBadge call={call} />
                        </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                        {/* Previous / next call (desktop – mobile has a bottom bar) */}
                        <div className="hidden sm:flex items-center gap-0.5 mr-1">
                            <button onClick={() => onNavigate(index - 1)} disabled={!hasPrev} aria-label="Previous call" className={navBtn}>
                                <ChevronLeft size={18} />
                            </button>
                            <span className="text-xs font-bold text-gray-500 tabular-nums px-1">
                                {index + 1} / {calls.length}
                            </span>
                            <button onClick={() => onNavigate(index + 1)} disabled={!hasNext} aria-label="Next call" className={navBtn}>
                                <ChevronRight size={18} />
                            </button>
                        </div>

                        <button onClick={onClose} aria-label="Close" className={`${navBtn} h-10 w-10 sm:h-9 sm:w-9`}>
                            <X size={20} />
                        </button>
                    </div>
                </header>

                {/* ---------- Scrolling body (remounts per call so it starts at the top) ---------- */}
                <div key={callRowId(call, index)} className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-3 sm:p-6 space-y-4">
                    {failureReason && (
                        <div className="flex gap-3 bg-red-50 border border-red-100 rounded-xl p-3.5">
                            <AlertTriangle size={18} className="text-red-600 shrink-0 mt-0.5" />
                            <div className="min-w-0">
                                <p className="text-xs font-bold text-red-700">Failure reason</p>
                                <p className="text-sm font-medium text-red-700 mt-0.5 break-words">{failureReason}</p>
                            </div>
                        </div>
                    )}

                    {/* Key numbers */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
                        <Stat label="Duration" value={formatDurationSeconds(call.durationSeconds)} icon={Clock} tone="blue" />
                        <Stat label="Billable minutes" value={fmtNum(call.billableMinutes)} icon={Timer} tone="purple" />
                        <Stat label="Credits" value={call.credits === null ? "—" : fmtNum(call.credits)} icon={Coins} tone="amber" />
                        <Stat label="Messages" value={fmtNum(call.numMessages)} icon={MessageSquare} tone="primary" />
                        <Stat label="Agent latency" value={latency(call.avgAgentLatencySeconds)} icon={Activity} tone="green" />
                        <Stat label="User latency" value={latency(call.avgUserLatencySeconds)} icon={Activity} tone="green" />
                    </div>

                    {/* Main content */}
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
                        <div className="lg:col-span-3 flex flex-col gap-4 min-w-0">
                            <Card title="Call summary" icon={FileText}>
                                <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap break-words">
                                    {call.summary || "No summary generated for this call."}
                                </p>
                            </Card>

                            <Card title="Call recording" icon={Volume2}>
                                {call.recordingUrl ? (
                                    <CallRecordingPlayer recordingUrl={call.recordingUrl} />
                                ) : (
                                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100 text-sm text-gray-500">
                                        <Volume2 size={16} className="text-gray-400" />
                                        No audio recording found for this call.
                                    </div>
                                )}
                            </Card>

                            <Card
                                title="Transcript"
                                icon={MessageSquare}
                                right={
                                    transcript && transcript.length > 0 ? (
                                        <span className="text-[11px] font-medium text-gray-400">{fmtNum(transcript.length)} messages</span>
                                    ) : undefined
                                }
                            >
                                <CallTranscript transcript={transcript} className="" />
                            </Card>
                        </div>

                        <div className="lg:col-span-2 min-w-0 lg:sticky lg:top-0 lg:self-start">
                            <Card title="Call details" icon={Activity}>
                                <dl className="divide-y divide-gray-100 -my-2.5">
                                    <DetailRow label="Phone" value={call.phone || "N/A"} />
                                    <DetailRow label="Started" value={fmtDateTimeLong(call.startedAt)} />
                                    <DetailRow label="Ended by" value={prettify(call.endedBy) || "N/A"} />
                                    <DetailRow label="Language" value={call.language || "N/A"} />
                                    <DetailRow label="Retry attempt" value={fmtNum(call.retryAttempt)} />
                                    <DetailRow label="Provider" value={call.channelProvider || "N/A"} />
                                    <DetailRow
                                        label="Interaction ID"
                                        value={
                                            call.interactionId ? (
                                                <span className="inline-flex items-center gap-1.5">
                                                    <span className="font-mono text-xs">{call.interactionId}</span>
                                                    <button
                                                        onClick={() => copyText(call.interactionId as string)}
                                                        aria-label="Copy interaction ID"
                                                        className="p-1 rounded-md text-gray-400 hover:text-[var(--color-primary)] hover:bg-gray-100 cursor-pointer shrink-0"
                                                    >
                                                        <Copy size={13} />
                                                    </button>
                                                </span>
                                            ) : (
                                                "N/A"
                                            )
                                        }
                                    />
                                </dl>
                            </Card>
                        </div>
                    </div>
                </div>

                {/* ---------- Mobile bottom bar: previous / next call ---------- */}
                <footer className="sm:hidden shrink-0 bg-white border-t border-gray-100 px-3 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] flex items-center justify-between">
                    <button
                        onClick={() => onNavigate(index - 1)}
                        disabled={!hasPrev}
                        className="inline-flex items-center gap-1 text-xs font-bold text-gray-600 px-3 py-2.5 rounded-xl hover:bg-gray-100 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
                    >
                        <ChevronLeft size={16} /> Previous
                    </button>
                    <span className="text-xs font-bold text-gray-500 tabular-nums">
                        {index + 1} of {calls.length}
                    </span>
                    <button
                        onClick={() => onNavigate(index + 1)}
                        disabled={!hasNext}
                        className="inline-flex items-center gap-1 text-xs font-bold text-gray-600 px-3 py-2.5 rounded-xl hover:bg-gray-100 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
                    >
                        Next <ChevronRight size={16} />
                    </button>
                </footer>
            </div>
        </div>,
        document.body
    );
};

// --- PAGE ---
export default function CallReportPage() {
    // --- LAYOUT: fixed-height shell, only the content area scrolls (header stays visible) ---
    const rootRef = useRef<HTMLDivElement>(null);
    const [rootHeight, setRootHeight] = useState<number | null>(null);
    const tableTopRef = useRef<HTMLDivElement>(null);

    // --- FILTERS ---
    const [preset, setPreset] = useState<string>("30d");
    const [startDate, setStartDate] = useState(istDate(-29));
    const [endDate, setEndDate] = useState(istDate(0));
    const [status, setStatus] = useState<SarvamReportStatus>("all");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(20);

    // --- DATA ---
    const [report, setReport] = useState<SarvamCallReportResponse | null>(null);
    const [isFetching, setIsFetching] = useState(true);
    const [loadError, setLoadError] = useState(false);
    const [refreshTick, setRefreshTick] = useState(0);
    const forceRefreshRef = useRef(false);
    const reqIdRef = useRef(0); // ignores slow responses that arrive after a newer request

    const [selectedId, setSelectedId] = useState<string | null>(null); // call open in the dialog
    const [chartMetric, setChartMetric] = useState<ChartMetric>("calls");

    const rangeInvalid = !startDate || !endDate || startDate > endDate;

    // Fit the page to the screen (viewport height minus what the app layout puts above/below)
    useEffect(() => {
        const fit = () => {
            const el = rootRef.current;
            if (!el) return;
            const top = el.getBoundingClientRect().top + window.scrollY;
            let below = BOTTOM_GAP;
            let node: HTMLElement | null = el.parentElement;
            while (node && node !== document.body) {
                below += parseFloat(getComputedStyle(node).paddingBottom) || 0;
                node = node.parentElement;
            }
            setRootHeight(Math.max(420, Math.floor(window.innerHeight - top - below)));
        };
        fit();
        window.addEventListener("resize", fit);
        window.addEventListener("orientationchange", fit);
        return () => {
            window.removeEventListener("resize", fit);
            window.removeEventListener("orientationchange", fit);
        };
    }, []);

    // Load the report whenever a filter, the page, or the refresh button changes
    useEffect(() => {
        if (rangeInvalid) return;

        const id = ++reqIdRef.current;
        const refresh = forceRefreshRef.current;
        forceRefreshRef.current = false;

        setIsFetching(true);
        setLoadError(false);
        setSelectedId(null);

        (async () => {
            const res = await getSarvamCallReport({
                page,
                limit,
                startDate,
                endDate,
                status,
                sortOrder,
                ...(refresh ? { refresh: true } : {}),
            });
            if (id !== reqIdRef.current) return; // a newer request is already running

            if (res?.success) {
                setReport(res);
            } else {
                setLoadError(true);
                toast.error("Failed to load call report.");
            }
            setIsFetching(false);
        })();
    }, [page, limit, startDate, endDate, status, sortOrder, refreshTick, rangeInvalid]);

    // --- HANDLERS ---
    const handlePreset = (id: string, days: number) => {
        setPreset(id);
        if (id !== "custom") {
            setStartDate(istDate(-(days - 1)));
            setEndDate(istDate(0));
        }
        setPage(1);
    };

    const handleStatus = (s: SarvamReportStatus) => {
        setStatus(s);
        setPage(1);
    };

    const goToPage = (p: number) => {
        setPage(p);
        tableTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    const handleRefresh = () => {
        forceRefreshRef.current = true;
        setRefreshTick((t) => t + 1);
    };

    // --- DERIVED ---
    const summary = report?.summary;
    const pagination = report?.pagination;
    const calls = report?.calls ?? [];
    const total = pagination?.total ?? 0;
    const totalPages = pagination?.totalPages ?? 1;
    const fromRow = total ? (page - 1) * limit + 1 : 0;
    const toRow = (page - 1) * limit + calls.length;

    const selectedIndex = selectedId ? calls.findIndex((c, i) => callRowId(c, i) === selectedId) : -1;

    const openCall = (id: string) => setSelectedId(id);
    const closeCall = () => setSelectedId(null);
    const navigateCall = (i: number) => {
        const c = calls[i];
        if (c) setSelectedId(callRowId(c, i));
    };

    const pageNumbers = useMemo(() => {
        const first = Math.max(1, Math.min(page - 2, totalPages - 4));
        const last = Math.min(totalPages, first + 4);
        return Array.from({ length: last - first + 1 }, (_, i) => first + i);
    }, [page, totalPages]);

    // Best hour = highest pickup rate among hours with at least 3 calls
    const bestHour = useMemo(() => {
        const ok = (report?.hourly ?? []).filter((h) => h.attempts >= 3);
        if (!ok.length) return null;
        return ok.reduce((best, h) => (h.pickupRate > best.pickupRate ? h : best), ok[0]);
    }, [report]);

    const showSkeleton = !report && isFetching;
    const dim = isFetching && !!report;

    return (
        <div
            ref={rootRef}
            style={rootHeight ? { height: rootHeight } : undefined}
            className="h-[calc(100dvh-7rem)] flex flex-col max-w-[90rem] mx-auto w-full sm:bg-white rounded-2xl sm:px-2"
        >
            {/* ================= PINNED HEADER ================= */}

            <div className="shrink-0 px-1 sm:px-4 pb-3 sm:py-3 border-b border-gray-100 flex flex-col gap-3">
                {/* Title + actions */}
                {/* Mobile: [title ........ refresh] / [agent picker]   |   sm+: [title ... picker refresh] */}
                <div className="flex flex-wrap items-center gap-x-3 gap-y-2 sm:flex-nowrap">
                    <div className="order-1 min-w-0 flex-1">
                        <h1 className="text-xl sm:text-2xl font-extrabold leading-tight text-[var(--color-primary)] flex items-center gap-2">
                            <BarChart3 className="shrink-0" size={26} />
                            <span>Sarvam Call Report</span>
                        </h1>
                        <p className="text-xs text-gray-500 font-medium mt-1 hidden md:block">
                            Every AI call with totals, credits and trends for the selected dates.
                        </p>
                    </div>

                    <button
                        onClick={handleRefresh}
                        disabled={isFetching || rangeInvalid}
                        aria-label="Refresh"
                        className="order-2 sm:order-3 flex items-center justify-center gap-1.5 text-xs font-bold text-gray-600 bg-white border border-gray-200 rounded-xl h-[38px] w-[38px] sm:w-auto sm:px-3 hover:text-[var(--color-primary)] hover:border-[var(--color-primary-light)] transition-colors cursor-pointer shrink-0 disabled:opacity-60"
                    >
                        <RefreshCcw size={14} className={isFetching ? "animate-spin" : ""} />
                        <span className="hidden sm:inline">Refresh</span>
                    </button>

                    <div className="order-3 basis-full sm:basis-auto sm:order-2 sm:shrink-0">
                        <CallingAgentPicker
                            onSwitch={() => {
                                setPage(1);
                                handleRefresh();
                            }}
                        />
                    </div>
                </div>

                {/* Date range */}
                <div className="flex items-center gap-2">
                    {/* Presets scroll horizontally on small screens */}
                    <div className="flex min-w-0 items-center gap-1.5 overflow-x-auto py-0.5 px-0.5 hide-scrollbar">
                        {PRESETS.filter((p) => p.id !== "custom").map((p) => (
                            <button
                                key={p.id}
                                onClick={() => handlePreset(p.id, p.days)}
                                className={`text-xs font-bold px-3 py-2 sm:py-1.5 rounded-full border whitespace-nowrap transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] ${preset === p.id
                                    ? "bg-[var(--color-primary)] text-white border-[var(--color-primary)]"
                                    : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"
                                    }`}
                            >
                                {p.label}
                            </button>
                        ))}
                    </div>

                    {/* Kept OUTSIDE the scroller so the dropdown is never clipped by overflow-x */}
                    <DateRangeDropdown
                        active={preset === "custom"}
                        start={startDate}
                        end={endDate}
                        maxDate={istDate(0)}
                        onApply={(s, e) => {
                            setPreset("custom");
                            setStartDate(s);
                            setEndDate(e);
                            setPage(1);
                        }}
                    />
                </div>

                {rangeInvalid && (
                    <p className="text-xs font-medium text-red-600">
                        Pick a start date that is on or before the end date.
                    </p>
                )}
            </div>

            {/* ================= SCROLLING CONTENT ================= */}
            <div className="p-3 sm:p-4 bg-gray-50/50">
                {showSkeleton ? (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
                            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                                <div key={i} className="animate-pulse h-[72px] bg-white border border-gray-200 rounded-xl" />
                            ))}
                        </div>
                        <div className="animate-pulse h-64 bg-white border border-gray-200 rounded-xl" />
                        <div className="animate-pulse h-64 bg-white border border-gray-200 rounded-xl" />
                    </div>
                ) : !report ? (
                    <div className="text-center py-14 bg-white rounded-2xl border border-gray-200">
                        <AlertTriangle className="text-gray-300 mx-auto mb-3" size={32} />
                        <h4 className="text-base font-bold text-gray-800">Couldn't load the call report</h4>
                        <p className="text-sm text-gray-500 mt-1">Check your connection and try again.</p>
                        <button
                            onClick={handleRefresh}
                            className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-white bg-[var(--color-primary)] rounded-xl px-4 py-2 hover:opacity-90 cursor-pointer"
                        >
                            <RefreshCcw size={13} /> Try again
                        </button>
                    </div>
                ) : (
                    <div className={`max-w-6xl mx-auto space-y-4 transition-opacity ${dim ? "opacity-60" : ""}`}>
                        {/* Notices */}
                        {loadError && (
                            <div className="flex gap-3 bg-red-50 border border-red-100 rounded-2xl p-3.5 text-sm text-red-700 font-medium">
                                <AlertTriangle size={18} className="shrink-0 mt-0.5" />
                                The latest request failed. You are looking at the previous results.
                            </div>
                        )}
                        {summary && summary.creditsUsed === null && (
                            <div className="flex gap-3 bg-blue-50 border border-blue-100 rounded-2xl p-3.5">
                                <Info size={18} className="text-blue-600 shrink-0 mt-0.5" />
                                <p className="text-sm text-blue-800 leading-relaxed font-medium">
                                    Credits aren't shown yet because the credit rate isn't set on the server. Billable minutes are
                                    already exact. Set <strong>SARVAM_CREDITS_PER_MINUTE</strong> in the backend .env to see credits used.
                                </p>
                            </div>
                        )}
                        {report.meta.summaryTruncated && (
                            <div className="flex gap-3 bg-amber-50 border border-amber-100 rounded-2xl p-3.5">
                                <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
                                <p className="text-sm text-amber-800 leading-relaxed font-medium">
                                    This date range has too many calls to total in one go, so the numbers above are partial. Pick a shorter range.
                                </p>
                            </div>
                        )}

                        {
                            report.totalCreditsLeft !== null && (
                                <div className="flex gap-3 bg-emerald-50 border border-emerald-100 rounded-2xl p-3.5">
                                    <Info size={18} className="text-emerald-600 shrink-0 mt-0.5" />
                                    <p className="text-sm text-emerald-800 leading-relaxed font-medium">
                                        You have <strong>{fmtNum(report.totalCreditsLeft)}</strong> credits left on the server. This is the total of all your customers' credits.
                                    </p>
                                </div>
                            )
                        }

                        {/* KPI cards */}
                        {summary && (
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
                                <Kpi label="Total calls" value={fmtNum(summary.totalCalls)} sub="All dial attempts" icon={PhoneCall} tone="primary" />
                                <Kpi label="Answered" value={fmtNum(summary.answered)} sub={`${summary.pickupRate}% pickup rate`} icon={PhoneOutgoing} tone="green" />
                                <Kpi label="Not answered" value={fmtNum(summary.notAnswered)} sub="No answer, busy or failed" icon={PhoneMissed} tone="red" />
                                <Kpi label="Talk time" value={formatTalkTime(summary.totalTalkSeconds)} sub={`Avg ${formatTalkTime(summary.avgCallSeconds)} per answered call`} icon={Clock} tone="blue" />
                                <Kpi label="Billable minutes" value={fmtNum(summary.billableMinutes)} sub="Each call rounded to a minute" icon={Timer} tone="purple" />
                                <Kpi
                                    label="Credits used (Approx)"
                                    value={summary.creditsUsed === null ? "—" : fmtNum(summary.creditsUsed)}
                                    sub={summary.creditsPerMinute === null ? "Credit rate not set" : `At ${summary.creditsPerMinute} per minute`}
                                    icon={Coins}
                                    tone="amber"
                                />
                                <Kpi
                                    label="Credits per answered (Approx)"
                                    value={summary.avgCreditsPerAnsweredCall === null ? "—" : fmtNum(summary.avgCreditsPerAnsweredCall)}
                                    sub={`Longest call ${formatTalkTime(summary.longestCallSeconds)}`}
                                    icon={Coins}
                                    tone="amber"
                                />
                                <Kpi
                                    label="Short calls"
                                    value={fmtNum(summary.shortCalls)}
                                    sub={`${summary.shortCallRate}% of answered, ended after one turn`}
                                    icon={MessageSquare}
                                    tone="primary"
                                />
                            </div>
                        )}

                        {/* Charts */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                            <div className="lg:col-span-2">
                                <Card
                                    title="Calls over time"
                                    icon={BarChart3}
                                    right={
                                        <div role="radiogroup" aria-label="Chart metric" className="inline-flex rounded-xl bg-gray-100 p-1 text-[11px] font-bold">
                                            {CHART_METRICS.map((m) => (
                                                <button
                                                    key={m.id}
                                                    type="button"
                                                    role="radio"
                                                    aria-checked={chartMetric === m.id}
                                                    onClick={() => setChartMetric(m.id)}
                                                    className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${chartMetric === m.id ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-800"}`}
                                                >
                                                    {m.label}
                                                </button>
                                            ))}
                                        </div>
                                    }
                                >
                                    <DailyChart days={report.daily} metric={chartMetric} />
                                </Card>
                            </div>

                            <Card
                                title="Best time to call"
                                icon={Sun}
                                right={bestHour ? (
                                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-100 whitespace-nowrap">
                                        {bestHour.label} · {bestHour.pickupRate}%
                                    </span>
                                ) : undefined}
                            >
                                <HourlyChart hours={report.hourly} />
                            </Card>
                        </div>

                        {/* Breakdowns */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Card title="Call outcomes" icon={Activity}>
                                <BarList items={report.breakdowns.status} empty="No calls in this range." />
                            </Card>
                            <Card title="Top failure reasons" icon={AlertTriangle}>
                                <BarList items={report.breakdowns.failureReasons} empty="No failed calls in this range." />
                            </Card>
                            <Card title="Answered calls ended by" icon={Phone}>
                                <BarList items={report.breakdowns.endedBy} empty="No answered calls in this range." />
                            </Card>
                            <Card title="Languages" icon={MessageSquare}>
                                <BarList items={report.breakdowns.languages} empty="No answered calls in this range." />
                            </Card>
                        </div>

                        {/* Top customers */}
                        <Card title="Top customers by billable minutes" icon={Users}>
                            {report.topCustomers.length === 0 ? (
                                <p className="text-sm text-gray-500">No customer calls in this range.</p>
                            ) : (
                                <div className="overflow-x-auto -mx-1">
                                    <table className="w-full min-w-[560px] text-left">
                                        <thead>
                                            <tr className="text-[11px] font-bold text-gray-400">
                                                <th className="px-1 pb-2 font-bold">Customer</th>
                                                <th className="px-2 pb-2 font-bold text-right">Calls</th>
                                                <th className="px-2 pb-2 font-bold text-right">Answered</th>
                                                <th className="px-2 pb-2 font-bold text-right">Talk time</th>
                                                <th className="px-2 pb-2 font-bold text-right">Billable min</th>
                                                <th className="px-1 pb-2 font-bold text-right">Credits</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {report.topCustomers.map((c) => (
                                                <tr key={c.customerId} className="text-sm">
                                                    <td className="px-1 py-2.5">
                                                        <div className="flex items-center gap-2.5 min-w-0">
                                                            <Avatar name={c.name || "?"} className="w-8 h-8 text-[11px]" />
                                                            <div className="min-w-0">
                                                                <p className="font-bold text-gray-900 truncate">{c.name || "Unknown customer"}</p>
                                                                <p className="text-[11px] font-medium text-gray-500 truncate">{c.phone || "No number"}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-2 py-2.5 text-right font-bold text-gray-800">{fmtNum(c.calls)}</td>
                                                    <td className="px-2 py-2.5 text-right font-medium text-gray-700">{fmtNum(c.answered)}</td>
                                                    <td className="px-2 py-2.5 text-right font-medium text-gray-700">{formatTalkTime(c.talkSeconds)}</td>
                                                    <td className="px-2 py-2.5 text-right font-bold text-gray-800">{fmtNum(c.billableMinutes)}</td>
                                                    <td className="px-1 py-2.5 text-right font-bold text-gray-800">{c.credits === null ? "—" : fmtNum(c.credits)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </Card>

                        {/* ================= ALL CALLS (paginated) ================= */}
                        <div ref={tableTopRef} className="scroll-mt-2">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                                <div>
                                    <h3 className="text-lg font-extrabold text-gray-800">All calls</h3>
                                    <p className="text-xs text-gray-500 mt-0.5">
                                        {total ? `Showing ${fmtNum(fromRow)}–${fmtNum(toRow)} of ${fmtNum(total)}` : "No calls match these filters"}
                                    </p>
                                </div>

                                <div className="flex items-center gap-1.5 overflow-x-auto">
                                    {STATUS_OPTIONS.map((o) => (
                                        <button
                                            key={o.id}
                                            onClick={() => handleStatus(o.id)}
                                            className={`text-xs font-bold px-3 py-1.5 rounded-full border whitespace-nowrap transition-colors cursor-pointer ${status === o.id
                                                ? "bg-gray-900 text-white border-gray-900"
                                                : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"
                                                }`}
                                        >
                                            {o.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {calls.length === 0 ? (
                                <div className="text-center py-12 bg-white rounded-2xl border border-gray-200 shadow-sm">
                                    <PhoneCall className="text-gray-300 mx-auto mb-3" size={32} />
                                    <h4 className="text-base font-bold text-gray-800">No calls found</h4>
                                    <p className="text-sm text-gray-500 mt-1">Try a longer date range or another status.</p>
                                </div>
                            ) : (
                                <>
                                    {/* Desktop: table */}
                                    <div className="hidden lg:block bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                                        <table className="w-full text-left">
                                            <thead>
                                                <tr className="text-[11px] font-bold text-gray-500 bg-gray-50 border-b border-gray-100">
                                                    <th className="px-4 py-3 font-bold">Customer</th>
                                                    <th className="px-3 py-3 font-bold">
                                                        <button
                                                            onClick={() => { setSortOrder((s) => (s === "desc" ? "asc" : "desc")); setPage(1); }}
                                                            className="inline-flex items-center gap-1 font-bold hover:text-[var(--color-primary)] cursor-pointer"
                                                            title={sortOrder === "desc" ? "Newest first" : "Oldest first"}
                                                        >
                                                            Date & time <ArrowUpDown size={12} />
                                                        </button>
                                                    </th>
                                                    <th className="px-3 py-3 font-bold">Status</th>
                                                    <th className="px-3 py-3 font-bold text-right">Duration</th>
                                                    <th className="px-3 py-3 font-bold text-right">Billable min</th>
                                                    <th className="px-3 py-3 font-bold text-right">Credits</th>
                                                    <th className="px-3 py-3 font-bold text-right">Messages</th>
                                                    <th className="px-3 py-3 w-10" />
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {calls.map((c, i) => {
                                                    const rowId = callRowId(c, i);
                                                    const name = c.customer?.name || "Unknown customer";
                                                    return (
                                                        <tr
                                                            key={rowId}
                                                            onClick={() => openCall(rowId)}
                                                            onKeyDown={(e) => {
                                                                if (e.key === "Enter" || e.key === " ") {
                                                                    e.preventDefault();
                                                                    openCall(rowId);
                                                                }
                                                            }}
                                                            tabIndex={0}
                                                            aria-haspopup="dialog"
                                                            className="group cursor-pointer transition-colors hover:bg-gray-50/70 focus-visible:outline-none focus-visible:bg-[var(--color-primary-lighter)]"
                                                        >
                                                            <td className="px-4 py-3">
                                                                <div className="flex items-center gap-2.5 min-w-0">
                                                                    <Avatar name={name} />
                                                                    <div className="min-w-0">
                                                                        <p className="text-sm font-bold text-gray-900 truncate max-w-[220px]">{name}</p>
                                                                        <p className="text-[11px] font-medium text-gray-500 truncate">{c.phone || "No number"}</p>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="px-3 py-3 text-sm font-medium text-gray-700 whitespace-nowrap">{fmtDateTime(c.startedAt)}</td>
                                                            <td className="px-3 py-3"><StatusBadge call={c} /></td>
                                                            <td className="px-3 py-3 text-sm font-medium text-gray-700 text-right whitespace-nowrap">{formatDurationSeconds(c.durationSeconds)}</td>
                                                            <td className="px-3 py-3 text-sm font-bold text-gray-800 text-right">{fmtNum(c.billableMinutes)}</td>
                                                            <td className="px-3 py-3 text-sm font-bold text-gray-800 text-right">{c.credits === null ? "—" : fmtNum(c.credits)}</td>
                                                            <td className="px-3 py-3 text-sm font-medium text-gray-700 text-right">{fmtNum(c.numMessages)}</td>
                                                            <td className="px-3 py-3 text-gray-300 group-hover:text-[var(--color-primary)] transition-colors">
                                                                <ChevronRight size={16} />
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Mobile / tablet: cards */}
                                    <div className="lg:hidden space-y-3">
                                        <button
                                            onClick={() => { setSortOrder((s) => (s === "desc" ? "asc" : "desc")); setPage(1); }}
                                            className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-[var(--color-primary)] cursor-pointer"
                                        >
                                            <ArrowUpDown size={12} /> {sortOrder === "desc" ? "Newest first" : "Oldest first"}
                                        </button>

                                        {calls.map((c, i) => {
                                            const rowId = callRowId(c, i);
                                            const name = c.customer?.name || "Unknown customer";
                                            return (
                                                <div
                                                    key={rowId}
                                                    className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden active:bg-gray-50 transition-colors"
                                                >
                                                    <button
                                                        type="button"
                                                        onClick={() => openCall(rowId)}
                                                        aria-haspopup="dialog"
                                                        className="w-full text-left p-3 sm:p-4 flex items-start gap-3 cursor-pointer"
                                                    >
                                                        <Avatar name={name} className="w-10 h-10 text-sm" />
                                                        <span className="flex-1 min-w-0 block">
                                                            <span className="flex items-start justify-between gap-2">
                                                                <span className="min-w-0">
                                                                    <span className="block text-sm font-bold text-gray-900 truncate">{name}</span>
                                                                    <span className="block text-[11px] font-medium text-gray-500 truncate">{c.phone || "No number"}</span>
                                                                </span>
                                                                <span className="text-xs font-medium text-gray-400 shrink-0">{fmtDateTime(c.startedAt)}</span>
                                                            </span>
                                                            <span className="mt-2 flex flex-wrap items-center gap-1.5">
                                                                <StatusBadge call={c} />
                                                                <span className="text-[11px] font-bold bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md inline-flex items-center gap-1 border border-gray-200">
                                                                    <Clock size={10} /> {formatDurationSeconds(c.durationSeconds)}
                                                                </span>
                                                                <span className="text-[11px] font-bold bg-purple-50 text-purple-600 px-2 py-0.5 rounded-md border border-purple-100">
                                                                    {fmtNum(c.billableMinutes)} min
                                                                </span>
                                                                {c.credits !== null && (
                                                                    <span className="text-[11px] font-bold bg-amber-50 text-amber-700 px-2 py-0.5 rounded-md border border-amber-100">
                                                                        {fmtNum(c.credits)} credits
                                                                    </span>
                                                                )}
                                                            </span>
                                                        </span>
                                                        <ChevronRight size={18} className="text-gray-300 shrink-0 mt-1" />
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Pagination */}
                                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4">
                                        <label className="flex items-center gap-2 text-xs font-medium text-gray-500">
                                            Rows per page
                                            <select
                                                value={limit}
                                                onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
                                                className="px-2 py-1.5 rounded-lg text-xs font-bold outline-none border border-gray-200 bg-white focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] cursor-pointer"
                                            >
                                                {PAGE_SIZE_OPTIONS.map((n) => (
                                                    <option key={n} value={n}>{n}</option>
                                                ))}
                                            </select>
                                        </label>

                                        <div className="flex items-center gap-1.5">
                                            <button
                                                onClick={() => goToPage(page - 1)}
                                                disabled={!pagination?.hasPrev || isFetching}
                                                className="p-2 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 cursor-pointer"
                                                aria-label="Previous page"
                                            >
                                                <ChevronLeft size={16} />
                                            </button>

                                            {pageNumbers.map((n) => (
                                                <button
                                                    key={n}
                                                    onClick={() => goToPage(n)}
                                                    disabled={isFetching}
                                                    className={`min-w-[34px] px-2 py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${n === page
                                                        ? "bg-[var(--color-primary)] text-white border-[var(--color-primary)]"
                                                        : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                                                        }`}
                                                >
                                                    {n}
                                                </button>
                                            ))}

                                            <button
                                                onClick={() => goToPage(page + 1)}
                                                disabled={!pagination?.hasNext || isFetching}
                                                className="p-2 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 cursor-pointer"
                                                aria-label="Next page"
                                            >
                                                <ChevronRight size={16} />
                                            </button>
                                        </div>

                                        <p className="text-xs font-medium text-gray-400">Page {page} of {fmtNum(totalPages)}</p>
                                    </div>
                                </>
                            )}
                        </div>

                        <p className="text-[11px] text-gray-400 text-center pb-2">
                            Updated {fmtDateTime(report.meta.generatedAt)}
                            {report.meta.summaryFromCache ? " · totals cached for 1 minute (use Refresh for live)" : ""}
                        </p>
                    </div>
                )}
            </div>

            {/* ================= CALL DETAILS DIALOG ================= */}
            {selectedIndex >= 0 && (
                <CallDetailsDialog
                    calls={calls}
                    index={selectedIndex}
                    onClose={closeCall}
                    onNavigate={navigateCall}
                />
            )}
        </div>
    );
}
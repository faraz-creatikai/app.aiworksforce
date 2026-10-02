"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Phone,
  PhoneCall,
  Sparkles,
  User,
  Mail,
  CheckCircle2,
  X,
  History,
  Clock,
  PhoneOutgoing,
  PhoneMissed,
  Activity,
  Loader2,
  Bot,
  RefreshCcw,
  FileText,
  Volume2,
  Code2,
  Headphones,
  ChevronDown,
  Timer,
  PlayCircle,
  ArrowLeft,
  PanelLeftClose,
  PanelLeftOpen,
  MessageSquare,
  ScrollText,
  Languages,
  Lightbulb,
  Copy,
} from "lucide-react";
import { toast } from "react-toastify";

// --- API IMPORTS ---
import { getCustomer } from "@/store/customer";
import { triggerSarvamCall, syncSarvamCallLogs, fetchSarvamAudio } from "@/store/sarvam/sarvam";
import { getSalesScript } from "@/store/salescript/salesscript";


// --- CONFIG ---
// Where the "Manual Call" button sends the user. Change this to your real dialer route.
// The customer's number / id / name are passed as query params: ?number=...&customerId=...&name=...
const DIALER_ROUTE = "/dialer";

// --- TYPES ---
interface SalesScript {
  _id: string;
  Name: string;
  Content: string;
  mode?: string;
  // metadata can be {} (manual scripts) or { tone, tips } (AI generated scripts)
  metadata?: { tone?: string; tips?: string[]; [key: string]: any } | null;
  Status?: string;
  createdAt?: string;
  updatedAt?: string;
  // Cleaned-up content, added when scripts are loaded
  text: string;
}

// "script" = send exactly as written (Gemini is skipped)
// "casual" = treat the text as a short goal and let AI write the call script
type PromptMode = "script" | "casual";

const PROMPT_MODE_OPTIONS: { id: PromptMode; label: string }[] = [
  { id: "script", label: "Use exactly as written" },
  { id: "casual", label: "AI writes the script" },
];

// --- HELPERS ---
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

const dayLabel = (iso?: string) => {
  if (!iso) return "Unknown date";
  const date = new Date(iso);
  if (isNaN(date.getTime())) return "Unknown date";
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return date.toLocaleDateString([], { day: "numeric", month: "short", year: "numeric" });
};

/**
 * Sales script content is not always clean plain text. AI-generated scripts come back as a
 * JSON-encoded string (wrapped in quotes, with literal "\n" characters). This turns any of
 * those shapes into readable text with real line breaks.
 */
const normalizeScriptContent = (raw: unknown): string => {
  if (typeof raw !== "string") return "";
  let text = raw.trim();
  if (text.length > 1 && text.startsWith('"') && text.endsWith('"')) {
    try {
      const parsed = JSON.parse(text);
      text = typeof parsed === "string" ? parsed : text.slice(1, -1);
    } catch {
      text = text.slice(1, -1);
    }
  }
  return text.replace(/\\n/g, "\n").trim();
};

// Keeps already-loaded recordings so switching tabs/cards doesn't re-download them.
// Key: raw Sarvam recording URL -> Value: browser blob URL
const audioUrlCache = new Map<string, string>();

// --- AVATAR COMPONENT ---
const Avatar = ({ name, className = "w-10 h-10 text-sm" }: { name: string; className?: string }) => {
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

// --- SMALL LAYOUT HELPERS ---
const Panel = ({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon?: React.ElementType;
  children: React.ReactNode;
}) => (
  <div className="bg-white rounded-xl p-4 border border-gray-200">
    <h4 className="text-xs font-bold text-gray-500 mb-3 flex items-center gap-1.5">
      {Icon && <Icon size={14} />} {title}
    </h4>
    {children}
  </div>
);

const DetailRow = ({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: React.ReactNode;
  icon?: React.ElementType;
}) => (
  <div className="flex items-center justify-between gap-3 py-2.5">
    <dt className="text-xs font-medium text-gray-500 flex items-center gap-1.5">
      {Icon && <Icon size={13} className="text-gray-400" />} {label}
    </dt>
    <dd className="text-sm font-bold text-gray-800 text-right break-all">{value}</dd>
  </div>
);

// --- CALL RECORDING PLAYER (loads audio on demand via fetchSarvamAudio) ---
const CallRecordingPlayer = ({ recordingUrl }: { recordingUrl: string }) => {
  const [blobUrl, setBlobUrl] = useState<string | null>(() => audioUrlCache.get(recordingUrl) ?? null);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const audioRef = useRef<HTMLAudioElement>(null);
  const autoPlayRef = useRef(false);

  // Start playback right after a fresh load (browsers may block it; controls still work)
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
          onError={(e) => {
            const a = e.currentTarget;
            console.error("Audio playback error:", { code: a.error?.code, message: a.error?.message });
            URL.revokeObjectURL(blobUrl);
            audioUrlCache.delete(recordingUrl);
            setBlobUrl(null);
            setErrorMsg(`The file was downloaded but could not be played (code ${a.error?.code}).`);
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
        className="flex items-center gap-2 w-fit px-4 py-2 text-xs font-bold text-white bg-[var(--color-primary)] rounded-xl hover:opacity-90 disabled:opacity-60 transition-all cursor-pointer"
      >
        {status === "loading" ? (
          <><Loader2 size={14} className="animate-spin" /> Loading recording...</>
        ) : (
          <><PlayCircle size={14} /> {status === "error" ? "Retry" : "Load & play recording"}</>
        )}
      </button>
      {status === "error" && (
        <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg p-2 break-words">
          {errorMsg}
        </p>
      )}
    </div>
  );
};

// --- CALL LOG CARD ---
const LOG_TABS = [
  { id: "overview", label: "Overview", icon: Volume2 },
  { id: "transcript", label: "Transcript", icon: MessageSquare },
  { id: "script", label: "Agent script", icon: ScrollText },
  { id: "raw", label: "Raw JSON", icon: Code2 },
] as const;
type LogTabId = (typeof LOG_TABS)[number]["id"];

const LogDetailsCard = ({ log }: { log: any }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<LogTabId>("overview");

  const summary = log.agent_variables?.call_summary || "";
  const dynamicInstruction = log.agent_variables?.dynamic_instruction || "";
  const userPrompt = log.agent_variables?.user_prompt || "";
  const durationSecs = log.duration_in_seconds || 0;
  const durationStr = formatDurationSeconds(durationSecs);
  const dateStr = log.start_datetime;

  // Raw Sarvam media URL (the backend sync controller returns it as recording_url).
  // It is passed to fetchSarvamAudio(), which downloads it through our server.
  const recordingUrl: string = log.recording_url || log.audio_url || "";

  const endedBy = log.ended_by || "UNKNOWN";
  const numMessages = log.num_messages || 0;
  const agentResponseTime = log.average_agent_response_time_in_seconds || 0;
  const userResponseTime = log.average_user_response_time_in_seconds || 0;
  const contact = log.user_contact || log.user_contact_masked || "Unknown";

  const transcriptMessages = Array.isArray(log.transcript) ? log.transcript : (log.transcript?.messages || []);

  const isCompleted = durationSecs > 0;
  const endedByLabel = endedBy.replace(/_/g, " ").toLowerCase();
  const displayStatus = isCompleted ? `Completed (${endedByLabel})` : "Failed / not answered";
  const timeStr = dateStr ? new Date(dateStr).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "N/A";

  const copyRaw = () => {
    navigator.clipboard
      .writeText(JSON.stringify(log, null, 2))
      .then(() => toast.success("Copied to clipboard"))
      .catch(() => toast.error("Could not copy"));
  };

  return (
    <div
      className={`bg-white rounded-2xl border transition-all overflow-hidden ${isExpanded
        ? "border-[var(--color-primary-light)] shadow-md"
        : "border-gray-200 shadow-sm hover:border-gray-300"
        }`}
    >
      {/* HEADER (always visible) */}
      <button
        type="button"
        onClick={() => setIsExpanded((v) => !v)}
        aria-expanded={isExpanded}
        className="w-full text-left p-4 sm:p-5 flex items-start gap-4 cursor-pointer hover:bg-gray-50/60 transition-colors"
      >
        <span
          className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${isCompleted ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-600"
            }`}
        >
          {isCompleted ? <PhoneOutgoing size={18} /> : <PhoneMissed size={18} />}
        </span>

        <span className="flex-1 min-w-0 block">
          <span className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
            <span className="text-sm font-bold text-gray-900 capitalize">{displayStatus}</span>
            <span className="text-[11px] font-bold bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md inline-flex items-center gap-1 border border-gray-200">
              <Clock size={10} /> {durationStr}
            </span>
            {numMessages > 0 && (
              <span className="text-[11px] font-bold bg-blue-50 text-blue-600 px-2 py-0.5 rounded-md border border-blue-100 inline-flex items-center gap-1">
                <FileText size={10} /> {numMessages} messages
              </span>
            )}
            <span className="text-[11px] font-bold bg-purple-50 text-purple-600 px-2 py-0.5 rounded-md border border-purple-100 inline-flex items-center gap-1">
              <Bot size={10} /> AI agent
            </span>
            <span className="text-xs font-medium text-gray-400 sm:ml-auto">{timeStr}</span>
          </span>

          <span className="mt-2 block text-sm text-gray-600 leading-relaxed line-clamp-2">
            {summary || <span className="italic text-gray-400">No summary available for this call.</span>}
          </span>
        </span>

        <ChevronDown
          size={18}
          className={`text-gray-400 shrink-0 mt-1 transition-transform ${isExpanded ? "rotate-180" : ""}`}
        />
      </button>

      {/* EXPANDED DETAILS */}
      {isExpanded && (
        <div className="border-t border-gray-100 bg-gray-50/50">
          {/* Tabs */}
          <div className="px-4 sm:px-5 pt-3 flex items-center gap-1 overflow-x-auto" role="tablist">
            {LOG_TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${isActive
                    ? "bg-[var(--color-primary)] text-white"
                    : "text-gray-500 hover:bg-gray-100 hover:text-gray-800"
                    }`}
                >
                  <Icon size={13} /> {tab.label}
                  {tab.id === "transcript" && transcriptMessages.length > 0 && (
                    <span className={`text-[10px] px-1.5 rounded-full ${isActive ? "bg-white/20" : "bg-gray-200 text-gray-600"}`}>
                      {transcriptMessages.length}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="p-4 sm:p-5">
            {/* OVERVIEW */}
            {activeTab === "overview" && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2 flex flex-col gap-4 min-w-0">
                  <Panel title="Call summary" icon={FileText}>
                    <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
                      {summary || "No summary generated for this call."}
                    </p>
                  </Panel>

                  <Panel title="Call recording" icon={Volume2}>
                    {recordingUrl ? (
                      <CallRecordingPlayer recordingUrl={recordingUrl} />
                    ) : (
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100 text-sm text-gray-500">
                        <Volume2 size={16} className="text-gray-400" />
                        No audio recording found for this interaction.
                      </div>
                    )}
                  </Panel>
                </div>

                <Panel title="Call details" icon={Activity}>
                  <dl className="divide-y divide-gray-100 -my-2.5">
                    <DetailRow label="Contact number" value={contact} icon={Phone} />
                    <DetailRow label="Duration" value={durationStr} icon={Clock} />
                    <DetailRow label="Ended by" value={<span className="capitalize">{endedByLabel}</span>} icon={PhoneMissed} />
                    <DetailRow label="Messages" value={numMessages} icon={MessageSquare} />
                    <DetailRow
                      label="Avg agent latency"
                      value={`${agentResponseTime}s`}
                      icon={Timer}
                    />
                    <DetailRow
                      label="Avg user latency"
                      value={`${userResponseTime}s`}
                      icon={Timer}
                    />
                  </dl>
                </Panel>
              </div>
            )}

            {/* TRANSCRIPT */}
            {activeTab === "transcript" && (
              transcriptMessages.length > 0 ? (
                <div className="bg-white p-4 rounded-xl border border-gray-200 max-h-[460px] overflow-y-auto custom-scrollbar">
                  <div className="flex flex-col gap-3">
                    {transcriptMessages.map((msg: any, i: number) => {
                      const isUser = msg.role === "user";
                      return (
                        <div key={i} className={`flex gap-3 max-w-[88%] ${isUser ? "ml-auto flex-row-reverse" : ""}`}>
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1 ${isUser ? "bg-blue-100 text-blue-600" : "bg-purple-100 text-purple-600"
                              }`}
                          >
                            {isUser ? <User size={14} /> : <Headphones size={14} />}
                          </div>
                          <div
                            className={`p-3 rounded-2xl text-sm ${isUser
                              ? "bg-blue-50 text-blue-900 rounded-tr-sm"
                              : "bg-gray-50 border border-gray-100 text-gray-800 rounded-tl-sm"
                              }`}
                          >
                            <span className={`text-[10px] font-bold block mb-1 ${isUser ? "text-blue-400 text-right" : "text-purple-400"}`}>
                              {isUser ? "Customer" : "AI agent"}
                            </span>
                            <span className="whitespace-pre-wrap">{msg.content}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
                  <MessageSquare className="mx-auto text-gray-300 mb-2" size={28} />
                  <p className="text-sm font-bold text-gray-700">No transcript for this call</p>
                  <p className="text-xs text-gray-500 mt-1">Calls that were not answered have no conversation to show.</p>
                </div>
              )
            )}

            {/* AGENT SCRIPT */}
            {activeTab === "script" && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Panel title="Agent goal / prompt" icon={Bot}>
                  <p className="text-xs text-gray-700 font-mono bg-gray-50 p-3 rounded-lg border border-gray-100 whitespace-pre-wrap">
                    {userPrompt || "N/A"}
                  </p>
                </Panel>
                <Panel title="Dynamic start instruction" icon={ScrollText}>
                  <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">{dynamicInstruction || "N/A"}</p>
                </Panel>
              </div>
            )}

            {/* RAW JSON */}
            {activeTab === "raw" && (
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100 bg-gray-50">
                  <span className="text-xs font-bold text-gray-500">Full payload</span>
                  <button
                    onClick={copyRaw}
                    className="flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-[var(--color-primary)] transition-colors cursor-pointer"
                  >
                    <Copy size={12} /> Copy
                  </button>
                </div>
                <pre className="p-4 text-xs text-gray-700 font-mono whitespace-pre-wrap break-words max-h-[460px] overflow-auto custom-scrollbar">
                  {JSON.stringify(log, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// --- SCRIPT PICKER (used inside the AI call panel) ---
const ScriptPicker = ({
  scripts,
  loading,
  error,
  selectedId,
  onSelect,
  onReload,
}: {
  scripts: SalesScript[];
  loading: boolean;
  error: boolean;
  selectedId: string | null;
  onSelect: (script: SalesScript) => void;
  onReload: () => void;
}) => {
  const [query, setQuery] = useState("");

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return scripts;
    return scripts.filter((s) => s.Name?.toLowerCase().includes(q) || s.text.toLowerCase().includes(q));
  }, [scripts, query]);

  return (
    <div className="flex flex-col min-h-0 h-full">
      <div className="p-4 pb-3 shrink-0">
        <h3 className="text-xs font-bold text-gray-500 flex items-center gap-1.5 mb-2.5">
          <ScrollText size={14} /> Saved sales scripts
        </h3>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search scripts..."
            className="w-full pl-8 pr-3 py-2 rounded-lg text-xs outline-none border border-gray-200 bg-white focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar px-4 pb-4 space-y-2">
        {loading ? (
          [1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse bg-white border border-gray-100 rounded-xl p-3">
              <div className="h-3 bg-gray-200 rounded w-2/3 mb-2" />
              <div className="h-2 bg-gray-100 rounded w-full mb-1.5" />
              <div className="h-2 bg-gray-100 rounded w-4/5" />
            </div>
          ))
        ) : error ? (
          <div className="text-center py-6">
            <p className="text-xs font-bold text-gray-700">Couldn't load scripts</p>
            <button
              onClick={onReload}
              className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-[var(--color-primary)] cursor-pointer"
            >
              <RefreshCcw size={12} /> Try again
            </button>
          </div>
        ) : visible.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-xs font-bold text-gray-700">
              {scripts.length === 0 ? "No active scripts yet" : "No scripts match your search"}
            </p>
            {scripts.length === 0 && (
              <p className="text-xs text-gray-500 mt-1">Create one in Sales Scripts, or write instructions by hand.</p>
            )}
          </div>
        ) : (
          visible.map((s) => {
            const active = s._id === selectedId;
            const tone = s.metadata?.tone;
            return (
              <button
                key={s._id}
                onClick={() => onSelect(s)}
                className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer ${active
                  ? "border-[var(--color-primary)] bg-[var(--color-primary-lighter)]"
                  : "border-gray-200 bg-white hover:border-gray-300"
                  }`}
              >
                <span className="flex items-start justify-between gap-2">
                  <span className="text-sm font-bold text-gray-900 leading-snug">{s.Name}</span>
                  {active && <CheckCircle2 size={16} className="text-[var(--color-primary)] shrink-0 mt-0.5" />}
                </span>
                <span className="mt-2 text-sm text-gray-600 leading-relaxed line-clamp-3">
                  {s.text.replace(/\s+/g, " ") || "No content"}
                </span>
                {(s.mode || tone) && (
                  <span className="mt-2 flex flex-wrap gap-1.5">
                    {s.mode && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 capitalize">
                        <Languages size={10} /> {s.mode}
                      </span>
                    )}
                    {tone && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-50 text-purple-600 truncate max-w-full">
                        {tone}
                      </span>
                    )}
                  </span>
                )}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};

// --- PAGE ---
export default function CustomerCallingPage() {
  const router = useRouter();

  const [customers, setCustomers] = useState<any[]>([]);
  const [isCustomersLoading, setIsCustomersLoading] = useState(true);

  // Call logs
  const [allCallLogs, setAllCallLogs] = useState<any[]>([]);
  const [isLogsLoading, setIsLogsLoading] = useState(true);
  const [logFilter, setLogFilter] = useState<"all" | "answered" | "missed">("all");

  // Selection & search
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchField, setSearchField] = useState<"All" | "Name" | "Campaign" | "Phone">("All");
  const [isListCollapsed, setIsListCollapsed] = useState(false);

  // AI call panel
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [promptMode, setPromptMode] = useState<PromptMode>("casual");
  const [isCalling, setIsCalling] = useState(false);
  const [callResult, setCallResult] = useState<any | null>(null);

  // Sales scripts (loaded the first time the AI panel opens)
  const [scripts, setScripts] = useState<SalesScript[]>([]);
  const [scriptsLoading, setScriptsLoading] = useState(false);
  const [scriptsError, setScriptsError] = useState(false);
  const [scriptsLoaded, setScriptsLoaded] = useState(false);
  const [selectedScriptId, setSelectedScriptId] = useState<string | null>(null);

  // --- INITIAL DATA FETCH ---
  useEffect(() => {
    fetchData();
  }, []);

  const getTelHref = (num?: string) => {
    const cleaned = (num || "").replace(/[^\d+]/g, "");
    return cleaned ? `tel:${cleaned}` : undefined;
  };

  const fetchData = async () => {
    setIsCustomersLoading(true);
    setIsLogsLoading(true);

    try {
      const [customersRes, logsRes] = await Promise.all([getCustomer(), syncSarvamCallLogs()]);

      if (customersRes) setCustomers(customersRes);

      if (logsRes?.success && logsRes?.logs) {
        setAllCallLogs(logsRes.logs);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load initial data.");
    } finally {
      setIsCustomersLoading(false);
      setIsLogsLoading(false);
    }
  };

  const refreshLogs = async () => {
    setIsLogsLoading(true);
    try {
      const logsRes = await syncSarvamCallLogs();
      if (logsRes?.success && logsRes?.logs) {
        setAllCallLogs(logsRes.logs);
        toast.success("Call logs synced!");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to sync call logs.");
    } finally {
      setIsLogsLoading(false);
    }
  };

  // --- SALES SCRIPTS ---
  const loadScripts = async () => {
    setScriptsLoading(true);
    setScriptsError(false);
    try {
      const res: any = await getSalesScript();
      if (!res) {
        setScriptsError(true);
        return;
      }
      const list: any[] = Array.isArray(res) ? res : res.data || res.scripts || [];
      const active = list
        .filter((s) => (s.Status || "Active").toLowerCase() === "active")
        .map((s) => ({ ...s, text: normalizeScriptContent(s.Content) })) as SalesScript[];
      setScripts(active);
      setScriptsLoaded(true);
    } catch (err) {
      console.error(err);
      setScriptsError(true);
    } finally {
      setScriptsLoading(false);
    }
  };

  const selectedScript = scripts.find((s) => s._id === selectedScriptId) || null;
  const isScriptEdited = !!selectedScript && aiPrompt.trim() !== selectedScript.text;

  // A saved script is used exactly as written by default.
  const handleSelectScript = (script: SalesScript) => {
    setSelectedScriptId(script._id);
    setAiPrompt(script.text);
    setPromptMode("script");
  };

  const handlePromptChange = (value: string) => {
    setAiPrompt(value);
  };

  // Quick hints are short goals, so the AI writes the script.
  const handleQuickHint = (hint: string) => {
    setSelectedScriptId(null);
    setAiPrompt(hint);
    setPromptMode("casual");
  };

  const clearPrompt = () => {
    setAiPrompt("");
    setSelectedScriptId(null);
    setPromptMode("casual");
  };

  // --- FILTER CUSTOMERS ---
  const SEARCH_FIELDS = ["All", "Name", "Campaign", "Phone"] as const;
  const filteredCustomers = useMemo(() => {
    if (!searchQuery.trim()) return customers;
    const q = searchQuery.toLowerCase();
    return customers.filter((c: any) => {
      if (searchField === "All") {
        return (
          c.customerName?.toLowerCase().includes(q) ||
          c.Campaign?.toLowerCase().includes(q) ||
          c.ContactNumber?.includes(q)
        );
      }
      const fieldMap: Record<string, string> = {
        Name: c.customerName,
        Campaign: c.Campaign,
        Phone: c.ContactNumber,
      };
      return fieldMap[searchField]?.toLowerCase().includes(q);
    });
  }, [customers, searchQuery, searchField]);

  const selectedCustomer = customers.find((c: any) => (c._id || c.id) === selectedId);

  // --- MATCH CALL LOGS TO SELECTED CUSTOMER ---
  const customerCallLogs = useMemo(() => {
    if (!selectedCustomer || !allCallLogs.length) return [];

    const targetId = String(selectedCustomer._id || selectedCustomer.id);

    const matched = allCallLogs.filter((log: any) => {
      // Exact customer_id inside agent_variables
      const logCustId = String(log.agent_variables?.customer_id);
      if (logCustId === targetId) return true;

      // Fallback brute string match just in case
      return JSON.stringify(log).includes(targetId);
    });

    // Newest first
    return [...matched].sort(
      (a, b) => new Date(b.start_datetime || 0).getTime() - new Date(a.start_datetime || 0).getTime()
    );
  }, [allCallLogs, selectedCustomer]);

  const callStats = useMemo(() => {
    const answered = customerCallLogs.filter((l: any) => (l.duration_in_seconds || 0) > 0);
    const talk = answered.reduce((sum: number, l: any) => sum + (l.duration_in_seconds || 0), 0);
    return {
      total: customerCallLogs.length,
      answered: answered.length,
      missed: customerCallLogs.length - answered.length,
      talk,
    };
  }, [customerCallLogs]);

  const groupedLogs = useMemo(() => {
    const filtered = customerCallLogs.filter((l: any) => {
      const answered = (l.duration_in_seconds || 0) > 0;
      if (logFilter === "answered") return answered;
      if (logFilter === "missed") return !answered;
      return true;
    });
    const groups: { label: string; logs: any[] }[] = [];
    filtered.forEach((log: any) => {
      const label = dayLabel(log.start_datetime);
      const last = groups[groups.length - 1];
      if (last && last.label === label) last.logs.push(log);
      else groups.push({ label, logs: [log] });
    });
    return groups;
  }, [customerCallLogs, logFilter]);

  // --- CALL ACTIONS ---
  const handleManualCall = () => {
    if (!selectedCustomer?.ContactNumber) {
      toast.error("This customer has no contact number.");
      return;
    }
    const params = new URLSearchParams({
      number: String(selectedCustomer.ContactNumber),
      customerId: String(selectedId),
      name: selectedCustomer.customerName || "",
    });
    router.push(`${DIALER_ROUTE}?${params.toString()}`);
  };

  const openAIModal = () => {
    setIsAIModalOpen(true);
    if (!scriptsLoaded && !scriptsLoading) loadScripts();
  };

  const closeAIModal = () => {
    setIsAIModalOpen(false);
    setAiPrompt("");
    setSelectedScriptId(null);
    setPromptMode("casual");
    setCallResult(null);
  };

  const handleTriggerCall = async () => {
    if (!aiPrompt.trim() || !selectedId) return;
    setIsCalling(true);

    try {
      const res = await triggerSarvamCall({
        userPrompt: aiPrompt,
        customerId: selectedId,
        promptMode, // "script" = used as written, "casual" = AI writes the script
      });

      if (res?.success) {
        setCallResult(res);
        toast.success("AI call started!");
        setTimeout(refreshLogs, 6000);
      } else {
        toast.error(res?.message || "Failed to start call");
      }
    } catch (error: any) {
      console.error(error);
      toast.error(error?.response?.data?.message || error?.message || "An error occurred");
    } finally {
      setIsCalling(false);
    }
  };

  const firstName = (selectedCustomer?.customerName || "").split(" ")[0] || "the customer";

  // Where the script shown on the result screen came from.
  // Uses the backend's `source` when present, otherwise the mode the user chose.
  const resultSource: "generated" | "script" =
    callResult?.aiInstructions?.source ?? (promptMode === "casual" ? "generated" : "script");

  return (
    <div className="h-full flex flex-col overflow-hidden max-w-[90rem] mx-auto w-full sm:bg-white rounded-2xl sm:px-2">

      {/* TOP BAR */}
      <div className="shrink-0 sm:p-4">
        <h1 className="text-2xl font-extrabold text-[var(--color-primary)] max-sm:mb-5 flex items-center gap-2">
          <PhoneCall className="text-[var(--color-primary)]" size={26} /> Customer Calling
        </h1>
        <p className="text-xs text-gray-500 font-medium mt-1 hidden md:block">
          Select a customer, then call them yourself from the dialer or let an AI agent make the call.
        </p>
      </div>

      {/* MAIN SPLIT WORKSPACE */}
      <div className="flex flex-1 overflow-hidden h-[calc(100vh-180px)] min-h-[500px] border-t border-gray-100">

        {/* ================= LEFT PANEL: CUSTOMER LIST ================= */}
        <div
          className={`${selectedCustomer ? "hidden" : "flex"} ${isListCollapsed ? "lg:hidden" : "lg:flex"
            } w-full lg:w-[290px] xl:w-[320px] shrink-0 border-r border-gray-200 bg-gray-50/30 flex-col`}
        >
          <div className="px-4 py-4 border-b border-gray-200 bg-white shrink-0">
            <div className="relative mb-3">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <Search size={16} />
              </div>
              <input
                type="text"
                placeholder="Search customers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none border border-gray-200 focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] transition-all bg-gray-50 focus:bg-white"
              />
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {SEARCH_FIELDS.map((f) => (
                <button
                  key={f}
                  onClick={() => setSearchField(f)}
                  className={`text-[10px] font-bold px-3 py-1 rounded-full transition-all duration-150 border cursor-pointer ${searchField === f
                    ? "bg-[var(--color-primary)] text-white border-[var(--color-primary)]"
                    : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"
                    }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {isCustomersLoading ? (
              <div className="flex flex-col gap-3 p-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="animate-pulse flex items-center gap-3 bg-white p-3 rounded-xl border border-gray-100">
                    <div className="w-10 h-10 rounded-xl bg-gray-200 shrink-0" />
                    <div className="flex-1">
                      <div className="h-3 bg-gray-200 rounded w-2/3 mb-2" />
                      <div className="h-2 bg-gray-100 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredCustomers.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-6">
                <Search size={32} className="text-gray-300 mb-3" />
                <p className="text-sm font-bold text-gray-500">No customers found</p>
              </div>
            ) : (
              <div className="p-2 space-y-1">
                {filteredCustomers.map((c: any) => {
                  const cId = c._id || c.id;
                  const isSelected = selectedId === cId;
                  return (
                    <div
                      key={cId}
                      onClick={() => setSelectedId(cId)}
                      className={`flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-all border ${isSelected
                        ? "bg-[var(--color-primary-lighter)] border-[var(--color-primary-light)] shadow-sm"
                        : "bg-white border-transparent hover:border-gray-200"
                        }`}
                    >
                      <Avatar name={c.customerName} />
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-bold truncate ${isSelected ? "text-[var(--color-primary-darker)]" : "text-gray-900"}`}>
                          {c.customerName || "—"}
                        </p>
                        <p className="text-[11px] font-medium text-gray-500 truncate mt-0.5">
                          {c.ContactNumber || c.Email || "No contact info"}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ================= RIGHT PANEL ================= */}
        <div className={`${selectedCustomer ? "flex" : "hidden lg:flex"} flex-1 min-w-0 flex-col bg-white overflow-hidden relative`}>
          {!selectedCustomer ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-gray-50/50">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-[var(--color-primary-lighter)] text-[var(--color-primary)] mb-4 shadow-sm">
                <Phone size={32} />
              </div>
              <h2 className="text-xl font-bold text-gray-800">Select a customer to start</h2>
              <p className="text-sm text-gray-500 mt-2 max-w-sm">
                Pick a customer from the list to see their call history and choose between a manual call or an AI call.
              </p>
            </div>
          ) : (
            <>
              {/* Customer header + the two main call options */}
              <div className="px-4 sm:px-6 pt-4 pb-5 border-b border-gray-100 shrink-0 bg-white shadow-[0_4px_20px_-15px_rgba(0,0,0,0.1)] z-10 relative">
                <div className="flex items-center gap-3 mb-4">
                  <button
                    onClick={() => setSelectedId(null)}
                    className="lg:hidden p-2 -ml-2 rounded-lg text-gray-500 hover:bg-gray-100 cursor-pointer"
                    aria-label="Back to customers"
                  >
                    <ArrowLeft size={20} />
                  </button>
                  <button
                    onClick={() => setIsListCollapsed((v) => !v)}
                    className="hidden lg:flex p-2 -ml-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 cursor-pointer"
                    aria-label={isListCollapsed ? "Show customer list" : "Hide customer list"}
                    title={isListCollapsed ? "Show customer list" : "Hide customer list"}
                  >
                    {isListCollapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
                  </button>

                  <Avatar name={selectedCustomer.customerName} className="w-12 h-12 text-base" />
                  <div className="min-w-0">
                    <h2 className="text-xl sm:text-2xl font-black text-gray-900 leading-tight truncate">
                      {selectedCustomer.customerName}
                    </h2>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-0.5 text-sm font-medium text-gray-500 mt-0.5">
                      <span className="flex items-center gap-1"><Phone size={13} /> {selectedCustomer.ContactNumber || "No number"}</span>
                      {selectedCustomer.Email && (
                        <span className="flex items-center gap-1 min-w-0"><Mail size={13} /> <span className="truncate">{selectedCustomer.Email}</span></span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* MANUAL CALL */}
                  <a
                    href={getTelHref(selectedCustomer.ContactNumber)}
                    onClick={(e) => {
                      if (!selectedCustomer.ContactNumber) {
                        e.preventDefault();
                        toast.error("This customer has no contact number.");
                      }
                    }}
                    className="group flex items-center gap-3 text-left p-3 sm:p-3.5 rounded-2xl border border-gray-200 bg-white hover:border-emerald-400 hover:shadow-md transition-all cursor-pointer"
                  >
                    <span className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 group-hover:bg-emerald-100 transition-colors">
                      <PhoneCall size={20} />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-extrabold text-gray-900">Manual call</span>
                      <span className="hidden sm:block text-xs text-gray-500 truncate">Open the dialer and call {firstName} yourself</span>
                    </span>
                  </a>

                  {/* AI CALL */}
                  <button
                    onClick={openAIModal}
                    className="group flex items-center gap-3 text-left p-3 sm:p-3.5 rounded-2xl bg-[var(--color-primary)] text-white hover:opacity-95 shadow-[0_8px_24px_-12px_rgba(var(--color-primary-rgb),0.6)] transition-all cursor-pointer"
                  >
                   {/*  <span className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
                      <Sparkles size={20} />
                    </span> */}
                    <span className="w-11 h-11 rounded-full bg-white/15 flex items-center justify-center shrink-0">
                     <img src="/taskbot.png" alt="Calling AGent" className="w-10 h-10" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-extrabold">AI calling Agent</span>
                      <span className="hidden sm:block text-xs text-white/75 truncate">Send an AI agent with a script or custom goal</span>
                    </span>
                  </button>
                </div>
              </div>

              {/* Call history */}
              <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6 bg-gray-50/50 hide-scrollbar">
                <div className="max-w-5xl mx-auto">
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <History className="text-gray-400" size={20} />
                        <h3 className="text-lg font-extrabold text-gray-800">Call history</h3>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5 ml-7">AI agent calls with summaries, transcripts and recordings</p>
                    </div>

                    <button
                      onClick={refreshLogs}
                      disabled={isLogsLoading}
                      className="flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-[var(--color-primary)] transition-colors cursor-pointer shrink-0"
                    >
                      <RefreshCcw size={14} className={isLogsLoading ? "animate-spin" : ""} /> Sync logs
                    </button>
                  </div>

                  {isLogsLoading ? (
                    <div className="flex flex-col gap-4">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="animate-pulse h-28 bg-white border border-gray-200 rounded-2xl w-full"></div>
                      ))}
                    </div>
                  ) : customerCallLogs.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-2xl border border-gray-200 shadow-sm">
                      <History className="text-gray-300 mx-auto mb-3" size={32} />
                      <h4 className="text-base font-bold text-gray-800">No AI calls yet</h4>
                      <p className="text-sm text-gray-500 mt-1">
                        When an AI agent calls {selectedCustomer.customerName}, the call will show up here.
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* Stats */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                        {[
                          { label: "Total calls", value: callStats.total },
                          { label: "Answered", value: callStats.answered },
                          { label: "Not answered", value: callStats.missed },
                          { label: "Talk time", value: formatTalkTime(callStats.talk) },
                        ].map((s) => (
                          <div key={s.label} className="bg-white rounded-xl border border-gray-200 px-4 py-3">
                            <p className="text-xl font-extrabold text-gray-900 leading-tight">{s.value}</p>
                            <p className="text-xs font-medium text-gray-500 mt-0.5">{s.label}</p>
                          </div>
                        ))}
                      </div>

                      {/* Filter */}
                      <div className="flex items-center gap-1.5 mb-4">
                        {([
                          ["all", "All"],
                          ["answered", "Answered"],
                          ["missed", "Not answered"],
                        ] as const).map(([id, label]) => (
                          <button
                            key={id}
                            onClick={() => setLogFilter(id)}
                            className={`text-xs font-bold px-3 py-1.5 rounded-full border transition-colors cursor-pointer ${logFilter === id
                              ? "bg-gray-900 text-white border-gray-900"
                              : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"
                              }`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>

                      {groupedLogs.length === 0 ? (
                        <div className="text-center py-10 bg-white rounded-2xl border border-gray-200">
                          <p className="text-sm font-bold text-gray-700">No calls match this filter</p>
                        </div>
                      ) : (
                        <div className="space-y-6">
                          {groupedLogs.map((group) => (
                            <section key={group.label}>
                              <h4 className="text-xs font-bold text-gray-500 mb-2.5">{group.label}</h4>
                              <div className="space-y-3">
                                {group.logs.map((log: any, idx: number) => (
                                  <LogDetailsCard key={log.interaction_id || log.job_id || idx} log={log} />
                                ))}
                              </div>
                            </section>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ========================================================= */}
      {/* AI CALL PANEL — pick a saved script or write instructions  */}
      {/* ========================================================= */}
      {isAIModalOpen && (
        <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center sm:p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white sm:rounded-3xl shadow-2xl border border-gray-200 w-full max-w-6xl flex flex-col relative overflow-hidden h-[100dvh] sm:max-h-[97vh]">

            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/80 shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                {/* <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-br from-[var(--color-primary)] to-purple-600 text-white shadow-md shrink-0">
                  <Sparkles size={20} />
                </div> */}
                <span className="w-11 h-11 rounded-full bg-white/15 flex items-center justify-center shrink-0">
                     <img src="/taskbot.png" alt="Calling AGent" className="w-10 h-10" />
                    </span>
                <div className="min-w-0">
                  <h2 className="text-lg font-extrabold text-gray-900">AI calling Agent</h2>
                  <p className="text-xs text-gray-500 font-medium truncate">
                    Calling {selectedCustomer?.customerName} ({selectedCustomer?.ContactNumber})
                  </p>
                </div>
              </div>
              <button onClick={closeAIModal} className="text-gray-400 hover:text-gray-700 bg-white p-2 rounded-xl border border-gray-200 shadow-sm transition-colors cursor-pointer shrink-0">
                <X size={20} />
              </button>
            </div>

            {/* Body */}
            {!callResult ? (
              <div className="flex-1 min-h-0 flex flex-col sm:flex-row overflow-y-auto sm:overflow-hidden">
                {/* Script list */}
                <aside className="sm:w-[300px] shrink-0 bg-gray-50/60 border-b sm:border-b-0 sm:border-r border-gray-100 h-64 sm:h-auto sm:min-h-0">
                  <ScriptPicker
                    scripts={scripts}
                    loading={scriptsLoading}
                    error={scriptsError}
                    selectedId={selectedScriptId}
                    onSelect={handleSelectScript}
                    onReload={loadScripts}
                  />
                </aside>

                {/* Instructions */}
                <section className="flex-1 min-w-0 p-5 flex flex-col gap-4 sm:overflow-y-auto custom-scrollbar">
                  <div className="bg-blue-50 border border-blue-100 rounded-2xl p-3.5 flex gap-3">
                    <Activity size={18} className="text-blue-600 shrink-0 mt-0.5" />
                    <p className="text-sm text-blue-800 leading-relaxed font-medium">
                      Pick a saved script or write your own. Choose <strong>Use exactly as written</strong> to send it as-is, or <strong>AI writes the script</strong> to turn a short goal into a full call script.
                    </p>
                  </div>

                  {selectedScript && (
                    <div className="rounded-2xl border border-[var(--color-primary-light)] bg-[var(--color-primary-lighter)] p-3.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <ScrollText size={14} className="text-[var(--color-primary)]" />
                        <span className="text-sm font-bold text-gray-900">{selectedScript.Name}</span>
                        {isScriptEdited && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-700">Edited</span>
                        )}
                        {selectedScript.metadata?.tone && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white text-purple-600 border border-purple-100">
                            {selectedScript.metadata.tone}
                          </span>
                        )}
                        <button
                          onClick={() => setSelectedScriptId(null)}
                          className="ml-auto text-xs font-bold text-gray-500 hover:text-gray-800 cursor-pointer"
                        >
                          Detach
                        </button>
                      </div>
                      {Array.isArray(selectedScript.metadata?.tips) && selectedScript.metadata!.tips!.length > 0 && (
                        <ul className="mt-2.5 space-y-1">
                          {selectedScript.metadata!.tips!.map((tip, i) => (
                            <li key={i} className="flex items-start gap-2 text-xs text-gray-700 leading-relaxed">
                              <Lightbulb size={12} className="text-amber-500 shrink-0 mt-0.5" /> {tip}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}

                  <div className="flex flex-col flex-1 min-h-[200px]">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <label htmlFor="agent-instructions" className="text-xs font-bold text-gray-500 flex items-center gap-1.5">
                        <Bot size={14} /> Agent instructions
                      </label>

                      <div className="flex items-center gap-3">
                        {/* How the text is used */}
                        <div
                          role="radiogroup"
                          aria-label="How should the instructions be used?"
                          className="inline-flex rounded-xl bg-gray-100 p-1 text-xs font-bold"
                        >
                          {PROMPT_MODE_OPTIONS.map((opt) => (
                            <button
                              key={opt.id}
                              type="button"
                              role="radio"
                              aria-checked={promptMode === opt.id}
                              onClick={() => setPromptMode(opt.id)}
                              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${promptMode === opt.id
                                ? "bg-white text-gray-900 shadow-sm"
                                : "text-gray-500 hover:text-gray-800"
                                }`}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>

                        {aiPrompt && (
                          <button
                            onClick={clearPrompt}
                            className="text-xs font-bold text-gray-400 hover:text-gray-700 cursor-pointer"
                          >
                            Clear
                          </button>
                        )}
                      </div>
                    </div>
                    <textarea
                      id="agent-instructions"
                      value={aiPrompt}
                      onChange={(e) => handlePromptChange(e.target.value)}
                      placeholder={
                        promptMode === "casual"
                          ? "e.g. Ask them if they are still interested in the 3BHK property we showed last week..."
                          : "Paste or write the full script the agent should follow..."
                      }
                      className="w-full flex-1 min-h-[180px] p-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm leading-relaxed focus:ring-2 focus:ring-[var(--color-primary-light)] focus:border-[var(--color-primary)] outline-none resize-none transition-all"
                    />
                    <p className="mt-2 text-xs text-gray-500">
                      {promptMode === "casual"
                        ? "AI will write a call script from this goal and the customer's history."
                        : "The agent will follow this text as written, with the customer's name filled in."}
                    </p>

                    <div className="flex flex-wrap gap-2 mt-3">
                      {["Follow up on previous visit", "Pitch new campaign offer", "Schedule site visit"].map((hint) => (
                        <button
                          key={hint}
                          onClick={() => handleQuickHint(hint)}
                          className="text-[11px] font-bold px-3 py-1.5 bg-gray-100 text-gray-600 hover:bg-[var(--color-primary-lighter)] hover:text-[var(--color-primary)] rounded-lg transition-colors cursor-pointer"
                        >
                          {hint}
                        </button>
                      ))}
                    </div>
                  </div>
                </section>
              </div>
            ) : (
              /* RESULT SCREEN */
              <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center justify-center text-center animate-in fade-in zoom-in-95 duration-300">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle2 size={32} />
                </div>
                <h3 className="text-xl font-black text-gray-900 mb-2">AI agent is calling</h3>
                <p className="text-sm text-gray-500 max-w-md mx-auto mb-6">
                  The agent is dialing {selectedCustomer?.customerName}. The call log and summary will appear in the call history once the call ends.
                </p>

                {callResult.aiInstructions && (
                  <div className="w-full max-w-2xl text-left bg-gray-50 border border-gray-200 rounded-2xl p-4">
                    <span className="block text-xs font-bold text-gray-400 mb-1">
                      {resultSource === "generated" ? "AI-written script" : "Your script"}
                    </span>
                    {callResult.aiInstructions.aiAnswer && (
                      <p className="text-sm font-bold text-gray-800 mb-2">{callResult.aiInstructions.aiAnswer}</p>
                    )}
                    <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                      {callResult.aiInstructions.callingPrompt || "Calling prompt initialized successfully."}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Footer */}
            {!callResult ? (
              <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3 shrink-0">
                <button
                  onClick={closeAIModal}
                  className="px-6 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-200 bg-gray-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleTriggerCall}
                  disabled={isCalling || !aiPrompt.trim()}
                  className="flex items-center gap-2 px-8 py-2.5 text-sm font-bold text-white bg-gray-900 hover:bg-black rounded-xl shadow-md transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isCalling ? (
                    <><Loader2 size={16} className="animate-spin" /> {promptMode === "casual" ? "Writing script & dialing..." : "Dialing..."}</>
                  ) : (
                    <><PhoneOutgoing size={16} /> Start AI call</>
                  )}
                </button>
              </div>
            ) : (
              <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex justify-center shrink-0">
                <button
                  onClick={closeAIModal}
                  className="px-8 py-2.5 text-sm font-bold text-white bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] rounded-xl transition-colors cursor-pointer"
                >
                  Close and view history
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
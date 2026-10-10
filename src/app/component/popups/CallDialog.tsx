"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  X,
  PhoneCall,
  PhoneOutgoing,
  ChevronRight,
  ArrowLeft,
  Loader2,
  ScrollText,
  Search,
  CheckCircle2,
  Lightbulb,
  RefreshCcw,
} from "lucide-react";
import { toast } from "react-toastify";

import { triggerSarvamCall } from "@/store/sarvam/sarvam";
import { getSalesScript } from "@/store/salescript/salesscript";
import VoicePicker from "@/app/component/datafields/VoicePicker";
import CallingAgentPicker from "../datafields/CallingAgentPicker";

/* ------------------------------------------------------------------ */
/* TYPES                                                               */
/* ------------------------------------------------------------------ */

/** What the parent passes in when the user taps a "Call" trigger. */
export interface CallTarget {
  customerId: string;
  phone: string;
  name?: string;
}

export interface CallDialogProps {
  /** Pass a target to open the dialog, pass null to keep it closed. */
  target: CallTarget | null;
  onClose: () => void;
  /** Fired after the AI call has been started successfully. */
  onCallStarted?: (result: any) => void;
}

interface SalesScript {
  _id: string;
  Name: string;
  Content: string;
  mode?: string;
  metadata?: { tone?: string; tips?: string[]; [key: string]: any } | null;
  Status?: string;
  text: string; // cleaned-up Content
}

// "script" = send exactly as written, "casual" = AI writes the script from a short goal
type PromptMode = "script" | "casual";

const MODE_OPTIONS: { id: PromptMode; label: string }[] = [
  { id: "casual", label: "AI writes it" },
  { id: "script", label: "Use as written" },
];

const QUICK_GOALS = ["Follow up on previous visit", "Pitch new campaign offer", "Schedule site visit"];

/* ------------------------------------------------------------------ */
/* HELPERS                                                             */
/* ------------------------------------------------------------------ */

// AI scripts can come back JSON-encoded with literal "\n". Turn them into readable text.
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

const initialsOf = (name?: string) =>
  (name || "?").split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

// Scripts rarely change while the app is open, so keep them between dialog openings.
let scriptsCache: SalesScript[] | null = null;

const TRANSITION_MS = 320;

/* ------------------------------------------------------------------ */
/* COMPONENT                                                           */
/* ------------------------------------------------------------------ */

export default function CallDialog({ target, onClose, onCallStarted }: CallDialogProps) {
  const open = !!target;

  const [step, setStep] = useState<"choose" | "ai">("choose");

  // AI panel state
  const [prompt, setPrompt] = useState("");
  const [mode, setMode] = useState<PromptMode>("casual");
  const [voice, setVoice] = useState<string | null>(null);
  const [isCalling, setIsCalling] = useState(false);
  const [result, setResult] = useState<any | null>(null);

  // Scripts
  const [scripts, setScripts] = useState<SalesScript[]>(scriptsCache || []);
  const [scriptsLoading, setScriptsLoading] = useState(false);
  const [scriptsError, setScriptsError] = useState(false);
  const [selectedScriptId, setSelectedScriptId] = useState<string | null>(null);
  const [scriptQuery, setScriptQuery] = useState("");

  // Panels are inert while off-screen so keyboard focus can't land in them.
  const choosePanelRef = useRef<HTMLDivElement>(null);
  const aiPanelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (choosePanelRef.current) (choosePanelRef.current as any).inert = step !== "choose";
    if (aiPanelRef.current) (aiPanelRef.current as any).inert = step !== "ai";
  }, [step, open]);

  // Reset everything whenever the dialog closes.
  useEffect(() => {
    if (open) return;
    setStep("choose");
    setPrompt("");
    setMode("casual");
    setVoice(null);
    setResult(null);
    setSelectedScriptId(null);
    setScriptQuery("");
    setIsCalling(false);
  }, [open]);

  // Lock page scroll + close on Escape.
  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isCalling) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, isCalling, onClose]);

  /* ---------------- scripts ---------------- */
  const loadScripts = useCallback(async () => {
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
      scriptsCache = active;
      setScripts(active);
    } catch (err) {
      console.error(err);
      setScriptsError(true);
    } finally {
      setScriptsLoading(false);
    }
  }, []);

  const visibleScripts = useMemo(() => {
    const q = scriptQuery.trim().toLowerCase();
    if (!q) return scripts;
    return scripts.filter((s) => s.Name?.toLowerCase().includes(q) || s.text.toLowerCase().includes(q));
  }, [scripts, scriptQuery]);

  const selectedScript = scripts.find((s) => s._id === selectedScriptId) || null;
  const isScriptEdited = !!selectedScript && prompt.trim() !== selectedScript.text;
  const tips = selectedScript?.metadata?.tips;

  /* ---------------- actions ---------------- */
  const getTelHref = (num?: string) => {
    const cleaned = (num || "").replace(/[^\d+]/g, "");
    return cleaned ? `tel:${cleaned}` : undefined;
  };

  const handleOpenAI = () => {
    setStep("ai");
    if (!scriptsCache && !scriptsLoading) loadScripts();
  };

  const handleSelectScript = (s: SalesScript) => {
    setSelectedScriptId(s._id);
    setPrompt(s.text);
    setMode("script"); // saved scripts are used exactly as written by default
  };

  const handleQuickGoal = (goal: string) => {
    setSelectedScriptId(null);
    setPrompt(goal);
    setMode("casual");
  };

  const handleStartCall = async () => {
    if (!prompt.trim() || !target) return;
    setIsCalling(true);
    try {
      const res = await triggerSarvamCall({
        userPrompt: prompt,
        customerId: target.customerId,
        promptMode: mode,
        ...(voice ? { voice } : {}), // only sent when a voice is chosen
      });
      if (res?.success) {
        setResult(res);
        toast.success("AI call started!");
        onCallStarted?.(res);
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

  if (!target) return null;

  const firstName = (target.name || "").split(" ")[0] || "the customer";
  const resultSource = result?.aiInstructions?.source ?? (mode === "casual" ? "generated" : "script");

  /* ---------------- render ---------------- */
  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-gray-900/55 backdrop-blur-[2px] sm:items-center sm:p-4 animate-in fade-in duration-200"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !isCalling) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Call ${target.name || target.phone}`}
        className="relative flex h-[96dvh] w-full flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:h-[min(92dvh,780px)] sm:max-w-3xl sm:rounded-3xl animate-in slide-in-from-bottom-10 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-300"
      >
        {/* Shared header: who we're calling */}
        <header className="flex shrink-0 items-center gap-2.5 border-b border-gray-100 px-3 py-2.5 sm:gap-3 sm:px-5 sm:py-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary-lighter)] text-sm font-extrabold text-[var(--color-primary)] sm:h-12 sm:w-12 sm:text-base">
            {initialsOf(target.name)}
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-base font-extrabold leading-tight text-gray-900 sm:text-lg">
              {target.name || "Unknown customer"}
            </h2>
            <p className="truncate text-xs font-medium tabular-nums text-gray-500 sm:text-sm">
              {target.phone || "No number"}
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isCalling}
            aria-label="Close"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition-colors hover:bg-gray-200 hover:text-gray-800 disabled:opacity-50 cursor-pointer"
          >
            <X size={18} />
          </button>
        </header>

        {/* Sliding viewport: two panels side by side, the track moves left */}
        <div className="relative min-h-0 flex-1 overflow-hidden">
          <div
            className="flex h-full w-[200%] will-change-transform motion-reduce:!transition-none"
            style={{
              transform: step === "choose" ? "translateX(0)" : "translateX(-50%)",
              transition: `transform ${TRANSITION_MS}ms cubic-bezier(0.32, 0.72, 0, 1)`,
            }}
          >
            {/* ============ PANEL 1: choose how to call ============ */}
            <div ref={choosePanelRef} className="flex h-full w-1/2 flex-col px-3 pb-3 pt-3 sm:px-5 sm:pb-5 sm:pt-4">
              <p className="mb-2 text-sm text-gray-500 sm:mb-3">How do you want to call {firstName}?</p>

              {/* Mobile: two compact rows. Desktop: two big cards. */}
              <div className="flex flex-col gap-2 sm:grid sm:flex-1 sm:grid-cols-2 sm:gap-4">
                {/* Manual */}
                <a
                  href={getTelHref(target.phone)}
                  onClick={(e) => {
                    if (!target.phone) {
                      e.preventDefault();
                      toast.error("This customer has no contact number.");
                      return;
                    }
                    setTimeout(onClose, 200); // let the phone dialer open first, then close the dialog
                  }}
                  className="group flex items-center gap-3 rounded-2xl bg-emerald-600 p-3 text-left text-white shadow-md transition-all hover:bg-emerald-700 active:scale-[0.985] sm:flex-col sm:items-stretch sm:justify-between sm:rounded-3xl sm:p-5 cursor-pointer"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/15 sm:h-14 sm:w-14 sm:rounded-2xl">
                    <PhoneCall size={22} />
                  </span>
                  <span className="flex min-w-0 flex-1 items-end justify-between gap-2">
                    <span className="min-w-0">
                      <span className="block text-base font-extrabold sm:text-lg">Manual call</span>
                      <span className="mt-0.5 block text-xs text-white/80 sm:text-sm">
                        Open the dialer and talk to {firstName} yourself.
                      </span>
                    </span>
                    <ChevronRight
                      size={20}
                      className="mb-1 hidden shrink-0 text-white/60 transition-transform group-hover:translate-x-0.5 sm:block"
                    />
                  </span>
                </a>

                {/* AI */}
                <button
                  onClick={handleOpenAI}
                  className="group flex items-center gap-3 rounded-2xl bg-[var(--color-primary)] p-3 text-left text-white shadow-md transition-all hover:opacity-95 active:scale-[0.985] sm:flex-col sm:items-stretch sm:justify-between sm:rounded-3xl sm:p-5 cursor-pointer"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/15 sm:h-14 sm:w-14 sm:rounded-2xl">
                    <img src="/taskbot.png" alt="" className="h-8 w-8 sm:h-10 sm:w-10" />
                  </span>
                  <span className="flex min-w-0 flex-1 items-end justify-between gap-2">
                    <span className="min-w-0">
                      <span className="block text-base font-extrabold sm:text-lg">AI calling agent</span>
                      <span className="mt-0.5 block text-xs text-white/75 sm:text-sm">
                        Send an agent with a saved script or a short goal.
                      </span>
                    </span>
                    <ChevronRight
                      size={20}
                      className="mb-1 hidden shrink-0 text-white/60 transition-transform group-hover:translate-x-0.5 sm:block"
                    />
                  </span>
                </button>
              </div>
            </div>

            {/* ============ PANEL 2: AI call setup ============ */}
            <div ref={aiPanelRef} className="flex h-full w-1/2 flex-col">
              {result ? (
                /* Success view */
                <div className="flex flex-1 flex-col items-center overflow-y-auto px-3 pb-3 pt-4 text-center sm:px-5">
                  <span className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                    <CheckCircle2 size={28} />
                  </span>
                  <h3 className="mt-3 text-lg font-extrabold text-gray-900 sm:text-xl">Calling {firstName} now</h3>
                  <p className="mt-1 max-w-xs text-sm text-gray-500">
                    The agent is dialing. The call log and summary will show up once the call ends.
                  </p>
                  {result.aiInstructions && (
                    <div className="mt-4 w-full rounded-2xl bg-gray-50 p-3 text-left sm:p-4">
                      <p className="mb-1 text-xs font-bold text-gray-400">
                        {resultSource === "generated" ? "Script the AI wrote" : "Your script"}
                      </p>
                      {result.aiInstructions.aiAnswer && (
                        <p className="mb-2 text-sm font-bold text-gray-800">{result.aiInstructions.aiAnswer}</p>
                      )}
                      <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
                        {result.aiInstructions.callingPrompt || "Calling prompt initialized successfully."}
                      </p>
                    </div>
                  )}
                  <div className="mt-auto w-full pt-4">
                    <button
                      onClick={onClose}
                      className="w-full rounded-xl bg-[var(--color-primary)] py-3 text-sm font-bold text-white transition-opacity hover:opacity-90 cursor-pointer"
                    >
                      Done
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Pinned top row: Back + voice picker (outside the scroll area so its menu isn't clipped) */}
                  <div className="flex shrink-0 items-center justify-between gap-2 px-3 pb-1 pt-2 sm:px-5 sm:pt-3">
                    <button
                      onClick={() => setStep("choose")}
                      disabled={isCalling}
                      className="-ml-2 inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-bold text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800 cursor-pointer"
                    >
                      <ArrowLeft size={16} /> Back
                    </button>
                     <CallingAgentPicker />
                 {/*    <VoicePicker value={voice} onChange={setVoice} disabled={isCalling} /> */}
                  </div>

                  <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-3 pb-3 sm:px-5">
                    {/* Saved scripts: swipeable row */}
                    <div className="mb-1.5 flex items-center justify-between gap-3">
                      <h3 className="flex items-center gap-1.5 text-sm font-bold text-gray-800">
                        <ScrollText size={15} className="text-gray-400" /> Saved scripts
                      </h3>
                      {scripts.length > 4 && (
                        <div className="relative w-36">
                          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                          <input
                            value={scriptQuery}
                            onChange={(e) => setScriptQuery(e.target.value)}
                            placeholder="Search"
                            className="w-full rounded-lg border border-gray-200 bg-gray-50 py-1.5 pl-7 pr-2 text-xs outline-none focus:border-[var(--color-primary)] focus:bg-white"
                          />
                        </div>
                      )}
                    </div>

                    <div className="-mx-3 flex shrink-0 snap-x snap-mandatory gap-2 overflow-x-auto px-3 pb-1.5 sm:-mx-5 sm:px-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                      {scriptsLoading ? (
                        [1, 2, 3].map((i) => (
                          <div key={i} className="h-[76px] w-[62%] shrink-0 animate-pulse rounded-xl bg-gray-100 sm:w-52" />
                        ))
                      ) : scriptsError ? (
                        <button
                          onClick={loadScripts}
                          className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-gray-300 py-4 text-sm font-bold text-[var(--color-primary)] cursor-pointer"
                        >
                          <RefreshCcw size={14} /> Couldn't load scripts. Try again
                        </button>
                      ) : visibleScripts.length === 0 ? (
                        <p className="w-full rounded-xl border border-dashed border-gray-300 py-4 text-center text-sm text-gray-500">
                          {scripts.length === 0 ? "No saved scripts yet. Write instructions below." : "No scripts match your search."}
                        </p>
                      ) : (
                        visibleScripts.map((s) => {
                          const active = s._id === selectedScriptId;
                          return (
                            <button
                              key={s._id}
                              onClick={() => handleSelectScript(s)}
                              className={`relative flex h-[76px] w-[62%] shrink-0 snap-start flex-col rounded-xl border p-2.5 text-left transition-all sm:w-52 cursor-pointer ${
                                active
                                  ? "border-[var(--color-primary)] bg-[var(--color-primary-lighter)]"
                                  : "border-gray-200 bg-white hover:border-gray-300"
                              }`}
                            >
                              <span className="line-clamp-1 pr-5 text-sm font-bold text-gray-900">{s.Name}</span>
                              <span className="mt-0.5 line-clamp-2 text-xs leading-snug text-gray-500">
                                {s.text.replace(/\s+/g, " ") || "No content"}
                              </span>
                              {active && (
                                <CheckCircle2 size={16} className="absolute right-2 top-2.5 text-[var(--color-primary)]" />
                              )}
                            </button>
                          );
                        })
                      )}
                    </div>

                    {selectedScript && Array.isArray(tips) && tips.length > 0 && (
                      <ul className="mt-1.5 shrink-0 space-y-1 rounded-xl bg-amber-50 p-2.5">
                        {tips.map((tip, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs leading-relaxed text-amber-900">
                            <Lightbulb size={12} className="mt-0.5 shrink-0 text-amber-500" /> {tip}
                          </li>
                        ))}
                      </ul>
                    )}

                    {/* Mode + instructions (textarea grows to fill the remaining height) */}
                    <div className="mt-3 flex min-h-0 flex-1 flex-col">
                      <div className="mb-1.5 flex items-center justify-between gap-2">
                        <label htmlFor="call-dialog-prompt" className="text-sm font-bold text-gray-800">
                          Agent instructions
                          {isScriptEdited && (
                            <span className="ml-2 rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-700">
                              Edited
                            </span>
                          )}
                        </label>
                        {prompt && (
                          <button
                            onClick={() => {
                              setPrompt("");
                              setSelectedScriptId(null);
                              setMode("casual");
                            }}
                            className="text-xs font-bold text-gray-400 hover:text-gray-700 cursor-pointer"
                          >
                            Clear
                          </button>
                        )}
                      </div>

                      <div
                        role="radiogroup"
                        aria-label="How should the instructions be used?"
                        className="mb-2 grid shrink-0 grid-cols-2 rounded-xl bg-gray-100 p-1 text-xs font-bold"
                      >
                        {MODE_OPTIONS.map((opt) => (
                          <button
                            key={opt.id}
                            role="radio"
                            aria-checked={mode === opt.id}
                            onClick={() => setMode(opt.id)}
                            className={`rounded-lg py-1.5 transition-all cursor-pointer ${
                              mode === opt.id ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-800"
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>

                      <textarea
                        id="call-dialog-prompt"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder={
                          mode === "casual"
                            ? "e.g. Ask if they are still interested in the 3BHK property we showed last week"
                            : "Paste or write the full script the agent should follow"
                        }
                        className="min-h-[120px] w-full flex-1 resize-none rounded-xl border border-gray-200 bg-gray-50 p-3 text-base leading-relaxed outline-none transition-all focus:border-[var(--color-primary)] focus:bg-white focus:ring-2 focus:ring-[var(--color-primary-light)] sm:min-h-[160px] sm:text-sm"
                      />
                      <p className="mt-1 shrink-0 text-xs text-gray-500">
                        {mode === "casual"
                          ? "The AI will write a call script from this goal and the customer's history."
                          : "The agent follows this text as written, with the customer's name filled in."}
                      </p>

                      <div className="mt-2 flex shrink-0 flex-wrap gap-1.5">
                        {QUICK_GOALS.map((g) => (
                          <button
                            key={g}
                            onClick={() => handleQuickGoal(g)}
                            className="rounded-full bg-gray-100 px-3 py-1.5 text-xs font-bold text-gray-600 transition-colors hover:bg-[var(--color-primary-lighter)] hover:text-[var(--color-primary)] cursor-pointer"
                          >
                            {g}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Pinned action bar */}
                  <div className="shrink-0 border-t border-gray-100 bg-white px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2.5 sm:px-5">
                    <button
                      onClick={handleStartCall}
                      disabled={isCalling || !prompt.trim()}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-gray-900 py-3 text-sm font-bold text-white shadow-md transition-all hover:bg-black disabled:opacity-40 cursor-pointer"
                    >
                      {isCalling ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          {mode === "casual" ? "Writing script and dialing..." : "Dialing..."}
                        </>
                      ) : (
                        <>
                          <PhoneOutgoing size={16} /> Start AI call
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
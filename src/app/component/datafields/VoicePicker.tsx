"use client";

import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Search, Volume2 } from "lucide-react";

/**
 * Voice picker for the AI call panel.
 *
 * The voice list is Sarvam's Bulbul v3 speaker list (docs.sarvam.ai → Text-to-Speech → Voices).
 * "Best for" tags come from Sarvam's "Recommended speakers by language" table, so they only
 * exist for the languages Sarvam publishes a recommendation for. Every Bulbul v3 voice can
 * speak every supported language; the tag just marks where Sarvam says it sounds best.
 *
 * Sarvam publishes no endpoint that lists an agent's voices, so this list is static. Edit
 * VOICES below if your agent uses voices that are not in it. `value` is the lowercase speaker
 * id Sarvam expects (e.g. "priya"), or null for "use the agent's own default voice".
 *
 * Open direction: the dropdown tries `placement` (up/down) and `horizontal` (which way it
 * extends) first. If there isn't room, it flips to the other side. If neither side has
 * enough room it uses the side with more space and shrinks its list to fit.
 */

export const VOICE_LANGUAGES = [
  { code: "hi", label: "Hindi" },
  { code: "en", label: "English" },
  { code: "bn", label: "Bengali" },
  { code: "ta", label: "Tamil" },
  { code: "te", label: "Telugu" },
  { code: "gu", label: "Gujarati" },
  { code: "kn", label: "Kannada" },
  { code: "ml", label: "Malayalam" },
  { code: "mr", label: "Marathi" },
  { code: "pa", label: "Punjabi" },
  { code: "od", label: "Odia" },
] as const;

type Gender = "Male" | "Female";

interface Voice {
  id: string; // lowercase speaker id sent to the backend
  gender: Gender;
  best: string[]; // language codes Sarvam recommends this voice for
}

const male = (id: string, best: string[] = []): Voice => ({ id, gender: "Male", best });
const female = (id: string, best: string[] = []): Voice => ({ id, gender: "Female", best });

const TOP_FEMALE = ["hi", "en", "te", "kn", "ta", "mr", "gu"];

const VOICES: Voice[] = [
  // Sarvam's recommended picks first
  male("shubh", ["hi", "te", "kn", "od", "ml"]),
  male("ratan", ["en", "te", "kn", "ta", "mr", "gu"]),
  male("ashutosh", ["hi"]),
  male("mani", ["pa"]),
  female("priya", TOP_FEMALE),
  female("ishita", TOP_FEMALE),
  female("suhani", ["hi"]),
  female("neha", ["te"]),
  female("ritu", ["mr", "gu"]),
  // Remaining Bulbul v3 voices
  ...[
    "aditya", "rahul", "rohan", "amit", "dev", "varun", "manan", "sumit", "kabir", "aayan",
    "advait", "anand", "tarun", "sunny", "gokul", "vijay", "mohit", "rehan", "soham",
  ].map((id) => male(id)),
  ...["pooja", "simran", "kavya", "shreya", "roopa", "tanya", "shruti", "kavitha", "rupali"].map((id) =>
    female(id)
  ),
];

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const langLabel = (code: string) => VOICE_LANGUAGES.find((l) => l.code === code)?.label ?? code;

// useLayoutEffect warns during server rendering, so fall back to useEffect there
const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

// --- Placement helpers ---
const GAP = 8; // matches the mt-2 / mb-2 spacing between button and dropdown
const MIN_PANEL_HEIGHT = 200;

type Vertical = "top" | "bottom";
type Horizontal = "left" | "right";

interface Placed {
  y: Vertical; // "top" = opens upward, "bottom" = opens downward
  x: Horizontal; // "left" = extends to the left of the button, "right" = extends to the right
  maxHeight: number;
  maxWidth: number;
}

/**
 * The visible area the dropdown has to fit in: the viewport, narrowed by every ancestor that
 * clips its children (overflow hidden/auto/scroll) — for example a modal card.
 * Stops at a position:fixed ancestor, because fixed elements are not clipped by what is above them.
 */
const getBoundary = (el: HTMLElement) => {
  let top = 0;
  let left = 0;
  let right = window.innerWidth;
  let bottom = window.innerHeight;

  for (let node = el.parentElement; node && node !== document.body; node = node.parentElement) {
    const style = getComputedStyle(node);
    if (/(auto|scroll|hidden|clip|overlay)/.test(`${style.overflow}${style.overflowX}${style.overflowY}`)) {
      const r = node.getBoundingClientRect();
      top = Math.max(top, r.top);
      left = Math.max(left, r.left);
      right = Math.min(right, r.right);
      bottom = Math.min(bottom, r.bottom);
    }
    if (style.position === "fixed") break;
  }
  return { top, left, right, bottom };
};

// Prefer `pref`; flip to `other` if pref is too tight; otherwise take whichever has more room
const pickSide = <T extends string>(pref: T, other: T, space: Record<T, number>, need: number): T =>
  space[pref] >= need ? pref : space[other] >= need ? other : space[pref] >= space[other] ? pref : other;

// --- Row ---
const VoiceRow = ({
  voice,
  selected,
  onPick,
}: {
  voice: Voice;
  selected: boolean;
  onPick: () => void;
}) => (
  <button
    type="button"
    role="option"
    aria-selected={selected}
    onClick={onPick}
    className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left transition-colors cursor-pointer ${selected ? "bg-[var(--color-primary-lighter)]" : "hover:bg-gray-50"
      }`}
  >
    <span
      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${voice.gender === "Female" ? "bg-pink-50 text-pink-600" : "bg-sky-50 text-sky-600"
        }`}
    >
      {voice.id.charAt(0).toUpperCase()}
    </span>
    <span className="flex-1 min-w-0">
      <span className="block text-sm font-bold text-gray-900">
        {cap(voice.id)} <span className="font-medium text-gray-400">· {voice.gender}</span>
      </span>
      {voice.best.length > 0 && (
        <span className="block text-[11px] text-gray-500 truncate">
          Best for {voice.best.map(langLabel).join(", ")}
        </span>
      )}
    </span>
    {selected && <Check size={16} className="text-[var(--color-primary)] shrink-0" />}
  </button>
);

interface VoicePickerProps {
  value: string | null;
  onChange: (voice: string | null) => void;
  disabled?: boolean;
  /** Preferred vertical direction. Flips automatically when there isn't room. Default "top". */
  placement?: Vertical;
  /** Preferred horizontal direction ("left" = extends leftwards). Flips automatically. Default "left". */
  horizontal?: Horizontal;
}

export default function VoicePicker({
  value,
  onChange,
  disabled = false,
  placement = "top",
  horizontal = "left",
}: VoicePickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [lang, setLang] = useState<string>("all");
  const [placed, setPlaced] = useState<Placed | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // Measure and choose the open direction right after the panel mounts, before it is painted.
  // The panel is first rendered hidden at its natural size so it can be measured.
  useIsoLayoutEffect(() => {
    if (!open) {
      setPlaced(null);
      return;
    }
    const root = rootRef.current;
    const panel = panelRef.current;
    if (!root || !panel) return;

    const btn = root.getBoundingClientRect();
    const bound = getBoundary(root);

    const above = btn.top - bound.top - GAP;
    const below = bound.bottom - btn.bottom - GAP;
    const toLeft = btn.right - bound.left; // room if the dropdown extends left
    const toRight = bound.right - btn.left; // room if it extends right

    const y = pickSide<Vertical>(
      placement,
      placement === "top" ? "bottom" : "top",
      { top: above, bottom: below },
      panel.offsetHeight
    );
    const x = pickSide<Horizontal>(
      horizontal,
      horizontal === "left" ? "right" : "left",
      { left: toLeft, right: toRight },
      panel.offsetWidth
    );

    setPlaced({
      y,
      x,
      // If neither side has full room, shrink the panel (its list scrolls) instead of clipping it
      maxHeight: Math.max(MIN_PANEL_HEIGHT, Math.floor(y === "top" ? above : below)),
      maxWidth: Math.max(240, Math.floor(bound.right - bound.left - 16)),
    });
  }, [open, placement, horizontal]);

  // Close on outside click / Escape
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // Focus the search box once the panel is visible (hidden elements can't take focus)
  const isPlaced = placed !== null;
  useEffect(() => {
    if (open && isPlaced) searchRef.current?.focus({ preventScroll: true });
  }, [open, isPlaced]);

  const selected = VOICES.find((v) => v.id === value) || null;

  const { recommended, others } = useMemo(() => {
    const q = query.trim().toLowerCase();
    // Typing a language name ("tamil") finds the voices Sarvam recommends for it
    const matches = q
      ? VOICES.filter(
        (v) =>
          v.id.includes(q) ||
          v.gender.toLowerCase().startsWith(q) ||
          v.best.some((c) => langLabel(c).toLowerCase().includes(q))
      )
      : VOICES;
    if (lang === "all") return { recommended: [] as Voice[], others: matches };
    return {
      recommended: matches.filter((v) => v.best.includes(lang)),
      others: matches.filter((v) => !v.best.includes(lang)),
    };
  }, [query, lang]);

  const pick = (id: string | null) => {
    onChange(id);
    setOpen(false);
    setQuery("");
  };

  const noMatches = recommended.length + others.length === 0;
  const showDefaultRow = !query.trim() || "default agent voice".includes(query.trim().toLowerCase());

  // Until measured, render with the preferred direction (hidden)
  const y = placed?.y ?? placement;
  const x = placed?.x ?? horizontal;

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="inline-flex items-center gap-2 pl-3 pr-2.5 py-2.5 max-w-[8rem] sm:max-w-[14rem] rounded-xl border border-gray-200 bg-white text-sm font-bold text-gray-700 hover:border-gray-300 disabled:opacity-50 transition-colors cursor-pointer"
      >
        <Volume2 size={15} className="text-gray-400 shrink-0" />
        <span className="truncate">{selected ? `${cap(selected.id)} · ${selected.gender}` : "Default voice"}</span>
        <ChevronDown size={14} className={`text-gray-400 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div
          ref={panelRef}
          style={{
            visibility: placed ? "visible" : "hidden",
            maxHeight: placed?.maxHeight,
            maxWidth: placed?.maxWidth,
          }}
          className={`absolute z-20 flex flex-col w-[min(22rem,calc(100vw-2rem))] bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden ${x === "left" ? "right-0" : "left-0"
            } ${y === "top" ? "bottom-full mb-2" : "top-full mt-2"}`}
        >
          {/* Search */}
          <div className="p-3 pb-2 shrink-0">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                ref={searchRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name, language or gender..."
                className="w-full pl-8 pr-3 py-2 rounded-lg text-xs outline-none border border-gray-200 bg-gray-50 focus:bg-white focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]"
              />
            </div>
          </div>

          {/* Language filter */}
          <div className="px-3 pb-2 flex gap-1.5 overflow-x-auto hide-scrollbar shrink-0">
            {[{ code: "all", label: "All" }, ...VOICE_LANGUAGES].map((l) => (
              <button
                key={l.code}
                type="button"
                onClick={() => setLang(l.code)}
                className={`text-[11px] font-bold px-2.5 py-1 rounded-full border whitespace-nowrap transition-colors cursor-pointer ${lang === l.code
                  ? "bg-gray-900 text-white border-gray-900"
                  : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"
                  }`}
              >
                {l.label}
              </button>
            ))}
          </div>

          {/* List */}
          <div
            role="listbox"
            className="min-h-0 flex-1 max-h-64 overflow-y-auto overscroll-contain px-2 pb-2 border-t border-gray-100 pt-2"
          >
            {showDefaultRow && (
              <button
                type="button"
                role="option"
                aria-selected={value === null}
                onClick={() => pick(null)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left transition-colors cursor-pointer ${value === null ? "bg-[var(--color-primary-lighter)]" : "hover:bg-gray-50"
                  }`}
              >
                <span className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center shrink-0">
                  <Volume2 size={14} />
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-sm font-bold text-gray-900">Default voice</span>
                  <span className="block text-[11px] text-gray-500">Use the voice set on the Sarvam agent</span>
                </span>
                {value === null && <Check size={16} className="text-[var(--color-primary)] shrink-0" />}
              </button>
            )}

            {noMatches ? (
              <p className="text-center text-xs text-gray-500 py-6">No voices match "{query}"</p>
            ) : (
              <>
                {recommended.length > 0 && (
                  <>
                    <p className="px-3 pt-3 pb-1 text-[11px] font-bold text-gray-500">
                      Recommended for {langLabel(lang)}
                    </p>
                    {recommended.map((v) => (
                      <VoiceRow key={v.id} voice={v} selected={value === v.id} onPick={() => pick(v.id)} />
                    ))}
                  </>
                )}
                {others.length > 0 && (
                  <>
                    <p className="px-3 pt-3 pb-1 text-[11px] font-bold text-gray-500">
                      {lang === "all" ? `All voices (${others.length})` : "Other voices"}
                    </p>
                    {others.map((v) => (
                      <VoiceRow key={v.id} voice={v} selected={value === v.id} onPick={() => pick(v.id)} />
                    ))}
                  </>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
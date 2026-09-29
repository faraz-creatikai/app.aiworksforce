"use client";

// Save as: context/ProjectUpdatesContext.tsx
// Holds the live updates state, the bell dropdown, and the row component.

import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Bell, CheckCheck, CheckCircle2, PlayCircle, UserPlus, XCircle, type LucideIcon } from "lucide-react";
import { API_ROUTES, API_URL } from "@/constants/ApiRoute";
import { useCustomerAuth } from "@/context/CustomerAuthContext";
import { disconnectCustomerSocket, initCustomerSocket } from "@/socket/socket";


// ---------- API ----------
// ⚠ Match the prefix your getCustomerPortalData route uses.
// If store/customer.ts uses an axios instance, reuse it here instead of fetch.
const BASE = `${API_URL}/customer/portal/updates`;

export interface UpdatesPage {
  updates: ProjectUpdate[];
  nextCursor: string | null;
}

export const fetchUpdates = async (opts: { limit?: number; before?: string | null } = {}): Promise<UpdatesPage> => {
  const q = new URLSearchParams();
  if (opts.limit) q.set("limit", String(opts.limit));
  if (opts.before) q.set("before", opts.before);

  const res = await fetch(API_ROUTES.CUSTOMER.PORTAL_UPDATES,{ 
      credentials: "include" 
    });
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  return (await res.json()).data as UpdatesPage;
};

// ---------- STATE ----------
export type UpdateType = "STEP_STARTED" | "STEP_COMPLETED" | "STEP_REJECTED" | "TASK_ASSIGNED";

export interface ProjectUpdate {
  id: string;
  type: UpdateType;
  title: string;
  message: string;
  projectTitle: string;
  createdAt: string;
  taskId?: string | null;
  subTaskId?: string | null;
  actor: { employeeName: string; EmployeeImage: any } | null;
}

interface Ctx {
  items: ProjectUpdate[];
  unreadCount: number;
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  connected: boolean;
  isUnread: (u: ProjectUpdate) => boolean;
  loadMore: () => Promise<void>;
  markAllRead: () => void;
}

const PAGE = 20;
const UpdatesContext = createContext<Ctx | null>(null);

export function ProjectUpdatesProvider({ children }: { children: ReactNode }) {
  const { customer } = useCustomerAuth();
  const enabled = !!customer;

  // "Unread" = newer than the last time the customer pressed "Mark all as read".
  // Stored in this browser only, so no backend or schema is involved.
  const storageKey = `client-updates-seen:${customer?.email ?? "default"}`;

  const [items, setItems] = useState<ProjectUpdate[]>([]);
  const [lastSeen, setLastSeen] = useState<number | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [connected, setConnected] = useState(false);

  const itemsRef = useRef<ProjectUpdate[]>([]);
  itemsRef.current = items;

  // Load lastSeen. First visit on a device starts at "now" so old history isn't all unread.
  useEffect(() => {
    if (!enabled) return;
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        setLastSeen(Number(raw));
      } else {
        const now = Date.now();
        localStorage.setItem(storageKey, String(now));
        setLastSeen(now);
      }
    } catch {
      setLastSeen(Date.now());
    }
  }, [enabled, storageKey]);

  const refresh = useCallback(async () => {
    try {
      const d = await fetchUpdates({ limit: PAGE });
      setItems(d.updates);
      setNextCursor(d.nextCursor);
    } catch (e) {
      console.error("Failed to load updates", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!enabled) {
      setItems([]);
      setLoading(false);
      return;
    }

    refresh();
    const socket = initCustomerSocket();
    let connectedBefore = socket.connected;
    setConnected(socket.connected);

    // Only the latest state of a step is kept, matching what the history endpoint returns
    const onUpdate = (u: ProjectUpdate) => {
      setItems((prev) => [u, ...prev.filter((i) => i.id !== u.id && !(u.subTaskId && i.subTaskId === u.subTaskId))]);
    };
    const onConnect = () => {
      setConnected(true);
      if (connectedBefore) refresh(); // catch up on anything missed while offline
      connectedBefore = true;
    };
    const onDisconnect = () => setConnected(false);

    socket.on("project:update", onUpdate);
    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);

    return () => {
      socket.off("project:update", onUpdate);
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      disconnectCustomerSocket();
    };
  }, [enabled, refresh]);

  const loadMore = useCallback(async () => {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const d = await fetchUpdates({ limit: PAGE, before: nextCursor });
      setItems((prev) => [...prev, ...d.updates.filter((u) => !prev.some((p) => p.id === u.id))]);
      setNextCursor(d.nextCursor);
    } catch (e) {
      console.error("Failed to load more updates", e);
    } finally {
      setLoadingMore(false);
    }
  }, [nextCursor, loadingMore]);

  const isUnread = useCallback((u: ProjectUpdate) => lastSeen !== null && Date.parse(u.createdAt) > lastSeen, [lastSeen]);

  const unreadCount = useMemo(() => items.filter(isUnread).length, [items, isUnread]);

  const markAllRead = useCallback(() => {
    const newest = itemsRef.current.reduce((m, i) => Math.max(m, Date.parse(i.createdAt)), 0);
    const t = Math.max(Date.now(), newest); // guards against server/browser clock drift
    setLastSeen(t);
    try {
      localStorage.setItem(storageKey, String(t));
    } catch {}
  }, [storageKey]);

  const value = useMemo(
    () => ({ items, unreadCount, loading, loadingMore, hasMore: !!nextCursor, connected, isUnread, loadMore, markAllRead }),
    [items, unreadCount, loading, loadingMore, nextCursor, connected, isUnread, loadMore, markAllRead]
  );

  return <UpdatesContext.Provider value={value}>{children}</UpdatesContext.Provider>;
}

export const useProjectUpdates = () => {
  const ctx = useContext(UpdatesContext);
  if (!ctx) throw new Error("useProjectUpdates must be used inside ProjectUpdatesProvider");
  return ctx;
};

// ---------- ROW ----------
export const UPDATE_META: Record<UpdateType, { icon: LucideIcon; tone: string; label: string }> = {
  STEP_COMPLETED: { icon: CheckCircle2, tone: "bg-emerald-100 text-emerald-600", label: "Completed" },
  STEP_STARTED: { icon: PlayCircle, tone: "bg-blue-100 text-blue-600", label: "In progress" },
  STEP_REJECTED: { icon: XCircle, tone: "bg-red-100 text-red-600", label: "Needs revision" },
  TASK_ASSIGNED: { icon: UserPlus, tone: "bg-violet-100 text-violet-600", label: "New teammate" },
};

const parseImage = (img: any): string | null => {
  if (!img) return null;
  try {
    const p = typeof img === "string" ? JSON.parse(img) : img;
    return Array.isArray(p) && p.length ? p[0] : null;
  } catch {
    return typeof img === "string" ? img : null;
  }
};

const initials = (name?: string) =>
  name ? name.split(" ").filter(Boolean).slice(0, 2).map((n) => n[0]?.toUpperCase()).join("") : "?";

export const timeAgo = (iso: string) => {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return days < 7 ? `${days}d ago` : new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

export function UpdateRow({
  update,
  unread,
  compact = false,
  onClick,
}: {
  update: ProjectUpdate;
  unread: boolean;
  compact?: boolean;
  onClick?: () => void;
}) {
  const meta = UPDATE_META[update.type] ?? UPDATE_META.STEP_STARTED;
  const Icon = meta.icon;
  const src = parseImage(update.actor?.EmployeeImage);
  const size = compact ? 36 : 44;
  const box = { width: size, height: size, fontSize: size * 0.36 };

  const className = `w-full text-left flex items-start gap-3 ${compact ? "px-4 py-3" : "px-5 py-4"} ${
    unread ? "bg-[var(--color-primary-lighter)]/40" : ""
  } ${onClick ? "transition-colors hover:bg-gray-50 focus:outline-none focus-visible:bg-gray-50 cursor-pointer" : ""}`;

  const content = (
    <>
      <div className="relative shrink-0">
        {src ? (
          <img src={src} alt="" style={box} className="rounded-full object-cover" />
        ) : (
          <div style={box} className="rounded-full bg-[var(--color-primary-lighter)] text-[var(--color-primary-dark)] font-bold flex items-center justify-center">
            {initials(update.actor?.employeeName)}
          </div>
        )}
        <span className={`absolute -bottom-1 -right-1 h-5 w-5 rounded-full flex items-center justify-center ring-2 ring-white ${meta.tone}`}>
          <Icon size={12} />
        </span>
      </div>

      <div className="min-w-0 flex-1">
        <p className={`text-sm leading-snug ${unread ? "text-gray-900 font-medium" : "text-gray-600"}`}>{update.message}</p>
        <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
          <span className="truncate max-w-[60%] rounded-full bg-gray-100 px-2 py-0.5 font-medium text-gray-600">{update.projectTitle}</span>
          <span className="shrink-0">{timeAgo(update.createdAt)}</span>
        </div>
      </div>

      {unread && <span aria-label="Unread" className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[var(--color-primary)]" />}
    </>
  );

  return onClick ? (
    <button type="button" onClick={onClick} className={className}>
      {content}
    </button>
  ) : (
    <div className={className}>{content}</div>
  );
}

// ---------- BELL ----------
export function ClientNotificationBell() {
  const { items, unreadCount, loading, isUnread, markAllRead } = useProjectUpdates();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const latest = items.slice(0, 6);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={unreadCount ? `Updates, ${unreadCount} unread` : "Updates"}
        aria-expanded={open}
        aria-haspopup="true"
        className="relative flex h-10 w-10 items-center justify-center rounded-xl text-[var(--color-primary-darker)] hover:bg-[var(--color-primary-lighter)] transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[var(--color-destructive)] text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-[min(92vw,384px)] rounded-2xl border border-gray-200 bg-white shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <p className="text-sm font-bold text-gray-900">Recent updates</p>
            <button
              onClick={markAllRead}
              disabled={unreadCount === 0}
              className="flex items-center gap-1 text-xs font-semibold text-[var(--color-primary)] disabled:text-gray-300 disabled:cursor-not-allowed cursor-pointer"
            >
              <CheckCheck size={14} /> Mark all as read
            </button>
          </div>

          <div className="max-h-[420px] overflow-y-auto divide-y divide-gray-100">
            {loading ? (
              <p className="px-4 py-8 text-center text-sm text-gray-400">Loading updates...</p>
            ) : latest.length === 0 ? (
              <div className="px-4 py-10 text-center">
                <p className="text-sm font-semibold text-gray-800">Nothing yet</p>
                <p className="text-xs text-gray-500 mt-1">You'll see updates here as your team works on your projects.</p>
              </div>
            ) : (
              latest.map((u) => <UpdateRow key={u.id} update={u} unread={isUnread(u)} compact />)
            )}
          </div>

          <Link
            href="/client/updates"
            onClick={() => setOpen(false)}
            className="block border-t border-gray-100 px-4 py-3 text-center text-sm font-bold text-[var(--color-primary)] hover:bg-gray-50 transition-colors"
          >
            View all updates
          </Link>
        </div>
      )}
    </div>
  );
}
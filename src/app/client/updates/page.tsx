"use client";

// Save as: app/client/updates/page.tsx
import { useMemo, useState } from "react";
import { CheckCheck, Loader2 } from "lucide-react";
import { ProjectUpdate, UpdateRow, useProjectUpdates } from "@/context/customer/ProjectUpdatesContext";


type Filter = "all" | "unread" | "completed" | "progress" | "revision";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "unread", label: "Unread" },
  { key: "completed", label: "Completed" },
  { key: "progress", label: "In progress" },
  { key: "revision", label: "Needs revision" },
];

const dayLabel = (iso: string) => {
  const d = new Date(iso);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const day = new Date(d);
  day.setHours(0, 0, 0, 0);
  const diff = Math.round((today.getTime() - day.getTime()) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  return d.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
};

export default function ClientUpdatesPage() {
  const { items, unreadCount, loading, loadingMore, hasMore, connected, isUnread, loadMore, markAllRead } = useProjectUpdates();
  const [filter, setFilter] = useState<Filter>("all");

  const groups = useMemo(() => {
    const match = (u: ProjectUpdate) =>
      filter === "all" ||
      (filter === "unread" && isUnread(u)) ||
      (filter === "completed" && u.type === "STEP_COMPLETED") ||
      (filter === "progress" && u.type === "STEP_STARTED") ||
      (filter === "revision" && u.type === "STEP_REJECTED");
    const map = new Map<string, ProjectUpdate[]>();
    items.filter(match).forEach((u) => {
      const label = dayLabel(u.createdAt);
      map.set(label, [...(map.get(label) ?? []), u]);
    });
    return Array.from(map.entries());
  }, [items, filter, isUnread]);

  return (
    <div className="space-y-6 max-w-3xl">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--color-primary-darker)]">Recent updates</h1>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                connected ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-500"
              }`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${connected ? "bg-emerald-500 animate-pulse motion-reduce:animate-none" : "bg-gray-400"}`} />
              {connected ? "Live" : "Reconnecting"}
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">Everything your team does on your projects, as it happens.</p>
        </div>

        <button
          onClick={markAllRead}
          disabled={unreadCount === 0}
          className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:text-gray-300 disabled:cursor-not-allowed cursor-pointer transition-colors"
        >
          <CheckCheck size={16} /> Mark all as read
        </button>
      </header>

      <div className="flex gap-1.5 overflow-x-auto" role="tablist" aria-label="Filter updates">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            role="tab"
            aria-selected={filter === f.key}
            onClick={() => setFilter(f.key)}
            className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] ${
              filter === f.key ? "bg-gray-900 text-white" : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
            }`}
          >
            {f.label}
            {f.key === "unread" && unreadCount > 0 && <span className="ml-1.5 text-[var(--color-primary)] font-bold">{unreadCount}</span>}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3 animate-pulse">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-20 rounded-2xl bg-gray-200/70" />
          ))}
        </div>
      ) : groups.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center">
          <p className="font-semibold text-gray-800">{items.length === 0 ? "No updates yet" : "Nothing matches this filter"}</p>
          <p className="text-sm text-gray-500 mt-1">
            {items.length === 0 ? "When your team starts or finishes a step, it will show up here right away." : "Try another tab to see the rest."}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {groups.map(([label, list]) => (
            <section key={label}>
              <h2 className="mb-2 px-1 text-sm font-bold text-gray-500">{label}</h2>
              <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden divide-y divide-gray-100">
                {list.map((u) => (
                  <UpdateRow key={u.id} update={u} unread={isUnread(u)} />
                ))}
              </div>
            </section>
          ))}

          {hasMore && (
            <div className="text-center">
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60 cursor-pointer transition-colors"
              >
                {loadingMore && <Loader2 size={16} className="animate-spin" />} Load older updates
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
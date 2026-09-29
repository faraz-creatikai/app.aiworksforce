"use client";

import { useEffect, useMemo, useState } from "react";
import { getCustomerPortalData } from "@/store/customer";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Circle,
  Clock,
  FolderKanban,
  Mail,
  Phone,
  ShieldCheck,
  Users,
  XCircle,
} from "lucide-react";
import { useProjectUpdates } from "@/context/customer/ProjectUpdatesContext";
import Link from "next/link";

/**
 * RESPONSIVE STRATEGY
 * -------------------
 * < sm  (phones):  a compact, scannable design of its own
 *   - slim hero: name + small ring, one stats strip
 *   - segmented filter (iOS style), one row
 *   - project cards = title, status, progress bar, avatars + due date. Nothing else.
 *     Details (description, people, steps) live in the expanded panel
 *   - expanded panel is flat: people separated by dividers, no nested cards
 *   - team = swipeable avatar strip, contact = two big buttons
 * >= sm (tablet/desktop): the original design
 */

// ---------------------------------------------------------------
// TYPES
// ---------------------------------------------------------------
interface SubTask {
  id: string;
  title: string;
  description?: string | null;
  status: string; // todo | in_progress | completed | rejected
  isCompleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface Task {
  id: string;
  title: string;
  description?: string | null;
  priority: string;
  dueDate: string | null;
  status: string;
  assignedToId: string;
  isClientApproved?: boolean;
  clientFeedback?: string | null;
  createdAt: string;
  updatedAt: string;
  assignedTo: { employeeName: string; EmployeeImage: any };
  subTasks: SubTask[];
}

interface TeamMember {
  id: string;
  employeeName: string;
  Designation?: string | null;
  Role?: string | null;
  Email?: string | null;
  EmployeeImage: any;
}

// Optional: returned by the backend once you add it (see controller notes)
interface AccountManager {
  name: string;
  email?: string | null;
  phone?: string | null;
  AdminImage?: any;
}

interface PortalData {
  clientName: string;
  assignedTeam: TeamMember[];
  tasks: Task[];
  accountManager?: AccountManager | null;
}

// A "project" = all tasks that share the same title + description,
// each assigned to a different employee (a "lane").
interface Lane {
  task: Task;
  done: number;
  total: number;
  progress: number;
}

type ProjectState = "not_started" | "in_progress" | "completed";

interface Project {
  key: string;
  title: string;
  description: string;
  priority: string;
  dueDate: string | null;
  startedAt: string;
  lastActivity: string;
  lanes: Lane[];
  done: number;
  total: number;
  progress: number;
  state: ProjectState;
  approved: boolean;
  overdue: boolean;
}

// ---------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------
const PRIORITY_RANK: Record<string, number> = { low: 0, medium: 1, high: 2, urgent: 3 };

const PRIORITY_STYLES: Record<string, string> = {
  low: "bg-gray-100 text-gray-600",
  medium: "bg-blue-50 text-blue-700",
  high: "bg-amber-50 text-amber-700",
  urgent: "bg-red-50 text-red-700",
};

const STATE_META: Record<ProjectState, { label: string; className: string }> = {
  not_started: { label: "Not started", className: "bg-gray-100 text-gray-600" },
  in_progress: { label: "In progress", className: "bg-blue-50 text-blue-700" },
  completed: { label: "Completed", className: "bg-emerald-50 text-emerald-700" },
};

const getInitials = (name?: string) => {
  if (!name) return "?";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join("");
};

const parseImage = (imgData: any): string | null => {
  if (!imgData) return null;
  try {
    const parsed = typeof imgData === "string" ? JSON.parse(imgData) : imgData;
    return Array.isArray(parsed) && parsed.length > 0 ? parsed[0] : null;
  } catch {
    return typeof imgData === "string" ? imgData : null;
  }
};

const formatDate = (d?: string | null) =>
  d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : null;

// Compact date for tight spaces (year only shown when it isn't the current year)
const formatShortDate = (d?: string | null) => {
  if (!d) return null;
  const date = new Date(d);
  const sameYear = date.getFullYear() === new Date().getFullYear();
  return date.toLocaleDateString("en-US", sameYear ? { month: "short", day: "numeric" } : { month: "short", day: "numeric", year: "numeric" });
};

const timeAgo = (d: string) => {
  const mins = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return days < 7 ? `${days}d ago` : formatDate(d) ?? "";
};

// The API returns `isCompleted: false` even for completed subtasks,
// so `status` is the source of truth.
const stepStatus = (s: SubTask) => (s.status === "completed" || s.isCompleted ? "completed" : s.status);

const groupProjects = (tasks: Task[]): Project[] => {
  const groups = new Map<string, Task[]>();
  tasks.forEach((t) => {
    const key = `${t.title.trim().toLowerCase()}::${(t.description ?? "").trim().toLowerCase()}`;
    groups.set(key, [...(groups.get(key) ?? []), t]);
  });

  return Array.from(groups.entries())
    .map(([key, group]) => {
      const lanes: Lane[] = group
        .map((task) => {
          const total = task.subTasks?.length ?? 0;
          const done = task.subTasks?.filter((s) => stepStatus(s) === "completed").length ?? 0;
          return { task, done, total, progress: total ? Math.round((done / total) * 100) : 0 };
        })
        .sort((a, b) => a.task.assignedTo.employeeName.localeCompare(b.task.assignedTo.employeeName));

      const done = lanes.reduce((n, l) => n + l.done, 0);
      const total = lanes.reduce((n, l) => n + l.total, 0);
      const anyStarted = group.some((t) => t.subTasks?.some((s) => stepStatus(s) === "in_progress"));
      const allTasksDone = group.every((t) => t.status === "completed");

      let state: ProjectState = "not_started";
      if ((total > 0 && done === total) || (total === 0 && allTasksDone)) state = "completed";
      else if (done > 0 || anyStarted) state = "in_progress";

      const dueDates = group.map((t) => t.dueDate).filter(Boolean) as string[];
      const dueDate = dueDates.length ? dueDates.sort().slice(-1)[0] : null;
      const priority = group.reduce(
        (top, t) => ((PRIORITY_RANK[t.priority] ?? 1) > (PRIORITY_RANK[top] ?? 1) ? t.priority : top),
        group[0].priority
      );

      return {
        key,
        title: group[0].title,
        description: group[0].description ?? "",
        priority,
        dueDate,
        startedAt: group.map((t) => t.createdAt).sort()[0],
        lastActivity: group.map((t) => t.updatedAt).sort().slice(-1)[0],
        lanes,
        done,
        total,
        progress: total ? Math.round((done / total) * 100) : 0,
        state,
        approved: group.every((t) => t.isClientApproved),
        overdue: !!dueDate && new Date(dueDate) < new Date() && state !== "completed",
      };
    })
    .sort((a, b) => b.lastActivity.localeCompare(a.lastActivity));
};

// ---------------------------------------------------------------
// SMALL COMPONENTS
// ---------------------------------------------------------------
const Avatar = ({ name, image, size = 32 }: { name?: string; image?: any; size?: number }) => {
  const src = parseImage(image);
  const style = { width: size, height: size, fontSize: size * 0.38 };
  return src ? (
    <img src={src} alt={name ?? "Team member"} style={style} className="rounded-full object-cover border border-white shrink-0" />
  ) : (
    <div
      style={style}
      className="rounded-full bg-[var(--color-primary-lighter)] text-[var(--color-primary-dark)] font-bold flex items-center justify-center border border-white shrink-0"
      aria-label={name}
    >
      {getInitials(name)}
    </div>
  );
};

// The ring scales with its container: pass Tailwind size classes via `className`.
// `stroke` is in SVG units on a 100x100 canvas.
const ProgressRing = ({
  value,
  className = "h-14 w-14",
  stroke = 10,
  track = "text-gray-100",
  bar = "text-[var(--color-primary)]",
  labelClass = "text-xs font-bold text-gray-800",
}: {
  value: number;
  className?: string;
  stroke?: number;
  track?: string;
  bar?: string;
  labelClass?: string;
}) => {
  const VIEW = 100;
  const r = (VIEW - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className={`relative shrink-0 ${className}`}>
      <svg viewBox={`0 0 ${VIEW} ${VIEW}`} className="h-full w-full -rotate-90" aria-hidden>
        <circle cx={VIEW / 2} cy={VIEW / 2} r={r} fill="none" stroke="currentColor" strokeWidth={stroke} className={track} />
        <circle
          cx={VIEW / 2}
          cy={VIEW / 2}
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (value / 100) * c}
          className={`${bar} transition-[stroke-dashoffset] duration-700`}
        />
      </svg>
      <span className={`absolute inset-0 flex items-center justify-center ${labelClass}`}>{value}%</span>
    </div>
  );
};

const ProgressBar = ({ value, done }: { value: number; done?: boolean }) => (
  <div className="h-1.5 rounded-full bg-gray-100" role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100}>
    <div
      className={`h-1.5 rounded-full transition-[width] duration-700 ${done ? "bg-emerald-500" : "bg-[var(--color-primary)]"}`}
      style={{ width: `${value}%` }}
    />
  </div>
);

const StepIcon = ({ status }: { status: string }) => {
  if (status === "completed") return <CheckCircle2 size={18} className="text-emerald-500" />;
  if (status === "rejected") return <XCircle size={18} className="text-red-500" />;
  if (status === "in_progress")
    return (
      <span className="relative flex h-[18px] w-[18px] items-center justify-center">
        <span className="absolute h-[18px] w-[18px] rounded-full bg-blue-400/30 animate-ping motion-reduce:animate-none" />
        <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
      </span>
    );
  return <Circle size={18} className="text-gray-300" />;
};

const stepLabel: Record<string, string> = {
  completed: "Done",
  in_progress: "In progress",
  rejected: "Needs revision",
  todo: "Not started",
};

const stepColor: Record<string, string> = {
  completed: "text-emerald-600",
  in_progress: "text-blue-600",
  rejected: "text-red-600",
  todo: "text-gray-400",
};

const Chip = ({ className, children }: { className: string; children: React.ReactNode }) => (
  <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ${className}`}>{children}</span>
);

const Skeleton = () => (
  <div className="space-y-4 sm:space-y-6 animate-pulse">
    <div className="h-40 sm:h-44 rounded-2xl sm:rounded-3xl bg-gray-200/70" />
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
      <div className="xl:col-span-2 space-y-3 sm:space-y-4">
        <div className="h-11 rounded-xl bg-gray-200/70 sm:hidden" />
        <div className="h-32 rounded-2xl bg-gray-200/70" />
        <div className="h-32 rounded-2xl bg-gray-200/70" />
      </div>
      <div className="h-56 sm:h-72 rounded-2xl bg-gray-200/70" />
    </div>
  </div>
);

// ---------------------------------------------------------------
// PAGE
// ---------------------------------------------------------------
type Filter = "all" | ProjectState;

// `short` is the label used on phones so all four fit in one row
const FILTERS: { key: Filter; label: string; short: string }[] = [
  { key: "all", label: "All", short: "All" },
  { key: "in_progress", label: "In progress", short: "Active" },
  { key: "not_started", label: "Not started", short: "To do" },
  { key: "completed", label: "Completed", short: "Done" },
];

export default function ClientDashboard() {
  const [data, setData] = useState<PortalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<Filter>("all");

  useEffect(() => {
    (async () => {
      try {
        const res = await getCustomerPortalData();
        if (res?.success) setData(res.data);
      } catch (error) {
        console.error("Failed to load portal data", error);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const projects = useMemo(() => (data ? groupProjects(data.tasks) : []), [data]);

  // Open the most recently updated project by default
  useEffect(() => {
    if (projects.length && expanded.size === 0) setExpanded(new Set([projects[0].key]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projects.length]);

  // Fetch live updates from context; the dashboard widget shows the latest 5
  const { items: updates } = useProjectUpdates();
  const recentActivity = updates.slice(0, 5);

  if (loading) return <Skeleton />;

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] sm:min-h-[70vh] bg-white rounded-2xl sm:rounded-3xl border border-gray-200 p-6 sm:p-8 text-center">
        <AlertCircle size={44} className="text-gray-300 mb-4" />
        <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">We couldn&apos;t load your projects</h2>
        <p className="text-gray-500 max-w-sm text-sm sm:text-base">Refresh the page. If this keeps happening, contact your account manager.</p>
      </div>
    );
  }

  // ---- Summary numbers
  const stepsDone = projects.reduce((n, p) => n + p.done, 0);
  const stepsTotal = projects.reduce((n, p) => n + p.total, 0);
  const overall = stepsTotal ? Math.round((stepsDone / stepsTotal) * 100) : 0;
  const activeProjects = projects.filter((p) => p.state !== "completed").length;
  const overdueCount = projects.filter((p) => p.overdue).length;
  const nextDue = projects
    .filter((p) => p.dueDate && p.state !== "completed")
    .sort((a, b) => a.dueDate!.localeCompare(b.dueDate!))[0];

  const counts: Record<Filter, number> = {
    all: projects.length,
    in_progress: projects.filter((p) => p.state === "in_progress").length,
    not_started: projects.filter((p) => p.state === "not_started").length,
    completed: projects.filter((p) => p.state === "completed").length,
  };
  const visible = filter === "all" ? projects : projects.filter((p) => p.state === filter);

  const toggle = (key: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });

  const summary =
    projects.length === 0
      ? "Your projects will appear here once your team starts work."
      : `${activeProjects} active ${activeProjects === 1 ? "project" : "projects"}, ${stepsDone} of ${stepsTotal} steps complete.${
          overdueCount ? ` ${overdueCount} past due.` : ""
        }`;

  const heroStats = [
    { label: "Active projects", value: activeProjects, icon: FolderKanban },
    { label: "Steps done", value: `${stepsDone}/${stepsTotal}`, icon: CheckCircle2 },
    { label: "Next deadline", value: nextDue ? formatShortDate(nextDue.dueDate)! : "None set", icon: CalendarDays },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* ============================ HERO ============================
          Phone: name + small ring on one row, one translucent stats strip below.
          sm+:   ring on the left, separate stat tiles on the right. */}
      <section className="rounded-2xl sm:rounded-3xl bg-[var(--color-primary-darker)] text-white p-4 sm:p-8 flex flex-col lg:flex-row lg:items-center gap-4 sm:gap-6 lg:gap-10">
        <div className="flex items-center gap-4 sm:gap-5 min-w-0">
          <ProgressRing
            value={overall}
            className="order-2 sm:order-1 h-16 w-16 sm:h-24 sm:w-24"
            stroke={9}
            track="text-white/15"
            bar="text-white"
            labelClass="text-sm sm:text-xl font-extrabold text-white"
          />
          <div className="order-1 sm:order-2 min-w-0 flex-1">
            <h1 className="text-xl sm:text-3xl font-extrabold tracking-tight leading-tight break-words">Welcome back, {data.clientName}</h1>
            <p className="text-white/70 text-[13px] sm:text-sm mt-1 sm:mt-1.5 max-w-md">{summary}</p>
          </div>
        </div>

        <dl className="lg:ml-auto grid grid-cols-3 divide-x divide-white/15 rounded-xl bg-white/10 sm:gap-4 sm:divide-x-0 sm:rounded-none sm:bg-transparent">
          {heroStats.map(({ label, value, icon: Icon }) => (
            <div
              key={label}
              className="flex min-w-0 flex-col items-center px-2 py-3 text-center sm:items-start sm:rounded-2xl sm:bg-white/10 sm:px-4 sm:text-left sm:min-w-[104px]"
            >
              <Icon className="hidden sm:block h-4 w-4 text-white/60 mb-2" />
              <dt className="order-2 text-[11px] sm:text-xs leading-tight text-white/60 mt-0.5">{label}</dt>
              <dd className="order-1 text-base sm:text-lg font-bold leading-tight break-words">{value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6 items-start">
        {/* ========================= PROJECTS ========================= */}
        <section className="min-w-0 xl:col-span-2 space-y-3 sm:space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <h2 className="text-lg font-bold text-gray-900">Your projects</h2>

            {/* Phone: iOS-style segmented control. sm+: pill tabs. */}
            <div
              className="grid grid-cols-4 gap-1 rounded-xl bg-gray-200/60 p-1 sm:flex sm:gap-1.5 sm:overflow-x-auto sm:rounded-none sm:bg-transparent sm:p-0"
              role="tablist"
              aria-label="Filter projects"
            >
              {FILTERS.map(({ key, label, short }) => {
                const active = filter === key;
                return (
                  <button
                    key={key}
                    role="tab"
                    aria-selected={active}
                    onClick={() => setFilter(key)}
                    className={`flex items-center justify-center cursor-pointer gap-1 whitespace-nowrap rounded-lg py-2 text-xs font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] sm:rounded-full sm:px-3.5 sm:py-1.5 sm:text-sm ${
                      active
                        ? "bg-white text-gray-900 shadow-sm sm:bg-gray-900 sm:text-white sm:shadow-none"
                        : "text-gray-600 sm:border sm:border-gray-200 sm:bg-white sm:hover:bg-gray-50"
                    }`}
                  >
                    <span className="sm:hidden">{short}</span>
                    <span className="hidden sm:inline">{label}</span>
                    <span className={active ? "text-gray-400 sm:text-white/60" : "text-gray-400"}>{counts[key]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {visible.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-6 sm:p-10 text-center">
              <p className="font-semibold text-gray-800">{projects.length === 0 ? "No projects yet" : "Nothing matches this filter"}</p>
              <p className="text-sm text-gray-500 mt-1">
                {projects.length === 0 ? "Your team will add work here as soon as it's planned." : "Choose another tab to see your other projects."}
              </p>
            </div>
          ) : (
            visible.map((p) => {
              const open = expanded.has(p.key);
              const due = formatDate(p.dueDate);
              const state = STATE_META[p.state];
              // On phones only surface priority when it needs attention
              const hotPriority = p.priority === "high" || p.priority === "urgent";
              return (
                <article key={p.key} className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                  {/* ---- Collapsed card ----
                      Phone: title, status, progress bar, avatars + due date.
                      sm+:   ring, chips, description, people / due / updated. */}
                  <button
                    onClick={() => toggle(p.key)}
                    aria-expanded={open}
                    className="w-full text-left cursor-pointer p-4 sm:p-6 flex items-start gap-4 hover:bg-gray-50/70 active:bg-gray-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--color-primary)]"
                  >
                    <ProgressRing
                      value={p.progress}
                      className="hidden sm:block h-14 w-14"
                      bar={p.state === "completed" ? "text-emerald-500" : "text-[var(--color-primary)]"}
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-2">
                        <div className="flex min-w-0 max-w-full basis-full sm:basis-auto items-start justify-between gap-3">
                          <h3 className="min-w-0 text-[15px] sm:text-lg font-bold text-gray-900 leading-snug break-words">{p.title}</h3>
                          <ChevronDown size={20} className={`sm:hidden mt-0.5 shrink-0 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} />
                        </div>
                        <Chip className={state.className}>{state.label}</Chip>
                        <span className={hotPriority ? "contents" : "hidden sm:contents"}>
                          <Chip className={PRIORITY_STYLES[p.priority] ?? PRIORITY_STYLES.medium}>
                            {p.priority.charAt(0).toUpperCase() + p.priority.slice(1)} priority
                          </Chip>
                        </span>
                        {p.state === "completed" && (
                          <Chip className={p.approved ? "bg-emerald-50 text-emerald-700" : "bg-violet-50 text-violet-700"}>
                            <ShieldCheck size={12} /> {p.approved ? "Approved by you" : "Ready for your review"}
                          </Chip>
                        )}
                      </div>

                      {p.description && <p className="hidden sm:block text-sm text-gray-500 mt-1.5 line-clamp-2 leading-relaxed">{p.description}</p>}

                      {/* Phone-only progress bar (sm+ shows the ring instead) */}
                      <div className="mt-3 sm:hidden">
                        <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
                          <span>{p.total ? `${p.done} of ${p.total} steps` : "No steps yet"}</span>
                          <span className="font-bold text-gray-800">{p.progress}%</span>
                        </div>
                        <ProgressBar value={p.progress} done={p.state === "completed"} />
                      </div>

                      <div className="mt-3 flex flex-wrap items-center justify-between sm:justify-start gap-x-5 gap-y-2 text-xs sm:text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <div className="flex -space-x-2">
                            {p.lanes.slice(0, 5).map((l) => (
                              <Avatar key={l.task.id} name={l.task.assignedTo.employeeName} image={l.task.assignedTo.EmployeeImage} size={26} />
                            ))}
                            {p.lanes.length > 5 && (
                              <span className="h-[26px] w-[26px] rounded-full bg-gray-100 border border-white text-[10px] font-bold text-gray-600 flex items-center justify-center shrink-0">
                                +{p.lanes.length - 5}
                              </span>
                            )}
                          </div>
                          <span className="hidden sm:inline font-medium">
                            {p.lanes.length} {p.lanes.length === 1 ? "person" : "people"} working on this
                          </span>
                        </div>
                        <span className={`flex items-center gap-1.5 ${p.overdue ? "text-red-600 font-semibold" : ""}`}>
                          <CalendarDays size={14} className={p.overdue ? "text-red-500" : "text-gray-400"} />
                          {due ? (p.overdue ? `Was due ${due}` : `Due ${due}`) : "No deadline"}
                        </span>
                        <span className="hidden sm:flex items-center gap-1.5 text-gray-500">
                          <Clock size={14} className="text-gray-400" /> Updated {timeAgo(p.lastActivity)}
                        </span>
                      </div>
                    </div>

                    <ChevronDown size={20} className={`hidden sm:block mt-1 shrink-0 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} />
                  </button>

                  {/* ---- Expanded panel ----
                      Phone: flat, people separated by dividers (no boxes inside boxes).
                      sm+:   grey panel with a card per person. */}
                  {open && (
                    <div className="border-t border-gray-100 px-4 pb-4 pt-4 sm:bg-gray-50/60 sm:p-6 space-y-4">
                      {p.description && <p className="text-sm sm:hidden text-gray-600 leading-relaxed max-w-prose break-words">{p.description}</p>}

                      <div className="divide-y divide-gray-100 sm:divide-y-0 sm:grid sm:gap-4 md:grid-cols-2">
                        {p.lanes.map((l) => (
                          <div
                            key={l.task.id}
                            className="min-w-0 py-4 first:pt-0 last:pb-0 sm:rounded-xl sm:border sm:border-gray-200 sm:bg-white sm:p-4 sm:first:pt-4 sm:last:pb-4"
                          >
                            <div className="flex items-center gap-3">
                              <Avatar name={l.task.assignedTo.employeeName} image={l.task.assignedTo.EmployeeImage} size={36} />
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-bold text-gray-900 truncate">{l.task.assignedTo.employeeName}</p>
                                <p className="text-xs text-gray-500">
                                  {l.done} of {l.total} steps done
                                </p>
                              </div>
                              <span className="text-sm font-bold text-gray-800">{l.progress}%</span>
                            </div>
                            <div className="mt-3">
                              <ProgressBar value={l.progress} done={l.progress === 100} />
                            </div>

                            <ul className="mt-4 space-y-3">
                              {l.task.subTasks.length === 0 && <li className="text-sm text-gray-500">No steps have been added yet.</li>}
                              {l.task.subTasks.map((s) => {
                                const st = stepStatus(s);
                                const label = stepLabel[st] ?? "Not started";
                                const color = stepColor[st] ?? stepColor.todo;
                                return (
                                  <li key={s.id} className="flex items-start gap-2.5">
                                    <span className="mt-0.5 shrink-0">
                                      <StepIcon status={st} />
                                    </span>
                                    <div className="min-w-0 flex-1">
                                      <p className={`text-sm font-semibold leading-snug break-words ${st === "completed" ? "text-gray-400 line-through" : "text-gray-800"}`}>
                                        {s.title}
                                      </p>
                                      {/* Phone: status sits under the title so the title keeps the full width */}
                                      <p className={`sm:hidden text-xs font-medium mt-0.5 ${color}`}>{label}</p>
                                      {s.description && st !== "completed" && (
                                        <p className="text-xs text-gray-500 mt-0.5 leading-relaxed break-words">{s.description}</p>
                                      )}
                                    </div>
                                    <span className={`hidden sm:block text-xs font-medium whitespace-nowrap ${color}`}>{label}</span>
                                  </li>
                                );
                              })}
                            </ul>
                          </div>
                        ))}
                      </div>

                      {p.lanes.some((l) => l.task.clientFeedback) && (
                        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3.5 sm:p-4 text-sm text-amber-900">
                          <p className="font-semibold mb-1">Your feedback</p>
                          {p.lanes
                            .filter((l) => l.task.clientFeedback)
                            .map((l) => (
                              <p key={l.task.id} className="break-words">
                                {l.task.clientFeedback}
                              </p>
                            ))}
                        </div>
                      )}

                      {/* "Updated" is hidden on the phone card, so it lives here instead */}
                      <p className="sm:hidden flex items-center gap-1.5 text-xs text-gray-400">
                        <Clock size={12} /> Updated {timeAgo(p.lastActivity)}
                      </p>
                    </div>
                  )}
                </article>
              );
            })
          )}
        </section>

        {/* ===================== ACTIVITY / TEAM / CONTACT ===================== */}
        <aside className="min-w-0 space-y-4 sm:space-y-6">
          {/* Recent activity: 3 items on phones, 5 on larger screens */}
          <section className="rounded-2xl border border-gray-200 bg-white shadow-sm p-4 sm:p-5">
            <div className="flex justify-between items-center gap-3 mb-4">
              <h2 className="text-base sm:text-lg font-bold text-gray-900">Recent updates</h2>
              <Link href="/client/updates" className="shrink-0 text-xs font-bold text-[var(--color-primary)] hover:underline transition-colors">
                View all
              </Link>
            </div>

            {recentActivity.length === 0 ? (
              <p className="text-sm text-gray-500">Updates appear here as your team completes steps.</p>
            ) : (
              <ol className="relative space-y-4 border-l border-gray-200 ml-2">
                {recentActivity.map((u, i) => (
                  <li key={u.id} className={`pl-5 relative ${i >= 3 ? "hidden sm:block" : ""}`}>
                    <span
                      className={`absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full ring-4 ring-white ${
                        u.type === "STEP_COMPLETED" ? "bg-emerald-500" : u.type === "STEP_REJECTED" ? "bg-red-500" : "bg-blue-500"
                      }`}
                    />
                    <p className="text-sm text-gray-800 leading-snug break-words">{u.message}</p>
                    <p className="text-xs text-gray-400 mt-0.5 break-words">
                      {u.projectTitle}, {timeAgo(u.createdAt)}
                    </p>
                  </li>
                ))}
              </ol>
            )}
          </section>

          {/* Team: swipeable avatar strip on phones, detailed list on sm+ */}
          <section className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-4 sm:px-5 pt-4 sm:pt-5 pb-3">
              <h2 className="text-base font-bold text-gray-900">Your team</h2>
              <span className="flex items-center gap-1.5 text-sm text-gray-500">
                <Users size={15} /> {data.assignedTeam.length}
              </span>
            </div>

            {data.assignedTeam.length === 0 ? (
              <p className="px-4 sm:px-5 pb-5 text-sm text-gray-500">No one has been assigned yet.</p>
            ) : (
              <>
                {/* Phone strip: tap a person to email them */}
                <ul className="sm:hidden flex gap-3 overflow-x-auto snap-x px-4 pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {data.assignedTeam.map((emp) => {
                    const role = [emp.Designation, emp.Role && emp.Role !== "user" ? emp.Role.replace(/_/g, " ") : null].filter(Boolean)[0];
                    const content = (
                      <>
                        <span className="mx-auto block w-fit">
                          <Avatar name={emp.employeeName} image={emp.EmployeeImage} size={48} />
                        </span>
                        <span className="mt-1.5 block truncate text-xs font-semibold text-gray-900">{emp.employeeName.split(" ")[0]}</span>
                        <span className="block truncate text-[11px] text-gray-500">{role || "Team member"}</span>
                      </>
                    );
                    return (
                      <li key={emp.id} className="w-20 shrink-0 snap-start text-center">
                        {emp.Email ? (
                          <a href={`mailto:${emp.Email}`} aria-label={`Email ${emp.employeeName}`} className="block rounded-xl active:bg-gray-50">
                            {content}
                          </a>
                        ) : (
                          <div>{content}</div>
                        )}
                      </li>
                    );
                  })}
                </ul>

                {/* sm+ list with per-person progress */}
                <ul className="hidden sm:block divide-y divide-gray-100">
                  {data.assignedTeam.map((emp) => {
                    const lanes = projects.flatMap((p) => p.lanes).filter((l) => l.task.assignedToId === emp.id);
                    const done = lanes.reduce((n, l) => n + l.done, 0);
                    const total = lanes.reduce((n, l) => n + l.total, 0);
                    const pct = total ? Math.round((done / total) * 100) : 0;
                    const role = [emp.Designation, emp.Role && emp.Role !== "user" ? emp.Role.replace(/_/g, " ") : null].filter(Boolean).join(", ");
                    return (
                      <li key={emp.id} className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar name={emp.employeeName} image={emp.EmployeeImage} size={40} />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-bold text-gray-900 truncate">{emp.employeeName}</p>
                            <p className="text-xs text-gray-500 truncate">{role || "Team member"}</p>
                          </div>
                          {emp.Email && (
                            <a
                              href={`mailto:${emp.Email}`}
                              title={`Email ${emp.employeeName}`}
                              aria-label={`Email ${emp.employeeName}`}
                              className="h-8 w-8 shrink-0 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center hover:bg-[var(--color-primary)] hover:text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
                            >
                              <Mail size={14} />
                            </a>
                          )}
                        </div>
                        {total > 0 && (
                          <div className="mt-3">
                            <div className="flex justify-between text-xs text-gray-500 mb-1">
                              <span>
                                {lanes.length} {lanes.length === 1 ? "project" : "projects"}
                              </span>
                              <span>
                                {done}/{total} steps
                              </span>
                            </div>
                            <ProgressBar value={pct} />
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </>
            )}
          </section>

          {/* Account manager / support: full-width buttons on phones */}
          <section className="rounded-2xl bg-[var(--color-primary-lighter)] p-4 sm:p-5">
            {data.accountManager ? (
              <>
                <h2 className="text-sm font-bold text-[var(--color-primary-darker)] mb-3">Your account manager</h2>
                <div className="flex items-center gap-3">
                  <Avatar name={data.accountManager.name} image={data.accountManager.AdminImage} size={44} />
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate">{data.accountManager.name}</p>
                    <p className="text-xs text-gray-600">Ask about scope, timelines, or changes.</p>
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  {data.accountManager.email && (
                    <a
                      href={`mailto:${data.accountManager.email}`}
                      className="flex flex-1 sm:flex-none items-center justify-center gap-1.5 rounded-lg bg-white px-3.5 py-2.5 sm:py-2 text-xs font-bold text-gray-800 shadow-sm hover:shadow active:bg-gray-50"
                    >
                      <Mail size={13} /> Email
                    </a>
                  )}
                  {data.accountManager.phone && (
                    <a
                      href={`tel:${data.accountManager.phone}`}
                      className="flex flex-1 sm:flex-none items-center justify-center gap-1.5 rounded-lg bg-white px-3.5 py-2.5 sm:py-2 text-xs font-bold text-gray-800 shadow-sm hover:shadow active:bg-gray-50"
                    >
                      <Phone size={13} /> Call
                    </a>
                  )}
                </div>
              </>
            ) : (
              <>
                <h2 className="text-sm font-bold text-[var(--color-primary-darker)] mb-1">Need help?</h2>
                <p className="text-xs text-gray-600 leading-relaxed mb-3">Have a question about scope or timelines? Write to us and we&apos;ll get back to you.</p>
                <a
                  href="mailto:support@yourcompany.com"
                  className="flex sm:inline-flex items-center justify-center gap-1.5 rounded-lg bg-white px-3.5 py-2.5 sm:py-2 text-xs font-bold text-gray-800 shadow-sm hover:shadow active:bg-gray-50"
                >
                  <Mail size={13} /> Contact support
                </a>
              </>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}
"use client";

import { useEffect, useState } from "react";
import {
  Search,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Plus,
  Trash2,
  Filter,
  XCircle,
  AlertTriangle,
  SlidersHorizontal,
  X,
  ChevronRight,
  ChevronDown,
  ListChecks,
  Briefcase
} from "lucide-react";
import { toast } from "react-toastify";

// --- API IMPORTS ---
import {
  getEmployeeTasks, 
  addSubTask,
  updateSubTaskStatus,
  deleteSubTask,
} from "@/store/task";

import { TaskPriority, TaskStatus } from "@/store/task.interface";

// --- TYPES ---
interface SubTaskItem {
  id: string;
  title: string;
  description?: string | null;
  status: TaskStatus; 
}

interface EmployeeTaskItem {
  id: string;
  title: string;
  description: string;
  priority: TaskPriority;
  dueDate: string | null;
  createdBy: { name: string; role: string };
  // 🚨 ADDED: Client / Project context
  customerId?: string | null;
  customer?: { id: string; customerName: string };
  subTasks: SubTaskItem[];
}

// --- STATIC META / LOOKUPS ---
const STATUS_META: Record<TaskStatus, { label: string; badge: string }> = {
  todo: { label: "To Do", badge: "bg-gray-100 text-gray-600 border-gray-200" },
  in_progress: {
    label: "In Progress",
    badge: "bg-[var(--color-primary-lighter)] text-[var(--color-primary-dark)] border-[var(--color-primary-light)]",
  },
  under_review: { label: "Review", badge: "bg-purple-50 text-purple-700 border-purple-200" },
  completed: { label: "Completed", badge: "bg-emerald-50 text-emerald-700 border-emerald-200" },
};
const STATUS_ORDER: TaskStatus[] = ["todo", "in_progress", "under_review", "completed"];

const PRIORITY_META: Record<TaskPriority, { label: string; text: string; accent: string }> = {
  low: { label: "Low", text: "text-gray-500", accent: "bg-gray-300" },
  medium: { label: "Medium", text: "text-[var(--color-primary)]", accent: "bg-[var(--color-primary)]" },
  high: { label: "High", text: "text-orange-500", accent: "bg-orange-400" },
  urgent: { label: "Urgent", text: "text-[var(--color-destructive)]", accent: "bg-[var(--color-destructive)]" },
};
const PRIORITY_ORDER: TaskPriority[] = ["low", "medium", "high", "urgent"];
const PRIORITY_FILTER_OPTIONS: (TaskPriority | "all")[] = ["all", ...PRIORITY_ORDER];

const DATE_FILTER_OPTIONS: ("all" | "overdue" | "today" | "upcoming")[] = [
  "all",
  "overdue",
  "today",
  "upcoming",
];
const DATE_FILTER_LABELS: Record<string, string> = {
  all: "Any date",
  overdue: "Overdue",
  today: "Due today",
  upcoming: "Upcoming",
};

function priorityFilterLabel(v: TaskPriority | "all") {
  return v === "all" ? "All priorities" : PRIORITY_META[v].label;
}

// Subtask Progress Calculation (100% if all subtasks are completed)
function subTaskProgress(task: EmployeeTaskItem) {
  if (!task.subTasks || task.subTasks.length === 0) return 0;
  const completed = task.subTasks.filter((s) => s.status === 'completed').length;
  return Math.round((completed / task.subTasks.length) * 100);
}

function isOverdue(task: EmployeeTaskItem) {
  return !!task.dueDate && new Date(task.dueDate) < new Date() && subTaskProgress(task) < 100;
}

// --- SMALL PRESENTATIONAL PIECES ---
function StatusBadge({ status }: { status: TaskStatus }) {
  const meta = STATUS_META[status];
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] tracking-wider uppercase font-bold border ${meta.badge}`}>
      {meta.label}
    </span>
  );
}

function PriorityTag({ priority }: { priority: TaskPriority }) {
  const meta = PRIORITY_META[priority];
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide ${meta.text}`}>
      <AlertCircle size={11} /> {meta.label}
    </span>
  );
}

function ProgressRing({ percent, size = 34 }: { percent: number; size?: number }) {
  const strokeWidth = 3.5;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - percent / 100);
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" strokeWidth={strokeWidth} className="text-gray-100" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="text-[var(--color-primary)] transition-[stroke-dashoffset] duration-500"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[9px] font-extrabold text-gray-600">
        {percent}%
      </span>
    </div>
  );
}

function ProgressBar({ percent }: { percent: number }) {
  return (
    <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
      <div
        className="bg-[var(--color-primary)] h-1.5 rounded-full transition-all duration-500 ease-out"
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 pl-2.5 pr-1.5 py-1 rounded-full bg-[var(--color-primary-lighter)] text-[var(--color-primary-dark)] text-[11px] font-bold border border-[var(--color-primary-light)]">
      {label}
      <button onClick={onRemove} className="hover:bg-white/60 rounded-full p-0.5 transition-colors cursor-pointer" aria-label={`Remove ${label} filter`}>
        <X size={11} />
      </button>
    </span>
  );
}

function OptionPill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-2.5 rounded-xl text-xs font-bold border transition-all text-center cursor-pointer ${
        active
          ? "bg-[var(--color-primary)] border-[var(--color-primary)] text-white shadow-sm"
          : "bg-gray-50 border-gray-200 text-gray-600 hover:border-[var(--color-primary-light)]"
      }`}
    >
      {children}
    </button>
  );
}

export default function EmployeeTasksPage() {
  const [tasks, setTasks] = useState<EmployeeTaskItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // UI State
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [newSubTaskTitles, setNewSubTaskTitles] = useState<Record<string, string>>({});
  const [newSubTaskDescriptions, setNewSubTaskDescriptions] = useState<Record<string, string>>({});
  const [showAddDescription, setShowAddDescription] = useState(false);
  const [expandedSubtaskIds, setExpandedSubtaskIds] = useState<Set<string>>(new Set());
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  // Detail Modal Internal Subtask Filter
  const [viewSubtaskFilter, setViewSubtaskFilter] = useState<TaskStatus | "all">("all");

  // Delete Subtask Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [subTaskToDelete, setSubTaskToDelete] = useState<{ taskId: string; subTaskId: string } | null>(null);

  // Advanced Filters State (Server-Side)
  const [searchQuery, setSearchQuery] = useState("");
  const [filterPriority, setFilterPriority] = useState<TaskPriority | "all">("all");
  const [filterDate, setFilterDate] = useState<"all" | "overdue" | "today" | "upcoming">("all");
  const [filterExactDate, setFilterExactDate] = useState<string>("");

  const selectedTask = tasks.find((t) => t.id === selectedTaskId) || null;
  const activeFilterCount = [filterPriority !== "all", filterDate !== "all", !!filterExactDate].filter(Boolean).length;

  // --- SERVER-SIDE FETCHING ---
  const fetchFilteredTasks = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.append("search", searchQuery.trim());
      if (filterPriority !== "all") params.append("priority", filterPriority);
      if (filterDate !== "all") params.append("date", filterDate);
      if (filterExactDate) params.append("exactDate", filterExactDate);

      const res = await getEmployeeTasks(params.toString());
      if (res?.success) {
        setTasks((res.data as EmployeeTaskItem[]) || []);
      }
    } catch (error) {
      toast.error("Failed to load tasks");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchFilteredTasks();
    }, 400);
    return () => clearTimeout(timeoutId);
  }, [searchQuery, filterPriority, filterDate, filterExactDate]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!(e.target as Element).closest(".custom-dropdown-container")) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (isDeleteModalOpen) {
        setIsDeleteModalOpen(false);
        setSubTaskToDelete(null);
      } else if (selectedTaskId) {
        setSelectedTaskId(null);
      } else if (openDropdown === "filters") {
        setOpenDropdown(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isDeleteModalOpen, selectedTaskId, openDropdown]);

  useEffect(() => {
    const anyOpen = isDeleteModalOpen || !!selectedTaskId || openDropdown === "filters";
    document.body.style.overflow = anyOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isDeleteModalOpen, selectedTaskId, openDropdown]);

  useEffect(() => {
    setShowAddDescription(false);
    setViewSubtaskFilter("all"); 
  }, [selectedTaskId]);

  const toggleSubtaskExpanded = (id: string) => {
    setExpandedSubtaskIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const clearFilters = () => {
    setSearchQuery("");
    setFilterPriority("all");
    setFilterDate("all");
    setFilterExactDate("");
  };


  // --- HANDLERS (Subtasks) ---
  const handleAddSubTask = async (e: React.FormEvent, taskId: string) => {
    e.preventDefault();
    const title = newSubTaskTitles[taskId]?.trim();
    if (!title) return;
    const description = newSubTaskDescriptions[taskId]?.trim();

    try {
      const res = await addSubTask({ taskId, title, ...(description ? { description } : {}) });
      if (res?.success) {
        setNewSubTaskTitles((prev) => ({ ...prev, [taskId]: "" }));
        setNewSubTaskDescriptions((prev) => ({ ...prev, [taskId]: "" }));
        setShowAddDescription(false);
        fetchFilteredTasks();
      }
    } catch (error) {
      toast.error("Failed to add subtask");
    }
  };

  const handleSubTaskStatusChange = async (taskId: string, subTaskId: string, newStatus: TaskStatus) => {
    setOpenDropdown(null);
    // Optimistic UI update
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== taskId) return t;
        return {
          ...t,
          subTasks: t.subTasks.map((st) => (st.id === subTaskId ? { ...st, status: newStatus } : st)),
        };
      })
    );

    try {
      const res = await updateSubTaskStatus(subTaskId, { status: newStatus });
      if (!res?.success) throw new Error();
    } catch (error) {
      toast.error("Failed to update subtask status");
      fetchFilteredTasks(); // Revert on failure
    }
  };

  const confirmDeleteSubTask = (taskId: string, subTaskId: string) => {
    setSubTaskToDelete({ taskId, subTaskId });
    setIsDeleteModalOpen(true);
  };

  const executeDeleteSubTask = async () => {
    if (!subTaskToDelete) return;
    const { taskId, subTaskId } = subTaskToDelete;

    // Optimistic UI update
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== taskId) return t;
        return { ...t, subTasks: t.subTasks.filter((st) => st.id !== subTaskId) };
      })
    );

    try {
      const res = await deleteSubTask(subTaskId);
      if (!res?.success) throw new Error();
      toast.success("Subtask deleted");
    } catch (error) {
      toast.error("Failed to delete subtask");
      fetchFilteredTasks(); // Revert on failure
    } finally {
      setIsDeleteModalOpen(false);
      setSubTaskToDelete(null);
    }
  };

  // --- DERIVED STATS ---
  const stats = [
    { key: "total", label: "Total", value: tasks.length, className: "text-gray-700 bg-gray-50 border-gray-200" },
    {
      key: "in_progress",
      label: "In progress",
      value: tasks.filter((t) => subTaskProgress(t) > 0 && subTaskProgress(t) < 100).length,
      className: "text-[var(--color-primary-dark)] bg-[var(--color-primary-lighter)] border-[var(--color-primary-light)]",
    },
    {
      key: "review",
      label: "Review",
      value: tasks.filter((t) => t.subTasks.some(st => st.status === 'under_review')).length,
      className: "text-purple-700 bg-purple-50 border-purple-200",
    },
    { key: "overdue", label: "Overdue", value: tasks.filter(isOverdue).length, className: "text-[var(--color-destructive)] bg-red-50 border-red-200" },
    {
      key: "completed",
      label: "Completed",
      value: tasks.filter((t) => t.subTasks.length > 0 && subTaskProgress(t) === 100).length,
      className: "text-emerald-700 bg-emerald-50 border-emerald-200",
    },
  ];

  return (
    <div className="p-3 sm:p-6 max-w-[90rem] mx-auto min-h-screen bg-gray-50/50">
      {/* HEADER */}
      <div className="mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900">My Workspace</h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-1">Manage your assigned tasks and update your progress.</p>
      </div>

      {/* STATS ROW */}
      <div className="flex gap-2 overflow-x-auto -mx-3 px-3 sm:mx-0 sm:px-0 sm:flex-wrap pb-1 mb-3 sm:mb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {stats.map((s) => (
          <div key={s.key} className={`shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-xl border ${s.className}`}>
            <span className="text-base font-extrabold leading-none">{s.value}</span>
            <span className="text-[11px] font-bold opacity-80 whitespace-nowrap">{s.label}</span>
          </div>
        ))}
      </div>

      {/* SEARCH + FILTERS */}
      <div className="bg-white p-3 sm:p-4 rounded-2xl shadow-sm border border-gray-200 mb-3 sm:mb-4">
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          {/* Search */}
          <div className="flex-1 relative sm:max-w-xs xl:max-w-sm">
            <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-primary)]" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] outline-none text-sm transition-all bg-gray-50/50 focus:bg-white cursor-text"
            />
          </div>

          {/* MOBILE: Filters bottom sheet */}
          <div className="sm:hidden relative custom-dropdown-container">
            <button
              type="button"
              onClick={() => setOpenDropdown(openDropdown === "filters" ? null : "filters")}
              className={`relative flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border text-sm font-bold transition-all cursor-pointer ${
                openDropdown === "filters"
                  ? "border-[var(--color-primary)] text-[var(--color-primary)] bg-[var(--color-primary-lighter)]"
                  : "border-gray-200 text-gray-600 bg-white hover:border-[var(--color-primary-light)]"
              }`}
            >
              <SlidersHorizontal size={16} />
              <span>Filters</span>
              {activeFilterCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex items-center justify-center h-[18px] min-w-[18px] px-1 rounded-full bg-[var(--color-destructive)] text-white text-[10px] font-extrabold">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {openDropdown === "filters" && (
              <>
                <div className="fixed inset-0 z-40 bg-gray-900/40" onClick={() => setOpenDropdown(null)} />
                <div className="fixed z-50 inset-x-0 bottom-0 bg-white rounded-t-3xl border border-gray-200 shadow-2xl max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom fade-in duration-200">
                  <div className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-gray-200" />

                  <div className="sticky top-0 bg-white flex items-center justify-between px-5 pt-4 pb-3 z-10">
                    <h3 className="text-sm font-extrabold text-gray-900 flex items-center gap-2">
                      <Filter size={15} className="text-[var(--color-primary)]" /> Filter tasks
                    </h3>
                    <button onClick={() => setOpenDropdown(null)} className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 cursor-pointer">
                      <X size={16} />
                    </button>
                  </div>

                  <div className="px-5 pb-5 space-y-5">
                    <div>
                      <p className="text-xs font-bold text-gray-400 mb-2">Priority</p>
                      <div className="grid grid-cols-2 gap-2">
                        {PRIORITY_FILTER_OPTIONS.map((p) => (
                          <OptionPill key={p} active={filterPriority === p} onClick={() => setFilterPriority(p)}>
                            {priorityFilterLabel(p)}
                          </OptionPill>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="text-xs font-bold text-gray-400 mb-2">Due date</p>
                      <div className="grid grid-cols-2 gap-2">
                        {DATE_FILTER_OPTIONS.map((d) => (
                          <OptionPill
                            key={d}
                            active={filterDate === d}
                            onClick={() => {
                              setFilterDate(d);
                              if (d !== "all") setFilterExactDate("");
                            }}
                          >
                            {DATE_FILTER_LABELS[d]}
                          </OptionPill>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="text-xs font-bold text-gray-400 mb-2">Or pick an exact date</p>
                      <input
                        type="date"
                        value={filterExactDate}
                        onChange={(e) => {
                          setFilterExactDate(e.target.value);
                          if (e.target.value) setFilterDate("all");
                        }}
                        className={`w-full px-3 py-2.5 rounded-xl border text-sm font-medium outline-none cursor-pointer bg-white transition-all ${
                          filterExactDate
                            ? "border-[var(--color-primary)] text-[var(--color-primary)] ring-1 ring-[var(--color-primary-light)]"
                            : "border-gray-200 text-gray-600 focus:border-[var(--color-primary)]"
                        }`}
                      />
                    </div>
                  </div>

                  <div className="sticky bottom-0 bg-white border-t border-gray-100 px-5 py-3 flex items-center justify-between gap-3">
                    <button onClick={clearFilters} className="flex items-center gap-1 text-sm font-bold text-gray-500 hover:text-[var(--color-destructive)] cursor-pointer">
                      <XCircle size={14} /> Clear all
                    </button>
                    <button
                      onClick={() => setOpenDropdown(null)}
                      className="px-5 py-2.5 rounded-xl bg-[var(--color-primary)] text-white text-sm font-bold hover:opacity-90 transition-opacity cursor-pointer"
                    >
                      Done
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* DESKTOP: Filters */}
          <div className="hidden sm:flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-1.5 text-xs font-bold text-gray-400 pr-1">
              <Filter size={13} /> Filters
            </span>

            {/* Priority dropdown */}
            <div className="relative custom-dropdown-container">
              <button
                type="button"
                onClick={() => setOpenDropdown(openDropdown === "filter-priority" ? null : "filter-priority")}
                className={`w-32 px-3 py-2.5 rounded-xl border flex items-center justify-between bg-white transition-all cursor-pointer ${
                  openDropdown === "filter-priority"
                    ? "border-[var(--color-primary)] ring-1 ring-[var(--color-primary-light)]"
                    : "border-gray-200 hover:border-[var(--color-primary-light)]"
                }`}
              >
                <span className="text-sm font-medium text-gray-700 truncate">{priorityFilterLabel(filterPriority)}</span>
                <ChevronDown
                  size={14}
                  className={`text-gray-400 shrink-0 transition-transform ${openDropdown === "filter-priority" ? "rotate-180 text-[var(--color-primary)]" : ""}`}
                />
              </button>
              {openDropdown === "filter-priority" && (
                <div className="absolute z-40 w-36 mt-2 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden p-1 animate-in fade-in slide-in-from-top-2 duration-150">
                  {PRIORITY_FILTER_OPTIONS.map((p) => (
                    <div
                      key={p}
                      onClick={() => {
                        setFilterPriority(p);
                        setOpenDropdown(null);
                      }}
                      className={`px-3 py-2 text-sm rounded-lg cursor-pointer transition-colors ${
                        filterPriority === p ? "bg-[var(--color-primary-lighter)] text-[var(--color-primary-dark)] font-bold" : "hover:bg-gray-50 text-gray-700"
                      }`}
                    >
                      {priorityFilterLabel(p)}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Due date dropdown */}
            <div className="relative custom-dropdown-container">
              <button
                type="button"
                onClick={() => setOpenDropdown(openDropdown === "filter-date" ? null : "filter-date")}
                className={`w-32 px-3 py-2.5 rounded-xl border flex items-center justify-between bg-white transition-all cursor-pointer ${
                  openDropdown === "filter-date"
                    ? "border-[var(--color-primary)] ring-1 ring-[var(--color-primary-light)]"
                    : "border-gray-200 hover:border-[var(--color-primary-light)]"
                }`}
              >
                <span className="text-sm font-medium text-gray-700 truncate">{DATE_FILTER_LABELS[filterDate]}</span>
                <ChevronDown
                  size={14}
                  className={`text-gray-400 shrink-0 transition-transform ${openDropdown === "filter-date" ? "rotate-180 text-[var(--color-primary)]" : ""}`}
                />
              </button>
              {openDropdown === "filter-date" && (
                <div className="absolute z-40 w-36 mt-2 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden p-1 animate-in fade-in slide-in-from-top-2 duration-150">
                  {DATE_FILTER_OPTIONS.map((d) => (
                    <div
                      key={d}
                      onClick={() => {
                        setFilterDate(d);
                        if (d !== "all") setFilterExactDate("");
                        setOpenDropdown(null);
                      }}
                      className={`px-3 py-2 text-sm rounded-lg cursor-pointer transition-colors ${
                        filterDate === d ? "bg-[var(--color-primary-lighter)] text-[var(--color-primary-dark)] font-bold" : "hover:bg-gray-50 text-gray-700"
                      }`}
                    >
                      {DATE_FILTER_LABELS[d]}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Exact calendar date */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-gray-400">OR</span>
              <input
                type="date"
                value={filterExactDate}
                onChange={(e) => {
                  setFilterExactDate(e.target.value);
                  if (e.target.value) setFilterDate("all");
                }}
                title="Filter by exact calendar date"
                className={`w-36 px-3 py-2.5 rounded-xl border text-sm font-medium outline-none cursor-pointer bg-white transition-all ${
                  filterExactDate
                    ? "border-[var(--color-primary)] text-[var(--color-primary)] ring-1 ring-[var(--color-primary-light)]"
                    : "border-gray-200 text-gray-600 focus:border-[var(--color-primary)]"
                }`}
              />
            </div>

            {activeFilterCount > 0 && (
              <button
                onClick={clearFilters}
                className="flex items-center justify-center cursor-pointer gap-1.5 px-3 py-2.5 text-sm font-bold text-gray-500 hover:text-[var(--color-destructive)] bg-gray-100 hover:bg-red-50 rounded-xl transition-all"
              >
                <XCircle size={15} /> Clear
              </button>
            )}
          </div>
        </div>

        {/* Active filter chips — mobile only */}
        {activeFilterCount > 0 && (
          <div className="sm:hidden flex flex-wrap items-center gap-1.5 mt-3 pt-3 border-t border-gray-100">
            {filterPriority !== "all" && <FilterChip label={PRIORITY_META[filterPriority].label} onRemove={() => setFilterPriority("all")} />}
            {filterDate !== "all" && <FilterChip label={DATE_FILTER_LABELS[filterDate]} onRemove={() => setFilterDate("all")} />}
            {filterExactDate && <FilterChip label={new Date(filterExactDate).toLocaleDateString()} onRemove={() => setFilterExactDate("")} />}
            <button onClick={clearFilters} className="text-[11px] font-bold text-gray-400 hover:text-[var(--color-destructive)] px-1.5 py-1 cursor-pointer">
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* TASK LIST */}
      {isLoading ? (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-2.5 sm:gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-2xl p-3.5 sm:p-4 flex items-center gap-3 animate-pulse">
              <div className="w-1 self-stretch rounded-full bg-gray-100" />
              <div className="flex-1 space-y-2 py-1">
                <div className="h-3 w-20 bg-gray-100 rounded-full" />
                <div className="h-4 w-3/4 bg-gray-100 rounded" />
                <div className="h-3 w-1/2 bg-gray-100 rounded" />
              </div>
              <div className="w-8 h-8 rounded-full bg-gray-100 shrink-0" />
            </div>
          ))}
        </div>
      ) : tasks.length === 0 ? (
        <div className="bg-white rounded-3xl border border-gray-100 p-10 sm:p-12 text-center shadow-sm">
          <CheckCircle2 size={44} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-bold text-gray-900">You're all caught up!</h3>
          <p className="text-gray-500 text-sm mt-1">No tasks match your current filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-2.5 sm:gap-3">
          {tasks.map((task) => {
            const totalSubTasks = task.subTasks.length;
            const completedSubTasks = task.subTasks.filter((st) => st.status === 'completed').length;
            const progress = totalSubTasks === 0 ? 0 : subTaskProgress(task);
            const overdue = isOverdue(task);

            return (
              <button
                key={task.id}
                type="button"
                onClick={() => setSelectedTaskId(task.id)}
                className="text-left bg-white border border-gray-200 rounded-2xl p-3.5 sm:p-4 shadow-sm hover:shadow-md hover:border-[var(--color-primary-light)] transition-all flex items-center gap-3 cursor-pointer"
              >
                <span className={`w-1 self-stretch rounded-full ${PRIORITY_META[task.priority].accent} shrink-0`} />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <PriorityTag priority={task.priority} />
                    
                    {/* 🚨 ADDED: Client / Project Pill */}
                    {task.customer && (
                      <span className="flex items-center gap-1 text-[10px] font-bold bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded-md border border-indigo-100">
                        <Briefcase size={10} /> {task.customer.customerName}
                      </span>
                    )}
                  </div>
                  
                  <h3 className="text-[15px] sm:text-base font-bold text-gray-900 truncate">{task.title}</h3>
                  
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-[11px] font-medium text-gray-500">
                    <span className={`flex items-center gap-1 ${overdue ? "text-[var(--color-destructive)]" : ""}`}>
                      <Calendar size={12} /> {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "No deadline"}
                    </span>
                    <span>By {task.createdBy.name}</span>
                    {totalSubTasks > 0 && (
                      <span className="flex items-center gap-1">
                        <ListChecks size={12} /> {completedSubTasks}/{totalSubTasks} steps
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {totalSubTasks > 0 ? (
                    <ProgressRing percent={progress} />
                  ) : (
                    <span className="text-[10px] font-bold text-gray-300 px-2 py-1 border border-dashed border-gray-200 rounded-lg whitespace-nowrap">
                      No steps
                    </span>
                  )}
                  <ChevronRight size={18} className="text-gray-300" />
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* ========================================================= */}
      {/* TASK DETAIL SHEET (bottom sheet on mobile, modal on desktop) */}
      {/* ========================================================= */}
      {selectedTask && (() => {
        const displayedSubtasks = selectedTask.subTasks.filter(st => viewSubtaskFilter === "all" || st.status === viewSubtaskFilter);

        return (
          <div
            className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-gray-900/50 backdrop-blur-sm"
            onClick={(e) => {
              if (e.target === e.currentTarget) setSelectedTaskId(null);
            }}
          >
            <div className="bg-white w-full sm:max-w-xl rounded-t-3xl sm:rounded-3xl max-h-[92vh] sm:max-h-[85vh] flex flex-col shadow-2xl animate-in slide-in-from-bottom sm:zoom-in-95 fade-in duration-200">
              <div className="sm:hidden mx-auto mt-3 h-1.5 w-12 rounded-full bg-gray-200 shrink-0" />

              <div className="flex items-start justify-between gap-3 px-5 pt-3 sm:pt-5 pb-4 border-b border-gray-100 shrink-0">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <PriorityTag priority={selectedTask.priority} />
                    
                    {/* 🚨 ADDED: Client / Project Pill in Details */}
                    {selectedTask.customer && (
                      <span className="flex items-center gap-1 text-[10px] font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md border border-indigo-100">
                        <Briefcase size={12} /> {selectedTask.customer.customerName}
                      </span>
                    )}
                  </div>
                  <h2 className="text-lg font-extrabold text-gray-900 leading-snug">{selectedTask.title}</h2>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-xs font-medium text-gray-500">
                    <span className={`flex items-center gap-1 ${isOverdue(selectedTask) ? "text-[var(--color-destructive)]" : ""}`}>
                      <Calendar size={13} /> {selectedTask.dueDate ? new Date(selectedTask.dueDate).toLocaleDateString() : "No deadline"}
                    </span>
                    <span>Assigned by {selectedTask.createdBy.name}</span>
                  </div>
                </div>
                <button onClick={() => setSelectedTaskId(null)} className="p-2 rounded-full hover:bg-gray-100 text-gray-400 shrink-0 cursor-pointer">
                  <X size={18} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6 pb-32">
                
                {selectedTask.description && (
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Instructions</p>
                    <p className="text-sm text-gray-700 bg-gray-50 p-3.5 rounded-xl border border-gray-100 leading-relaxed whitespace-pre-wrap">
                      {selectedTask.description}
                    </p>
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Checklist</p>
                      {selectedTask.subTasks.length > 0 && (
                        <span className="text-[10px] font-bold bg-[var(--color-primary-lighter)] text-[var(--color-primary-dark)] px-2 py-0.5 rounded-full">
                          {subTaskProgress(selectedTask)}%
                        </span>
                      )}
                    </div>

                    {/* INTERNAL SUBTASK FILTER PILLS */}
                    <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg overflow-x-auto custom-scrollbar">
                      {["all", "todo", "in_progress", "under_review", "completed"].map(s => (
                        <button
                          key={s}
                          onClick={() => setViewSubtaskFilter(s as any)}
                          className={`px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md transition-colors whitespace-nowrap ${viewSubtaskFilter === s ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                          {s.replace("_", " ")}
                        </button>
                      ))}
                    </div>
                  </div>

                  {selectedTask.subTasks.length > 0 && (
                    <div className="mb-3">
                      <ProgressBar percent={subTaskProgress(selectedTask)} />
                    </div>
                  )}

                  <div className="space-y-2">
                    {displayedSubtasks.length === 0 ? (
                      <p className="text-sm text-gray-400 italic py-2">No subtasks match your filter.</p>
                    ) : (
                      displayedSubtasks.map((sub) => {
                        const isLongDescription = (sub.description?.length || 0) > 90;
                        const isExpanded = expandedSubtaskIds.has(sub.id);
                        return (
                          <div key={sub.id} className="group bg-white border border-gray-200 rounded-xl hover:border-[var(--color-primary-light)] transition-all relative">
                            <div className="flex items-start justify-between p-3 gap-2">
                              
                              <div className="flex-1 min-w-0 flex items-start gap-2 pt-0.5">
                                <span className={`text-sm select-none transition-all truncate ${sub.status === 'completed' ? "text-gray-400 line-through" : "text-gray-700 font-medium"}`}>
                                  {sub.title}
                                </span>
                              </div>

                              {/* Interactive Status Dropdown for Subtasks */}
                              <div className="relative custom-dropdown-container shrink-0 flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => setOpenDropdown(openDropdown === `status-${sub.id}` ? null : `status-${sub.id}`)}
                                  className="flex items-center gap-1 hover:bg-gray-50 rounded-lg p-1 transition-colors cursor-pointer"
                                >
                                  <StatusBadge status={sub.status} />
                                  <ChevronDown size={14} className="text-gray-400" />
                                </button>
                                
                                {openDropdown === `status-${sub.id}` && (
                                  <div className="absolute right-0 top-full mt-1 z-50 w-36 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden p-1 animate-in fade-in zoom-in-95 duration-150">
                                    {STATUS_ORDER.map((s) => (
                                      <button
                                        key={s}
                                        type="button"
                                        onClick={() => handleSubTaskStatusChange(selectedTask.id, sub.id, s)}
                                        className={`w-full text-left px-2 py-1.5 rounded-lg transition-colors cursor-pointer ${sub.status === s ? "bg-[var(--color-primary-lighter)]" : "hover:bg-gray-50"}`}
                                      >
                                        <StatusBadge status={s} />
                                      </button>
                                    ))}
                                  </div>
                                )}
                                
                                <button
                                  type="button"
                                  onClick={() => confirmDeleteSubTask(selectedTask.id, sub.id)}
                                  className="text-gray-300 hover:text-[var(--color-destructive)] p-1 shrink-0 cursor-pointer transition-all ml-1"
                                  title="Delete step"
                                >
                                  <Trash2 size={15} />
                                </button>
                              </div>
                            </div>

                            {sub.description && (
                              <div className="px-3 pb-3 -mt-1">
                                <p className={`text-xs text-gray-500 leading-relaxed whitespace-pre-wrap bg-gray-50 p-2 rounded-lg border border-gray-100 ${isExpanded ? "" : "line-clamp-2"}`}>
                                  {sub.description}
                                </p>
                                {isLongDescription && (
                                  <button
                                    type="button"
                                    onClick={() => toggleSubtaskExpanded(sub.id)}
                                    className="text-[11px] font-bold text-[var(--color-primary)] mt-1 cursor-pointer"
                                  >
                                    {isExpanded ? "Show less" : "Show more"}
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                <form onSubmit={(e) => handleAddSubTask(e, selectedTask.id)} className="shrink-0 border-t border-gray-100 pt-4 mt-2 space-y-2 bg-white">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Add a new step..."
                      value={newSubTaskTitles[selectedTask.id] || ""}
                      onChange={(e) => setNewSubTaskTitles((prev) => ({ ...prev, [selectedTask.id]: e.target.value }))}
                      className="flex-1 px-4 py-2.5 text-sm rounded-xl border border-gray-200 focus:border-[var(--color-primary)] outline-none bg-gray-50 focus:bg-white transition-all focus:ring-1 focus:ring-[var(--color-primary)] cursor-text"
                    />
                    <button
                      type="submit"
                      disabled={!newSubTaskTitles[selectedTask.id]?.trim()}
                      className="flex items-center justify-center w-11 h-11 bg-[var(--color-primary)] text-white font-bold rounded-xl cursor-pointer hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                      aria-label="Add step"
                    >
                      <Plus size={18} />
                    </button>
                  </div>

                  {showAddDescription ? (
                    <textarea
                      placeholder="Add optional details for this step..."
                      value={newSubTaskDescriptions[selectedTask.id] || ""}
                      onChange={(e) => setNewSubTaskDescriptions((prev) => ({ ...prev, [selectedTask.id]: e.target.value }))}
                      rows={2}
                      className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 focus:border-[var(--color-primary)] outline-none bg-gray-50 focus:bg-white transition-all focus:ring-1 focus:ring-[var(--color-primary)] resize-none cursor-text"
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowAddDescription(true)}
                      className="text-xs font-bold text-gray-400 hover:text-[var(--color-primary)] cursor-pointer"
                    >
                      + Add description (optional)
                    </button>
                  )}
                </form>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ========================================================= */}
      {/* DELETE CONFIRMATION MODAL (SUBTASK)                       */}
      {/* ========================================================= */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 text-center flex flex-col items-center">
            <div className="w-14 h-14 bg-[var(--color-destructive)]/10 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle size={28} className="text-[var(--color-destructive)]" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Step?</h3>
            <p className="text-sm text-gray-500 mb-6">Are you sure you want to delete this step? This action cannot be undone.</p>
            <div className="flex w-full gap-3">
              <button
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setSubTaskToDelete(null);
                }}
                className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-sm cursor-pointer rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={executeDeleteSubTask}
                className="flex-1 py-2.5 bg-[var(--color-destructive)] hover:bg-red-600 text-white font-bold text-sm cursor-pointer rounded-xl shadow-md transition-colors"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
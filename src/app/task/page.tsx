"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Plus,
  Trash2,
  Search,
  Edit,
  Calendar,
  AlertCircle,
  CheckCircle2,
  X,
  UserCircle,
  ChevronDown,
  Eye,
  Filter,
  CheckSquare,
  Square,
  AlertTriangle,
  Activity,
  XCircle,
  Sparkles,
  MinusCircle,
  Loader2,
  Users,
  ArrowLeft,
  SendHorizontal,
  Lightbulb,
  Target,
  ListChecks,
  UserPlus,
  Check,
  User,
  Briefcase
} from "lucide-react";
import { toast } from "react-toastify";

// --- API IMPORTS ---
import {
  getFilteredAdminTasks,
  addAdminTask,
  updateAdminTask,
  deleteAdminTasks,
  generateSubtasksAI,
  assignAdminTaskViaAI
} from "@/store/task";

import { getFilteredEmployee } from "@/store/attendance/attendance";
import { getFilteredCustomer } from "@/store/customer";

import {
  AdminUpdateTaskPayload,
  GeneratedSubtask,
  TaskPriority,
  TaskStatus
} from "@/store/task.interface";

import EmployeeViewDialog from "../component/popups/EmployeeViewDialog";
import CustomerViewDialog from "../component/popups/CustomerviewDialog";

// --- TYPES ---
interface EmployeeItem {
  id?: string;
  _id?: string;
  employeeName: string;
  Email: string;
}

interface ClientItem {
  id: string;
  _id?: string;
  customerName: string;
}

interface SubTaskItem {
  id: string;
  title: string;
  description?: string | null;
  status: TaskStatus;
}

interface TaskItem {
  id: string;
  title: string;
  description: string;
  priority: TaskPriority;
  dueDate: string | null;
  assignedToId: string;
  assignedTo?: EmployeeItem;
  customerId?: string | null;
  customer?: { customerName: string; id: string };
  _count?: { subTasks: number };
  subTasks: SubTaskItem[];
}

interface TaskGroup {
  key: string;
  title: string;
  description: string;
  priority: TaskPriority;
  dueDate: string | null;
  customerId: string | null;
  customerName?: string;
  tasks: TaskItem[];
}

const normalizeStr = (value?: string | null) => (value || "").trim().toLowerCase().replace(/\s+/g, " ");

interface AiSummaryStructured {
  overview: string;
  rationale?: string[];
  highlights?: string[];
  objectives?: string[];
}
type AiSummaryLegacy = string;
type AiSummary = AiSummaryStructured | AiSummaryLegacy;

const isStructuredSummary = (s: AiSummary): s is AiSummaryStructured =>
  typeof s === "object" && s !== null;

const normalizeAiSummary = (raw: AiSummary): AiSummaryStructured => {
  if (isStructuredSummary(raw)) {
    return {
      overview: raw.overview || "",
      rationale: raw.rationale || [],
      highlights: raw.highlights || [],
      objectives: raw.objectives || [],
    };
  }
  const text = (raw || "").trim();
  if (text.startsWith("{")) {
    try {
      const parsed = JSON.parse(text);
      return normalizeAiSummary(parsed);
    } catch { }
  }
  const lines = text.split(/\n+/).map(l => l.replace(/^[-•\s]+/, "").trim()).filter(Boolean);
  return {
    overview: lines[0] || "Task assigned successfully.",
    rationale: lines.slice(1),
    highlights: [],
    objectives: [],
  };
};

export default function AdminTasksPage() {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [employees, setEmployees] = useState<EmployeeItem[]>([]);
  const [clients, setClients] = useState<ClientItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewTaskData, setViewTaskData] = useState<TaskItem | null>(null);
  const [viewSubtaskFilter, setViewSubtaskFilter] = useState<TaskStatus | "all">("all");

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);

  const [isViewOpen, setIsViewOpen] = useState(false);
  const [employeeToView, setEmployeeToView] = useState<any>(null);

  const [isCustomerViewOpen, setIsCustomerViewOpen] = useState(false);
  const [customerToView, setCustomerToView] = useState<any>(null);

  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [formSubTasks, setFormSubTasks] = useState<GeneratedSubtask[]>([]);

  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiAssignedToIds, setAiAssignedToIds] = useState<string[]>([]);
  const [aiSelectedClient, setAiSelectedClient] = useState<string | null>(null);
  const [isAIAssigning, setIsAIAssigning] = useState(false);
  const [aiEmpSearch, setAiEmpSearch] = useState("");
  const [aiResponseSummary, setAiResponseSummary] = useState<AiSummary | null>(null);
  const [isAiPickerOpen, setIsAiPickerOpen] = useState(false);
  const aiTextareaRef = useRef<HTMLTextAreaElement | null>(null);

  // 🚨 NEW: ASSIGN MORE MODAL STATE
  const [isAssignMoreOpen, setIsAssignMoreOpen] = useState(false);
  const [assignMoreGroup, setAssignMoreGroup] = useState<TaskGroup | null>(null);
  const [assignMoreSelectedIds, setAssignMoreSelectedIds] = useState<string[]>([]);
  const [assignMoreSearch, setAssignMoreSearch] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState<any>({
    title: "", description: "", priority: "medium", dueDate: "", assignedToIds: [], customerId: null
  });

  // Universal Custom Dropdown Manager
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  // Search Inputs inside Custom Dropdowns
  const [formEmpSearchQuery, setFormEmpSearchQuery] = useState("");
  const [formClientSearchQuery, setFormClientSearchQuery] = useState("");
  const [filterEmpSearchQuery, setFilterEmpSearchQuery] = useState("");
  const [filterClientSearchQuery, setFilterClientSearchQuery] = useState(""); // 🚨 NEW: For filtering tasks by client

  // Server-Side Filters State
  const [searchQuery, setSearchQuery] = useState("");
  const [filterPriority, setFilterPriority] = useState<TaskPriority | "all">("all");
  const [filterDate, setFilterDate] = useState<"all" | "overdue" | "today" | "upcoming">("all");
  const [filterExactDate, setFilterExactDate] = useState<string>("");
  const [filterEmployeeId, setFilterEmployeeId] = useState<string | "all">("all");
  const [filterCustomerId, setFilterCustomerId] = useState<string | "all">("all"); // 🚨 NEW: Filter State

  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // --- GROUP PANEL / SLIDE STATE ---
  const [activeGroupKey, setActiveGroupKey] = useState<string | null>(null);
  const [isManagePanelOpen, setIsManagePanelOpen] = useState(false);

  // --- INIT FETCH (Employees & Clients) ---
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [empRes, cliRes] = await Promise.all([
          getFilteredEmployee("Limit=500"),
          getFilteredCustomer("Limit=500")
        ]);

        const empData = Array.isArray(empRes) ? empRes : (empRes as any)?.data;
        if (empData) setEmployees(empData as EmployeeItem[]);

        const cliData = Array.isArray(cliRes) ? cliRes : (cliRes as any)?.data;
        if (cliData) setClients(cliData as ClientItem[]);

      } catch (error) {
        toast.error("Failed to load initial data");
      }
    };
    fetchInitialData();
  }, []);

  // --- SERVER-SIDE FILTER FETCH ---
  const fetchFilteredTasks = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.append("search", searchQuery.trim());
      if (filterPriority !== "all") params.append("priority", filterPriority);
      if (filterDate !== "all") params.append("date", filterDate);
      if (filterExactDate) params.append("exactDate", filterExactDate);
      if (filterEmployeeId !== "all") params.append("employeeId", filterEmployeeId);
      if (filterCustomerId !== "all") params.append("customerId", filterCustomerId); // 🚨 NEW: Pass to backend

      const res = await getFilteredAdminTasks(params.toString());
      if (res?.success) setTasks((res.data as TaskItem[]) || []);
    } catch (error) {
      toast.error("Failed to fetch tasks");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchFilteredTasks();
    }, 400);
    return () => clearTimeout(timeoutId);
  }, [searchQuery, filterPriority, filterDate, filterExactDate, filterEmployeeId, filterCustomerId]); // 🚨 NEW: Added dep

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!(e.target as Element).closest('.custom-dropdown-container')) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- HANDLERS ---
  const handleOpenCreateEditModal = (mode: "create" | "edit", task?: TaskItem) => {
    setModalMode(mode);
    setFormEmpSearchQuery("");
    setFormClientSearchQuery("");
    setOpenDropdown(null);
    if (mode === "edit" && task) {
      setSelectedTaskId(task.id);
      setFormData({
        title: task.title, description: task.description || "", priority: task.priority,
        dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : "",
        assignedToIds: [task.assignedToId],
        customerId: task.customerId || null
      });
    } else {
      setSelectedTaskId(null);
      setFormData({ title: "", description: "", priority: "medium", dueDate: "", assignedToIds: [], customerId: null });
    }
    setIsModalOpen(true);
  };

  // 🚨 NEW HANDLER: Assign More Employees Submit
  const handleAssignMoreSubmit = async () => {
    if (assignMoreSelectedIds.length === 0 || !assignMoreGroup) return;
    setIsSubmitting(true);
    try {
      const sourceTask = assignMoreGroup.tasks[0];
      const payload: any = {
        title: sourceTask.title,
        description: sourceTask.description,
        priority: sourceTask.priority,
        dueDate: sourceTask.dueDate,
        customerId: sourceTask.customerId,
        // Send the existing emp as [0], and append the new ones to trigger the clone
        assignedToIds: [sourceTask.assignedToId, ...assignMoreSelectedIds]
      };

      const res = await updateAdminTask(sourceTask.id, payload);
      if (res?.success) {
        toast.success("Task successfully cloned & assigned to new employees!");
        setIsAssignMoreOpen(false);
        setAssignMoreSelectedIds([]);
        fetchFilteredTasks();
      }
    } catch (e) {
      toast.error("Failed to assign more employees.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.assignedToIds || formData.assignedToIds.length === 0) {
      toast.error("Title and at least one Assigned Employee are required");
      return;
    }
    try {
      if (modalMode === "create") {
        const payload = {
          ...formData,
          subTasks: formSubTasks.length > 0 ? formSubTasks : undefined,
        };
        const res = await addAdminTask(payload);
        if (res?.success) toast.success("Task assigned successfully");
      } else if (modalMode === "edit" && selectedTaskId) {
        const payload: AdminUpdateTaskPayload = {
          title: formData.title,
          description: formData.description,
          priority: formData.priority,
          dueDate: formData.dueDate,
          assignedToId: formData.assignedToIds[0],
          customerId: formData.customerId
        };
        const res = await updateAdminTask(selectedTaskId, payload);
        if (res?.success) toast.success("Task updated");
      }
      setIsModalOpen(false);
      fetchFilteredTasks();
    } catch (error) {
      toast.error("An error occurred");
    }
  };

  const handleViewClick = (id: string | number, task: TaskItem) => {
    setViewTaskData(task);
    setViewSubtaskFilter("all");
    setIsViewModalOpen(true);
  };

  const handleUserClick = (id: string | number) => {
    setEmployeeToView(id);
    setIsViewOpen(true);
  };

  const handleCustomerClick = (id: string | number) => {
    setCustomerToView(id);
    setIsCustomerViewOpen(true);
  };

  const handleMagicGenerate = async () => {
    if (!formData.title) {
      toast.error("Please enter a task title first so the AI knows what to generate! 🧠");
      return;
    }
    setIsGeneratingAI(true);
    try {
      const res = await generateSubtasksAI({
        title: formData.title,
        description: formData.description,
        assignedToId: formData.assignedToIds[0] || "",
        customerId: formData.customerId || null
      });
      if (res?.success && res.data) {
        setFormSubTasks(res.data);
      }
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const executeDelete = async () => {
    try {
      const taskIds = taskToDelete ? [taskToDelete] : Array.from(selectedTasks);
      const res = await deleteAdminTasks({ taskIds });
      if (res?.success) {
        toast.success("Tasks deleted successfully");
        if (!taskToDelete) setSelectedTasks(new Set());
        setIsDeleteModalOpen(false);
        fetchFilteredTasks();
      }
    } catch (error) {
      toast.error("Failed to delete tasks");
    }
  };

  const clearFilters = () => {
    setSearchQuery("");
    setFilterPriority("all");
    setFilterDate("all");
    setFilterExactDate("");
    setFilterEmployeeId("all");
    setFilterCustomerId("all"); // 🚨 NEW
  };

  // --- UI HELPERS ---
  const getStatusBadge = (status: TaskStatus | "all") => {
    const styles: Record<string, string> = {
      all: "bg-gray-100 text-gray-600 border border-gray-200",
      todo: "bg-gray-100 text-gray-600 border border-gray-200",
      in_progress: "bg-blue-50 text-blue-600 border border-blue-100",
      under_review: "bg-purple-50 text-purple-600 border border-purple-100",
      completed: "bg-emerald-50 text-emerald-600 border border-emerald-100",
    };
    const labels: Record<string, string> = { all: "All", todo: "To Do", in_progress: "In Progress", under_review: "Review", completed: "Completed" };
    return <span className={`px-2.5 py-1 rounded-full text-[10px] tracking-wider uppercase font-bold ${styles[status as string]}`}>{labels[status as string]}</span>;
  };

  const priorityLabels: Record<string, string> = { all: "All Priorities", low: "Low", medium: "Medium", high: "High", urgent: "Urgent" };
  const dateLabels: Record<string, string> = { all: "Any Date", overdue: "⚠️ Overdue", today: "📅 Due Today", upcoming: "⏭️ Upcoming" };

  const formFilteredEmployees = employees.filter(emp =>
    emp.employeeName?.toLowerCase().includes(formEmpSearchQuery.toLowerCase()) ||
    emp.Email?.toLowerCase().includes(formEmpSearchQuery.toLowerCase())
  );

  const formFilteredClients = clients.filter(cli =>
    cli.customerName?.toLowerCase().includes(formClientSearchQuery.toLowerCase())
  );

  const filterFilteredEmployees = employees.filter(emp =>
    emp.employeeName?.toLowerCase().includes(filterEmpSearchQuery.toLowerCase()) ||
    emp.Email?.toLowerCase().includes(filterEmpSearchQuery.toLowerCase())
  );

  // 🚨 NEW: Filter clients list in the dropdown
  const filterFilteredClients = clients.filter(cli =>
    cli.customerName?.toLowerCase().includes(filterClientSearchQuery.toLowerCase())
  );

  const selectedFilterEmp = employees.find(emp => (emp.id || emp._id) === filterEmployeeId);
  const selectedFilterClient = clients.find(cli => (cli.id || cli._id) === filterCustomerId); // 🚨 NEW
  const selectedFormClient = clients.find(cli => (cli.id || cli._id) === formData.customerId);

  const activeFilterCount = [
    filterEmployeeId !== "all",
    filterCustomerId !== "all", // 🚨 NEW
    filterPriority !== "all",
    filterDate !== "all",
    filterExactDate !== "",
  ].filter(Boolean).length;

  const aiFilteredEmployees = employees
    .filter(emp =>
      emp.employeeName?.toLowerCase().includes(aiEmpSearch.toLowerCase()) ||
      emp.Email?.toLowerCase().includes(aiEmpSearch.toLowerCase())
    )
    .slice(0, 20);

  const toggleAiEmp = (id: string) => {
    setAiAssignedToIds(prev => prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id]);
  };

  // --- GROUPING ---
  const taskGroups: TaskGroup[] = useMemo(() => {
    const map = new Map<string, TaskGroup>();
    tasks.forEach(task => {
      const key = [
        normalizeStr(task.title),
        normalizeStr(task.description),
        task.priority,
        task.dueDate || "",
        task.customerId || ""
      ].join("|");

      const existing = map.get(key);
      if (existing) {
        existing.tasks.push(task);
      } else {
        map.set(key, {
          key,
          title: task.title,
          description: task.description,
          priority: task.priority,
          dueDate: task.dueDate,
          customerId: task.customerId || null,
          customerName: task.customer?.customerName,
          tasks: [task],
        });
      }
    });
    return Array.from(map.values());
  }, [tasks]);

  const foundActiveGroup = activeGroupKey ? taskGroups.find(g => g.key === activeGroupKey) ?? null : null;
  const lastGroupRef = useRef<TaskGroup | null>(null);
  if (foundActiveGroup) lastGroupRef.current = foundActiveGroup;
  const activeGroup = foundActiveGroup ?? (isManagePanelOpen ? null : lastGroupRef.current);

  const openGroup = (key: string) => {
    setActiveGroupKey(key);
    setIsManagePanelOpen(true);
  };

  const closeGroup = () => {
    setIsManagePanelOpen(false);
  };

  const handleStageTransitionEnd = () => {
    if (!isManagePanelOpen) {
      setActiveGroupKey(null);
    }
  };

  useEffect(() => {
    if (activeGroupKey && isManagePanelOpen && !taskGroups.find(g => g.key === activeGroupKey)) {
      setIsManagePanelOpen(false);
    }
  }, [taskGroups, activeGroupKey, isManagePanelOpen]);

  const getGroupProgress = (group: TaskGroup) => {
    const totalSub = group.tasks.reduce((sum, t) => sum + (t.subTasks?.length || 0), 0);
    const doneSub = group.tasks.reduce((sum, t) => sum + (t.subTasks?.filter(s => s.status === 'completed').length || 0), 0);
    if (totalSub === 0) return 0;
    return Math.round((doneSub / totalSub) * 100);
  };

  const getTaskProgress = (task: TaskItem) => {
    const total = task.subTasks?.length || 0;
    const completed = task.subTasks?.filter(st => st.status === 'completed').length || 0;
    if (total === 0) return 0;
    return Math.round((completed / total) * 100);
  };

  const getGroupSubtaskTotal = (group: TaskGroup) =>
    group.tasks.reduce((sum, t) => sum + (t._count?.subTasks ?? t.subTasks?.length ?? 0), 0);

  const isGroupFullySelected = (group: TaskGroup) =>
    group.tasks.length > 0 && group.tasks.every(t => selectedTasks.has(t.id));

  const isGroupPartiallySelected = (group: TaskGroup) =>
    group.tasks.some(t => selectedTasks.has(t.id)) && !isGroupFullySelected(group);

  const toggleGroupSelection = (group: TaskGroup) => {
    const newSet = new Set(selectedTasks);
    if (isGroupFullySelected(group)) {
      group.tasks.forEach(t => newSet.delete(t.id));
    } else {
      group.tasks.forEach(t => newSet.add(t.id));
    }
    setSelectedTasks(newSet);
  };

  return (
    <div className="h-full flex flex-col overflow-hidden max-w-[90rem] mx-auto w-full sm:bg-white rounded-2xl sm:px-2 ">

      <EmployeeViewDialog
        isOpen={isViewOpen}
        employeeId={employeeToView}
        onClose={() => {
          setIsViewOpen(false);
          setEmployeeToView(null);
        }}
      />

      <CustomerViewDialog
        isOpen={isCustomerViewOpen}
        customerId={customerToView}
        onClose={() => {
          setIsCustomerViewOpen(false);
          setCustomerToView(null);
        }}
      />

      {/* FIXED TOP BAR */}
      <div className="shrink-0 sm:p-4  ">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
          <div>
            <h1 className="text-2xl font-extrabold text-[var(--color-primary)] max-sm:mb-5">Task Management</h1>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full md:w-auto">
            {selectedTasks.size > 0 && (
              <button
                onClick={() => { setTaskToDelete(null); setIsDeleteModalOpen(true); }}
                className="flex flex-1 md:flex-none items-center justify-center cursor-pointer gap-2 px-4 py-2 bg-[var(--color-destructive)]/10 text-[var(--color-destructive)] font-bold text-sm rounded-xl hover:bg-[var(--color-destructive)]/20 transition-colors"
              >
                <Trash2 size={16} /> Delete Selected ({selectedTasks.size})
              </button>
            )}
            <button
              onClick={() => handleOpenCreateEditModal("create")}
              className="flex flex-1 md:flex-none items-center justify-center cursor-pointer gap-2 px-3 sm:px-5 py-2.5 bg-[var(--color-primary)] text-white font-bold text-sm rounded-xl hover:bg-[var(--color-primary-dark)] shadow-md shadow-[var(--color-primary-light)] transition-all"
            >
              <Plus size={18} /> Assign Task
            </button>
            <button
              onClick={() => {
                setAiPrompt("");
                setAiAssignedToIds([]);
                setAiSelectedClient(null);
                setAiResponseSummary(null);
                setAiEmpSearch("");
                setIsAiPickerOpen(false);
                setIsAIModalOpen(true);
              }}
              className="flex flex-1 md:flex-none items-center justify-center cursor-pointer gap-2 px-3 sm:px-5 py-2.5 bg-[var(--color-primary)] text-white font-bold text-sm rounded-xl hover:bg-black shadow-[0_0_15px_rgba(168,85,247,0.4)] transition-all relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-pink-500/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className=" overflow-hidden w-5 h-5 rounded-full">
                <img src="/taskbot.png" className=" h-full w-full" />
              </div> AI Assign
            </button>
          </div>
        </div>
      </div>

      <div className="relative overflow-hidden h-[calc(100vh-300px)] min-h-[500px] ">
        <div
          className="flex h-full w-[200%] transition-transform duration-300 ease-in-out"
          style={{ transform: isManagePanelOpen ? "translateX(-50%)" : "translateX(0%)" }}
          onTransitionEnd={handleStageTransitionEnd}
        >

          {/* =============== PANEL 1: TASK LIST =============== */}
          <div className="w-1/2 h-full shrink-0 overflow-y-auto px-0  pb-6">

            <div className="flex-1 w-full min-w-[120px] xl:max-w-md relative mb-6">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-primary)]" />
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] outline-none text-sm transition-all bg-gray-50/50 focus:bg-white"
              />
            </div>

            {/* SERVER-SIDE FILTERS BAR */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200 flex flex-col xl:flex-row gap-4 items-start xl:items-center justify-between mb-6">

              {/* MOBILE FILTER TOGGLE */}
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
                className="flex sm:hidden items-center justify-between w-full px-3 py-2.5 rounded-xl bg-[var(--color-primary-lighter)] text-[var(--color-primary-dark)] font-bold text-sm border border-[var(--color-primary-light)] cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Filter size={16} /> Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
                </span>
                <ChevronDown size={16} className={`transition-transform ${mobileFiltersOpen ? 'rotate-180' : ''}`} />
              </button>

              <div className={`${mobileFiltersOpen ? 'flex' : 'hidden'} sm:flex flex-wrap items-center gap-3 w-full xl:w-auto`}>
                <div className="hidden sm:flex items-center gap-2 text-sm text-[var(--color-primary-dark)] font-bold bg-[var(--color-primary-lighter)] px-3 py-2.5 rounded-xl border border-[var(--color-primary-light)]">
                  <Filter size={16} /> Filters
                </div>

                {/* CUSTOM FILTER: Client / Project 🚨 ADDED */}
                <div className="relative custom-dropdown-container w-full sm:w-auto">
                  <div
                    onClick={() => setOpenDropdown(openDropdown === 'filter-client' ? null : 'filter-client')}
                    className={`w-full sm:w-44 px-3 py-2.5 cursor-pointer rounded-xl border ${openDropdown === 'filter-client' ? 'border-[var(--color-primary)] ring-1 ring-[var(--color-primary-light)]' : 'border-gray-200'} flex items-center justify-between bg-white transition-all`}
                  >
                    <span className={`text-sm truncate ${selectedFilterClient ? 'text-gray-900 font-medium' : 'text-gray-600'}`}>
                      {selectedFilterClient ? selectedFilterClient.customerName : "All Clients"}
                    </span>
                    <ChevronDown size={14} className={`text-gray-400 shrink-0 transition-transform ${openDropdown === 'filter-client' ? 'rotate-180 text-[var(--color-primary)]' : ''}`} />
                  </div>

                  {openDropdown === 'filter-client' && (
                    <div className="absolute z-40 w-full sm:w-64 max-w-[90vw] mt-2 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 right-0 md:left-0">
                      <div className="p-2 border-b border-gray-100 bg-gray-50">
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg border border-gray-200 focus-within:border-[var(--color-primary)] transition-all">
                          <Search size={14} className="text-gray-400" />
                          <input
                            type="text" placeholder="Search client..."
                            value={filterClientSearchQuery} onChange={(e) => setFilterClientSearchQuery(e.target.value)}
                            className="w-full text-sm outline-none border-none bg-transparent" autoFocus
                          />
                        </div>
                      </div>
                      <div className="max-h-48 overflow-y-auto p-1 custom-scrollbar">
                        <div
                          onClick={() => { setFilterCustomerId("all"); setOpenDropdown(null); }}
                          className={`px-3 py-2 text-sm rounded-lg cursor-pointer transition-colors ${filterCustomerId === "all" ? 'bg-[var(--color-primary-lighter)] text-[var(--color-primary-dark)] font-bold' : 'hover:bg-gray-50 text-gray-700'}`}
                        >
                          All Clients
                        </div>
                        {filterFilteredClients.map(cli => (
                          <div
                            key={cli.id || cli._id}
                            onClick={() => { setFilterCustomerId((cli.id || cli._id) as string); setOpenDropdown(null); }}
                            className={`px-3 py-2 text-sm rounded-lg cursor-pointer flex flex-col transition-colors ${filterCustomerId === (cli.id || cli._id) ? 'bg-[var(--color-primary-lighter)] text-[var(--color-primary-dark)] font-bold' : 'hover:bg-gray-50 text-gray-700'}`}
                          >
                            <span>{cli.customerName}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* CUSTOM FILTER: Employee */}
                <div className="relative custom-dropdown-container w-full sm:w-auto">
                  <div
                    onClick={() => setOpenDropdown(openDropdown === 'filter-emp' ? null : 'filter-emp')}
                    className={`w-full sm:w-44 px-3 py-2.5 cursor-pointer rounded-xl border ${openDropdown === 'filter-emp' ? 'border-[var(--color-primary)] ring-1 ring-[var(--color-primary-light)]' : 'border-gray-200'} flex items-center justify-between bg-white transition-all`}
                  >
                    <span className={`text-sm truncate ${selectedFilterEmp ? 'text-gray-900 font-medium' : 'text-gray-600'}`}>
                      {selectedFilterEmp ? selectedFilterEmp.employeeName : "All Employees"}
                    </span>
                    <ChevronDown size={14} className={`text-gray-400 shrink-0 transition-transform ${openDropdown === 'filter-emp' ? 'rotate-180 text-[var(--color-primary)]' : ''}`} />
                  </div>

                  {openDropdown === 'filter-emp' && (
                    <div className="absolute z-40 w-full sm:w-64 max-w-[90vw] mt-2 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 right-0 md:left-0">
                      <div className="p-2 border-b border-gray-100 bg-gray-50">
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg border border-gray-200 focus-within:border-[var(--color-primary)] transition-all">
                          <Search size={14} className="text-gray-400" />
                          <input
                            type="text" placeholder="Search employee..."
                            value={filterEmpSearchQuery} onChange={(e) => setFilterEmpSearchQuery(e.target.value)}
                            className="w-full text-sm outline-none border-none bg-transparent" autoFocus
                          />
                        </div>
                      </div>
                      <div className="max-h-48 overflow-y-auto p-1 custom-scrollbar">
                        <div
                          onClick={() => { setFilterEmployeeId("all"); setOpenDropdown(null); }}
                          className={`px-3 py-2 text-sm rounded-lg cursor-pointer transition-colors ${filterEmployeeId === "all" ? 'bg-[var(--color-primary-lighter)] text-[var(--color-primary-dark)] font-bold' : 'hover:bg-gray-50 text-gray-700'}`}
                        >
                          All Employees
                        </div>
                        {filterFilteredEmployees.map(emp => (
                          <div
                            key={emp.id || emp._id}
                            onClick={() => { setFilterEmployeeId((emp.id || emp._id) as string); setOpenDropdown(null); }}
                            className={`px-3 py-2 text-sm rounded-lg cursor-pointer flex flex-col transition-colors ${filterEmployeeId === (emp.id || emp._id) ? 'bg-[var(--color-primary-lighter)] text-[var(--color-primary-dark)] font-bold' : 'hover:bg-gray-50 text-gray-700'}`}
                          >
                            <span>{emp.employeeName}</span>
                            <span className="text-xs text-gray-400 font-normal">{emp.Email}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* CUSTOM FILTER: Priority */}
                <div className="relative custom-dropdown-container w-full sm:w-auto">
                  <div
                    onClick={() => setOpenDropdown(openDropdown === 'filter-priority' ? null : 'filter-priority')}
                    className={`w-full sm:w-36 px-3 py-2.5 rounded-xl cursor-pointer border ${openDropdown === 'filter-priority' ? 'border-[var(--color-primary)] ring-1 ring-[var(--color-primary-light)]' : 'border-gray-200'} flex items-center justify-between bg-white transition-all`}
                  >
                    <span className="text-sm font-medium text-gray-700 truncate">{priorityLabels[filterPriority]}</span>
                    <ChevronDown size={14} className={`text-gray-400 shrink-0 transition-transform ${openDropdown === 'filter-priority' ? 'rotate-180 text-[var(--color-primary)]' : ''}`} />
                  </div>
                  {openDropdown === 'filter-priority' && (
                    <div className="absolute z-40 w-full sm:w-36 max-w-[90vw] mt-2 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden p-1 right-0 md:left-0 animate-in fade-in slide-in-from-top-2">
                      {["all", "low", "medium", "high", "urgent"].map(p => (
                        <div
                          key={p}
                          onClick={() => { setFilterPriority(p as TaskPriority | "all"); setOpenDropdown(null); }}
                          className={`px-3 py-2 text-sm rounded-lg cursor-pointer transition-colors ${filterPriority === p ? 'bg-[var(--color-primary-lighter)] text-[var(--color-primary-dark)] font-bold' : 'hover:bg-gray-50 text-gray-700'}`}
                        >
                          {priorityLabels[p]}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* CUSTOM FILTER: Date */}
                <div className="relative custom-dropdown-container w-full sm:w-auto">
                  <div
                    onClick={() => setOpenDropdown(openDropdown === 'filter-date' ? null : 'filter-date')}
                    className={`w-full sm:w-36 px-3 py-2.5 cursor-pointer rounded-xl border ${openDropdown === 'filter-date' ? 'border-[var(--color-primary)] ring-1 ring-[var(--color-primary-light)]' : 'border-gray-200'} flex items-center justify-between bg-white transition-all`}
                  >
                    <span className="text-sm font-medium text-gray-700 truncate">{dateLabels[filterDate]}</span>
                    <ChevronDown size={14} className={`text-gray-400 shrink-0 transition-transform ${openDropdown === 'filter-date' ? 'rotate-180 text-[var(--color-primary)]' : ''}`} />
                  </div>
                  {openDropdown === 'filter-date' && (
                    <div className="absolute z-40 w-full sm:w-40 max-w-[90vw] mt-2 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden p-1 right-0 animate-in fade-in slide-in-from-top-2">
                      {["all", "overdue", "today", "upcoming"].map(d => (
                        <div
                          key={d}
                          onClick={() => { setFilterDate(d as any); setOpenDropdown(null); }}
                          className={`px-3 py-2 text-sm rounded-lg cursor-pointer transition-colors ${filterDate === d ? 'bg-[var(--color-primary-lighter)] text-[var(--color-primary-dark)] font-bold' : 'hover:bg-gray-50 text-gray-700'}`}
                        >
                          {dateLabels[d]}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* EXACT CALENDAR DATE FILTER */}
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <span className="text-xs font-bold text-gray-400 uppercase shrink-0">OR</span>
                  <input
                    type="date"
                    placeholder="Select Date"
                    value={filterExactDate}
                    onChange={(e) => {
                      setFilterExactDate(e.target.value);
                      if (e.target.value) setFilterDate("all");
                    }}
                    className={`flex-1 sm:flex-none sm:w-36 px-3 py-2 rounded-xl border transition-all text-sm font-medium outline-none cursor-pointer bg-white ${filterExactDate ? 'border-[var(--color-primary)] text-[var(--color-primary)] ring-1 ring-[var(--color-primary-light)]' : 'border-gray-200 text-gray-600 focus:border-[var(--color-primary)]'}`}
                  />
                </div>

                {/* CLEAR FILTERS BUTTON */}
                {(searchQuery !== "" || filterPriority !== "all" || filterDate !== "all" || filterExactDate !== "" || filterEmployeeId !== "all" || filterCustomerId !== "all") && (
                  <button
                    onClick={clearFilters}
                    className="flex items-center justify-center cursor-pointer gap-1.5 px-3 py-2 text-sm font-bold text-gray-500 hover:text-[var(--color-destructive)] bg-gray-100 hover:bg-red-50 rounded-xl transition-all w-full sm:w-auto"
                  >
                    <XCircle size={16} /> Clear
                  </button>
                )}
              </div>
            </div>

            {/* TASKS LIST */}
            {isLoading ? (
              <div className="flex justify-center items-center h-64 text-gray-400 font-medium">Fetching Tasks...</div>
            ) : taskGroups.length === 0 ? (
              <div className="bg-white rounded-3xl border border-gray-200 p-8 sm:p-12 text-center shadow-sm">
                <CheckCircle2 size={48} className="mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-bold text-gray-900">No tasks found</h3>
                <p className="text-gray-500 text-sm mt-1">Adjust your filters or assign a new task.</p>
              </div>
            ) : (
              <>
                <div className="hidden md:block bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wider">
                          <th className="p-4 w-10 text-center">
                            <input
                              type="checkbox"
                              onChange={(e) => {
                                if (e.target.checked) setSelectedTasks(new Set(tasks.map(t => t.id)));
                                else setSelectedTasks(new Set());
                              }}
                              checked={selectedTasks.size === tasks.length && tasks.length > 0}
                              className="rounded text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
                            />
                          </th>
                          <th className="p-4">Task Details</th>
                          <th className="p-4">Assigned To</th>
                          <th className="p-4">Overall Progress</th>
                          <th className="p-4">Due Date</th>
                          <th className="p-4 text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {taskGroups.map((group) => {
                          const progress = getGroupProgress(group);
                          const memberCount = group.tasks.length;
                          const subtaskTotal = getGroupSubtaskTotal(group);
                          const isOverdue = !!(group.dueDate && new Date(group.dueDate) < new Date() && progress < 100);
                          const fullySelected = isGroupFullySelected(group);

                          return (
                            <tr
                              key={group.key}
                              onClick={() => openGroup(group.key)}
                              className="hover:bg-gray-50/80 transition-colors group cursor-pointer"
                            >
                              <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                                <input
                                  type="checkbox"
                                  checked={fullySelected}
                                  ref={(el) => { if (el) el.indeterminate = isGroupPartiallySelected(group); }}
                                  onChange={() => toggleGroupSelection(group)}
                                  className="rounded text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
                                />
                              </td>
                              <td className="p-4 max-w-[300px]">
                                <p className="font-bold text-gray-900 mb-1 line-clamp-1">{group.title}</p>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className={`flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider ${group.priority === 'urgent' ? 'text-red-500' : group.priority === 'high' ? 'text-orange-500' : 'text-[var(--color-primary)]'}`}>
                                    <AlertCircle size={12} /> {group.priority}
                                  </span>
                                  {group.customerName && (
                                    <span className="flex items-center gap-1 text-[10px] font-bold bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded-md">
                                      <Briefcase size={10} /> {group.customerName}
                                    </span>
                                  )}
                                  {subtaskTotal > 0 && (
                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-[var(--color-primary-lighter)] text-[var(--color-primary-dark)]">
                                      <CheckSquare size={10} /> {subtaskTotal} Subtasks
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="p-4">
                                <div className="flex items-center gap-2">
                                  <div className="flex -space-x-2 shrink-0">
                                    {group.tasks.slice(0, 3).map((t) => (
                                      <div
                                        key={t.id}
                                        title={t.assignedTo?.employeeName}
                                        className="w-7 h-7 rounded-full bg-[var(--color-primary-lighter)] border-2 border-white flex items-center justify-center text-[10px] font-bold text-[var(--color-primary-dark)]"
                                      >
                                        {(t.assignedTo?.employeeName || "?").charAt(0).toUpperCase()}
                                      </div>
                                    ))}
                                    {memberCount > 3 && (
                                      <div className="w-7 h-7 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-gray-500">
                                        +{memberCount - 3}
                                      </div>
                                    )}
                                  </div>
                                  <span className="text-sm font-semibold text-gray-700 truncate">
                                    {memberCount === 1 ? (group.tasks[0].assignedTo?.employeeName || "Unknown") : `${memberCount} Employees`}
                                  </span>
                                </div>
                              </td>

                              <td className="p-4">
                                <div className="flex flex-col gap-1.5 w-32">
                                  <div className="flex justify-between items-center text-xs font-bold text-gray-500">
                                    <span>{progress}% Completed</span>
                                  </div>
                                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                                    <div className={`h-1.5 rounded-full ${progress === 100 ? 'bg-emerald-500' : 'bg-[var(--color-primary)]'}`} style={{ width: `${progress}%` }}></div>
                                  </div>
                                </div>
                              </td>
                              <td className="p-4">
                                <div className="flex items-center gap-1.5 text-sm font-medium">
                                  <Calendar size={14} className={isOverdue ? 'text-[var(--color-destructive)]' : 'text-gray-400'} />
                                  <span className={isOverdue ? 'text-[var(--color-destructive)]' : 'text-gray-600'}>
                                    {group.dueDate ? new Date(group.dueDate).toLocaleDateString() : "No date"}
                                  </span>
                                </div>
                              </td>
                              <td className="p-4 text-center">
                                <button
                                  onClick={(e) => { e.stopPropagation(); openGroup(group.key); }}
                                  className="inline-flex items-center gap-1.5 px-3 py-2 cursor-pointer text-xs font-bold text-[var(--color-primary-dark)] bg-[var(--color-primary-lighter)] hover:bg-[var(--color-primary-light)] rounded-lg transition-colors"
                                >
                                  <Users size={14} /> Manage{memberCount > 1 ? ` (${memberCount})` : ""}
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="md:hidden space-y-3">
                  <div className="flex items-center justify-between px-1">
                    <label className="flex items-center gap-2 text-sm font-bold text-gray-600">
                      <input
                        type="checkbox"
                        onChange={(e) => {
                          if (e.target.checked) setSelectedTasks(new Set(tasks.map(t => t.id)));
                          else setSelectedTasks(new Set());
                        }}
                        checked={selectedTasks.size === tasks.length && tasks.length > 0}
                        className="w-4 h-4 rounded text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
                      />
                      Select All
                    </label>
                    <span className="text-xs text-gray-400 font-medium">{taskGroups.length} task{taskGroups.length !== 1 ? "s" : ""}</span>
                  </div>

                  {taskGroups.map((group) => {
                    const progress = getGroupProgress(group);
                    const memberCount = group.tasks.length;
                    const subtaskTotal = getGroupSubtaskTotal(group);
                    const isOverdue = !!(group.dueDate && new Date(group.dueDate) < new Date() && progress < 100);
                    const fullySelected = isGroupFullySelected(group);

                    return (
                      <div
                        key={group.key}
                        className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 cursor-pointer"
                        onClick={() => openGroup(group.key)}
                      >
                        <div className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            checked={fullySelected}
                            ref={(el) => { if (el) el.indeterminate = isGroupPartiallySelected(group); }}
                            onClick={(e) => e.stopPropagation()}
                            onChange={() => toggleGroupSelection(group)}
                            className="mt-1 w-4 h-4 rounded text-[var(--color-primary)] focus:ring-[var(--color-primary)] shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-gray-900 leading-snug">{group.title}</p>

                            <div className="flex items-center flex-wrap gap-2 mt-2">
                              {group.customerName && (
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 flex items-center gap-1">
                                  <Briefcase size={10} /> {group.customerName}
                                </span>
                              )}
                              {memberCount > 1 && (
                                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[var(--color-primary-lighter)] text-[var(--color-primary-dark)]">
                                  {memberCount} Employees
                                </span>
                              )}
                              <span className={`flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider ${group.priority === 'urgent' ? 'text-red-500' : group.priority === 'high' ? 'text-orange-500' : 'text-[var(--color-primary)]'}`}>
                                <AlertCircle size={12} /> {group.priority}
                              </span>
                              {subtaskTotal > 0 && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-[var(--color-primary-lighter)] text-[var(--color-primary-dark)]">
                                  <CheckSquare size={10} /> {subtaskTotal} Subtasks
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-1.5 mt-3 text-sm font-medium">
                              <Calendar size={14} className={isOverdue ? 'text-[var(--color-destructive)]' : 'text-gray-400'} />
                              <span className={isOverdue ? 'text-[var(--color-destructive)]' : 'text-gray-600'}>
                                {group.dueDate ? new Date(group.dueDate).toLocaleDateString() : "No date"}
                              </span>
                            </div>

                            <div className="mt-3">
                              <div className="flex justify-between items-center text-xs font-bold text-gray-500 mb-1">
                                <span>{progress}% Completed</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-1.5">
                                <div className={`h-1.5 rounded-full ${progress === 100 ? 'bg-emerald-500' : 'bg-[var(--color-primary)]'}`} style={{ width: `${progress}%` }}></div>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-stretch gap-1 mt-3 pt-3 border-t border-gray-100">
                          <button
                            onClick={(e) => { e.stopPropagation(); openGroup(group.key); }}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-bold text-[var(--color-primary-dark)] bg-[var(--color-primary-lighter)] active:bg-[var(--color-primary-light)] rounded-lg cursor-pointer"
                          >
                            <Users size={16} /> Manage Team{memberCount > 1 ? ` (${memberCount})` : ""}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* =============== PANEL 2: MANAGE GROUP =============== */}
          <div className="w-1/2 h-full shrink-0 flex flex-col overflow-y-auto bg-gray-50 custom-scrollbar">
            {activeGroup && (() => {
              const group = activeGroup;
              const progress = getGroupProgress(group);
              const memberCount = group.tasks.length;
              const isOverdue = !!(group.dueDate && new Date(group.dueDate) < new Date() && progress < 100);
              const groupSelectedCount = group.tasks.filter(t => selectedTasks.has(t.id)).length;

              return (
                <>
                  <div className="sticky top-0 z-30 px-4 py-3 bg-white/90 backdrop-blur-md border-b border-gray-200 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] flex justify-start gap-2">
                    <button
                      onClick={closeGroup}
                      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold text-gray-700 bg-white border border-gray-200 hover:bg-[var(--color-primary-lighter)] hover:text-[var(--color-primary-dark)] hover:border-[var(--color-primary-light)] rounded-xl transition-all cursor-pointer shadow-sm active:scale-95"
                    >
                      <ArrowLeft size={16} />
                      <span className="max-sm:hidden">Back to Tasks</span>
                      <span className="sm:hidden">Back</span>
                    </button>
                    <button
                      onClick={() => {
                        setAssignMoreGroup(group);
                        setAssignMoreSelectedIds([]);
                        setAssignMoreSearch("");
                        setIsAssignMoreOpen(true);
                      }}
                      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] shadow-sm rounded-xl cursor-pointer transition-colors"
                    >
                      <UserPlus size={16} /> Assign More
                    </button>
                  </div>

                  <div className="px-4 sm:px-6 py-5 border-b border-gray-200 bg-white shrink-0 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 w-full">
                    <div className="flex-1 min-w-0 w-full flex flex-col gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-xl sm:text-2xl font-black text-gray-900">{group.title}</h2>
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${group.priority === 'urgent' ? 'bg-red-50 text-red-600 border-red-200' : group.priority === 'high' ? 'bg-orange-50 text-orange-600 border-orange-200' : 'bg-blue-50 text-blue-600 border-blue-200'}`}>
                          {priorityLabels[group.priority]} Priority
                        </span>
                      </div>

                      <div className="flex items-center flex-wrap gap-3 text-sm text-gray-500 font-medium">
                        <span className="flex items-center gap-1.5"><Users size={14} /> {memberCount} Employee{memberCount !== 1 ? "s" : ""}</span>
                        {group.customerName && (
                          <span className="flex items-center gap-1.5 text-indigo-600 hover:underline cursor-pointer" onClick={() => handleCustomerClick(group?.customerId || "")}><Briefcase size={14} /> {group.customerName}</span>
                        )}
                        <span className="flex items-center gap-1.5">
                          <Calendar size={14} className={isOverdue ? 'text-[var(--color-destructive)]' : ''} />
                          <span className={isOverdue ? 'text-[var(--color-destructive)] font-bold' : ''}>
                            {group.dueDate ? new Date(group.dueDate).toLocaleDateString() : "No due date"}
                          </span>
                        </span>
                      </div>

                      {group.description && (
                        <p className="text-sm text-gray-600 mt-1 max-w-2xl">{group.description}</p>
                      )}
                    </div>

                    <div className="w-full sm:w-64 shrink-0 bg-gray-50 p-3.5 rounded-xl border border-gray-100">
                      <div className="flex justify-between items-center text-xs font-bold text-gray-600 mb-2">
                        <span>Overall Progress</span>
                        <span className={progress === 100 ? 'text-emerald-600' : 'text-[var(--color-primary-dark)]'}>{progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div className={`h-2.5 rounded-full transition-all duration-500 ${progress === 100 ? 'bg-emerald-500' : 'bg-[var(--color-primary)]'}`} style={{ width: `${progress}%` }}></div>
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 p-4 sm:px-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                      {group.tasks.map(task => {
                        const taskProgress = getTaskProgress(task);
                        const completedSubTasks = task.subTasks?.filter(st => st.status === 'completed').length || 0;
                        const totalSubTasks = task.subTasks?.length || 0;

                        return (
                          <div key={task.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 flex flex-col gap-3">
                            <div className="flex items-start justify-between gap-2">
                              <button
                                type="button"
                                onClick={() => handleUserClick(task.assignedTo?.id || task.assignedTo?._id || "")}
                                className="flex items-center gap-2 min-w-0 cursor-pointer group/emp"
                              >
                                <UserCircle size={20} className="text-[var(--color-primary)] shrink-0" />
                                <span className="text-sm font-bold text-gray-800 truncate group-hover/emp:text-[var(--color-primary)]">
                                  {task.assignedTo?.employeeName || "Unknown"}
                                </span>
                              </button>
                              <input
                                type="checkbox"
                                checked={selectedTasks.has(task.id)}
                                onChange={() => {
                                  const newSet = new Set(selectedTasks);
                                  newSet.has(task.id) ? newSet.delete(task.id) : newSet.add(task.id);
                                  setSelectedTasks(newSet);
                                }}
                                className="w-4 h-4 rounded text-[var(--color-primary)] focus:ring-[var(--color-primary)] shrink-0"
                              />
                            </div>

                            {(totalSubTasks > 0) && (
                              <div>
                                <div className="flex justify-between items-center text-[11px] font-bold text-gray-400 mb-1">
                                  <span>Subtasks</span>
                                  <span>{completedSubTasks}/{totalSubTasks} • {taskProgress}%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-1.5">
                                  <div className={`h-1.5 rounded-full ${taskProgress === 100 ? 'bg-emerald-500' : 'bg-[var(--color-primary)]'}`} style={{ width: `${taskProgress}%` }}></div>
                                </div>
                              </div>
                            )}

                            <div className="flex items-center gap-1 pt-1 border-t border-gray-100">
                              <button onClick={() => handleViewClick(task.id, task)} className="flex-1 flex items-center justify-center gap-1 py-2 cursor-pointer text-xs font-bold text-gray-500 hover:text-[var(--color-primary)] hover:bg-[var(--color-primary-lighter)] rounded-lg transition-colors">
                                <Eye size={14} /> View
                              </button>
                              <button onClick={() => handleOpenCreateEditModal("edit", task)} className="flex-1 flex items-center justify-center gap-1 py-2 cursor-pointer text-xs font-bold text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                <Edit size={14} /> Edit
                              </button>
                              <button onClick={() => { setTaskToDelete(task.id); setIsDeleteModalOpen(true); }} className="flex-1 flex items-center justify-center gap-1 py-2 cursor-pointer text-xs font-bold text-gray-500 hover:text-[var(--color-destructive)] hover:bg-red-50 rounded-lg transition-colors">
                                <Trash2 size={14} /> Delete
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {groupSelectedCount > 0 && (
                    <div className="px-4 sm:px-6 py-3 border-t border-gray-200 bg-white flex items-center justify-between shrink-0">
                      <span className="text-sm font-bold text-gray-600">{groupSelectedCount} selected</span>
                      <button
                        onClick={() => { setTaskToDelete(null); setIsDeleteModalOpen(true); }}
                        className="flex items-center gap-2 px-4 py-2 cursor-pointer bg-[var(--color-destructive)]/10 text-[var(--color-destructive)] font-bold text-sm rounded-xl hover:bg-[var(--color-destructive)]/20 transition-colors"
                      >
                        <Trash2 size={16} /> Delete Selected
                      </button>
                    </div>
                  )}
                </>
              );
            })()}
          </div>

        </div>
      </div>

      {/* ========================================================= */}
      {/* 1. CREATE / EDIT TASK MODAL (AI-STYLE SPLIT LAYOUT)         */}
      {/* ========================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white sm:rounded-3xl shadow-2xl border-0 sm:border sm:border-[var(--color-primary-light)] w-full sm:max-w-2xl md:max-w-5xl lg:max-w-6xl h-[100dvh] sm:h-[90vh] xl:h-[85vh] flex flex-col relative overflow-hidden">

            <div className="px-4 sm:px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/80 shrink-0">
              <h2 className="text-lg font-bold text-gray-900">
                {modalMode === "create" ? "Assign New Task" : "Edit Task"}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-[var(--color-primary)] hover:bg-[var(--color-primary-lighter)] p-2 rounded-lg transition-colors cursor-pointer shrink-0">
                <X size={20} />
              </button>
            </div>

            <div className="flex flex-1 overflow-hidden bg-white">

              {/* ---------------- PC LEFT SIDEBAR ---------------- */}
              <div className="hidden md:flex flex-col w-[320px] lg:w-[380px] shrink-0 border-r border-gray-100 bg-gray-50/50 h-full">

                {/* Client / Project Picker */}
                <div className="p-5 border-b border-gray-100 bg-white shrink-0">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-sm font-extrabold text-gray-900 flex items-center gap-1.5"><Briefcase size={14} /> Project / Client</h3>
                    {formData.customerId && (
                      <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-md">Linked</span>
                    )}
                  </div>
                  <div className="relative custom-dropdown-container">
                    <div
                      onClick={() => setOpenDropdown(openDropdown === 'form-client' ? null : 'form-client')}
                      className={`w-full px-3 py-2.5 cursor-pointer rounded-xl border ${openDropdown === 'form-client' ? 'border-[var(--color-primary)] ring-1 ring-[var(--color-primary-light)]' : 'border-gray-200'} flex items-center justify-between bg-white transition-all`}
                    >
                      <span className={`text-sm truncate ${selectedFormClient ? 'text-gray-900 font-bold' : 'text-gray-500'}`}>
                        {selectedFormClient ? selectedFormClient.customerName : "Select Client (Optional)"}
                      </span>
                      {selectedFormClient ? (
                        <X size={14} className="text-gray-400 hover:text-red-500 cursor-pointer" onClick={(e) => { e.stopPropagation(); setFormData({ ...formData, customerId: null }); }} />
                      ) : (
                        <ChevronDown size={14} className="text-gray-400 shrink-0" />
                      )}
                    </div>

                    {openDropdown === 'form-client' && (
                      <div className="absolute z-40 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 left-0">
                        <div className="p-2 border-b border-gray-100 bg-gray-50">
                          <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg border border-gray-200 focus-within:border-[var(--color-primary)] transition-all">
                            <Search size={14} className="text-gray-400" />
                            <input
                              type="text" placeholder="Search clients..."
                              value={formClientSearchQuery} onChange={(e) => setFormClientSearchQuery(e.target.value)}
                              className="w-full text-sm outline-none border-none bg-transparent" autoFocus
                            />
                          </div>
                        </div>
                        <div className="max-h-48 overflow-y-auto p-1 custom-scrollbar">
                          {formFilteredClients.map(cli => (
                            <div
                              key={cli.id || cli._id}
                              onClick={() => { setFormData({ ...formData, customerId: (cli.id || cli._id) as string }); setOpenDropdown(null); }}
                              className={`px-3 py-2 text-sm rounded-lg cursor-pointer transition-colors ${formData.customerId === (cli.id || cli._id) ? 'bg-[var(--color-primary-lighter)] text-[var(--color-primary-dark)] font-bold' : 'hover:bg-gray-50 text-gray-700'}`}
                            >
                              {cli.customerName}
                            </div>
                          ))}
                          {formFilteredClients.length === 0 && <div className="p-3 text-xs text-center text-gray-400">No clients found</div>}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Team Picker */}
                <div className="p-5 border-b border-gray-100 bg-gray-50/30 shrink-0">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-sm font-extrabold text-gray-900">Assign To</h3>
                    <span className="text-xs font-bold bg-[var(--color-primary-lighter)] text-[var(--color-primary-dark)] px-2 py-0.5 rounded-md">
                      {formData.assignedToIds.length} Selected
                    </span>
                  </div>
                  <div className="relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search teammates..."
                      value={formEmpSearchQuery}
                      onChange={(e) => setFormEmpSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-1 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] outline-none transition-all"
                    />
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar p-3">
                  {formFilteredEmployees.length === 0 ? (
                    <div className="text-center py-8 text-sm text-gray-400">No teammates found.</div>
                  ) : (
                    <div className="space-y-1.5">
                      {formFilteredEmployees.map(emp => {
                        const empId = (emp.id || emp._id) as string;
                        const isSelected = formData.assignedToIds.includes(empId);
                        return (
                          <div
                            key={empId}
                            onClick={() => {
                              if (modalMode === "edit") {
                                setFormData({ ...formData, assignedToIds: [empId] });
                              } else {
                                setFormData({
                                  ...formData,
                                  assignedToIds: isSelected
                                    ? formData.assignedToIds.filter((id: string) => id !== empId)
                                    : [...formData.assignedToIds, empId]
                                });
                              }
                            }}
                            className={`flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-all border ${isSelected ? 'bg-[var(--color-primary-lighter)] border-[var(--color-primary-light)]' : 'bg-white border-transparent hover:border-gray-200 hover:bg-white shadow-sm'}`}
                          >
                            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 shadow-sm ${isSelected ? 'bg-[var(--color-primary)] text-white' : 'bg-gray-100 text-gray-500'}`}>
                              {isSelected ? <Check size={14} /> : emp.employeeName?.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm font-bold truncate ${isSelected ? 'text-[var(--color-primary-darker)]' : 'text-gray-800'}`}>{emp.employeeName}</p>
                              <p className={`text-xs truncate ${isSelected ? 'text-[var(--color-primary)]' : 'text-gray-400'}`}>{emp.Email}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* ---------------- RIGHT WORKSPACE (FORM) ---------------- */}
              <div className="flex-1 flex flex-col min-w-0 relative h-full">
                <form onSubmit={handleSubmit} className="flex flex-col h-full">

                  <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6 space-y-6">

                    {/* MOBILE-ONLY: Selected Teammates & Add Button */}
                    <div className="md:hidden space-y-2">
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                        {modalMode === "create" ? "Assign To Employee(s) *" : "Assign To Employee *"}
                      </label>
                      <div className="flex flex-wrap items-center gap-1.5 bg-gray-50 p-3 rounded-xl border border-gray-200">
                        {formData.assignedToIds.map((id: string) => {
                          const emp = employees.find(e => (e.id || e._id) === id);
                          if (!emp) return null;
                          return (
                            <span key={id} className="inline-flex items-center gap-1 text-xs font-bold bg-[var(--color-primary-lighter)] text-[var(--color-primary-dark)] pl-2.5 pr-1.5 py-1 rounded-full">
                              {emp.employeeName}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setFormData({ ...formData, assignedToIds: formData.assignedToIds.filter((empId: string) => empId !== id) });
                                }}
                                className="hover:bg-[var(--color-primary-light)] rounded-full p-0.5 cursor-pointer ml-1"
                              >
                                <X size={11} />
                              </button>
                            </span>
                          );
                        })}
                        <button
                          type="button"
                          onClick={() => setOpenDropdown('form-emp')}
                          className="inline-flex items-center gap-1 text-xs font-bold text-gray-500 hover:text-[var(--color-primary)] border border-dashed border-gray-300 hover:border-[var(--color-primary-light)] px-2.5 py-1 rounded-full transition-colors cursor-pointer"
                        >
                          <UserPlus size={12} /> {formData.assignedToIds.length ? "Add" : "Add teammates"}
                        </button>
                      </div>
                    </div>

                    {/* MOBILE-ONLY: Client Picker */}
                    <div className="md:hidden space-y-1.5 custom-dropdown-container relative">
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Client / Project</label>
                      <div
                        onClick={() => setOpenDropdown(openDropdown === 'form-client-mobile' ? null : 'form-client-mobile')}
                        className={`w-full px-4 py-2.5 cursor-pointer rounded-xl border ${openDropdown === 'form-client-mobile' ? 'border-[var(--color-primary)] ring-1 ring-[var(--color-primary-light)]' : 'border-gray-200'} flex items-center justify-between bg-white transition-all`}
                      >
                        <span className={`text-sm ${selectedFormClient ? 'font-bold text-gray-900' : 'text-gray-500'}`}>
                          {selectedFormClient ? selectedFormClient.customerName : "Select Client (Optional)"}
                        </span>
                        {selectedFormClient ? (
                          <X size={14} className="text-gray-400 hover:text-red-500 cursor-pointer" onClick={(e) => { e.stopPropagation(); setFormData({ ...formData, customerId: null }); }} />
                        ) : (
                          <ChevronDown size={14} className="text-gray-400 shrink-0" />
                        )}
                      </div>
                      {openDropdown === 'form-client-mobile' && (
                        <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 left-0">
                          <div className="p-2 border-b border-gray-100 bg-gray-50">
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg border border-gray-200 focus-within:border-[var(--color-primary)] transition-all">
                              <Search size={14} className="text-gray-400" />
                              <input
                                type="text" placeholder="Search clients..."
                                value={formClientSearchQuery} onChange={(e) => setFormClientSearchQuery(e.target.value)}
                                className="w-full text-sm outline-none border-none bg-transparent" autoFocus
                              />
                            </div>
                          </div>
                          <div className="max-h-48 overflow-y-auto p-1 custom-scrollbar">
                            {formFilteredClients.map(cli => (
                              <div
                                key={cli.id || cli._id}
                                onClick={() => { setFormData({ ...formData, customerId: (cli.id || cli._id) as string }); setOpenDropdown(null); }}
                                className={`px-3 py-2 text-sm rounded-lg cursor-pointer transition-colors ${formData.customerId === (cli.id || cli._id) ? 'bg-[var(--color-primary-lighter)] text-[var(--color-primary-dark)] font-bold' : 'hover:bg-gray-50 text-gray-700'}`}
                              >
                                {cli.customerName}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Task Title *</label>
                      <input
                        type="text" required
                        value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] outline-none text-sm transition-all"
                        placeholder="e.g. Prepare Monthly Report"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      {/* Priority */}
                      <div className="relative custom-dropdown-container">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Priority</label>
                        <div
                          onClick={() => setOpenDropdown(openDropdown === 'form-priority' ? null : 'form-priority')}
                          className={`w-full px-4 py-2.5 cursor-pointer rounded-xl border ${openDropdown === 'form-priority' ? 'border-[var(--color-primary)] ring-1 ring-[var(--color-primary-light)]' : 'border-gray-200'} flex items-center justify-between bg-white transition-all`}
                        >
                          <span className="text-sm font-medium text-gray-900">{priorityLabels[formData.priority as string] || "Medium"}</span>
                          <ChevronDown size={14} className={`text-gray-400 transition-transform ${openDropdown === 'form-priority' ? 'rotate-180 text-[var(--color-primary)]' : ''}`} />
                        </div>
                        {openDropdown === 'form-priority' && (
                          <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden p-1 animate-in fade-in slide-in-from-top-2">
                            {["low", "medium", "high", "urgent"].map(p => (
                              <div
                                key={p}
                                onClick={() => { setFormData({ ...formData, priority: p as TaskPriority }); setOpenDropdown(null); }}
                                className={`px-3 py-2 cursor-pointer text-sm rounded-lg transition-colors ${formData.priority === p ? 'bg-[var(--color-primary-lighter)] text-[var(--color-primary-dark)] font-bold' : 'hover:bg-gray-50 text-gray-700'}`}
                              >
                                {priorityLabels[p]}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Due Date</label>
                        <input
                          type="date"
                          value={formData.dueDate} onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
                          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] outline-none text-sm text-gray-700 bg-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Description</label>
                      <textarea
                        rows={3}
                        value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] outline-none text-sm resize-none"
                        placeholder="Provide any additional details or links..."
                      />
                    </div>

                    {/* AI MAGIC GENERATE SECTION */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Subtasks Checklist</label>
                        <button
                          type="button"
                          onClick={handleMagicGenerate}
                          disabled={isGeneratingAI || !formData.title || formData.assignedToIds.length === 0}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-lg hover:shadow-lg hover:shadow-purple-500/30 transition-all disabled:opacity-50 disabled:hover:shadow-none cursor-pointer"
                        >
                          {isGeneratingAI ? <Loader2 size={14} className="animate-spin" /> :
                            <div className="overflow-hidden w-4 h-4 rounded-full bg-white">
                              <img src="/taskbot.png" className="h-full w-full object-cover" />
                            </div>
                          }
                          {isGeneratingAI ? "Thinking..." : "Magic Generate"}
                        </button>
                      </div>

                      {formSubTasks.length > 0 && (
                        <div className="space-y-2 bg-purple-50/50 p-3 rounded-xl border border-purple-100/50 animate-in fade-in slide-in-from-top-2">
                          {formSubTasks.map((st, index) => (
                            <div key={index} className="flex items-start gap-2 bg-white p-2.5 rounded-lg border border-purple-100 shadow-sm relative group transition-all focus-within:ring-1 focus-within:ring-purple-300">
                              <div className="mt-1">
                                <Sparkles size={14} className="text-purple-400" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <input
                                  type="text"
                                  value={st.title}
                                  onChange={(e) => {
                                    const newTasks = [...formSubTasks];
                                    newTasks[index].title = e.target.value;
                                    setFormSubTasks(newTasks);
                                  }}
                                  className="w-full text-sm font-semibold text-gray-800 outline-none bg-transparent mb-1"
                                  placeholder="Subtask title..."
                                />
                                <textarea
                                  rows={1}
                                  value={st.description || ""}
                                  onChange={(e) => {
                                    const newTasks = [...formSubTasks];
                                    newTasks[index].description = e.target.value;
                                    setFormSubTasks(newTasks);
                                  }}
                                  placeholder="Optional instructions..."
                                  className="w-full text-xs text-gray-500 outline-none bg-transparent resize-none overflow-hidden"
                                />
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  const newTasks = formSubTasks.filter((_, i) => i !== index);
                                  setFormSubTasks(newTasks);
                                }}
                                className="text-gray-300 hover:text-[var(--color-destructive)] opacity-0 group-hover:opacity-100 transition-opacity p-1 cursor-pointer"
                              >
                                <MinusCircle size={16} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => setFormSubTasks([...formSubTasks, { title: "", description: "" }])}
                        className="w-full mt-2 py-2 text-xs font-bold text-purple-600 bg-white border border-dashed border-purple-200 rounded-lg hover:bg-purple-50 transition-colors cursor-pointer"
                      >
                        + Add Subtask Manually
                      </button>
                    </div>
                  </div>

                  <div className="shrink-0 p-4 sm:p-6 border-t border-gray-100 bg-gray-50/50 flex flex-col-reverse sm:flex-row justify-end gap-3 sm:rounded-br-3xl">
                    <button type="button" onClick={() => setIsModalOpen(false)} className="w-full sm:w-auto flex items-center justify-center px-6 py-2.5 cursor-pointer text-sm font-bold text-gray-600 hover:bg-gray-200 bg-gray-100 rounded-xl transition-colors">
                      Cancel
                    </button>
                    <button type="submit" className="w-full sm:w-auto flex items-center justify-center px-6 py-2.5 cursor-pointer text-sm font-bold text-white bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] rounded-xl shadow-md transition-colors">
                      {modalMode === "create" ? "Assign Task" : "Save Changes"}
                    </button>
                  </div>
                </form>
              </div>

              {/* MOBILE EMPLOYEE PICKER SHEET */}
              <div
                className={`custom-dropdown-container md:hidden absolute inset-0 z-30 flex flex-col justify-end transition-opacity duration-200 ${openDropdown === 'form-emp' ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
              >
                <div className="absolute inset-0 bg-gray-900/30 backdrop-blur-sm" onClick={() => setOpenDropdown(null)} />
                <div className={`relative bg-white rounded-t-3xl shadow-2xl border-t border-gray-200 flex flex-col max-h-[85%] transition-transform duration-300 ${openDropdown === 'form-emp' ? "translate-y-0" : "translate-y-full"}`}>
                  <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-gray-100 shrink-0">
                    <div>
                      <h3 className="text-sm font-extrabold text-gray-900">Assign to</h3>
                      <p className="text-xs text-gray-400">{formData.assignedToIds.length} selected</p>
                    </div>
                    <button onClick={() => setOpenDropdown(null)} className="text-gray-400 hover:text-gray-700 p-1.5 rounded-lg hover:bg-gray-100 cursor-pointer">
                      <ChevronDown size={20} />
                    </button>
                  </div>
                  <div className="px-5 py-3 shrink-0">
                    <div className="relative">
                      <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search teammates..."
                        value={formEmpSearchQuery}
                        onChange={(e) => setFormEmpSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-1 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] outline-none transition-all"
                      />
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto custom-scrollbar px-3 pb-3">
                    {formFilteredEmployees.length === 0 ? (
                      <div className="text-center py-8 text-sm text-gray-400">No teammates found.</div>
                    ) : (
                      <div className="space-y-1">
                        {formFilteredEmployees.map(emp => {
                          const empId = (emp.id || emp._id) as string;
                          const isSelected = formData.assignedToIds.includes(empId);
                          return (
                            <div
                              key={empId}
                              onClick={() => {
                                if (modalMode === "edit") {
                                  setFormData({ ...formData, assignedToIds: [empId] });
                                  setOpenDropdown(null);
                                } else {
                                  setFormData({
                                    ...formData,
                                    assignedToIds: isSelected
                                      ? formData.assignedToIds.filter((id: string) => id !== empId)
                                      : [...formData.assignedToIds, empId]
                                  });
                                }
                              }}
                              className={`flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-all border ${isSelected ? 'bg-[var(--color-primary-lighter)] border-[var(--color-primary-light)]' : 'bg-white border-transparent hover:border-gray-200 hover:bg-white shadow-sm'}`}
                            >
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${isSelected ? 'bg-[var(--color-primary)] text-white' : 'bg-gray-100 text-gray-500'}`}>
                                {isSelected ? <Check size={14} /> : emp.employeeName?.charAt(0).toUpperCase()}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className={`text-sm font-bold truncate ${isSelected ? 'text-[var(--color-primary-darker)]' : 'text-gray-800'}`}>{emp.employeeName}</p>
                                <p className={`text-xs truncate ${isSelected ? 'text-[var(--color-primary)]' : 'text-gray-400'}`}>{emp.Email}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-between gap-3 px-5 py-3 border-t border-gray-100 shrink-0" style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, assignedToIds: [] })}
                      disabled={formData.assignedToIds.length === 0}
                      className="text-xs font-bold text-gray-400 hover:text-[var(--color-destructive)] disabled:opacity-40 cursor-pointer"
                    >
                      Clear all
                    </button>
                    <button
                      type="button"
                      onClick={() => setOpenDropdown(null)}
                      className="px-6 py-2.5 text-sm font-bold text-white bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] rounded-xl shadow-sm transition-colors cursor-pointer"
                    >
                      Done{formData.assignedToIds.length > 0 ? ` (${formData.assignedToIds.length})` : ""}
                    </button>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. ANALYTICS VIEW TASK DASHBOARD MODAL                    */}
      {/* ========================================================= */}
      {isViewModalOpen && viewTaskData && (() => {

        const displayedSubtasks = viewTaskData.subTasks?.filter(st => viewSubtaskFilter === "all" || st.status === viewSubtaskFilter) || [];

        return (
          <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[90vh]">

              <div className=" px-2 sm:px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/80">
                <div className="flex items-center gap-2">
                  <Activity size={20} className="text-[var(--color-primary)]" />
                  <h2 className="text-lg font-extrabold text-gray-900">Task Analytics Dashboard</h2>
                </div>
                <button onClick={() => setIsViewModalOpen(false)} className="text-gray-400 cursor-pointer hover:text-gray-700 bg-white shadow-sm p-1.5 rounded-lg border border-gray-200 transition-colors">
                  <X size={18} />
                </button>
              </div>

              <div className=" p-3 sm:p-5 sm:p-6 overflow-y-auto space-y-6">

                {/* Header Title & Badges */}
                <div className="">
                  <h3 className="text-2xl font-black text-gray-900">{viewTaskData.title}</h3>
                  <div className="flex flex-wrap items-center gap-2 mt-3">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] uppercase font-bold border ${viewTaskData.priority === 'urgent' ? 'bg-red-50 text-red-600 border-red-200' : viewTaskData.priority === 'high' ? 'bg-orange-50 text-orange-600 border-orange-200' : 'bg-blue-50 text-blue-600 border-blue-200'}`}>
                      Priority: {priorityLabels[viewTaskData.priority]}
                    </span>
                    {/* 🚨 ADDED CLIENT PILL */}
                    {viewTaskData.customer?.customerName && (
                      <span className="flex items-center gap-1 text-[10px] font-bold bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full border border-indigo-100">
                        <Briefcase size={12} /> {viewTaskData.customer.customerName}
                      </span>
                    )}
                  </div>
                </div>

                {/* Analytics Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                  <div className="bg-gray-50 border border-gray-100 p-4 rounded-2xl cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleUserClick(viewTaskData.assignedTo?.id || viewTaskData.assignedTo?._id || "")}>
                    <span className="block text-xs font-bold text-gray-400 uppercase">Assigned To</span>
                    <div className="text-sm font-bold text-[var(--color-primary)] mt-1 truncate hover:underline">{viewTaskData.assignedTo?.employeeName}</div>
                  </div>
                  <div className="bg-gray-50 border border-gray-100 p-4 rounded-2xl">
                    <span className="block text-xs font-bold text-gray-400 uppercase">Due Date</span>
                    <div className={`text-sm font-bold mt-1 ${viewTaskData.dueDate && new Date(viewTaskData.dueDate) < new Date() && getTaskProgress(viewTaskData) < 100 ? 'text-[var(--color-destructive)]' : 'text-gray-900'}`}>
                      {viewTaskData.dueDate ? new Date(viewTaskData.dueDate).toLocaleDateString() : "N/A"}
                    </div>
                  </div>

                  <div className="bg-[var(--color-primary-lighter)] border border-[var(--color-primary-light)] p-4 rounded-2xl col-span-2 flex flex-col justify-center relative overflow-hidden">
                    <span className="block text-xs font-bold text-[var(--color-primary-darker)] uppercase z-10">Total Progress</span>
                    <div className="flex items-end justify-between mt-1 z-10">
                      <div className="text-2xl font-black text-[var(--color-primary)]">{getTaskProgress(viewTaskData)}%</div>
                      <div className="text-xs font-bold text-[var(--color-primary-dark)]">
                        {viewTaskData.subTasks?.filter(st => st.status === 'completed').length || 0} / {viewTaskData.subTasks?.length || 0} Steps
                      </div>
                    </div>
                    <div className="absolute bottom-0 left-0 h-1.5 bg-[var(--color-primary)] transition-all" style={{ width: `${getTaskProgress(viewTaskData)}%` }} />
                  </div>
                </div>

                {/* Description */}
                {viewTaskData.description && (
                  <div>
                    <span className="block text-xs font-bold text-gray-400 uppercase mb-2">Instructions / Description</span>
                    <p className="text-sm text-gray-700 bg-gray-50 p-4 rounded-xl border border-gray-100 leading-relaxed whitespace-pre-wrap">
                      {viewTaskData.description}
                    </p>
                  </div>
                )}

                {/* Subtasks Checklist View with INTERNAL STATUS FILTER */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="block text-xs font-bold text-gray-400 uppercase">Subtasks Checklist</span>

                    {/* Inline Filter Pills for Subtasks */}
                    <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg overflow-x-auto custom-scrollbar">
                      {["all", "todo", "in_progress", "under_review", "completed"].map(s => (
                        <button
                          key={s}
                          onClick={() => setViewSubtaskFilter(s as any)}
                          className={`px-2 py-1 text-[10px] font-bold uppercase rounded-md transition-colors whitespace-nowrap ${viewSubtaskFilter === s ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                          {s.replace("_", " ")}
                        </button>
                      ))}
                    </div>
                  </div>

                  {displayedSubtasks.length > 0 ? (
                    <div className="grid gap-2">
                      {displayedSubtasks.map(sub => (
                        <div key={sub.id} className="flex items-start gap-3 p-2 sm:p-3.5 bg-white border border-gray-200 rounded-xl shadow-sm">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <span className={`block text-sm font-medium ${sub.status === 'completed' ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                                {sub.title}
                              </span>
                              {getStatusBadge(sub.status)}
                            </div>

                            {sub.description && (
                              <p className="mt-1.5 text-xs text-gray-600 bg-gray-50 p-1 sm:p-2.5 rounded-lg border border-gray-100 whitespace-pre-wrap leading-relaxed">
                                {sub.description}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-6 border border-dashed border-gray-200 rounded-xl text-center text-sm text-gray-500">
                      No subtasks match the selected filter.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ========================================================= */}
      {/* 3. DELETE CONFIRMATION MODAL                              */}
      {/* ========================================================= */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center sm:p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full max-w-sm p-6 text-center flex flex-col items-center">
            <div className="w-14 h-14 bg-[var(--color-destructive)]/10 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle size={28} className="text-[var(--color-destructive)]" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Task{taskToDelete ? "" : "s"}?</h3>
            <p className="text-sm text-gray-500 mb-6">
              Are you sure you want to delete {taskToDelete ? "this task" : `these ${selectedTasks.size} tasks`}? This action cannot be undone.
            </p>
            <div className="flex w-full gap-3">
              <button onClick={() => setIsDeleteModalOpen(false)} className="flex-1 py-2.5 cursor-pointer bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-sm rounded-xl">
                Cancel
              </button>
              <button onClick={executeDelete} className="flex-1 py-2.5 cursor-pointer bg-[var(--color-destructive)] hover:bg-red-600 text-white font-bold text-sm rounded-xl shadow-md">
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 🤖 AI TASK WORKSPACE — chat-style assign flow             */}
      {/* ========================================================= */}
      {isAIModalOpen && (() => {
        const selectedAiEmployees = employees.filter(emp => aiAssignedToIds.includes((emp.id || emp._id) as string));
        const selectedAiClient = clients.find(cli => (cli.id || cli._id) === aiSelectedClient); // 🚨 NEW

        const hasResult = !!aiResponseSummary;
        const summary = aiResponseSummary ? normalizeAiSummary(aiResponseSummary) : null;

        const submitPrompt = async () => {
          if (!aiPrompt.trim() || aiAssignedToIds.length === 0) {
            toast.error("Select at least one teammate and write a prompt.");
            return;
          }
          setIsAIAssigning(true);
          const res = await assignAdminTaskViaAI({
            prompt: aiPrompt,
            assignedToIds: aiAssignedToIds,
            customerId: aiSelectedClient // 🚨 NEW
          });
          setIsAIAssigning(false);
          if (res?.success) {
            setAiResponseSummary(res.aiSummary || { overview: "Task assigned successfully, but the AI did not provide a summary." });
            fetchFilteredTasks();
          }
        };

        return (
          <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center sm:p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-200">
            {/* WIDE MODAL ON PC, FULL SCREEN ON MOBILE */}
            <div className="bg-white sm:rounded-3xl shadow-2xl border-0 sm:border sm:border-[var(--color-primary-light)] w-full sm:max-w-2xl md:max-w-5xl lg:max-w-6xl h-[100dvh] sm:h-[90vh] xl:h-[85vh] flex flex-col relative overflow-hidden">

              {/* Header */}
              <div className="px-4 sm:px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/80 shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="overflow-hidden w-10 h-10 rounded-full shrink-0 ring-2 ring-white shadow-sm bg-white">
                    <img src="/taskbot.png" className="h-full w-full object-cover" alt="AI Agent" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-lg sm:text-xl font-extrabold text-gray-900 leading-tight">AI Task Manager</h2>
                    <p className="text-xs text-gray-500 font-medium truncate">Tell it what to do — it drafts the task, subtasks, and a summary.</p>
                  </div>
                </div>
                <button onClick={() => setIsAIModalOpen(false)} className="text-gray-400 hover:text-[var(--color-primary)] hover:bg-[var(--color-primary-lighter)] p-2 rounded-lg transition-colors cursor-pointer shrink-0">
                  <X size={22} />
                </button>
              </div>

              {/* SPLIT LAYOUT CONTAINER */}
              <div className="flex flex-1 overflow-hidden bg-white">

                {/* ---------------- PC LEFT SIDEBAR ---------------- */}
                <div className="hidden md:flex flex-col w-[320px] lg:w-[380px] shrink-0 border-r border-gray-100 bg-gray-50/50 h-full">

                  {/* Client / Project Picker */}
                  <div className="p-5 border-b border-gray-100 bg-white shrink-0">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="text-sm font-extrabold text-gray-900 flex items-center gap-1.5"><Briefcase size={14} /> Client Project</h3>
                    </div>
                    <div className="relative custom-dropdown-container">
                      <div
                        onClick={() => setOpenDropdown(openDropdown === 'ai-client' ? null : 'ai-client')}
                        className={`w-full px-3 py-2.5 cursor-pointer rounded-xl border ${openDropdown === 'ai-client' ? 'border-[var(--color-primary)] ring-1 ring-[var(--color-primary-light)]' : 'border-gray-200'} flex items-center justify-between bg-white transition-all`}
                      >
                        <span className={`text-sm truncate ${selectedAiClient ? 'text-gray-900 font-bold' : 'text-gray-500'}`}>
                          {selectedAiClient ? selectedAiClient.customerName : "Select Client (Optional)"}
                        </span>
                        {selectedAiClient ? (
                          <X size={14} className="text-gray-400 hover:text-red-500 cursor-pointer" onClick={(e) => { e.stopPropagation(); setAiSelectedClient(null); }} />
                        ) : (
                          <ChevronDown size={14} className="text-gray-400 shrink-0" />
                        )}
                      </div>

                      {openDropdown === 'ai-client' && (
                        <div className="absolute z-40 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 left-0">
                          <div className="p-2 border-b border-gray-100 bg-gray-50">
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg border border-gray-200 focus-within:border-[var(--color-primary)] transition-all">
                              <Search size={14} className="text-gray-400" />
                              <input
                                type="text" placeholder="Search clients..."
                                value={formClientSearchQuery} onChange={(e) => setFormClientSearchQuery(e.target.value)}
                                className="w-full text-sm outline-none border-none bg-transparent" autoFocus
                              />
                            </div>
                          </div>
                          <div className="max-h-48 overflow-y-auto p-1 custom-scrollbar">
                            {formFilteredClients.map(cli => (
                              <div
                                key={cli.id || cli._id}
                                onClick={() => { setAiSelectedClient((cli.id || cli._id) as string); setOpenDropdown(null); }}
                                className={`px-3 py-2 text-sm rounded-lg cursor-pointer transition-colors ${aiSelectedClient === (cli.id || cli._id) ? 'bg-[var(--color-primary-lighter)] text-[var(--color-primary-dark)] font-bold' : 'hover:bg-gray-50 text-gray-700'}`}
                              >
                                {cli.customerName}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="p-5 border-b border-gray-100 bg-gray-50/30 shrink-0">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="text-sm font-extrabold text-gray-900">Assign To</h3>
                      <span className="text-xs font-bold bg-[var(--color-primary-lighter)] text-[var(--color-primary-dark)] px-2 py-0.5 rounded-md">
                        {aiAssignedToIds.length} Selected
                      </span>
                    </div>
                    <div className="relative">
                      <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search teammates..."
                        value={aiEmpSearch}
                        onChange={(e) => setAiEmpSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-1 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] outline-none transition-all"
                      />
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto custom-scrollbar p-3">
                    {aiFilteredEmployees.length === 0 ? (
                      <div className="text-center py-8 text-sm text-gray-400">No teammates found.</div>
                    ) : (
                      <div className="space-y-1.5">
                        {aiFilteredEmployees.map(emp => {
                          const empId = (emp.id || emp._id) as string;
                          const isSelected = aiAssignedToIds.includes(empId);
                          return (
                            <div
                              key={empId}
                              onClick={() => toggleAiEmp(empId)}
                              className={`flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-all border ${isSelected ? 'bg-[var(--color-primary-lighter)] border-[var(--color-primary-light)]' : 'bg-white border-transparent hover:border-gray-200 hover:bg-white shadow-sm'}`}
                            >
                              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 shadow-sm ${isSelected ? 'bg-[var(--color-primary)] text-white' : 'bg-gray-100 text-gray-500'}`}>
                                {isSelected ? <Check size={14} /> : emp.employeeName?.charAt(0).toUpperCase()}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className={`text-sm font-bold truncate ${isSelected ? 'text-[var(--color-primary-darker)]' : 'text-gray-800'}`}>{emp.employeeName}</p>
                                <p className={`text-xs truncate ${isSelected ? 'text-[var(--color-primary)]' : 'text-gray-400'}`}>{emp.Email}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    {employees.length > 20 && !aiEmpSearch && (
                      <div className="text-center py-4 text-xs text-gray-400 font-medium">Showing top 20 — search to find more.</div>
                    )}
                  </div>
                </div>

                {/* ---------------- RIGHT WORKSPACE ---------------- */}
                <div className="flex-1 flex flex-col min-w-0 relative h-full">

                  {/* Chat thread */}
                  <div className="flex-1 overflow-y-auto custom-scrollbar px-4 sm:px-6 py-5 space-y-4 bg-gray-50/40">

                    {/* Assistant greeting */}
                    <div className="flex items-start gap-2.5 max-w-[92%] sm:max-w-[85%]">
                      <div className="overflow-hidden w-7 h-7 rounded-full shrink-0 mt-0.5">
                        <img src="/taskbot.png" className="h-full w-full object-cover" />
                      </div>
                      <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                        <p className="text-sm text-gray-700 leading-relaxed">
                          <span className="md:hidden">Pick who you're assigning this to, then describe the task in plain language</span>
                          <span className="hidden md:inline">Select teammates (and a client) from the left menu, then describe the task in plain language</span>
                          — due dates, priority, and scope all work.
                        </p>
                      </div>
                    </div>

                    {/* User's submitted prompt, once sent */}
                    {(isAIAssigning || hasResult) && (
                      <div className="flex flex-col items-end gap-1.5 ml-auto max-w-[92%] sm:max-w-[85%]">
                        <div className="flex flex-wrap justify-end gap-1.5">
                          {selectedAiClient && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 px-2 py-1 rounded-full">
                              <Briefcase size={10} /> {selectedAiClient.customerName}
                            </span>
                          )}
                          {selectedAiEmployees.length > 0 && selectedAiEmployees.map(emp => (
                            <span key={emp.id || emp._id} className="inline-flex items-center gap-1 text-[11px] font-bold bg-[var(--color-primary-lighter)] text-[var(--color-primary-dark)] px-2 py-1 rounded-full">
                              <User size={10} /> {emp.employeeName}
                            </span>
                          ))}
                        </div>
                        <div className="bg-[var(--color-primary)] text-white rounded-2xl rounded-tr-sm px-4 py-3 shadow-sm">
                          <p className="text-sm leading-relaxed whitespace-pre-wrap">{aiPrompt}</p>
                        </div>
                      </div>
                    )}

                    {/* Thinking indicator */}
                    {isAIAssigning && (
                      <div className="flex items-start gap-2.5 max-w-[92%] sm:max-w-[85%]">
                        <div className="overflow-hidden w-7 h-7 rounded-full shrink-0 mt-0.5">
                          <img src="/taskbot.png" className="h-full w-full object-cover" />
                        </div>
                        <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-4 py-3.5 shadow-sm flex items-center gap-2.5">
                          <span className="flex gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary)] animate-bounce [animation-delay:-0.3s]" />
                            <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary)] animate-bounce [animation-delay:-0.15s]" />
                            <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary)] animate-bounce" />
                          </span>
                          <span className="text-xs font-semibold text-gray-500">Drafting the task &amp; subtasks…</span>
                        </div>
                      </div>
                    )}

                    {/* Structured AI response */}
                    {hasResult && summary && (
                      <div className="flex items-start gap-2.5 max-w-[95%] sm:max-w-[90%] animate-in fade-in slide-in-from-bottom-1 duration-300">
                        <div className="overflow-hidden w-7 h-7 rounded-full shrink-0 mt-0.5">
                          <img src="/taskbot.png" className="h-full w-full object-cover" />
                        </div>
                        <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm shadow-sm overflow-hidden w-full">
                          <div className="flex items-center gap-2 px-4 py-2.5 bg-emerald-50 border-b border-emerald-100">
                            <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
                            <span className="text-xs font-bold text-emerald-700">
                              Assigned to {selectedAiEmployees.length} {selectedAiEmployees.length === 1 ? "person" : "people"}
                            </span>
                          </div>
                          <div className="p-4 space-y-3.5">
                            {summary.overview && (
                              <p className="text-sm text-gray-800 leading-relaxed font-medium">{summary.overview}</p>
                            )}

                            {!!summary.rationale?.length && (
                              <div className="bg-[var(--color-primary-lighter)]/60 rounded-xl p-3">
                                <div className="flex items-center gap-1.5 mb-2 text-[11px] font-bold text-[var(--color-primary-darker)] uppercase tracking-wider">
                                  <Lightbulb size={13} /> Why this approach
                                </div>
                                <ul className="space-y-1.5">
                                  {summary.rationale.map((point, i) => (
                                    <li key={i} className="text-xs text-gray-700 leading-relaxed flex gap-2">
                                      <span className="text-[var(--color-primary)] mt-0.5">•</span>
                                      <span>{point}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {!!summary.highlights?.length && (
                              <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                                <div className="flex items-center gap-1.5 mb-2 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                                  <ListChecks size={13} /> Key highlights
                                </div>
                                <ul className="space-y-1.5">
                                  {summary.highlights.map((point, i) => (
                                    <li key={i} className="text-xs text-gray-700 leading-relaxed flex gap-2">
                                      <span className="text-[var(--color-primary)] mt-0.5">•</span>
                                      <span>{point}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {!!summary.objectives?.length && (
                              <div className="bg-orange-50/60 rounded-xl p-3 border border-orange-100/60">
                                <div className="flex items-center gap-1.5 mb-2 text-[11px] font-bold text-orange-700 uppercase tracking-wider">
                                  <Target size={13} /> Team objectives
                                </div>
                                <ul className="space-y-1.5">
                                  {summary.objectives.map((point, i) => (
                                    <li key={i} className="text-xs text-gray-700 leading-relaxed flex gap-2">
                                      <span className="text-orange-500 mt-0.5">•</span>
                                      <span>{point}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Footer: composer, or post-result actions */}
                  <div className="shrink-0 border-t border-gray-100 bg-white" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
                    {hasResult ? (
                      <div className="p-4 sm:p-5 flex flex-col-reverse sm:flex-row items-center justify-end gap-3">
                        <button
                          onClick={() => {
                            setAiPrompt("");
                            setAiResponseSummary(null);
                          }}
                          className="w-full sm:w-auto px-5 py-2.5 text-sm font-bold text-gray-500 hover:text-[var(--color-primary)] bg-gray-50 hover:bg-[var(--color-primary-lighter)] rounded-xl transition-colors cursor-pointer"
                        >
                          Assign Another
                        </button>
                        <button
                          onClick={() => setIsAIModalOpen(false)}
                          className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-gray-900 hover:bg-black rounded-xl shadow-md transition-all cursor-pointer"
                        >
                          <CheckCircle2 size={18} /> Done
                        </button>
                      </div>
                    ) : (
                      <div className="p-3 sm:p-4 space-y-2.5">

                        {/* Selected-teammate chips + add button */}
                        <div className="flex flex-wrap items-center gap-1.5">
                          {selectedAiEmployees.map(emp => {
                            const empId = (emp.id || emp._id) as string;
                            return (
                              <span key={empId} className="inline-flex items-center gap-1 text-xs font-bold bg-[var(--color-primary-lighter)] text-[var(--color-primary-dark)] pl-2.5 pr-1.5 py-1 rounded-full">
                                {emp.employeeName}
                                <button type="button" onClick={() => toggleAiEmp(empId)} className="hover:bg-[var(--color-primary-light)] rounded-full p-0.5 cursor-pointer">
                                  <X size={11} />
                                </button>
                              </span>
                            );
                          })}

                          {/* MOBILE ONLY: Add Teammates Button */}
                          <button
                            type="button"
                            onClick={() => setIsAiPickerOpen(true)}
                            className="md:hidden inline-flex items-center gap-1 text-xs font-bold text-gray-500 hover:text-[var(--color-primary)] border border-dashed border-gray-300 hover:border-[var(--color-primary-light)] px-2.5 py-1 rounded-full transition-colors cursor-pointer"
                          >
                            <UserPlus size={12} /> {selectedAiEmployees.length ? "Add" : "Add teammates"}
                          </button>

                          {/* PC Context helper */}
                          {selectedAiEmployees.length === 0 && (
                            <span className="hidden md:inline-flex text-xs font-semibold text-gray-400 ml-1">
                              ← Select employees from the sidebar
                            </span>
                          )}
                        </div>

                        {/* Composer */}
                        <div className="flex items-end gap-2 bg-gray-50 border border-gray-200 rounded-2xl p-1.5 focus-within:border-[var(--color-primary)] focus-within:ring-1 focus-within:ring-[var(--color-primary)] transition-all">
                          <textarea
                            ref={aiTextareaRef}
                            value={aiPrompt}
                            onChange={(e) => {
                              setAiPrompt(e.target.value);
                              const el = aiTextareaRef.current;
                              if (el) {
                                el.style.height = "auto";
                                el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
                              }
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                if (!isAIAssigning) submitPrompt();
                              }
                            }}
                            rows={1}
                            placeholder="e.g. Draft the Q3 marketing strategy, analyze competitor ad spend, high priority, due Friday…"
                            className="flex-1 bg-transparent outline-none border-none resize-none text-sm text-gray-800 placeholder:text-gray-400 px-2.5 py-2 max-h-[140px] leading-relaxed"
                          />
                          <button
                            onClick={submitPrompt}
                            disabled={isAIAssigning || !aiPrompt.trim() || aiAssignedToIds.length === 0}
                            className="shrink-0 flex items-center justify-center w-9 h-9 rounded-xl bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-dark)] disabled:opacity-40 disabled:hover:bg-[var(--color-primary)] transition-all cursor-pointer"
                            title="Send"
                          >
                            {isAIAssigning ? <Loader2 size={16} className="animate-spin" /> : <SendHorizontal size={16} />}
                          </button>
                        </div>
                        <p className="text-[11px] text-gray-400 px-1">Enter to send • Shift + Enter for a new line</p>
                      </div>
                    )}
                  </div>

                  {/* MOBILE EMPLOYEE PICKER SHEET */}
                  <div
                    className={`custom-dropdown-container md:hidden absolute inset-0 z-30 flex flex-col justify-end transition-opacity duration-200 ${isAiPickerOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
                  >
                    <div className="absolute inset-0 bg-gray-900/30 backdrop-blur-sm" onClick={() => setIsAiPickerOpen(false)} />
                    <div className={`relative bg-white rounded-t-3xl shadow-2xl border-t border-gray-200 flex flex-col max-h-[85%] transition-transform duration-300 ${isAiPickerOpen ? "translate-y-0" : "translate-y-full"}`}>

                      {/* Mobile Client Picker */}
                      <div className="p-4 border-b border-gray-100 bg-white shrink-0">
                        <div className="flex justify-between items-center mb-2">
                          <h3 className="text-sm font-extrabold text-gray-900 flex items-center gap-1.5"><Briefcase size={14} /> Client Project</h3>
                        </div>
                        <div className="relative custom-dropdown-container">
                          <div
                            onClick={() => setOpenDropdown(openDropdown === 'ai-client-mobile' ? null : 'ai-client-mobile')}
                            className={`w-full px-3 py-2 cursor-pointer rounded-xl border ${openDropdown === 'ai-client-mobile' ? 'border-[var(--color-primary)] ring-1 ring-[var(--color-primary-light)]' : 'border-gray-200'} flex items-center justify-between bg-white transition-all`}
                          >
                            <span className={`text-sm truncate ${selectedAiClient ? 'text-gray-900 font-bold' : 'text-gray-500'}`}>
                              {selectedAiClient ? selectedAiClient.customerName : "Select Client (Optional)"}
                            </span>
                            {selectedAiClient ? (
                              <X size={14} className="text-gray-400 hover:text-red-500 cursor-pointer" onClick={(e) => { e.stopPropagation(); setAiSelectedClient(null); }} />
                            ) : (
                              <ChevronDown size={14} className="text-gray-400 shrink-0" />
                            )}
                          </div>

                          {openDropdown === 'ai-client-mobile' && (
                            <div className="absolute z-40 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 left-0">
                              <div className="p-2 border-b border-gray-100 bg-gray-50">
                                <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg border border-gray-200 focus-within:border-[var(--color-primary)] transition-all">
                                  <Search size={14} className="text-gray-400" />
                                  <input
                                    type="text" placeholder="Search clients..."
                                    value={formClientSearchQuery} onChange={(e) => setFormClientSearchQuery(e.target.value)}
                                    className="w-full text-sm outline-none border-none bg-transparent" autoFocus
                                  />
                                </div>
                              </div>
                              <div className="max-h-40 overflow-y-auto p-1 custom-scrollbar">
                                {formFilteredClients.map(cli => (
                                  <div
                                    key={cli.id || cli._id}
                                    onClick={() => { setAiSelectedClient((cli.id || cli._id) as string); setOpenDropdown(null); }}
                                    className={`px-3 py-2 text-sm rounded-lg cursor-pointer transition-colors ${aiSelectedClient === (cli.id || cli._id) ? 'bg-[var(--color-primary-lighter)] text-[var(--color-primary-dark)] font-bold' : 'hover:bg-gray-50 text-gray-700'}`}
                                  >
                                    {cli.customerName}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 shrink-0">
                        <div>
                          <h3 className="text-sm font-extrabold text-gray-900">Assign to</h3>
                          <p className="text-xs text-gray-400">{aiAssignedToIds.length} selected</p>
                        </div>
                        <button onClick={() => setIsAiPickerOpen(false)} className="text-gray-400 hover:text-gray-700 p-1.5 rounded-lg hover:bg-gray-100 cursor-pointer">
                          <ChevronDown size={20} />
                        </button>
                      </div>
                      <div className="px-5 py-3 shrink-0">
                        <div className="relative">
                          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                          <input
                            type="text"
                            placeholder="Search teammates..."
                            value={aiEmpSearch}
                            onChange={(e) => setAiEmpSearch(e.target.value)}
                            className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-1 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] outline-none transition-all"
                          />
                        </div>
                      </div>
                      <div className="flex-1 overflow-y-auto custom-scrollbar px-3 pb-3">
                        {aiFilteredEmployees.length === 0 ? (
                          <div className="text-center py-8 text-sm text-gray-400">No teammates found.</div>
                        ) : (
                          <div className="space-y-1">
                            {aiFilteredEmployees.map(emp => {
                              const empId = (emp.id || emp._id) as string;
                              const isSelected = aiAssignedToIds.includes(empId);
                              return (
                                <div
                                  key={empId}
                                  onClick={() => toggleAiEmp(empId)}
                                  className={`flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-all border ${isSelected ? 'bg-[var(--color-primary-lighter)] border-[var(--color-primary-light)]' : 'bg-white border-transparent hover:border-gray-200 hover:bg-white shadow-sm'}`}
                                >
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${isSelected ? 'bg-[var(--color-primary)] text-white' : 'bg-gray-100 text-gray-500'}`}>
                                    {isSelected ? <Check size={14} /> : emp.employeeName?.charAt(0).toUpperCase()}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className={`text-sm font-bold truncate ${isSelected ? 'text-[var(--color-primary-darker)]' : 'text-gray-800'}`}>{emp.employeeName}</p>
                                    <p className={`text-xs truncate ${isSelected ? 'text-[var(--color-primary)]' : 'text-gray-400'}`}>{emp.Email}</p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center justify-between gap-3 px-5 py-3 border-t border-gray-100 shrink-0" style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}>
                        <button
                          onClick={() => setAiAssignedToIds([])}
                          disabled={aiAssignedToIds.length === 0}
                          className="text-xs font-bold text-gray-400 hover:text-[var(--color-destructive)] disabled:opacity-40 cursor-pointer"
                        >
                          Clear all
                        </button>
                        <button
                          onClick={() => setIsAiPickerOpen(false)}
                          className="px-6 py-2.5 text-sm font-bold text-white bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] rounded-xl shadow-sm transition-colors cursor-pointer"
                        >
                          Done{aiAssignedToIds.length > 0 ? ` (${aiAssignedToIds.length})` : ""}
                        </button>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </div>
        );
      })()}


      {/* ========================================================= */}
      {/* 🚨 NEW: ASSIGN MORE EMPLOYEES MODAL                       */}
      {/* ========================================================= */}
      {isAssignMoreOpen && assignMoreGroup && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md flex flex-col overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <UserPlus size={18} className="text-[var(--color-primary)]" /> Assign More Employees
              </h3>
              <button onClick={() => setIsAssignMoreOpen(false)} className="text-gray-400 hover:bg-gray-200 p-1.5 rounded-lg cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <div className="p-4 flex-1 overflow-y-auto max-h-[60vh] custom-scrollbar">
              <div className="relative mb-4">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text" placeholder="Search available employees..."
                  value={assignMoreSearch} onChange={e => setAssignMoreSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-[var(--color-primary)] transition-all"
                />
              </div>

              <div className="space-y-1.5">
                {(() => {
                  const existingIds = new Set(assignMoreGroup.tasks.map(t => t.assignedToId));
                  const availableEmps = employees.filter(emp => !existingIds.has((emp.id || emp._id) as string) && (emp.employeeName.toLowerCase().includes(assignMoreSearch.toLowerCase()) || emp.Email.toLowerCase().includes(assignMoreSearch.toLowerCase())));

                  if (availableEmps.length === 0) return <p className="text-center text-sm text-gray-500 py-4">No available employees found.</p>;

                  return availableEmps.map(emp => {
                    const empId = (emp.id || emp._id) as string;
                    const isSelected = assignMoreSelectedIds.includes(empId);
                    return (
                      <div key={empId} onClick={() => {
                        setAssignMoreSelectedIds(prev => isSelected ? prev.filter(id => id !== empId) : [...prev, empId]);
                      }} className={`flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-all border ${isSelected ? 'bg-[var(--color-primary-lighter)] border-[var(--color-primary-light)]' : 'bg-white border-transparent hover:border-gray-200 shadow-sm'}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${isSelected ? 'bg-[var(--color-primary)] text-white' : 'bg-gray-100 text-gray-500'}`}>
                          {isSelected ? <Check size={14} /> : emp.employeeName?.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-bold truncate ${isSelected ? 'text-[var(--color-primary-darker)]' : 'text-gray-800'}`}>{emp.employeeName}</p>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>

            <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3">
              <button onClick={() => setIsAssignMoreOpen(false)} className="px-5 py-2 text-sm font-bold text-gray-600 hover:bg-gray-200 bg-gray-100 rounded-xl transition-colors cursor-pointer">Cancel</button>
              <button disabled={assignMoreSelectedIds.length === 0 || isSubmitting} onClick={handleAssignMoreSubmit} className="px-5 py-2 text-sm font-bold text-white bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] rounded-xl shadow-md transition-colors disabled:opacity-50 flex items-center gap-2 cursor-pointer">
                {isSubmitting && <Loader2 size={14} className="animate-spin" />} Assign ({assignMoreSelectedIds.length})
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
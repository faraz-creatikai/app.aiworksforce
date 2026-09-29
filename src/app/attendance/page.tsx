"use client";

import { useEffect, useState, useMemo } from "react";
import { getFilteredAdminAttendanceReport, adminUpdateAttendance } from "@/store/attendance/attendance";
import { Search, Filter, Calendar as CalendarIcon, Download, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, X, Clock, Edit, Check, AlertCircle, Home, CheckCircle2, XCircle, CalendarCheck, CheckCircle, FileText, Table } from "lucide-react";
import toast from "react-hot-toast";


// External libraries for generating structured Excel and PDF files
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import EmployeeViewDialog from "../component/popups/EmployeeViewDialog";

// --- UTILITY FUNCTIONS ---
const getLocalDateString = (date: Date) => {
  const d = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return d.toISOString().split("T")[0];
};

const getStartOfWeek = (date: Date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day;
  return new Date(d.setDate(diff));
};

const getDaysOfWeek = (startDate: Date) => {
  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    days.push(d);
  }
  return days;
};

const getMonthGrid = (viewDate: Date) => {
  const firstOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
  const gridStart = getStartOfWeek(firstOfMonth);
  return Array.from({ length: 42 }, (_, i) => new Date(new Date(gridStart).setDate(gridStart.getDate() + i)));
};

const WEEKDAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

const formatHours = (minutes: number) => {
  if (!minutes) return "-";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
};

const formatStatusText = (status: string) => {
  if (status === 'workfromhome') return 'WFH';
  if (status === 'half_day') return 'Half Day';
  if (!status) return 'None';
  return status.charAt(0).toUpperCase() + status.slice(1);
};

// --- SUB-COMPONENTS ---
function JumpToWeekCalendar({
  viewDate,
  setViewDate,
  currentWeekStart,
  weekDays,
  onSelectDate,
}: {
  viewDate: Date;
  setViewDate: React.Dispatch<React.SetStateAction<Date>>;
  currentWeekStart: Date;
  weekDays: Date[];
  onSelectDate: (d: Date) => void;
}) {
  return (
    <div className="mx-auto w-full max-w-xs sm:max-w-sm">
      {/* Year row */}
      <div className="mb-1 flex items-center justify-between">
        <button
          aria-label="Previous year"
          onClick={() => setViewDate((v) => new Date(v.getFullYear() - 1, v.getMonth(), 1))}
          className="cursor-pointer rounded-full p-1.5 text-[var(--color-gray)] transition-colors hover:bg-gray-100 hover:text-gray-700"
        >
          <ChevronsLeft size={16} />
        </button>
        <span className="text-sm font-bold text-[var(--color-primary-darker)] sm:text-base">{viewDate.getFullYear()}</span>
        <button
          aria-label="Next year"
          onClick={() => setViewDate((v) => new Date(v.getFullYear() + 1, v.getMonth(), 1))}
          className="cursor-pointer rounded-full p-1.5 text-[var(--color-gray)] transition-colors hover:bg-gray-100 hover:text-gray-700"
        >
          <ChevronsRight size={16} />
        </button>
      </div>

      {/* Month row */}
      <div className="mb-3 flex items-center justify-between">
        <button
          aria-label="Previous month"
          onClick={() => setViewDate((v) => new Date(v.getFullYear(), v.getMonth() - 1, 1))}
          className="cursor-pointer rounded-full p-1.5 text-[var(--color-gray)] transition-colors hover:bg-gray-100 hover:text-gray-700"
        >
          <ChevronLeft size={16} />
        </button>
        <span className="text-xs font-semibold text-gray-600 sm:text-sm">
          {viewDate.toLocaleDateString("en-US", { month: "long" })}
        </span>
        <button
          aria-label="Next month"
          onClick={() => setViewDate((v) => new Date(v.getFullYear(), v.getMonth() + 1, 1))}
          className="cursor-pointer rounded-full p-1.5 text-[var(--color-gray)] transition-colors hover:bg-gray-100 hover:text-gray-700"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Weekday header */}
      <div className="grid grid-cols-7 text-center text-[9px] font-semibold text-gray-400 sm:text-[10px]">
        {WEEKDAY_LABELS.map((d) => (
          <span key={d} className="py-1">{d}</span>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 gap-y-0.5">
        {getMonthGrid(viewDate).map((d) => {
          const inMonth = d.getMonth() === viewDate.getMonth();
          const dStr = getLocalDateString(d);
          const weekStartStr = getLocalDateString(currentWeekStart);
          const weekEndStr = getLocalDateString(weekDays[6]);
          const inSelectedWeek = dStr >= weekStartStr && dStr <= weekEndStr;
          const isToday = dStr === getLocalDateString(new Date());
          return (
            <button
              key={dStr}
              onClick={() => onSelectDate(d)}
              className={`cursor-pointer rounded-lg py-1 text-[11px] font-semibold transition-colors sm:py-1.5 sm:text-xs ${inMonth ? "text-gray-700" : "text-gray-300"
                } ${inSelectedWeek ? "bg-[var(--color-primary-lighter)]/50" : "hover:bg-gray-100"} ${isToday ? "ring-1 ring-inset ring-[var(--color-primary)]" : ""
                }`}
            >
              {d.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// --- MAIN COMPONENT ---
export default function AdminAttendanceCalendar() {
  const [groupedData, setGroupedData] = useState<any[]>([]);
  const [todayStats, setTodayStats] = useState({ present: 0, half_day: 0, workfromhome: 0, leave: 0, absent: 0 });
  const [isFetching, setIsFetching] = useState(true);

  // Controls, Filters & Animations
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(getStartOfWeek(new Date()));
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [animStyle, setAnimStyle] = useState("translate-x-0 opacity-100 transition-all duration-300 ease-out");
  const [isAnimating, setIsAnimating] = useState(false);

  // Dropdown States
  const [isDownloadOpen, setIsDownloadOpen] = useState(false);

  // "Jump to Week" calendar
  const [viewDate, setViewDate] = useState<Date>(currentWeekStart);
  const [showMobileCalendar, setShowMobileCalendar] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [employeeToView, setEmployeeToView] = useState<any>(null); // UPDATED

  // Modal States
  const [editModal, setEditModal] = useState<any>(null);
  const [approveModal, setApproveModal] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const weekDays = useMemo(() => getDaysOfWeek(currentWeekStart), [currentWeekStart]);

  const fetchReport = async () => {
    setIsFetching(true);
    const startDate = getLocalDateString(weekDays[0]);
    const endDate = getLocalDateString(weekDays[6]);

    let query = `startDate=${startDate}&endDate=${endDate}&limit=50`;
    if (searchQuery) query += `&search=${encodeURIComponent(searchQuery)}`;
    if (activeFilters.length > 0) query += `&statuses=${activeFilters.join(",")}`;

    const res = await getFilteredAdminAttendanceReport(query);
    if (res?.success) {
      const data: any = res.data;
      const summary: any = res.summary;
      setGroupedData(data);
      setTodayStats(summary);
    }
    setIsFetching(false);
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => { fetchReport(); }, 400);
    return () => clearTimeout(timeoutId);
  }, [currentWeekStart, searchQuery, activeFilters]);

  useEffect(() => {
    setViewDate(currentWeekStart);
  }, [currentWeekStart]);

  // --- REPORT GENERATION (EXCEL & PDF) ---
  const generateExportData = () => {
    if (groupedData.length === 0) {
      toast.error("No data to export for this week.");
      return null;
    }

    return groupedData.map(group => {
      const row: any = {
        "Employee Name": group.employee.employeeName // UPDATED
      };

      let activeDaysCount = 0;

      weekDays.forEach(day => {
        const dateStr = getLocalDateString(day);
        const record = group.weeklyData[dateStr];
        const dayLabel = day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

        if (!record) {
          row[dayLabel] = "-";
        } else {
          let cellText = formatStatusText(record.status);

          if (['present', 'half_day', 'workfromhome'].includes(record.status)) {
            activeDaysCount++;
            if (record.totalMinutes > 0) {
              cellText += ` (${formatHours(record.totalMinutes)})`;
            }
          }
          row[dayLabel] = cellText;
        }
      });

      row["Active Days"] = `${activeDaysCount}/7`;
      return row;
    });
  };

  const exportToExcel = () => {
    const data = generateExportData();
    if (!data) return;

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Weekly Attendance");

    // Auto-size columns slightly for better readability
    const colWidths = [{ wch: 25 }, ...weekDays.map(() => ({ wch: 18 })), { wch: 15 }];
    worksheet['!cols'] = colWidths;

    XLSX.writeFile(workbook, `Attendance_Report_${getLocalDateString(weekDays[0])}.xlsx`);
    setIsDownloadOpen(false);
    toast.success("Excel report downloaded");
  };

  const exportToPDF = () => {
    const data = generateExportData();
    if (!data) return;

    // Use landscape for wide tables
    const doc = new jsPDF("landscape");
    const weekStart = weekDays[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const weekEnd = weekDays[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    doc.setFontSize(16);
    doc.text("Weekly Attendance Report", 14, 15);

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Period: ${weekStart} - ${weekEnd}`, 14, 22);

    const columns = Object.keys(data[0]);
    // Force TypeScript to safely map to a string matrix to eliminate type mismatch
    const rows = data.map(row => Object.values(row).map(val => String(val ?? ""))) as string[][];

    autoTable(doc, {
      head: [columns],
      body: rows,
      startY: 28,
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [0, 102, 204] },
      columnStyles: {
        0: { fontStyle: 'bold' }
      }
    });

    doc.save(`Attendance_Report_${getLocalDateString(weekDays[0])}.pdf`);
    setIsDownloadOpen(false);
    toast.success("PDF report downloaded");
  };

  // --- SLIDER NAV HANDLERS ---
  const handleNextWeek = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setAnimStyle("-translate-x-8 opacity-0 transition-all duration-200 ease-in");

    setTimeout(() => {
      setCurrentWeekStart(prev => { const d = new Date(prev); d.setDate(d.getDate() + 7); return d; });
      setAnimStyle("-translate-x-8 opacity-0 transition-none");

      setTimeout(() => {
        setAnimStyle("translate-x-0 opacity-100 transition-all duration-300 ease-out");
        setIsAnimating(false);
      }, 50);
    }, 200);
  };

  const handlePrevWeek = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setAnimStyle("translate-x-8 opacity-0 transition-all duration-200 ease-in");

    setTimeout(() => {
      setCurrentWeekStart(prev => { const d = new Date(prev); d.setDate(d.getDate() - 7); return d; });
      setAnimStyle("-translate-x-8 opacity-0 transition-none");

      setTimeout(() => {
        setAnimStyle("translate-x-0 opacity-100 transition-all duration-300 ease-out");
        setIsAnimating(false);
      }, 50);
    }, 200);
  };

  const handleViewClick = (id: string | number) => {
    setEmployeeToView(id); // UPDATED
    setIsViewOpen(true);
  };

  // --- API HANDLERS ---
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const res = await adminUpdateAttendance({
      employeeId: editModal.employeeId, // UPDATED
      dateString: editModal.dateString,
      status: editModal.status,
      clockIn: editModal.clockIn,
      clockOut: editModal.clockOut,
      notes: editModal.notes
    });

    if (res?.success) {
      setEditModal(null);
      await fetchReport();
      toast.success("Attendance updated successfully");
    }
    setIsSubmitting(false);
  };

  const handleApproveRequest = async () => {
    setIsSubmitting(true);
    const res = await adminUpdateAttendance({
      employeeId: approveModal.employeeId, // UPDATED
      dateString: approveModal.dateString,
      status: approveModal.status,
      clockIn: null,
      clockOut: null,
      notes: approveModal.notes
    });

    if (res?.success) {
      setApproveModal(null);
      await fetchReport();
      toast.success("Request Approved");
    }
    setIsSubmitting(false);
  };

  const handleRejectRequest = async () => {
    setIsSubmitting(true);
    const res = await adminUpdateAttendance({
      employeeId: approveModal.employeeId, // UPDATED
      dateString: approveModal.dateString,
      status: "absent",
      clockIn: null,
      clockOut: null,
      notes: `[REJECTED] ${approveModal.notes}`
    });

    if (res?.success) {
      setApproveModal(null);
      await fetchReport();
      toast.success("Request Rejected & Marked Absent");
    }
    setIsSubmitting(false);
  };

  const openEditModal = (employeeId: string, employeeName: string, date: Date, record: any) => {
    setEditModal({
      employeeId: employeeId, // UPDATED
      employeeName: employeeName,
      dateString: getLocalDateString(date),
      status: record ? record.status : "present",
      clockIn: record ? record.clockIn : null,
      clockOut: record ? record.clockOut : null,
      notes: record ? record.notes : ""
    });
  };

  const openApproveModal = (employeeId: string, employeeName: string, date: Date, record: any) => {
    setApproveModal({
      employeeId: employeeId, // UPDATED
      employeeName: employeeName,
      dateString: getLocalDateString(date),
      status: record.status,
      notes: record.notes || "No reason provided"
    });
  };


  const jumpToMonth = (monthStr: string) => {
    if (!monthStr) {
      setCurrentWeekStart(getStartOfWeek(new Date()));
      return;
    }
    const [year, month] = monthStr.split('-');
    const newDate = new Date(Number(year), Number(month) - 1, 1);
    setCurrentWeekStart(getStartOfWeek(newDate));
  };

  const selectDate = (d: Date) => {
    setCurrentWeekStart(getStartOfWeek(d));
  };

  const toggleFilter = (status: string) => {
    setActiveFilters(prev => prev.includes(status) ? prev.filter(f => f !== status) : [...prev, status]);
  };

  const clearFilters = () => setActiveFilters([]);

  // --- PERCENTAGE MATH & MULTI-COLOR GRADIENT ---
  const totalLogs = todayStats.present + todayStats.half_day + todayStats.workfromhome + todayStats.leave + todayStats.absent;
  const positiveLogs = todayStats.present + todayStats.workfromhome + todayStats.half_day;
  const overallPct = totalLogs === 0 ? 0 : Math.round((positiveLogs / totalLogs) * 100);
  const getPct = (val: number) => totalLogs === 0 ? 0 : (val / totalLogs) * 100;

  const pPresent = getPct(todayStats.present);
  const pWfh = pPresent + getPct(todayStats.workfromhome);
  const pHalf = pWfh + getPct(todayStats.half_day);
  const pLeave = pHalf + getPct(todayStats.leave);

  const chartGradient = totalLogs === 0
    ? "conic-gradient(#f3f4f6 100%)"
    : `conic-gradient(
        #22c55e 0% ${pPresent}%, 
        #3b82f6 ${pPresent}% ${pWfh}%, 
        #f59e0b ${pWfh}% ${pHalf}%, 
        #a855f7 ${pHalf}% ${pLeave}%, 
        #ef4444 ${pLeave}% 100%
      )`;

  // --- PENDING REQUESTS CALCULATOR ---
  const pendingRequestsCount = useMemo(() => {
    let count = 0;
    groupedData.forEach(group => {
      Object.values(group.weeklyData).forEach((r: any) => {
        if (!r.clockIn && !r.clockOut && !r.markedByAdminId && ['leave', 'workfromhome'].includes(r.status)) count++;
      });
    });
    return count;
  }, [groupedData]);

  // --- DYNAMIC QUICK INSIGHTS LOGIC ---
  let insight1 = { text: "No attendance data for this period.", icon: AlertCircle, color: "text-gray-500" };
  if (totalLogs > 0) {
    if (overallPct >= 90) insight1 = { text: `Excellent! Overall attendance is highly positive at ${overallPct}%.`, icon: CheckCircle2, color: "text-green-500" };
    else if (overallPct >= 75) insight1 = { text: `Good attendance at ${overallPct}%, keeping a steady pace.`, icon: CheckCircle2, color: "text-blue-500" };
    else insight1 = { text: `Attention: Overall attendance has dropped to ${overallPct}%.`, icon: AlertCircle, color: "text-yellow-500" };
  }

  let insight2 = { text: "No remote work or leaves logged yet.", icon: Home, color: "text-gray-400" };
  if (todayStats.workfromhome > todayStats.present) {
    insight2 = { text: "More employees are working remotely than in-office.", icon: Home, color: "text-blue-500" };
  } else if (todayStats.workfromhome > 0) {
    insight2 = { text: `${todayStats.workfromhome} remote days logged during this period.`, icon: Home, color: "text-blue-500" };
  } else if (todayStats.leave > 0) {
    insight2 = { text: `${todayStats.leave} approved leaves taken this period.`, icon: CalendarIcon, color: "text-purple-500" };
  }

  let insight3 = { text: "Perfect punctuality! No absences or half days.", icon: CheckCircle2, color: "text-green-500" };
  if (todayStats.absent > 0) {
    insight3 = { text: `${todayStats.absent} unnotified absences recorded. Follow up may be needed.`, icon: XCircle, color: "text-red-500" };
  } else if (todayStats.half_day > 0) {
    insight3 = { text: `${todayStats.half_day} half days recorded.`, icon: Clock, color: "text-yellow-500" };
  } else if (totalLogs === 0) {
    insight3 = null as any;
  }

  return (
    <div className="min-h-screen space-y-6 font-sans pb-10 flex flex-col">
      <EmployeeViewDialog // UPDATED
        isOpen={isViewOpen}
        employeeId={employeeToView} // UPDATED
        onClose={() => {
          setIsViewOpen(false);
          setEmployeeToView(null);
        }}
      />

      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 py-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-[var(--color-primary-light)] flex items-center justify-center text-[var(--color-primary-darker)] font-bold text-lg shrink-0 shadow-inner">
            <CalendarCheck size={26} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[var(--color-primary-darker)]">Employee Attendance</h1>
            <p className="text-[var(--color-gray)] text-sm mt-1">Analyse and manage attendance records</p>
          </div>
        </div>

        {/* EXPORT REPORT DROPDOWN */}
        <div className="relative ">
          <button
            onClick={() => setIsDownloadOpen(!isDownloadOpen)}
            className="flex items-center gap-2 bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white px-5 py-2.5 rounded-xl shadow-md transition-all text-sm font-medium cursor-pointer active:scale-95"
          >
            Download Report <Download size={16} />
          </button>

          {isDownloadOpen && (
            <>
              {/* Added z-40 so it covers the page but stays behind the dropdown */}
              <div className="fixed inset-0 " onClick={() => setIsDownloadOpen(false)} />

              {/* FIX: left-0 for mobile, lg:left-auto lg:right-0 for desktop.  */}
              <div className="absolute left-0 lg:left-auto lg:right-0 top-full mt-2 w-56 bg-white border border-gray-100 rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 z-50">
                <div className="px-3 py-2 border-b border-gray-100 bg-gray-50/50">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Export Format</p>
                </div>
                <div className="p-1.5 flex flex-col gap-1">
                  <button
                    onClick={exportToPDF}
                    className="flex items-center gap-3 cursor-pointer w-full px-3 py-2.5 text-left text-sm font-semibold text-gray-700 hover:bg-[var(--color-primary-lighter)] hover:text-[var(--color-primary-dark)] rounded-lg transition-colors cursor-pointer"
                  >
                    <div className="p-1.5 bg-red-50 text-red-600 rounded-md"><FileText size={16} /></div>
                    Download as PDF
                  </button>
                  <button
                    onClick={exportToExcel}
                    className="flex items-center gap-3 cursor-pointer w-full px-3 py-2.5 text-left text-sm font-semibold text-gray-700 hover:bg-[var(--color-primary-lighter)] hover:text-[var(--color-primary-dark)] rounded-lg transition-colors cursor-pointer"
                  >
                    <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-md"><Table size={16} /></div>
                    Download as Excel
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* TOP STATS CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
        <div className="bg-white p-3 md:p-5 rounded-2xl shadow-sm border border-[var(--color-muted)]">
          <div className="flex items-center gap-2 text-gray-800 font-semibold mb-1 md:mb-2 text-xs md:text-base">
            <div className="p-1.5 rounded-full bg-green-100 text-green-600"><Clock size={16} /></div> Present
          </div>
          <div className="text-xl md:text-3xl font-bold text-gray-900">{todayStats.present < 10 ? `0${todayStats.present || 0}` : todayStats.present}</div>
        </div>
        <div className="bg-white p-3 md:p-5 rounded-2xl shadow-sm border border-[var(--color-muted)]">
          <div className="flex items-center gap-2 text-gray-800 font-semibold mb-1 md:mb-2 text-xs md:text-base">
            <div className="p-1.5 rounded-full bg-orange-100 text-orange-600"><AlertCircle size={16} /></div> Half Day
          </div>
          <div className="text-xl md:text-3xl font-bold text-gray-900">{todayStats.half_day < 10 ? `0${todayStats.half_day || 0}` : todayStats.half_day}</div>
        </div>
        <div className="bg-white p-3 md:p-5 rounded-2xl shadow-sm border border-[var(--color-muted)]">
          <div className="flex items-center gap-2 text-gray-800 font-semibold mb-1 md:mb-2 text-xs md:text-base">
            <div className="p-1.5 rounded-full bg-blue-100 text-blue-600"><Home size={16} /></div> WFH
          </div>
          <div className="text-xl md:text-3xl font-bold text-gray-900">{todayStats.workfromhome < 10 ? `0${todayStats.workfromhome || 0}` : todayStats.workfromhome}</div>
        </div>
        <div className="bg-white p-3 md:p-5 rounded-2xl shadow-sm border border-[var(--color-muted)]">
          <div className="flex items-center gap-2 text-gray-800 font-semibold mb-1 md:mb-2 text-xs md:text-base">
            <div className="p-1.5 rounded-full bg-purple-100 text-purple-600"><CalendarIcon size={16} /></div> On Leave
          </div>
          <div className="text-xl md:text-3xl font-bold text-gray-900">{todayStats.leave < 10 ? `0${todayStats.leave || 0}` : todayStats.leave}</div>
        </div>
        <div className="bg-white p-3 md:p-5 rounded-2xl shadow-sm border border-[var(--color-muted)]">
          <div className="flex items-center gap-2 text-gray-800 font-semibold mb-1 md:mb-2 text-xs md:text-base">
            <div className="p-1.5 rounded-full bg-red-100 text-red-600"><X size={16} /></div> Absent
          </div>
          <div className="text-xl md:text-3xl font-bold text-gray-900">{todayStats.absent < 10 ? `0${todayStats.absent || 0}` : todayStats.absent}</div>
        </div>
      </div>

      {/* TOOLBAR & FILTERS */}
      <div className="bg-white rounded-t-2xl border-t border-l border-r border-[var(--color-muted)] p-4 flex flex-col gap-4">
        <div className="flex flex-col lg:flex-row justify-between items-center gap-4">

          <div className="relative w-full lg:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-gray)]" size={18} />
            <input
              type="text"
              placeholder="Search employee..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-[var(--color-muted)] rounded-xl outline-none focus:ring-2 focus:ring-[var(--color-primary)] text-sm"
            />
          </div>
        </div>

        {/* Status Filter Chips + CLEAR FILTERS */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-100">
          <span className="text-sm font-medium text-gray-500 mr-2 flex items-center gap-1"><Filter size={14} /> Filter by Status:</span>
          {["present", "half_day", "workfromhome", "leave", "absent"].map(status => (
            <button
              key={status}
              onClick={() => toggleFilter(status)}
              className={`shrink-0 px-3 py-1.5 cursor-pointer rounded-lg text-xs font-bold capitalize transition-all border ${activeFilters.includes(status)
                ? "bg-[var(--color-primary)] text-white border-[var(--color-primary)] shadow-md"
                : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"
                }`}
            >
              {status === "workfromhome" ? "WFH" : status.replace("_", " ")}
              {activeFilters.includes(status) && <X size={12} />}
            </button>
          ))}
          {activeFilters.length > 0 && (
            <button onClick={clearFilters} className="shrink-0 px-2 cursor-pointer text-xs font-semibold text-[var(--color-primary)] hover:underline flex items-center gap-1">
              Clear filters
            </button>
          )}
        </div>
      </div>


      {/* 
        ---------------------------------------------------------
        ANALYTICS & MOBILE TABLE RESPONSIVE WRAPPER 
        We use flex-col on mobile and grid on lg to control order!
        ---------------------------------------------------------
      */}
      <div className="flex flex-col lg:grid lg:grid-cols-4 gap-4">

        {/* 1. DONUT & THIS PERIOD (Mobile: Bottom, PC: Left 2 columns) */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-[var(--color-muted)] p-6 flex flex-col gap-6 order-4 lg:order-1">
          <div className="flex flex-col sm:flex-row gap-8">
            <div className="flex flex-col items-center">
              <h3 className="text-sm font-bold text-gray-800 mb-4 self-start sm:self-center">
                This Period
              </h3>
              <div
                className="relative w-36 h-36 rounded-full flex items-center justify-center shadow-inner"
                style={{ background: chartGradient }}
              >
                <div className="w-28 h-28 bg-white rounded-full flex flex-col items-center justify-center shadow-sm">
                  <span className="text-3xl font-extrabold text-gray-900">{overallPct}%</span>
                  <span className="text-[10px] text-gray-500 font-medium uppercase tracking-wider text-center leading-tight">
                    Overall<br />Attendance
                  </span>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-4 font-medium">
                Total Records:
                <span className="font-bold text-gray-900 ml-1">{totalLogs}</span>
              </p>
            </div>

            <div className="flex-1 w-full space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="flex items-center gap-2 font-semibold text-gray-700">
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div> Present
                </span>
                <span className="font-bold text-gray-900">
                  {todayStats.present}
                  <span className="text-gray-400 font-normal ml-2 w-8 inline-block text-right">{Math.round(getPct(todayStats.present))}%</span>
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="flex items-center gap-2 font-semibold text-gray-700">
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div> WFH
                </span>
                <span className="font-bold text-gray-900">
                  {todayStats.workfromhome}
                  <span className="text-gray-400 font-normal ml-2 w-8 inline-block text-right">{Math.round(getPct(todayStats.workfromhome))}%</span>
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="flex items-center gap-2 font-semibold text-gray-700">
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500"></div> Half Day
                </span>
                <span className="font-bold text-gray-900">
                  {todayStats.half_day}
                  <span className="text-gray-400 font-normal ml-2 w-8 inline-block text-right">{Math.round(getPct(todayStats.half_day))}%</span>
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="flex items-center gap-2 font-semibold text-gray-700">
                  <div className="w-2.5 h-2.5 rounded-full bg-purple-500"></div> On Leave
                </span>
                <span className="font-bold text-gray-900">
                  {todayStats.leave}
                  <span className="text-gray-400 font-normal ml-2 w-8 inline-block text-right">{Math.round(getPct(todayStats.leave))}%</span>
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="flex items-center gap-2 font-semibold text-gray-700">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div> Absent
                </span>
                <span className="font-bold text-gray-900">
                  {todayStats.absent}
                  <span className="text-gray-400 font-normal ml-2 w-8 inline-block text-right">{Math.round(getPct(todayStats.absent))}%</span>
                </span>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-5 mt-auto">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="rounded-xl bg-gray-50 border border-gray-100 px-4 py-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500 font-medium">Attendance Rate</span>
                  <span className="w-7 h-7 rounded-lg bg-green-50 text-green-600 flex items-center justify-center text-sm">%</span>
                </div>
                <div className="mt-2 flex items-end gap-1">
                  <span className="text-xl font-extrabold text-gray-900">{overallPct}%</span>
                  <span className="text-[11px] text-gray-400 mb-1">overall</span>
                </div>
              </div>
              <div className="rounded-xl bg-gray-50 border border-gray-100 px-4 py-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500 font-medium">Present</span>
                  <span className="w-7 h-7 rounded-lg bg-green-50 text-green-600 flex items-center justify-center">✓</span>
                </div>
                <div className="mt-2 flex items-end gap-1">
                  <span className="text-xl font-extrabold text-gray-900">{todayStats.present}</span>
                  <span className="text-[11px] text-gray-400 mb-1">records</span>
                </div>
              </div>
              <div className="rounded-xl bg-gray-50 border border-gray-100 px-4 py-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500 font-medium">Needs Attention</span>
                  <span className="w-7 h-7 rounded-lg bg-red-50 text-red-500 flex items-center justify-center">!</span>
                </div>
                <div className="mt-2 flex items-end gap-1">
                  <span className="text-xl font-extrabold text-gray-900">{todayStats.absent + todayStats.half_day}</span>
                  <span className="text-[11px] text-gray-400 mb-1">absent / half day</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 2. JUMP TO WEEK (Mobile: Top, PC: Column 3) */}
        <div className="rounded-2xl border border-[var(--color-muted)] bg-white p-4 shadow-sm sm:p-6 order-1 lg:order-2">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-gray-800">
            <div className="rounded-lg bg-[var(--color-primary-lighter)] p-1.5 text-[var(--color-primary)]">
              <CalendarIcon size={16} />
            </div>
            Jump to Week
          </h3>
          <button
            onClick={() => setShowMobileCalendar(true)}
            className="lg:hidden w-full flex items-center justify-between gap-2 bg-gray-50 border border-[var(--color-muted)] rounded-xl px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <span>
              {weekDays[0].toLocaleDateString("en-US", { month: "short", day: "numeric" })} – {weekDays[6].toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </span>
            <CalendarIcon size={16} className="text-[var(--color-primary)] shrink-0" />
          </button>
          <div className="hidden lg:block">
            <JumpToWeekCalendar
              viewDate={viewDate}
              setViewDate={setViewDate}
              currentWeekStart={currentWeekStart}
              weekDays={weekDays}
              onSelectDate={selectDate}
            />
          </div>
        </div>

        {/* 3. MOBILE ATTENDANCE LIST (Mobile: Middle, PC: Hidden) */}
        <div className="lg:hidden space-y-3 order-2">
          <div className="flex items-center justify-between bg-white rounded-xl border border-[var(--color-muted)] p-3">
            <button
              onClick={handlePrevWeek}
              disabled={isAnimating}
              className="p-2 rounded-lg bg-gray-50 border border-gray-200 text-gray-600 cursor-pointer disabled:opacity-50"
            >
              <ChevronLeft size={18} />
            </button>
            <h4 className="font-bold text-[var(--color-primary-darker)] text-sm text-center px-2">
              {weekDays[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – {weekDays[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </h4>
            <button
              onClick={handleNextWeek}
              disabled={isAnimating}
              className="p-2 rounded-lg bg-gray-50 border border-gray-200 text-gray-600 cursor-pointer disabled:opacity-50"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 px-2">
            {weekDays.map((day, idx) => {
              const isToday = getLocalDateString(day) === getLocalDateString(new Date());
              return (
                <div key={idx} className={`text-center leading-tight ${isToday ? 'text-[var(--color-primary)]' : 'text-gray-400'}`}>
                  <div className="text-[10px] font-bold uppercase">{day.toLocaleDateString('en-US', { weekday: 'narrow' })}</div>
                  <div className="text-[9px] font-medium">{day.getDate()}</div>
                </div>
              );
            })}
          </div>

          {isFetching ? (
            <div className="bg-white rounded-2xl border border-[var(--color-muted)] p-10 flex justify-center">
              <span className="inline-block w-8 h-8 border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin"></span>
            </div>
          ) : groupedData.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[var(--color-muted)] p-10 text-center text-gray-500 text-sm">
              No attendance data found for this period.
            </div>
          ) : (
            groupedData.map((group) => {
              let activeDaysCount = 0;
              weekDays.forEach(d => {
                const s = group.weeklyData[getLocalDateString(d)]?.status;
                if (s === 'present' || s === 'workfromhome' || s === 'half_day') activeDaysCount++;
              });

              return (
                <div key={group.employeeId} className="bg-white rounded-2xl border border-[var(--color-muted)] shadow-sm p-3">
                  <div className="flex items-center gap-3 mb-3 " >
                    {group.employee.image ? (
                      <img
                        src={group.employee.image}
                        alt={group.employee.employeeName} // UPDATED
                        className="w-9 h-9 rounded-full object-cover shadow-inner shrink-0 border border-gray-200 cursor-pointer"
                        onClick={() => handleViewClick(group.employeeId)}
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-[var(--color-primary-light)] flex items-center justify-center text-[var(--color-primary-darker)] font-bold text-sm shrink-0 shadow-inner cursor-pointer"
                        onClick={() => handleViewClick(group.employeeId)}>
                        {group.employee.employeeName.charAt(0).toUpperCase()} {/* UPDATED */}
                      </div>
                    )}
                    <div className="overflow-hidden">
                      <p className="font-bold text-gray-900 text-sm truncate">{group.employee.employeeName}</p> {/* UPDATED */}
                      <p className="text-[11px] text-gray-400 font-medium">
                        Actives: <span className="text-[var(--color-primary)]">{activeDaysCount}/7</span>
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-7 gap-1">
                    {weekDays.map((day, idx) => {
                      const dateStr = getLocalDateString(day);
                      const record = group.weeklyData[dateStr];
                      const isToday = dateStr === getLocalDateString(new Date());
                      const isPending =
                        record &&
                        !record.clockIn &&
                        !record.clockOut &&
                        !record.markedByAdminId &&
                        ['leave', 'workfromhome'].includes(record.status);

                      return (
                        <button
                          key={idx}
                          onClick={() =>
                            isPending
                              ? openApproveModal(group.employeeId, group.employee.employeeName, day, record) // UPDATED
                              : openEditModal(group.employeeId, group.employee.employeeName, day, record) // UPDATED
                          }
                          className={`relative flex flex-col items-center justify-center gap-0.5 rounded-lg py-1.5 cursor-pointer ${isToday ? 'bg-[var(--color-primary-lighter)]/20' : ''}`}
                        >
                          {isPending && (
                            <span className="absolute top-0.5 right-0.5 flex h-2 w-2 z-10">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500 border border-white"></span>
                            </span>
                          )}

                          {record ? (
                            record.status === 'present'
                              ? <CheckCircle2 size={18} className="text-green-500" strokeWidth={2.5} />
                              : record.status === 'half_day'
                                ? <Clock size={18} className="text-yellow-500" strokeWidth={2.5} />
                                : record.status === 'workfromhome'
                                  ? <Home size={17} className={isPending ? "text-orange-500" : "text-blue-500"} strokeWidth={2.5} />
                                  : record.status === 'leave'
                                    ? <CalendarIcon size={17} className={isPending ? "text-orange-500" : "text-purple-500"} strokeWidth={2.5} />
                                    : <XCircle size={18} className="text-red-500" strokeWidth={2.5} />
                          ) : (
                            day.getDay() === 0 ? (
                              <span className="w-1.5 h-1.5 rounded-full bg-gray-200"></span>
                            ) : (
                              <span className="text-gray-300 font-bold text-xs">-</span>
                            )
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* 4. QUICK INSIGHTS (Mobile: Below Table, PC: Column 4) */}
        <div className="bg-white rounded-2xl shadow-sm border border-[var(--color-muted)] p-6 flex flex-col order-3 lg:order-3">
          <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2 mb-4">
            <div className="p-1.5 bg-[var(--color-primary-lighter)] text-[var(--color-primary)] rounded-lg"><AlertCircle size={16} /></div> Quick Insights
          </h3>
          <div className="flex-1 flex flex-col justify-between gap-3">
            {pendingRequestsCount > 0 && (
              <div className="flex gap-3 items-start bg-orange-50 p-4 border border-orange-100 rounded-xl">
                <div className="w-8 h-8 rounded-full bg-white shadow-sm text-orange-500 flex items-center justify-center shrink-0">
                  <AlertCircle size={16} />
                </div>
                <p className="text-sm text-orange-800 font-medium leading-snug">You have <span className="font-bold">{pendingRequestsCount} pending requests</span> to review.</p>
              </div>
            )}
            <div className="flex gap-3 items-start bg-gray-50 border border-gray-100 rounded-xl p-4">
              <div className={`w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center shrink-0 ${insight1.color}`}>
                <insight1.icon size={16} />
              </div>
              <p className="text-sm text-gray-600 leading-snug">{insight1.text}</p>
            </div>
            <div className="flex gap-3 items-start bg-gray-50 border border-gray-100 rounded-xl p-4">
              <div className={`w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center shrink-0 ${insight2.color}`}>
                <insight2.icon size={16} />
              </div>
              <p className="text-sm text-gray-600 leading-snug">{insight2.text}</p>
            </div>
            {insight3 && (
              <div className="flex gap-3 items-start bg-gray-50 border border-gray-100 rounded-xl p-4">
                <div className={`w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center shrink-0 ${insight3.color}`}>
                  <insight3.icon size={16} />
                </div>
                <p className="text-sm text-gray-600 leading-snug">{insight3.text}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CALENDAR GRID WITH BIG SLIDER BUTTONS — desktop (lg+) only */}
      <div className="relative mx-5 hidden lg:block">

        <button
          onClick={handlePrevWeek}
          disabled={isAnimating}
          className="
      hidden md:flex
      absolute -left-2 top-1/2 -translate-x-1/2 -translate-y-1/2
      w-12 h-12
      items-center justify-center
      bg-white border border-gray-200 rounded-full
      shadow-sm hover:shadow-md
      hover:border-[var(--color-primary)]
      hover:text-[var(--color-primary)]
      text-gray-600
      transition-all cursor-pointer
      disabled:opacity-50
      z-10
    "
        >
          <ChevronLeft size={24} />
        </button>

        <div className="flex-1 overflow-hidden bg-white border border-[var(--color-muted)] rounded-2xl shadow-sm">

          <div className="p-4 bg-gray-50 border-b border-[var(--color-muted)] flex justify-between items-center md:justify-center">

            <button
              onClick={handlePrevWeek}
              className="md:hidden p-2 bg-white rounded-lg shadow-sm border border-gray-200 cursor-pointer"
            >
              <ChevronLeft size={18} />
            </button>

            <h4 className="font-bold text-[var(--color-primary-darker)] text-sm tracking-wide">
              {weekDays[0].toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} — {weekDays[6].toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </h4>

            <button
              onClick={handleNextWeek}
              className="md:hidden p-2 bg-white rounded-lg shadow-sm border border-gray-200 cursor-pointer"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          <div className="overflow-x-auto pb-4">
            <table className={`w-full text-left border-collapse min-w-[1000px] ${animStyle}`}>

              <thead>
                <tr className="border-b border-[var(--color-muted)] bg-white">
                  <th className="py-4 px-6 text-sm font-semibold text-gray-700 w-44 border-r border-[var(--color-muted)] sticky left-0 bg-white z-20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                    Employee
                  </th>

                  {weekDays.map((day, idx) => (
                    <th
                      key={idx}
                      className={`py-4 px-4 text-sm font-semibold text-center min-w-[120px] border-r border-[var(--color-muted)] last:border-0 ${getLocalDateString(day) === getLocalDateString(new Date())
                        ? 'text-[var(--color-primary)] bg-[var(--color-primary-lighter)]/10'
                        : 'text-gray-700'
                        }`}
                    >
                      {day.toLocaleDateString('en-US', { weekday: 'short' })} <br />
                      <span className="text-xs font-normal text-gray-500">
                        {day.getDate()} {day.toLocaleDateString('en-US', { month: 'short' })}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-[var(--color-muted)]">
                {isFetching ? (
                  <tr>
                    <td colSpan={8} className="p-10 text-center ">
                      <span className="inline-block w-8 h-8 border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin"></span>
                    </td>
                  </tr>
                ) : groupedData.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-10 text-center text-gray-500">
                      No attendance data found for this period.
                    </td>
                  </tr>
                ) : (
                  groupedData.map((group) => {

                    let activeDaysCount = 0;

                    weekDays.forEach(d => {
                      const s = group.weeklyData[getLocalDateString(d)]?.status;
                      if (
                        s === 'present' ||
                        s === 'workfromhome' ||
                        s === 'half_day'
                      ) activeDaysCount++;
                    });

                    return (
                      <tr
                        key={group.employeeId}
                        className="group/row hover:bg-gray-50/50 transition-colors"
                      >
                        <td className="p-4 border-r border-[var(--color-muted)] sticky left-0 bg-white group-hover/row:bg-gray-50 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                          <div className="flex items-center gap-3 cursor-pointer" onClick={() => {
                            handleViewClick(group.employeeId)
                          }}>
                            {group.employee.image ? (
                              <img
                                src={group.employee.image}
                                alt={group.employee.employeeName} // UPDATED
                                className="w-10 h-10 rounded-full object-cover shadow-inner shrink-0 border border-gray-200"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-[var(--color-primary-light)] flex items-center justify-center text-[var(--color-primary-darker)] font-bold text-lg shrink-0 shadow-inner">
                                {group.employee.employeeName.charAt(0).toUpperCase()} {/* UPDATED */}
                              </div>
                            )}

                            <div className="overflow-hidden">
                              <p className="font-bold text-gray-900 truncate">
                                {group.employee.employeeName} {/* UPDATED */}
                              </p>

                              <p className="text-xs text-gray-400 font-medium">
                                Actives:
                                <span className="text-[var(--color-primary)] ml-1">
                                  {activeDaysCount}/7
                                </span>
                              </p>
                            </div>
                          </div>
                        </td>

                        {weekDays.map((day, idx) => {
                          const dateStr = getLocalDateString(day);
                          const record = group.weeklyData[dateStr];
                          const isToday = dateStr === getLocalDateString(new Date());

                          const isPending =
                            record &&
                            !record.clockIn &&
                            !record.clockOut &&
                            !record.markedByAdminId &&
                            ['leave', 'workfromhome'].includes(record.status);

                          return (
                            <td
                              key={idx}
                              className={`relative p-2 border-r border-gray-100 last:border-0 align-middle group/cell ${isToday
                                ? 'bg-[var(--color-primary-lighter)]/10'
                                : ''
                                }`}
                            >

                              {/* PENDING INDICATOR BADGE */}
                              {isPending && (
                                <span className="absolute top-2 right-2 flex h-3 w-3 z-10">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500 border border-white"></span>
                                </span>
                              )}

                              {/* CONDITIONAL ACTION BUTTON */}
                              <button
                                onClick={() =>
                                  isPending
                                    ? openApproveModal(
                                      group.employeeId,
                                      group.employee.employeeName, // UPDATED
                                      day,
                                      record
                                    )
                                    : openEditModal(
                                      group.employeeId,
                                      group.employee.employeeName, // UPDATED
                                      day,
                                      record
                                    )
                                }
                                className="absolute top-1 right-1 cursor-pointer p-1 bg-white border border-gray-200 text-gray-500 rounded-md shadow-sm opacity-0 group-hover/cell:opacity-100 hover:text-[var(--color-primary)] transition-all z-20"
                              >
                                {isPending
                                  ? <CheckCircle className="text-orange-500 w-3 h-3" />
                                  : <Edit size={12} />
                                }
                              </button>

                              <div className="flex flex-col items-center justify-center gap-1 py-2">
                                {record ? (
                                  <>
                                    {record.status === 'present'
                                      ? <CheckCircle2 size={24} className="text-green-500" strokeWidth={2.5} />
                                      : record.status === 'half_day'
                                        ? <Clock size={24} className="text-yellow-500" strokeWidth={2.5} />
                                        : record.status === 'workfromhome'
                                          ? <Home size={22} className={isPending ? "text-orange-500" : "text-blue-500"} strokeWidth={2.5} />
                                          : record.status === 'leave'
                                            ? <CalendarIcon size={22} className={isPending ? "text-orange-500" : "text-purple-500"} strokeWidth={2.5} />
                                            : <XCircle size={24} className="text-red-500" strokeWidth={2.5} />
                                    }

                                    <span className={`text-[10px] font-bold uppercase tracking-wider ${isPending ? 'text-orange-600' :
                                      record.status === 'present' ? 'text-green-600' :
                                        record.status === 'half_day' ? 'text-yellow-600' :
                                          record.status === 'workfromhome' ? 'text-blue-600' :
                                            record.status === 'leave' ? 'text-purple-600' : 'text-red-600'
                                      }`}>
                                      {isPending
                                        ? `Req: ${record.status === "workfromhome" ? "WFH" : record.status}`
                                        : record.status === "workfromhome"
                                          ? "WFH"
                                          : record.status === "half_day"
                                            ? "Half Day"
                                            : record.status
                                      }
                                    </span>

                                    {(record.status === 'present' ||
                                      record.status === 'half_day' ||
                                      record.status === 'workfromhome') &&
                                      record.totalMinutes > 0 && (
                                        <span className="text-[10px] text-gray-400 font-mono mt-0.5">
                                          {formatHours(record.totalMinutes)}
                                        </span>
                                      )}
                                  </>
                                ) : (
                                  day.getDay() === 0 ? (
                                    <span className="w-1.5 h-1.5 rounded-full bg-gray-200"></span>
                                  ) : (
                                    <span className="text-gray-300 font-bold text-xs">-</span>
                                  )
                                )}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })
                )}
              </tbody>

            </table>
          </div>
        </div>

        <button
          onClick={handleNextWeek}
          disabled={isAnimating}
          className="
      hidden md:flex
      absolute -right-2 top-1/2 -translate-y-1/2 translate-x-1/2
      w-12 h-12
      items-center justify-center
      bg-white border border-gray-200 rounded-full
      shadow-sm hover:shadow-md
      hover:border-[var(--color-primary)]
      hover:text-[var(--color-primary)]
      text-gray-600
      transition-all cursor-pointer
      disabled:opacity-50
     z-10
    "
        >
          <ChevronRight size={24} />
        </button>

      </div>

      {/* --- MOBILE MODAL: JUMP TO WEEK CALENDAR --- */}
      {showMobileCalendar && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 lg:hidden">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-[var(--color-muted)]">
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                <div className="rounded-lg bg-[var(--color-primary-lighter)] p-1.5 text-[var(--color-primary)]">
                  <CalendarIcon size={16} />
                </div>
                Jump to Week
              </h3>
              <button onClick={() => setShowMobileCalendar(false)} className="text-gray-400 cursor-pointer hover:text-red-500 bg-gray-50 p-1.5 rounded-full">
                <X size={18} />
              </button>
            </div>
            <div className="p-5">
              <JumpToWeekCalendar
                viewDate={viewDate}
                setViewDate={setViewDate}
                currentWeekStart={currentWeekStart}
                weekDays={weekDays}
                onSelectDate={(d) => { selectDate(d); setShowMobileCalendar(false); }}
              />
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL 1: NEW DEDICATED APPROVAL DIALOG --- */}
      {approveModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-5 border-b border-orange-100 bg-orange-50">
              <h3 className="font-bold text-lg text-orange-800 flex items-center gap-2">
                <AlertCircle size={18} /> Review Request
              </h3>
              <button onClick={() => setApproveModal(null)} className="text-gray-400 cursor-pointer hover:text-red-500 bg-white p-1 rounded-full shadow-sm">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-xs text-gray-500 uppercase font-bold">Employee</p>
                  <p className="font-bold text-gray-900">{approveModal.employeeName}</p> {/* UPDATED */}
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500 uppercase font-bold">Date</p>
                  <p className="font-bold text-[var(--color-primary)]">{approveModal.dateString}</p>
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                <p className="text-xs text-gray-500 uppercase font-bold mb-1">Requested Status</p>
                <p className="font-bold text-lg capitalize text-[var(--color-primary-darker)] mb-3">
                  {approveModal.status === "workfromhome" ? "Work From Home" : "Leave"}
                </p>
                <p className="text-xs text-gray-500 uppercase font-bold mb-1">Employee Note</p>
                <p className="text-sm text-gray-700 italic border-l-2 border-[var(--color-primary)] pl-2">"{approveModal.notes}"</p>
              </div>

              <div className="flex flex-col gap-3 pt-2">
                <button
                  onClick={handleApproveRequest}
                  disabled={isSubmitting}
                  className="w-full cursor-pointer py-3 bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white font-bold rounded-xl shadow-md transition-all flex justify-center items-center gap-2 disabled:opacity-70"
                >
                  {isSubmitting ? <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Check size={18} /> Approve Request</>}
                </button>
                <button
                  onClick={handleRejectRequest}
                  disabled={isSubmitting}
                  className="w-full cursor-pointer py-3 bg-white border-2 border-red-100 hover:border-red-200 text-red-600 hover:bg-red-50 font-bold rounded-xl transition-all flex justify-center items-center gap-2 disabled:opacity-70"
                >
                  <X size={18} /> Deny & Mark Absent
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL 2: STANDARD EDIT MODAL --- */}
      {editModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">

            <div className="flex justify-between items-center p-5 border-b border-[var(--color-primary-light)] bg-[var(--color-primary-lighter)]/30">
              <h3 className="font-bold text-lg text-[var(--color-primary-darker)] flex items-center gap-2">
                <Edit size={18} /> Edit Record
              </h3>
              <button onClick={() => setEditModal(null)} className="text-[var(--color-gray)] cursor-pointer hover:text-red-500 bg-white p-1 rounded-full shadow-sm">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="p-6 space-y-5 overflow-y-auto custom-scrollbar">

              <div className="bg-gray-50 p-4 rounded-xl border border-[var(--color-muted)] flex justify-between items-center">
                <div>
                  <p className="text-xs text-[var(--color-gray)] uppercase font-semibold">Employee</p>
                  <p className="font-bold text-gray-900">{editModal.employeeName}</p> {/* UPDATED */}
                </div>
                <div className="text-right">
                  <p className="text-xs text-[var(--color-gray)] uppercase font-semibold">Date</p>
                  <p className="font-bold text-[var(--color-primary)]">{editModal.dateString}</p>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-bold text-gray-700">Status</label>
                <select
                  value={editModal.status}
                  onChange={(e) => setEditModal({ ...editModal, status: e.target.value })}
                  className="w-full p-3 border border-[var(--color-muted)] rounded-xl outline-none focus:ring-2 focus:ring-[var(--color-primary)] bg-white font-medium"
                >
                  <option value="present">Present</option>
                  <option value="half_day">Half Day</option>
                  <option value="workfromhome">Work From Home</option>
                  <option value="absent">Absent</option>
                  <option value="leave">Leave</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-gray-700">Clock In Time</label>
                  <input
                    type="time"
                    value={editModal.clockIn ? new Date(new Date(editModal.clockIn).getTime() - (new Date().getTimezoneOffset() * 60000)).toISOString().slice(11, 16) : ""}
                    onChange={(e) => {
                      if (!e.target.value) {
                        setEditModal({ ...editModal, clockIn: null });
                      } else {
                        const dateObj = new Date(editModal.dateString + "T" + e.target.value);
                        setEditModal({ ...editModal, clockIn: dateObj.toISOString() });
                      }
                    }}
                    className="w-full p-3 border border-[var(--color-muted)] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[var(--color-primary)] font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-gray-700">Clock Out Time</label>
                  <input
                    type="time"
                    value={editModal.clockOut ? new Date(new Date(editModal.clockOut).getTime() - (new Date().getTimezoneOffset() * 60000)).toISOString().slice(11, 16) : ""}
                    onChange={(e) => {
                      if (!e.target.value) {
                        setEditModal({ ...editModal, clockOut: null });
                      } else {
                        const dateObj = new Date(editModal.dateString + "T" + e.target.value);
                        setEditModal({ ...editModal, clockOut: dateObj.toISOString() });
                      }
                    }}
                    className="w-full p-3 border border-[var(--color-muted)] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[var(--color-primary)] font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-bold text-gray-700">Admin Notes / Reason</label>
                <textarea
                  value={editModal.notes || ""}
                  onChange={(e) => setEditModal({ ...editModal, notes: e.target.value })}
                  rows={3}
                  className="w-full p-3 border border-[var(--color-muted)] rounded-xl outline-none focus:ring-2 focus:ring-[var(--color-primary)] text-sm resize-none"
                  placeholder="e.g., Forgot to clock in, out on field..."
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full cursor-pointer py-3.5 bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white font-bold rounded-xl shadow-md transition-all flex justify-center items-center gap-2 mt-2 disabled:opacity-70"
              >
                {isSubmitting ? <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Check size={20} /> Save Changes</>}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
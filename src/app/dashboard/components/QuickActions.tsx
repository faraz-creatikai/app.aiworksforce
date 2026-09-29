"use client";

import Link from "next/link";
import { 
  Zap, 
  UserPlus, 
  ShieldCheck, 
  Briefcase, 
  Upload, 
  FileBarChart, 
  Send, 
  CalendarDays, 
  Users, 
  Settings, 
  Calendar
} from "lucide-react";
import { FaTasks } from "react-icons/fa";

// ==========================================
// EASY DATA CONFIGURATION
// Add, remove, or edit your quick links here
// ==========================================
const QUICK_ACTIONS = [
  { label: "Add Employee", href: "/customer/add", icon: UserPlus },
  { label: "Create Leave Policy", href: "/admin/leaves/policy", icon: ShieldCheck },
  { label: "Attendance", href: "/attendance", icon: Calendar },
  { label: "Bulk Import", href: "/imports/customer", icon: Upload },
  { label: "HR Report", href: "/reports/activity", icon: FileBarChart },
  { label: "Send Announcement", href: "/admin/announcements/new", icon: Send },
  { label: "Manage Tasks", href: "/task", icon: FaTasks },
  { label: "Employee Directory", href: "/customer", icon: Users },
  { label: "HR Settings", href: "/users", icon: Settings },
];

export default function QuickActions() {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-6 w-full h-full flex flex-col">
      
      {/* HEADER */}
      <div className="flex items-center gap-2.5 mb-5">
        <Zap size={22} className="text-purple-600 fill-purple-600/20" />
        <h2 className="text-[17px] sm:text-lg font-bold text-gray-900 tracking-tight">
          HR Quick Actions
        </h2>
      </div>

      {/* ACTIONS GRID */}
      {/* Uses auto-responsive columns depending on the width of this card's container */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 flex-1">
        {QUICK_ACTIONS.map((action, index) => {
          const Icon = action.icon;
          return (
            <Link 
              key={index} 
              href={action.href}
              className="flex items-center gap-3 p-3.5 rounded-xl bg-[#f8fafc] border border-transparent hover:border-blue-100 hover:bg-blue-50/50 transition-all group"
            >
              {/* ICON */}
              <div className="text-[var(--color-primary)] group-hover:scale-110 transition-transform duration-200 shrink-0">
                <Icon size={18} strokeWidth={2.5} />
              </div>
              
              {/* LABEL */}
              <span className="text-sm font-semibold text-gray-700 group-hover:text-[var(--color-primary-darker)] transition-colors truncate">
                {action.label}
              </span>
            </Link>
          );
        })}
      </div>
      
    </div>
  );
}
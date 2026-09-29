"use client";

import { ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { EmployeeAuthProvider, useEmployeeAuth } from "@/context/EmployeeAuthContext";
import {
  Clock,
  Calendar,
  User,
  Shield,
  Menu,
  X,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Search,
  Sun,
  Moon,
} from "lucide-react";
import EmployeeProtectedRoute from "../component/EmployeeProtextRoute";
import BrandLogo from "../component/labels/BrandLogo";
import { FaTasks } from "react-icons/fa";
import MobileBottomNav from "./components/MobileBottomNav";


function getInitials(name?: string) {
  if (!name) return "EM";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function EmployeeLayoutContent({ children }: { children: ReactNode }) {
  const { employee, logout } = useEmployeeAuth();
  const pathname = usePathname();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Theme state and mounting flag for localStorage
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const savedTheme = localStorage.getItem("sidebar-theme");
    if (savedTheme === "dark") setTheme("dark");
  }, []);

  const toggleTheme = (newTheme: "light" | "dark") => {
    setTheme(newTheme);
    localStorage.setItem("sidebar-theme", newTheme);
  };

  // Safely grab employee details
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const employeeAny = employee as any;
  const employeeName: string = employeeAny?.name ?? employeeAny?.fullName ?? "Employee";
  const employeeEmail: string = employeeAny?.email ?? "";
  
  // Safely parse EmployeeImage array or fallback fields
  let employeeAvatarUrl = "";
  try {
    const imgData = JSON.parse(employeeAny?.EmployeeImage);
    if (Array.isArray(imgData) && imgData.length > 0) {
      employeeAvatarUrl = imgData[0];
    } else if (typeof imgData === "string") {
      const parsed = JSON.parse(imgData);
      if (Array.isArray(parsed) && parsed.length > 0) employeeAvatarUrl = parsed[0];
      else employeeAvatarUrl = imgData;
    }
  } catch (e) {
    // Falls back below
  }
  
  if (!employeeAvatarUrl) {
    employeeAvatarUrl = employeeAny?.avatar ?? employeeAny?.photo ?? employeeAny?.image ?? employeeAny?.profileImage ?? "";
  }

  if (pathname === "/employee/login") {
    return <main className="min-h-screen">{children}</main>;
  }

  const navLinks = [
    { name: "Clock", href: "/employee/clock", icon: Clock },
    { name: "Attendance Log", href: "/employee/attendance", icon: Calendar },
      { name: "My Tasks", href: "/employee/task", icon: FaTasks },
    { name: "My Profile", href: "/employee/profile", icon: User },
    { name: "Company Policies", href: "/employee/company-policies", icon: Shield },
  ];

  const filteredLinks = navLinks.filter((link) =>
    link.name.toLowerCase().includes(searchQuery.trim().toLowerCase())
  );

  const toggleCollapse = () => {
    setIsCollapsed((prev) => !prev);
    setSearchQuery("");
  };

  const handleConfirmLogout = () => {
    setShowLogoutConfirm(false);
    logout();
  };

  // Render function ensures search input doesn't lose focus during state updates
  const renderSidebar = (collapsed: boolean, allowCollapseToggle: boolean) => {
    const isDark = theme === "dark";

    return (
      <div
        className={`relative flex flex-col h-full shrink-0 transition-all duration-300 ease-in-out ${
          collapsed ? "w-[64px]" : "w-[280px]"
        } ${
          isDark 
            ? "bg-[var(--color-primary-darker)] border-r border-transparent shadow-xl" 
            : "bg-white border-r border-[var(--color-muted)] shadow-sm"
        }`}
      >
        {allowCollapseToggle && (
          <button
            onClick={toggleCollapse}
            className={`absolute top-6 -right-3.5 z-10 flex h-7 w-7 items-center justify-center rounded-full text-white shadow-md transition-colors cursor-pointer ${
              isDark 
                ? "bg-[var(--color-primary)] hover:bg-blue-500 shadow-black/40" 
                : "bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] shadow-[var(--color-primary-light)]"
            }`}
          >
            {collapsed ? <ChevronRight size={14} strokeWidth={3} /> : <ChevronLeft size={14} strokeWidth={3} />}
          </button>
        )}

        {/* Brand */}
        <div className={`flex items-center h-[88px] overflow-hidden transition-all duration-300 ${collapsed ? "px-0 justify-center" : "px-5"}`}>
          <BrandLogo variant="icon" className="h-12 w-12 object-contain rounded-xl shrink-0" />
          <span className={`text-lg font-extrabold tracking-wide transition-all duration-300 whitespace-nowrap overflow-hidden ${
            collapsed ? "w-0 opacity-0 ml-0" : "w-40 opacity-100 ml-3"
          } ${isDark ? "text-white" : "text-[var(--color-primary-darker)]"}`}>
            Staff Portal
          </span>
        </div>

        {/* Profile Card */}
        <div className="px-3 mb-4 shrink-0">
          <div className={`flex items-center rounded-2xl transition-all duration-300 overflow-hidden ${
            collapsed ? "justify-center p-2" : `p-3 ${isDark ? "bg-white/5 border border-white/5" : "bg-[var(--color-primary-lighter)]/50"}`
          }`}>
            <div className="relative shrink-0 flex items-center justify-center">
              {employeeAvatarUrl ? (
                <img src={employeeAvatarUrl} alt={employeeName} className={`h-8 w-8 rounded-full object-cover ring-2 ${isDark ? "ring-white/20" : "ring-[var(--color-primary-light)]"}`} />
              ) : (
                <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold text-white ring-2 ${isDark ? "bg-[var(--color-primary)] ring-white/20" : "bg-[var(--color-primary)] ring-[var(--color-primary-light)]"}`}>
                  {getInitials(employeeName)}
                </div>
              )}
              <span className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-emerald-400 ring-2 ${isDark ? "ring-[var(--color-primary-darker)]" : "ring-white"}`} />
            </div>
            
            <div className={`flex flex-col justify-center transition-all duration-300 whitespace-nowrap overflow-hidden ${collapsed ? "w-0 opacity-0 ml-0" : "w-full opacity-100 ml-3"}`}>
              <p className={`text-sm font-bold truncate ${isDark ? "text-white" : "text-[var(--color-primary-darker)]"}`}>
                {employeeName}
              </p>
              {employeeEmail && (
                <p className={`text-xs font-medium truncate mt-0.5 ${isDark ? "text-gray-400" : "text-[var(--color-gray)]"}`}>{employeeEmail}</p>
              )}
            </div>
          </div>
        </div>

        <div className={`border-t shrink-0 ${isDark ? "border-white/10" : "border-[var(--color-muted)]"}`} />

        {/* Smart Search Bar (Never Unmounts Input to Preserve Focus) */}
        <div className="px-4 py-4 shrink-0">
          <div 
            className={`relative flex items-center transition-all duration-300 overflow-hidden rounded-xl ${
              collapsed 
                ? `w-8 h-8 mx-auto cursor-pointer ${isDark ? "bg-white/5 hover:bg-white/10" : "bg-[var(--color-primary-lighter)] hover:bg-[var(--color-primary-light)]"}` 
                : `w-full h-11 ${isDark ? "bg-black/20 focus-within:bg-white/10" : "bg-[var(--color-primary-lighter)]/60 focus-within:bg-white shadow-sm"}`
            }`}
            onClick={() => collapsed && toggleCollapse()}
          >
            <Search 
              size={collapsed ? 18 : 16} 
              className={`absolute transition-all duration-300 pointer-events-none ${
                collapsed 
                  ? `left-1/2 -translate-x-1/2 ${isDark ? "text-gray-400" : "text-[var(--color-primary-darker)]"}` 
                  : `left-3.5 ${isDark ? "text-gray-400" : "text-[var(--color-gray)]"}`
              }`} 
            />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search..."
              tabIndex={collapsed ? -1 : 0}
              className={`h-full w-full bg-transparent border-transparent outline-none transition-all duration-300 text-sm ${
                collapsed ? "opacity-0 px-0 pointer-events-none" : "opacity-100 pl-10 pr-4"
              } ${isDark ? "text-white placeholder:text-gray-500" : "text-[var(--color-primary-darker)] placeholder:text-gray-500"}`}
            />
          </div>
        </div>

        {/* Nav Links */}
        <div className="flex flex-1 flex-col gap-1.5 px-2 overflow-y-auto overflow-x-hidden custom-scrollbar pb-4">
          {filteredLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            
            const activeClass = isDark 
              ? "bg-white/15 text-white shadow-md shadow-black/30" 
              : "bg-[var(--color-primary)] text-white shadow-md shadow-[var(--color-primary-light)]";
              
            const inactiveClass = isDark 
              ? "text-gray-400 hover:bg-white/10 hover:text-white" 
              : "text-[var(--color-gray)] hover:bg-[var(--color-primary-lighter)] hover:text-[var(--color-primary-darker)]";

            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`group relative flex items-center rounded-xl font-bold transition-all duration-200 ${
                  collapsed ? "justify-center p-2.5" : "px-3 py-3"
                } ${isActive ? activeClass : inactiveClass}`}
              >
                <span className={`shrink-0 flex h-7 w-7 items-center justify-center rounded-lg transition-colors ${
                    isActive ? (isDark ? "bg-white/20" : "bg-white/20") : (isDark ? "bg-white/5 group-hover:bg-white/10" : "bg-white group-hover:bg-[var(--color-primary-lighter)] shadow-sm")
                  }`}
                >
                  <Icon size={14} />
                </span>
                
                <span className={`transition-all text-sm duration-300 whitespace-nowrap overflow-hidden ${collapsed ? "w-0 opacity-0 ml-0" : "w-full opacity-100 ml-3"}`}>
                  {link.name}
                </span>

                {/* Tooltip for collapsed state */}
                {collapsed && (
                  <span className={`pointer-events-none absolute left-full z-50 ml-3 scale-95 whitespace-nowrap rounded-lg px-3 py-2 text-xs font-bold shadow-xl opacity-0 transition-all duration-150 group-hover:scale-100 group-hover:opacity-100 ${
                    isDark ? "bg-white text-[var(--color-primary-darker)]" : "bg-[var(--color-primary-darker)] text-white"
                  }`}>
                    {link.name}
                  </span>
                )}
              </Link>
            );
          })}
          {!collapsed && filteredLinks.length === 0 && (
            <p className={`px-4 py-4 text-sm text-center font-medium ${isDark ? "text-gray-500" : "text-gray-400"}`}>
              No matches found
            </p>
          )}
        </div>

        {/* Controls Footer: Theme + Sign Out */}
        <div className={`mt-auto p-4 border-t transition-colors duration-300 ${isDark ? "border-white/10 bg-black/10" : "border-[var(--color-muted)] bg-gray-50/50"}`}>
           <div className={`flex items-center transition-all duration-300 ${collapsed ? "flex-col gap-4" : "justify-between gap-3"}`}>
              
              {/* Theme Toggle Element */}
              {isMounted && (
                <div className={`flex items-center rounded-xl p-1 shrink-0 transition-all duration-300 ${collapsed ? "flex-col w-11" : "w-full max-w-[140px]"} ${isDark ? "bg-black/40" : "bg-white border border-gray-200 shadow-sm"}`}>
                   <button 
                     onClick={() => toggleTheme('light')} 
                     className={`flex items-center justify-center cursor-pointer transition-all duration-200 ${collapsed ? "w-9 h-9 rounded-lg mb-0.5" : "flex-1 py-1.5 rounded-lg"} ${!isDark ? "bg-[var(--color-primary-lighter)] text-[var(--color-primary-darker)] font-bold shadow-sm" : "text-gray-500 hover:text-white"}`}
                     title="Light Mode"
                   >
                      <Sun size={15} strokeWidth={2.5} />
                      {!collapsed && <span className="ml-2 text-[11px] uppercase tracking-wider">Light</span>}
                   </button>
                   <button 
                     onClick={() => toggleTheme('dark')} 
                     className={`flex items-center justify-center cursor-pointer transition-all duration-200 ${collapsed ? "w-9 h-9 rounded-lg mt-0.5" : "flex-1 py-1.5 rounded-lg"} ${isDark ? "bg-white/10 text-white font-bold shadow-sm" : "text-gray-400 hover:text-gray-700"}`}
                     title="Dark Mode"
                   >
                      <Moon size={15} strokeWidth={2.5} />
                      {!collapsed && <span className="ml-2 text-[11px] uppercase tracking-wider">Dark</span>}
                   </button>
                </div>
              )}

              {/* Signout Button */}
              <button
                onClick={() => setShowLogoutConfirm(true)}
                title="Sign Out"
                className={`shrink-0 flex items-center justify-center rounded-xl transition-all cursor-pointer w-9 h-9 ${
                  isDark 
                    ? "bg-[var(--color-primary)]/10 text-[var(--color-primary-light)] hover:bg-[var(--color-primary)] hover:text-white" 
                    : "bg-[var(--color-primary-lighter)] text-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:border-[var(--color-primary)] hover:text-white shadow-sm"
                }`}
              >
                <LogOut size={14} strokeWidth={2.5} className={!collapsed ? "ml-1" : ""} />
              </button>

           </div>
        </div>
      </div>
    );
  };

  return (
    <EmployeeProtectedRoute>
      <div className="flex h-screen overflow-hidden bg-[#f8fafc] font-sans">
        
        {/* Desktop Sidebar */}
        <div className="hidden h-full shrink-0 md:block">
          {renderSidebar(isCollapsed, true)}
        </div>

        {/* Mobile Sidebar overlay & drawer */}
        <div
          className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300 md:hidden ${
            isMobileMenuOpen ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
          onClick={() => setIsMobileMenuOpen(false)}
        />
        <div
          className={`fixed inset-y-0 left-0 z-50 flex transform flex-col transition-transform duration-300 ease-out md:hidden w-[280px] ${
            isMobileMenuOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
          }`}
        >
          {/* Mobile never collapses the internal layout */}
          {renderSidebar(false, false)}
          
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className={`absolute top-6 -right-14 p-2.5 rounded-full shadow-xl transition-all duration-300 cursor-pointer border ${
              isMobileMenuOpen ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-10 pointer-events-none"
            } ${
              theme === "dark" 
                ? "bg-[var(--color-primary-darker)] text-white border-white/10 hover:bg-[var(--color-primary)]" 
                : "bg-white text-[var(--color-primary-darker)] border-gray-100 hover:bg-gray-50"
            }`}
          >
            <X size={20} strokeWidth={2.5} />
          </button>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col h-full overflow-y-auto custom-scrollbar">
          
          {/* Mobile Header (PRESERVED EXACTLY AS YOU REQUESTED) */}
          <div className="md:hidden flex items-center justify-between p-4 bg-white border-b border-[var(--color-muted)] shadow-sm sticky top-0 z-30">
            <Link href="/employee/profile" className="flex items-center gap-1">
             {/*  {employeeAvatarUrl ? (
                <img
                  src={employeeAvatarUrl}
                  alt={employeeName}
                  className="h-10 w-10 rounded-full object-cover ring-2 ring-[var(--color-primary-light)]"
                />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-primary)] text-sm font-semibold text-white ring-2 ring-[var(--color-primary-light)]">
                  {getInitials(employeeName)}
                </div>
              )} */}
               <BrandLogo
                          variant="icon"
                          className="h-10 w-10 object-contain"
                        />
              <div className="min-w-0">
               {/*  <p className="truncate text-sm font-bold text-[var(--color-primary-darker)]">
                  {employeeName}
                </p> */}
                <p className="truncate text-lg font-extrabold text-[var(--color-primary-darker)]">Staff Portal</p>
              </div>
            </Link>

            <div className=" flex items-center justify-center gap-4">
                <Link href="/employee/clock" className="  rounded-full  transition-all duration-300 cursor-pointer  grid place-items-center ">
            <Clock size={16} className="inline-block " />
          </Link>
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 text-[var(--color-primary-darker)] hover:bg-[var(--color-primary-lighter)] rounded-xl transition-colors cursor-pointer"
            >
              <Menu size={24} />
            </button>
            </div>
          </div>

          {/* Page Content (Added pb-24 so content doesn't hide behind the new bottom navigation) */}
          <div className="p-2 sm:p-8 max-w-7xl mx-auto w-full flex-1 pb-24 md:pb-4">
            {children}
          </div>
        </div>

        {/* NEW: MOBILE BOTTOM NAVIGATION */}
        <MobileBottomNav pathname={pathname} theme={theme} />

      </div>

      {/* Sign-out confirmation dialog */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in-0 duration-200"
            onClick={() => setShowLogoutConfirm(false)}
          />
          <div
            role="alertdialog"
            aria-modal="true"
            className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl p-6 animate-in fade-in-0 zoom-in-95 duration-200"
          >
            <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mb-5 border border-red-100">
              <LogOut size={24} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Sign out of Staff Portal?
            </h3>
            <p className="text-sm text-gray-500 mb-8 font-medium">
              You&apos;ll need to sign back in to clock in, view attendance, or check your profile.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 px-4 py-3.5 rounded-xl bg-gray-100 text-gray-700 font-bold hover:bg-gray-200 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmLogout}
                autoFocus
                className="flex-1 px-4 py-3.5 rounded-xl bg-[var(--color-destructive)] text-white font-bold hover:bg-red-600 transition-colors shadow-md shadow-red-200 cursor-pointer"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </EmployeeProtectedRoute>
  );
}

export default function EmployeeLayout({ children }: { children: ReactNode }) {
  return (
    <EmployeeAuthProvider>
      <EmployeeLayoutContent>{children}</EmployeeLayoutContent>
    </EmployeeAuthProvider>
  );
}
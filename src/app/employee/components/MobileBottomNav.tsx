"use client";

import Link from "next/link";
import { Calendar, User, Shield, Clock } from "lucide-react";
import { FaTasks } from "react-icons/fa";

interface MobileBottomNavProps {
  pathname: string;
  theme: "light" | "dark";
}

export default function MobileBottomNav({ pathname, theme }: MobileBottomNavProps) {
  const isDark = theme === "dark";

  return (
    <div className={`md:hidden fixed bottom-0 left-0 w-full z-40 transition-colors duration-300 ${
      isDark ? "bg-[var(--color-primary-darker)] border-t border-white/10" : "bg-white border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]"
    }`}>
      <div className="flex items-center justify-between px-2 h-16 relative max-w-md mx-auto">
        
        {/* Left Side Navigation */}
        <div className="flex flex-1 items-center justify-evenly">
          <Link href="/employee/task" className="flex flex-col items-center justify-center w-full h-full gap-1 group">
            <FaTasks size={20} className={`transition-colors ${pathname === "/employee/task" ? "text-[var(--color-primary)]" : isDark ? "text-gray-400 group-hover:text-gray-200" : "text-gray-400 group-hover:text-gray-600"}`} />
            <span className={`text-[10px] font-bold ${pathname === "/employee/task" ? "text-[var(--color-primary)]" : isDark ? "text-gray-500" : "text-gray-400"}`}>Tasks</span>
          </Link>
          
          <Link href="/employee/attendance" className="flex flex-col items-center justify-center w-full h-full gap-1 group">
            <Calendar size={22} className={`transition-colors ${pathname === "/employee/attendance" ? "text-[var(--color-primary)]" : isDark ? "text-gray-400 group-hover:text-gray-200" : "text-gray-400 group-hover:text-gray-600"}`} />
            <span className={`text-[10px] font-bold ${pathname === "/employee/attendance" ? "text-[var(--color-primary)]" : isDark ? "text-gray-500" : "text-gray-400"}`}>Log</span>
          </Link>
        </div>

        {/* Center Floating Button Spacer (Maintains Layout Grid) */}
        <div className="w-16 shrink-0 flex justify-center relative">
          <Link 
            href="/employee/clock" 
            className={`absolute -top-7 flex items-center justify-center w-14 h-14 rounded-full shadow-lg transition-transform active:scale-95 cursor-pointer border-[4px] ${
              isDark 
                ? "bg-[var(--color-primary)] text-white shadow-black/50 border-[var(--color-primary-darker)]" 
                : "bg-[var(--color-primary)] text-white shadow-[var(--color-primary-light)] border-white"
            }`}
          >
            <Clock size={24} strokeWidth={2.5} className={pathname === "/employee/clock" ? "animate-pulse" : ""} />
          </Link>
        </div>

        {/* Right Side Navigation */}
        <div className="flex flex-1 items-center justify-evenly">
          <Link href="/employee/profile" className="flex flex-col items-center justify-center w-full h-full gap-1 group">
            <User size={22} className={`transition-colors ${pathname === "/employee/profile" ? "text-[var(--color-primary)]" : isDark ? "text-gray-400 group-hover:text-gray-200" : "text-gray-400 group-hover:text-gray-600"}`} />
            <span className={`text-[10px] font-bold ${pathname === "/employee/profile" ? "text-[var(--color-primary)]" : isDark ? "text-gray-500" : "text-gray-400"}`}>Profile</span>
          </Link>
          
          <Link href="/employee/company-policies" className="flex flex-col items-center justify-center w-full h-full gap-1 group">
            <Shield size={22} className={`transition-colors ${pathname === "/employee/company-policies" ? "text-[var(--color-primary)]" : isDark ? "text-gray-400 group-hover:text-gray-200" : "text-gray-400 group-hover:text-gray-600"}`} />
            <span className={`text-[10px] font-bold ${pathname === "/employee/company-policies" ? "text-[var(--color-primary)]" : isDark ? "text-gray-500" : "text-gray-400"}`}>Policies</span>
          </Link>
        </div>

      </div>
    </div>
  );
}
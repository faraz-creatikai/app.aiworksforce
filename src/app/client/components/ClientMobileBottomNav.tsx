"use client";

import Link from "next/link";
import { LayoutDashboard, Activity, Briefcase } from "lucide-react";

interface MobileBottomNavProps {
    pathname: string;
    theme: "light" | "dark";
}

export default function ClientMobileBottomNav({ pathname, theme }: MobileBottomNavProps) {
    const isDark = theme === "dark";

    return (
        <div className={`md:hidden fixed bottom-0 left-0 w-full z-40 transition-colors duration-300 ${isDark ? "bg-[var(--color-primary-darker)] border-t border-white/10" : "bg-white border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]"
            }`}>
            <div className="flex items-center justify-between px-2 h-12 relative max-w-md mx-auto">

                {/* Left Side Navigation (Dashboard) */}
                <div className="flex flex-1 items-center justify-evenly">
                    <Link href="/client/dashboard" className="flex flex-col items-center justify-center w-full h-full gap-1 group">
                        <LayoutDashboard size={22} className={`transition-colors ${pathname === "/client/dashboard" ? "text-[var(--color-primary-light)]" : isDark ? "text-gray-100 group-hover:text-gray-200" : "text-gray-400 group-hover:text-gray-600"}`} />
                        <span className={`text-[10px] font-bold ${pathname === "/client/dashboard" ? "text-[var(--color-primary-light)]" : isDark ? "text-gray-100" : "text-gray-200"}`}>
                            Dashboard
                        </span>
                    </Link>
                </div>

                {/* Center Floating Button Spacer (Updates) */}
                <div className="w-16 shrink-0 flex justify-center relative">
                    <Link
                        href="/client/updates"
                        className={`absolute -top-11 flex items-center justify-center w-14 h-14 rounded-full shadow-lg transition-transform active:scale-95 cursor-pointer border-[4px] ${isDark
                                ? "bg-[var(--color-primary)] text-white shadow-black/50 border-[var(--color-primary-darker)]"
                                : "bg-[var(--color-primary)] text-white shadow-[var(--color-primary-light)] border-white"
                            }`}
                    >
                        <Activity size={24} strokeWidth={2.5} className={pathname === "/client/updates" ? "animate-pulse" : ""} />
                    </Link>
                </div>

                {/* Right Side Navigation (Profile) */}
                <div className="flex flex-1 items-center justify-evenly">
                    <Link href="/client/profile" className={`flex flex-col items-center justify-center p-2 h-full gap-1 group ${pathname === "/client/profile" ? "bg-white/15":""}`}>
                        <Briefcase size={22} className={`transition-colors ${pathname === "/client/profile" ? "text-[var(--color-primary-light)]" : isDark ? "text-gray-100 group-hover:text-gray-200" : "text-gray-400 group-hover:text-gray-600"}`} />
                        <span className={`text-[10px] font-bold ${pathname === "/client/profile" ? "text-[var(--color-primary-light)]" : isDark ? "text-gray-100" : "text-gray-400"}`}>
                            Profile
                        </span>
                    </Link>
                </div>

            </div>
        </div>
    );
}
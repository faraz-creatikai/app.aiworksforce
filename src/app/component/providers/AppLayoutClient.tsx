"use client";

import { ReactNode, useEffect } from "react";
import { usePathname } from "next/navigation";
import Navbar from "@/app/component/Nav";
import { AppSidebar } from "@/components/app-sidebar";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import ProtectedRoute from "@/app/component/ProtectedRoutes";
import MobileHamburger from "@/app/component/HamburgerMenu";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { disconnectSocket, initSocket } from "@/socket/socket";
import AIAgentPanel from "../aiagents/panels/AiAgentPanel";

export default function AppLayoutClient({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { admin } = useAuth();

  useEffect(() => {
    if (!admin?._id) return;
    console.log("admin id in AppLayoutClient: ", admin._id);
    initSocket(admin._id);
    return () => disconnectSocket();
  }, [admin?._id]);

  // 1. Existing check for Admin-side public pages
  const isAdminPage =
    pathname === "/admin" ||
    pathname === "/register" ||
    pathname === "/enquiry" ||
    pathname === "/register/client" ||
    pathname === "/" ||
    pathname === "/system/maintenance/access/signup";

  // 2. NEW: Check if this is the Employee Portal
const isEmployeePage = pathname === "/employee" || pathname.startsWith("/employee/");

// 🚨 ADDED: Identify client pages
  const isClientPage = pathname === "/client" || pathname.startsWith("/client/");

  // 🚨 ADDED: Bypass Admin UI for Client pages too
  if (isAdminPage || isEmployeePage || isClientPage) {
    return <main className="min-h-screen">{children} </main>;
  }

  // Everything below here is strictly for logged-in Admins viewing the CRM dashboard
  return (
    <ProtectedRoute>
      <SidebarProvider>
        <div className="flex min-h-screen w-full  dark:text-black overflow-hidden">
          {/* Sidebar */}
          <AppSidebar />

          {/* Main */}
          <SidebarInset className="flex flex-col flex-1 min-h-screen overflow-hidden">
            {/* Navbar */}
            <header className="flex items-center gap-2 shrink-0 bg-white max-sm:fixed max-sm:top-0 max-sm:left-0 max-sm:w-full max-sm:bg-[var(--color-primary)] text-gray-800 px-4 pl-0 shadow-sm z-10">

              <div className="flex items-center gap-2 ml-2 max-sm:hidden">
                <SidebarTrigger className="ml-1 cursor-pointer" />
                <Separator orientation="vertical" className="mr-2 h-4" />
              </div>

              <MobileHamburger />

              <Link
                href={"/dashboard"}
                className="text-white cursor-pointer font-extrabold text-xl py-1 sm:hidden"
              >
                Dashboard
              </Link>

              <div className="ml-auto w-full">
                <Navbar />
              </div>
            </header>

            {/* Content */}
            <main className="flex-1 overflow-y-auto bg-[#f4f7fe]">
              <div className="flex items-center gap-2 max-w-[100px] mt-4 ml-4 sm:hidden">
                <SidebarTrigger className="ml-1" />
                <Separator orientation="vertical" className="mr-2 h-4" />
              </div>

              <div className="p-4 max-md:px-2 max-md:py-4 ">
                {children}
              </div>
            </main>
          </SidebarInset>
        </div>
      </SidebarProvider>
        <AIAgentPanel />
    </ProtectedRoute>
  );
}
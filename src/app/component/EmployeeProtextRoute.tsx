"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useEmployeeAuth } from "@/context/EmployeeAuthContext";

export default function EmployeeProtectedRoute({ children }: { children: React.ReactNode }) {
  const { employee, isLoading } = useEmployeeAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    if (isLoading) return;

    if (!employee && pathname !== "/employee/login") {
      setIsRedirecting(true);
      router.replace("/employee/login");
      return;
    }

    if (employee && pathname === "/employee/login") {
      setIsRedirecting(true);
      router.replace("/employee/clock");
      return;
    }

    setIsRedirecting(false);
  }, [employee, isLoading, pathname, router]);

  if (isLoading || isRedirecting) {
    return (
      <div className="grid place-items-center min-h-screen bg-[var(--color-primary-lighter)]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-[var(--color-gray)]">Loading Workspace...</p>
        </div>
      </div>
    );
  }

  if (!employee) return null;

  return <>{children}</>;
}
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCustomerAuth } from "@/context/CustomerAuthContext";
import { Loader2 } from "lucide-react";

export default function CustomerProtectedRoute({ children }: { children: React.ReactNode }) {
  const { customer, isLoading } = useCustomerAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !customer) {
      router.push("/client/login");
    }
  }, [isLoading, customer, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 size={40} className="text-[var(--color-primary)] animate-spin" />
      </div>
    );
  }

  if (!customer) return null;

  return <>{children}</>;
}
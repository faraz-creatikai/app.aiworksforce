"use client";

import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { employeeLogin } from "@/store/attendance/attendance";
import { checkEmployeeAuth, employeeLogout } from "@/store/attendance/attendance"; // Import your new API calls
import { EmployeeLoginPayloadInterface } from "@/store/attendance/attendance.interface";
import toast from "react-hot-toast";

// Define the Employee interface
export interface Employee {
  id: string;
  name: string;
  email: string;
}

interface EmployeeAuthContextType {
  employee: Employee | null;
  isLoading: boolean;
  login: (credentials: EmployeeLoginPayloadInterface) => Promise<void>;
  logout: () => Promise<void>;
}

const EmployeeAuthContext = createContext<EmployeeAuthContextType>({} as EmployeeAuthContextType);

export const EmployeeAuthProvider = ({ children }: { children: ReactNode }) => {
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Secure auth check: Ping the backend to verify the HTTP-only cookie
    const initAuth = async () => {
      try {
        const data = await checkEmployeeAuth();
        
        if (data?.success && data.employee) {
          setEmployee(data.employee as Employee);
          // Optional: You can keep localStorage as a fallback for rapid UI rendering,
          // but the source of truth is now the backend cookie verification.
          localStorage.setItem("employee_data", JSON.stringify(data.employee));
        } else {
          setEmployee(null);
          localStorage.removeItem("employee_data");
        }
      } catch (error) {
        setEmployee(null);
        localStorage.removeItem("employee_data");
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (credentials: EmployeeLoginPayloadInterface) => {
    const data = await employeeLogin(credentials);
    if (data?.success && data.employee) {
      const empData = data.employee as Employee;
      setEmployee(empData);
      localStorage.setItem("employee_data", JSON.stringify(empData));
      toast.success(data.message || "Logged in successfully");
    }
  };

  const logout = async () => {
    // Optimistically clear frontend state immediately
    setEmployee(null);
    localStorage.removeItem("employee_data");
    
    // Call backend to destroy the HTTP-only cookie
    await employeeLogout();
    
    toast.success("Logged out successfully");
  };

  return (
    <EmployeeAuthContext.Provider value={{ employee, isLoading, login, logout }}>
      {children}
    </EmployeeAuthContext.Provider>
  );
};

export const useEmployeeAuth = () => {
  const context = useContext(EmployeeAuthContext);
  if (!context) throw new Error("useEmployeeAuth must be used within EmployeeAuthProvider");
  return context;
};
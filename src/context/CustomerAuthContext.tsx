"use client";

import { createContext, useContext, useState, ReactNode, useEffect } from "react";
// 🚨 Import the API functions we created earlier
import { customerLogin, checkCustomerAuth, customerLogout } from "@/store/customer"; 
import toast from "react-hot-toast";

export interface Customer {
  id: string;
  name: string;
  email: string;
  CustomerImage?: string;
}

interface CustomerAuthContextType {
  customer: Customer | null;
  isLoading: boolean;
  login: (credentials: { Email: string; Password: string }) => Promise<void>;
  logout: () => Promise<void>;
}

const CustomerAuthContext = createContext<CustomerAuthContextType>({} as CustomerAuthContextType);

export const CustomerAuthProvider = ({ children }: { children: ReactNode }) => {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const data = await checkCustomerAuth();
        if (data?.success && data.customer) {
          setCustomer(data.customer as Customer);
          localStorage.setItem("customer_data", JSON.stringify(data.customer));
        } else {
          setCustomer(null);
          localStorage.removeItem("customer_data");
        }
      } catch (error) {
        setCustomer(null);
        localStorage.removeItem("customer_data");
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (credentials: { Email: string; Password: string }) => {
    const data = await customerLogin(credentials);
    if (data?.success && data.customer) {
      const custData = data.customer as Customer;
      setCustomer(custData);
      localStorage.setItem("customer_data", JSON.stringify(custData));
      toast.success(data.message || "Logged in successfully");
    } else {
      toast.error(data?.message || "Invalid credentials");
    }
  };

  const logout = async () => {
    setCustomer(null);
    localStorage.removeItem("customer_data");
    await customerLogout();
    toast.success("Logged out successfully");
  };

  return (
    <CustomerAuthContext.Provider value={{ customer, isLoading, login, logout }}>
      {children}
    </CustomerAuthContext.Provider>
  );
};

export const useCustomerAuth = () => {
  const context = useContext(CustomerAuthContext);
  if (!context) throw new Error("useCustomerAuth must be used within CustomerAuthProvider");
  return context;
};
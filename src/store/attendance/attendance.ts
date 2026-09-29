import { API_ROUTES } from "@/constants/ApiRoute";
import { toast } from "react-toastify"; // Adjust import based on your toast library
import {
  EmployeeLoginPayloadInterface,
  AdminUpdateAttendancePayloadInterface,
  AttendanceResponseInterface,
} from "./attendance.interface";

// ==========================================
// EMPLOYEE API CALLS
// ==========================================

export const employeeLogin = async (data: EmployeeLoginPayloadInterface): Promise<AttendanceResponseInterface | null> => {
  try {
    const response = await fetch(API_ROUTES.ATTENDANCE.EMPLOYEE_LOGIN, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
      credentials: "include",
    });

    const result = await response.json();
    if (!result.success) {
      toast.error(result.message ?? "Login failed");
      throw new Error(result.message ?? "Login failed");
    }
    return result;
  } catch (error) {
    console.error("SERVER ERROR: ", error);
    return null;
  }
};

export const employeeLogout = async (): Promise<AttendanceResponseInterface | null> => {
  try {
    const response = await fetch(API_ROUTES.ATTENDANCE.EMPLOYEE_LOGOUT, {
      method: "POST",
      credentials: "include",
    });
    const result = await response.json();
    if (!result.success) {
      toast.error(result.message ?? "Failed to logout");
      throw new Error(result.message ?? "Failed to logout");
    }
    toast.success(result.message ?? "Logged out successfully");
    return result;
  } catch (error) {
    console.error("SERVER ERROR: ", error);
    return null;
  }
};

export const checkEmployeeAuth = async (): Promise<AttendanceResponseInterface | null> => {
  try {
    const response = await fetch(API_ROUTES.ATTENDANCE.EMPLOYEE_CHECK, {
      method: "GET",
      credentials: "include",
    });
    const result = await response.json();
    if (!result.success) {
      toast.error(result.message ?? "Authentication failed");
      throw new Error(result.message ?? "Authentication failed");
    }
    return result;
  } catch (error) {
    console.error("SERVER ERROR: ", error);
    return null;
  }
};

export const clockIn = async (): Promise<AttendanceResponseInterface | null> => {
  try {
    const response = await fetch(API_ROUTES.ATTENDANCE.CLOCK_IN, {
      method: "POST",
      credentials: "include",
    });

    const result = await response.json();
    if (!result.success) {
      toast.error(result.message ?? "Failed to clock in");
      throw new Error(result.message ?? "Failed to clock in");
    }
    toast.success(result.message ?? "Clocked in successfully");
    return result;
  } catch (error) {
    console.error("SERVER ERROR: ", error);
    return null;
  }
};

export const clockOut = async (): Promise<AttendanceResponseInterface | null> => {
  try {
    const response = await fetch(API_ROUTES.ATTENDANCE.CLOCK_OUT, {
      method: "POST",
      credentials: "include",
    });

    const result = await response.json();
    if (!result.success) {
      toast.error(result.message ?? "Failed to clock out");
      throw new Error(result.message ?? "Failed to clock out");
    }
    toast.success(result.message ?? "Clocked out successfully");
    return result;
  } catch (error) {
    console.error("SERVER ERROR: ", error);
    return null;
  }
};

export const getEmployeeReport = async (): Promise<AttendanceResponseInterface | null> => {
  try {
    const response = await fetch(API_ROUTES.ATTENDANCE.GET_EMPLOYEE_REPORT, {
      credentials: "include",
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("SERVER ERROR: ", error);
    return null;
  }
};

export const getFilteredEmployeeReport = async (params: string): Promise<any | null> => {
  try {
    const response = await fetch(API_ROUTES.ATTENDANCE.GET_EMPLOYEE_REPORT_BY_PARAMS(params), {
      credentials: "include",
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = await response.json();
    console.log(" params : ", params, "\n", " Data:", data);
    return data;
  } catch (error) {
    console.error("SERVER ERROR: ", error);
    return null;
  }
};

export const employeeManualUpdate = async (data: any): Promise<AttendanceResponseInterface | null> => {
  try {
    console.log("Employee manual update payload: ", data);
    const response = await fetch(API_ROUTES.ATTENDANCE.EMPLOYEE_MANUAL_UPDATE, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
      credentials: "include",
    });
    const result = await response.json();
    if (!result.success) {
      toast.error(result.message ?? "Failed to update attendance");
      throw new Error(result.message ?? "Failed to update attendance");
    }
    toast.success(result.message ?? "Attendance updated successfully");
    return result;
  }
  catch (error) {
    console.error("SERVER ERROR: ", error);
    return null;
  }
};

export const getEmployeeById = async (id: string) => {
  try {
    const response = await fetch(API_ROUTES.ATTENDANCE.GET_BY_ID(id), { credentials: "include" });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = await response.json();
    return data;
  }
  catch (error) {
    console.log("SERVER ERROR: ", error)
    return null;
  }
}


// ----------------------------------------------------
// 1. GET ALL EMPLOYEES (Standard)
// ----------------------------------------------------
export const getEmployees = async () => {
  try {
    const response = await fetch(API_ROUTES.ATTENDANCE.GET_ALL, { credentials: "include" });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.log("SERVER ERROR: ", error);
    return null;
  }
};

// ----------------------------------------------------
// 2. GET FILTERED EMPLOYEES (Search, Pagination, etc.)
// ----------------------------------------------------
export const getFilteredEmployee = async (params: string) => {
  try {
    const response = await fetch(API_ROUTES.ATTENDANCE.GET_BY_PARAMS(params), { credentials: "include" });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = await response.json();
    // Keeping your debugging console log format
    console.log(" params : ", params, "\n", " Data:", data);
    return data;
  } catch (error) {
    console.log("SERVER ERROR: ", error);
    return null;
  }
};



// CREATE EMPLOYEE (Handles FormData for images)
export const createEmployee = async (formData: FormData) => {
  try {
    const response = await fetch(API_ROUTES.ATTENDANCE.CREATE, {
      method: "POST",
      credentials: "include",
      body: formData, // Do NOT set Content-Type header manually when sending FormData
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.log("SERVER ERROR: ", error);
    return null;
  }
};

// UPDATE EMPLOYEE (Handles FormData for images)
export const updateEmployee = async (id: string, formData: FormData) => {
  try {
    const response = await fetch(API_ROUTES.ATTENDANCE.UPDATE(id), {
      method: "PUT",
      credentials: "include",
      body: formData,
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.log("SERVER ERROR: ", error);
    return null;
  }
};

// DELETE EMPLOYEES (Expects array of IDs)
export const deleteEmployees = async (employeeIds: string[]) => {
  try {
    const response = await fetch(API_ROUTES.ATTENDANCE.DELETE, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ employeeIds }),
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.log("SERVER ERROR: ", error);
    return null;
  }
};

// ==========================================
// ADMIN API CALLS
// ==========================================

export const adminUpdateAttendance = async (data: AdminUpdateAttendancePayloadInterface): Promise<AttendanceResponseInterface | null> => {
  try {
    console.log("Admin updating attendance payload: ", data);
    const response = await fetch(API_ROUTES.ATTENDANCE.ADMIN_UPDATE_ATTENDANCE, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
      credentials: "include",
    });

    const result = await response.json();
    if (!result.success) {
      toast.error(result.message ?? "Failed to update attendance");
      throw new Error(result.message ?? "Failed to update attendance");
    }
    toast.success(result.message ?? "Attendance updated successfully");
    return result;
  } catch (error) {
    console.error("SERVER ERROR: ", error);
    return null;
  }
};

export const getAdminAttendanceReport = async (): Promise<AttendanceResponseInterface | null> => {
  try {
    const response = await fetch(API_ROUTES.ATTENDANCE.GET_ADMIN_REPORT, {
      credentials: "include",
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("SERVER ERROR: ", error);
    return null;
  }
};

export const getFilteredAdminAttendanceReport = async (params: string): Promise<AttendanceResponseInterface | null> => {
  try {
    const response = await fetch(API_ROUTES.ATTENDANCE.GET_ADMIN_REPORT_BY_PARAMS(params), {
      credentials: "include",
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = await response.json();
    console.log(" Admin Report params : ", params, "\n", " Data:", data);
    return data;
  } catch (error) {
    console.error("SERVER ERROR: ", error);
    return null;
  }
};


//analytics of attendance

export const getAttendanceTrendData = async (startDate: string, endDate: string) => {
  try {
    const response = await fetch(API_ROUTES.ATTENDANCE.GET_ATTENDANCE_TREND(startDate, endDate), {
      credentials: "include",
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("SERVER ERROR: ", error);
    return null;
  }
};


export const getAttendanceOverviewData = async (startDate: string, endDate: string) => {
  try {
    const response = await fetch(API_ROUTES.ATTENDANCE.GET_ATTENDANCE_OVERVIEW(startDate, endDate), {
      credentials: "include",
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("SERVER ERROR: ", error);
    return null;
  }
};
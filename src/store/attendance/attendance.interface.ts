export type AttendanceStatus = "present" | "absent" | "half_day" | "leave";

export interface EmployeeLoginPayloadInterface {
  Email: string;
  Password: string;
}

export interface AdminUpdateAttendancePayloadInterface {
  employeeId: string;
  dateString: string; // Format: YYYY-MM-DD
  status: AttendanceStatus;
  clockIn?: string | Date | null;
  clockOut?: string | Date | null;
  notes?: string | null;
}

// Optional: Generic response interface to avoid 'any' in API returns
export interface AttendanceResponseInterface<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  summary?: unknown;
  stats?: unknown;
  count?: number;
  token?: string;
  employee?: unknown;
}
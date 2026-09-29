export type TaskStatus = "todo" | "in_progress" | "under_review" | "completed";
export type TaskPriority = "low" | "medium" | "high" | "urgent";

// --- ADMIN PAYLOADS ---
export interface AdminCreateTaskPayload {
  title: string;
  description?: string;
  priority?: TaskPriority;
  dueDate?: string; // Pass ISO string or date string
  assignedToId: string;
  subTasks?: { title: string; description?: string | null }[];
}

export interface AdminUpdateTaskPayload extends Partial<AdminCreateTaskPayload> {
  status?: TaskStatus;
  customerId?:string;
}

export interface TaskDeletePayloadInterface {
  taskIds: string[];
}

// --- EMPLOYEE PAYLOADS ---
export interface EmployeeUpdateTaskStatusPayload {
  status: TaskStatus;
}

export interface SubTaskCreatePayload {
  taskId: string;
  title: string;
}

export interface SubTaskTogglePayload {
  isCompleted: boolean;
}


export interface SubTaskUpdateStatusPayload {
  status: TaskStatus;
}

// --- GENERIC RESPONSE ---
export interface TaskApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  count?: number;
}


// ai task interfaces
export interface AIGenerateSubtasksPayload {
  title: string;
  description?: string;
  assignedToId?: string;
  customerId? : string;
}

export interface GeneratedSubtask {
  title: string;
  description?: string;
}

export interface AIGenerateSubtasksResponse {
  success: boolean;
  message?: string;
  data?: GeneratedSubtask[];
}
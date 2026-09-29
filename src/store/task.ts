import { API_ROUTES } from "@/constants/ApiRoute";
import {
  AdminCreateTaskPayload,
  AdminUpdateTaskPayload,
  TaskDeletePayloadInterface,
  EmployeeUpdateTaskStatusPayload,
  SubTaskCreatePayload,
  SubTaskTogglePayload,
  TaskApiResponse,
  AIGenerateSubtasksPayload,
  AIGenerateSubtasksResponse,
  SubTaskUpdateStatusPayload
} from "./task.interface";
import toast from "react-hot-toast";

// ==================================================================
// 🏢 ADMIN API CALLS (CRM Portal)
// ==================================================================

export const getAdminTasks = async (): Promise<TaskApiResponse | null> => {
  try {
    const response = await fetch(API_ROUTES.TASK.ADMIN_GET_ALL, { credentials: "include" });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("SERVER ERROR: ", error);
    return null;
  }
};

export const getFilteredAdminTasks = async (params: string): Promise<TaskApiResponse | null> => {
  try {
    const response = await fetch(API_ROUTES.TASK.ADMIN_GET_BY_PARAMS(params), { credentials: "include" });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("SERVER ERROR: ", error);
    return null;
  }
};

export const addAdminTask = async (payload: AdminCreateTaskPayload): Promise<TaskApiResponse | null> => {
  try {
    const response = await fetch(API_ROUTES.TASK.ADMIN_ADD, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      credentials: "include"
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("SERVER ERROR: ", error);
    return null;
  }
};

export const updateAdminTask = async (id: string, payload: AdminUpdateTaskPayload): Promise<TaskApiResponse | null> => {
  try {
    const response = await fetch(API_ROUTES.TASK.ADMIN_UPDATE(id), {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      credentials: "include"
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("SERVER ERROR: ", error);
    return null;
  }
};

export const deleteAdminTasks = async (payload: TaskDeletePayloadInterface): Promise<TaskApiResponse | null> => {
  try {
    const response = await fetch(API_ROUTES.TASK.ADMIN_DELETE, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      credentials: "include"
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("SERVER ERROR: ", error);
    return null;
  }
};


// ==================================================================
// 🧑‍💻 EMPLOYEE API CALLS (Staff Workspace)
// ==================================================================

export const getEmployeeTasks = async (params?: string): Promise<TaskApiResponse | null> => {
  try {
    // If params exist, append them with a '?', otherwise use the base URL
    const url = params 
      ? `${API_ROUTES.TASK.EMPLOYEE_GET_ALL}?${params}` 
      : API_ROUTES.TASK.EMPLOYEE_GET_ALL;

    const response = await fetch(url, { credentials: "include" });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("SERVER ERROR: ", error);
    return null;
  }
};

export const updateEmployeeTaskStatus = async (id: string, payload: EmployeeUpdateTaskStatusPayload): Promise<TaskApiResponse | null> => {
  try {
    const response = await fetch(API_ROUTES.TASK.EMPLOYEE_UPDATE_STATUS(id), {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      credentials: "include"
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("SERVER ERROR: ", error);
    return null;
  }
};


// ==================================================================
// 📝 SUBTASK API CALLS (Staff Workspace)
// ==================================================================

export const addSubTask = async (payload: SubTaskCreatePayload): Promise<TaskApiResponse | null> => {
  try {
    const response = await fetch(API_ROUTES.TASK.SUBTASK_ADD, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      credentials: "include"
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("SERVER ERROR: ", error);
    return null;
  }
};

export const updateSubTaskStatus = async (id: string, payload: SubTaskUpdateStatusPayload): Promise<TaskApiResponse | null> => {
  try {
    const response = await fetch(API_ROUTES.TASK.SUBTASK_UPDATE_STATUS(id), {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      credentials: "include"
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("SERVER ERROR: ", error);
    return null;
  }
};

export const toggleSubTask = async (id: string, payload: SubTaskTogglePayload): Promise<TaskApiResponse | null> => {
  try {
    const response = await fetch(API_ROUTES.TASK.SUBTASK_TOGGLE(id), {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      credentials: "include"
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("SERVER ERROR: ", error);
    return null;
  }
};

export const deleteSubTask = async (id: string): Promise<TaskApiResponse | null> => {
  try {
    const response = await fetch(API_ROUTES.TASK.SUBTASK_DELETE(id), {
      method: "DELETE",
      credentials: "include"
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("SERVER ERROR: ", error);
    return null;
  }
};



//ai task api function

// ---------------------------------------------
// AI GENERATE SUBTASKS
// ---------------------------------------------
export const generateSubtasksAI = async (
  data: AIGenerateSubtasksPayload
): Promise<AIGenerateSubtasksResponse | null> => {
  try {
    const response = await fetch(API_ROUTES.TASK.GENERATE_SUBTASKS_AI, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
      credentials: "include",
    });

    const result = await response.json();
    
    if (!result.success) {
      toast.error(result.message ?? "Failed to generate subtasks");
      throw new Error(result.message ?? "Failed to generate subtasks");
    }
    
    toast.success("Subtasks generated successfully ✨");
    return result;
    
  } catch (error) {
    console.error("SERVER ERROR: ", error);
    return null;
  }
};

export const assignAdminTaskViaAI = async (data: { prompt: string; assignedToIds: string[];  customerId:string | null }) => {
  try {
    const response = await fetch(API_ROUTES.TASK.ASSIGN_TASK_AI, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
      credentials: "include",
    });
    const result = await response.json();
    if (!result.success) {
      toast.error(result.message ?? "AI Agent failed to assign task");
      throw new Error(result.message);
    }
    toast.success(result.message || "✨ AI successfully assigned the tasks!");
    return result;
  } catch (error) {
    console.error(error);
    return null;
  }
};

// ==========================================
// AI WORKSPACE: Micro-QA & Macro-QA
// ==========================================

export const verifySubTaskAI = async (
  subTaskId: string, 
  payload: { submittedProof: string }
): Promise<any> => {
  try {
    const response = await fetch(API_ROUTES.TASK.SUBTASK_VERIFY_AI(subTaskId), {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || `HTTP error! status: ${response.status}`);
    return data;
  } catch (error) {
    console.error("verifySubTaskAI ERROR: ", error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : "Failed to verify step with AI." 
    };
  }
};

export const submitTaskMacroReview = async (taskId: string): Promise<any> => {
  try {
    const response = await fetch(API_ROUTES.TASK.EMPLOYEE_SUBMIT_MACRO_REVIEW(taskId), {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || `HTTP error! status: ${response.status}`);
    return data;
  } catch (error) {
    console.error("submitTaskMacroReview ERROR: ", error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : "Failed to submit task for final review." 
    };
  }
};
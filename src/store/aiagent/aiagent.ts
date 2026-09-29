// note: do not use any

import { API_ROUTES } from "@/constants/ApiRoute";
import { aiagentAllDataInterface, aiagentAssignInterface } from "./aiagent.interface";


export const getAIAgent = async () => {
    try {
        const response = await fetch(API_ROUTES.AIAGENT.GET_ALL, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
            credentials: "include"

        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        return data;
    }
    catch (error) {
        console.log("SERVER ERROR: ", error);
        return null;
    }
};

export const getAIAgentById = async (id: string) => {
    try {
        const response = await fetch(API_ROUTES.AIAGENT.GET_BY_ID(id), {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
            credentials: "include"

        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        return data;
    }
    catch (error) {
        console.log("SERVER ERROR: ", error);
        return null;
    }
};

export const getFilteredAIAgent = async (params: string) => {
    try {
        const response = await fetch(API_ROUTES.AIAGENT.GET_BY_PARAMS(params), {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
            credentials: "include"

        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        return data;
    }
    catch (error) {
        console.log("SERVER ERROR: ", error);
        return null;
    }
};

export const addAIAgent = async (data: aiagentAllDataInterface) => {
    try {
        let response = await fetch(API_ROUTES.AIAGENT.ADD, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
            credentials: "include"
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        response = await response.json();
        return data;
    }
    catch (error) {
        console.log("SERVER ERROR: ", error);
        return null;
    }
};

export const updateAIAgent = async (id: string, data: any) => {
    try {
        let response = await fetch(API_ROUTES.AIAGENT.UPDATE(id), {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
            credentials: "include"

        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        response = await response.json();
        return data;
    }
    catch (error) {
        console.log("SERVER ERROR: ", error);
        return null;
    }
};

export const deleteAIAgent = async (id: string) => {
    try {
        const response = await fetch(API_ROUTES.AIAGENT.DELETE(id), {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            credentials: "include"
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        return data;
    }
    catch (error) {
        console.log("SERVER ERROR: ", error);
        return null;
    }
};

export const assignAIAgent = async (data: aiagentAssignInterface) => {
    try {

        console.log("assign customer data ", data)
        const response = await fetch(API_ROUTES.AIAGENT.ASSIGNAIAGENT, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
            credentials: "include"
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        console.log(" assign customer api , response ", result)
        return result;
    } catch (error) {
        console.error("SERVER ERROR: ", error);
        return null;
    }
};


export const runWebhookAgent = async (data: any) => {
    try {
        let response = await fetch(API_ROUTES.AIAGENT.RUNWEBHOOKAGENT, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
            credentials: "include"
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        response = await response.json();
        console.log(" response is ", response)
        return response;
    }
    catch (error) {
        console.log("SERVER ERROR: ", error);
        return null;
    }
};

export const compareProductPrice = async (data: any) => {
    try {
        let response = await fetch(API_ROUTES.AIAGENT.COMPARE_PRODUCT_PRICE, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
            credentials: "include"
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        response = await response.json();
        console.log(" response is ", response)
        return response;
    }
    catch (error) {
        console.log("SERVER ERROR: ", error);
        return null;
    }
};



//video project api routes



export const addVideoProjectPhoto = async (formData: FormData) => {
    try {
        let response = await fetch(API_ROUTES.VIDEOPROJECT.ADDPHOTOS, {
            method: "POST",
            body: formData,
            credentials: "include"
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        response = await response.json();
        console.log(" response is ", response)
        return response;
    }
    catch (error) {
        console.log("SERVER ERROR: ", error);
        return null;
    }
};

export const generateVideoProjectScript = async (data: any) => {
    try {
        let response = await fetch(API_ROUTES.VIDEOPROJECT.GENERATESCRIPT, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
            credentials: "include"
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        response = await response.json();
        console.log(" response is ", response)
        return response;
    }
    catch (error) {
        console.log("SERVER ERROR: ", error);
        return null;
    }
};

// CHANGED: the /render endpoint always expects multipart/form-data (it may
// carry an uploaded voiceover audio file alongside the JSON-ish fields), so
// this now takes a FormData directly instead of building a JSON body.
// Build it like:
//   const fd = new FormData()
//   fd.append("mode", mode)
//   fd.append("voiceoverMethod", voiceoverMethod)
//   fd.append("photoFileNames", JSON.stringify([...]))
//   fd.append("scriptContent", JSON.stringify([...]))
//   if (voiceoverMethod === "uploaded_voice") fd.append("uploadedVoiceover", file)
export const renderVideoProject = async (formData: FormData) => {
    try {
        let response = await fetch(API_ROUTES.VIDEOPROJECT.RENDER, {
            method: "POST",
            body: formData,
            credentials: "include"
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        response = await response.json();
        console.log(" response is ", response)
        return response;
    }
    catch (error) {
        console.log("SERVER ERROR: ", error);
        return null;
    }
};



// 24/7 work of ai agent

export interface DailyAIReport {
  id: string;
  type: string;
  reportDate: string;
  content: string;
  createdAt: string;
}

export const fetchAIReports = async (): Promise<DailyAIReport[]> => {
  try {
    // Replace with your actual route mapping
    const response = await fetch(API_ROUTES.AIAGENT.GET_AI_REPORT, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });
    const result = await response.json();
    if (result.success) return result.data;
    return [];
  } catch (error) {
    console.error("Failed to fetch reports:", error);
    return [];
  }
};



// ==========================================
// 2. API FUNCTIONS (e.g., store/aiagent/aiagent.ts)
// ==========================================

export interface ChatSession {
  id: string;
  title: string;
  isPinned: boolean;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "model" | "function";
  content: string;
  createdAt: string;
}

// ------------------------------------------
// ADMIN CHAT FUNCTIONS
// ------------------------------------------

export const sendAdminAgentMessage = async (message: string, sessionId?: string | null) => {
  try {
    const response = await fetch(API_ROUTES.AIAGENT.ADMIN_SEND_MESSAGE, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ message, sessionId }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message);
    return result; // Expected: { success: true, data: { text: "...", sessionId: "..." } }
  } catch (error) {
    console.error("Failed to send admin message:", error);
    throw error;
  }
};

export const fetchAdminAgentSessions = async (): Promise<ChatSession[]> => {
  try {
    const response = await fetch(API_ROUTES.AIAGENT.ADMIN_GET_SESSIONS, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });
    const result = await response.json();
    if (result.success) return result.data;
    return [];
  } catch (error) {
    console.error("Failed to fetch admin sessions:", error);
    return [];
  }
};

export const fetchAdminSessionMessages = async (sessionId: string): Promise<ChatMessage[]> => {
  try {
    const response = await fetch(API_ROUTES.AIAGENT.ADMIN_GET_MESSAGES(sessionId), {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });
    const result = await response.json();
    if (result.success) return result.data;
    return [];
  } catch (error) {
    console.error("Failed to fetch admin session messages:", error);
    return [];
  }
};

export const toggleAdminSessionPin = async (sessionId: string) => {
  try {
    const response = await fetch(API_ROUTES.AIAGENT.ADMIN_TOGGLE_PIN(sessionId), {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message);
    return result;
  } catch (error) {
    console.error("Failed to toggle admin session pin:", error);
    throw error;
  }
};

export const deleteAdminAgentSession = async (sessionId: string) => {
  try {
    const response = await fetch(API_ROUTES.AIAGENT.ADMIN_DELETE_SESSION(sessionId), {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message);
    return result;
  } catch (error) {
    console.error("Failed to delete admin session:", error);
    throw error;
  }
};

// ------------------------------------------
// EMPLOYEE CHAT FUNCTIONS
// ------------------------------------------

export const sendEmployeeAgentMessage = async (message: string, sessionId?: string | null) => {
  try {
    const response = await fetch(API_ROUTES.AIAGENT.EMPLOYEE_SEND_MESSAGE, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ message, sessionId }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message);
    return result;
  } catch (error) {
    console.error("Failed to send employee message:", error);
    throw error;
  }
};

export const fetchEmployeeAgentSessions = async (): Promise<ChatSession[]> => {
  try {
    const response = await fetch(API_ROUTES.AIAGENT.EMPLOYEE_GET_SESSIONS, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });
    const result = await response.json();
    if (result.success) return result.data;
    return [];
  } catch (error) {
    console.error("Failed to fetch employee sessions:", error);
    return [];
  }
};

export const fetchEmployeeSessionMessages = async (sessionId: string): Promise<ChatMessage[]> => {
  try {
    const response = await fetch(API_ROUTES.AIAGENT.EMPLOYEE_GET_MESSAGES(sessionId), {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });
    const result = await response.json();
    if (result.success) return result.data;
    return [];
  } catch (error) {
    console.error("Failed to fetch employee session messages:", error);
    return [];
  }
};

export const toggleEmployeeSessionPin = async (sessionId: string) => {
  try {
    const response = await fetch(API_ROUTES.AIAGENT.EMPLOYEE_TOGGLE_PIN(sessionId), {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message);
    return result;
  } catch (error) {
    console.error("Failed to toggle employee session pin:", error);
    throw error;
  }
};

export const deleteEmployeeAgentSession = async (sessionId: string) => {
  try {
    const response = await fetch(API_ROUTES.AIAGENT.EMPLOYEE_DELETE_SESSION(sessionId), {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message);
    return result;
  } catch (error) {
    console.error("Failed to delete employee session:", error);
    throw error;
  }
};

// ------------------------------------------
// CUSTOMER CHAT FUNCTIONS
// ------------------------------------------

export const sendCustomerAgentMessage = async (message: string, sessionId?: string | null) => {
  try {
    const response = await fetch(API_ROUTES.AIAGENT.CUSTOMER_SEND_MESSAGE, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ message, sessionId }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message);
    return result; // Expected: { success: true, data: { text: "...", sessionId: "..." } }
  } catch (error) {
    console.error("Failed to send admin message:", error);
    throw error;
  }
};

export const fetchCustomerAgentSessions = async (): Promise<ChatSession[]> => {
  try {
    const response = await fetch(API_ROUTES.AIAGENT.CUSTOMER_GET_SESSIONS, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });
    const result = await response.json();
    if (result.success) return result.data;
    return [];
  } catch (error) {
    console.error("Failed to fetch admin sessions:", error);
    return [];
  }
};

export const fetchCustomerSessionMessages = async (sessionId: string): Promise<ChatMessage[]> => {
  try {
    const response = await fetch(API_ROUTES.AIAGENT.CUSTOMER_GET_MESSAGES(sessionId), {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });
    const result = await response.json();
    if (result.success) return result.data;
    return [];
  } catch (error) {
    console.error("Failed to fetch admin session messages:", error);
    return [];
  }
};

export const toggleCustomerSessionPin = async (sessionId: string) => {
  try {
    const response = await fetch(API_ROUTES.AIAGENT.CUSTOMER_TOGGLE_PIN(sessionId), {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message);
    return result;
  } catch (error) {
    console.error("Failed to toggle admin session pin:", error);
    throw error;
  }
};

export const deleteCustomerAgentSession = async (sessionId: string) => {
  try {
    const response = await fetch(API_ROUTES.AIAGENT.CUSTOMER_DELETE_SESSION(sessionId), {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message);
    return result;
  } catch (error) {
    console.error("Failed to delete admin session:", error);
    throw error;
  }
};
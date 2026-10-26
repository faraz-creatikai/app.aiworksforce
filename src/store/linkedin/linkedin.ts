import { API_ROUTES } from "@/constants/ApiRoute"; 
import { toast } from "react-toastify";
import {
  LinkedinAuthCallbackPayload,
  LinkedinPublishPayload,
  LinkedinResponseInterface,
  LinkedinStatusData,
  ScheduledPostType
} from "./linkedin.interface";

// ==========================================
// LINKEDIN API CALLS
// ==========================================

export const getLinkedinAuthUrl = async (): Promise<LinkedinResponseInterface<{ url: string }> | null> => {
  try {
    const response = await fetch(API_ROUTES.LINKEDIN.GET_AUTH_URL, {
      method: "GET",
      credentials: "include",
    });
    
    const result = await response.json();
    if (!result.success) {
      toast.error(result.message ?? "Failed to generate auth URL");
      throw new Error(result.message);
    }
    return result;
  } catch (error) {
    console.error("SERVER ERROR: ", error);
    return null;
  }
};

export const handleLinkedinCallback = async (data: LinkedinAuthCallbackPayload): Promise<LinkedinResponseInterface | null> => {
  try {
    const response = await fetch(API_ROUTES.LINKEDIN.CALLBACK, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
      credentials: "include",
    });

    const result = await response.json();
    if (!result.success) {
      toast.error(result.message ?? "Failed to connect LinkedIn account");
      throw new Error(result.message);
    }
    toast.success(result.message ?? "LinkedIn connected successfully!");
    return result;
  } catch (error) {
    console.error("SERVER ERROR: ", error);
    return null;
  }
};

export const getLinkedinStatus = async (): Promise<LinkedinResponseInterface<LinkedinStatusData> | null> => {
  try {
    const response = await fetch(API_ROUTES.LINKEDIN.STATUS, {
      method: "GET",
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

export const disconnectLinkedin = async (): Promise<LinkedinResponseInterface | null> => {
  try {
    const response = await fetch(API_ROUTES.LINKEDIN.DISCONNECT, {
      method: "DELETE",
      credentials: "include",
    });

    const result = await response.json();
    if (!result.success) {
      toast.error(result.message ?? "Failed to disconnect account");
      throw new Error(result.message);
    }
    toast.success(result.message ?? "Account disconnected successfully");
    return result;
  } catch (error) {
    console.error("SERVER ERROR: ", error);
    return null;
  }
};

// Replace your existing publishLinkedinPost in your API file
export const publishLinkedinPost = async (formData: FormData): Promise<any | null> => {
  try {
    const response = await fetch(API_ROUTES.LINKEDIN.PUBLISH, {
      method: "POST",
      body: formData, // 👈 Send raw FormData directly (no JSON.stringify, no Content-Type header)
      credentials: "include",
    });

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.message);
    }
    return result;
  } catch (error) {
    console.error("SERVER ERROR: ", error);
    return null;
  }
};

// ----------------------------------------------------
// GET PAGINATED LINKEDIN POSTS
// ----------------------------------------------------
export const getLinkedinPosts = async (params: string): Promise<LinkedinResponseInterface<ScheduledPostType[]> | null> => {
  try {
    // Example params: "page=1&limit=10"
    const response = await fetch(API_ROUTES.LINKEDIN.GET_POSTS(params), {
      method: "GET",
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
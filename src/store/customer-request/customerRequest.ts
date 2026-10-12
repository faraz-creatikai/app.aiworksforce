// customerRequest.ts

import { API_ROUTES } from "@/constants/ApiRoute";
import {
    CreateCustomerRequestPayload,
    GetCustomerRequestsParams,
    GetCustomerRequestsResponse,
    ActionCustomerRequestResponse,
    CustomerRequestModel
} from "./customerRequest.interface";

/**
 * 🌐 PUBLIC: Submit a new customer request (No Auth Required)
 */
export const createCustomerRequest = async (
    payload: CreateCustomerRequestPayload
): Promise<ActionCustomerRequestResponse | null> => {
    try {
        const response = await fetch(API_ROUTES.CUSTOMER_REQUEST.CREATE_PUBLIC, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error("CREATE CUSTOMER REQUEST ERROR: ", error);
        return null;
    }
};

/**
 * 🏢 ADMIN: Get paginated/filtered customer requests
 */
export const getCustomerRequests = async (
    params: GetCustomerRequestsParams
): Promise<GetCustomerRequestsResponse | null> => {
    try {
        // Build query string dynamically based on provided params
        const queryParams = new URLSearchParams();
        if (params.status) queryParams.append("status", params.status);
        if (params.page) queryParams.append("page", params.page.toString());
        if (params.limit) queryParams.append("limit", params.limit.toString());

        const url = `${API_ROUTES.CUSTOMER_REQUEST.GET_ALL}?${queryParams.toString()}`;

        const response = await fetch(url, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
        });

        if (!response.ok) throw new Error("Failed to fetch customer requests");
        
        return await response.json();
    } catch (error) {
        console.error("GET CUSTOMER REQUESTS ERROR:", error);
        return null;
    }
};


/**
 * 🏢 ADMIN: Approve a customer request
 */
export const approveCustomerRequest = async (
    id: string,
    password?: string // 🚀 Add password parameter
): Promise<ActionCustomerRequestResponse | null> => {
    try {
        const response = await fetch(API_ROUTES.CUSTOMER_REQUEST.APPROVE(id), {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ password }), // 🚀 Send password in body
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || "Failed to approve request");
        }
        
        return await response.json();
    } catch (error) {
        console.error("APPROVE REQUEST ERROR:", error);
        return null;
    }
};

/**
 * 🏢 ADMIN: Deny a customer request
 */
export const denyCustomerRequest = async (
    id: string
): Promise<ActionCustomerRequestResponse | null> => {
    try {
        const response = await fetch(API_ROUTES.CUSTOMER_REQUEST.DENY(id), {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || "Failed to deny request");
        }
        
        return await response.json();
    } catch (error) {
        console.error("DENY REQUEST ERROR:", error);
        return null;
    }
};


/**
 * 🏢 ADMIN: Bulk Delete customer requests
 */
export const deleteCustomerRequests = async (
    ids: string[]
): Promise<ActionCustomerRequestResponse | null> => {
    try {
        const response = await fetch(API_ROUTES.CUSTOMER_REQUEST.DELETE_BULK, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ ids }), // 🚀 Send array of IDs
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || "Failed to delete requests");
        }
        
        return await response.json();
    } catch (error) {
        console.error("DELETE REQUESTS ERROR:", error);
        return null;
    }
};
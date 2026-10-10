import { API_ROUTES } from "@/constants/ApiRoute";
import {
    CallingAgentConfigPayload,
    CallingAgentConfigResponse,
    SarvamCallReportParams,
    SarvamCallReportResponse,
    TriggerSarvamCallPayload,
    TriggerSarvamCallResponse
} from "./sarvam.interface";

/**
 * Triggers a Sarvam voice call via the backend
 */
export const triggerSarvamCall = async (
    payload: TriggerSarvamCallPayload
): Promise<TriggerSarvamCallResponse | null> => {
    try {
        const response = await fetch(API_ROUTES.SARVAM.TRIGGER_CALL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
            credentials: "include" // Keeps auth tokens/cookies intact for your protectRoute middleware
        });

        if (!response.ok) {
            // Parse error message if backend sends one
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }

        const data: TriggerSarvamCallResponse = await response.json();
        return data;
    }
    catch (error) {
        console.error("SARVAM TRIGGER CALL ERROR: ", error);
        return null; // Return null so the UI can handle the failure gracefully
    }
};


/**
 * Syncs latest Sarvam call logs from Sarvam Analytics
 * into the backend database.
 */
/**
 * Fetches Sarvam call logs.
 * Pass customerId and/or phone to get only that customer's logs.
 * With no params it returns everything, same as before.
 */
export const syncSarvamCallLogs = async (
    params?: { customerId?: string; phone?: string }
): Promise<any | null> => {
    try {
        const qs = new URLSearchParams();
        if (params?.customerId) qs.set("customerId", params.customerId);
        if (params?.phone) qs.set("phone", params.phone);

        const query = qs.toString();
        const url = query
            ? `${API_ROUTES.SARVAM.SYNC_CALL_LOGS}?${query}`
            : API_ROUTES.SARVAM.SYNC_CALL_LOGS;

        const response = await fetch(url, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
            credentials: "include",
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));

            throw new Error(
                errorData.message ||
                `HTTP error! status: ${response.status}`
            );
        }

        const data = await response.json();

        return data;
    } catch (error) {
        console.error(
            "SARVAM SYNC CALL LOGS ERROR:",
            error
        );

        return null;
    }
};

export const fetchSarvamAudio = async (recordingUrl: string): Promise<Blob> => {
    const res = await fetch(
        API_ROUTES.SARVAM.AUDIO + `?recordingUrl=${encodeURIComponent(recordingUrl)}`,
        {
            credentials: "include",
            // If your API uses a Bearer token, add it the same way syncSarvamCallLogs does:
            // headers: { Authorization: `Bearer ${token}` },
        }
    );

    if (!res.ok) {
        let msg = `Audio request failed (${res.status})`;
        try {
            const j = await res.json();
            msg = j.details ? `${j.message}: ${j.details}` : j.message || msg;
        } catch { }
        throw new Error(msg);
    }

    return res.blob();
};






// config related functions

/**
 * Get all calling configurations
 */
export const getCallingConfigs = async (): Promise<CallingAgentConfigResponse[]> => {
    try {
        const response = await fetch(API_ROUTES.SARVAM.CONFIG, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
        });
        if (!response.ok) throw new Error("Failed to fetch configs");
        const data = await response.json();
        return data.configs || [];
    } catch (error) {
        console.error("GET CONFIGS ERROR:", error);
        return [];
    }
};

/**
 * Create a new calling configuration
 */
export const createCallingConfig = async (payload: CallingAgentConfigPayload): Promise<CallingAgentConfigResponse | null> => {
    try {
        const response = await fetch(API_ROUTES.SARVAM.CONFIG, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
            credentials: "include",
        });
        if (!response.ok) throw new Error("Failed to create config");
        const data = await response.json();
        return data.config;
    } catch (error) {
        console.error("CREATE CONFIG ERROR:", error);
        return null;
    }
};

/**
 * Edit an existing calling configuration
 */
export const updateCallingConfig = async (id: string, payload: Partial<CallingAgentConfigPayload>): Promise<CallingAgentConfigResponse | null> => {
    try {
        const response = await fetch(`${API_ROUTES.SARVAM.CONFIG}/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
            credentials: "include",
        });
        if (!response.ok) throw new Error("Failed to update config");
        const data = await response.json();
        return data.config;
    } catch (error) {
        console.error("UPDATE CONFIG ERROR:", error);
        return null;
    }
};

/**
 * Delete a calling configuration
 */
export const deleteCallingConfig = async (id: string): Promise<boolean> => {
    try {
        const response = await fetch(`${API_ROUTES.SARVAM.CONFIG}/${id}`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
        });
        return response.ok;
    } catch (error) {
        console.error("DELETE CONFIG ERROR:", error);
        return false;
    }
};

/**
 * Set a specific configuration as the active one
 */
export const setActiveCallingConfig = async (id: string): Promise<CallingAgentConfigResponse | null> => {
    try {
        const response = await fetch(API_ROUTES.SARVAM.CONFIG_SET_ACTIVE(id), {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
        });
        if (!response.ok) throw new Error("Failed to set active config");
        const data = await response.json();
        return data.config;
    } catch (error) {
        console.error("SET ACTIVE CONFIG ERROR:", error);
        return null;
    }
};




// sarvam call report api : 

export const getSarvamCallReport = async (
    params?: SarvamCallReportParams
): Promise<SarvamCallReportResponse | null> => {
    try {
        const qs = new URLSearchParams();
        Object.entries(params ?? {}).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== "") qs.set(key, String(value));
        });
 
        const query = qs.toString();
        const url = query
            ? `${API_ROUTES.SARVAM.CALL_REPORT}?${query}`
            : API_ROUTES.SARVAM.CALL_REPORT;
 
        const response = await fetch(url, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
            credentials: "include",
        });
 
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }
 
        const data: SarvamCallReportResponse = await response.json();
        return data;
    } catch (error) {
        console.error("SARVAM CALL REPORT ERROR:", error);
        return null;
    }
};
 
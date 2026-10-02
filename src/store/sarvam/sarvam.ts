import { API_ROUTES } from "@/constants/ApiRoute";
import {
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
export const syncSarvamCallLogs = async (): Promise<any | null> => {
    try {
        const response = await fetch(
            API_ROUTES.SARVAM.SYNC_CALL_LOGS,
            {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
            }
        );

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


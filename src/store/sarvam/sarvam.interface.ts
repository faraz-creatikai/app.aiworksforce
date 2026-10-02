// Define what you send to the backend to trigger the call
export interface TriggerSarvamCallPayload {
    userPrompt: string;
    customerId: string;
    promptMode?: string; // Optional: "text" or "voice", defaults to "text"
}

// Define the structure of the AI Instructions returned
export interface SarvamAiInstructions {
    callingPrompt: string;
    aiAnswer: string;
}

// Define the response shape from your backend controller
export interface TriggerSarvamCallResponse {
    success: boolean;
    message: string;
    aiInstructions: SarvamAiInstructions;
    sarvamData: {
        interaction_id?: string;
        outbound_id?: string;
        status?: string;
        [key: string]: any; // Catch-all for extra Sarvam response fields
    };
}
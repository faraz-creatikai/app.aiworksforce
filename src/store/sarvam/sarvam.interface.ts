// Define what you send to the backend to trigger the call
export interface TriggerSarvamCallPayload {
    userPrompt: string;
    customerId: string;
    promptMode?: string; // Optional: "text" or "voice", defaults to "text"
    voice?: string; 
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



// --- Interfaces for Config ---
export interface CallingAgentConfigPayload {
    name :string;
    description: string;
    transferNumber?: string;
    apiKey: string;
    orgId: string;
    workspaceId: string;
    appId: string;
    appVersion?: number;
    connectionId: string;
    callerNumber: string;
    isActive?: boolean;
}

export interface CallingAgentConfigResponse {
    id: string;
    name: string;
    description: string;
    transferNumber?: string;
    apiKey: string;
    orgId: string;
    workspaceId: string;
    appId: string;
    appVersion: number;
    connectionId: string;
    callerNumber: string;
    isActive: boolean;
    adminId: string;
    createdAt: string;
}











// sarvam report interface
// ---------------------------------------------------------------------------
// APPEND THESE TO  store/sarvam/sarvam.interface.ts
// ---------------------------------------------------------------------------

export type SarvamReportStatus = "all" | "answered" | "not_answered";

export interface SarvamCallReportParams {
    page?: number;
    limit?: number;
    /** YYYY-MM-DD, India date */
    startDate?: string;
    /** YYYY-MM-DD, India date */
    endDate?: string;
    status?: SarvamReportStatus;
    sortOrder?: "asc" | "desc";
    /** Overrides SARVAM_CREDITS_PER_MINUTE on the server */
    creditsPerMinute?: number;
    /** true = skip the 60 second totals cache */
    refresh?: boolean;
}

export interface SarvamReportCall {
    attemptId: string | null;
    interactionId: string | null;
    customer: { id: string; name: string | null; phone: string | null; campaign: string | null } | null;
    phone: string | null;
    transcript?: any[]; 
    status: string;
    answered: boolean;
    failureReason: string | null;
    endedBy: string | null;
    durationSeconds: number;
    billableMinutes: number;
    credits: number | null;
    startedAt: string | null;
    endedAt: string | null;
    language: string | null;
    numMessages: number;
    avgAgentLatencySeconds: number | null;
    avgUserLatencySeconds: number | null;
    retryAttempt: number;
    channelDirection: string | null;
    channelProvider: string | null;
    channelType: string | null;
    campaignId: string | null;
    isDebugCall: boolean;
    hasRecording: boolean;
    recordingUrl: string | null;
    summary: string | null;
}

export interface SarvamReportSummary {
    totalCalls: number;
    answered: number;
    notAnswered: number;
    pickupRate: number;
    totalTalkSeconds: number;
    avgCallSeconds: number;
    longestCallSeconds: number;
    billableMinutes: number;
    creditsPerMinute: number | null;
    creditsUsed: number | null;
    avgCreditsPerAnsweredCall: number | null;
    avgMessagesPerAnsweredCall: number;
    shortCalls: number;
    shortCallRate: number;
    retriedAttempts: number;
    debugCalls: number;
    avgAgentLatencySeconds: number | null;
    avgUserLatencySeconds: number | null;
}

export interface SarvamReportDay {
    date: string;
    attempts: number;
    answered: number;
    notAnswered: number;
    talkSeconds: number;
    billableMinutes: number;
    credits: number | null;
}

export interface SarvamReportHour {
    hour: number;
    label: string;
    attempts: number;
    answered: number;
    pickupRate: number;
}

export interface SarvamReportCount {
    name: string;
    count: number;
}

export interface SarvamReportTopCustomer {
    customerId: string;
    name: string | null;
    phone: string | null;
    calls: number;
    answered: number;
    talkSeconds: number;
    billableMinutes: number;
    credits: number | null;
}

export interface SarvamCallReportResponse {
    success: boolean;
    totalCreditsLeft?: number | null;
    filters: { startDate: string; endDate: string; timezone: string; status: SarvamReportStatus; sortOrder: "asc" | "desc" };
    pagination: { page: number; limit: number; total: number; totalPages: number; hasNext: boolean; hasPrev: boolean };
    summary: SarvamReportSummary;
    daily: SarvamReportDay[];
    hourly: SarvamReportHour[];
    breakdowns: {
        status: SarvamReportCount[];
        failureReasons: SarvamReportCount[];
        endedBy: SarvamReportCount[];
        languages: SarvamReportCount[];
    };
    topCustomers: SarvamReportTopCustomer[];
    calls: SarvamReportCall[];
    meta: {
        summaryFromCache: boolean;
        summarySarvamRequests: number;
        summaryTruncated: boolean;
        creditsNote: string;
        generatedAt: string;
    };
}
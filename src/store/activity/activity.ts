// src/store/activity/activity.ts
// Same file you already wrote — only change: each fn now accepts an optional
// query string (`params`) so the dashboard can filter / paginate.

import { API_ROUTES } from "@/constants/ApiRoute";

const GET = async (url: string) => {
    try {
        const response = await fetch(url, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
        });
        const data = await response.json();
        return data;
    } catch (error) {
        console.log("SERVER ERROR: ", error);
        return null;
    }
};

const withParams = (url: string, params?: string) =>
    params ? `${url}?${params}` : url;

export const getActivityFeed = async (params?: string) =>
    GET(withParams(API_ROUTES.ACTIVITY.GETFEED, params));

export const getActivitySummary = async (params?: string) =>
    GET(withParams(API_ROUTES.ACTIVITY.GETSUMMARY, params));

export const getActivityUsers = async () =>
    GET(API_ROUTES.ACTIVITY.GETUSERS);

export const getActivityTimeline = async (adminId: string, params?: string) =>
    GET(withParams(API_ROUTES.ACTIVITY.GETTIMELINE(adminId), params));

export const getTouchedCustomers = async (params?: string) =>
    GET(withParams(API_ROUTES.ACTIVITY.GETCUSTOMERS, params));

export const getTouchedFollowups = async (params?: string) =>
    GET(withParams(API_ROUTES.ACTIVITY.GETFOLLOWUPS, params));

export const getRecordDetail = async (entity: "customer" | "followup", id: string) =>
    GET(API_ROUTES.ACTIVITY.GETRECORD(entity, id));

/*  add to constants/ApiRoute.ts :

    ACTIVITY: {
        ...
        GETCUSTOMERS: `${API_URL}/api/activity/customers`,
        GETFOLLOWUPS: `${API_URL}/api/activity/followups`,
        GETRECORD: (entity: string, id: string) => `${API_URL}/api/activity/record/${entity}/${id}`,
    }
*/
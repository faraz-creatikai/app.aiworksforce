// src/store/activity/activity.interface.ts

export type ActivityAction =
  | "create" | "update" | "delete" | "assign" | "unassign" | "login" | "logout" | "import";

export type ActivityEntity =
  | "customer" | "followup" | "property" | "contact" | "admin";

export interface ActivityUser {
  id: string;
  name: string;
  email?: string;
  role: string;
  city?: string | null;
  clientId?: string | null;
  isOnline?: boolean;
}

export interface ActivityItem {
  id: string;
  action: ActivityAction;
  entity: ActivityEntity;
  entityId: string | null;
  entityName: string | null;
  customerId: string | null;
  followupId: string | null;
  sessionId: string | null;
  meta?: Record<string, any> | null;
  createdAt: string;
  by: ActivityUser;
  admin: ActivityUser | null;
  target?: ActivityUser | null;
}

export interface ActivityFeedResponse {
  success: boolean;
  data: ActivityItem[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export interface ActivitySummaryRow {
  user: ActivityUser;
  isOnline: boolean;
  totalActivities: number;
  onlineSeconds: number;
  sessionCount: number;
  counts: Partial<Record<ActivityEntity, Partial<Record<ActivityAction, number>>>>;
}

export interface ActivitySummaryResponse {
  success: boolean;
  range: { from: string; to: string };
  totals: { users: number; activities: number; onlineSeconds: number };
  data: ActivitySummaryRow[];
}

export interface TimelineSession {
  sessionId: string;
  loginAt: string;
  logoutAt: string | null;
  isOnline: boolean;
  durationSec: number;
  ip: string | null;
  totalActivities: number;
  counts: Record<string, number>;
  activities: ActivityItem[];
}

export interface ActivityTimelineResponse {
  success: boolean;
  user: ActivityUser;
  isOnline: boolean;
  range: { from: string; to: string };
  timeline: TimelineSession[];
  unlinkedActivities: ActivityItem[];
}

/** socket payload for  activity:presence  */
export interface PresencePayload {
  adminId: string;
  name: string;
  role: string;
  isOnline: boolean;
  sessionId: string;
  at: string;
}

// ─── Touched records (customer / followup lists) ─────────────────────────────

export interface TouchedCustomer {
  customerId: string;
  isDeleted: boolean;
  customerName: string;
  contact: string | null;
  city: string | null;
  campaign: string | null;
  leadType: string | null;
  price: string | null;
  leadTemperature: string | null;
  dealClosed: boolean;
  totalActivities: number;
  lastActivityAt: string;
  lastAction: ActivityAction | null;
  lastBy: ActivityUser | null;
  counts: Partial<Record<ActivityAction, number>>;
}

export interface TouchedFollowup {
  followupId: string;
  isDeleted: boolean;
  customerId: string | null;
  customerName: string;
  contact: string | null;
  city: string | null;
  StatusType: string | null;
  StartDate: string | null;
  FollowupNextDate: string | null;
  Description: string | null;
  totalActivities: number;
  lastActivityAt: string;
  lastAction: ActivityAction | null;
  lastBy: ActivityUser | null;
}

export interface RecordDetailResponse {
  success: boolean;
  entity: "customer" | "followup";
  isDeleted: boolean;
  record: any | null;
  snapshot: Record<string, any> | null;
  history: ActivityItem[];
}
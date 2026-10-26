export interface LinkedinAuthCallbackPayload {
  code: string;
  state: string;
}

export interface LinkedinPublishPayload {
  text?: string;
  imageUrl?: string;
}

export interface LinkedinStatusData {
  isConnected: boolean;
  name?: string;
  profilePicture?: string;
  isExpired?: boolean;
  lastUpdated?: string;
  email?: string;
  locale?: string;
  profileUrl?: string;
  personUrn?: string;
  accessTokenExpiresAt?: string;
}

export interface ScheduledPostType {
  id: string;
  content: string;
  status: string;
  platform: string;
  createdAt: string;
  updatedAt: string;
}

// Generic Response interface
export interface LinkedinResponseInterface<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  pagination?: {
    totalRecords: number;
    totalPages: number;
    currentPage: number;
    pageSize: number;
  };
}
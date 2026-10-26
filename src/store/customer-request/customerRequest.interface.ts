// customerRequest.interface.ts

export interface CustomerRequestModel {
    id: string;
    name: string;
    email: string;
    useCase?: string;
    companyName?: string;
    bio?: string;
    status: "pending" | "approved" | "denied";
    processedById?: string;
    processedBy?: { name: string; email: string };
    phone?: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreateCustomerRequestPayload {
    name: string;
    email: string;
    useCase?: string;
    companyName?: string;
    bio?: string;
}

export interface GetCustomerRequestsParams {
    status?: "pending" | "approved" | "denied" | "";
    page?: number;
    limit?: number;
}

export interface GetCustomerRequestsResponse {
    success: boolean;
    data: CustomerRequestModel[];
    pagination: {
        totalRecords: number;
        totalPages: number;
        currentPage: number;
        pageSize: number;
    };
    message?: string;
}

export interface ActionCustomerRequestResponse {
    success: boolean;
    message: string;
    data?: any; 
}
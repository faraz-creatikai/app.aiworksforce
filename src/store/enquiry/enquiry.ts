import { API_ROUTES } from "@/constants/ApiRoute";

// =======================================================
// CUSTOMER PANEL API CALLS
// =======================================================

export const createCustomerEnquiry = async (payload: { subject: string; message: string; priority?: string }) => {
  try {
    const response = await fetch(API_ROUTES.ENQUIRY.CREATE_CUSTOMER, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    });
    return await response.json();
  } catch (error) {
    console.error("SERVER ERROR: ", error);
    return null;
  }
};

export const getCustomerEnquiries = async () => {
  try {
    const response = await fetch(API_ROUTES.ENQUIRY.GET_ALL_CUSTOMER, { credentials: "include" });
    return await response.json();
  } catch (error) {
    console.error("SERVER ERROR: ", error);
    return null;
  }
};

export const getCustomerEnquiryById = async (id: string) => {
  try {
    const response = await fetch(API_ROUTES.ENQUIRY.GET_CUSTOMER_BY_ID(id), { credentials: "include" });
    return await response.json();
  } catch (error) {
    console.error("SERVER ERROR: ", error);
    return null;
  }
};

export const replyToEnquiryAsCustomer = async (id: string, payload: { message: string }) => {
  try {
    const response = await fetch(API_ROUTES.ENQUIRY.REPLY_CUSTOMER(id), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    });
    return await response.json();
  } catch (error) {
    console.error("SERVER ERROR: ", error);
    return null;
  }
};

// =======================================================
// ADMIN CRM API CALLS
// =======================================================

export const getAllAdminEnquiries = async (params: string = "") => {
  try {
    const url = params ? API_ROUTES.ENQUIRY.GET_ALL_ADMIN_PARAMS(params) : API_ROUTES.ENQUIRY.GET_ALL_ADMIN;
    const response = await fetch(url, { credentials: "include" });
    return await response.json();
  } catch (error) {
    console.error("SERVER ERROR: ", error);
    return null;
  }
};

export const getAdminEnquiryById = async (id: string) => {
  try {
    const response = await fetch(API_ROUTES.ENQUIRY.GET_ADMIN_BY_ID(id), { credentials: "include" });
    return await response.json();
  } catch (error) {
    console.error("SERVER ERROR: ", error);
    return null;
  }
};

export const replyToEnquiryAsAdmin = async (id: string, payload: { message: string; status?: string }) => {
  try {
    const response = await fetch(API_ROUTES.ENQUIRY.REPLY_ADMIN(id), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    });
    return await response.json();
  } catch (error) {
    console.error("SERVER ERROR: ", error);
    return null;
  }
};

export const updateEnquiryStatus = async (id: string, payload: { status: string }) => {
  try {
    const response = await fetch(API_ROUTES.ENQUIRY.UPDATE_STATUS(id), {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    });
    return await response.json();
  } catch (error) {
    console.error("SERVER ERROR: ", error);
    return null;
  }
};
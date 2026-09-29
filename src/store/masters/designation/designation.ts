import { API_ROUTES } from "@/constants/ApiRoute"
import { designationDeleteAllPayloadInterface, designationAllDataInterface } from "./designation.interface";

export const getDesignation = async () => {
    try {
        const response = await fetch(API_ROUTES.MASTERS.DESIGNATION.GET_ALL, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            credentials: "include"
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        return data;
    } catch (error) {
        console.log("SERVER ERROR: ", error);
        return null;
    }
}

export const getDesignationById = async (id: string) => {
    try {
        const response = await fetch(API_ROUTES.MASTERS.DESIGNATION.GET_BY_ID(id), {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            credentials: "include"
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        return data;
    } catch (error) {
        console.log("SERVER ERROR: ", error);
        return null;
    }
}

export const getDesignationByDepartment = async (id: string) => {
    try {
        const response = await fetch(API_ROUTES.MASTERS.DESIGNATION.GET_ALL_BY_DEPARTMENT(id), {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            credentials: "include"
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        return data;
    } catch (error) {
        console.log("SERVER ERROR: ", error);
        return null;
    }
}

export const getFilteredDesignation = async (params: string) => {
    try {
        const response = await fetch(API_ROUTES.MASTERS.DESIGNATION.GET_BY_PARAMS(params), {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            credentials: "include"
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        return data;
    } catch (error) {
        console.log("SERVER ERROR: ", error);
        return null;
    }
}

export const addDesignation = async (data: designationAllDataInterface) => {
    try {
        let response = await fetch(API_ROUTES.MASTERS.DESIGNATION.ADD, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
            credentials: "include"
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        response = await response.json();
        return data;
    } catch (error) {
        console.log("SERVER ERROR: ", error);
        return null;
    }
}

export const updateDesignation = async (id: string, data: designationAllDataInterface) => {
    try {
        let response = await fetch(API_ROUTES.MASTERS.DESIGNATION.UPDATE(id), {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
            credentials: "include"
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        response = await response.json();
        return data;
    } catch (error) {
        console.log("SERVER ERROR: ", error);
        return null;
    }
}

export const deleteDesignation = async (id: string) => {
    try {
        const response = await fetch(API_ROUTES.MASTERS.DESIGNATION.DELETE(id), {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            credentials: "include"
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        return data;
    } catch (error) {
        console.log("SERVER ERROR: ", error);
        return null;
    }
}

export const deleteAllDesignations = async (payload: designationDeleteAllPayloadInterface) => {
    try {
        const response = await fetch(API_ROUTES.MASTERS.DESIGNATION.DELETEALL, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
            credentials: "include"
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        return data;
    } catch (error) {
        console.log("SERVER ERROR: ", error);
        return null;
    }
}
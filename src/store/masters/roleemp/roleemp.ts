import { API_ROUTES } from "@/constants/ApiRoute"
import { roleEmpAllDataInterface, roleEmpDeleteAllPayloadInterface } from "./roleemp.interface";

export const getRoleEmp = async () => {
    try {
        const response = await fetch(API_ROUTES.MASTERS.ROLEEMP.GET_ALL, {
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

export const getRoleEmpById = async (id: string) => {
    try {
        const response = await fetch(API_ROUTES.MASTERS.ROLEEMP.GET_BY_ID(id), {
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

export const getRoleEmpByDeptAndDesignation = async (departmentId: string, designationId: string) => {
    try {
        const response = await fetch(API_ROUTES.MASTERS.ROLEEMP.GET_ALL_BY_DEPT_AND_DESIG(departmentId, designationId), {
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

export const getFilteredRoleEmp = async (params: string) => {
    try {
        const response = await fetch(API_ROUTES.MASTERS.ROLEEMP.GET_BY_PARAMS(params), {
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

export const addRoleEmp = async (data: roleEmpAllDataInterface) => {
    try {
        let response = await fetch(API_ROUTES.MASTERS.ROLEEMP.ADD, {
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

export const updateRoleEmp = async (id: string, data: roleEmpAllDataInterface) => {
    try {
        let response = await fetch(API_ROUTES.MASTERS.ROLEEMP.UPDATE(id), {
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

export const deleteRoleEmp = async (id: string) => {
    try {
        const response = await fetch(API_ROUTES.MASTERS.ROLEEMP.DELETE(id), {
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

export const deleteAllRoleEmps = async (payload: roleEmpDeleteAllPayloadInterface) => {
    try {
        const response = await fetch(API_ROUTES.MASTERS.ROLEEMP.DELETEALL, {
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
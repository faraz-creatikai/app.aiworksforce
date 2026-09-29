export interface designationAllDataInterface {
    Department: string;
    Name: string;
    Status: string;
}

export interface designationGetDataInterface {
    _id: string;
    Department: {
        _id: string,
        Name: string
    };
    Name: string;
    Status: string;
}

export interface designationDialogDataInterface {
    id: string;
    Name: string;
    Status: string;
}

export interface designationDeleteAllPayloadInterface {
    designationIds: string[];
}
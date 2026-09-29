export interface roleEmpAllDataInterface {
    Department: string;
    Designation: string;
    Name: string;
    Status: string;
}

export interface roleEmpGetDataInterface {
    _id: string;
    Department: {
        _id: string,
        Name: string
    };
    Designation: {
        _id: string,
        Name: string
    };
    Name: string;
    Status: string;
}

export interface roleEmpDialogDataInterface {
    id: string;
    Name: string;
    Status: string;
}

export interface roleEmpDeleteAllPayloadInterface {
    roleEmpIds: string[];
}
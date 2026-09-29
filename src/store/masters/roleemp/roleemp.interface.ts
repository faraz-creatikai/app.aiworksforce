export interface roleAllDataInterface {
    Department: string;
    Designation: string;
    Name: string;
    Status: string;
}

export interface roleGetDataInterface {
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

export interface roleDialogDataInterface {
    id: string;
    Name: string;
    Status: string;
}

export interface roleDeleteAllPayloadInterface {
    roleIds: string[];
}
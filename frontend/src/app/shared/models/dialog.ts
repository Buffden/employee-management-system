import { TableCellData, TableConfig } from "./table";
export type DisplayData = EmployeeDisplayData | DepartmentDisplayData;

export enum overlayType {
    ADDEMPLOYEE = 'addEmployee',
    EDITEMPLOYEE = 'editEmployee',
    ADDDEPARTMENT = 'addDepartment',
    EDITDEPARTMENT = 'editDepartment',
    ADDLOCATION = 'addLocation',
    EDITLOCATION = 'editLocation',
    DISPLAYEMPLOYEE = 'displayEmployee',
    DISPLAYDEPARTMENT = 'displayDepartment',
    DISPLAYLOCATION = 'displayLocation',
    NODATA = 'noData'
}

export interface DialogData {
    // define the properties of DialogData here
    title: string;
    content: TableCellData;
    viewController: overlayType;
    config: TableConfig;
    returnToPage?: string; // Track where dialog was opened from (e.g., 'dashboard', 'locations')
}

export interface EmployeeDisplayData {
    name: string;
    id: number;
    designation: string;
    phone: string;
    email: string;
    joiningDate: string;
    workLocation: string;
}

export interface DepartmentDisplayData {
    id: number;
    name: string;
    location: string;
    manager: string;
}
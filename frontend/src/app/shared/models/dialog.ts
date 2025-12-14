import { TableCellData, TableConfig } from "./table";
import { FilterOption } from "./paginated-response.model";

export type DisplayData = EmployeeDisplayData | DepartmentDisplayData;

export enum overlayType {
    ADDEMPLOYEE = 'addEmployee',
    EDITEMPLOYEE = 'editEmployee',
    ADDDEPARTMENT = 'addDepartment',
    EDITDEPARTMENT = 'editDepartment',
    ADDPROJECT = 'addProject',
    EDITPROJECT = 'editProject',
    ADDLOCATION = 'addLocation',
    EDITLOCATION = 'editLocation',
    DISPLAYEMPLOYEE = 'displayEmployee',
    DISPLAYDEPARTMENT = 'displayDepartment',
    DISPLAYPROJECT = 'displayProject',
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
    filters?: Record<string, FilterOption[]>; // Optional: generic filters from paginated response (e.g., locations for department form dropdown)
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
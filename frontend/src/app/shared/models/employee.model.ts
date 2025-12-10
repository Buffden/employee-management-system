import { Department } from "./department.model";

export interface Employee {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
    designation: string;
    salary: number;
    joiningDate: string;
    locationId: string;
    performanceRating: number;
    managerId: string | null;
    departmentId: string;
    workLocation: string;
    experienceYears: number;
}

export interface EmployeeFormField {
    label: string;
    formControlName: string;
    placeholder: string;
    errorMessage: string;
    type?: string;
    options?: string[];
}

export interface EmployeeRequest {
    name: string;
    designation: string;
    salary: number;
    department: DepartmentID;
    manager: ManagerID | null;
    phone: string;
    address: string;
    email: string;
    employmentType?: string;
    workLocation?: string;
    experienceYears?: number;
    performanceRating?: number;
    lastAppraisalDate?: string;
    isActive?: boolean;
}

export interface ManagerID {
    id: Employee | ManagerID;
}

export interface DepartmentID {
    id: Department | DepartmentID;
}
import { Department } from "./department.model";

export interface Employee {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    address?: string;
    designation: string;
    salary: number;
    joiningDate: string;
    locationId?: string;
    locationName?: string; // Denormalized from backend
    performanceRating?: number;
    managerId?: string | null;
    managerName?: string | null; // Denormalized from backend
    departmentId?: string;
    departmentName?: string; // Denormalized from backend
    workLocation?: string;
    experienceYears?: number;
}

export interface EmployeeFormField {
    label: string;
    formControlName: string;
    placeholder: string;
    errorMessage: string;
    type?: string;
    options?: string[];
    required?: boolean;
}

export interface EmployeeRequest {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    address?: string;
    designation: string;
    salary: number;
    joiningDate: string;
    locationId: string;
    performanceRating?: number;
    managerId?: string | null;
    departmentId: string;
    workLocation?: string;
    experienceYears?: number;
}

export interface ManagerID {
    id: Employee | ManagerID;
}

export interface DepartmentID {
    id: Department | DepartmentID;
}
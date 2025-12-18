export interface Department {
    id: string;
    name: string;
    description: string;
    locationName: string;
    locationId: string;
    createdAt: string;
    budget: number;
    budgetUtilization: number;
    performanceMetric: number;
    departmentHeadId: string | null;
    departmentHeadName?: string | null; // Denormalized from backend
}

export interface DepartmentFormField {
    label: string;
    formControlName: string;
    placeholder: string;
    errorMessage: string;
    type?: string;
    options?: string[];
    required?: boolean;
}
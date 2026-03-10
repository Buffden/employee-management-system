export interface FilterCriteria {
    field: string;
    values: string[];
}

export interface DepartmentQueryRequest {
    page?: number;
    size?: number;
    sortBy?: string;
    sortDir?: string;
    filters?: FilterCriteria[];
}


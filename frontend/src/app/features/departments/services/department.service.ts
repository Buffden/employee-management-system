import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { Observable } from "rxjs";
import { catchError, map } from "rxjs/operators";
import { Department } from "../../../shared/models/department.model";
import { PaginatedResponse } from "../../../shared/models/paginated-response.model";
import { Injectable } from "@angular/core";
import { environment } from "../../../../environments/environment";
import { DepartmentQueryRequest } from "../../../shared/models/department-query-request.model";

@Injectable({
    providedIn: 'root',
})
export class DepartmentService {
    private readonly apiUrl = `${environment.apibaseurl}/departments`;

    constructor(private readonly http: HttpClient) { }

    // Generic error handler for HTTP requests
    private handleError(error: HttpErrorResponse): void {
        console.error('API Error: ', error); // Log for debugging
        // Optionally, handle the error with a user-friendly message
    }

    // POST query departments with pagination
    queryDepartments(page = 0, size = 20, sortBy?: string, sortDir = 'ASC'): Observable<PaginatedResponse<Department>> {
        // Build query request - only include sortBy if it has a value
        const queryRequest: Record<string, string | number> = {
            page: page,
            size: size,
            sortDir: sortDir || 'ASC'
        };

        // Only include sortBy if it's provided and not empty
        if (sortBy && sortBy.trim().length > 0) {
            queryRequest['sortBy'] = sortBy.trim();
        }

        return this.http.post<PaginatedResponse<Department>>(this.apiUrl, queryRequest).pipe(
            catchError((error) => {
                this.handleError(error);
                throw error;
            })
        );
    }

    // GET all departments (deprecated - use queryDepartments instead)
    getDepartments(): Observable<Department[]> {
        return this.queryDepartments(0, 1000).pipe(
            map((response: PaginatedResponse<Department>) => response.content || []),
            catchError((error) => {
                this.handleError(error);
                throw error;
            })
        );
    }

    // GET all departments (no pagination) - for dropdowns
    getAllDepartments(): Observable<Department[]> {
        return this.queryDepartments(0, 1000).pipe(
            map((response: PaginatedResponse<Department>) => response.content || []),
            catchError((error) => {
                this.handleError(error);
                throw error;
            })
        );
    }

    // GET a single department by ID
    getDepartment(id: number): Observable<Department> {
        return this.http.get<Department>(`${this.apiUrl}/${id}`).pipe(
            catchError((error) => {
                this.handleError(error);
                throw error;
            })
        );
    }

    // Search departments for typeahead/autocomplete
    searchDepartments(searchTerm?: string, locationId?: string, excludeId?: string): Observable<Department[]> {
        const params: Record<string, string> = {};
        if (searchTerm?.trim()) {
            params['q'] = searchTerm.trim();
        }
        if (locationId?.trim()) {
            params['locationId'] = locationId.trim();
        }
        if (excludeId?.trim()) {
            params['excludeId'] = excludeId.trim();
        }
        
        return this.http.get<Department[]>(`${this.apiUrl}/search`, { params }).pipe(
            catchError((error) => {
                this.handleError(error);
                throw error;
            })
        );
    }

    // GET department by ID for typeahead
    getDepartmentById(id: string): Observable<Department> {
        return this.http.get<Department>(`${this.apiUrl}/${id}`).pipe(
            catchError((error) => {
                this.handleError(error);
                throw error;
            })
        );
    }

    // POST (add) a new department
    addDepartment(department: Partial<Department>): Observable<Department> {
        return this.http.post<Department>(`${this.apiUrl}/create`, department).pipe(
            catchError((error) => {
                this.handleError(error);
                throw error;
            })
        );
    }

    // PUT (update) a department
    updateDepartment(id: string, department: Partial<Department>): Observable<Department> {
        return this.http.put<Department>(
            `${this.apiUrl}/${id}`,
            department
        ).pipe(
            catchError((error) => {
                this.handleError(error);
                throw error;
            })
        );
    }

    // DELETE a department by ID
    deleteDepartment(id: string): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
            catchError((error) => {
                this.handleError(error);
                throw error;
            })
        );
    }
}

import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { Observable } from "rxjs";
import { catchError } from "rxjs/operators";
import { Employee } from "../../../shared/models/employee.model";
import { PaginatedResponse } from "../../../shared/models/paginated-response.model";
import { Injectable } from "@angular/core";
import { environment } from "../../../../environments/environment";

@Injectable({
    providedIn: 'root',
})
export class EmployeeService {
    private readonly apiUrl = `${environment.apibaseurl}/employees`;

    constructor(private readonly http: HttpClient) { }

    // Generic error handler for HTTP requests
    private handleError(error: HttpErrorResponse): void {
        console.error('API Error: ', error);
    }

    // POST query employees with pagination
    queryEmployees(page = 0, size = 20, sortBy?: string, sortDir = 'ASC'): Observable<PaginatedResponse<Employee>> {
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

        return this.http.post<PaginatedResponse<Employee>>(this.apiUrl, queryRequest).pipe(
            catchError((error) => {
                this.handleError(error);
                throw error;
            })
        );
    }

    // GET all employees (no pagination) - for dropdowns
    getAllEmployees(): Observable<Employee[]> {
        // This will be used for manager dropdown filtering
        // For now, return empty array - can be enhanced later
        return new Observable(observer => {
            observer.next([]);
            observer.complete();
        });
    }

    // GET employees by department ID (for manager dropdown filtering)
    getEmployeesByDepartment(departmentId: string): Observable<Employee[]> {
        return this.http.get<Employee[]>(`${this.apiUrl}/search`, {
            params: {
                departmentId: departmentId
            }
        }).pipe(
            catchError((error) => {
                this.handleError(error);
                throw error;
            })
        );
    }

    // Search employees for typeahead/autocomplete
    searchEmployees(searchTerm: string, departmentId?: string, excludeId?: string): Observable<Employee[]> {
        const params: Record<string, string> = {};
        if (searchTerm && searchTerm.trim()) {
            params['q'] = searchTerm.trim();
        }
        if (departmentId) {
            params['departmentId'] = departmentId;
        }
        if (excludeId) {
            params['excludeId'] = excludeId;
        }
        
        return this.http.get<Employee[]>(`${this.apiUrl}/search`, { params }).pipe(
            catchError((error) => {
                this.handleError(error);
                throw error;
            })
        );
    }

    // GET a single employee by ID
    getEmployeeById(id: string): Observable<Employee> {
        return this.http.get<Employee>(`${this.apiUrl}/${id}`).pipe(
            catchError((error) => {
                this.handleError(error);
                throw error;
            })
        );
    }

    // POST (add) a new employee
    addEmployee(employeeData: Record<string, string | number | null>): Observable<Employee> {
        return this.http.post<Employee>(`${this.apiUrl}/create`, employeeData).pipe(
            catchError((error) => {
                this.handleError(error);
                throw error;
            })
        );
    }

    // PUT (update) an employee
    updateEmployee(id: string, employeeData: Record<string, string | number | null>): Observable<Employee> {
        return this.http.put<Employee>(`${this.apiUrl}/${id}`, employeeData).pipe(
            catchError((error) => {
                this.handleError(error);
                throw error;
            })
        );
    }

    // DELETE an employee by ID
    deleteEmployee(id: string): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
            catchError((error) => {
                this.handleError(error);
                throw error;
            })
        );
    }
}

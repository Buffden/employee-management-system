import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { Observable } from "rxjs";
import { catchError } from "rxjs/operators";
import { Employee, EmployeeRequest } from "../../../shared/models/employee.model";
import { Injectable } from "@angular/core";
import { environment } from "../../../../environments/environment";

@Injectable({
    providedIn: 'root',
})
export class EmployeeService {
    private apiUrl = `${environment.apibaseurl}/employees`;

    constructor(private http: HttpClient) { }

    // Generic error handler for HTTP requests
    private handleError(error: HttpErrorResponse): void {
        console.error('API Error: ', error); // Log for debugging
        // Optionally, handle the error with a user-friendly message
    }

    // GET all employees
    getEmployees(): Observable<Employee[]> {
        return this.http.get<Employee[]>(this.apiUrl).pipe(
            catchError((error) => {
                this.handleError(error);
                throw error; // Re-throw error to be handled by the caller
            })
        );
    }

    // GET a single employee by ID
    getEmployee(id: number): Observable<Employee> {
        return this.http.get<Employee>(`${this.apiUrl}/${id}`).pipe(
            catchError((error) => {
                this.handleError(error);
                throw error;
            })
        );
    }

    // POST (add) a new employee
    addEmployee(employee: EmployeeRequest): Observable<Employee> {
        return this.http.post<Employee>(this.apiUrl, employee).pipe(
            catchError((error) => {
                this.handleError(error);
                throw error;
            })
        );
    }

    // PUT (update) an employee
    updateEmployee(employee: Employee): Observable<Employee> {
        return this.http.put<Employee>(
            `${this.apiUrl}/${employee.id}`,
            employee
        ).pipe(
            catchError((error) => {
                this.handleError(error);
                throw error;
            })
        );
    }

    // DELETE an employee by ID
    deleteEmployee(id: number): Observable<Employee> {
        return this.http.delete<Employee>(`${this.apiUrl}/${id}`).pipe(
            catchError((error) => {
                this.handleError(error);
                throw error;
            })
        );
    }
}

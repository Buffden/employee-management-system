import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { Observable } from "rxjs";
import { catchError } from "rxjs/operators";
import { Department } from "../../../shared/models/department.model";
import { Injectable } from "@angular/core";
import { environment } from "../../../../environments/environment";

@Injectable({
    providedIn: 'root',
})
export class DepartmentService {
    private apiUrl = `${environment.apibaseurl}/departments`;

    constructor(private http: HttpClient) { }

    // Generic error handler for HTTP requests
    private handleError(error: HttpErrorResponse): void {
        console.error('API Error: ', error); // Log for debugging
        // Optionally, handle the error with a user-friendly message
    }

    // GET all departments
    getDepartments(): Observable<Department[]> {
        return this.http.get<Department[]>(this.apiUrl).pipe(
            catchError((error) => {
                this.handleError(error);
                throw error; // Re-throw error to be handled by the caller
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

    // POST (add) a new department
    addDepartment(department: Department): Observable<Department> {
        return this.http.post<Department>(this.apiUrl, department).pipe(
            catchError((error) => {
                this.handleError(error);
                throw error;
            })
        );
    }

    // PUT (update) an department
    updateDepartment(department: Department): Observable<Department> {
        return this.http.put<Department>(
            `${this.apiUrl}/${department.id}`,
            department
        ).pipe(
            catchError((error) => {
                this.handleError(error);
                throw error;
            })
        );
    }

    // DELETE an department by ID
    deleteDepartment(id: number): Observable<Department> {
        return this.http.delete<Department>(`${this.apiUrl}/${id}`).pipe(
            catchError((error) => {
                this.handleError(error);
                throw error;
            })
        );
    }
}

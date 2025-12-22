import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Project } from '../../../shared/models/project.model';
import { PaginatedResponse } from '../../../shared/models/paginated-response.model';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ProjectService {
  private apiUrl = `${environment.apibaseurl}/projects`;

  constructor(private http: HttpClient) {}

  // Generic error handler for HTTP requests
  private handleError(error: HttpErrorResponse): void {
    console.error('API Error: ', error); // Log for debugging
    // Optionally, handle the error with a user-friendly message
  }

  // POST query projects with pagination
  queryProjects(page = 0, size = 20, sortBy?: string, sortDir = 'ASC'): Observable<PaginatedResponse<Project>> {
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

    return this.http.post<PaginatedResponse<Project>>(`${this.apiUrl}`, queryRequest).pipe(
      catchError((error) => {
        this.handleError(error);
        throw error;
      })
    );
  }

  // GET all projects (deprecated - use queryProjects instead)
  getAll(): Observable<Project[]> {
    return this.queryProjects(0, 1000).pipe(
      map((response: PaginatedResponse<Project>) => response.content || []),
      catchError((error) => {
        this.handleError(error);
        throw error;
      })
    );
  }

  getById(id: string): Observable<Project> {
    return this.http.get<Project>(`${this.apiUrl}/${id}`).pipe(
      catchError((error) => {
        this.handleError(error);
        throw error;
      })
    );
  }

  create(project: Partial<Project>): Observable<Project> {
    return this.http.post<Project>(`${this.apiUrl}/create`, project).pipe(
      catchError((error) => {
        this.handleError(error);
        throw error;
      })
    );
  }

  update(id: string, project: Partial<Project>): Observable<Project> {
    return this.http.put<Project>(`${this.apiUrl}/${id}`, project).pipe(
      catchError((error) => {
        this.handleError(error);
        throw error;
      })
    );
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      catchError((error) => {
        this.handleError(error);
        throw error;
      })
    );
  }

  getByDepartmentId(departmentId: string): Observable<Project[]> {
    return this.http.get<Project[]>(`${this.apiUrl}/department/${departmentId}`).pipe(
      catchError((error) => {
        this.handleError(error);
        throw error;
      })
    );
  }
} 
import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { Observable } from "rxjs";
import { catchError, map } from "rxjs/operators";
import { Location } from "../../../shared/models/location.model";
import { PaginatedResponse } from "../../../shared/models/paginated-response.model";
import { Injectable } from "@angular/core";
import { environment } from "../../../../environments/environment";

@Injectable({
    providedIn: 'root',
})
export class LocationService {
    private readonly apiUrl = `${environment.apibaseurl}/locations`;

    constructor(private readonly http: HttpClient) { }

    // Generic error handler for HTTP requests
    private handleError(error: HttpErrorResponse): void {
        console.error('API Error: ', error);
    }

    // POST query locations with pagination
    queryLocations(page = 0, size = 20, sortBy?: string, sortDir = 'ASC'): Observable<PaginatedResponse<Location>> {
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

        return this.http.post<PaginatedResponse<Location>>(this.apiUrl, queryRequest).pipe(
            catchError((error) => {
                this.handleError(error);
                throw error;
            })
        );
    }

    // GET all locations with pagination (deprecated - use queryLocations instead)
    getLocations(page = 0, size = 20, sortBy?: string, sortDir = 'ASC'): Observable<PaginatedResponse<Location>> {
        return this.queryLocations(page, size, sortBy, sortDir);
    }

    // GET all locations (no pagination)
    getAllLocations(): Observable<Location[]> {
        return this.http.get<PaginatedResponse<Location>>(this.apiUrl).pipe(
            map((response: PaginatedResponse<Location>) => response.content || []),
            catchError((error) => {
                this.handleError(error);
                throw error;
            })
        );
    }

    // GET a single location by ID
    getLocation(id: string): Observable<Location> {
        return this.http.get<Location>(`${this.apiUrl}/${id}`).pipe(
            catchError((error) => {
                this.handleError(error);
                throw error;
            })
        );
    }

    // POST (add) a new location
    addLocation(location: Partial<Location>): Observable<Location> {
        return this.http.post<Location>(`${this.apiUrl}/create`, location).pipe(
            catchError((error) => {
                this.handleError(error);
                throw error;
            })
        );
    }

    // PUT (update) a location
    updateLocation(id: string, location: Partial<Location>): Observable<Location> {
        return this.http.put<Location>(`${this.apiUrl}/${id}`, location).pipe(
            catchError((error) => {
                this.handleError(error);
                throw error;
            })
        );
    }

    // DELETE a location by ID
    deleteLocation(id: string): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
            catchError((error) => {
                this.handleError(error);
                throw error;
            })
        );
    }
}


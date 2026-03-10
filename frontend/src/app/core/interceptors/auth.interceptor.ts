import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, switchMap, filter, take } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private isRefreshing = false;
  private readonly refreshTokenSubject: BehaviorSubject<boolean | null> = new BehaviorSubject<boolean | null>(null);
  
  // Public endpoints that don't require authentication
  private readonly publicEndpoints = [
    '/auth/login',
    '/auth/refresh',
    '/auth/activate',
    '/auth/forgot-password',
    '/auth/reset-password'
  ];

  constructor(
    private readonly authService: AuthService
  ) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    // Check if this is a public endpoint that doesn't require authentication
    const isPublicEndpoint = this.publicEndpoints.some(endpoint => request.url.includes(endpoint));

    request = this.addCredentialsToRequest(request);

    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        // Handle 401 Unauthorized - but skip for public endpoints
        if (error.status === 401 && !isPublicEndpoint) {
          return this.handle401Error(request, next, error);
        }

        return throwError(() => error);
      })
    );
  }

  private addCredentialsToRequest(request: HttpRequest<unknown>): HttpRequest<unknown> {
    return request.clone({ withCredentials: true });
  }

  /**
   * Handle 401 Unauthorized error
   * Attempts to refresh token and retry the request
   */
  private handle401Error(request: HttpRequest<unknown>, next: HttpHandler, error: HttpErrorResponse): Observable<HttpEvent<unknown>> {
    // Don't try to refresh token for public or special endpoints
    const isPublicEndpoint = this.publicEndpoints.some(endpoint => request.url.includes(endpoint));
    
    if (isPublicEndpoint) {
      // For public endpoints, just return the error without redirecting
      return throwError(() => error);
    }
    
    if (request.url.includes('/auth/register')) {
      console.error('401 error on register endpoint - authentication failed');
      return throwError(() => new Error('Authentication failed. Please ensure you are logged in as System Admin.'));
    }

    if (!this.isRefreshing) {
      this.isRefreshing = true;
      this.refreshTokenSubject.next(null);

      return this.authService.refreshToken().pipe(
        switchMap(() => {
          this.isRefreshing = false;
          this.refreshTokenSubject.next(true);
          return next.handle(this.addCredentialsToRequest(request));
        }),
        catchError((error) => {
          this.isRefreshing = false;
          this.authService.logout();
          return throwError(() => error);
        })
      );
    }

    // If refresh is in progress, wait for it to complete
    return this.refreshTokenSubject.pipe(
      filter(state => state !== null),
      take(1),
      switchMap(() => next.handle(this.addCredentialsToRequest(request))),
      catchError(() => {
        // If waiting for refresh fails, return error
        return throwError(() => new Error('Token refresh failed'));
      })
    );
  }
}

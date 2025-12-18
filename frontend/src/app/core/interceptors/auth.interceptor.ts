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
import { Router } from '@angular/router';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private isRefreshing = false;
  private readonly refreshTokenSubject: BehaviorSubject<string | null> = new BehaviorSubject<string | null>(null);
  
  // Public endpoints that don't require authentication
  private readonly publicEndpoints = [
    '/auth/login',
    '/auth/refresh',
    '/auth/activate',
    '/auth/forgot-password',
    '/auth/reset-password'
  ];

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router
  ) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    // Check if this is a public endpoint that doesn't require authentication
    const isPublicEndpoint = this.publicEndpoints.some(endpoint => request.url.includes(endpoint));

    // Skip adding token for public endpoints
    if (isPublicEndpoint) {
      return next.handle(request);
    }

    // Add token to request
    const token = this.authService.getToken();
    if (token) {
      request = this.addTokenToRequest(request, token);
    }

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

  /**
   * Add Authorization header with Bearer token
   */
  private addTokenToRequest(request: HttpRequest<unknown>, token: string): HttpRequest<unknown> {
    return request.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
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

      const refreshToken = this.authService.getRefreshToken();
      if (refreshToken) {
        return this.authService.refreshToken().pipe(
          switchMap((authResponse) => {
            this.isRefreshing = false;
            this.refreshTokenSubject.next(authResponse.token);
            return next.handle(this.addTokenToRequest(request, authResponse.token));
          }),
          catchError((error) => {
            this.isRefreshing = false;
            this.authService.logout();
            return throwError(() => error);
          })
        );
      } else {
        // No refresh token available
        this.isRefreshing = false;
        console.error('No refresh token available, logging out');
        this.authService.logout();
        return throwError(() => new Error('Session expired. Please login again.'));
      }
    }

    // If refresh is in progress, wait for it to complete
    return this.refreshTokenSubject.pipe(
      filter(token => token !== null),
      take(1),
      switchMap((token) => next.handle(this.addTokenToRequest(request, token))),
      catchError(() => {
        // If waiting for refresh fails, return error
        return throwError(() => new Error('Token refresh failed'));
      })
    );
  }
}


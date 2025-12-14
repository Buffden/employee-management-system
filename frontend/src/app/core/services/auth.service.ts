import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap, catchError, throwError, from } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { LoginRequest, RegisterRequest, AuthResponse, RefreshTokenRequest, User } from '../../shared/models/auth.model';
import { hashPassword } from '../utils/hash.util';
import { UserRole } from '../../shared/models/user-role.enum';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly TOKEN_KEY = 'access_token';
  private readonly REFRESH_TOKEN_KEY = 'refresh_token';
  private readonly USER_KEY = 'user';
  private readonly API_URL = `${environment.apibaseurl}/auth`;
  private readonly isBrowser: boolean;

  private readonly currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  private readonly isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  constructor(
    private readonly http: HttpClient,
    private readonly router: Router,
    @Inject(PLATFORM_ID) private readonly platformId: object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
    
    // Only initialize from localStorage if in browser
    if (this.isBrowser) {
      this.currentUserSubject.next(this.getStoredUser());
      this.isAuthenticatedSubject.next(this.hasValidToken());
      // Check token expiration on service initialization
      this.checkTokenExpiration();
    }
  }

  /**
   * Register a new user
   * Hashes password before sending to backend (username stays plain)
   */
  register(registrationData: RegisterRequest): Observable<AuthResponse> {
    // Hash only password before sending (username stays plain for user-friendliness)
    return from(hashPassword(registrationData.password)).pipe(
      switchMap(hashedPassword => {
        const hashedData: RegisterRequest = {
          ...registrationData,
          password: hashedPassword
          // username stays as plain text
        };
        
        return this.http.post<AuthResponse>(`${this.API_URL}/register`, hashedData).pipe(
          tap(response => {
            // Don't auto-login after creating a user - keep current admin session
            console.log('User created successfully:', response.user.username);
          }),
          catchError(error => {
            console.error('Registration error:', error);
            if (error.status === 401) {
              console.error('401 Unauthorized - Token may be missing or invalid');
            }
            return throwError(() => error);
          })
        );
      })
    );
  }

  /**
   * Login user with username and password
   * Hashes password before sending to backend (username stays plain)
   */
  login(credentials: LoginRequest): Observable<AuthResponse> {
    // Hash only password before sending (username stays plain for user-friendliness)
    return from(hashPassword(credentials.password)).pipe(
      switchMap(hashedPassword => {
        const hashedCredentials: LoginRequest = {
          username: credentials.username, // Keep username plain
          password: hashedPassword
        };
        
        return this.http.post<AuthResponse>(`${this.API_URL}/login`, hashedCredentials).pipe(
          tap(response => {
            this.setAuthData(response);
            this.currentUserSubject.next(response.user);
            this.isAuthenticatedSubject.next(true);
          }),
          catchError(error => {
            console.error('Login error:', error);
            return throwError(() => error);
          })
        );
      })
    );
  }

  /**
   * Logout user and clear all stored data
   */
  logout(): void {
    if (this.isBrowser) {
      const token = this.getToken();
      if (token) {
        // Call logout endpoint (fire and forget)
        this.http.post(`${this.API_URL}/logout`, {}, {
          headers: { 'Authorization': `Bearer ${token}` }
        }).subscribe({
          error: (err) => console.error('Logout API call failed:', err)
        });
      }
    }

    this.clearAuthData();
    this.currentUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);
    
    if (this.isBrowser) {
      this.router.navigate(['/login']);
    }
  }

  /**
   * Refresh access token using refresh token
   */
  refreshToken(): Observable<AuthResponse> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      return throwError(() => new Error('No refresh token available'));
    }

    const request: RefreshTokenRequest = { refreshToken };
    return this.http.post<AuthResponse>(`${this.API_URL}/refresh`, request).pipe(
      tap(response => {
        this.setAuthData(response);
        this.currentUserSubject.next(response.user);
        this.isAuthenticatedSubject.next(true);
      }),
      catchError(error => {
        console.error('Token refresh error:', error);
        // If refresh fails, logout user
        this.logout();
        return throwError(() => error);
      })
    );
  }

  /**
   * Get current access token
   */
  getToken(): string | null {
    if (!this.isBrowser) return null;
    return localStorage.getItem(this.TOKEN_KEY);
  }

  /**
   * Get current refresh token
   */
  getRefreshToken(): string | null {
    if (!this.isBrowser) return null;
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  /**
   * Get current user
   */
  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return this.isAuthenticatedSubject.value;
  }

  /**
   * Check if current user has admin role (SYSTEM_ADMIN or HR_MANAGER)
   */
  isAdmin(): boolean {
    return this.hasAnyRole([UserRole.SYSTEM_ADMIN, UserRole.HR_MANAGER]);
  }

  /**
   * Check if current user is SYSTEM_ADMIN (can create other admins)
   */
  isSystemAdmin(): boolean {
    return this.hasRole(UserRole.SYSTEM_ADMIN);
  }

  /**
   * Check if current user is HR_MANAGER
   */
  isHRManager(): boolean {
    return this.hasRole(UserRole.HR_MANAGER);
  }

  /**
   * Check if current user is DEPARTMENT_MANAGER
   */
  isDepartmentManager(): boolean {
    return this.hasRole(UserRole.DEPARTMENT_MANAGER);
  }

  /**
   * Check if user has a specific role
   */
  hasRole(role: string): boolean {
    const user = this.getCurrentUser();
    return user?.role === role;
  }

  /**
   * Check if user has any of the specified roles
   */
  hasAnyRole(roles: string[]): boolean {
    const user = this.getCurrentUser();
    return user ? roles.includes(user.role) : false;
  }

  /**
   * Store authentication data in localStorage
   */
  private setAuthData(response: AuthResponse): void {
    if (!this.isBrowser) return;
    localStorage.setItem(this.TOKEN_KEY, response.token);
    localStorage.setItem(this.REFRESH_TOKEN_KEY, response.refreshToken);
    localStorage.setItem(this.USER_KEY, JSON.stringify(response.user));
  }

  /**
   * Clear all authentication data from localStorage
   */
  private clearAuthData(): void {
    if (!this.isBrowser) return;
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
  }

  /**
   * Get stored user from localStorage
   */
  private getStoredUser(): User | null {
    if (!this.isBrowser) return null;
    const userStr = localStorage.getItem(this.USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
  }

  /**
   * Check if there's a valid token stored
   */
  private hasValidToken(): boolean {
    const token = this.getToken();
    if (!token) return false;

    // Check if token is expired
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expiration = payload.exp * 1000; // Convert to milliseconds
      return Date.now() < expiration;
    } catch {
      return false;
    }
  }

  /**
   * Check token expiration and refresh if needed
   */
  private checkTokenExpiration(): void {
    if (!this.isBrowser) return;
    
    const token = this.getToken();
    if (!token) {
      this.logout();
      return;
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expiration = payload.exp * 1000;
      const now = Date.now();
      const timeUntilExpiry = expiration - now;

      // If token expires in less than 5 minutes or already expired, refresh it
      if (timeUntilExpiry < 5 * 60 * 1000) {
        this.refreshToken().subscribe({
          error: () => this.logout()
        });
      }
    } catch {
      this.logout();
    }
  }
}


import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap, catchError, throwError, from } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { LoginRequest, RegisterRequest, AuthResponse, User, ActivateAccountRequest, ForgotPasswordRequest, ResetPasswordRequest } from '../../shared/models/auth.model';
import { hashPassword } from '../utils/hash.util';
import { UserRole } from '../../shared/models/user-role.enum';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
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
      const storedUser = this.getStoredUser();
      this.currentUserSubject.next(storedUser);
      this.isAuthenticatedSubject.next(!!storedUser);
      // Only attempt refresh when a local session exists to avoid noisy 401s after logout
      if (storedUser) {
        this.refreshToken().subscribe({
          error: () => this.logout(false)
        });
      }
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
        
        return this.http.post<AuthResponse>(`${this.API_URL}/register`, hashedData, { withCredentials: true }).pipe(
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
    console.log('AuthService.login called with:', { username: credentials.username, password: '***' });
    console.log('API_URL:', this.API_URL);
    
    // Hash only password before sending (username stays plain for user-friendliness)
    return from(hashPassword(credentials.password)).pipe(
      tap(hashedPassword => {
        console.log('Password hashed, length:', hashedPassword.length);
      }),
      switchMap(hashedPassword => {
        const hashedCredentials: LoginRequest = {
          username: credentials.username, // Keep username plain
          password: hashedPassword
        };
        
        console.log('Making HTTP POST to:', `${this.API_URL}/login`);
        console.log('Request payload:', { username: hashedCredentials.username, password: '***' });
        
        return this.http.post<AuthResponse>(`${this.API_URL}/login`, hashedCredentials, { withCredentials: true }).pipe(
          tap(response => {
            console.log('Login response received:', response);
            this.setUser(response.user);
          }),
          catchError(error => {
            console.error('Login HTTP error:', error);
            console.error('Error status:', error.status);
            console.error('Error message:', error.message);
            return throwError(() => error);
          })
        );
      }),
      catchError(error => {
        console.error('Password hashing error:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Activate user account using invite token
   * Hashes password before sending to backend
   */
  activateAccount(token: string, password: string): Observable<void> {
    return from(hashPassword(password)).pipe(
      switchMap(hashedPassword => {
        const request: ActivateAccountRequest = {
          token: token,
          password: hashedPassword
        };
        return this.http.post<void>(`${this.API_URL}/activate`, request, { withCredentials: true }).pipe(
          catchError(error => {
            console.error('Activation error:', error);
            return throwError(() => error);
          })
        );
      })
    );
  }

  /**
   * Request password reset - sends reset email to user
   * Returns void on success (generic response for security)
   */
  forgotPassword(email: string): Observable<void> {
    const request: ForgotPasswordRequest = { email };
    return this.http.post<void>(`${this.API_URL}/forgot-password`, request, { withCredentials: true }).pipe(
      catchError(error => {
        console.error('Forgot password error:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Reset password using reset token
   * Hashes password before sending to backend
   */
  resetPassword(token: string, password: string): Observable<void> {
    return from(hashPassword(password)).pipe(
      switchMap(hashedPassword => {
        const request: ResetPasswordRequest = {
          token: token,
          password: hashedPassword
        };
        return this.http.post<void>(`${this.API_URL}/reset-password`, request, { withCredentials: true }).pipe(
          catchError(error => {
            console.error('Reset password error:', error);
            return throwError(() => error);
          })
        );
      })
    );
  }

  /**
   * Logout user and clear all stored data
   */
  logout(redirectToLogin: boolean = true): void {
    if (this.isBrowser) {
      // Call logout endpoint (fire and forget) to clear cookies server-side
      this.http.post(`${this.API_URL}/logout`, {}, { withCredentials: true }).subscribe({
        error: (err) => console.error('Logout API call failed:', err)
      });
    }

    this.clearUser();
    
    if (this.isBrowser) {
      if (redirectToLogin) {
        this.router.navigate(['/login']);
      }
    }
  }

  /**
   * Refresh access token using refresh token
   */
  refreshToken(): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_URL}/refresh`, {}, { withCredentials: true }).pipe(
      tap(response => {
        this.setUser(response.user);
      }),
      catchError(error => {
        console.error('Token refresh error:', error);
        // If refresh fails, logout user
        this.logout(false);
        return throwError(() => error);
      })
    );
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

  private setUser(user: User): void {
    if (!this.isBrowser) return;
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    this.currentUserSubject.next(user);
    this.isAuthenticatedSubject.next(true);
  }

  private clearUser(): void {
    if (!this.isBrowser) return;
    localStorage.removeItem(this.USER_KEY);
    this.currentUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);
  }

  /**
   * Get stored user from localStorage
   */
  private getStoredUser(): User | null {
    if (!this.isBrowser) return null;
    const userStr = localStorage.getItem(this.USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
  }
}

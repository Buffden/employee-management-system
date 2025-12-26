import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../../../core/services/auth.service';
import { timer, Subscription } from 'rxjs';

@Component({
  selector: 'app-activate',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatIconModule
  ],
  templateUrl: './activate.component.html',
  styleUrls: ['./activate.component.css']
})
export class ActivateComponent implements OnInit, OnDestroy {
  activateForm: FormGroup;
  loading = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;
  hidePassword = true;
  hideConfirmPassword = true;
  token: string | null = null;
  mode: 'activate' | 'reset' = 'activate'; // Detect mode from route
  private redirectSubscription?: Subscription;

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly authService: AuthService,
    private readonly router: Router,
    private readonly route: ActivatedRoute
  ) {
    this.activateForm = this.formBuilder.group({
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]]
    }, { 
      validators: this.passwordMatchValidator.bind(this)
    });
  }

  ngOnInit(): void {
    // Detect mode from route path
    const routePath = this.route.snapshot.routeConfig?.path || this.router.url;
    this.mode = routePath === 'reset' || routePath?.includes('reset') ? 'reset' : 'activate';
    
    // Get token from query parameter
    this.token = this.route.snapshot.queryParams['token'];
    
    if (!this.token) {
      const errorMsg = this.mode === 'reset' 
        ? 'Invalid reset link. No token provided.' 
        : 'Invalid activation link. No token provided.';
      this.errorMessage = errorMsg;
      this.activateForm.disable();
    }

    // Only redirect authenticated users for activation, not for password reset
    // Users should be able to reset password even if logged in
    if (this.mode === 'activate' && this.authService.isAuthenticated()) {
      this.router.navigate(['/dashboard']);
    }
  }

  /**
   * Custom validator to check if passwords match
   */
  passwordMatchValidator(formGroup: FormGroup) {
    const password = formGroup.get('password');
    const confirmPassword = formGroup.get('confirmPassword');
    
    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    } else {
      if (confirmPassword?.errors?.['passwordMismatch']) {
        delete confirmPassword.errors['passwordMismatch'];
        if (Object.keys(confirmPassword.errors).length === 0) {
          confirmPassword.setErrors(null);
        }
      }
      return null;
    }
  }

  onSubmit(): void {
    if (this.activateForm.invalid || !this.token) {
      this.markFormGroupTouched(this.activateForm);
      return;
    }

    this.loading = true;
    this.errorMessage = null;
    this.successMessage = null;

    const password = this.activateForm.get('password')?.value;

    // Use different API call based on mode
    const apiCall = this.mode === 'reset' 
      ? this.authService.resetPassword(this.token, password)
      : this.authService.activateAccount(this.token, password);

    apiCall.subscribe({
      next: () => {
        this.loading = false;
        const successMsg = this.mode === 'reset'
          ? 'Password reset successfully! Redirecting to login...'
          : 'Account activated successfully! Redirecting to login...';
        this.successMessage = successMsg;
        
        // If resetting password and user is logged in, logout first (security best practice)
        // This ensures old tokens are invalidated and user must login with new password
        if (this.mode === 'reset' && this.authService.isAuthenticated()) {
          this.authService.logout();
        }
        
        // Redirect to login after 2 seconds using RxJS timer for better testability
        this.redirectSubscription = timer(2000).subscribe(() => {
          const queryParam = this.mode === 'reset' ? { reset: 'success' } : { activated: 'true' };
          this.router.navigate(['/login'], { queryParams: queryParam });
        });
      },
      error: (error) => {
        this.loading = false;
        if (error.status === 400) {
          const errorMsg = this.mode === 'reset'
            ? error.error?.message || 'Invalid or expired reset link. Please request a new one.'
            : error.error?.message || 'Invalid or expired token. Please request a new activation link.';
          this.errorMessage = errorMsg;
        } else if (error.status === 0) {
          this.errorMessage = 'Unable to connect to server. Please check your connection.';
        } else {
          const errorMsg = this.mode === 'reset'
            ? 'An error occurred during password reset. Please try again.'
            : 'An error occurred during activation. Please try again.';
          this.errorMessage = errorMsg;
        }
      }
    });
  }

  /**
   * Mark all form fields as touched to show validation errors
   */
  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  /**
   * Get error message for form field
   */
  getErrorMessage(fieldName: string): string {
    const control = this.activateForm.get(fieldName);
    if (control?.hasError('required')) {
      return `${this.getFieldLabel(fieldName)} is required`;
    }
    if (control?.hasError('minlength')) {
      return `${this.getFieldLabel(fieldName)} must be at least ${control.errors?.['minlength'].requiredLength} characters`;
    }
    if (control?.hasError('passwordMismatch')) {
      return 'Passwords do not match';
    }
    return '';
  }

  /**
   * Get human-readable field label
   */
  private getFieldLabel(fieldName: string): string {
    const labels: Record<string, string> = {
      password: 'Password',
      confirmPassword: 'Confirm Password'
    };
    return labels[fieldName] || fieldName;
  }

  /**
   * Check if field has error and is touched
   */
  hasFieldError(fieldName: string): boolean {
    const control = this.activateForm.get(fieldName);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  ngOnDestroy(): void {
    // Clean up subscription to prevent memory leaks
    this.redirectSubscription?.unsubscribe();
  }
}


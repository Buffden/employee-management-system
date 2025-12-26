import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../../core/services/auth.service';

export interface ForgotPasswordDialogData {
  email?: string; // Optional pre-filled email
}

@Component({
  selector: 'app-forgot-password-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './forgot-password-dialog.component.html',
  styleUrls: ['./forgot-password-dialog.component.css']
})
export class ForgotPasswordDialogComponent {
  forgotPasswordForm: FormGroup;
  loading = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;

  constructor(
    public dialogRef: MatDialogRef<ForgotPasswordDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ForgotPasswordDialogData,
    private readonly formBuilder: FormBuilder,
    private readonly authService: AuthService
  ) {
    this.forgotPasswordForm = this.formBuilder.group({
      email: [data?.email || '', [Validators.required, Validators.email]]
    });
  }

  onSubmit(): void {
    if (this.forgotPasswordForm.invalid) {
      this.markFormGroupTouched(this.forgotPasswordForm);
      return;
    }

    this.loading = true;
    this.errorMessage = null;
    this.successMessage = null;

    const email = this.forgotPasswordForm.get('email')?.value;

    this.authService.forgotPassword(email).subscribe({
      next: () => {
        this.loading = false;
        this.successMessage = 'If an account exists with this email, a password reset link has been sent. Please check your email.';
        // Close dialog after 3 seconds
        setTimeout(() => {
          this.dialogRef.close(true);
        }, 3000);
      },
      error: (error) => {
        this.loading = false;
        if (error.status === 400) {
          this.errorMessage = 'Please enter a valid email address.';
        } else if (error.status === 0) {
          this.errorMessage = 'Unable to connect to server. Please check your connection.';
        } else {
          // For security, show generic message even on other errors
          this.successMessage = 'If an account exists with this email, a password reset link has been sent. Please check your email.';
        }
      }
    });
  }

  onCancel(): void {
    this.dialogRef.close(false);
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
    const control = this.forgotPasswordForm.get(fieldName);
    if (control?.hasError('required')) {
      return 'Email is required';
    }
    if (control?.hasError('email')) {
      return 'Please enter a valid email address';
    }
    return '';
  }

  /**
   * Check if field has error and is touched
   */
  hasFieldError(fieldName: string): boolean {
    const control = this.forgotPasswordForm.get(fieldName);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }
}


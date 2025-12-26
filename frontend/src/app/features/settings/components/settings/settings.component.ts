import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { SharedModule } from '../../../../shared/shared.module';
import { AuthService } from '../../../../core/services/auth.service';
import { User } from '../../../../shared/models/auth.model';
import { ForgotPasswordDialogComponent } from '../../../auth/components/forgot-password-dialog/forgot-password-dialog.component';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    SharedModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatDividerModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
    ReactiveFormsModule,
    MatDialogModule
  ],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css']
})
export class SettingsComponent implements OnInit {
  currentUser: User | null = null;
  settingsForm: FormGroup;
  notificationForm: FormGroup;
  loading = false;

  constructor(
    private readonly authService: AuthService,
    private readonly formBuilder: FormBuilder,
    private readonly dialog: MatDialog
  ) {
    this.settingsForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      language: ['en', Validators.required],
      timezone: ['UTC', Validators.required]
    });

    this.notificationForm = this.formBuilder.group({
      emailNotifications: [true],
      pushNotifications: [false],
      taskReminders: [true],
      projectUpdates: [true]
    });
  }

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      if (user) {
        this.settingsForm.patchValue({
          email: user.email,
          language: 'en',
          timezone: 'UTC'
        });
      }
    });
  }

  onSaveSettings(): void {
    if (this.settingsForm.valid) {
      this.loading = true;
      // TODO: Implement settings save logic
      setTimeout(() => {
        this.loading = false;
        alert('Settings saved successfully!');
      }, 1000);
    }
  }

  onSaveNotifications(): void {
    this.loading = true;
    // TODO: Implement notification preferences save logic
    setTimeout(() => {
      this.loading = false;
      alert('Notification preferences saved successfully!');
    }, 1000);
  }

  get userDisplayName(): string {
    return this.currentUser?.username || 'User';
  }

  get userRole(): string {
    return this.currentUser?.role || '';
  }

  /**
   * Open forgot password dialog with current user's email pre-filled
   */
  openChangePasswordDialog(): void {
    const dialogRef = this.dialog.open(ForgotPasswordDialogComponent, {
      width: '500px',
      data: {
        email: this.currentUser?.email || ''
      }
    });

    dialogRef.afterClosed().subscribe(() => {
      // Dialog closed, no action needed
    });
  }
}


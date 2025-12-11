import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { SharedModule } from '../../../../shared/shared.module';
import { AuthService } from '../../../../core/services/auth.service';
import { UserRole } from '../../../../shared/models/user-role.enum';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, SharedModule, MatButtonModule, MatCardModule, MatIconModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
})
export class DashboardComponent {
  constructor(
    private readonly authService: AuthService,
    private readonly router: Router
  ) {}

  get isSystemAdmin(): boolean {
    return this.authService.isSystemAdmin();
  }

  navigateToAddUser(userRole: UserRole): void {
    this.router.navigate(['/register'], { queryParams: { userRole: userRole } });
  }
  
  userRole = UserRole; // Expose enum to template
}

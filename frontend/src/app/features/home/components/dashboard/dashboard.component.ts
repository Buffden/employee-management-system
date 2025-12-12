import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { SharedModule } from '../../../../shared/shared.module';
import { AuthService } from '../../../../core/services/auth.service';
import { UserRole } from '../../../../shared/models/user-role.enum';
import { OverlayDialogComponent } from '../../../../shared/components/overlay-dialog/overlay-dialog.component';
import { DialogData, overlayType } from '../../../../shared/models/dialog';
import { FormMode } from '../../../../shared/models/table';
import { defaultTableConfig } from '../../../../shared/components/table/table.config';
import { LocationService } from '../../../locations/services/location.service';
import { Location } from '../../../../shared/models/location.model';
import { filter } from 'rxjs';

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
    private readonly router: Router,
    private readonly matDialog: MatDialog,
    private readonly locationService: LocationService
  ) {}

  get isSystemAdmin(): boolean {
    return this.authService.isSystemAdmin();
  }

  get isHRManager(): boolean {
    return this.authService.isHRManager();
  }

  get canManageLocations(): boolean {
    return this.isSystemAdmin || this.isHRManager;
  }

  navigateToAddUser(userRole: UserRole): void {
    this.router.navigate(['/register'], { queryParams: { userRole: userRole } });
  }

  openAddLocationDialog(): void {
    const dialogRef: MatDialogRef<OverlayDialogComponent> = this.matDialog.open(OverlayDialogComponent, {
      width: '850px',
      data: {
        title: 'Add Location',
        content: {},
        viewController: overlayType.ADDLOCATION,
        config: {
          ...defaultTableConfig,
          mode: FormMode.ADD,
          additionCardTitle: 'Add Location'
        },
        returnToPage: 'dashboard' // Track where dialog was opened from
      } as DialogData
    });

    dialogRef.afterClosed().pipe(filter(result => !!result)).subscribe((isClosedWithData: DialogData) => {
      if (isClosedWithData?.content && 'id' in isClosedWithData.content) {
        // Location was successfully saved (has an ID)
        console.log('Location added from dashboard:', isClosedWithData.content);
        // Stay on dashboard - no navigation needed
        // Optionally show a success message
      }
    });
  }
  
  userRole = UserRole; // Expose enum to template
}

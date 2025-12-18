import { Component, OnInit, Input } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Location } from '../../../../shared/models/location.model';
import { Department } from '../../../../shared/models/department.model';
import { Employee } from '../../../../shared/models/employee.model';
import { LocationService } from '../../services/location.service';
import { DepartmentService } from '../../../departments/services/department.service';
import { EmployeeService } from '../../../employees/services/employee.service';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { OverlayDialogComponent } from '../../../../shared/components/overlay-dialog/overlay-dialog.component';
import { ConfirmationDialogComponent } from '../../../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { DialogData, overlayType } from '../../../../shared/models/dialog';
import { TableCellData, FormMode } from '../../../../shared/models/table';
import { filter } from 'rxjs/operators';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-location-details',
  templateUrl: './location-details.component.html',
  styleUrls: ['./location-details.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatMenuModule
  ]
})
export class LocationDetailsComponent implements OnInit {
  @Input() item: Location | null = null;

  location: Location | null = null;
  departments: Department[] = [];
  employees: Employee[] = [];
  displayedColumnsDepartments: string[] = ['name', 'departmentHeadName', 'budget', 'actions'];
  displayedColumnsEmployees: string[] = ['name', 'email', 'designation', 'actions'];

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly locationService: LocationService,
    private readonly departmentService: DepartmentService,
    private readonly employeeService: EmployeeService,
    private readonly matDialog: MatDialog,
    private readonly authService: AuthService
  ) {}

  ngOnInit(): void {
    const locationId = this.route.snapshot.paramMap.get('locationId') || this.route.snapshot.paramMap.get('id');
    if (locationId) {
      this.loadLocation(locationId);
    }
  }

  loadLocation(id: string): void {
    this.locationService.getLocation(id).subscribe(location => {
      this.location = location;
      // Load departments and employees for this location
      this.loadDepartments(id);
      this.loadEmployees(id);
    });
  }

  loadDepartments(locationId: string): void {
    // Get all departments and filter by location
    this.departmentService.getAllDepartments().subscribe(departments => {
      this.departments = departments.filter(dept => dept.locationId === locationId) || [];
    });
  }

  loadEmployees(locationId: string): void {
    // Search employees by location (if API supports it, otherwise filter client-side)
    this.employeeService.queryEmployees(0, 1000).subscribe(response => {
      // Filter employees by locationId if available
      this.employees = (response.content || []).filter(emp => emp.locationId === locationId) || [];
    });
  }

  onDepartmentClick(department: Department): void {
    if (department.id) {
      this.router.navigate(['/departments', department.id]);
    }
  }

  onEmployeeClick(employee: Employee): void {
    if (employee.id) {
      this.router.navigate(['/employees', employee.id]);
    }
  }

  onEditDepartment(department: Department): void {
    if (!department?.id || !this.canEditDepartment()) return;

    const dialogRef: MatDialogRef<OverlayDialogComponent> = this.matDialog.open(OverlayDialogComponent, {
      width: '850px',
      maxHeight: '90vh',
      data: {
        title: 'Edit Department',
        content: department as unknown as TableCellData,
        viewController: overlayType.EDITDEPARTMENT,
        config: {
          mode: FormMode.EDIT
        },
        returnToPage: 'locations'
      } as DialogData
    });

    dialogRef.afterClosed().pipe(
      filter(result => !!result && result?.content && ('id' in result.content || result.content.deleted))
    ).subscribe(() => {
      // Reload location, departments and employees after edit
      if (this.location?.id) {
        this.loadLocation(this.location.id);
      }
    });
  }

  onDeleteDepartment(department: Department): void {
    if (!department?.id || !this.canDeleteDepartment()) return;

    const departmentName = department.name || 'this department';
    const dialogRef = this.matDialog.open(ConfirmationDialogComponent, {
      width: '400px',
      data: {
        title: 'Delete Department',
        message: `Are you sure you want to delete "${departmentName}"?`,
        warning: 'This action cannot be undone.',
        confirmText: 'Delete',
        cancelText: 'Cancel'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && department.id) {
        this.departmentService.deleteDepartment(department.id).subscribe({
          next: () => {
            // Reload departments after delete
            if (this.location?.id) {
              this.loadLocation(this.location.id);
            }
          },
          error: (error) => {
            console.error('Error deleting department:', error);
            alert('Failed to delete department. Please try again.');
          }
        });
      }
    });
  }

  onEditEmployee(employee: Employee): void {
    if (!employee?.id || !this.canEditEmployee()) return;

    const dialogRef: MatDialogRef<OverlayDialogComponent> = this.matDialog.open(OverlayDialogComponent, {
      width: '850px',
      maxHeight: '90vh',
      data: {
        title: 'Edit Employee',
        content: employee as unknown as TableCellData,
        viewController: overlayType.EDITEMPLOYEE,
        config: {
          mode: FormMode.EDIT
        },
        returnToPage: 'locations'
      } as DialogData
    });

    dialogRef.afterClosed().pipe(
      filter(result => !!result && result?.content && ('id' in result.content || result.content.deleted))
    ).subscribe(() => {
      // Reload location and employees after edit
      if (this.location?.id) {
        this.loadLocation(this.location.id);
      }
    });
  }

  onDeleteEmployee(employee: Employee): void {
    if (!employee?.id || !this.canDeleteEmployee()) return;

    const employeeName = employee.firstName && employee.lastName 
      ? `${employee.firstName} ${employee.lastName}`
      : 'this employee';
    const dialogRef = this.matDialog.open(ConfirmationDialogComponent, {
      width: '400px',
      data: {
        title: 'Delete Employee',
        message: `Are you sure you want to delete "${employeeName}"?`,
        confirmText: 'Delete',
        cancelText: 'Cancel'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && employee.id) {
        this.employeeService.deleteEmployee(employee.id).subscribe({
          next: () => {
            // Reload employees after delete
            if (this.location?.id) {
              this.loadLocation(this.location.id);
            }
          },
          error: (error) => {
            console.error('Error deleting employee:', error);
            alert('Failed to delete employee. Please try again.');
          }
        });
      }
    });
  }

  canEditLocation(): boolean {
    return this.authService.isAdmin() || this.authService.isHRManager();
  }

  canDeleteLocation(): boolean {
    return this.authService.isAdmin() || this.authService.isHRManager();
  }

  canEditDepartment(): boolean {
    return this.authService.isAdmin() || this.authService.isHRManager();
  }

  canDeleteDepartment(): boolean {
    return this.authService.isAdmin() || this.authService.isHRManager();
  }

  canEditEmployee(): boolean {
    return this.authService.isAdmin() || this.authService.isHRManager();
  }

  canDeleteEmployee(): boolean {
    return this.authService.isAdmin() || this.authService.isHRManager();
  }

  onEditLocation(): void {
    if (!this.location || !this.canEditLocation()) return;

    const dialogRef: MatDialogRef<OverlayDialogComponent> = this.matDialog.open(OverlayDialogComponent, {
      width: '850px',
      maxHeight: '90vh',
      data: {
        title: 'Edit Location',
        content: this.location as unknown as TableCellData,
        viewController: overlayType.EDITLOCATION,
        config: {
          mode: FormMode.EDIT
        },
        returnToPage: 'locations'
      } as DialogData
    });

    dialogRef.afterClosed().pipe(
      filter(result => !!result && result?.content && 'id' in result.content)
    ).subscribe(() => {
      // Reload location data after edit
      if (this.location?.id) {
        this.loadLocation(this.location.id);
      }
    });
  }

  onDeleteLocation(): void {
    if (!this.location || !this.canDeleteLocation()) return;

    const locationName = this.location.name || 'this location';
    const dialogRef = this.matDialog.open(ConfirmationDialogComponent, {
      width: '400px',
      data: {
        title: 'Delete Location',
        message: `Are you sure you want to delete "${locationName}"?`,
        warning: 'This will affect all departments and employees associated with this location.',
        confirmText: 'Delete',
        cancelText: 'Cancel'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && this.location?.id) {
        this.locationService.deleteLocation(this.location.id).subscribe({
          next: () => {
            this.router.navigate(['/locations']);
          },
          error: (error) => {
            console.error('Error deleting location:', error);
            alert('Failed to delete location. Please try again.');
          }
        });
      }
    });
  }

  formatCurrency(value: number | null | undefined): string {
    if (value === null || value === undefined) return 'Not set';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  }

  formatDate(date: string | null | undefined): string {
    if (!date) return 'Not set';
    return new Date(date).toLocaleDateString();
  }
}


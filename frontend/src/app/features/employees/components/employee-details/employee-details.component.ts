import { Component, OnInit, Input } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Employee } from '../../../../shared/models/employee.model';
import { Department } from '../../../../shared/models/department.model';
import { Location } from '../../../../shared/models/location.model';
import { EmployeeService } from '../../services/employee.service';
import { DepartmentService } from '../../../departments/services/department.service';
import { LocationService } from '../../../locations/services/location.service';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
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
  selector: 'app-employee-details',
  templateUrl: './employee-details.component.html',
  styleUrls: ['./employee-details.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule
  ]
})
export class EmployeeDetailsComponent implements OnInit {
  @Input() item: Employee | null = null;

  employee: Employee | null = null;
  department: Department | null = null;
  location: Location | null = null;
  manager: Employee | null = null;
  loading = true;
  errorMessage: string | null = null;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly employeeService: EmployeeService,
    private readonly departmentService: DepartmentService,
    private readonly locationService: LocationService,
    private readonly matDialog: MatDialog,
    private readonly authService: AuthService
  ) {}

  ngOnInit(): void {
    const employeeId = this.route.snapshot.paramMap.get('employeeId') || this.route.snapshot.paramMap.get('id');
    if (employeeId) {
      this.loadEmployee(employeeId);
    }
  }

  loadEmployee(id: string): void {
    this.loading = true;
    this.errorMessage = null;
    this.employeeService.getEmployeeById(id).subscribe({
      next: (employee) => {
        this.employee = employee;
        this.loading = false;
        // Load related entities
        if (employee.departmentId) {
          this.loadDepartment(employee.departmentId);
        }
        if (employee.locationId) {
          this.loadLocation(employee.locationId);
        }
        if (employee.managerId) {
          this.loadManager(employee.managerId);
        }
      },
      error: (error) => {
        console.error('Error loading employee:', error);
        this.loading = false;
        if (error.status === 404) {
          this.errorMessage = 'Employee not found.';
        } else if (error.status === 403) {
          this.errorMessage = 'You do not have permission to view this employee.';
        } else {
          this.errorMessage = 'Failed to load employee details. Please try again.';
        }
      }
    });
  }

  loadDepartment(departmentId: string): void {
    this.departmentService.getDepartmentById(departmentId).subscribe(department => {
      this.department = department;
    });
  }

  loadLocation(locationId: string): void {
    this.locationService.getLocation(locationId).subscribe(location => {
      this.location = location;
    });
  }

  loadManager(managerId: string): void {
    this.employeeService.getEmployeeById(managerId).subscribe(manager => {
      this.manager = manager;
    });
  }


  canEditEmployee(): boolean {
    return this.authService.isAdmin() || this.authService.isHRManager();
  }

  canDeleteEmployee(): boolean {
    return this.authService.isAdmin() || this.authService.isHRManager();
  }

  onEditEmployee(): void {
    if (!this.employee || !this.canEditEmployee()) return;

    const dialogRef: MatDialogRef<OverlayDialogComponent> = this.matDialog.open(OverlayDialogComponent, {
      width: '850px',
      maxHeight: '90vh',
      data: {
        title: 'Edit Employee',
        content: this.employee as unknown as TableCellData,
        viewController: overlayType.EDITEMPLOYEE,
        config: {
          mode: FormMode.EDIT
        },
        returnToPage: 'employees'
      } as DialogData
    });

    dialogRef.afterClosed().pipe(
      filter(result => !!result && result?.content && 'id' in result.content)
    ).subscribe(() => {
      // Reload employee data after edit
      if (this.employee?.id) {
        this.loadEmployee(this.employee.id);
      }
    });
  }

  onDeleteEmployee(): void {
    if (!this.employee || !this.canDeleteEmployee()) return;

    const employeeName = this.employee.firstName && this.employee.lastName 
      ? `${this.employee.firstName} ${this.employee.lastName}`
      : 'this employee';
    const dialogRef = this.matDialog.open(ConfirmationDialogComponent, {
      width: '400px',
      data: {
        title: 'Delete Employee',
        message: `Are you sure you want to delete "${employeeName}"?`,
        warning: 'This action cannot be undone.',
        confirmText: 'Delete',
        cancelText: 'Cancel'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && this.employee?.id) {
        this.employeeService.deleteEmployee(this.employee.id).subscribe({
          next: () => {
            this.router.navigate(['/employees']);
          },
          error: (error) => {
            console.error('Error deleting employee:', error);
            alert('Failed to delete employee. Please try again.');
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


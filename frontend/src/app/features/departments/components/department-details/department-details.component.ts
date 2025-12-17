import { Component, OnInit, Input } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Department } from '../../../../shared/models/department.model';
import { Employee } from '../../../../shared/models/employee.model';
import { DepartmentService } from '../../services/department.service';
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
  selector: 'app-department-details',
  templateUrl: './department-details.component.html',
  styleUrls: ['./department-details.component.scss'],
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
export class DepartmentDetailsComponent implements OnInit {
  @Input() item: Department | null = null;

  department: Department | null = null;
  employees: Employee[] = [];
  displayedColumns: string[] = [
    'name',
    'email',
    'designation',
    'salary',
    'joiningDate',
    'actions'
  ];

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly departmentService: DepartmentService,
    private readonly employeeService: EmployeeService,
    private readonly matDialog: MatDialog,
    private readonly authService: AuthService
  ) {}

  ngOnInit(): void {
    const departmentId = this.route.snapshot.paramMap.get('departmentId') || this.route.snapshot.paramMap.get('id');
    if (departmentId) {
      this.loadDepartment(departmentId);
    }
  }

  loadDepartment(id: string): void {
    this.departmentService.getDepartmentById(id).subscribe(department => {
      this.department = department;
      // Load employees for this department
      this.loadEmployees(id);
    });
  }

  loadEmployees(departmentId: string): void {
    this.employeeService.getEmployeesByDepartment(departmentId).subscribe(employees => {
      this.employees = employees || [];
    });
  }

  onEmployeeClick(): void {
    // Navigate to employee list for now
    // TODO: Add employee detail route when available and pass employee ID
    this.router.navigate(['/employees']);
  }

  onEditEmployee(employee: Employee): void {
    if (!employee?.id) return;

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
        returnToPage: 'departments'
      } as DialogData
    });

    dialogRef.afterClosed().pipe(
      filter(result => !!result && result?.content && ('id' in result.content || result.content.deleted))
    ).subscribe(() => {
      // Reload department and employees after edit
      if (this.department?.id) {
        this.loadDepartment(this.department.id);
      }
    });
  }

  onDeleteEmployee(employee: Employee): void {
    const employeeName = employee.firstName && employee.lastName 
      ? `${employee.firstName} ${employee.lastName}`
      : 'this employee';
    const dialogRef = this.matDialog.open(ConfirmationDialogComponent, {
      width: '400px',
      data: {
        title: 'Delete Employee',
        message: `Are you sure you want to delete '${employeeName}'?`,
        confirmText: 'Delete',
        cancelText: 'Cancel'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && employee.id) {
        this.employeeService.deleteEmployee(employee.id).subscribe({
          next: () => {
            // Reload department and employees after delete
            if (this.department?.id) {
              this.loadDepartment(this.department.id);
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

  onEditDepartment(): void {
    if (!this.department || !this.canEditDepartment()) return;

    const dialogRef: MatDialogRef<OverlayDialogComponent> = this.matDialog.open(OverlayDialogComponent, {
      width: '850px',
      maxHeight: '90vh',
      data: {
        title: 'Edit Department',
        content: this.department as unknown as TableCellData,
        viewController: overlayType.EDITDEPARTMENT,
        config: {
          mode: FormMode.EDIT
        },
        returnToPage: 'departments'
      } as DialogData
    });

    dialogRef.afterClosed().pipe(
      filter(result => !!result && result?.content && 'id' in result.content)
    ).subscribe(() => {
      // Reload department data after edit
      if (this.department?.id) {
        this.loadDepartment(this.department.id);
      }
    });
  }

  onDeleteDepartment(): void {
    if (!this.department || !this.canDeleteDepartment()) return;

    const departmentName = this.department.name || 'this department';
    const dialogRef = this.matDialog.open(ConfirmationDialogComponent, {
      width: '400px',
      data: {
        title: 'Delete Department',
        message: `Are you sure you want to delete "${departmentName}"? This action cannot be undone.`,
        warning: 'This will affect all employees and projects associated with this department.',
        confirmText: 'Delete',
        cancelText: 'Cancel'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && this.department?.id) {
        this.departmentService.deleteDepartment(this.department.id).subscribe({
          next: () => {
            this.router.navigate(['/departments']);
          },
          error: (error) => {
            console.error('Error deleting department:', error);
            alert('Failed to delete department. Please try again.');
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


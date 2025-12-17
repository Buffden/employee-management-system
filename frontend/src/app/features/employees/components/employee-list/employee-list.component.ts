import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../../../../shared/shared.module';
import { TableComponent } from '../../../../shared/components/table/table.component';
import { TableCellData, FormMode } from '../../../../shared/models/table';
import { PageEvent } from '@angular/material/paginator';
import { EmployeeService } from '../../services/employee.service';
import { employeeListConfig } from './employee-list.config';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Employee } from '../../../../shared/models/employee.model';
import { PaginatedResponse, FilterOption } from '../../../../shared/models/paginated-response.model';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { OverlayDialogComponent } from '../../../../shared/components/overlay-dialog/overlay-dialog.component';
import { DialogData, overlayType } from '../../../../shared/models/dialog';
import { AuthService } from '../../../../core/services/auth.service';
import { filter } from 'rxjs';
import { take } from 'rxjs/operators';
import { ConfirmationDialogComponent } from '../../../../shared/components/confirmation-dialog/confirmation-dialog.component';

@Component({
  selector: 'app-employee-list',
  standalone: true,
  imports: [CommonModule, SharedModule, TableComponent],
  providers: [EmployeeService, HttpClient],
  templateUrl: './employee-list.component.html',
  styleUrls: ['./employee-list.component.css'],
})
export class EmployeeListComponent implements OnInit, OnDestroy {
  employees: Employee[] = [];
  tableData: TableCellData[] = [];
  tableConfig = employeeListConfig;
  currentPage = 0;
  pageSize = 10;
  totalElements = 0;
  totalPages = 0;
  currentSortColumn = '';
  currentSortDirection = 'ASC';
  filters: Record<string, FilterOption[]> = {}; // Store filters from paginated response
  loading = false; // Loading state for table spinner
  private isRefreshing = false; // Guard to prevent duplicate refresh calls
  private employeeAddedHandler?: () => void; // Store handler reference for cleanup

  // Custom handler for employee name click - navigates to employee details page
  onEmployeeNameClick = (row: TableCellData, colKey: string) => {
    if ((colKey === 'firstName' || colKey === 'lastName' || colKey === 'name') && row.id) {
      this.router.navigate(['/employees', row.id]);
    }
  };

  constructor(
    private readonly employeeService: EmployeeService,
    private readonly router: Router,
    private readonly matDialog: MatDialog,
    private readonly authService: AuthService
  ) {}

  ngOnInit(): void {
    // Enable action buttons for admins and HR managers
    this.tableConfig.displayActionButtons = this.canEditEmployee();
    
    // Load with default sort from config
    if (this.tableConfig.defaultSortColumn) {
      this.currentSortColumn = this.tableConfig.defaultSortColumn;
      this.currentSortDirection = this.tableConfig.defaultSortDirection === 'desc' ? 'DESC' : 'ASC';
    }
    this.loadEmployees(this.currentPage, this.pageSize, this.currentSortColumn, this.currentSortDirection);
    
    // Listen only for add operations from table component (edit/delete handled by afterClosed())
    // Store handler reference so we can remove it later
    this.employeeAddedHandler = () => {
      this.loadEmployees(this.currentPage, this.pageSize, this.currentSortColumn, this.currentSortDirection);
    };
    
    globalThis.window.addEventListener('employeeAdded', this.employeeAddedHandler);
  }

  ngOnDestroy(): void {
    // Clean up event listener to prevent memory leaks and duplicate calls
    if (this.employeeAddedHandler) {
      globalThis.window.removeEventListener('employeeAdded', this.employeeAddedHandler);
      this.employeeAddedHandler = undefined;
    }
  }

  canEditEmployee(): boolean {
    return this.authService.isAdmin() || this.authService.isHRManager();
  }

  openEditDialog(employee: Employee): void {
    const dialogRef: MatDialogRef<OverlayDialogComponent> = this.matDialog.open(OverlayDialogComponent, {
      width: '850px',
      maxHeight: '90vh',
      data: {
        title: this.tableConfig.editCardTitle,
        content: employee,
        viewController: overlayType.EDITEMPLOYEE,
        config: {
          ...this.tableConfig,
          mode: FormMode.EDIT
        },
        returnToPage: 'employees',
        filters: this.filters // Pass filters to form component (e.g., departments, locations for employee form)
      } as DialogData
    });

    // Use take(1) to ensure the subscription only fires once
    dialogRef.afterClosed().pipe(
      filter(result => !!result && result?.content && 'id' in result.content),
      take(1)
    ).subscribe(() => {
      // Guard to prevent duplicate refresh calls
      if (this.isRefreshing) {
        return;
      }
      this.isRefreshing = true;
      
      // Refresh the employee list after update or delete
      this.loadEmployees(this.currentPage, this.pageSize, this.currentSortColumn, this.currentSortDirection);
      
      // Reset flag after a short delay to allow the refresh to complete
      setTimeout(() => {
        this.isRefreshing = false;
      }, 500);
    });
  }

  openViewDialog(employee: Employee): void {
    this.matDialog.open(OverlayDialogComponent, {
      width: '850px',
      maxHeight: '90vh',
      data: {
        title: this.tableConfig.detailsCardTitle,
        content: employee,
        viewController: overlayType.DISPLAYEMPLOYEE,
        config: this.tableConfig,
        filters: this.filters
      } as DialogData
    });
  }

  openDeleteDialog(employee: Employee): void {
    const employeeName = employee.firstName && employee.lastName 
      ? `${employee.firstName} ${employee.lastName}` 
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

    dialogRef.afterClosed().pipe(take(1)).subscribe(result => {
      if (result && employee.id) {
        this.employeeService.deleteEmployee(employee.id).subscribe({
          next: () => {
            this.loadEmployees(this.currentPage, this.pageSize, this.currentSortColumn, this.currentSortDirection);
          },
          error: (error: unknown) => {
            console.error('Error deleting employee:', error);
            alert('Failed to delete employee. Please try again.');
          }
        });
      }
    });
  }

  // Handler methods for table component
  onEditAction = (row: TableCellData): void => {
    const employee = row as unknown as Employee;
    this.openEditDialog(employee);
  }

  onDeleteAction = (row: TableCellData): void => {
    const employee = row as unknown as Employee;
    this.openDeleteDialog(employee);
  }

  loadEmployees(page = 0, size = 10, sortBy?: string, sortDir = 'ASC'): void {
    this.loading = true;
    this.employeeService.queryEmployees(page, size, sortBy, sortDir).subscribe({
      next: (response: PaginatedResponse<Employee>) => {
        this.employees = response.content || [];
        this.currentPage = response.page;
        this.pageSize = response.size;
        this.totalElements = response.totalElements;
        this.totalPages = response.totalPages;
        
        // Extract and store filters from response
        if (response.filters) {
          this.filters = response.filters;
        }
        
        // Map employees to table data format
        this.tableData = this.employees.map(emp => ({
          ...emp,
          name: `${emp.firstName} ${emp.lastName}`,
          email: emp.email || '',
          phone: emp.phone || '',
          address: emp.address || '',
          designation: emp.designation || '',
          salary: emp.salary || 0,
          joiningDate: emp.joiningDate || '',
          locationName: emp.locationName || '',
          departmentName: emp.departmentName || '',
          managerName: emp.managerName || '',
          performanceRating: emp.performanceRating || 0,
          workLocation: emp.workLocation || '',
          experienceYears: emp.experienceYears || 0
        }));
        this.loading = false;
      },
      error: () => {
        // Error handling - error details are already logged by the service
        this.loading = false;
      }
    });
  }

  onPageChange(pageEvent: PageEvent): void {
    // Reset to first page if page size changed
    const pageSizeChanged = this.pageSize !== pageEvent.pageSize;
    this.currentPage = pageSizeChanged ? 0 : pageEvent.pageIndex;
    this.pageSize = pageEvent.pageSize;
    this.loadEmployees(this.currentPage, this.pageSize, this.currentSortColumn, this.currentSortDirection);
  }

  onSortChange(sortEvent: { active: string; direction: string }): void {
    this.currentSortColumn = sortEvent.active;
    this.currentSortDirection = sortEvent.direction === 'ASC' || sortEvent.direction === 'asc' ? 'ASC' : 'DESC';
    // Reset to first page when sorting changes
    this.currentPage = 0;
    this.loadEmployees(this.currentPage, this.pageSize, this.currentSortColumn, this.currentSortDirection);
  }

  onDeleteSuccess(): void {
    // Refresh the employee list after successful delete
    this.loadEmployees(this.currentPage, this.pageSize, this.currentSortColumn, this.currentSortDirection);
  }
}

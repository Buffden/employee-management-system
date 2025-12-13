import { Component, OnInit } from '@angular/core';
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

@Component({
  selector: 'app-employee-list',
  standalone: true,
  imports: [CommonModule, SharedModule, TableComponent],
  providers: [EmployeeService, HttpClient],
  templateUrl: './employee-list.component.html',
  styleUrls: ['./employee-list.component.css'],
})
export class EmployeeListComponent implements OnInit {
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

  // Custom handler for employee name click - opens edit dialog
  onEmployeeNameClick = (row: TableCellData, colKey: string) => {
    if (colKey === 'firstName' || colKey === 'lastName' || colKey === 'name') {
      // Check if user has permission to edit (HR Manager or Admin)
      if (this.canEditEmployee()) {
        this.openEditDialog(row as Employee);
      } else {
        // If no edit permission, just show details view
        this.openViewDialog(row as Employee);
      }
    }
  };

  constructor(
    private readonly employeeService: EmployeeService,
    private readonly router: Router,
    private readonly matDialog: MatDialog,
    private readonly authService: AuthService
  ) {}

  ngOnInit(): void {
    // Load with default sort from config
    if (this.tableConfig.defaultSortColumn) {
      this.currentSortColumn = this.tableConfig.defaultSortColumn;
      this.currentSortDirection = this.tableConfig.defaultSortDirection || 'ASC';
    }
    this.loadEmployees(this.currentPage, this.pageSize, this.currentSortColumn, this.currentSortDirection);
    
    // Listen for employee added/updated/deleted events
    globalThis.window.addEventListener('employeeAdded', () => this.loadEmployees(this.currentPage, this.pageSize, this.currentSortColumn, this.currentSortDirection));
    globalThis.window.addEventListener('employeeUpdated', () => this.loadEmployees(this.currentPage, this.pageSize, this.currentSortColumn, this.currentSortDirection));
    globalThis.window.addEventListener('employeeDeleted', () => this.loadEmployees(this.currentPage, this.pageSize, this.currentSortColumn, this.currentSortDirection));
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

    dialogRef.afterClosed().pipe(filter(result => !!result)).subscribe((result: DialogData) => {
      if (result?.content && 'id' in result.content) {
        // Refresh the employee list after update or delete
        this.loadEmployees(this.currentPage, this.pageSize, this.currentSortColumn, this.currentSortDirection);
      }
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

  loadEmployees(page = 0, size = 10, sortBy?: string, sortDir = 'ASC'): void {
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
      },
      error: () => {
        // Error handling - error details are already logged by the service
      }
    });
  }

  onPageChange(pageEvent: PageEvent): void {
    this.currentPage = pageEvent.pageIndex;
    this.pageSize = pageEvent.pageSize;
    this.loadEmployees(this.currentPage, this.pageSize, this.currentSortColumn, this.currentSortDirection);
  }

  onSortChange(sortEvent: { active: string; direction: string }): void {
    this.currentSortColumn = sortEvent.active;
    this.currentSortDirection = sortEvent.direction;
    // Reset to first page when sorting changes
    this.currentPage = 0;
    this.loadEmployees(this.currentPage, this.pageSize, this.currentSortColumn, this.currentSortDirection);
  }

  onDeleteSuccess(): void {
    // Refresh the employee list after successful delete
    this.loadEmployees(this.currentPage, this.pageSize, this.currentSortColumn, this.currentSortDirection);
  }
}

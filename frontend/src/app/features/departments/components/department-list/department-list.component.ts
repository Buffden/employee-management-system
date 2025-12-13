import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../../../../shared/shared.module';
import { TableComponent } from '../../../../shared/components/table/table.component';
import { TableCellData, FormMode } from '../../../../shared/models/table';
import { DepartmentService } from '../../services/department.service';
import { departmentListConfig } from './department-list.config';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Department } from '../../../../shared/models/department.model';
import { PaginatedResponse, FilterOption } from '../../../../shared/models/paginated-response.model';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { OverlayDialogComponent } from '../../../../shared/components/overlay-dialog/overlay-dialog.component';
import { DialogData, overlayType } from '../../../../shared/models/dialog';
import { AuthService } from '../../../../core/services/auth.service';
import { filter } from 'rxjs';

@Component({
  selector: 'app-department-list',
  standalone: true,
  imports: [CommonModule, SharedModule, TableComponent],
  providers: [DepartmentService, HttpClient],
  templateUrl: './department-list.component.html',
  styleUrls: ['./department-list.component.css'],
})
export class DepartmentListComponent implements OnInit {
  departments: Department[] = [];
  tableData: TableCellData[] = [];
  tableConfig = departmentListConfig;
  currentPage = 0;
  pageSize = 10;
  totalElements = 0;
  totalPages = 0;
  filters: Record<string, FilterOption[]> = {}; // Store filters from paginated response

  // Custom handler for department name click - opens edit dialog
  onDepartmentNameClick = (row: TableCellData, colKey: string) => {
    if (colKey === 'name') {
      // Check if user has permission to edit (HR Manager or Admin)
      if (this.canEditDepartment()) {
        this.openEditDialog(row as Department);
      } else {
        // If no edit permission, just show details view
        this.openViewDialog(row as Department);
      }
    }
  };

  constructor(
    private readonly departmentService: DepartmentService,
    private readonly router: Router,
    private readonly matDialog: MatDialog,
    private readonly authService: AuthService
  ) {}

  canEditDepartment(): boolean {
    return this.authService.isAdmin() || this.authService.isHRManager();
  }

  openEditDialog(department: Department): void {
    const dialogRef: MatDialogRef<OverlayDialogComponent> = this.matDialog.open(OverlayDialogComponent, {
      width: '850px',
      data: {
        title: this.tableConfig.editCardTitle,
        content: department,
        viewController: overlayType.EDITDEPARTMENT,
        config: {
          ...this.tableConfig,
          mode: FormMode.EDIT
        },
        returnToPage: 'departments',
        filters: this.filters // Pass filters to form component (e.g., locations for department form)
      } as DialogData
    });

    dialogRef.afterClosed().pipe(filter(result => !!result)).subscribe((result: DialogData) => {
      if (result?.content && 'id' in result.content) {
        const dept = result.content as Department & { deleted?: boolean };
        // Check if department was deleted
        if (dept.deleted) {
          console.log('Department deleted:', dept.id);
        } else {
          console.log('Department updated:', result.content);
        }
        // Refresh the department list after update or delete
        this.loadDepartments(this.currentPage, this.pageSize);
      }
    });
  }

  openViewDialog(department: Department): void {
    this.matDialog.open(OverlayDialogComponent, {
      width: '850px',
      data: {
        title: this.tableConfig.detailsCardTitle,
        content: department,
        viewController: overlayType.DISPLAYDEPARTMENT,
        config: this.tableConfig
      } as DialogData
    });
  }

  ngOnInit(): void {
    // Load with default sort from config
    const defaultSortColumn = this.tableConfig.defaultSortColumn;
    const defaultSortDir = this.tableConfig.defaultSortDirection === 'desc' ? 'DESC' : 'ASC';
    this.loadDepartments(0, this.pageSize, defaultSortColumn, defaultSortDir);
    
    // Listen for department added event to refresh the list
    globalThis.window.addEventListener('departmentAdded', () => {
      this.loadDepartments(this.currentPage, this.pageSize);
    });
    // Listen for department deleted event to refresh the list
    globalThis.window.addEventListener('departmentDeleted', () => {
      this.loadDepartments(this.currentPage, this.pageSize);
    });
  }

  loadDepartments(page = 0, size = 10, sortBy?: string, sortDir = 'ASC'): void {
    this.departmentService.queryDepartments(page, size, sortBy, sortDir).subscribe({
      next: (response: PaginatedResponse<Department>) => {
        console.log('Department query response:', response);
        this.departments = response.content || [];
        this.currentPage = response.page || 0;
        this.pageSize = response.size || 10;
        this.totalElements = response.totalElements || 0;
        this.totalPages = response.totalPages || 0;
        
        // Extract filters from response (e.g., locations for dropdown/filtering)
        if (response.filters) {
          this.filters = response.filters;
          console.log('Available filters:', this.filters);
          // Store filters to pass to form component (avoids redundant API calls)
        }
        
        this.tableData = this.departments?.map(dept => ({
          ...dept,
          name: dept.name,
          description: dept.description || '',
          locationName: dept.locationName || '',
          locationId: dept.locationId || '',
          createdAt: dept.createdAt || '',
          budget: dept.budget || 0,
          budgetUtilization: dept.budgetUtilization || 0,
          performanceMetric: dept.performanceMetric || 0,
          departmentHeadId: dept.departmentHeadId || ''
        }));
        
        console.log('Loaded departments:', this.departments.length, 'Total:', this.totalElements);
      },
      error: (error) => {
        console.error('Error loading departments:', error);
        console.error('Error details:', error.error);
      }
    });
  }

  onSortChange(event: { active: string; direction: string }): void {
    const sortDir = event.direction === 'ASC' || event.direction === 'asc' ? 'ASC' : 'DESC';
    this.loadDepartments(this.currentPage, this.pageSize, event.active, sortDir);
  }

  onPageChange(event: { pageIndex: number; pageSize: number }): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadDepartments(this.currentPage, this.pageSize);
  }
}

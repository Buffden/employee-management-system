import { Component, OnInit, OnDestroy } from '@angular/core';
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
import { filter, take } from 'rxjs/operators';

@Component({
  selector: 'app-department-list',
  standalone: true,
  imports: [CommonModule, SharedModule, TableComponent],
  providers: [DepartmentService, HttpClient],
  templateUrl: './department-list.component.html',
  styleUrls: ['./department-list.component.css'],
})
export class DepartmentListComponent implements OnInit, OnDestroy {
  departments: Department[] = [];
  tableData: TableCellData[] = [];
  tableConfig = departmentListConfig;
  currentPage = 0;
  pageSize = 10;
  totalElements = 0;
  totalPages = 0;
  currentSortColumn = '';
  currentSortDirection = 'ASC';
  filters: Record<string, FilterOption[]> = {}; // Store filters from paginated response
  private isRefreshing = false; // Guard to prevent duplicate refresh calls
  private departmentAddedHandler?: () => void; // Store handler reference for cleanup

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
      
      // Refresh the department list after update or delete
      this.loadDepartments(this.currentPage, this.pageSize, this.currentSortColumn, this.currentSortDirection);
      
      // Reset flag after a short delay to allow the refresh to complete
      setTimeout(() => {
        this.isRefreshing = false;
      }, 500);
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
    if (this.tableConfig.defaultSortColumn) {
      this.currentSortColumn = this.tableConfig.defaultSortColumn;
      this.currentSortDirection = this.tableConfig.defaultSortDirection === 'desc' ? 'DESC' : 'ASC';
    }
    this.loadDepartments(0, this.pageSize, this.currentSortColumn, this.currentSortDirection);
    
    // Listen only for add operations from table component (edit/delete handled by afterClosed())
    // Store handler reference so we can remove it later
    this.departmentAddedHandler = () => {
      this.loadDepartments(this.currentPage, this.pageSize, this.currentSortColumn, this.currentSortDirection);
    };
    
    globalThis.window.addEventListener('departmentAdded', this.departmentAddedHandler);
  }

  ngOnDestroy(): void {
    // Clean up event listener to prevent memory leaks and duplicate calls
    if (this.departmentAddedHandler) {
      globalThis.window.removeEventListener('departmentAdded', this.departmentAddedHandler);
      this.departmentAddedHandler = undefined;
    }
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
      },
      error: () => {
        // Error handled by global error handler or service
      }
    });
  }

  onSortChange(event: { active: string; direction: string }): void {
    this.currentSortColumn = event.active;
    this.currentSortDirection = event.direction === 'ASC' || event.direction === 'asc' ? 'ASC' : 'DESC';
    // Reset to first page when sorting changes
    this.currentPage = 0;
    this.loadDepartments(this.currentPage, this.pageSize, this.currentSortColumn, this.currentSortDirection);
  }

  onPageChange(event: { pageIndex: number; pageSize: number }): void {
    // Reset to first page if page size changed
    const pageSizeChanged = this.pageSize !== event.pageSize;
    this.currentPage = pageSizeChanged ? 0 : event.pageIndex;
    this.pageSize = event.pageSize;
    // Use current sort settings when loading
    this.loadDepartments(this.currentPage, this.pageSize, this.currentSortColumn, this.currentSortDirection);
  }
}

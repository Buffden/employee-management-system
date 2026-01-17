import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { filter, take } from 'rxjs/operators';

import { SharedModule } from '../../../../shared/shared.module';
import { TableComponent } from '../../../../shared/components/table/table.component';
import { OverlayDialogComponent } from '../../../../shared/components/overlay-dialog/overlay-dialog.component';
import { ConfirmationDialogComponent } from '../../../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { TableCellData, FormMode, ColumnType } from '../../../../shared/models/table';
import { Department } from '../../../../shared/models/department.model';
import { DepartmentService } from '../../services/department.service';
import { departmentListConfig } from './department-list.config';
import { DialogData, overlayType } from '../../../../shared/models/dialog';
import { AuthService } from '../../../../core/services/auth.service';
import { PaginatedResponse, FilterOption } from '../../../../shared/models/paginated-response.model';
import { ActiveFilters, FilterEvent, RemoveFilterEvent } from '../../../../shared/types/filter';

@Component({
  selector: 'app-department-list',
  standalone: true,
  imports: [CommonModule, SharedModule, TableComponent, FormsModule],
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
  filters: Record<string, FilterOption[]> = {};
  activeFilters: ActiveFilters[] = [];
  loading = false;
  private isRefreshing = false;
  private departmentAddedHandler?: () => void;
  onDepartmentNameClick = (row: TableCellData, colKey: string): void => {
    const column = this.tableConfig.columns.find(col => col.key === colKey);
    if (column && column.type === ColumnType.LINK && column.navigationTarget && column.navigationIdKey) {
      const rowData = row as unknown as Record<string, unknown>;
      const navigationId = rowData[column.navigationIdKey] as string | undefined;
      if (navigationId) {
        this.router.navigate([`/${column.navigationTarget}s`, navigationId]);
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

  ngOnInit(): void {
    this.tableConfig.displayActionButtons = this.canEditDepartment();
    if (this.tableConfig.defaultSortColumn) {
      this.currentSortColumn = this.tableConfig.defaultSortColumn;
      this.currentSortDirection = this.tableConfig.defaultSortDirection === 'desc' ? 'DESC' : 'ASC';
    }
    this.loadDepartments(this.currentPage, this.pageSize, this.currentSortColumn, this.currentSortDirection);
    this.departmentAddedHandler = () => {
      this.loadDepartments(this.currentPage, this.pageSize, this.currentSortColumn, this.currentSortDirection);
    };
    globalThis.window.addEventListener('departmentAdded', this.departmentAddedHandler);
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
        filters: this.filters
      } as DialogData
    });

    dialogRef.afterClosed()
      .pipe(
        filter(result => !!result && result?.content && 'id' in result.content),
        take(1)
      )
      .subscribe(() => {
        if (this.isRefreshing) {
          return;
        }
        this.isRefreshing = true;
        this.loadDepartments(this.currentPage, this.pageSize, this.currentSortColumn, this.currentSortDirection);

        setTimeout(() => {
          this.isRefreshing = false;
        }, 500);
      });
  }

  ngOnDestroy(): void {
    if (this.departmentAddedHandler) {
      globalThis.window.removeEventListener('departmentAdded', this.departmentAddedHandler);
      this.departmentAddedHandler = undefined;
    }
  }

  loadDepartments(page = 0, size = 10, sortBy?: string, sortDir = 'ASC'): void {
    this.loading = true;

    this.departmentService.queryDepartments(page, size, sortBy, sortDir, this.activeFilters).subscribe({
      next: (response: PaginatedResponse<Department>) => {
        this.departments = response.content || [];
        this.currentPage = response.page || 0;
        this.pageSize = response.size || 10;
        this.totalElements = response.totalElements || 0;
        this.totalPages = response.totalPages || 0;

        if (response.filters) {
          this.filters = response.filters;
        }

        this.tableData = this.departments?.map(dept => ({
          ...dept,
          id: dept.id,
          name: dept.name,
          description: dept.description || '',
          locationName: dept.locationName || '',
          locationId: dept.locationId || '',
          createdAt: dept.createdAt || '',
          budget: dept.budget || 0,
          budgetUtilization: dept.budgetUtilization || 0,
          performanceMetric: dept.performanceMetric || 0,
          departmentHeadId: dept.departmentHeadId || '',
          departmentHeadName: dept.departmentHeadName || 'Not assigned',
          startDate: '',
          endDate: '',
          status: '',
          projectManager: '',
          totalEmployees: 0
        }));

        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  onSortChange(event: { active: string; direction: string }): void {
    this.currentSortColumn = event.active;
    this.currentSortDirection = event.direction === 'ASC' || event.direction === 'asc' ? 'ASC' : 'DESC';
    this.currentPage = 0;
    this.loadDepartments(this.currentPage, this.pageSize, this.currentSortColumn, this.currentSortDirection);
  }

  onPageChange(event: { pageIndex: number; pageSize: number }): void {
    const pageSizeChanged = this.pageSize !== event.pageSize;
    this.currentPage = pageSizeChanged ? 0 : event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadDepartments(this.currentPage, this.pageSize, this.currentSortColumn, this.currentSortDirection);
  }

  openDeleteDialog(department: Department): void {
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

    dialogRef.afterClosed()
      .pipe(take(1))
      .subscribe(result => {
        if (result && department.id) {
          this.departmentService.deleteDepartment(department.id).subscribe({
            next: () => {
              this.loadDepartments(this.currentPage, this.pageSize, this.currentSortColumn, this.currentSortDirection);
            },
            error: (error: unknown) => {
              console.error('Error deleting department:', error);
              alert('Failed to delete department. Please try again.');
            }
          });
        }
      });
  }

  onEditAction = (row: TableCellData): void => {
    const department = row as unknown as Department;
    this.openEditDialog(department);
  };

  onDeleteAction = (row: TableCellData): void => {
    const department = row as unknown as Department;
    this.openDeleteDialog(department);
  };

  onApplyFilter(filterEvent: FilterEvent): void {
    const existingFilterIndex = this.activeFilters.findIndex(f => f.field === filterEvent.field);

    if (existingFilterIndex >= 0) {
      this.activeFilters[existingFilterIndex] = filterEvent;
    } else {
      this.activeFilters.push(filterEvent);
    }

    this.currentPage = 0;
    this.loadDepartments(0, this.pageSize, this.currentSortColumn, this.currentSortDirection);
  }

  onClearFilters(): void {
    this.activeFilters = [] as ActiveFilters[];
    this.currentPage = 0;
    this.loadDepartments(0, this.pageSize, this.currentSortColumn, this.currentSortDirection);
  }

  onRemoveFilter(event: RemoveFilterEvent): void {
    this.activeFilters = this.activeFilters
      .map(f => {
        if (f.field !== event.field) {
          return f;
        }

        if (event.value === undefined) {
          return null;
        }

        const remainingValues = f.values.filter(v => !this.isSameFilterValue(v, event.value));
        return remainingValues.length ? { ...f, values: remainingValues } : null;
      })
      .filter((f): f is ActiveFilters => Boolean(f));

    this.currentPage = 0;
    this.loadDepartments(0, this.pageSize, this.currentSortColumn, this.currentSortDirection);
  }

  private isSameFilterValue(a: unknown, b: unknown): boolean {
    if (a && b && typeof a === 'object' && typeof b === 'object' && 'id' in a && 'id' in b) {
      return (a as { id: unknown }).id === (b as { id: unknown }).id;
    }
    return a === b;
  }
}

import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SharedModule } from '../../../../shared/shared.module';
import { TableComponent } from '../../../../shared/components/table/table.component';
import { TableCellData, FormMode, ColumnType } from '../../../../shared/models/table';
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
import { ConfirmationDialogComponent } from '../../../../shared/components/confirmation-dialog/confirmation-dialog.component';

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
  filters: Record<string, FilterOption[]> = {}; // Store filters from paginated response
  activeFilters: { field: string; operator: string; values: string[] }[] = []; // Track applied filters
  selectedFilterField = ''; // Track selected filter field for UI
  selectedFilterOperator = 'equals'; // Track selected filter operator for UI
  selectedFilterValues: string[] = []; // Track selected filter values for UI
  loading = false; // Loading state for table spinner
  private isRefreshing = false; // Guard to prevent duplicate refresh calls
  private departmentAddedHandler?: () => void; // Store handler reference for cleanup

  // Custom handler for link clicks - uses config to determine navigation target
  onDepartmentNameClick = (row: TableCellData, colKey: string) => {
    // Find the column config for this column key
    const column = this.tableConfig.columns.find(col => col.key === colKey);
    
    if (column && column.type === ColumnType.LINK && column.navigationTarget && column.navigationIdKey) {
      // Get the ID from the row using the navigationIdKey
      const rowData = row as unknown as Record<string, unknown>;
      const navigationId = rowData[column.navigationIdKey] as string | undefined;
      
      if (navigationId) {
        // Navigate based on the navigationTarget from config
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
    // Enable action buttons for admins and HR managers
    this.tableConfig.displayActionButtons = this.canEditDepartment();
    
    // Load with default sort from config
    if (this.tableConfig.defaultSortColumn) {
      this.currentSortColumn = this.tableConfig.defaultSortColumn;
      this.currentSortDirection = this.tableConfig.defaultSortDirection === 'desc' ? 'DESC' : 'ASC';
    }
    this.loadDepartments(this.currentPage, this.pageSize, this.currentSortColumn, this.currentSortDirection);
    
    // Listen only for add operations from table component (edit/delete handled by afterClosed())
    // Store handler reference so we can remove it later
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


  ngOnDestroy(): void {
    // Clean up event listener to prevent memory leaks and duplicate calls
    if (this.departmentAddedHandler) {
      globalThis.window.removeEventListener('departmentAdded', this.departmentAddedHandler);
      this.departmentAddedHandler = undefined;
    }
  }

  loadDepartments(page = 0, size = 10, sortBy?: string, sortDir = 'ASC'): void {
    this.loading = true;
    // Pass activeFilters to the service
    this.departmentService.queryDepartments(page, size, sortBy, sortDir, this.activeFilters).subscribe({
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
          // Fill in required TableCellData fields
          startDate: '',
          endDate: '',
          status: '',
          projectManager: '',
          totalEmployees: 0
        }));
        this.loading = false;
      },
      error: () => {
        // Error handled by global error handler or service
        this.loading = false;
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

    dialogRef.afterClosed().pipe(take(1)).subscribe(result => {
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

  // Handler methods for table component
  onEditAction = (row: TableCellData): void => {
    const department = row as unknown as Department;
    this.openEditDialog(department);
  }

  onDeleteAction = (row: TableCellData): void => {
    const department = row as unknown as Department;
    this.openDeleteDialog(department);
  }

  // Filter-related methods
  applyFilter(): void {
    // Validate filter inputs
    if (!this.selectedFilterField || !this.selectedFilterOperator || this.selectedFilterValues.length === 0) {
      alert('Please select a filter field, operator, and at least one value');
      return;
    }

    // Map selected filter values (which are option labels) to their filter objects with id+label
    const filterObjects = this.mapValuesToFilterObjects(this.selectedFilterField, this.selectedFilterValues);
    const operator = this.selectedFilterValues.length > 1 ? 'in' : this.selectedFilterOperator;
    const properFieldPath = this.getProperFieldPath(this.selectedFilterField);
    
    // Check if filter for this field already exists and update it, otherwise add new
    const existingFilterIndex = this.activeFilters.findIndex(f => f.field === properFieldPath);
    const newFilter = {
      field: properFieldPath,
      operator: operator,
      values: filterObjects as any,  // Send objects with id and label for better logging
      displayField: this.selectedFilterField  // Store original field name for display
    };

    if (existingFilterIndex >= 0) {
      // Replace existing filter for same field
      this.activeFilters[existingFilterIndex] = newFilter;
    } else {
      // Add new filter
      this.activeFilters.push(newFilter);
    }

    // Reset to first page and reload
    this.currentPage = 0;
    this.loadDepartments(0, this.pageSize, this.currentSortColumn, this.currentSortDirection);

    console.log('Applied filters:', this.activeFilters);
  }

  clearFilters(): void {
    // Reset all filter states
    this.activeFilters = [];
    this.selectedFilterField = '';
    this.selectedFilterOperator = 'equals';
    this.selectedFilterValues = [];
    
    // Reset to first page and reload
    this.currentPage = 0;
    this.loadDepartments(0, this.pageSize, this.currentSortColumn, this.currentSortDirection);
    
    console.log('Filters cleared');
  }

  /**
   * Remove a specific filter by field name
   */
  removeFilter(fieldPath: string): void {
    this.activeFilters = this.activeFilters.filter(f => f.field !== fieldPath);
    
    // Reset to first page and reload
    this.currentPage = 0;
    this.loadDepartments(0, this.pageSize, this.currentSortColumn, this.currentSortDirection);
    
    console.log('Filter removed:', fieldPath);
  }

  /**
   * Get display labels for filter values
   * Extracts labels from filter objects
   */
  getFilterLabels(filterValues: any[]): string[] {
    return filterValues.map(v => {
      if (typeof v === 'string') {
        return v;
      } else if (v && typeof v === 'object' && v.label) {
        return v.label;
      }
      return String(v);
    });
  }

  /**
   * Get color class for filter chip based on field type
   * Different colors for different filter types
   */
  getFilterChipColorClass(field: string): string {
    const colorMap: Record<string, string> = {
      'location.id': 'chip-color-location',
      'location': 'chip-color-location',
      'name': 'chip-color-name',
      'status': 'chip-color-status',
      'department': 'chip-color-department'
    };
    return colorMap[field] || 'chip-color-default';
  }

  getAvailableOperators(): string[] {
    // Return common operators - can be extended based on field type
    return ['equals', 'in', 'like', 'starts_with', 'ends_with', 'range', 'gt', 'lt', 'exists', 'not_equals', 'not_in', 'not_like'];
  }

  getAvailableFilterFields(): string[] {
    // Get available filter fields from the filters object keys
    return Object.keys(this.filters) || ['name', 'location', 'status'];
  }

  onFilterFieldChange(): void {
    // Clear selected values when field changes
    this.selectedFilterValues = [];
    console.log('Filter field changed to:', this.selectedFilterField);
  }

  toggleFilterValue(value: string): void {
    // Toggle value in selected filter values array
    const index = this.selectedFilterValues.indexOf(value);
    if (index > -1) {
      this.selectedFilterValues.splice(index, 1);
    } else {
      this.selectedFilterValues.push(value);
    }
    console.log('Selected filter values:', this.selectedFilterValues);
  }

  isFilterValueSelected(value: string): boolean {
    return this.selectedFilterValues.includes(value);
  }

  hasActiveFilters(): boolean {
    return this.activeFilters.length > 0;
  }

  /**
   * Map selected filter values (option labels) to their filter objects with id+label
   * Returns array of objects: { id: "uuid", label: "Name" } for better backend logging
   */
  private mapValuesToFilterObjects(fieldName: string, labels: string[]): Array<{ id: string; label: string }> {
    const filterOptions = this.filters[fieldName];
    if (!filterOptions) {
      console.warn(`No filter options found for field: ${fieldName}`);
      // Fallback: return objects with label as id
      return labels.map(label => ({ id: label, label: label }));
    }

    return labels.map(label => {
      const option = filterOptions.find(opt => opt.label === label || opt.value === label);
      return {
        id: option ? option.id : label,
        label: label
      };
    });
  }

  /**
   * Get the proper field path for backend filtering
   * Maps user-friendly field names to database field paths
   * e.g., 'locations' -> 'location.id'
   */
  private getProperFieldPath(fieldName: string): string {
    const fieldMapping: Record<string, string> = {
      'locations': 'location.id',
      'location': 'location.id',
      'location.id': 'location.id',
      'location.name': 'location.name',
      'name': 'name'
    };
    return fieldMapping[fieldName] || fieldName;
  }
}

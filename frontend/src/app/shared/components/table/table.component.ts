import { Component, Input, OnChanges, SimpleChanges, ViewChild, Output, EventEmitter, AfterViewInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { CommonModule } from '@angular/common';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSort, Sort, MatSortModule } from '@angular/material/sort';
import { Employee } from '../../models/employee.model';
import { Department } from '../../models/department.model';
import { ActionButtonObject, Column, FormMode, SortDirection, TableConfig, TableData } from '../../models/table';
import { defaultTableConfig } from './table.config';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { OverlayDialogComponent } from '../overlay-dialog/overlay-dialog.component';
import { SharedModule } from '../../shared.module';
import { NoDataComponent } from '../no-data/no-data.component';
import { Router } from '@angular/router';
import { filter, take, takeUntil, Subject, Subscription } from 'rxjs';
import { EmployeeService } from '../../../features/employees/services/employee.service';
import { DialogData } from '../../models/dialog';
import { DepartmentService } from '../../../features/departments/services/department.service';
import { LocationService } from '../../../features/locations/services/location.service';
import { Location } from '../../models/location.model';
import { FilterOption } from '../../models/paginated-response.model';

export type TableCellData = Employee | Department | Location | TableData;

@Component({
  selector: 'app-table',
  imports: [MatTableModule, MatSortModule, CommonModule, SharedModule, NoDataComponent],
  templateUrl: './table.component.html',
  styleUrl: './table.component.css'
})
export class TableComponent implements OnChanges, AfterViewInit {
  @Input() inputData: TableCellData[] = [];
  @Input() tableConfig: TableConfig = defaultTableConfig;
  @Input() linkClickHandler?: (row: TableCellData, colKey: string) => void;
  @Input() totalElements = 0; // Total number of elements from backend
  @Input() useBackendPagination = false; // Whether to use backend pagination
  @Input() currentPageIndex = 0; // Current page index from parent
  @Input() pageSize = 10; // Page size from parent (for backend pagination)
  @Input() filters?: Record<string, FilterOption[]>; // Optional: generic filters from paginated response (e.g., locations, departments, etc.)
  @Input() hasNext = false; // Whether there's a next page
  @Input() hasPrevious = false; // Whether there's a previous page
  
  @Output() sortChange = new EventEmitter<{ active: string; direction: string }>();
  @Output() pageChange = new EventEmitter<PageEvent>();

  displayedColumns: string[] = [];
  dataSource!: MatTableDataSource<TableCellData>;
  pageSizeOptions: number[] = [5, 10, 25, 50];
  dialogRef: MatDialogRef<OverlayDialogComponent> | undefined;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort, { static: false }) sort!: MatSort;

  private destroy$ = new Subject<void>();
  private paginatorSubscription?: Subscription;
  private sortSubscription?: Subscription;

  constructor(
    public matDialog: MatDialog,
    private router: Router,
    private departmentService: DepartmentService,
    private employeeService: EmployeeService,
    private locationService: LocationService,
    private cdr: ChangeDetectorRef) { }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['tableConfig']) {
      this.handleTableConfig(changes['tableConfig'].currentValue);
    }

    if (changes['inputData']) {
      this.handleTableDataChange(changes['inputData'].currentValue);
    }

    // Note: We rely on template bindings for paginator properties
    // MatPaginator will automatically calculate button states from [length], [pageIndex], and [pageSize]
    // All sorting and pagination is handled by backend
  }

  ngAfterViewInit(): void {
    // Trigger change detection to ensure ViewChild is initialized
    this.cdr.detectChanges();
    
    // Use setTimeout to ensure ViewChild is fully initialized after change detection
    setTimeout(() => {
      this.setupSortAndPagination();
      
      // Initialize default sorting from config if available (for visual indicators only)
      if (this.tableConfig.defaultSortColumn && this.sort) {
        const sortDirection = this.tableConfig.defaultSortDirection === SortDirection.DESC ? 'desc' : 'asc';
        this.sort.sort({ id: this.tableConfig.defaultSortColumn, start: sortDirection, disableClear: true });
      }
      
      // Disable clear state for all sort headers (only allow asc/desc toggle)
      if (this.sort) {
        this.sort.disableClear = true;
      }
    }, 0);
  }

  setupSortAndPagination(): void {
    // Note: We don't assign paginator/sort to dataSource - all pagination/sorting is handled by backend
    // MatPaginator and MatSort are only used for UI controls and event emission

    // Unsubscribe from previous subscriptions to prevent duplicates
    if (this.sortSubscription) {
      this.sortSubscription.unsubscribe();
    }
    if (this.paginatorSubscription) {
      this.paginatorSubscription.unsubscribe();
    }

    // Setup sort change listener for backend sorting
    if (this.sort) {
      this.sortSubscription = this.sort.sortChange.pipe(
        takeUntil(this.destroy$)
      ).subscribe((sort: Sort) => {
        // Ignore empty string or null sort.active (non-sortable columns)
        if (!sort.active || sort.active.trim() === '') {
          return;
        }
        
        // Emit sort event to parent for backend sorting
        const column = this.tableConfig.columns?.find(col => col.key === sort.active);
        if (column && column.sortable !== false) {
          this.sortChange.emit({
            active: sort.active,
            direction: sort.direction.toUpperCase()
          });
        }
      });
    }

    // Setup pagination change listener for backend pagination
    if (this.paginator && this.useBackendPagination) {
      this.paginatorSubscription = this.paginator.page.pipe(
        takeUntil(this.destroy$)
      ).subscribe((pageEvent: PageEvent) => {
        // Update pageSize in component when it changes
        if (pageEvent.pageSize !== this.pageSize) {
          this.pageSize = pageEvent.pageSize;
        }
        // Emit page change event to parent (includes both pageIndex and pageSize)
        this.pageChange.emit(pageEvent);
      });
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    
    if (this.paginatorSubscription) {
      this.paginatorSubscription.unsubscribe();
    }
    if (this.sortSubscription) {
      this.sortSubscription.unsubscribe();
    }
  }

  handleTableConfig(config: TableConfig): void {
    this.addActionColumn();
    this.displayedColumns = config.columns?.map((column: Column) => column.key) || [];
    // pageSize is controlled by @Input from parent (backend pagination)
    this.pageSizeOptions = config.pageSizeOptions ?? defaultTableConfig.pageSizeOptions ?? [];
  }

  addActionColumn() {
    if (this.tableConfig?.displayActionButtons && this.tableConfig?.columns) {
      if (!this.tableConfig.columns.some((col: Column) => col.type === 'actionButtons')) {
        this.tableConfig.columns = [...(this.tableConfig.columns ?? []), ActionButtonObject];
      }
    }
  }

  handleTableDataChange(tabData: TableCellData[]): void {
    const genTableData = tabData.map((data: TableCellData) => {
      if ('firstName' in data && 'lastName' in data) {
        // Employee
        return {
          ...data,
          name: data.firstName + ' ' + data.lastName,
        };
      } else if ('name' in data) {
        // Department
        return {
          ...data,
          name: data.name,
        };
      } else {
        // Fallback for other types
        return data;
      }
    });
    this.dataSource = new MatTableDataSource<TableCellData>(genTableData);
    
    // Trigger change detection and use setTimeout to ensure ViewChild is available after data change
    this.cdr.detectChanges();
    setTimeout(() => {
      this.setupSortAndPagination();
    }, 0);
  }

  isColSticky(column: Column): boolean {
    const stickyColumns = this.tableConfig.columns?.filter((col: Column) => col.isSticky);
    return stickyColumns?.includes(column) || false;
  }

  // this method might need maintenance
  getColClass(column: Column, index: number): string {
    // Check for right sticky column
    if (this.tableConfig.displayActionButtons && index === (this.tableConfig.columns?.length ?? 0) - 1) {
      return 'sticky-column-right';
    }
    // Check for left sticky columns
    if (column.isSticky) {
      const stickyIndex = this.tableConfig.columns?.filter((col) => col.isSticky).indexOf(column) ?? -1;
      return `sticky-column-left sticky-left-${stickyIndex}`;
    }
    return ''; // No sticky class for non-sticky columns
  }

  onLinkClick(column: TableCellData): void {
    this.dialogClose();
    this.dialogRef = this.matDialog.open(OverlayDialogComponent, {
      width: '850px',
      maxHeight: '90vh',
      data: {
        title: this.tableConfig.detailsCardTitle,
        content: column,
        viewController: this.tableConfig.viewController,
        config: this.tableConfig
      }
    });
    this.dialogRef.afterClosed().subscribe(result => {
      console.log('table component link afterClosed', result);
    });
    // we might implement a router navigation here
  }

  onActionClick(action: string, data: TableCellData): void {
    // TBE: Implement action handling
    console.log('action', action, data);
  }

  onAddClick(): void {
    this.dialogClose();
    this.tableConfig.mode = FormMode.ADD;
    // Determine current page from router
    const currentUrl = this.router.url;
    let returnToPage: string | undefined;
    if (currentUrl.includes('/locations')) {
      returnToPage = 'locations';
    } else if (currentUrl.includes('/departments')) {
      returnToPage = 'departments';
    } else if (currentUrl.includes('/projects')) {
      returnToPage = 'projects';
    }
    
    this.dialogRef = this.matDialog.open(OverlayDialogComponent, {
      width: '850px',
      maxHeight: '90vh',
      data: {
        title: this.tableConfig.additionCardTitle,
        content: {},
        viewController: this.tableConfig.additionController,
        config: this.tableConfig,
        returnToPage: returnToPage,
        filters: this.filters // Pass generic filters to form component (e.g., locations for department form)
      }
    });
    this.dialogRef.afterClosed().pipe(
      filter(result => !!result),
      take(1) // Ensure subscription only fires once per dialog instance
    ).subscribe((isClosedWithData: DialogData) => {
      // Dispatch events only for add operations (since table component opens add dialogs)
      // Edit/Delete operations are handled by list component's afterClosed() subscriptions
      if (isClosedWithData.content && 'id' in isClosedWithData.content) {
        if (this.tableConfig.additionCardTitle === 'Add Department' && isClosedWithData.returnToPage !== 'dashboard') {
          globalThis.window.dispatchEvent(new CustomEvent('departmentAdded'));
        } else if (this.tableConfig.additionCardTitle === 'Add Location' && isClosedWithData.returnToPage !== 'dashboard') {
          globalThis.window.dispatchEvent(new CustomEvent('locationAdded'));
        } else if (this.tableConfig.additionCardTitle === 'Add Employee' && isClosedWithData.returnToPage !== 'dashboard') {
          globalThis.window.dispatchEvent(new CustomEvent('employeeAdded'));
        } else if (this.tableConfig.additionCardTitle === 'Add Project' && isClosedWithData.returnToPage !== 'dashboard') {
          globalThis.window.dispatchEvent(new CustomEvent('projectAdded'));
        }
      }
    });
  }

  dialogClose(): void {
    if (this.dialogRef) {
      this.dialogRef.close();
    }
  }


  noData(): boolean {
    return !this.dataSource?.data?.length;
  }

  handleLinkClick(row: TableCellData, colKey: string, event?: Event): void {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    if (this.linkClickHandler) {
      this.linkClickHandler(row, colKey);
    } else {
      this.onLinkClick(row);
    }
  }
}

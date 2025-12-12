import { Component, Input, OnChanges, SimpleChanges, ViewChild, Output, EventEmitter, AfterViewInit } from '@angular/core';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { CommonModule } from '@angular/common';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSort, Sort } from '@angular/material/sort';
import { DepartmentID, Employee, EmployeeRequest, ManagerID } from '../../models/employee.model';
import { Department } from '../../models/department.model';
import { ActionButtonObject, Column, FormMode, TableConfig, TableData } from '../../models/table';
import { defaultTableConfig } from './table.config';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { OverlayDialogComponent } from '../overlay-dialog/overlay-dialog.component';
import { SharedModule } from '../../shared.module';
import { NoDataComponent } from '../no-data/no-data.component';
import { Router } from '@angular/router';
import { filter } from 'rxjs';
import { EmployeeService } from '../../../features/employees/services/employee.service';
import { DialogData } from '../../models/dialog';
import { DepartmentService } from '../../../features/departments/services/department.service';
import { LocationService } from '../../../features/locations/services/location.service';
import { Location } from '../../models/location.model';

export type TableCellData = Employee | Department | Location | TableData;

@Component({
  selector: 'app-table',
  imports: [MatTableModule, CommonModule, SharedModule, NoDataComponent],
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
  
  @Output() sortChange = new EventEmitter<{ active: string; direction: string }>();
  @Output() pageChange = new EventEmitter<PageEvent>();

  displayedColumns: string[] = [];
  dataSource!: MatTableDataSource<TableCellData>;
  pageSize = 10;
  pageSizeOptions: number[] = [5, 10, 25, 50];
  dialogRef: MatDialogRef<OverlayDialogComponent> | undefined;
  useFrontendSorting = false; // Whether to use frontend sorting

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    public matDialog: MatDialog,
    private router: Router,
    private departmentService: DepartmentService,
    private employeeService: EmployeeService,
    private locationService: LocationService) { }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['tableConfig']) {
      this.handleTableConfig(changes['tableConfig'].currentValue);
    }

    if (changes['inputData']) {
      this.handleTableDataChange(changes['inputData'].currentValue);
    }

    if (changes['totalElements'] || changes['pageSize']) {
      this.updateSortingMode();
    }

    // currentPageIndex is handled via @Input binding
  }

  ngAfterViewInit(): void {
    this.setupSortAndPagination();
  }

  updateSortingMode(): void {
    // Use frontend sorting if totalElements <= pageSize (all data fits in one page)
    // Otherwise use backend sorting
    this.useFrontendSorting = this.totalElements <= this.pageSize;
    
    if (this.dataSource && this.sort) {
      if (this.useFrontendSorting) {
        // Enable frontend sorting
        this.dataSource.sort = this.sort;
      } else {
        // Disable frontend sorting - backend will handle it
        this.dataSource.sort = null;
        // Clear any active sort state
        if (this.sort.active) {
          this.sort.sort({ id: '', start: 'asc', disableClear: false });
        }
      }
    }
  }

  setupSortAndPagination(): void {
    if (this.dataSource && this.paginator) {
      this.dataSource.paginator = this.paginator;
    }

    if (this.sort) {
      // Subscribe to sort changes for backend sorting
      this.sort.sortChange.subscribe((sort: Sort) => {
        if (!this.useFrontendSorting) {
          // Emit sort event to parent for backend sorting
          this.sortChange.emit({
            active: sort.active,
            direction: sort.direction.toUpperCase()
          });
        }
      });
    }

    if (this.paginator && this.useBackendPagination) {
      // Subscribe to pagination changes for backend pagination
      this.paginator.page.subscribe((pageEvent: PageEvent) => {
        this.pageChange.emit(pageEvent);
      });
    }
  }

  handleTableConfig(config: TableConfig): void {
    this.addActionColumn();
    this.displayedColumns = config.columns?.map((column: Column) => column.key) || [];
    this.pageSize = config.pageSize || 10;
    this.pageSizeOptions = config.pageSizeOptions ?? defaultTableConfig.pageSizeOptions ?? [];
    console.log('page size', this.pageSize, this.pageSizeOptions);
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
    this.updateSortingMode();
    this.setupSortAndPagination();
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
    const returnToPage = currentUrl.includes('/locations') ? 'locations' : undefined;
    
    this.dialogRef = this.matDialog.open(OverlayDialogComponent, {
      width: '850px',
      data: {
        title: this.tableConfig.additionCardTitle,
        content: {},
        viewController: this.tableConfig.additionController,
        config: this.tableConfig,
        returnToPage: returnToPage
      }
    });
    this.dialogRef.afterClosed().pipe(filter(result => !!result)).subscribe((isClosedWithData: DialogData) => {
      console.log('isClosedWithData', isClosedWithData);

      if (this.tableConfig.additionCardTitle === 'Add Department') {
        this.departmentService.addDepartment(isClosedWithData.content as Department).subscribe((response: Department) => {
          console.log('Department added:', response);
        });
      }
      else if (this.tableConfig.additionCardTitle === 'Add Location') {
        // Location form component already handles the POST call
        // Just check if it was successful and refresh if needed
        if (isClosedWithData.content && 'id' in isClosedWithData.content) {
          console.log('Location added:', isClosedWithData.content);
          // If opened from locations page, trigger a custom event to refresh the table
          // If opened from dashboard, stay on dashboard (handled by dashboard component)
          if (isClosedWithData.returnToPage !== 'dashboard') {
            // Dispatch a custom event to refresh the location list
            window.dispatchEvent(new CustomEvent('locationAdded'));
          }
        }
      }
      else {
        const employeeReq = this.prepareEmployeeRequestData(isClosedWithData);
        this.employeeService.addEmployee(employeeReq).subscribe((response: Employee) => {
          console.log('Employee added:', response);
        });
      }

    });
  }

  dialogClose(): void {
    if (this.dialogRef) {
      this.dialogRef.close();
    }
  }

  prepareEmployeeRequestData(isClosedWithData: DialogData): EmployeeRequest {
    const reqData = { ...isClosedWithData.content };
    // Type guard: only proceed if reqData has employee-specific fields
    if ('phone' in reqData && 'firstName' in reqData && 'lastName' in reqData && 'departmentId' in reqData && 'managerId' in reqData) {
      // Use type assertions to satisfy DepartmentID and ManagerID recursive types
      const departmentID = { id: reqData.departmentId } as unknown as DepartmentID;
      const managerID = reqData.managerId ? ({ id: reqData.managerId } as unknown as ManagerID) : null;
      return {
        name: reqData.firstName + ' ' + reqData.lastName,
        address: reqData.address,
        email: reqData.email,
        designation: reqData.designation,
        salary: reqData.salary,
        department: departmentID,
        manager: managerID,
        phone: reqData.phone
      };
    }
    throw new Error('Invalid employee data');
  }

  noData(): boolean {
    return !this.dataSource?.data?.length;
  }

  handleLinkClick(row: TableCellData, colKey: string): void {
    if (this.linkClickHandler) {
      this.linkClickHandler(row, colKey);
    } else {
      this.onLinkClick(row);
    }
  }
}

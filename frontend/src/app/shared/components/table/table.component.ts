import { Component, Input, OnChanges, SimpleChanges, ViewChild } from '@angular/core';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { CommonModule } from '@angular/common';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
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

export type TableCellData = Employee | Department | TableData;

@Component({
  selector: 'app-table',
  imports: [MatTableModule, CommonModule, SharedModule, NoDataComponent],
  templateUrl: './table.component.html',
  styleUrl: './table.component.css'
})
export class TableComponent implements OnChanges {
  @Input() inputData: TableCellData[] = [];
  @Input() tableConfig: TableConfig = defaultTableConfig;
  @Input() linkClickHandler?: (row: TableCellData, colKey: string) => void;

  displayedColumns: string[] = [];
  dataSource!: MatTableDataSource<TableCellData>;
  pageSize = 10;
  pageSizeOptions: number[] = [5, 10, 25, 50];
  dialogRef: MatDialogRef<OverlayDialogComponent> | undefined;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    public matDialog: MatDialog,
    private router: Router,
    private departmentService: DepartmentService,
    private employeeService: EmployeeService) { }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['tableConfig']) {
      this.handleTableConfig(changes['tableConfig'].currentValue);
    }

    if (changes['inputData']) {
      this.handleTableDataChange(changes['inputData'].currentValue);
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
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
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
    this.dialogRef = this.matDialog.open(OverlayDialogComponent, {
      width: '850px',
      data: {
        title: this.tableConfig.additionCardTitle,
        content: {},
        viewController: this.tableConfig.additionController,
        config: this.tableConfig
      }
    });
    this.dialogRef.afterClosed().pipe(filter(result => !!result)).subscribe((isClosedWithData: DialogData) => {
      console.log('isClosedWithData', isClosedWithData);

      if (this.tableConfig.additionCardTitle === 'Add Department') {
        this.departmentService.addDepartment(isClosedWithData.content as Department).subscribe((response: Department) => {
          console.log('Department added:', response);
        });
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

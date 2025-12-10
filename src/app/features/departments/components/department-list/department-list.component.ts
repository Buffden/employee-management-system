import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../../../../shared/shared.module';
import { TableComponent } from '../../../../shared/components/table/table.component';
import { TableCellData } from '../../../../shared/models/table';
import { DepartmentService } from '../../services/department.service';
import { departmentListConfig } from './department-list.config';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Department } from '../../../../shared/models/department.model';

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

  // Custom handler for department name click
  onDepartmentNameClick = (row: TableCellData, colKey: string) => {
    if (colKey === 'name') {
      this.router.navigate(['/departments', row.id]);
    }
  };

  constructor(
    private departmentService: DepartmentService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadDepartments();
  }

  loadDepartments(): void {
    this.departmentService.getDepartments().subscribe((departments: Department[]) => {
      this.departments = departments;
      this.tableData = this.departments.map(dept => ({
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
    });
  }
}

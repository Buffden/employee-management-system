import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Employee } from '../../../../shared/models/employee.model';
import { EmployeeService } from '../../services/employee.service';
import { SharedModule } from '../../../../shared/shared.module';
import { TableComponent } from '../../../../shared/components/table/table.component';
import { employeeListConfig } from './employee-list.config';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { TableCellData } from '../../../../shared/models/table';

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

  // Custom handler for employee name click
  onEmployeeNameClick = (row: TableCellData, colKey: string) => {
    if (colKey === 'firstName' || colKey === 'lastName') {
      this.router.navigate(['/employees', row.id]);
    }
  };

  constructor(
    private employeeService: EmployeeService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadEmployees();
  }

  loadEmployees(): void {
    this.employeeService.getEmployees().subscribe((employees: Employee[]) => {
      this.employees = employees;
      this.tableData = this.employees.map(emp => ({
        ...emp,
        name: emp.firstName + ' ' + emp.lastName,
        email: emp.email || '',
        phone: emp.phone || '',
        address: emp.address || '',
        designation: emp.designation || '',
        salary: emp.salary || 0,
        joiningDate: emp.joiningDate || '',
        locationId: emp.locationId || '',
        performanceRating: emp.performanceRating || 0,
        managerId: emp.managerId || '',
        departmentId: emp.departmentId || '',
        workLocation: emp.workLocation || '',
        experienceYears: emp.experienceYears || 0
      }));
    });
  }
}

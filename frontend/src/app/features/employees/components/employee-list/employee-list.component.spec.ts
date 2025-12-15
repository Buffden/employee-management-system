import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { MatDialog } from '@angular/material/dialog';
import { of } from 'rxjs';

import { EmployeeListComponent } from './employee-list.component';
import { EmployeeService } from '../../services/employee.service';
import { AuthService } from '../../../../core/services/auth.service';
import { PaginatedResponse } from '../../../../shared/models/paginated-response.model';
import { Employee } from '../../../../shared/models/employee.model';

describe('EmployeeListComponent', () => {
  let component: EmployeeListComponent;
  let fixture: ComponentFixture<EmployeeListComponent>;
  let employeeService: jasmine.SpyObj<EmployeeService>;
  let authService: jasmine.SpyObj<AuthService>;
  let matDialog: jasmine.SpyObj<MatDialog>;

  const mockEmployees: Employee[] = [
    {
      id: '1',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com'
    } as Employee
  ];

  const mockPaginatedResponse: PaginatedResponse<Employee> = {
    content: mockEmployees,
    totalElements: 1,
    totalPages: 1,
    page: 0,
    size: 10,
    first: true,
    last: true,
    hasNext: false,
    hasPrevious: false
  };

  beforeEach(async () => {
    const employeeServiceSpy = jasmine.createSpyObj('EmployeeService', ['queryEmployees']);
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['isAdmin', 'isHRManager']);
    const matDialogSpy = jasmine.createSpyObj('MatDialog', ['open']);

    await TestBed.configureTestingModule({
      imports: [EmployeeListComponent, HttpClientTestingModule, RouterTestingModule],
      providers: [
        { provide: EmployeeService, useValue: employeeServiceSpy },
        { provide: AuthService, useValue: authServiceSpy },
        { provide: MatDialog, useValue: matDialogSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(EmployeeListComponent);
    component = fixture.componentInstance;
    employeeService = TestBed.inject(EmployeeService) as jasmine.SpyObj<EmployeeService>;
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    matDialog = TestBed.inject(MatDialog) as jasmine.SpyObj<MatDialog>;

    employeeService.queryEmployees.and.returnValue(of(mockPaginatedResponse));
    authService.isAdmin.and.returnValue(true);
    authService.isHRManager.and.returnValue(false);

    // Mock dialog ref
    const mockDialogRef = {
      afterClosed: () => of(null),
      close: jasmine.createSpy('close')
    };
    matDialog.open.and.returnValue(mockDialogRef as any);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default sort from config', () => {
    fixture.detectChanges();

    expect(component.currentSortColumn).toBe('firstName');
    expect(component.currentSortDirection).toBe('ASC');
    expect(employeeService.queryEmployees).toHaveBeenCalledWith(
      0,
      10,
      'firstName',
      'ASC'
    );
  });

  it('should load employees on init', () => {
    fixture.detectChanges();

    expect(employeeService.queryEmployees).toHaveBeenCalled();
    expect(component.employees.length).toBe(1);
    expect(component.totalElements).toBe(1);
  });

  it('should handle sort change and reset to page 0', () => {
    fixture.detectChanges();
    component.currentPage = 2; // Simulate being on page 2
    employeeService.queryEmployees.calls.reset();
    employeeService.queryEmployees.and.returnValue(of(mockPaginatedResponse));

    component.onSortChange({ active: 'firstName', direction: 'DESC' });

    expect(component.currentSortColumn).toBe('firstName');
    expect(component.currentSortDirection).toBe('DESC');
    expect(component.currentPage).toBe(0); // Should reset to page 0
    expect(employeeService.queryEmployees).toHaveBeenCalledWith(
      0,
      10,
      'firstName',
      'DESC'
    );
  });

  it('should normalize sort direction to uppercase', () => {
    fixture.detectChanges();
    employeeService.queryEmployees.calls.reset();
    employeeService.queryEmployees.and.returnValue(of(mockPaginatedResponse));

    component.onSortChange({ active: 'firstName', direction: 'asc' }); // lowercase

    expect(component.currentSortDirection).toBe('ASC');
    expect(employeeService.queryEmployees).toHaveBeenCalledWith(
      0,
      10,
      'firstName',
      'ASC'
    );
  });

  it('should handle page change and preserve sort state', () => {
    fixture.detectChanges();
    component.currentSortColumn = 'firstName';
    component.currentSortDirection = 'DESC';
    employeeService.queryEmployees.calls.reset();
    employeeService.queryEmployees.and.returnValue(of(mockPaginatedResponse));

    component.onPageChange({ pageIndex: 1, pageSize: 20 } as any);

    expect(component.currentPage).toBe(1);
    expect(component.pageSize).toBe(20);
    expect(employeeService.queryEmployees).toHaveBeenCalledWith(
      1,
      20,
      'firstName',
      'DESC' // Should preserve sort state
    );
  });

  it('should reset to page 0 when page size changes', () => {
    fixture.detectChanges();
    component.currentPage = 2;
    component.pageSize = 10;
    component.currentSortColumn = 'firstName';
    component.currentSortDirection = 'ASC';
    employeeService.queryEmployees.calls.reset();
    employeeService.queryEmployees.and.returnValue(of(mockPaginatedResponse));

    component.onPageChange({ pageIndex: 2, pageSize: 25 } as any); // pageSize changed

    expect(component.currentPage).toBe(0); // Should reset to page 0
    expect(component.pageSize).toBe(25);
    expect(employeeService.queryEmployees).toHaveBeenCalledWith(
      0,
      25,
      'firstName',
      'ASC' // Should preserve sort state
    );
  });

  it('should cleanup event listener on destroy', () => {
    fixture.detectChanges();
    
    const removeEventListenerSpy = spyOn(globalThis.window, 'removeEventListener');

    component.ngOnDestroy();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('employeeAdded', jasmine.any(Function));
  });
});

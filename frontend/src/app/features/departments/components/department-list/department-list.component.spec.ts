import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { MatDialog } from '@angular/material/dialog';
import { of } from 'rxjs';

import { DepartmentListComponent } from './department-list.component';
import { DepartmentService } from '../../services/department.service';
import { PaginatedResponse } from '../../../../shared/models/paginated-response.model';
import { Department } from '../../../../shared/models/department.model';

describe('DepartmentListComponent', () => {
  let component: DepartmentListComponent;
  let fixture: ComponentFixture<DepartmentListComponent>;
  let departmentService: jasmine.SpyObj<DepartmentService>;
  let matDialog: jasmine.SpyObj<MatDialog>;

  const mockDepartments: Department[] = [
    {
      id: '1',
      name: 'Department 1',
      description: 'Description 1',
      locationId: 'loc1'
    } as Department
  ];

  const mockPaginatedResponse: PaginatedResponse<Department> = {
    content: mockDepartments,
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
    const departmentServiceSpy = jasmine.createSpyObj('DepartmentService', ['queryDepartments']);
    const matDialogSpy = jasmine.createSpyObj('MatDialog', ['open']);

    await TestBed.configureTestingModule({
      imports: [DepartmentListComponent, HttpClientTestingModule, RouterTestingModule],
      providers: [
        { provide: DepartmentService, useValue: departmentServiceSpy },
        { provide: MatDialog, useValue: matDialogSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DepartmentListComponent);
    component = fixture.componentInstance;
    departmentService = TestBed.inject(DepartmentService) as jasmine.SpyObj<DepartmentService>;
    matDialog = TestBed.inject(MatDialog) as jasmine.SpyObj<MatDialog>;

    departmentService.queryDepartments.and.returnValue(of(mockPaginatedResponse));

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

    expect(component.currentSortColumn).toBe('name');
    expect(component.currentSortDirection).toBe('ASC');
    expect(departmentService.queryDepartments).toHaveBeenCalledWith(
      0,
      10,
      'name',
      'ASC'
    );
  });

  it('should load departments on init', () => {
    fixture.detectChanges();

    expect(departmentService.queryDepartments).toHaveBeenCalled();
    expect(component.departments.length).toBe(1);
    expect(component.totalElements).toBe(1);
  });

  it('should handle sort change and reset to page 0', () => {
    fixture.detectChanges();
    component.currentPage = 2; // Simulate being on page 2
    departmentService.queryDepartments.calls.reset();
    departmentService.queryDepartments.and.returnValue(of(mockPaginatedResponse));

    component.onSortChange({ active: 'name', direction: 'DESC' });

    expect(component.currentSortColumn).toBe('name');
    expect(component.currentSortDirection).toBe('DESC');
    expect(component.currentPage).toBe(0); // Should reset to page 0
    expect(departmentService.queryDepartments).toHaveBeenCalledWith(
      0,
      10,
      'name',
      'DESC'
    );
  });

  it('should normalize sort direction to uppercase', () => {
    fixture.detectChanges();
    departmentService.queryDepartments.calls.reset();
    departmentService.queryDepartments.and.returnValue(of(mockPaginatedResponse));

    component.onSortChange({ active: 'name', direction: 'asc' }); // lowercase

    expect(component.currentSortDirection).toBe('ASC');
    expect(departmentService.queryDepartments).toHaveBeenCalledWith(
      0,
      10,
      'name',
      'ASC'
    );
  });

  it('should handle page change and preserve sort state', () => {
    fixture.detectChanges();
    component.currentSortColumn = 'name';
    component.currentSortDirection = 'DESC';
    departmentService.queryDepartments.calls.reset();
    departmentService.queryDepartments.and.returnValue(of(mockPaginatedResponse));

    component.onPageChange({ pageIndex: 1, pageSize: 20 });

    expect(component.currentPage).toBe(1);
    expect(component.pageSize).toBe(20);
    expect(departmentService.queryDepartments).toHaveBeenCalledWith(
      1,
      20,
      'name',
      'DESC' // Should preserve sort state
    );
  });

  it('should reset to page 0 when page size changes', () => {
    fixture.detectChanges();
    component.currentPage = 2;
    component.pageSize = 10;
    component.currentSortColumn = 'name';
    component.currentSortDirection = 'ASC';
    departmentService.queryDepartments.calls.reset();
    departmentService.queryDepartments.and.returnValue(of(mockPaginatedResponse));

    component.onPageChange({ pageIndex: 2, pageSize: 25 }); // pageSize changed

    expect(component.currentPage).toBe(0); // Should reset to page 0
    expect(component.pageSize).toBe(25);
    expect(departmentService.queryDepartments).toHaveBeenCalledWith(
      0,
      25,
      'name',
      'ASC' // Should preserve sort state
    );
  });

  it('should cleanup event listener on destroy', () => {
    fixture.detectChanges();
    
    const removeEventListenerSpy = spyOn(globalThis.window, 'removeEventListener');

    component.ngOnDestroy();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('departmentAdded', jasmine.any(Function));
  });
});

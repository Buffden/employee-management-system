import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { MatDialog } from '@angular/material/dialog';
import { of } from 'rxjs';

import { ProjectListComponent } from './project-list.component';
import { ProjectService } from '../../services/project.service';
import { AuthService } from '../../../../core/services/auth.service';
import { ProjectSelectionService } from '../../services/project-selection.service';
import { PaginatedResponse } from '../../../../shared/models/paginated-response.model';
import { Project } from '../../../../shared/models/project.model';

describe('ProjectListComponent', () => {
  let component: ProjectListComponent;
  let fixture: ComponentFixture<ProjectListComponent>;
  let projectService: jasmine.SpyObj<ProjectService>;
  let authService: jasmine.SpyObj<AuthService>;
  let matDialog: jasmine.SpyObj<MatDialog>;

  const mockProjects: Project[] = [
    {
      id: '1',
      name: 'Project 1',
      description: 'Description 1',
      startDate: '2024-01-01',
      endDate: '2024-12-31',
      status: 'Active',
      budget: 100000,
      departmentId: 'dept1',
      projectManagerId: 'emp1'
    } as Project
  ];

  const mockPaginatedResponse: PaginatedResponse<Project> = {
    content: mockProjects,
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
    const projectServiceSpy = jasmine.createSpyObj('ProjectService', ['queryProjects']);
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['isAdmin', 'isDepartmentManager']);
    const matDialogSpy = jasmine.createSpyObj('MatDialog', ['open']);

    await TestBed.configureTestingModule({
      imports: [ProjectListComponent, HttpClientTestingModule, RouterTestingModule],
      providers: [
        { provide: ProjectService, useValue: projectServiceSpy },
        { provide: AuthService, useValue: authServiceSpy },
        { provide: MatDialog, useValue: matDialogSpy },
        { provide: ProjectSelectionService, useValue: {} }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ProjectListComponent);
    component = fixture.componentInstance;
    projectService = TestBed.inject(ProjectService) as jasmine.SpyObj<ProjectService>;
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    matDialog = TestBed.inject(MatDialog) as jasmine.SpyObj<MatDialog>;

    projectService.queryProjects.and.returnValue(of(mockPaginatedResponse));
    authService.isAdmin.and.returnValue(true);
    authService.isDepartmentManager.and.returnValue(false);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load projects on init', () => {
    fixture.detectChanges();

    expect(projectService.queryProjects).toHaveBeenCalled();
    expect(component.projects.length).toBe(1);
    expect(component.totalElements).toBe(1);
  });

  it('should initialize with default sort from config', () => {
    fixture.detectChanges();

    expect(component.currentSortColumn).toBe('name');
    expect(component.currentSortDirection).toBe('ASC');
    expect(projectService.queryProjects).toHaveBeenCalledWith(
      0,
      10,
      'name',
      'ASC'
    );
  });

  it('should handle sort change and reset to page 0', () => {
    fixture.detectChanges();
    component.currentPage = 2; // Simulate being on page 2
    projectService.queryProjects.calls.reset();
    projectService.queryProjects.and.returnValue(of(mockPaginatedResponse));

    component.onSortChange({ active: 'name', direction: 'DESC' });

    expect(component.currentSortColumn).toBe('name');
    expect(component.currentSortDirection).toBe('DESC');
    expect(component.currentPage).toBe(0); // Should reset to page 0
    expect(projectService.queryProjects).toHaveBeenCalledWith(
      0,
      10,
      'name',
      'DESC'
    );
  });

  it('should normalize sort direction to uppercase', () => {
    fixture.detectChanges();
    projectService.queryProjects.calls.reset();
    projectService.queryProjects.and.returnValue(of(mockPaginatedResponse));

    component.onSortChange({ active: 'name', direction: 'asc' }); // lowercase

    expect(component.currentSortDirection).toBe('ASC');
    expect(projectService.queryProjects).toHaveBeenCalledWith(
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
    projectService.queryProjects.calls.reset();
    projectService.queryProjects.and.returnValue(of(mockPaginatedResponse));

    component.onPageChange({ pageIndex: 1, pageSize: 20 });

    expect(component.currentPage).toBe(1);
    expect(component.pageSize).toBe(20);
    expect(projectService.queryProjects).toHaveBeenCalledWith(
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
    projectService.queryProjects.calls.reset();
    projectService.queryProjects.and.returnValue(of(mockPaginatedResponse));

    component.onPageChange({ pageIndex: 2, pageSize: 25 }); // pageSize changed

    expect(component.currentPage).toBe(0); // Should reset to page 0
    expect(component.pageSize).toBe(25);
    expect(projectService.queryProjects).toHaveBeenCalledWith(
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

    expect(removeEventListenerSpy).toHaveBeenCalledWith('projectAdded', jasmine.any(Function));
  });
});
